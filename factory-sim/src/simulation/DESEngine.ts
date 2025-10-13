/**
 * Discrete Event Simulation Engine
 *
 * A complete DES engine that actually simulates entity flow through processes
 * with proper event scheduling, resource management, and statistics collection
 */

export enum EventType {
  ENTITY_ARRIVAL = 'ENTITY_ARRIVAL',
  START_PROCESS = 'START_PROCESS',
  END_PROCESS = 'END_PROCESS',
  RESOURCE_SEIZED = 'RESOURCE_SEIZED',
  RESOURCE_RELEASED = 'RESOURCE_RELEASED',
  ENTITY_DEPARTURE = 'ENTITY_DEPARTURE'
}

export interface SimEvent {
  id: string;
  type: EventType;
  time: number;
  entityId?: string;
  resourceId?: string;
  processId?: string;
  data?: any;
}

export interface Entity {
  id: string;
  type: string;
  arrivalTime: number;
  currentProcess: string | null;
  currentResource: string | null;
  state: 'created' | 'traveling' | 'waiting' | 'processing' | 'departed';
  position: { x: number; y: number };
  targetPosition: { x: number; y: number };
  attributes: Record<string, any>;
  history: Array<{
    time: number;
    event: string;
    location: string;
  }>;
}

export interface Resource {
  id: string;
  name: string;
  capacity: number;
  currentLoad: number;
  queue: string[]; // Entity IDs
  statistics: {
    totalBusy: number;
    totalIdle: number;
    totalSeized: number;
    maxQueue: number;
  };
}

export interface Process {
  id: string;
  name: string;
  resourceId: string;
  processingTime: {
    distribution: 'constant' | 'exponential' | 'normal' | 'triangular' | 'uniform';
    params: any;
  };
  nextProcessId: string | null;
}

export interface SimulationStats {
  totalEntitiesCreated: number;
  totalEntitiesDeparted: number;
  avgCycleTime: number;
  avgWaitTime: number;
  avgProcessTime: number;
  resourceUtilization: Record<string, number>;
  throughput: number;
}

export class DESEngine {
  // Core simulation state
  private currentTime: number = 0;
  private eventQueue: SimEvent[] = [];
  private entities: Map<string, Entity> = new Map();
  private resources: Map<string, Resource> = new Map();
  private processes: Map<string, Process> = new Map();

  // Statistics
  private stats: SimulationStats = {
    totalEntitiesCreated: 0,
    totalEntitiesDeparted: 0,
    avgCycleTime: 0,
    avgWaitTime: 0,
    avgProcessTime: 0,
    resourceUtilization: {},
    throughput: 0
  };

  // Tracking
  private cycleTimes: number[] = [];
  private waitTimes: number[] = [];
  private processTimes: number[] = [];

  // Configuration
  private firstProcessId: string | null = null;
  private arrivalRate: number = 1; // entities per minute
  private maxSimTime: number = 1000;

  // Event callbacks for visualization
  private eventCallbacks: Array<(event: SimEvent, entities: Entity[], resources: Resource[]) => void> = [];

  constructor() {}

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  addResource(id: string, name: string, capacity: number): void {
    this.resources.set(id, {
      id,
      name,
      capacity,
      currentLoad: 0,
      queue: [],
      statistics: {
        totalBusy: 0,
        totalIdle: 0,
        totalSeized: 0,
        maxQueue: 0
      }
    });
  }

  addProcess(id: string, name: string, resourceId: string, processingTime: any, nextProcessId: string | null = null): void {
    this.processes.set(id, {
      id,
      name,
      resourceId,
      processingTime,
      nextProcessId
    });

    if (!this.firstProcessId) {
      this.firstProcessId = id;
    }
  }

  setArrivalRate(rate: number): void {
    this.arrivalRate = rate;
  }

  setMaxSimTime(time: number): void {
    this.maxSimTime = time;
  }

  onEvent(callback: (event: SimEvent, entities: Entity[], resources: Resource[]) => void): void {
    this.eventCallbacks.push(callback);
  }

  // ============================================================================
  // EVENT SCHEDULING
  // ============================================================================

  private scheduleEvent(type: EventType, delay: number, data?: any): void {
    const event: SimEvent = {
      id: `evt-${Date.now()}-${Math.random()}`,
      type,
      time: this.currentTime + delay,
      ...data
    };

    // Insert event in time-ordered queue
    const insertIndex = this.eventQueue.findIndex(e => e.time > event.time);
    if (insertIndex === -1) {
      this.eventQueue.push(event);
    } else {
      this.eventQueue.splice(insertIndex, 0, event);
    }
  }

