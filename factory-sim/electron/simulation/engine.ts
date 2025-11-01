/**
 * Discrete Event Simulation Engine
 *
 * Event-driven simulation of factory operations.
 * Handles arrivals, processing, transfers, blocking, and statistics collection.
 */

import { EventQueue } from './eventQueue';
import { RandomNumberGenerator } from './rng';
import { Machine } from './machine';
import { Part } from './part';
import { Distribution, createDistribution } from './distributions';
import { ReplicationStatistics, AggregateStatistics } from './statistics';
import {
  SimulationConfig,
  SimulationEvent,
  SimulationResults,
  ReplicationResult,
  EventType
} from '../../src/types/simulation';

export class SimulationEngine {
  // Configuration
  private config: SimulationConfig;

  // Core components
  private eventQueue: EventQueue;
  private rng: RandomNumberGenerator;
  private machines: Map<string, Machine>;
  private parts: Map<string, Part>;
  private arrivalDistribution: Distribution;

  // Statistics
  private stats: ReplicationStatistics;

  // Simulation state
  private currentTime: number = 0;
  private partIdCounter: number = 0;
  private completedParts: Part[] = [];

  // Event handlers (bound to this instance)
  private eventHandlers: Map<EventType, (event: SimulationEvent) => void>;

  constructor(config: SimulationConfig) {
    this.config = config;
    this.rng = new RandomNumberGenerator(config.baseSeed);
    this.eventQueue = new EventQueue();
    this.machines = new Map();
    this.parts = new Map();
    this.stats = new ReplicationStatistics();

    // Create arrival distribution
    const arrivalRate = config.arrivalRate; // parts per minute
    const interArrivalMean = 1 / arrivalRate;
    this.arrivalDistribution = createDistribution({
      distribution: 'exponential',
      mean: interArrivalMean
    });

    // Initialize machines
    this.initializeMachines();

    // Bind event handlers
    this.eventHandlers = new Map([
      ['ARRIVAL', this.handleArrival.bind(this)],
      ['START_PROCESSING', this.handleStartProcessing.bind(this)],
      ['END_PROCESSING', this.handleEndProcessing.bind(this)],
      ['END_SIMULATION', this.handleEndSimulation.bind(this)]
    ]);
  }

  /**
   * Initialize all machines from config
   */
  private initializeMachines(): void {
    for (const machineConfig of this.config.machines) {
      const distribution = createDistribution(machineConfig.processTime);
      const machine = new Machine(machineConfig, distribution);
      this.machines.set(machine.id, machine);
    }

    console.log(`[DES Engine] Initialized ${this.machines.size} machines`);
  }

  /**
   * Run simulation with multiple replications
   */
  run(progressCallback?: (progress: number) => void): SimulationResults & { replications: ReplicationResult[] } {
    const replications: ReplicationResult[] = [];

    console.log(`[DES Engine] Starting ${this.config.numReplications} replications`);

    for (let rep = 0; rep < this.config.numReplications; rep++) {
      const result = this.runSingleReplication(rep);
      replications.push(result);

      if (progressCallback) {
        progressCallback((rep + 1) / this.config.numReplications);
      }
    }

    const baseResults = this.aggregateResults(replications);
    return {
      ...baseResults,
      replications
    };
  }

  /**
   * Run a single replication
   */
  private runSingleReplication(repNumber: number): ReplicationResult {
    // Reset for new replication
    this.reset();
    this.rng.setSeed(this.config.baseSeed + repNumber);

    console.log(`[DES Engine] Replication ${repNumber + 1} starting...`);

    // Schedule first arrival
    this.scheduleArrival(0);

    // Schedule end of simulation
    this.eventQueue.enqueue({
      time: this.config.warmupTime + this.config.simulationTime,
      type: 'END_SIMULATION'
    });

    // Main event loop
    let eventCount = 0;
    while (!this.eventQueue.isEmpty()) {
      const event = this.eventQueue.dequeue()!;
      this.currentTime = event.time;

      // Update time-weighted statistics (after warmup)
      if (this.currentTime >= this.config.warmupTime) {
        this.updateTimeWeightedStats();
      }

      // Handle event
      const handler = this.eventHandlers.get(event.type);
      if (handler) {
        handler(event);
      }

      eventCount++;

      if (event.type === 'END_SIMULATION') {
        break;
      }
    }

    console.log(`[DES Engine] Replication ${repNumber + 1} complete: ${eventCount} events processed`);

    // Collect statistics
    return this.collectStatistics();
  }

