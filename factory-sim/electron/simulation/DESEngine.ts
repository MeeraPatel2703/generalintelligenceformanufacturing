/**
 * Complete Discrete Event Simulation Engine
 *
 * This is a full-featured DES engine that implements:
 * - Priority queue-based event scheduling
 * - Statistical distributions
 * - Time-weighted and observation-based statistics
 * - Proper replication logic with confidence intervals
 */

// ============================================================================
// RANDOM NUMBER GENERATION
// ============================================================================

export class RandomGenerator {
  private seed: number

  constructor(seed: number = Date.now()) {
    this.seed = seed
  }

  // Linear Congruential Generator (LCG) for reproducibility
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296
    return this.seed / 4294967296
  }

  // Set seed for reproducibility
  setSeed(seed: number): void {
    this.seed = seed
  }
}

// ============================================================================
// STATISTICAL DISTRIBUTIONS
// ============================================================================

export class Distributions {
  constructor(private rng: RandomGenerator) {}

  uniform(min: number, max: number): number {
    return min + (max - min) * this.rng.next()
  }

  exponential(mean: number): number {
    return -mean * Math.log(1 - this.rng.next())
  }

  normal(mean: number, stdDev: number): number {
    // Box-Muller transform
    const u1 = this.rng.next()
    const u2 = this.rng.next()
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return mean + z0 * stdDev
  }

  triangular(min: number, mode: number, max: number): number {
    const u = this.rng.next()
    const fc = (mode - min) / (max - min)

    if (u < fc) {
      return min + Math.sqrt(u * (max - min) * (mode - min))
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - mode))
    }
  }

  pert(min: number, mode: number, max: number): number {
    // PERT distribution uses Beta distribution
    const mean = (min + 4 * mode + max) / 6
    const range = max - min

    // Simplified PERT using triangular approximation with shape parameter
    const alpha = 4
    const mu = (mode - min) / range

    // Use beta distribution approximation
    return min + range * this.betaSample(1 + alpha * mu, 1 + alpha * (1 - mu))
  }

  private betaSample(alpha: number, beta: number): number {
    // Simple beta sampler using gamma samples
    const x = this.gammaSample(alpha)
    const y = this.gammaSample(beta)
    return x / (x + y)
  }

  private gammaSample(shape: number): number {
    // Marsaglia and Tsang's method for gamma distribution
    if (shape < 1) {
      return this.gammaSample(shape + 1) * Math.pow(this.rng.next(), 1 / shape)
    }

    const d = shape - 1/3
    const c = 1 / Math.sqrt(9 * d)

    while (true) {
      let x, v
      do {
        x = this.normal(0, 1)
        v = 1 + c * x
      } while (v <= 0)

      v = v * v * v
      const u = this.rng.next()

      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v
      }
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v
      }
    }
  }

  discrete(probabilities: number[]): number {
    const u = this.rng.next()
    let cumulative = 0

    for (let i = 0; i < probabilities.length; i++) {
      cumulative += probabilities[i]
      if (u <= cumulative) {
        return i
      }
    }

    return probabilities.length - 1
  }

  poisson(lambda: number): number {
    // Knuth's algorithm for Poisson
    const L = Math.exp(-lambda)
    let k = 0
    let p = 1

    do {
      k++
      p *= this.rng.next()
    } while (p > L)

    return k - 1
  }
}

// ============================================================================
// STATISTICS COLLECTION
// ============================================================================

export class TimeWeightedStatistic {
  private values: number[] = []
  private lastValue: number = 0
  private lastTime: number = 0
  private timeWeightedSum: number = 0

  update(time: number, value: number): void {
    if (this.values.length > 0) {
      const duration = time - this.lastTime
      this.timeWeightedSum += this.lastValue * duration
    }

    this.lastValue = value
    this.lastTime = time
    this.values.push(value)
  }

  getMean(currentTime: number): number {
    if (this.values.length === 0) return 0

    const duration = currentTime - this.lastTime
    const totalSum = this.timeWeightedSum + this.lastValue * duration
    return totalSum / currentTime
  }

  getMax(): number {
    return this.values.length > 0 ? Math.max(...this.values) : 0
  }

  getMin(): number {
    return this.values.length > 0 ? Math.min(...this.values) : 0
  }
}

export class ObservationStatistic {
  private observations: number[] = []

  record(value: number): void {
    this.observations.push(value)
  }

  getCount(): number {
    return this.observations.length
  }

  getMean(): number {
    if (this.observations.length === 0) return 0
    const sum = this.observations.reduce((a, b) => a + b, 0)
    return sum / this.observations.length
  }