  private getNextEvent(): SimEvent | null {
    return this.eventQueue.shift() || null;
  }

  // ============================================================================
  // ENTITY MANAGEMENT
  // ============================================================================

  private createEntity(type: string): Entity {
    const id = `entity-${this.stats.totalEntitiesCreated}`;
    const entity: Entity = {
      id,
      type,
      arrivalTime: this.currentTime,
      currentProcess: null,
      currentResource: null,
      state: 'created',
      position: { x: 50, y: 300 },
      targetPosition: { x: 50, y: 300 },
      attributes: {},
      history: [{
        time: this.currentTime,
        event: 'CREATED',
        location: 'ENTRY'
      }]
    };

    this.entities.set(id, entity);
    this.stats.totalEntitiesCreated++;

    return entity;
  }

  private moveEntityToProcess(entityId: string, processId: string): void {
    const entity = this.entities.get(entityId);
    const process = this.processes.get(processId);
    const resource = this.resources.get(process!.resourceId);

    if (!entity || !process || !resource) return;

    entity.currentProcess = processId;
    entity.state = 'traveling';

    // Schedule arrival at resource
    const travelTime = 0.5; // Fixed for now
    this.scheduleEvent(EventType.START_PROCESS, travelTime, {
      entityId,
      processId,
      resourceId: resource.id
    });
  }

  // ============================================================================
  // RESOURCE MANAGEMENT
  // ============================================================================

  private trySeizeResource(entityId: string, resourceId: string, processId: string): boolean {
    const resource = this.resources.get(resourceId);
    const entity = this.entities.get(entityId);

    if (!resource || !entity) return false;

    if (resource.currentLoad < resource.capacity) {
      // Resource available
      resource.currentLoad++;
      resource.statistics.totalSeized++;
      entity.currentResource = resourceId;
      entity.state = 'processing';

      entity.history.push({
        time: this.currentTime,
        event: 'SEIZED_RESOURCE',
        location: resource.name
      });

      return true;
    } else {
      // Resource busy - add to queue
      if (!resource.queue.includes(entityId)) {
        resource.queue.push(entityId);
        resource.statistics.maxQueue = Math.max(resource.statistics.maxQueue, resource.queue.length);
        entity.state = 'waiting';

        entity.history.push({
          time: this.currentTime,
          event: 'QUEUED',
          location: resource.name
        });
      }
      return false;
    }
  }

  private releaseResource(entityId: string, resourceId: string): void {
    const resource = this.resources.get(resourceId);
    const entity = this.entities.get(entityId);

    if (!resource || !entity) return;

    resource.currentLoad--;
    entity.currentResource = null;

    entity.history.push({
      time: this.currentTime,
      event: 'RELEASED_RESOURCE',
      location: resource.name
    });

    // Check if anyone is waiting
    if (resource.queue.length > 0) {
      const nextEntityId = resource.queue.shift()!;
      this.scheduleEvent(EventType.START_PROCESS, 0, {
        entityId: nextEntityId,
        processId: this.entities.get(nextEntityId)!.currentProcess,
        resourceId
      });
    }
  }

  // ============================================================================
  // DISTRIBUTION SAMPLING
  // ============================================================================

