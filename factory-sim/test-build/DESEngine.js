/**
 * Discrete Event Simulation Engine
 *
 * A complete DES engine that actually simulates entity flow through processes
 * with proper event scheduling, resource management, and statistics collection
 */
export var EventType;
(function (EventType) {
    EventType["ENTITY_ARRIVAL"] = "ENTITY_ARRIVAL";
    EventType["START_PROCESS"] = "START_PROCESS";
    EventType["END_PROCESS"] = "END_PROCESS";
    EventType["RESOURCE_SEIZED"] = "RESOURCE_SEIZED";
    EventType["RESOURCE_RELEASED"] = "RESOURCE_RELEASED";
    EventType["ENTITY_DEPARTURE"] = "ENTITY_DEPARTURE";
})(EventType || (EventType = {}));
export class DESEngine {
    // Core simulation state
    currentTime = 0;
    eventQueue = [];
    entities = new Map();
    resources = new Map();
    processes = new Map();
    // Statistics
    stats = {
        totalEntitiesCreated: 0,
        totalEntitiesDeparted: 0,
        avgCycleTime: 0,
        avgWaitTime: 0,
        avgProcessTime: 0,
        resourceUtilization: {},
        throughput: 0
    };
    // Tracking
    cycleTimes = [];
    waitTimes = [];
    processTimes = [];
    // Configuration
    firstProcessId = null;
    arrivalRate = 1; // entities per minute
    maxSimTime = 1000;
    // Event callbacks for visualization
    eventCallbacks = [];
    constructor() { }
    // ============================================================================
    // CONFIGURATION
    // ============================================================================
    addResource(id, name, capacity) {
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
    addProcess(id, name, resourceId, processingTime, nextProcessId = null) {
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
    setArrivalRate(rate) {
        this.arrivalRate = rate;
    }
    setMaxSimTime(time) {
        this.maxSimTime = time;
    }
    onEvent(callback) {
        this.eventCallbacks.push(callback);
    }
    // ============================================================================
    // EVENT SCHEDULING
    // ============================================================================
    scheduleEvent(type, delay, data) {
        const event = {
            id: `evt-${Date.now()}-${Math.random()}`,
            type,
            time: this.currentTime + delay,
            ...data
        };
        // Insert event in time-ordered queue
        const insertIndex = this.eventQueue.findIndex(e => e.time > event.time);
        if (insertIndex === -1) {
            this.eventQueue.push(event);
        }
        else {
            this.eventQueue.splice(insertIndex, 0, event);
        }
    }
    getNextEvent() {
        return this.eventQueue.shift() || null;
    }
    // ============================================================================
    // ENTITY MANAGEMENT
    // ============================================================================
    createEntity(type) {
        const id = `entity-${this.stats.totalEntitiesCreated}`;
        const entity = {
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
    moveEntityToProcess(entityId, processId) {
        const entity = this.entities.get(entityId);
        const process = this.processes.get(processId);
        const resource = this.resources.get(process.resourceId);
        if (!entity || !process || !resource)
            return;
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
    trySeizeResource(entityId, resourceId, processId) {
        const resource = this.resources.get(resourceId);
        const entity = this.entities.get(entityId);
        if (!resource || !entity)
            return false;
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
        }
        else {
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
    releaseResource(entityId, resourceId) {
        const resource = this.resources.get(resourceId);
        const entity = this.entities.get(entityId);
        if (!resource || !entity)
            return;
        resource.currentLoad--;
        entity.currentResource = null;
        entity.history.push({
            time: this.currentTime,
            event: 'RELEASED_RESOURCE',
            location: resource.name
        });
        // Check if anyone is waiting
        if (resource.queue.length > 0) {
            const nextEntityId = resource.queue.shift();
            this.scheduleEvent(EventType.START_PROCESS, 0, {
                entityId: nextEntityId,
                processId: this.entities.get(nextEntityId).currentProcess,
                resourceId
            });
        }
    }
    // ============================================================================
    // DISTRIBUTION SAMPLING
    // ============================================================================
    sampleProcessingTime(distribution) {
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
                }
                else {
                    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
                }
            default:
                return 1;
        }
    }
    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================
    handleEntityArrival(event) {
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
    handleStartProcess(event) {
        const { entityId, processId, resourceId } = event;
        if (!entityId || !processId || !resourceId)
            return;
        const seized = this.trySeizeResource(entityId, resourceId, processId);
        if (seized) {
            // Start processing
            const process = this.processes.get(processId);
            if (!process)
                return;
            const processingTime = this.sampleProcessingTime(process.processingTime);
            this.processTimes.push(processingTime);
            this.scheduleEvent(EventType.END_PROCESS, processingTime, {
                entityId,
                processId,
                resourceId
            });
        }
    }
    handleEndProcess(event) {
        const { entityId, processId, resourceId } = event;
        if (!entityId || !processId || !resourceId)
            return;
        this.releaseResource(entityId, resourceId);
        const process = this.processes.get(processId);
        const entity = this.entities.get(entityId);
        if (!process || !entity)
            return;
        // Move to next process or depart
        if (process.nextProcessId) {
            this.moveEntityToProcess(entityId, process.nextProcessId);
        }
        else {
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
    processEvent(event) {
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
    notifyCallbacks(event) {
        const entities = Array.from(this.entities.values());
        const resources = Array.from(this.resources.values());
        this.eventCallbacks.forEach(callback => {
            callback(event, entities, resources);
        });
    }
    // ============================================================================
    // SIMULATION CONTROL
    // ============================================================================
    initialize() {
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
    step() {
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
    run() {
        while (this.step()) {
            // Run until completion
        }
        this.computeFinalStats();
    }
    computeFinalStats() {
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
    getStats() {
        return { ...this.stats };
    }
    getCurrentTime() {
        return this.currentTime;
    }
    getEntities() {
        return Array.from(this.entities.values());
    }
    getResources() {
        return Array.from(this.resources.values());
    }
}