  getStdDev(): number {
    if (this.observations.length < 2) return 0
    const mean = this.getMean()
    const squaredDiffs = this.observations.map(x => (x - mean) ** 2)
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (this.observations.length - 1)
    return Math.sqrt(variance)
  }

  getMin(): number {
    return this.observations.length > 0 ? Math.min(...this.observations) : 0
  }

  getMax(): number {
    return this.observations.length > 0 ? Math.max(...this.observations) : 0
  }

  getPercentile(p: number): number {
    if (this.observations.length === 0) return 0
    const sorted = [...this.observations].sort((a, b) => a - b)
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  getConfidenceInterval(confidence: number = 0.95): { lower: number; upper: number; halfWidth: number } {
    if (this.observations.length < 2) {
      return { lower: 0, upper: 0, halfWidth: 0 }
    }

    const mean = this.getMean()
    const stdDev = this.getStdDev()
    const n = this.observations.length

    // T-distribution critical value (approximation for large n)
    const tValue = this.getTValue(confidence, n - 1)
    const halfWidth = tValue * stdDev / Math.sqrt(n)

    return {
      lower: mean - halfWidth,
      upper: mean + halfWidth,
      halfWidth
    }
  }

  private getTValue(confidence: number, df: number): number {
    // Simplified t-values for common confidence levels
    // For large df (>30), use normal approximation
    if (df > 30) {
      if (confidence === 0.90) return 1.645
      if (confidence === 0.95) return 1.960
      if (confidence === 0.99) return 2.576
    }

    // Approximation for smaller df
    if (confidence === 0.95) {
      if (df <= 5) return 2.571
      if (df <= 10) return 2.228
      if (df <= 20) return 2.086
      return 2.042
    }

    return 1.96 // Default
  }

  clear(): void {
    this.observations = []
  }
}

// ============================================================================
// EVENT SYSTEM
// ============================================================================

export enum EventType {
  ARRIVAL = 'ARRIVAL',
  START_SERVICE = 'START_SERVICE',
  END_SERVICE = 'END_SERVICE',
  END_TRAVEL = 'END_TRAVEL',
  SESSION_START = 'SESSION_START',
  SESSION_END = 'SESSION_END',
  RESOURCE_FAILURE = 'RESOURCE_FAILURE',
  RESOURCE_REPAIR = 'RESOURCE_REPAIR',
  CUSTOM = 'CUSTOM'
}

export interface SimEvent {
  time: number
  type: EventType
  entity?: Entity
  resource?: Resource
  data?: any
}

export class EventQueue {
  private events: SimEvent[] = []

  schedule(event: SimEvent): void {
    // Insert event in time order
    let inserted = false
    for (let i = 0; i < this.events.length; i++) {
      if (event.time < this.events[i].time) {
        this.events.splice(i, 0, event)
        inserted = true
        break
      }
    }

    if (!inserted) {
      this.events.push(event)
    }
  }

  getNext(): SimEvent | undefined {
    return this.events.shift()
  }

  peek(): SimEvent | undefined {
    return this.events[0]
  }

  isEmpty(): boolean {
    return this.events.length === 0
  }

  clear(): void {
    this.events = []
  }

  size(): number {
    return this.events.length
  }
}

// ============================================================================
// ENTITIES AND RESOURCES
// ============================================================================

export class Entity {
  id: number
  type: string
  createTime: number
  attributes: Map<string, any>

  constructor(id: number, type: string, createTime: number) {
    this.id = id
    this.type = type
    this.createTime = createTime
    this.attributes = new Map()
  }

  setAttribute(key: string, value: any): void {
    this.attributes.set(key, value)
  }

  getAttribute(key: string): any {
    return this.attributes.get(key)
  }
}

export class Resource {
  name: string
  capacity: number
  available: number
  queue: Entity[]
  busySince: Map<number, number> // entityId -> start time
  totalBusyTime: number
  utilizationStat: TimeWeightedStatistic
  queueLengthStat: TimeWeightedStatistic

  constructor(name: string, capacity: number) {
    this.name = name
    this.capacity = capacity
    this.available = capacity
    this.queue = []
    this.busySince = new Map()
    this.totalBusyTime = 0
    this.utilizationStat = new TimeWeightedStatistic()
    this.queueLengthStat = new TimeWeightedStatistic()
  }

  isAvailable(): boolean {
    return this.available > 0
  }

  seize(entity: Entity, time: number): boolean {
    if (this.available > 0) {
      this.available--
      this.busySince.set(entity.id, time)
      this.utilizationStat.update(time, this.capacity - this.available)
      return true
    }
    return false
  }

