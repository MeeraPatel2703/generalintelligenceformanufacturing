/**
 * Maps extracted system specifications to DES models
 */

import { DESEngine, EventType, SimEvent, Entity, ObservationStatistic } from './DESEngine.js'
import type { ExtractedSystem, Entity as EntityDef, Process as ProcessDef } from '../../src/types/extraction.js'

/**
 * Generic DES Model created from extracted system
 */
export class GenericDESModel extends DESEngine {
  private system: ExtractedSystem
  private entityId = 0

  constructor(system: ExtractedSystem, seed?: number) {
    super(seed)
    this.system = system
    this.initializeFromSystem()
  }

  private initializeFromSystem(): void {
    console.log('[GenericDESModel] Initializing from extracted system...')
    console.log('[GenericDESModel] System:', this.system.systemName)
    console.log('[GenericDESModel] Resources:', this.system.resources?.length)

    // Create resources
    for (const resource of this.system.resources || []) {
      console.log(`[GenericDESModel] Creating resource: ${resource.name} (capacity: ${resource.capacity})`)
      this.addResource(resource.name, resource.capacity)
    }
  }

  /**
   * Schedule entity arrivals based on extracted arrival patterns
   */
  scheduleArrivals(simulationTime: number): void {
    for (const entityType of this.system.entities || []) {
      console.log(`[GenericDESModel] Scheduling arrivals for: ${entityType.name}`)

      const pattern = entityType.arrivalPattern

      switch (pattern.type) {
        case 'poisson':
        case 'scheduled':
          this.schedulePoissonArrivals(entityType, simulationTime, pattern.rate || 1, pattern.rateUnit || 'per_hour')
          break

        case 'deterministic':
          if (pattern.rate) {
            this.scheduleDeterministicArrivals(entityType, simulationTime, pattern.rate, pattern.rateUnit || 'per_hour')
          }
          break

        case 'batch':
          // Handle batch arrivals
          console.log('[GenericDESModel] Batch arrivals not yet implemented')
          break

        default:
          console.warn(`[GenericDESModel] Unknown arrival pattern: ${pattern.type}`)
      }
    }
  }

  private schedulePoissonArrivals(
    entityType: EntityDef,
    simulationTime: number,
    rate: number,
    rateUnit: string
  ): void {
    // Convert rate to arrivals per minute
    let ratePerMinute = rate
    if (rateUnit === 'hour') {
      ratePerMinute = rate / 60
    } else if (rateUnit === 'day') {
      ratePerMinute = rate / (24 * 60)
    }

    const meanInterarrival = 1 / ratePerMinute
    let t = 0

    while (t < simulationTime) {
      const interarrival = this.dist.exponential(meanInterarrival)
      t += interarrival

      if (t < simulationTime) {
        this.scheduleEvent(t, EventType.ARRIVAL, undefined, undefined, {
          entityTypeName: entityType.name,
          entityType: entityType
        })
      }
    }

    console.log(`[GenericDESModel] Scheduled Poisson arrivals for ${entityType.name}: rate=${rate}/${rateUnit}`)
  }

  private scheduleDeterministicArrivals(
    entityType: EntityDef,
    simulationTime: number,
    rate: number,
    rateUnit: string
  ): void {
    // Convert rate to arrivals per minute
    let ratePerMinute = rate
    if (rateUnit === 'hour') {
      ratePerMinute = rate / 60
    }

    const interarrival = 1 / ratePerMinute
    let t = 0

    while (t < simulationTime) {
      t += interarrival

      if (t < simulationTime) {
        this.scheduleEvent(t, EventType.ARRIVAL, undefined, undefined, {
          entityTypeName: entityType.name,
          entityType: entityType
        })
      }
    }

    console.log(`[GenericDESModel] Scheduled deterministic arrivals for ${entityType.name}`)
  }

  protected override processEvent(event: SimEvent): void {
    switch (event.type) {
      case EventType.ARRIVAL:
        this.handleArrival(event)
        break

      case EventType.END_SERVICE:
        this.handleEndService(event)
        break

      default:
        console.log(`[${this.clock.toFixed(2)}] Unhandled event: ${event.type}`)
    }
  }

  private handleArrival(event: SimEvent): void {
    const entityType = event.data.entityType as EntityDef
    const entity = this.createEntity(entityType.name)

    entity.setAttribute('arrivalTime', this.clock)
    entity.setAttribute('entityType', entityType)

    console.log(`[${this.clock.toFixed(2)}] ${entityType.name} ${entity.id} arrived`)

    // Find the first process for this entity
    const process = this.findFirstProcess(entityType)

    if (process) {
      this.startProcess(entity, process)
    } else {
      console.warn(`[${this.clock.toFixed(2)}] No process found for ${entityType.name}`)
    }
  }

  private findFirstProcess(entityType: EntityDef): ProcessDef | undefined {
    // Find processes that involve this entity type
    return this.system.processes?.find((p: ProcessDef) =>
      p.entityType === entityType.name ||
      p.description?.toLowerCase().includes(entityType.name.toLowerCase())
    )
  }

