/**
 * Advanced Routing and Scheduling Logic
 * Implements sophisticated selection rules and dispatching algorithms
 */

import { Entity, Resource } from './DESEngine'

// ============================================================================
// ROUTING RULES
// ============================================================================

export enum RoutingRule {
  RANDOM = 'RANDOM',
  SHORTEST_QUEUE = 'SHORTEST_QUEUE',
  LEAST_UTILIZED = 'LEAST_UTILIZED',
  ROUND_ROBIN = 'ROUND_ROBIN',
  PRIORITY_BASED = 'PRIORITY_BASED',
  WEIGHTED_RANDOM = 'WEIGHTED_RANDOM',
  CLOSEST_DISTANCE = 'CLOSEST_DISTANCE',
  FASTEST_SERVICE = 'FASTEST_SERVICE'
}

export enum SchedulingRule {
  FIFO = 'FIFO', // First In First Out
  LIFO = 'LIFO', // Last In First Out
  SPT = 'SPT', // Shortest Processing Time
  LPT = 'LPT', // Longest Processing Time
  EDD = 'EDD', // Earliest Due Date
  SLACK = 'SLACK', // Minimum Slack
  CR = 'CR', // Critical Ratio
  PRIORITY = 'PRIORITY', // Priority-based
  FCFS = 'FCFS' // First Come First Served (same as FIFO)
}

export interface RoutingDecision {
  selectedResource: Resource
  reason: string
  score: number
}

export interface EntityAttributes {
  priority?: number
  dueDate?: number
  processingTime?: number
  arrivalTime?: number
  weight?: number
}

export class AdvancedRoutingEngine {
  private roundRobinCounters: Map<string, number> = new Map()
  private rng: () => number

  constructor(randomGenerator: () => number = Math.random) {
    this.rng = randomGenerator
  }

  /**
   * Select resource using specified routing rule
   */
  selectResource(
    entity: Entity,
    availableResources: Resource[],
    rule: RoutingRule,
    currentTime: number,
    weights?: Map<string, number>
  ): RoutingDecision | null {
    if (availableResources.length === 0) {
      return null
    }

    switch (rule) {
      case RoutingRule.RANDOM:
        return this.selectRandom(availableResources)

      case RoutingRule.SHORTEST_QUEUE:
        return this.selectShortestQueue(availableResources)

      case RoutingRule.LEAST_UTILIZED:
        return this.selectLeastUtilized(availableResources, currentTime)

      case RoutingRule.ROUND_ROBIN:
        return this.selectRoundRobin(availableResources)

      case RoutingRule.PRIORITY_BASED:
        return this.selectByPriority(entity, availableResources)

      case RoutingRule.WEIGHTED_RANDOM:
        return this.selectWeightedRandom(availableResources, weights)

      case RoutingRule.FASTEST_SERVICE:
        return this.selectFastestService(availableResources)

      default:
        return this.selectRandom(availableResources)
    }
  }

  /**
   * Random selection
   */
  private selectRandom(resources: Resource[]): RoutingDecision {
    const index = Math.floor(this.rng() * resources.length)
    return {
      selectedResource: resources[index],
      reason: 'Random selection',
      score: this.rng()
    }
  }

  /**
   * Select resource with shortest queue
   */
  private selectShortestQueue(resources: Resource[]): RoutingDecision {
    let minQueue = Infinity
    let selected = resources[0]

    resources.forEach(resource => {
      const queueLength = resource.getQueueLength()
      if (queueLength < minQueue) {
        minQueue = queueLength
        selected = resource
      }
    })

    return {
      selectedResource: selected,
      reason: `Shortest queue (${minQueue} entities)`,
      score: -minQueue
    }
  }

  /**
   * Select least utilized resource
   */
  private selectLeastUtilized(resources: Resource[], currentTime: number): RoutingDecision {
    let minUtilization = Infinity
    let selected = resources[0]

    resources.forEach(resource => {
      const utilization = resource.getUtilization(currentTime)
      if (utilization < minUtilization) {
        minUtilization = utilization
        selected = resource
      }
    })

    return {
      selectedResource: selected,
      reason: `Least utilized (${(minUtilization * 100).toFixed(1)}%)`,
      score: -minUtilization
    }
  }