  /**
   * Handle ARRIVAL event
   */
  private handleArrival(_event: SimulationEvent): void {
    // Create new part
    const partId = `part_${this.partIdCounter++}`;
    const part = new Part(partId, this.currentTime);
    this.parts.set(partId, part);

    // Get first machine in flow
    const firstMachineId = this.config.flowSequence[0];
    const firstMachine = this.machines.get(firstMachineId);

    if (!firstMachine) {
      console.error(`[DES Engine] First machine ${firstMachineId} not found`);
      return;
    }

    // Try to start processing immediately, otherwise queue
    if (firstMachine.canAccept()) {
      this.scheduleStartProcessing(firstMachine, part);
    } else if (firstMachine.canEnqueue()) {
      firstMachine.enqueue(part, this.currentTime);
    } else {
      // Queue is full - part is rejected/lost
      console.warn(`[DES Engine] Part ${partId} rejected - queue full at ${firstMachineId}`);
    }

    // Schedule next arrival (only before end of simulation)
    const nextArrivalTime = this.currentTime + this.arrivalDistribution.sample(this.rng);
    if (nextArrivalTime < this.config.warmupTime + this.config.simulationTime) {
      this.scheduleArrival(nextArrivalTime);
    }
  }

  /**
   * Handle START_PROCESSING event
   */
  private handleStartProcessing(event: SimulationEvent): void {
    if (!event.machineId || !event.partId) return;

    const machine = this.machines.get(event.machineId);
    const part = this.parts.get(event.partId);

    if (!machine || !part) {
      console.error(`[DES Engine] Missing machine or part for START_PROCESSING`);
      return;
    }

    // Start processing
    machine.startProcessing(part, this.currentTime);

    // Sample process time
    const processTime = machine.processTimeDistribution.sample(this.rng);

    // Schedule end of processing
    this.eventQueue.enqueue({
      time: this.currentTime + processTime,
      type: 'END_PROCESSING',
      machineId: machine.id,
      partId: part.id
    });
  }

  /**
   * Handle END_PROCESSING event
   */
  private handleEndProcessing(event: SimulationEvent): void {
    if (!event.machineId || !event.partId) return;

    const machine = this.machines.get(event.machineId);
    const part = this.parts.get(event.partId);

    if (!machine || !part) {
      console.error(`[DES Engine] Missing machine or part for END_PROCESSING`);
      return;
    }

    // End processing at this machine
    machine.endProcessing(this.currentTime);

    // Find next machine in flow
    const currentIndex = this.config.flowSequence.indexOf(machine.id);
    const nextIndex = currentIndex + 1;

    if (nextIndex < this.config.flowSequence.length) {
      // Transfer to next machine
      const nextMachineId = this.config.flowSequence[nextIndex];
      const nextMachine = this.machines.get(nextMachineId);

      if (!nextMachine) {
        console.error(`[DES Engine] Next machine ${nextMachineId} not found`);
        return;
      }

      // Check if next machine can accept part
      if (nextMachine.canAccept()) {
        // Transfer immediately
        machine.setIdle(this.currentTime);
        this.scheduleStartProcessing(nextMachine, part);
      } else if (nextMachine.canEnqueue()) {
        // Queue at next machine, current machine becomes idle
        machine.setIdle(this.currentTime);
        nextMachine.enqueue(part, this.currentTime);
      } else {
        // Next machine queue is full - current machine becomes blocked
        machine.setBlocked(this.currentTime);
        // Part stays with current machine until next machine has space
        // (In a real implementation, we'd need a mechanism to retry)
      }
    } else {
      // Part exits system
      machine.setIdle(this.currentTime);
      part.complete(this.currentTime);

      // Record completed part (only after warmup)
      if (this.currentTime >= this.config.warmupTime) {
        this.completedParts.push(part);
        this.stats.recordSample('cycleTime', part.getCycleTime());
        this.stats.recordSample('valueAddTime', part.getValueAddedTime());
        this.stats.recordSample('waitTime', part.getTotalWaitTime());
      }
    }

    // If machine is now idle and has queue, start next part
    if (machine.state === 'idle' && machine.getQueueLength() > 0) {
      const nextPart = machine.dequeue(this.currentTime);
      if (nextPart) {
        this.scheduleStartProcessing(machine, nextPart);
      }
    }
  }

  /**
   * Handle END_SIMULATION event
   */
  private handleEndSimulation(_event: SimulationEvent): void {
    console.log(`[DES Engine] Simulation ended at time ${this.currentTime}`);

    // Finalize all machine statistics
    this.machines.forEach(machine => {
      machine.finalize(this.currentTime);
    });

    // Set statistics time bounds
    this.stats.setTimeBounds(this.config.warmupTime, this.currentTime);
  }

  /**
   * Schedule arrival event
   */
  private scheduleArrival(time: number): void {
    this.eventQueue.enqueue({
      time,
      type: 'ARRIVAL'
    });
  }

  /**
   * Schedule start processing event
   */
  private scheduleStartProcessing(machine: Machine, part: Part): void {
    this.eventQueue.enqueue({
      time: this.currentTime,
      type: 'START_PROCESSING',
      machineId: machine.id,
      partId: part.id
    });
  }