  private sampleProcessingTime(distribution: any): number {
    const { distribution: type, params } = distribution;

    switch (type) {
      case 'constant':
        return params.value || 1;

      case 'exponential':
        return -Math.log(1 - Math.random()) / (params.rate || 1);

      case 'uniform':
        return params.min + Math.random() * (params.max - params.min);

      case 'normal':
        // Box-Muller transform
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return (params.mean || 0) + z0 * (params.stdDev || 1);

      case 'triangular':
        const u = Math.random();
        const { min, mode, max } = params;
        if (u < (mode - min) / (max - min)) {
          return min + Math.sqrt(u * (max - min) * (mode - min));
        } else {
          return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
        }

      default:
        return 1;
    }
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  private handleEntityArrival(event: SimEvent): void {
    const entity = this.createEntity(event.data?.entityType || 'Entity');

    // Move to first process
    if (this.firstProcessId) {
      this.moveEntityToProcess(entity.id, this.firstProcessId);
    }

    // Schedule next arrival (continue until maxSimTime)
    const interarrivalTime = -Math.log(Math.random()) / this.arrivalRate;
    const nextArrivalTime = this.currentTime + interarrivalTime;

    if (nextArrivalTime < this.maxSimTime) {
      this.scheduleEvent(EventType.ENTITY_ARRIVAL, interarrivalTime, {
        entityType: event.data?.entityType || 'Entity'
      });
    }
  }

  private handleStartProcess(event: SimEvent): void {
    const { entityId, processId, resourceId } = event;

    if (!entityId || !processId || !resourceId) return;

    const seized = this.trySeizeResource(entityId, resourceId, processId);

    if (seized) {
      // Start processing
      const process = this.processes.get(processId);
      if (!process) return;

      const processingTime = this.sampleProcessingTime(process.processingTime);
      this.processTimes.push(processingTime);

      this.scheduleEvent(EventType.END_PROCESS, processingTime, {
        entityId,
        processId,
        resourceId
      });
    }
  }

  private handleEndProcess(event: SimEvent): void {
    const { entityId, processId, resourceId } = event;

    if (!entityId || !processId || !resourceId) return;

    this.releaseResource(entityId, resourceId);

    const process = this.processes.get(processId);
    const entity = this.entities.get(entityId);

    if (!process || !entity) return;

    // Move to next process or depart
    if (process.nextProcessId) {
      this.moveEntityToProcess(entityId, process.nextProcessId);
    } else {
      // Entity completes system
      entity.state = 'departed';
      const cycleTime = this.currentTime - entity.arrivalTime;
      this.cycleTimes.push(cycleTime);
      this.stats.totalEntitiesDeparted++;

      entity.history.push({
        time: this.currentTime,
        event: 'DEPARTED',
        location: 'EXIT'
      });
    }
  }

  private processEvent(event: SimEvent): void {
    this.currentTime = event.time;

    switch (event.type) {
      case EventType.ENTITY_ARRIVAL:
        this.handleEntityArrival(event);
        break;

      case EventType.START_PROCESS:
        this.handleStartProcess(event);
        break;

      case EventType.END_PROCESS:
        this.handleEndProcess(event);
        break;
    }

    // Notify callbacks
    this.notifyCallbacks(event);
  }

  private notifyCallbacks(event: SimEvent): void {
    const entities = Array.from(this.entities.values());
    const resources = Array.from(this.resources.values());

    this.eventCallbacks.forEach(callback => {
      callback(event, entities, resources);
    });
  }

  // ============================================================================
  // SIMULATION CONTROL
  // ============================================================================

  initialize(): void {
    this.currentTime = 0;
    this.eventQueue = [];
    this.entities.clear();
    this.stats = {
      totalEntitiesCreated: 0,
      totalEntitiesDeparted: 0,
      avgCycleTime: 0,
      avgWaitTime: 0,
      avgProcessTime: 0,
      resourceUtilization: {},
      throughput: 0
    };
    this.cycleTimes = [];
    this.waitTimes = [];
    this.processTimes = [];

    // Schedule first arrival
    this.scheduleEvent(EventType.ENTITY_ARRIVAL, 0, { entityType: 'Entity' });
  }

  step(): boolean {
    const event = this.getNextEvent();

    // Only stop when there are no more events (let system drain)
    if (!event) {
      // No more events - simulation truly complete
      if (this.currentTime < this.maxSimTime) {
        this.currentTime = this.maxSimTime;
      }
      this.computeFinalStats();
      return false;
    }

    // Process ALL events, even those after maxSimTime, to drain the system
    this.processEvent(event);
    return true;
  }

  run(): void {
    while (this.step()) {
      // Run until completion
    }
    this.computeFinalStats();
  }

  private computeFinalStats(): void {
    // Use actual simulation time (could be less than maxSimTime if ran out of events)
    const simTime = this.currentTime > 0 ? this.currentTime : this.maxSimTime;

    // Compute averages
    this.stats.avgCycleTime = this.cycleTimes.length > 0
      ? this.cycleTimes.reduce((a, b) => a + b, 0) / this.cycleTimes.length
      : 0;

    this.stats.avgProcessTime = this.processTimes.length > 0
      ? this.processTimes.reduce((a, b) => a + b, 0) / this.processTimes.length
      : 0;

    // Throughput based on actual simulation time
    this.stats.throughput = this.stats.totalEntitiesDeparted / simTime;

    // Resource utilization based on actual time
    this.resources.forEach((resource, id) => {
      // Utilization = (Total Busy Time) / (Capacity * Simulation Time)
      // For now, approximate as seized count * avg process time / (capacity * simTime)
      const busyTime = resource.statistics.totalSeized * this.stats.avgProcessTime;
      const availableTime = resource.capacity * simTime;
      this.stats.resourceUtilization[id] = Math.min(1.0, busyTime / availableTime);
    });
  }

  getStats(): SimulationStats {
    return { ...this.stats };
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  getEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  getResources(): Resource[] {
    return Array.from(this.resources.values());
  }
}
