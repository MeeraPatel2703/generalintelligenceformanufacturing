// TEST: Verify simulation runs to completion - standalone version
// This copies the essential DESEngine code to test the fixes directly

enum EventType {
  ENTITY_ARRIVAL = 'ENTITY_ARRIVAL',
  START_PROCESS = 'START_PROCESS',
  END_PROCESS = 'END_PROCESS'
}

interface SimEvent {
  id: string;
  type: EventType;
  time: number;
  entityId?: string;
  resourceId?: string;
  processId?: string;
  data?: any;
}

interface Entity {
  id: string;
  type: string;
  arrivalTime: number;
  currentProcess: string | null;
  currentResource: string | null;
  state: 'created' | 'traveling' | 'waiting' | 'processing' | 'departed';
}

interface Resource {
  id: string;
  name: string;
  capacity: number;
  currentLoad: number;
  queue: string[];
  statistics: {
    totalSeized: number;
  };
}

interface Process {
  id: string;
  name: string;
  resourceId: string;
  processingTime: {
    distribution: 'uniform' | 'constant';
    params: any;
  };
  nextProcessId: string | null;
}

interface SimulationStats {
  totalEntitiesCreated: number;
  totalEntitiesDeparted: number;
  avgCycleTime: number;
  avgProcessTime: number;
  resourceUtilization: Record<string, number>;
  throughput: number;
}

class TestDESEngine {
  private currentTime: number = 0;
  private eventQueue: SimEvent[] = [];
  private entities: Map<string, Entity> = new Map();
  private resources: Map<string, Resource> = new Map();
  private processes: Map<string, Process> = new Map();

  private stats: SimulationStats = {
    totalEntitiesCreated: 0,
    totalEntitiesDeparted: 0,
    avgCycleTime: 0,
    avgProcessTime: 0,
    resourceUtilization: {},
    throughput: 0
  };

  private cycleTimes: number[] = [];
  private processTimes: number[] = [];
  private firstProcessId: string | null = null;
  private arrivalRate: number = 1;
  private maxSimTime: number = 1000;

  addResource(id: string, name: string, capacity: number): void {
    this.resources.set(id, {
      id,
      name,
      capacity,
      currentLoad: 0,
      queue: [],
      statistics: { totalSeized: 0 }
    });
  }

