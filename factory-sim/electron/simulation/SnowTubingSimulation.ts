/**
 * Snow Tubing Facility Simulation
 *
 * Complete implementation of The Summit at Snoqualmie snow tubing facility
 */

import { DESEngine, EventType, SimEvent, Entity } from './DESEngine'

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface SessionConfig {
  arrivalStartTime: number  // minutes from start of day
  sessionStartTime: number
  sessionEndTime: number
  averageCustomers: number
}

export interface SnowTubingConfig {
  // Sessions
  sessions: SessionConfig[]

  // Group distributions
  groupSizeProbs: number[]  // [couples=15%, group3=20%, group4=35%, group5=20%, group6=10%]
  groupSizes: number[]      // [2, 3, 4, 5, 6]

  // Resources
  numTicketAgents: number
  numTubePickupLanes: number
  numSleddingLanes: number
  numTubes: number

  // Processing times (in minutes)
  ticketProcessingData: { mean: number; stdDev: number }  // From spreadsheet
  tubePickupMin: number  // 20/60
  tubePickupMode: number // 30/60
  tubePickupMax: number  // 45/60

  // Travel speeds (mph to feet/minute conversion)
  walkingSpeed: number       // From spreadsheet
  walkingUphillSpeed: number // From spreadsheet
  sleddingSpeedMin: number   // 15 mph
  sleddingSpeedMax: number   // 19 mph
  conveyorSpeed: number      // 1.5 mph

  // Distances (feet)
  arrivalToTicket: number    // 50
  ticketToTubePickup: number // 800
  tubePickupToHillTop: number // 400
  hillLength: number          // 500
  hillBottomToWalkup: number // 20
  hillBottomToConveyor: number // 30
  hillTopToTubeReturn: number // 500

  // Behavior
  conveyorChoiceThreshold: number // 10 (walk if > 10 in conveyor queue)
  walkupProbability: number       // 0.05 for basic model

  // Failures (advanced model)
  enableFailures: boolean
  ticketBoothFailureTimeBetween: { min: number; max: number } // hours
  ticketBoothFailureDowntime: { min: number; mode: number; max: number } // minutes

  // Model type
  advancedModel: boolean
}

// Default configuration (Basic Model)
export const DEFAULT_CONFIG: SnowTubingConfig = {
  sessions: [
    { arrivalStartTime: 8 * 60 + 45, sessionStartTime: 9 * 60, sessionEndTime: 10 * 60 + 45, averageCustomers: 175 },
    { arrivalStartTime: 10 * 60 + 45, sessionStartTime: 11 * 60, sessionEndTime: 12 * 60 + 45, averageCustomers: 200 },
    { arrivalStartTime: 12 * 60 + 45, sessionStartTime: 13 * 60, sessionEndTime: 14 * 60 + 45, averageCustomers: 200 },
    { arrivalStartTime: 14 * 60 + 45, sessionStartTime: 15 * 60, sessionEndTime: 16 * 60 + 45, averageCustomers: 185 }
  ],

  groupSizeProbs: [0.15, 0.20, 0.35, 0.20, 0.10],
  groupSizes: [2, 3, 4, 5, 6],

  numTicketAgents: 2,
  numTubePickupLanes: 5,
  numSleddingLanes: 10,
  numTubes: 250,

  ticketProcessingData: { mean: 0.5, stdDev: 0.1 }, // Placeholder - replace with spreadsheet data
  tubePickupMin: 20 / 60,
  tubePickupMode: 30 / 60,
  tubePickupMax: 45 / 60,

  walkingSpeed: 2.5, // mph -> feet/min = 2.5 * 5280 / 60 = 220 ft/min
  walkingUphillSpeed: 1.5, // mph
  sleddingSpeedMin: 15, // mph
  sleddingSpeedMax: 19, // mph
  conveyorSpeed: 1.5, // mph

  arrivalToTicket: 50,
  ticketToTubePickup: 800,
  tubePickupToHillTop: 400,
  hillLength: 500,
  hillBottomToWalkup: 20,
  hillBottomToConveyor: 30,
  hillTopToTubeReturn: 500,

  conveyorChoiceThreshold: 10,
  walkupProbability: 0.05,

  enableFailures: false,
  ticketBoothFailureTimeBetween: { min: 60, max: 120 },
  ticketBoothFailureDowntime: { min: 1, mode: 2, max: 2.5 },

  advancedModel: false
}