  /**
   * Update time-weighted statistics
   */
  private updateTimeWeightedStats(): void {
    this.machines.forEach(machine => {
      // Utilization (1 if busy, 0 otherwise)
      this.stats.recordTimeWeighted(
        `utilization_${machine.id}`,
        machine.state === 'busy' ? 1 : 0,
        this.currentTime
      );

      // Queue length
      this.stats.recordTimeWeighted(
        `queue_${machine.id}`,
        machine.getQueueLength(),
        this.currentTime
      );

      // Blocked indicator
      this.stats.recordTimeWeighted(
        `blocked_${machine.id}`,
        machine.state === 'blocked' ? 1 : 0,
        this.currentTime
      );
    });

    // WIP level (total parts in system)
    const wipLevel = this.parts.size - this.completedParts.length;
    this.stats.recordTimeWeighted('wipLevel', wipLevel, this.currentTime);
  }

  /**
   * Collect statistics from current replication
   */
  private collectStatistics(): ReplicationResult {
    const duration = this.config.simulationTime;

    // Throughput (parts completed / time)
    const throughput = this.completedParts.length / (duration / 60); // parts per hour

    // Cycle time stats
    const cycleTimeStat = this.stats.getSampleStat('cycleTime');
    const cycleTime = cycleTimeStat ? cycleTimeStat.getMean() : 0;

    // Value-add time
    const valueAddTimeStat = this.stats.getSampleStat('valueAddTime');
    const valueAddTime = valueAddTimeStat ? valueAddTimeStat.getMean() : 0;

    // Wait time
    const waitTimeStat = this.stats.getSampleStat('waitTime');
    const waitTime = waitTimeStat ? waitTimeStat.getMean() : 0;

    // WIP level
    const wipLevel = this.stats.getTimeWeightedMean('wipLevel');

    // Machine statistics
    const machineUtilization: Record<string, number> = {};
    const machineQueues: Record<string, number> = {};
    const machineBlocked: Record<string, number> = {};
    const machinePartsProcessed: Record<string, number> = {};

    this.machines.forEach(machine => {
      machineUtilization[machine.id] = this.stats.getTimeWeightedMean(`utilization_${machine.id}`);
      machineQueues[machine.id] = this.stats.getTimeWeightedMean(`queue_${machine.id}`);
      machineBlocked[machine.id] = this.stats.getTimeWeightedMean(`blocked_${machine.id}`);
      machinePartsProcessed[machine.id] = machine.partsProcessed;
    });

    return {
      replicationNumber: 0, // Will be set by caller
      throughput,
      cycleTime,
      valueAddTime,
      waitTime,
      wipLevel,
      machineUtilization,
      machineQueues,
      machineBlocked,
      machinePartsProcessed
    };
  }

  /**
   * Aggregate results from all replications
   */
  private aggregateResults(replications: ReplicationResult[]): SimulationResults {
    // Aggregate metrics
    const aggregated = AggregateStatistics.aggregate(replications);

    // Aggregate machine statistics
    const machineIds = Array.from(this.machines.keys());
    const machineStats = AggregateStatistics.aggregateMachineStats(replications, machineIds);

    // Identify bottleneck (highest utilization)
    let bottleneckId = machineIds[0];
    let maxUtilization = 0;

    machineStats.forEach((stats, machineId) => {
      if (stats.utilization.mean > maxUtilization) {
        maxUtilization = stats.utilization.mean;
        bottleneckId = machineId;
      }
    });

    const bottleneckStats = machineStats.get(bottleneckId)!;

    return {
      throughput: aggregated.throughput,
      cycleTime: aggregated.cycleTime,
      valueAddTime: aggregated.valueAddTime,
      waitTime: aggregated.waitTime,
      wipLevel: aggregated.wipLevel,
      bottleneck: {
        machineId: bottleneckId,
        utilization: bottleneckStats.utilization.mean,
        averageQueue: bottleneckStats.averageQueue.mean,
        blockedTimePercent: bottleneckStats.blockedTimePercent.mean,
        lostThroughput: aggregated.throughput.mean * (1 - bottleneckStats.utilization.mean),
        severity: bottleneckStats.utilization.mean > 0.95 ? 'high' :
                  bottleneckStats.utilization.mean > 0.85 ? 'medium' : 'low',
        reason: `Highest utilization: ${(bottleneckStats.utilization.mean * 100).toFixed(1)}% with average queue of ${bottleneckStats.averageQueue.mean.toFixed(1)} parts`
      },
      machines: machineIds.map(id => ({
        id,
        ...machineStats.get(id)!
      })),
      completionTime: Date.now(),
      replicationsCompleted: replications.length
    };
  }

  /**
   * Reset simulation state for next replication
   */
  private reset(): void {
    this.currentTime = 0;
    this.partIdCounter = 0;
    this.eventQueue.clear();
    this.parts.clear();
    this.completedParts = [];
    this.stats.reset();

    // Reset all machines
    this.machines.forEach(machine => machine.reset());
  }
}