  addProcess(id: string, name: string, resourceId: string, processingTime: any, nextProcessId: string | null = null): void {
    this.processes.set(id, { id, name, resourceId, processingTime, nextProcessId });
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

  private scheduleEvent(type: EventType, delay: number, data?: any): void {
    const event: SimEvent = {
      id: `evt-${Date.now()}-${Math.random()}`,
      type,
      time: this.currentTime + delay,
      ...data
    };
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

  private createEntity(type: string): Entity {
    const id = `entity-${this.stats.totalEntitiesCreated}`;
    const entity: Entity = {
      id,
      type,
      arrivalTime: this.currentTime,
      currentProcess: null,
      currentResource: null,
      state: 'created'
    };
    this.entities.set(id, entity);
    this.stats.totalEntitiesCreated++;
    return entity;
  }

  private moveEntityToProcess(entityId: string, processId: string): void {
    const entity = this.entities.get(entityId);
    if (!entity) return;
    entity.currentProcess = processId;
    entity.state = 'traveling';
    this.scheduleEvent(EventType.START_PROCESS, 0.5, {
      entityId,
      processId,
      resourceId: this.processes.get(processId)?.resourceId
    });
  }

  private trySeizeResource(entityId: string, resourceId: string): boolean {
    const resource = this.resources.get(resourceId);
    const entity = this.entities.get(entityId);
    if (!resource || !entity) return false;

    if (resource.currentLoad < resource.capacity) {
      resource.currentLoad++;
      resource.statistics.totalSeized++;
      entity.currentResource = resourceId;
      entity.state = 'processing';
      return true;
    } else {
      if (!resource.queue.includes(entityId)) {
        resource.queue.push(entityId);
        entity.state = 'waiting';
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

    if (resource.queue.length > 0) {
      const nextEntityId = resource.queue.shift()!;
      this.scheduleEvent(EventType.START_PROCESS, 0, {
        entityId: nextEntityId,
        processId: this.entities.get(nextEntityId)!.currentProcess,
        resourceId
      });
    }
  }

  private sampleProcessingTime(distribution: any): number {
    const { distribution: type, params } = distribution;
    if (type === 'uniform') {
      return params.min + Math.random() * (params.max - params.min);
    }
    return params.value || 1;
  }

  private handleEntityArrival(event: SimEvent): void {
    const entity = this.createEntity(event.data?.entityType || 'Entity');

    if (this.firstProcessId) {
      this.moveEntityToProcess(entity.id, this.firstProcessId);
    }

    // FIX 1: Continue scheduling until nextArrivalTime < maxSimTime
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

    const seized = this.trySeizeResource(entityId, resourceId);
    if (seized) {
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

    if (process.nextProcessId) {
      this.moveEntityToProcess(entityId, process.nextProcessId);
    } else {
      entity.state = 'departed';
      const cycleTime = this.currentTime - entity.arrivalTime;
      this.cycleTimes.push(cycleTime);
      this.stats.totalEntitiesDeparted++;
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
  }

  initialize(): void {
    this.currentTime = 0;
    this.eventQueue = [];
    this.entities.clear();
    this.stats = {
      totalEntitiesCreated: 0,
      totalEntitiesDeparted: 0,
      avgCycleTime: 0,
      avgProcessTime: 0,
      resourceUtilization: {},
      throughput: 0
    };
    this.cycleTimes = [];
    this.processTimes = [];

    this.scheduleEvent(EventType.ENTITY_ARRIVAL, 0, { entityType: 'Entity' });
  }

  // FIX 2: Only stop when NO MORE EVENTS (let system drain after maxSimTime)
  step(): boolean {
    const event = this.getNextEvent();

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

  // FIX 3: Use actual simulation time for throughput
  private computeFinalStats(): void {
    const simTime = this.currentTime > 0 ? this.currentTime : this.maxSimTime;

    this.stats.avgCycleTime = this.cycleTimes.length > 0
      ? this.cycleTimes.reduce((a, b) => a + b, 0) / this.cycleTimes.length
      : 0;

    this.stats.avgProcessTime = this.processTimes.length > 0
      ? this.processTimes.reduce((a, b) => a + b, 0) / this.processTimes.length
      : 0;

    this.stats.throughput = this.stats.totalEntitiesDeparted / simTime;

    this.resources.forEach((resource, id) => {
      this.stats.resourceUtilization[id] =
        (resource.statistics.totalSeized * this.stats.avgProcessTime) / simTime;
    });
  }

  getStats(): SimulationStats {
    return { ...this.stats };
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  getResources(): Resource[] {
    return Array.from(this.resources.values());
  }
}

// ============================================================================
// RUN TEST
// ============================================================================

console.log("=== TESTING SIMULATION COMPLETION (STANDALONE) ===\n");

const engine = new TestDESEngine();

console.log("Configuring 3-station system:");
console.log("  Order Station (0/1) → Payment Window (0/1) → Pickup Window (0/1)\n");

engine.addResource('order', 'Order Station', 1);
engine.addResource('payment', 'Payment Window', 1);
engine.addResource('pickup', 'Pickup Window', 1);

engine.addProcess('p-order', 'Order Process', 'order', {
  distribution: 'uniform',
  params: { min: 1, max: 3 }
}, 'p-payment');

engine.addProcess('p-payment', 'Payment Process', 'payment', {
  distribution: 'uniform',
  params: { min: 0.5, max: 1.5 }
}, 'p-pickup');

engine.addProcess('p-pickup', 'Pickup Process', 'pickup', {
  distribution: 'uniform',
  params: { min: 0.5, max: 1 }
}, null);

engine.setArrivalRate(10); // 10 customers per minute
engine.setMaxSimTime(100); // Run for 100 minutes

console.log("Starting simulation (maxSimTime = 100 min)...\n");

engine.initialize();

let steps = 0;
let lastPrintTime = 0;

while (engine.step()) {
  steps++;

  const currentTime = engine.getCurrentTime();
  if (currentTime - lastPrintTime >= 20) {
    const stats = engine.getStats();
    const progress = (currentTime / 100) * 100;
    console.log(`Time: ${currentTime.toFixed(1)} min (${progress.toFixed(1)}%) - Created: ${stats.totalEntitiesCreated}, Departed: ${stats.totalEntitiesDeparted}`);
    lastPrintTime = currentTime;
  }
}

console.log("\n=== SIMULATION COMPLETE ===\n");

const finalStats = engine.getStats();
const finalTime = engine.getCurrentTime();
const progress = (finalTime / 100) * 100;

console.log(`Total steps: ${steps}`);
console.log(`Final time: ${finalTime.toFixed(2)} min`);
console.log(`Progress: ${progress.toFixed(1)}%`);
console.log(`\nEntities created: ${finalStats.totalEntitiesCreated}`);
console.log(`Entities departed: ${finalStats.totalEntitiesDeparted}`);
console.log(`Avg cycle time: ${finalStats.avgCycleTime.toFixed(2)} min`);
console.log(`Throughput: ${finalStats.throughput.toFixed(2)} entities/min`);
console.log(`\nExpected throughput: ~${(10 / 1).toFixed(2)} entities/min (arrival rate)`);

// Verify completion
console.log("\n=== VERIFICATION ===\n");

if (finalTime >= 99.5) {
  console.log("✓ Simulation ran to completion (time >= 99.5)");
} else {
  console.log(`✗ Simulation stopped early at ${finalTime.toFixed(2)} min`);
}

if (finalStats.totalEntitiesCreated > 900) {
  console.log(`✓ Created sufficient entities (${finalStats.totalEntitiesCreated} > 900)`);
} else {
  console.log(`✗ Too few entities created (${finalStats.totalEntitiesCreated})`);
}

if (finalStats.totalEntitiesDeparted === finalStats.totalEntitiesCreated ||
    Math.abs(finalStats.totalEntitiesDeparted - finalStats.totalEntitiesCreated) <= 5) {
  console.log(`✓ All entities departed (${finalStats.totalEntitiesDeparted} ≈ ${finalStats.totalEntitiesCreated})`);
} else {
  console.log(`⚠ Some entities still in system: Created=${finalStats.totalEntitiesCreated}, Departed=${finalStats.totalEntitiesDeparted}`);
}

if (finalStats.throughput > 0 && finalStats.throughput < 15) {
  console.log(`✓ Throughput is reasonable (${finalStats.throughput.toFixed(2)} entities/min)`);
} else {
  console.log(`✗ Throughput seems wrong (${finalStats.throughput.toFixed(2)})`);
}

console.log("\n=== RESOURCE UTILIZATION ===\n");
const resources = engine.getResources();
resources.forEach(resource => {
  const util = finalStats.resourceUtilization[resource.id] || 0;
  console.log(`${resource.name}: ${(util * 100).toFixed(1)}% utilized`);
});

console.log("\n✓ TEST COMPLETE");