// ============================================================================
// SNOW TUBING SIMULATION
// ============================================================================

export class SnowTubingSimulation extends DESEngine {
  config: SnowTubingConfig
  currentDay: number = 0
  tubesInUse: number = 0

  constructor(config: SnowTubingConfig = DEFAULT_CONFIG, seed?: number) {
    super(seed)
    this.config = config
    this.initializeResources()
  }

  private initializeResources(): void {
    // Ticket booth agents
    this.addResource('TicketBooth', this.config.numTicketAgents)

    // Tube pickup lanes
    this.addResource('TubePickup', this.config.numTubePickupLanes)

    // Sledding lanes
    this.addResource('SleddingLane', this.config.numSleddingLanes)

    // Conveyor (one-at-a-time)
    this.addResource('Conveyor', 1)

    // Tube pool (not a traditional resource, but track availability)
    this.tubesInUse = 0
  }

  // ============================================================================
  // ARRIVAL GENERATION
  // ============================================================================

  scheduleArrivals(day: number): void {
    this.currentDay = day
    const dayStartTime = day * 24 * 60 // Convert day to minutes

    for (const session of this.config.sessions) {
      // Non-homogeneous Poisson arrivals over 15-minute arrival window
      const arrivalWindow = 15 // minutes
      const arrivalRate = session.averageCustomers / arrivalWindow

      // Generate arrivals using thinning method
      let t = 0
      while (t < arrivalWindow) {
        // Generate next arrival using max rate
        const interarrivalTime = this.dist.exponential(1 / arrivalRate)
        t += interarrivalTime

        if (t < arrivalWindow) {
          // Generate group
          const groupSizeIndex = this.dist.discrete(this.config.groupSizeProbs)
          const groupSize = this.config.groupSizes[groupSizeIndex]

          const arrivalTime = dayStartTime + session.arrivalStartTime + t

          // Create entities for the group
          for (let i = 0; i < groupSize; i++) {
            this.scheduleEvent(
              arrivalTime - this.clock,
              EventType.ARRIVAL,
              undefined,
              undefined,
              {
                session,
                groupSize,
                groupIndex: i,
                isGroupLeader: i === 0
              }
            )
          }
        }
      }

      // Schedule session start (tube pickup opens)
      this.scheduleEvent(
        dayStartTime + session.sessionStartTime - this.clock,
        EventType.SESSION_START,
        undefined,
        undefined,
        { session }
      )

      // Schedule session warning (6 minutes before end)
      this.scheduleEvent(
        dayStartTime + session.sessionEndTime - 6 - this.clock,
        EventType.CUSTOM,
        undefined,
        undefined,
        { type: 'SESSION_WARNING', session }
      )

      // Schedule session end
      this.scheduleEvent(
        dayStartTime + session.sessionEndTime - this.clock,
        EventType.SESSION_END,
        undefined,
        undefined,
        { session }
      )
    }
  }

  // ============================================================================
  // EVENT PROCESSING
  // ============================================================================

  protected override processEvent(event: SimEvent): void {
    switch (event.type) {
      case EventType.ARRIVAL:
        this.handleArrival(event)
        break

      case EventType.SESSION_START:
        this.handleSessionStart(event)
        break

      case EventType.SESSION_END:
        this.handleSessionEnd(event)
        break

      case EventType.END_TRAVEL:
        this.handleEndTravel(event)
        break

      case EventType.START_SERVICE:
        this.handleStartService(event)
        break

      case EventType.END_SERVICE:
        this.handleEndService(event)
        break

      case EventType.CUSTOM:
        if (event.data?.type === 'SESSION_WARNING') {
          this.handleSessionWarning(event)
        }
        break

      default:
        console.log(`[${this.clock.toFixed(2)}] Unhandled event: ${event.type}`)
    }
  }