  private startProcess(entity: Entity, process: ProcessDef): void {
    console.log(`[${this.clock.toFixed(2)}] Starting process: ${process.name} for entity ${entity.id}`)

    // Find resource needed from process steps
    const firstStep = process.sequence?.[0]
    const resourceName = firstStep?.resourceName

    if (!resourceName) {
      console.warn(`[${this.clock.toFixed(2)}] Process ${process.name} has no resource in first step`)
      return
    }

    const resource = this.getResource(resourceName)

    if (!resource) {
      console.warn(`[${this.clock.toFixed(2)}] Resource ${resourceName} not found`)
      return
    }

    // Try to seize resource
    if (resource.isAvailable()) {
      resource.seize(entity, this.clock)

      // Get processing time
      const processingTime = this.getProcessingTime(_process, resourceName)

      console.log(`[${this.clock.toFixed(2)}] Entity ${entity.id} seized ${resourceName}, processing for ${processingTime.toFixed(2)} min`)

      this.scheduleEvent(processingTime, EventType.END_SERVICE, entity, resource, {
        process,
        resourceName
      })
    } else {
      console.log(`[${this.clock.toFixed(2)}] Entity ${entity.id} queued for ${resourceName}`)
      resource.addToQueue(entity, this.clock)
    }
  }

  private getProcessingTime(process: ProcessDef, resourceName: string): number {
    // Find the resource definition
    const resourceDef = this.system.resources?.find(r => r.name === resourceName)

    if (!resourceDef || !resourceDef.processingTime) {
      console.warn(`[GenericDESModel] No processing time found for ${resourceName}, using default 1 min`)
      return 1
    }

    const pt = resourceDef.processingTime
    const params = pt.parameters

    switch (pt.type) {
      case 'constant':
        return params.value || 1

      case 'uniform':
        return this.dist.uniform(params.min || 0, params.max || 1)

      case 'normal':
        return Math.max(0, this.dist.normal(params.mean || 1, params.stdDev || 0.1))

      case 'exponential':
        return this.dist.exponential(params.mean || 1)

      case 'triangular':
        return this.dist.triangular(params.min || 0, params.mode || 1, params.max || 2)

      default:
        console.warn(`[GenericDESModel] Unknown distribution: ${pt.type}`)
        return 1
    }
  }

  private handleEndService(event: SimEvent): void {
    const entity = event.entity!
    const resource = event.resource!

    resource.release(entity, this.clock)

    console.log(`[${this.clock.toFixed(2)}] Entity ${entity.id} released ${resource.name}`)

    // Check queue
    if (resource.getQueueLength() > 0) {
      const nextEntity = resource.removeFromQueue(this.clock)!
      const process = event.data.process

      this.startProcess(nextEntity, process)
    }

    // Record statistics
    const cycleTime = this.clock - entity.getAttribute('arrivalTime')
    this.recordObservation('cycleTime', cycleTime)
    this.recordObservation('throughput', 1)

    // Entity exits
    this.entities.delete(entity.id)
  }

  /**
   * Run the simulation
   */
  runSimulation(simulationTime: number, numReplications: number = 1): any {
    console.log(`[GenericDESModel] Running simulation for ${simulationTime} minutes`)
    console.log(`[GenericDESModel] Number of replications: ${numReplications}`)

    const allResults: any[] = []

    for (let rep = 0; rep < numReplications; rep++) {
      console.log(`\n[Replication ${rep + 1}/${numReplications}]`)

      // Reset
      this.reset()
      this.rng.setSeed(12345 + rep)

      // Schedule arrivals
      this.scheduleArrivals(simulationTime)

      // Run
      this.run(simulationTime)

      // Get results
      const results = this.getResults()
      allResults.push(results)

      console.log(`[Replication ${rep + 1}] Completed`)
      console.log(`  - Entities processed: ${results.observations.throughput?.count || 0}`)
      console.log(`  - Mean cycle time: ${results.observations.cycleTime?.mean?.toFixed(2) || 'N/A'} min`)
    }

    // Aggregate results
    return this.aggregateResults(allResults)
  }

  private aggregateResults(allResults: any[]): any {
    if (allResults.length === 0) {
      return {}
    }

    if (allResults.length === 1) {
      return allResults[0]
    }

    // Aggregate across replications
    const aggregated: any = {
      observations: {},
      resources: {},
      replications: allResults.length
    }

    // For each observation statistic, compute mean and CI across replications
    const obsNames = Object.keys(allResults[0].observations || {})

    for (const obsName of obsNames) {
      const values = allResults.map(r => r.observations[obsName]?.mean).filter(v => v !== undefined)

      if (values.length > 0) {
        const stat = new ObservationStatistic()
        values.forEach(v => stat.record(v))

        aggregated.observations[obsName] = {
          mean: stat.getMean(),
          stdDev: stat.getStdDev(),
          min: stat.getMin(),
          max: stat.getMax(),
          ci95: stat.getConfidenceInterval(0.95),
          replications: values.length
        }
      }
    }

    // For each resource, compute mean utilization across replications
    const resourceNames = Object.keys(allResults[0].resources || {})

    for (const resourceName of resourceNames) {
      const utilizations = allResults.map((r: any) => r.resources[resourceName]?.utilization).filter((v: any) => v !== undefined)

      if (utilizations.length > 0) {
        const stat = new ObservationStatistic()
        utilizations.forEach(v => stat.record(v))

        aggregated.resources[resourceName] = {
          utilization: stat.getMean(),
          utilizationStdDev: stat.getStdDev(),
          ci95: stat.getConfidenceInterval(0.95)
        }
      }
    }

    return aggregated
  }
}

/**
 * Run a DES simulation from an extracted system
 */
export function runDESFromExtractedSystem(
  system: ExtractedSystem,
  simulationTime: number = 480, // 8 hours in minutes
  numReplications: number = 100
): any {
  console.log('[SystemToDESMapper] Creating DES model from extracted system...')
  console.log(`[SystemToDESMapper] System: ${system.systemName}`)
  console.log(`[SystemToDESMapper] Simulation time: ${simulationTime} minutes`)
  console.log(`[SystemToDESMapper] Replications: ${numReplications}`)

  const model = new GenericDESModel(system)
  return model.runSimulation(simulationTime, numReplications)
}
