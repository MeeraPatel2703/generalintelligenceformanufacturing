/**
 * M/M/1 QUEUE SIMULATION
 *
 * Implements a single-server queue with:
 * - Exponential inter-arrival times (Poisson arrivals)
 * - Exponential service times
 * - FIFO discipline
 * - Infinite queue capacity
 *
 * This implementation is designed for validation against queueing theory.
 */

import { DESEngine, EventType, SimEvent } from './DESEngine'

export interface MM1SimulationConfig {
  lambda: number        // Arrival rate (customers per hour)
  mu: number           // Service rate (customers per hour)
  numCustomers: number // Number of customers to simulate
  warmupCustomers?: number // Number of customers for warmup period
  seed?: number        // Random seed for reproducibility
}

export interface MM1SimulationResults {
  // Performance metrics
  utilization: number
  avgTimeInSystem: number
  avgTimeInQueue: number
  avgNumberInSystem: number
  avgNumberInQueue: number

  // Detailed statistics
  totalCustomers: number
  totalArrived: number
  totalServed: number
  simulationTime: number

  // For validation
  raw: {
    timeInSystemSamples: number[]
    timeInQueueSamples: number[]
  }
}

export class MM1QueueSimulation extends DESEngine {
  private lambda: number
  private mu: number
  private targetCustomers: number
  private warmupCustomers: number

  private arrivedCount: number = 0
  private servedCount: number = 0

  // Track individual customer times
  private timeInSystemSamples: number[] = []
  private timeInQueueSamples: number[] = []

  // Track system state over time for L and Lq
  private systemTimeSeries: { time: number; count: number }[] = []
  private queueTimeSeries: { time: number; count: number }[] = []

  constructor(config: MM1SimulationConfig) {
    super(config.seed)
    this.lambda = config.lambda
    this.mu = config.mu
    this.targetCustomers = config.numCustomers
    this.warmupCustomers = config.warmupCustomers || 0
  }

  /**
   * Initialize and run the simulation
   */
  runSimulation(): MM1SimulationResults {
    // Reset everything
    this.reset()
    this.arrivedCount = 0
    this.servedCount = 0
    this.timeInSystemSamples = []
    this.timeInQueueSamples = []
    this.systemTimeSeries = []
    this.queueTimeSeries = []

    // Create server resource (single server, capacity = 1)
    this.addResource('server', 1)

    // Schedule first arrival
    this.scheduleNextArrival()

    // Track initial state
    this.recordSystemState(0, 0)
    this.recordQueueState(0, 0)

    // Run until we've served all target customers
    // Set a generous stop time (10x expected completion time)
    const expectedTime = this.targetCustomers / this.lambda * 10
    this.run(expectedTime)

    // Calculate results
    return this.calculateResults()
  }

  protected override processEvent(event: SimEvent): void {
    if (event.type === EventType.ARRIVAL) {
      this.handleArrival(event)
    } else if (event.type === EventType.END_SERVICE) {
      this.handleEndService(event)
    }
  }

  private handleArrival(_event: SimEvent): void {
    this.arrivedCount++

    // Create customer entity
    const customer = this.createEntity('customer')
    customer.setAttribute('arrivalTime', this.clock)

    // Get server resource
    const server = this.getResource('server')!

    // Try to seize server
    if (server.seize(customer, this.clock)) {
      // Customer starts service immediately (no queue time)
      customer.setAttribute('serviceStartTime', this.clock)
      customer.setAttribute('timeInQueue', 0)

      // Schedule service completion
      const serviceTime = this.dist.exponential(1 / this.mu)
      this.scheduleEvent(serviceTime, EventType.END_SERVICE, customer, server)
    } else {
      // Server busy - add to queue
      customer.setAttribute('queueStartTime', this.clock)
      server.addToQueue(customer, this.clock)
    }

    // Record system state (after adding)
    const newInSystem = (server.capacity - server.available) + server.getQueueLength()
    this.recordSystemState(this.clock, newInSystem)
    this.recordQueueState(this.clock, server.getQueueLength())

    // Schedule next arrival (only if we haven't generated enough)
    if (this.arrivedCount < this.targetCustomers + this.warmupCustomers) {
      this.scheduleNextArrival()
    }
  }