  private handleArrival(event: SimEvent): void {
    const entity = this.createEntity('Customer')
    entity.setAttribute('arrivalTime', this.clock)
    entity.setAttribute('session', event.data.session)
    entity.setAttribute('groupSize', event.data.groupSize)
    entity.setAttribute('sessionEndTime', event.data.session.sessionEndTime + this.currentDay * 24 * 60)

    // Travel to ticket booth
    const travelTime = this.config.arrivalToTicket / this.mphToFeetPerMin(this.config.walkingSpeed)
    entity.setAttribute('location', 'traveling_to_ticket')

    this.scheduleEvent(travelTime, EventType.END_TRAVEL, entity, undefined, { destination: 'ticket_booth' })
  }

  private handleEndTravel(event: SimEvent): void {
    const entity = event.entity!
    const destination = event.data.destination

    entity.setAttribute('location', destination)

    switch (destination) {
      case 'ticket_booth':
        this.tryTicketBooth(entity)
        break

      case 'tube_pickup':
        this.tryTubePickup(entity)
        break

      case 'hill_top':
        this.trySleddingLane(entity)
        break

      case 'hill_bottom':
        this.handleHillBottom(entity)
        break

      case 'after_walkup':
      case 'after_conveyor':
        // Back at top, check if session over
        if (this.shouldReturnTube(entity)) {
          this.returnTubeAndExit(entity)
        } else {
          this.trySleddingLane(entity)
        }
        break

      case 'tube_return':
        this.handleTubeReturn(entity)
        break
    }
  }

  private tryTicketBooth(entity: Entity): void {
    const ticketBooth = this.getResource('TicketBooth')!

    if (ticketBooth.isAvailable()) {
      ticketBooth.seize(entity, this.clock)
      entity.setAttribute('ticketStartTime', this.clock)

      // Process ticket
      const processingTime = this.config.advancedModel
        ? this.dist.normal(this.config.ticketProcessingData.mean, this.config.ticketProcessingData.stdDev) * entity.getAttribute('groupSize')
        : this.dist.normal(this.config.ticketProcessingData.mean, this.config.ticketProcessingData.stdDev)

      this.scheduleEvent(processingTime, EventType.END_SERVICE, entity, ticketBooth, { service: 'ticket' })
    } else {
      ticketBooth.addToQueue(entity, this.clock)
      const queueTime = this.clock
      entity.setAttribute('ticketQueueStartTime', queueTime)
    }
  }

  private tryTubePickup(entity: Entity): void {
    // Check if tube pickup is open
    const session = entity.getAttribute('session')
    const sessionStartTime = this.currentDay * 24 * 60 + session.sessionStartTime
    const pickupCloseTime = sessionStartTime + 60 // Open for 1 hour

    if (this.clock < sessionStartTime) {
      // Wait for session to start
      this.scheduleEvent(sessionStartTime - this.clock, EventType.END_TRAVEL, entity, undefined, { destination: 'tube_pickup' })
      return
    }

    if (this.clock >= pickupCloseTime) {
      console.log(`[${this.clock.toFixed(2)}] Customer ${entity.id} arrived too late for tube pickup!`)
      return
    }

    // Check tube availability
    if (this.tubesInUse >= this.config.numTubes) {
      // No tubes available - wait
      this.scheduleEvent(1, EventType.END_TRAVEL, entity, undefined, { destination: 'tube_pickup' })
      return
    }

    const tubePickup = this.getResource('TubePickup')!

    if (tubePickup.isAvailable()) {
      tubePickup.seize(entity, this.clock)
      entity.setAttribute('tubePickupStartTime', this.clock)

      const pickupTime = this.dist.triangular(
        this.config.tubePickupMin,
        this.config.tubePickupMode,
        this.config.tubePickupMax
      )

      this.scheduleEvent(pickupTime, EventType.END_SERVICE, entity, tubePickup, { service: 'tube_pickup' })
    } else {
      tubePickup.addToQueue(entity, this.clock)
    }
  }