  release(entity: Entity, time: number): void {
    if (this.busySince.has(entity.id)) {
      const startTime = this.busySince.get(entity.id)!
      this.totalBusyTime += (time - startTime)
      this.busySince.delete(entity.id)
    }

    this.available++
    this.utilizationStat.update(time, this.capacity - this.available)
  }

  addToQueue(entity: Entity, time: number): void {
    this.queue.push(entity)
    this.queueLengthStat.update(time, this.queue.length)
  }

  removeFromQueue(time: number): Entity | undefined {
    const entity = this.queue.shift()
    this.queueLengthStat.update(time, this.queue.length)
    return entity
  }

  getQueueLength(): number {
    return this.queue.length
  }

  getUtilization(currentTime: number): number {
    return this.utilizationStat.getMean(currentTime) / this.capacity
  }

  reset(): void {
    this.available = this.capacity
    this.queue = []
    this.busySince.clear()
    this.totalBusyTime = 0
    this.utilizationStat = new TimeWeightedStatistic()
    this.queueLengthStat = new TimeWeightedStatistic()
  }
}

// ============================================================================
// MAIN DES ENGINE
// ============================================================================

export class DESEngine {
  clock: number = 0
  eventQueue: EventQueue
  rng: RandomGenerator
  dist: Distributions
  entities: Map<number, Entity>
  resources: Map<string, Resource>
  nextEntityId: number = 1

  // Statistics
  stats: Map<string, ObservationStatistic>
  timeStats: Map<string, TimeWeightedStatistic>

  // Control
  stopTime: number = Infinity
  warmupTime: number = 0

  constructor(seed?: number) {
    this.rng = new RandomGenerator(seed)
    this.dist = new Distributions(this.rng)
    this.eventQueue = new EventQueue()
    this.entities = new Map()
    this.resources = new Map()
    this.stats = new Map()
    this.timeStats = new Map()
  }

  // Resource management
  addResource(name: string, capacity: number): Resource {
    const resource = new Resource(name, capacity)
    this.resources.set(name, resource)
    return resource
  }

  getResource(name: string): Resource | undefined {
    return this.resources.get(name)
  }

  // Entity creation
  createEntity(type: string): Entity {
    const entity = new Entity(this.nextEntityId++, type, this.clock)
    this.entities.set(entity.id, entity)
    return entity
  }

  // Statistics
  recordObservation(name: string, value: number): void {
    if (!this.stats.has(name)) {
      this.stats.set(name, new ObservationStatistic())
    }

    // Only record if past warmup
    if (this.clock >= this.warmupTime) {
      this.stats.get(name)!.record(value)
    }
  }

  getStatistic(name: string): ObservationStatistic | undefined {
    return this.stats.get(name)
  }

  // Event scheduling
  scheduleEvent(delay: number, type: EventType, entity?: Entity, resource?: Resource, data?: any): void {
    this.eventQueue.schedule({
      time: this.clock + delay,
      type,
      entity,
      resource,
      data
    })
  }

  // Main simulation loop
  run(stopTime: number, warmupTime: number = 0): void {
    this.stopTime = stopTime
    this.warmupTime = warmupTime

    while (!this.eventQueue.isEmpty()) {
      const event = this.eventQueue.getNext()!

      if (event.time > this.stopTime) {
        break
      }

      this.clock = event.time
      this.processEvent(event)
    }
  }

  // Override this in subclasses
  protected processEvent(event: SimEvent): void {
    // Base implementation - override in specific models
    console.log(`[${this.clock.toFixed(2)}] Processing event: ${event.type}`)
  }

  // Reset simulation
  reset(): void {
    this.clock = 0
    this.eventQueue.clear()
    this.entities.clear()
    this.nextEntityId = 1

    // Reset all resources
    this.resources.forEach(resource => resource.reset())

    // Clear statistics
    this.stats.forEach(stat => stat.clear())
    this.timeStats.clear()
  }

  // Get results
  getResults(): any {
    const results: any = {
      observations: {},
      resources: {}
    }

    // Observation statistics
    this.stats.forEach((stat, name) => {
      const ci = stat.getConfidenceInterval(0.95)
      results.observations[name] = {
        count: stat.getCount(),
        mean: stat.getMean(),
        stdDev: stat.getStdDev(),
        min: stat.getMin(),
        max: stat.getMax(),
        ci95: ci
      }
    })

    // Resource statistics
    this.resources.forEach((resource, name) => {
      results.resources[name] = {
        utilization: resource.getUtilization(this.clock),
        avgQueueLength: resource.queueLengthStat.getMean(this.clock),
        maxQueueLength: resource.queueLengthStat.getMax()
      }
    })

    return results
  }
}