  private handleEndService(event: SimEvent): void {
    const customer = event.entity!
    const server = this.getResource('server')!

    // Release server
    server.release(customer, this.clock)

    // Record customer statistics (only after warmup)
    if (this.servedCount >= this.warmupCustomers) {
      const arrivalTime = customer.getAttribute('arrivalTime')
      const timeInSystem = this.clock - arrivalTime
      const timeInQueue = customer.getAttribute('timeInQueue') || 0

      this.timeInSystemSamples.push(timeInSystem)
      this.timeInQueueSamples.push(timeInQueue)
    }

    this.servedCount++

    // Check if someone is waiting in queue
    if (server.getQueueLength() > 0) {
      const nextCustomer = server.removeFromQueue(this.clock)!

      // Calculate queue time
      const queueStartTime = nextCustomer.getAttribute('queueStartTime')
      const timeInQueue = this.clock - queueStartTime
      nextCustomer.setAttribute('timeInQueue', timeInQueue)
      nextCustomer.setAttribute('serviceStartTime', this.clock)

      // Seize server for next customer
      server.seize(nextCustomer, this.clock)

      // Schedule service completion
      const serviceTime = this.dist.exponential(1 / this.mu)
      this.scheduleEvent(serviceTime, EventType.END_SERVICE, nextCustomer, server)
    }

    // Record system state
    const inSystem = (server.capacity - server.available) + server.getQueueLength()
    this.recordSystemState(this.clock, inSystem)
    this.recordQueueState(this.clock, server.getQueueLength())

    // Stop if we've served enough customers
    if (this.servedCount >= this.targetCustomers + this.warmupCustomers) {
      // Clear remaining events
      this.eventQueue.clear()
    }
  }

  private scheduleNextArrival(): void {
    const interArrivalTime = this.dist.exponential(1 / this.lambda)
    this.scheduleEvent(interArrivalTime, EventType.ARRIVAL)
  }

  private recordSystemState(time: number, count: number): void {
    this.systemTimeSeries.push({ time, count })
  }

  private recordQueueState(time: number, count: number): void {
    this.queueTimeSeries.push({ time, count })
  }

  private calculateResults(): MM1SimulationResults {
    const server = this.getResource('server')!
    const simulationTime = this.clock

    // Calculate time-weighted averages for L and Lq
    const avgNumberInSystem = this.calculateTimeWeightedAverage(this.systemTimeSeries, simulationTime)
    const avgNumberInQueue = this.calculateTimeWeightedAverage(this.queueTimeSeries, simulationTime)

    // Calculate averages from samples
    const avgTimeInSystem = this.timeInSystemSamples.reduce((a, b) => a + b, 0) / this.timeInSystemSamples.length
    const avgTimeInQueue = this.timeInQueueSamples.reduce((a, b) => a + b, 0) / this.timeInQueueSamples.length

    // Calculate utilization
    const utilization = server.getUtilization(simulationTime)

    return {
      utilization,
      avgTimeInSystem,
      avgTimeInQueue,
      avgNumberInSystem,
      avgNumberInQueue,

      totalCustomers: this.targetCustomers,
      totalArrived: this.arrivedCount,
      totalServed: this.servedCount,
      simulationTime,

      raw: {
        timeInSystemSamples: this.timeInSystemSamples,
        timeInQueueSamples: this.timeInQueueSamples
      }
    }
  }

  private calculateTimeWeightedAverage(timeSeries: { time: number; count: number }[], endTime: number): number {
    if (timeSeries.length === 0) return 0

    let weightedSum = 0

    for (let i = 0; i < timeSeries.length; i++) {
      const current = timeSeries[i]
      const nextTime = i < timeSeries.length - 1 ? timeSeries[i + 1].time : endTime
      const duration = nextTime - current.time

      weightedSum += current.count * duration
    }

    const totalDuration = endTime - (timeSeries[0]?.time || 0)
    return totalDuration > 0 ? weightedSum / totalDuration : 0
  }
}

/**
 * Run multiple replications of M/M/1 simulation
 */
export function runMM1Replications(config: MM1SimulationConfig, replications: number): {
  utilizationSamples: number[]
  avgTimeInSystemSamples: number[]
  avgTimeInQueueSamples: number[]
  avgNumberInSystemSamples: number[]
  avgNumberInQueueSamples: number[]
} {
  const utilizationSamples: number[] = []
  const avgTimeInSystemSamples: number[] = []
  const avgTimeInQueueSamples: number[] = []
  const avgNumberInSystemSamples: number[] = []
  const avgNumberInQueueSamples: number[] = []

  for (let rep = 0; rep < replications; rep++) {
    // Use different seed for each replication
    const repConfig = {
      ...config,
      seed: config.seed ? config.seed + rep : undefined
    }

    const sim = new MM1QueueSimulation(repConfig)
    const results = sim.runSimulation()

    utilizationSamples.push(results.utilization)
    avgTimeInSystemSamples.push(results.avgTimeInSystem)
    avgTimeInQueueSamples.push(results.avgTimeInQueue)
    avgNumberInSystemSamples.push(results.avgNumberInSystem)
    avgNumberInQueueSamples.push(results.avgNumberInQueue)
  }

  return {
    utilizationSamples,
    avgTimeInSystemSamples,
    avgTimeInQueueSamples,
    avgNumberInSystemSamples,
    avgNumberInQueueSamples
  }
}