  private trySleddingLane(entity: Entity): void {
    const sleddingLanes = this.getResource('SleddingLane')!

    if (sleddingLanes.isAvailable()) {
      sleddingLanes.seize(entity, this.clock)
      entity.setAttribute('sleddingStartTime', this.clock)

      // Time to sled down
      const speed = this.dist.uniform(this.config.sleddingSpeedMin, this.config.sleddingSpeedMax)
      const sleddingTime = this.config.hillLength / this.mphToFeetPerMin(speed)

      this.scheduleEvent(sleddingTime, EventType.END_SERVICE, entity, sleddingLanes, { service: 'sledding' })
    } else {
      sleddingLanes.addToQueue(entity, this.clock)
      entity.setAttribute('sleddingQueueStartTime', this.clock)
    }
  }

  private handleHillBottom(entity: Entity): void {
    // Choose walk-up or conveyor
    let useConveyor = true

    if (this.config.advancedModel) {
      const conveyor = this.getResource('Conveyor')!
      useConveyor = conveyor.getQueueLength() <= this.config.conveyorChoiceThreshold
    } else {
      useConveyor = this.dist.uniform(0, 1) > this.config.walkupProbability
    }

    if (useConveyor) {
      // Travel to conveyor
      const travelTime = this.config.hillBottomToConveyor / this.mphToFeetPerMin(this.config.walkingSpeed)
      this.scheduleEvent(travelTime, EventType.CUSTOM, entity, undefined, { type: 'CONVEYOR_ARRIVAL' })
    } else {
      // Travel to walk-up path
      const travelTime = this.config.hillBottomToWalkup / this.mphToFeetPerMin(this.config.walkingSpeed)
      entity.setAttribute('location', 'walking_up')

      // Walk up the hill
      const walkupTime = travelTime + (this.config.hillLength / this.mphToFeetPerMin(this.config.walkingUphillSpeed))
      this.scheduleEvent(walkupTime, EventType.END_TRAVEL, entity, undefined, { destination: 'after_walkup' })
    }
  }

  private handleStartService(_event: SimEvent): void {
    // Service started - already handled in try* methods
  }

  private handleEndService(event: SimEvent): void {
    const entity = event.entity!
    const resource = event.resource!
    const service = event.data.service

    resource.release(entity, this.clock)

    // Check queue for next entity
    if (resource.getQueueLength() > 0) {
      const nextEntity = resource.removeFromQueue(this.clock)!

      if (service === 'ticket') {
        this.tryTicketBooth(nextEntity)
      } else if (service === 'tube_pickup') {
        this.tryTubePickup(nextEntity)
      } else if (service === 'sledding') {
        this.trySleddingLane(nextEntity)
      } else if (service === 'conveyor') {
        this.tryConveyor(nextEntity)
      }
    }

    // Move entity to next stage
    switch (service) {
      case 'ticket':
        const ticketWaitTime = (entity.getAttribute('ticketStartTime') || this.clock) - (entity.getAttribute('ticketQueueStartTime') || entity.getAttribute('arrivalTime'))
        this.recordObservation('ticketWaitTime', ticketWaitTime)

        // Travel to tube pickup
        const travelTime = this.config.ticketToTubePickup / this.mphToFeetPerMin(this.config.walkingSpeed)
        this.scheduleEvent(travelTime, EventType.END_TRAVEL, entity, undefined, { destination: 'tube_pickup' })
        break

      case 'tube_pickup':
        this.tubesInUse++
        entity.setAttribute('hasTube', true)

        const tubeWaitTime = (entity.getAttribute('tubePickupStartTime') || this.clock) - entity.getAttribute('arrivalTime')
        this.recordObservation('tubeWaitTime', tubeWaitTime)

        // Travel to hill top
        const toHillTime = this.config.tubePickupToHillTop / this.mphToFeetPerMin(this.config.walkingSpeed)
        this.scheduleEvent(toHillTime, EventType.END_TRAVEL, entity, undefined, { destination: 'hill_top' })
        break

      case 'sledding':
        const sleddingWaitTime = (entity.getAttribute('sleddingStartTime') || this.clock) - (entity.getAttribute('sleddingQueueStartTime') || this.clock)
        this.recordObservation('sleddingWaitTime', sleddingWaitTime)

        // Arrived at bottom
        this.scheduleEvent(0, EventType.END_TRAVEL, entity, undefined, { destination: 'hill_bottom' })
        break

      case 'conveyor':
        // Arrived back at top
        this.scheduleEvent(0, EventType.END_TRAVEL, entity, undefined, { destination: 'after_conveyor' })
        break
    }
  }

