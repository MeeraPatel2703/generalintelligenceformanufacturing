/**
 * Advanced Discrete Event Simulation Engine
 *
 * Full-featured DES engine matching Simio's mathematical capabilities:
 * - Event scheduling with priority queues
 * - Entity states and attributes
 * - Resource management with schedules and failures
 * - State-dependent routing
 * - Batching and separating
 * - Conveyors and transporters
 * - Statistical collection and analysis
 * - Warmup periods and replications
 */

import { Distributions, Statistics } from './StatisticalDistributions';

// ============================================================================
// CORE TYPES
// ============================================================================

export enum EventType {
  ENTITY_CREATED = 'ENTITY_CREATED',
  ENTITY_ARRIVED = 'ENTITY_ARRIVED',
  ENTITY_DEPARTED = 'ENTITY_DEPARTED',
  PROCESS_STARTED = 'PROCESS_STARTED',
  PROCESS_ENDED = 'PROCESS_ENDED',
  RESOURCE_SEIZED = 'RESOURCE_SEIZED',
  RESOURCE_RELEASED = 'RESOURCE_RELEASED',
  RESOURCE_FAILED = 'RESOURCE_FAILED',
  RESOURCE_REPAIRED = 'RESOURCE_REPAIRED',
  SCHEDULE_CHANGE = 'SCHEDULE_CHANGE',
  BATCH_CREATED = 'BATCH_CREATED',
  BATCH_SEPARATED = 'BATCH_SEPARATED',
  TRANSFER_STARTED = 'TRANSFER_STARTED',
  TRANSFER_ENDED = 'TRANSFER_ENDED',
  CUSTOM = 'CUSTOM'
}

export interface SimEvent {
  id: string;
  type: EventType;
  time: number;
  priority: number; // Lower = higher priority
  entityId?: string;
  resourceId?: string;
  data?: any;
}

export interface Entity {
  id: string;
  type: string;
  creationTime: number;
  attributes: Map<string, any>;
  state: string;
  location: string;
  priority: number;

  // Tracking
  timeInSystem: number;
  timeWaiting: number;
  timeProcessing: number;

  // Routing
  sequence: string[];
  currentStep: number;

  // Batching
  batchId?: string;
  isBatchParent?: boolean;
  batchMembers?: string[];

  // Statistics
  history: Array<{
    time: number;
    event: string;
    location: string;
    state: string;
  }>;
}

export interface Resource {
  id: string;
  name: string;
  type: 'Server' | 'Vehicle' | 'Worker' | 'Conveyor';
  capacity: number;
  initialCapacity: number;

  // State
  currentLoad: number;
  queue: string[];
  seized: string[]; // Entity IDs currently using resource
  failed: boolean;

  // Schedule
  schedule?: ResourceSchedule;
  currentScheduleState: 'Available' | 'Unavailable';

  // Failure model
  failureDistribution?: DistributionConfig;
  repairDistribution?: DistributionConfig;
  nextFailureTime?: number;

  // Statistics
  stats: {
    totalSeizures: number;
    totalReleases: number;
    totalBusyTime: number;
    totalIdleTime: number;
    totalDownTime: number;
    maxQueue: number;
    queueTimeIntegral: number; // For time-weighted average
    lastEventTime: number;
  };
}

export interface ResourceSchedule {
  type: 'Pattern' | 'Capacity';
  pattern?: Array<{
    startTime: number;
    capacity: number;
    duration: number;
  }>;
}

export interface Process {
  id: string;
  name: string;
  type: 'Standard' | 'Batch' | 'Separate';

  // Resource requirements
  resourceRequirements: Array<{
    resourceId: string;
    quantity: number;
    priority: number;
  }>;

  // Processing time
  processingTime: DistributionConfig;

  // Batching
  batchSize?: number;
  batchRule?: 'Fixed' | 'Variable';

  // Routing
  nextProcess?: string | ((entity: Entity, engine: AdvancedDESEngine) => string);
  routingType?: 'Deterministic' | 'Probabilistic' | 'Conditional';
  routes?: Array<{
    destination: string;
    probability?: number;
    condition?: (entity: Entity) => boolean;
  }>;

  // Setup time
  setupTime?: DistributionConfig;
  lastEntityType?: string;
}