  /**
   * Round robin selection
   */
  private selectRoundRobin(resources: Resource[]): RoutingDecision {
    const key = resources.map(r => r.name).sort().join(',')
    const counter = this.roundRobinCounters.get(key) || 0
    const index = counter % resources.length

    this.roundRobinCounters.set(key, counter + 1)

    return {
      selectedResource: resources[index],
      reason: `Round robin (position ${index})`,
      score: index
    }
  }

  /**
   * Priority-based selection
   */
  private selectByPriority(entity: Entity, resources: Resource[]): RoutingDecision {
    // Select resource based on entity priority attribute
    const entityPriority = entity.getAttribute('priority') || 0

    // Higher priority entities get first available resource
    // This is a simplified version - could be more sophisticated
    return {
      selectedResource: resources[0],
      reason: `Priority ${entityPriority}`,
      score: entityPriority
    }
  }

  /**
   * Weighted random selection
   */
  private selectWeightedRandom(resources: Resource[], weights?: Map<string, number>): RoutingDecision {
    if (!weights) {
      return this.selectRandom(resources)
    }

    // Calculate total weight
    let totalWeight = 0
    resources.forEach(resource => {
      totalWeight += weights.get(resource.name) || 1
    })

    // Select based on weights
    let random = this.rng() * totalWeight
    for (const resource of resources) {
      const weight = weights.get(resource.name) || 1
      random -= weight
      if (random <= 0) {
        return {
          selectedResource: resource,
          reason: `Weighted random (weight ${weight})`,
          score: weight
        }
      }
    }

    return this.selectRandom(resources)
  }

  /**
   * Select resource with fastest service time
   */
  private selectFastestService(resources: Resource[]): RoutingDecision {
    // This would need service time information
    // For now, select first available
    return {
      selectedResource: resources[0],
      reason: 'Fastest service',
      score: 1
    }
  }
}

// ============================================================================
// SCHEDULING ENGINE
// ============================================================================

export class SchedulingEngine {
  /**
   * Sort entities in queue based on scheduling rule
   */
  static sortQueue(entities: Entity[], rule: SchedulingRule, currentTime: number): Entity[] {
    const sorted = [...entities]

    switch (rule) {
      case SchedulingRule.FIFO:
      case SchedulingRule.FCFS:
        // Already in arrival order
        return sorted

      case SchedulingRule.LIFO:
        return sorted.reverse()

      case SchedulingRule.SPT:
        return sorted.sort((a, b) => {
          const timeA = a.getAttribute('processingTime') || 0
          const timeB = b.getAttribute('processingTime') || 0
          return timeA - timeB
        })

      case SchedulingRule.LPT:
        return sorted.sort((a, b) => {
          const timeA = a.getAttribute('processingTime') || 0
          const timeB = b.getAttribute('processingTime') || 0
          return timeB - timeA
        })

      case SchedulingRule.EDD:
        return sorted.sort((a, b) => {
          const dueDateA = a.getAttribute('dueDate') || Infinity
          const dueDateB = b.getAttribute('dueDate') || Infinity
          return dueDateA - dueDateB
        })

      case SchedulingRule.SLACK:
        return sorted.sort((a, b) => {
          const slackA = this.calculateSlack(a, currentTime)
          const slackB = this.calculateSlack(b, currentTime)
          return slackA - slackB
        })

      case SchedulingRule.CR:
        return sorted.sort((a, b) => {
          const crA = this.calculateCriticalRatio(a, currentTime)
          const crB = this.calculateCriticalRatio(b, currentTime)
          return crA - crB
        })

      case SchedulingRule.PRIORITY:
        return sorted.sort((a, b) => {
          const priorityA = a.getAttribute('priority') || 0
          const priorityB = b.getAttribute('priority') || 0
          return priorityB - priorityA // Higher priority first
        })

      default:
        return sorted
    }
  }

  /**
   * Calculate slack time (due date - current time - remaining processing time)
   */
  private static calculateSlack(entity: Entity, currentTime: number): number {
    const dueDate = entity.getAttribute('dueDate') || Infinity
    const processingTime = entity.getAttribute('processingTime') || 0
    return dueDate - currentTime - processingTime
  }