  private tryConveyor(entity: Entity): void {
    const conveyor = this.getResource('Conveyor')!

    if (conveyor.isAvailable()) {
      conveyor.seize(entity, this.clock)

      // Time on conveyor
      const conveyorTime = this.config.hillLength / this.mphToFeetPerMin(this.config.conveyorSpeed)
      this.scheduleEvent(conveyorTime, EventType.END_SERVICE, entity, conveyor, { service: 'conveyor' })
    } else {
      conveyor.addToQueue(entity, this.clock)
    }
  }

  private shouldReturnTube(entity: Entity): boolean {
    const sessionEndTime = entity.getAttribute('sessionEndTime')
    return this.clock >= (sessionEndTime - 6)
  }

  private returnTubeAndExit(entity: Entity): void {
    // Travel to tube return
    const travelTime = this.config.hillTopToTubeReturn / this.mphToFeetPerMin(this.config.walkingSpeed)
    this.scheduleEvent(travelTime, EventType.END_TRAVEL, entity, undefined, { destination: 'tube_return' })
  }

  private handleTubeReturn(entity: Entity): void {
    this.tubesInUse--

    const cycleTime = this.clock - entity.getAttribute('arrivalTime')
    this.recordObservation('cycleTime', cycleTime)

    // Entity exits
    this.entities.delete(entity.id)
  }

  private handleSessionStart(_event: SimEvent): void {
    console.log(`[${this.clock.toFixed(2)}] Session starting`)
  }

  private handleSessionEnd(_event: SimEvent): void {
    console.log(`[${this.clock.toFixed(2)}] Session ending`)
  }

  private handleSessionWarning(_event: SimEvent): void {
    console.log(`[${this.clock.toFixed(2)}] Session warning - customers should return tubes`)
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private mphToFeetPerMin(mph: number): number {
    return mph * 5280 / 60
  }

  // ============================================================================
  // RUN SIMULATION
  // ============================================================================

  runSimulation(numDays: number, warmupDays: number = 0): any {
    console.log(`[Simulation] Running for ${numDays} days (warmup: ${warmupDays} days)`)

    this.warmupTime = warmupDays * 24 * 60

    // Schedule arrivals for all days
    for (let day = 0; day < numDays; day++) {
      this.scheduleArrivals(day)
    }

    // Run simulation
    const stopTime = numDays * 24 * 60
    this.run(stopTime, this.warmupTime)

    return this.getResults()
  }
}

// ============================================================================
// REPLICATION RUNNER
// ============================================================================

export function runSnowTubingReplications(
  config: SnowTubingConfig,
  numReplications: number,
  numDays: number,
  warmupDays: number = 7
): any {
  console.log(`[Replication Runner] Starting ${numReplications} replications...`)

  const allResults: any[] = []

  for (let rep = 0; rep < numReplications; rep++) {
    console.log(`\n[Replication ${rep + 1}/${numReplications}]`)

    const sim = new SnowTubingSimulation(config, 12345 + rep)
    const results = sim.runSimulation(numDays, warmupDays)

    allResults.push(results)
  }

  // Aggregate results across replications
  return aggregateReplicationResults(allResults)
}

function aggregateReplicationResults(allResults: any[]): any {
  // TODO: Aggregate statistics across replications
  // For now, return first replication
  return allResults[0]
}