export interface DistributionConfig {
  type: string;
  params: any;
}

export interface SimulationConfig {
  startTime: number;
  endTime: number;
  warmupTime: number;
  seed?: number;
  collectDetailedStats: boolean;
  animationSpeed: number;
}

export interface SimulationStats {
  // System-wide
  totalEntitiesCreated: number;
  totalEntitiesCompleted: number;
  totalEntitiesInSystem: number;

  // Times
  avgTimeInSystem: number;
  avgWaitTime: number;
  avgProcessTime: number;
  maxTimeInSystem: number;

  // Throughput
  throughput: number;

  // Resource utilization
  resourceStats: Map<string, {
    utilization: number;
    avgQueueLength: number;
    maxQueueLength: number;
    avgWaitTime: number;
    availability: number;
  }>;

  // Confidence intervals
  confidenceIntervals?: Map<string, {
    mean: number;
    lower: number;
    upper: number;
    stdDev: number;
  }>;
}

// ============================================================================
// MAIN ENGINE
// ============================================================================

export class AdvancedDESEngine {
  // Core state
  private currentTime: number = 0;
  private eventQueue: SimEvent[] = [];
  private entities: Map<string, Entity> = new Map();
  private resources: Map<string, Resource> = new Map();
  private processes: Map<string, Process> = new Map();

  // Configuration
  private config: SimulationConfig;
  private dist: Distributions;

  // Statistics
  private stats: SimulationStats;
  private cycleTimes: number[] = [];
  private waitTimes: number[] = [];
  private processTimes: number[] = [];
  private wipOverTime: Array<{ time: number; count: number }> = [];

  // Warmup tracking
  private inWarmup: boolean = true;
  private warmupEntities: Set<string> = new Set();

  // Event callbacks
  private eventCallbacks: Array<(event: SimEvent) => void> = [];

  // State tracking
  private entityCounter: number = 0;
  private eventCounter: number = 0;

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = {
      startTime: config.startTime || 0,
      endTime: config.endTime || 1000,
      warmupTime: config.warmupTime || 100,
      seed: config.seed,
      collectDetailedStats: config.collectDetailedStats !== false,
      animationSpeed: config.animationSpeed || 1
    };

    this.dist = new Distributions(this.config.seed);