  /**
   * Calculate critical ratio (time until due / remaining processing time)
   */
  private static calculateCriticalRatio(entity: Entity, currentTime: number): number {
    const dueDate = entity.getAttribute('dueDate') || Infinity
    const processingTime = entity.getAttribute('processingTime') || 1
    const timeUntilDue = dueDate - currentTime

    return timeUntilDue / processingTime
  }

  /**
   * Select next entity to process
   */
  static selectNextEntity(queue: Entity[], rule: SchedulingRule, currentTime: number): Entity | undefined {
    if (queue.length === 0) return undefined

    const sorted = this.sortQueue(queue, rule, currentTime)
    return sorted[0]
  }

  /**
   * Evaluate scheduling performance
   */
  static evaluateSchedule(entities: Entity[], currentTime: number): {
    avgFlowTime: number
    avgTardiness: number
    avgLateness: number
    numTardy: number
    makespan: number
  } {
    if (entities.length === 0) {
      return {
        avgFlowTime: 0,
        avgTardiness: 0,
        avgLateness: 0,
        numTardy: 0,
        makespan: 0
      }
    }

    let totalFlowTime = 0
    let totalTardiness = 0
    let totalLateness = 0
    let numTardy = 0
    let makespan = 0

    entities.forEach(entity => {
      const arrivalTime = entity.getAttribute('arrivalTime') || 0
      const completionTime = entity.getAttribute('completionTime') || currentTime
      const dueDate = entity.getAttribute('dueDate') || Infinity

      const flowTime = completionTime - arrivalTime
      const lateness = completionTime - dueDate
      const tardiness = Math.max(0, lateness)

      totalFlowTime += flowTime
      totalLateness += lateness
      totalTardiness += tardiness

      if (tardiness > 0) {
        numTardy++
      }

      makespan = Math.max(makespan, completionTime)
    })

    return {
      avgFlowTime: totalFlowTime / entities.length,
      avgTardiness: totalTardiness / entities.length,
      avgLateness: totalLateness / entities.length,
      numTardy,
      makespan
    }
  }
}

// ============================================================================
// DYNAMIC ROUTING
// ============================================================================

export interface RoutingCondition {
  type: 'threshold' | 'expression' | 'probability'
  parameter?: string
  threshold?: number
  expression?: string
  probability?: number
}

export interface RoutingPath {
  destination: string
  condition: RoutingCondition
  priority: number
}

export class DynamicRouter {
  private routes: Map<string, RoutingPath[]> = new Map()

  /**
   * Add routing rule
   */
  addRoute(source: string, path: RoutingPath): void {
    if (!this.routes.has(source)) {
      this.routes.set(source, [])
    }

    this.routes.get(source)!.push(path)

    // Sort by priority (higher first)
    this.routes.get(source)!.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Determine next destination based on conditions
   */
  getNextDestination(
    source: string,
    entity: Entity,
    context: Map<string, any>,
    rng: () => number = Math.random
  ): string | null {
    const paths = this.routes.get(source)
    if (!paths || paths.length === 0) return null

    for (const path of paths) {
      if (this.evaluateCondition(path.condition, entity, context, rng)) {
        return path.destination
      }
    }

    return null
  }

  /**
   * Evaluate routing condition
   */
  private evaluateCondition(
    condition: RoutingCondition,
    entity: Entity,
    context: Map<string, any>,
    rng: () => number
  ): boolean {
    switch (condition.type) {
      case 'threshold':
        if (!condition.parameter || condition.threshold === undefined) return false
        const value = entity.getAttribute(condition.parameter) || context.get(condition.parameter) || 0
        return value >= condition.threshold

      case 'probability':
        if (condition.probability === undefined) return false
        return rng() < condition.probability

      case 'expression':
        // Simplified expression evaluation
        // In production, use a proper expression parser
        return true

      default:
        return false
    }
  }

  /**
   * Get all possible destinations from source
   */
  getPossibleDestinations(source: string): string[] {
    const paths = this.routes.get(source)
    if (!paths) return []

    return paths.map(p => p.destination)
  }
}