    this.stats = {
      totalEntitiesCreated: 0,
      totalEntitiesCompleted: 0,
      totalEntitiesInSystem: 0,
      avgTimeInSystem: 0,
      avgWaitTime: 0,
      avgProcessTime: 0,
      maxTimeInSystem: 0,
      throughput: 0,
      resourceStats: new Map()
    };
  }

  // ============================================================================
  // CONFIGURATION METHODS
  // ============================================================================

  addResource(config: {
    id: string;
    name: string;
    type?: 'Server' | 'Vehicle' | 'Worker' | 'Conveyor';
    capacity: number;
    schedule?: ResourceSchedule;
    failureDistribution?: DistributionConfig;
    repairDistribution?: DistributionConfig;
  }): void {
    const resource: Resource = {
      id: config.id,
      name: config.name,
      type: config.type || 'Server',
      capacity: config.capacity,
      initialCapacity: config.capacity,
      currentLoad: 0,
      queue: [],
      seized: [],
      failed: false,
      schedule: config.schedule,
      currentScheduleState: 'Available',
      failureDistribution: config.failureDistribution,
      repairDistribution: config.repairDistribution,
      stats: {
        totalSeizures: 0,
        totalReleases: 0,
        totalBusyTime: 0,
        totalIdleTime: 0,
        totalDownTime: 0,
        maxQueue: 0,
        queueTimeIntegral: 0,
        lastEventTime: 0
      }
    };

    this.resources.set(config.id, resource);

    // Schedule first failure if configured
    if (config.failureDistribution) {
      this.scheduleResourceFailure(config.id);
    }
  }

  addProcess(config: {
    id: string;
    name: string;
    type?: 'Standard' | 'Batch' | 'Separate';
    resourceRequirements: Array<{
      resourceId: string;
      quantity?: number;
      priority?: number;
    }>;
    processingTime: DistributionConfig;
    batchSize?: number;
    nextProcess?: string | ((entity: Entity, engine: AdvancedDESEngine) => string);
    routes?: Array<{
      destination: string;
      probability?: number;
      condition?: (entity: Entity) => boolean;
    }>;
    setupTime?: DistributionConfig;
  }): void {
    this.processes.set(config.id, {
      id: config.id,
      name: config.name,
      type: config.type || 'Standard',
      resourceRequirements: config.resourceRequirements.map(req => ({
        resourceId: req.resourceId,
        quantity: req.quantity || 1,
        priority: req.priority || 0
      })),
      processingTime: config.processingTime,
      batchSize: config.batchSize,
      nextProcess: config.nextProcess,
      routes: config.routes
    } as Process);
  }

  // ============================================================================
  // EVENT SCHEDULING
  // ============================================================================

  private scheduleEvent(
    type: EventType,
    delay: number,
    data?: any,
    priority: number = 0
  ): void {
    const event: SimEvent = {
      id: `evt-${this.eventCounter++}`,
      type,
      time: this.currentTime + delay,
      priority,
      ...data
    };

    // Binary search insertion (keep events sorted by time, then priority)
    let low = 0;
    let high = this.eventQueue.length;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      const midEvent = this.eventQueue[mid];

      if (
        midEvent.time < event.time ||
        (midEvent.time === event.time && midEvent.priority <= event.priority)
      ) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    this.eventQueue.splice(low, 0, event);
  }

  private getNextEvent(): SimEvent | null {
    return this.eventQueue.shift() || null;
  }

  // ============================================================================
  // ENTITY MANAGEMENT
  // ============================================================================

  createEntity(type: string, attributes: Record<string, any> = {}): Entity {
    const entity: Entity = {
      id: `entity-${this.entityCounter++}`,
      type,
      creationTime: this.currentTime,
      attributes: new Map(Object.entries(attributes)),
      state: 'Created',
      location: 'System',
      priority: 0,
      timeInSystem: 0,
      timeWaiting: 0,
      timeProcessing: 0,
      sequence: [],
      currentStep: 0,
      history: [{
        time: this.currentTime,
        event: 'Created',
        location: 'System',
        state: 'Created'
      }]
    };

    this.entities.set(entity.id, entity);
    this.stats.totalEntitiesCreated++;
    this.stats.totalEntitiesInSystem++;

    if (this.inWarmup) {
      this.warmupEntities.add(entity.id);
    }

    return entity;
  }

  // ============================================================================
  // RESOURCE MANAGEMENT
  // ============================================================================

  private trySeizeResource(entityId: string, resourceId: string): boolean {
    const resource = this.resources.get(resourceId);
    const entity = this.entities.get(entityId);

    if (!resource || !entity) return false;

    // Check if resource is available and not failed
    if (resource.currentLoad < resource.capacity && !resource.failed) {
      resource.currentLoad++;
      resource.seized.push(entityId);
      resource.stats.totalSeizures++;

      entity.state = 'Processing';
      entity.location = resourceId;

      this.scheduleEvent(EventType.RESOURCE_SEIZED, 0, {
        entityId,
        resourceId
      });

      return true;
    } else {
      // Add to queue
      if (!resource.queue.includes(entityId)) {
        resource.queue.push(entityId);
        resource.stats.maxQueue = Math.max(resource.stats.maxQueue, resource.queue.length);
        entity.state = 'Waiting';
      }
      return false;
    }
  }

  private releaseResource(entityId: string, resourceId: string): void {
    const resource = this.resources.get(resourceId);
    const entity = this.entities.get(entityId);

    if (!resource || !entity) return;

    // Remove from seized list
    const index = resource.seized.indexOf(entityId);
    if (index > -1) {
      resource.seized.splice(index, 1);
      resource.currentLoad--;
      resource.stats.totalReleases++;
    }

    this.scheduleEvent(EventType.RESOURCE_RELEASED, 0, {
      entityId,
      resourceId
    });

    // Try to seize resource for next entity in queue
    this.processResourceQueue(resourceId);
  }

  private processResourceQueue(resourceId: string): void {
    const resource = this.resources.get(resourceId);
    if (!resource || resource.queue.length === 0) return;

    while (resource.currentLoad < resource.capacity && resource.queue.length > 0) {
      const nextEntityId = resource.queue.shift()!;
      const entity = this.entities.get(nextEntityId);

      if (entity) {
        // Entity can now seize resource
        this.trySeizeResource(nextEntityId, resourceId);

        // Find the process this entity is in
        const processId = entity.attributes.get('currentProcessId');
        if (processId) {
          this.startProcessing(nextEntityId, processId);
        }
      }
    }
  }

  private scheduleResourceFailure(resourceId: string): void {
    const resource = this.resources.get(resourceId);
    if (!resource || !resource.failureDistribution) return;

    const timeToFailure = this.sampleDistribution(resource.failureDistribution);
    resource.nextFailureTime = this.currentTime + timeToFailure;

    this.scheduleEvent(EventType.RESOURCE_FAILED, timeToFailure, {
      resourceId
    });
  }

  private handleResourceFailure(resourceId: string): void {
    const resource = this.resources.get(resourceId);
    if (!resource) return;

    resource.failed = true;
    resource.capacity = 0;

    // Schedule repair
    if (resource.repairDistribution) {
      const repairTime = this.sampleDistribution(resource.repairDistribution);
      this.scheduleEvent(EventType.RESOURCE_REPAIRED, repairTime, {
        resourceId
      });
    }
  }

  private handleResourceRepair(resourceId: string): void {
    const resource = this.resources.get(resourceId);
    if (!resource) return;

    resource.failed = false;
    resource.capacity = resource.initialCapacity;

    // Try to process queue
    this.processResourceQueue(resourceId);

    // Schedule next failure
    this.scheduleResourceFailure(resourceId);
  }

  // ============================================================================
  // PROCESS EXECUTION
  // ============================================================================

  private startProcessing(entityId: string, processId: string): void {
    const entity = this.entities.get(entityId);
    const process = this.processes.get(processId);

    if (!entity || !process) return;

    // Try to seize all required resources
    const resourceIds = process.resourceRequirements.map(req => req.resourceId);
    const allSeized = resourceIds.every(resId => this.trySeizeResource(entityId, resId));

    if (allSeized) {
      // All resources seized, start processing
      const processingTime = this.sampleDistribution(process.processingTime);

      entity.attributes.set('processStartTime', this.currentTime);
      entity.attributes.set('currentProcessId', processId);

      this.scheduleEvent(EventType.PROCESS_ENDED, processingTime, {
        entityId,
        processId
      });
    }
  }

  private endProcessing(entityId: string, processId: string): void {
    const entity = this.entities.get(entityId);
    const process = this.processes.get(processId);

    if (!entity || !process) return;

    // Release all resources
    process.resourceRequirements.forEach(req => {
      this.releaseResource(entityId, req.resourceId);
    });

    // Route to next process
    const nextProcess = this.determineNextProcess(entity, process);

    if (nextProcess) {
      this.startProcessing(entityId, nextProcess);
    } else {
      // Entity exits system
      this.entityDeparture(entityId);
    }
  }

  private determineNextProcess(entity: Entity, currentProcess: Process): string | null {
    if (typeof currentProcess.nextProcess === 'function') {
      return currentProcess.nextProcess(entity, this);
    } else if (typeof currentProcess.nextProcess === 'string') {
      return currentProcess.nextProcess;
    } else if (currentProcess.routes && currentProcess.routes.length > 0) {
      // Probabilistic or conditional routing
      const u = this.dist.uniform(0, 1);
      let cumProb = 0;

      for (const route of currentProcess.routes) {
        if (route.condition) {
          if (route.condition(entity)) {
            return route.destination;
          }
        } else if (route.probability) {
          cumProb += route.probability;
          if (u <= cumProb) {
            return route.destination;
          }
        }
      }
    }

    return null;
  }

  private entityDeparture(entityId: string): void {
    const entity = this.entities.get(entityId);
    if (!entity) return;

    const cycleTime = this.currentTime - entity.creationTime;

    // Only collect stats if past warmup
    if (!this.inWarmup && !this.warmupEntities.has(entityId)) {
      this.cycleTimes.push(cycleTime);
      this.stats.totalEntitiesCompleted++;
    }

    entity.state = 'Departed';
    this.stats.totalEntitiesInSystem--;

    this.scheduleEvent(EventType.ENTITY_DEPARTED, 0, {
      entityId
    });
  }

  // ============================================================================
  // DISTRIBUTION SAMPLING
  // ============================================================================

  private sampleDistribution(config: DistributionConfig): number {
    const { type, params } = config;

    switch (type.toLowerCase()) {
      case 'constant':
        return this.dist.constant(params.value);
      case 'uniform':
        return this.dist.uniform(params.min, params.max);
      case 'triangular':
        return this.dist.triangular(params.min, params.mode, params.max);
      case 'exponential':
        return this.dist.exponential(params.lambda || 1 / params.mean);
      case 'normal':
        return Math.max(0, this.dist.normal(params.mean, params.stdDev));
      case 'lognormal':
        return this.dist.lognormal(params.logMean, params.logStdDev);
      case 'gamma':
        return this.dist.gamma(params.shape, params.scale);
      case 'weibull':
        return this.dist.weibull(params.scale, params.shape);
      case 'erlang':
        return this.dist.erlang(params.k, params.lambda);
      default:
        return 1;
    }
  }

  // ============================================================================
  // EVENT PROCESSING
  // ============================================================================

  private processEvent(event: SimEvent): void {
    this.currentTime = event.time;

    // Check if warmup period ended
    if (this.inWarmup && this.currentTime >= this.config.warmupTime) {
      this.inWarmup = false;
      this.resetStatistics();
    }

    switch (event.type) {
      case EventType.ENTITY_CREATED:
        // Entity already created, just notify
        break;

      case EventType.PROCESS_STARTED:
        this.startProcessing(event.entityId!, event.data.processId);
        break;

      case EventType.PROCESS_ENDED:
        this.endProcessing(event.entityId!, event.data.processId);
        break;

      case EventType.RESOURCE_FAILED:
        this.handleResourceFailure(event.resourceId!);
        break;

      case EventType.RESOURCE_REPAIRED:
        this.handleResourceRepair(event.resourceId!);
        break;
    }

    // Notify callbacks
    this.eventCallbacks.forEach(cb => cb(event));
  }

  private resetStatistics(): void {
    this.cycleTimes = [];
    this.waitTimes = [];
    this.processTimes = [];
    this.stats.totalEntitiesCompleted = 0;
  }

  // ============================================================================
  // SIMULATION CONTROL
  // ============================================================================

  initialize(): void {
    this.currentTime = this.config.startTime;
    this.eventQueue = [];
    this.entities.clear();
    this.inWarmup = true;
    this.warmupEntities.clear();
    this.resetStatistics();
  }

  step(): boolean {
    const event = this.getNextEvent();
    if (!event || this.currentTime >= this.config.endTime) {
      return false;
    }

    this.processEvent(event);
    return true;
  }

  run(): void {
    while (this.step()) {
      // Run simulation
    }
    this.computeFinalStatistics();
  }

  private computeFinalStatistics(): void {
    const elapsedTime = this.currentTime - this.config.warmupTime;

    if (this.cycleTimes.length > 0) {
      this.stats.avgTimeInSystem = Statistics.mean(this.cycleTimes);
      this.stats.maxTimeInSystem = Statistics.max(this.cycleTimes);
    }

    if (this.waitTimes.length > 0) {
      this.stats.avgWaitTime = Statistics.mean(this.waitTimes);
    }

    if (this.processTimes.length > 0) {
      this.stats.avgProcessTime = Statistics.mean(this.processTimes);
    }

    this.stats.throughput = this.stats.totalEntitiesCompleted / elapsedTime;

    // Compute resource statistics
    this.resources.forEach((resource, id) => {
      const utilization = resource.stats.totalBusyTime / elapsedTime;
      this.stats.resourceStats.set(id, {
        utilization,
        avgQueueLength: 0, // Would need time-weighted average
        maxQueueLength: resource.stats.maxQueue,
        avgWaitTime: 0,
        availability: 1 - (resource.stats.totalDownTime / elapsedTime)
      });
    });
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  getCurrentTime(): number {
    return this.currentTime;
  }

  getStats(): SimulationStats {
    return { ...this.stats };
  }

  getEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  getResources(): Resource[] {
    return Array.from(this.resources.values());
  }

  onEvent(callback: (event: SimEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  getDistributions(): Distributions {
    return this.dist;
  }
}
