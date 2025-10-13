/**
 * Sophisticated DES Engine
 *
 * Handles complex process sequences with:
 * - Seize/Release resource management
 * - Multiple delay steps
 * - Decision/routing logic
 * - Proper entity lifecycle (arrival → processing → exit)
 */

import type { ExtractedSystem, Process, ProcessStep } from '../types/extraction';

export interface SimEntity {
  id: string;
  type: string;
  arrivalTime: number;
  currentStepIndex: number;
  currentProcessId: string;
  seizedResources: string[];
  state: 'arriving' | 'waiting' | 'processing' | 'traveling' | 'deciding' | 'departed';
  attributes: Record<string, any>;
  departureTime?: number;
}

export interface SimResource {
  id: string;
  name: string;
  capacity: number;
  inUse: number;
  queue: SimEntity[];
  busyEntities: SimEntity[];
}

interface SimEvent {
  time: number;
  type: 'arrival' | 'end_delay' | 'seize' | 'release' | 'decision' | 'exit';
  entityId: string;
  data?: any;
}

export class SophisticatedDESEngine {
  private currentTime: number = 0;
  private eventQueue: SimEvent[] = [];
  private entities: Map<string, SimEntity> = new Map();
  private resources: Map<string, SimResource> = new Map();
  private processes: Map<string, Process> = new Map();
  private system: ExtractedSystem;

  // Statistics
  private entitiesCreated: number = 0;
  private entitiesDeparted: number = 0;
  private totalWaitTime: number = 0;
  private totalCycleTime: number = 0;

  constructor(system: ExtractedSystem) {
    console.log('[SophisticatedDESEngine] Initializing with system:', system);
    this.system = system;
    this.initialize();
    console.log('[SophisticatedDESEngine] Initialization complete. Event queue length:', this.eventQueue.length);
  }

  private initialize(): void {
    // Initialize resources
    if (this.system.resources && this.system.resources.length > 0) {
      this.system.resources.forEach((resource, idx) => {
        const id = resource.name || `resource-${idx}`;
        this.resources.set(id, {
          id,
          name: resource.name,
          capacity: resource.capacity || 1,
          inUse: 0,
          queue: [],
          busyEntities: []
        });
      });
    } else {
      console.warn('No resources defined in system');
    }

    // Store processes for lookup
    if (this.system.processes && this.system.processes.length > 0) {
      this.system.processes.forEach((process, idx) => {
        const id = process.name || `process-${idx}`;
        this.processes.set(id, process);
      });
    } else {
      console.warn('No processes defined in system');
    }

    // Schedule entity arrivals
    if (this.system.entities && this.system.entities.length > 0) {
      this.scheduleArrivals();
    } else {
      console.warn('No entities defined in system');
    }
  }

  private scheduleArrivals(): void {
    this.system.entities.forEach((entityDef, idx) => {
      const arrivalPattern = entityDef.arrivalPattern;

      if (!arrivalPattern) {
        console.warn('[SophisticatedDESEngine] No arrival pattern for entity:', entityDef.name);
        return;
      }

      console.log('[SophisticatedDESEngine] Scheduling arrivals for:', entityDef.name, 'Pattern:', arrivalPattern);

      if (arrivalPattern.type === 'poisson' || arrivalPattern.type === 'nonhomogeneous') {
        // Handle both homogeneous (with rate) and non-homogeneous (with rateSchedule/schedule)
        this.scheduleNonHomogeneousPoissonArrivals(entityDef, idx, arrivalPattern);
      } else if (arrivalPattern.type === 'scheduled' && (arrivalPattern as any).schedule) {
        // Handle scheduled arrivals (specific times)
        const schedule = (arrivalPattern as any).schedule;
        schedule.forEach((entry: any, i: number) => {
          this.scheduleEvent({
            time: entry.time || 0,
            type: 'arrival',
            entityId: `entity-${idx}-${i}`,
            data: { entityDefIndex: idx }
          });
        });
        console.log('[SophisticatedDESEngine] Scheduled', schedule.length, 'scheduled arrivals for', entityDef.name);
      } else if (arrivalPattern.type === 'constant' && (arrivalPattern as any).interarrivalTime) {
        // Handle constant interarrival time
        const interarrival = (arrivalPattern as any).interarrivalTime;
        let time = interarrival;
        let i = 0;
        while (time <= 360) { // Run until 360 minutes (6 hours)
          this.scheduleEvent({
            time,
            type: 'arrival',
            entityId: `entity-${idx}-${i}`,
            data: { entityDefIndex: idx }
          });
          time += interarrival;
          i++;
        }
        console.log('[SophisticatedDESEngine] Scheduled', i, 'constant arrivals for', entityDef.name);
      } else {
        console.warn('[SophisticatedDESEngine] Unknown arrival pattern type:', arrivalPattern.type);
        console.warn('[SophisticatedDESEngine] Full pattern:', JSON.stringify(arrivalPattern, null, 2));
      }
    });
  }

  /**
   * Schedule arrivals using non-homogeneous Poisson process (time-varying rates)
   * Uses thinning algorithm for non-homogeneous Poisson
   */
  private scheduleNonHomogeneousPoissonArrivals(
    entityDef: any,
    idx: number,
    arrivalPattern: any
  ): void {
    const endTime = 360; // 6 hours in minutes

    // Check if this has time-varying rates (custom rateSchedule field)
    const rateSchedule = (arrivalPattern as any).rateSchedule;

    // Or check for standard schedule field (ArrivalSchedule[])
    const schedule = arrivalPattern.schedule;

    if (rateSchedule && rateSchedule.length > 0) {
      // Non-homogeneous Poisson with simple rate schedule
      // Expected format: [{ startTime: 0, endTime: 120, rate: 30 }, ...]
      console.log('[SophisticatedDESEngine] Using non-homogeneous Poisson with rateSchedule:', rateSchedule);

      let arrivalCount = 0;
      let currentTime = 0;

      while (currentTime < endTime) {
        // Get current rate based on time
        const currentRate = this.getArrivalRateFromSchedule(currentTime, rateSchedule);

        if (currentRate <= 0) {
          // No arrivals in this period, skip to next period
          const nextPeriod = rateSchedule.find((r: any) => r.startTime > currentTime);
          if (nextPeriod) {
            currentTime = nextPeriod.startTime;
            console.log(`[SophisticatedDESEngine] Skipping to next period at ${nextPeriod.startTime}`);
          } else {
            console.log(`[SophisticatedDESEngine] No more periods, ending at ${currentTime}`);
            break;
          }
          continue;
        }

        // Generate interarrival time using current rate (per minute)
        const ratePerMinute = currentRate / 60; // Convert from per hour to per minute
        const interarrival = this.exponential(1 / ratePerMinute);
        currentTime += interarrival;

        if (currentTime >= endTime) break;

        // Schedule arrival
        this.scheduleEvent({
          time: currentTime,
          type: 'arrival',
          entityId: `entity-${idx}-${arrivalCount}`,
          data: { entityDefIndex: idx }
        });

        arrivalCount++;

        // Diagnostic logging every 10 arrivals
        if (arrivalCount % 10 === 0) {
          console.log(`[SophisticatedDESEngine] Arrival #${arrivalCount} at time ${currentTime.toFixed(2)} (rate: ${currentRate}/hr)`);
        }

        // Safety check to prevent infinite loop
        if (arrivalCount > 1000) {
          console.warn('[SophisticatedDESEngine] Arrival count exceeded 1000, stopping');
          break;
        }
      }

      console.log(`[SophisticatedDESEngine] ✓ Scheduled ${arrivalCount} non-homogeneous Poisson arrivals for ${entityDef.name} over ${endTime} minutes`);
    } else if (schedule && schedule.length > 0) {
      // Standard ArrivalSchedule[] format
      // Convert to simple rate schedule
      console.log('[SophisticatedDESEngine] Converting ArrivalSchedule to rate schedule');
      const convertedSchedule = schedule.map((s: any) => ({
        startTime: s.timeOfDay?.start || 0, // Parse HH:MM or use 0
        endTime: s.timeOfDay?.end || endTime,
        rate: s.rate
      }));

      // Recursively call with converted schedule
      this.scheduleNonHomogeneousPoissonArrivals(
        entityDef,
        idx,
        { ...arrivalPattern, rateSchedule: convertedSchedule }
      );
    } else {
      // Homogeneous Poisson (constant rate)
      console.log('[SophisticatedDESEngine] Using homogeneous Poisson with constant rate:', arrivalPattern.rate);

      const ratePerMinute = arrivalPattern.rateUnit === 'per_hour'
        ? arrivalPattern.rate / 60
        : arrivalPattern.rate;

      let arrivalCount = 0;
      let time = 0;

      while (time < endTime) {
        time += this.exponential(1 / ratePerMinute);

        if (time >= endTime) break;

        this.scheduleEvent({
          time,
          type: 'arrival',
          entityId: `entity-${idx}-${arrivalCount}`,
          data: { entityDefIndex: idx }
        });

        arrivalCount++;

        // Diagnostic logging
        if (arrivalCount % 10 === 0) {
          console.log(`[SophisticatedDESEngine] Arrival #${arrivalCount} at time ${time.toFixed(2)}`);
        }

        // Safety check
        if (arrivalCount > 1000) break;
      }

      console.log(`[SophisticatedDESEngine] ✓ Scheduled ${arrivalCount} homogeneous Poisson arrivals for ${entityDef.name} (rate: ${arrivalPattern.rate}/${arrivalPattern.rateUnit})`);
    }
  }

  /**
   * Get the arrival rate at a specific time from the rate schedule
   */
  private getArrivalRateFromSchedule(currentTime: number, rateSchedule: any[]): number {
    for (const period of rateSchedule) {
      if (currentTime >= period.startTime && currentTime < period.endTime) {
        return period.rate;
      }
    }
    return 0;
  }

  private scheduleEvent(event: SimEvent): void {
    // Insert event in chronological order
    const index = this.eventQueue.findIndex(e => e.time > event.time);
    if (index === -1) {
      this.eventQueue.push(event);
    } else {
      this.eventQueue.splice(index, 0, event);
    }
  }

  private exponential(mean: number): number {
    return -mean * Math.log(Math.random());
  }

  private normal(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
  }

  private uniform(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private triangular(min: number, mode: number, max: number): number {
    const u = Math.random();
    const f = (mode - min) / (max - min);

    if (u < f) {
      return min + Math.sqrt(u * (max - min) * (mode - min));
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }
  }

  private sampleDuration(distribution: any): number {
    if (!distribution || !distribution.parameters) return 1;

    switch (distribution.type) {
      case 'constant':
        return distribution.parameters.value || 1;
      case 'normal':
        return Math.max(0.1, this.normal(
          distribution.parameters.mean || 1,
          distribution.parameters.stdDev || 0.1
        ));
      case 'uniform':
        return this.uniform(
          distribution.parameters.min || 0.5,
          distribution.parameters.max || 2
        );
      case 'triangular':
        return this.triangular(
          distribution.parameters.min || 1,
          distribution.parameters.mode || 2,
          distribution.parameters.max || 3
        );
      case 'exponential':
        return this.exponential(1 / (distribution.parameters.rate || 1));
      default:
        console.warn('[SophisticatedDESEngine] Unknown distribution type:', distribution.type, 'Using default value 1');
        return 1;
    }
  }

  public step(): boolean {
    if (this.eventQueue.length === 0) {
      console.log('[SophisticatedDESEngine] No more events in queue');
      return false;
    }

    const event = this.eventQueue.shift()!;
    this.currentTime = event.time;
    console.log('[SophisticatedDESEngine] Processing event:', event.type, 'at time', event.time);

    switch (event.type) {
      case 'arrival':
        this.handleArrival(event);
        break;
      case 'end_delay':
        this.handleEndDelay(event);
        break;
      case 'seize':
        this.handleSeize(event);
        break;
      case 'release':
        this.handleRelease(event);
        break;
      case 'decision':
        this.handleDecision(event);
        break;
      case 'exit':
        this.handleExit(event);
        break;
    }

    return true;
  }

  private handleArrival(event: SimEvent): void {
    const entityDefIndex = event.data.entityDefIndex;
    const entityDef = this.system.entities[entityDefIndex];

    if (!entityDef) {
      console.warn('Entity definition not found for index:', entityDefIndex);
      return;
    }

    const process = this.system.processes.find(p => p.entityType === entityDef.name);

    if (!process || !process.sequence || process.sequence.length === 0) {
      console.warn('No process found for entity:', entityDef.name);
      return;
    }

    const entity: SimEntity = {
      id: event.entityId,
      type: entityDef.name,
      arrivalTime: this.currentTime,
      currentStepIndex: 0,
      currentProcessId: process.name || 'default',
      seizedResources: [],
      state: 'arriving',
      attributes: {}
    };

    this.entities.set(entity.id, entity);
    this.entitiesCreated++;

    // Diagnostic logging every 10th arrival
    if (this.entitiesCreated % 10 === 0) {
      console.log(`[ARRIVAL] Entity #${this.entitiesCreated} arrived at time ${this.currentTime.toFixed(2)} min`);
    }

    // Start processing first step
    this.processNextStep(entity);
  }

  private processNextStep(entity: SimEntity): void {
    const process = this.processes.get(entity.currentProcessId);
    if (!process || !process.sequence) {
      this.departEntity(entity);
      return;
    }

    if (entity.currentStepIndex >= process.sequence.length) {
      this.departEntity(entity);
      return;
    }

    const step = process.sequence[entity.currentStepIndex];

    switch (step.type) {
      case 'seize':
        this.trySeizeResource(entity, step);
        break;
      case 'delay':
        this.startDelay(entity, step);
        break;
      case 'release':
        this.releaseResource(entity, step);
        break;
      case 'decision':
        this.makeDecision(entity, step);
        break;
      case 'process':
        // Generic process step - just move to next
        entity.currentStepIndex++;
        this.processNextStep(entity);
        break;
      default:
        // Unknown step type, skip
        entity.currentStepIndex++;
        this.processNextStep(entity);
    }
  }

  private trySeizeResource(entity: SimEntity, step: ProcessStep): void {
    const resourceName = step.resourceName;
    if (!resourceName) {
      entity.currentStepIndex++;
      this.processNextStep(entity);
      return;
    }

    const resource = this.resources.get(resourceName);
    if (!resource) {
      console.warn('Resource not found:', resourceName);
      entity.currentStepIndex++;
      this.processNextStep(entity);
      return;
    }

    if (resource.inUse < resource.capacity) {
      // Resource available - seize it
      resource.inUse++;
      resource.busyEntities.push(entity);
      entity.seizedResources.push(resourceName);
      entity.state = 'processing';

      // Move to next step
      entity.currentStepIndex++;
      this.processNextStep(entity);
    } else {
      // Resource busy - add to queue
      resource.queue.push(entity);
      entity.state = 'waiting';
    }
  }

  private startDelay(entity: SimEntity, step: ProcessStep): void {
    const duration = step.duration ? this.sampleDuration(step.duration) : 1;

    entity.state = 'processing';

    this.scheduleEvent({
      time: this.currentTime + duration,
      type: 'end_delay',
      entityId: entity.id
    });
  }

  private handleEndDelay(event: SimEvent): void {
    const entity = this.entities.get(event.entityId);
    if (!entity) return;

    entity.currentStepIndex++;
    this.processNextStep(entity);
  }

  private releaseResource(entity: SimEntity, step: ProcessStep): void {
    const resourceName = step.resourceName;
    if (!resourceName) {
      entity.currentStepIndex++;
      this.processNextStep(entity);
      return;
    }

    const resource = this.resources.get(resourceName);
    if (!resource) {
      entity.currentStepIndex++;
      this.processNextStep(entity);
      return;
    }

    // Remove from seized resources
    const index = entity.seizedResources.indexOf(resourceName);
    if (index > -1) {
      entity.seizedResources.splice(index, 1);
    }

    // Decrease usage
    resource.inUse = Math.max(0, resource.inUse - 1);

    // Remove from busy entities
    const busyIndex = resource.busyEntities.findIndex(e => e.id === entity.id);
    if (busyIndex > -1) {
      resource.busyEntities.splice(busyIndex, 1);
    }

    // Check if anyone waiting in queue
    if (resource.queue.length > 0 && resource.inUse < resource.capacity) {
      const nextEntity = resource.queue.shift()!;
      resource.inUse++;
      resource.busyEntities.push(nextEntity);
      nextEntity.seizedResources.push(resourceName);
      nextEntity.state = 'processing';
      nextEntity.currentStepIndex++;
      this.processNextStep(nextEntity);
    }

    // Current entity moves to next step
    entity.currentStepIndex++;
    this.processNextStep(entity);
  }

  private makeDecision(entity: SimEntity, step: ProcessStep): void {
    if (!step.conditions || step.conditions.length === 0) {
      entity.currentStepIndex++;
      this.processNextStep(entity);
      return;
    }

    // Probabilistic routing
    const rand = Math.random();
    let cumProb = 0;

    for (const condition of step.conditions) {
      cumProb += condition.probability || 0;
      if (rand <= cumProb) {
        // Find the target step
        const process = this.processes.get(entity.currentProcessId);
        if (process && process.sequence) {
          const targetIndex = process.sequence.findIndex(s => s.id === condition.nextStepId);
          if (targetIndex !== -1) {
            entity.currentStepIndex = targetIndex;
            this.processNextStep(entity);
            return;
          }
        }
        break;
      }
    }

    // Fallback: just move to next step
    entity.currentStepIndex++;
    this.processNextStep(entity);
  }

  private handleDecision(event: SimEvent): void {
    const entity = this.entities.get(event.entityId);
    if (entity) {
      this.makeDecision(entity, event.data.step);
    }
  }

  private handleSeize(event: SimEvent): void {
    const entity = this.entities.get(event.entityId);
    if (entity) {
      this.trySeizeResource(entity, event.data.step);
    }
  }

  private handleRelease(event: SimEvent): void {
    const entity = this.entities.get(event.entityId);
    if (entity) {
      this.releaseResource(entity, event.data.step);
    }
  }

  private handleExit(event: SimEvent): void {
    const entity = this.entities.get(event.entityId);
    if (entity) {
      this.departEntity(entity);
    }
  }

  private departEntity(entity: SimEntity): void {
    entity.state = 'departed';
    entity.departureTime = this.currentTime;
    this.entitiesDeparted++;

    const cycleTime = this.currentTime - entity.arrivalTime;
    this.totalCycleTime += cycleTime;

    // Diagnostic logging every 10th departure
    if (this.entitiesDeparted % 10 === 0) {
      console.log(`[DEPARTURE] Entity #${this.entitiesDeparted} departed at time ${this.currentTime.toFixed(2)} min (cycle time: ${cycleTime.toFixed(2)} min)`);
    }

    // Release any resources still seized
    entity.seizedResources.forEach(resourceName => {
      const resource = this.resources.get(resourceName);
      if (resource) {
        resource.inUse = Math.max(0, resource.inUse - 1);
        const index = resource.busyEntities.findIndex(e => e.id === entity.id);
        if (index > -1) {
          resource.busyEntities.splice(index, 1);
        }
      }
    });
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getEntities(): SimEntity[] {
    return Array.from(this.entities.values()).filter(e => e.state !== 'departed');
  }

  public getResources(): SimResource[] {
    return Array.from(this.resources.values());
  }

  public getStats() {
    const avgCycleTime = this.entitiesDeparted > 0
      ? this.totalCycleTime / this.entitiesDeparted
      : 0;

    const throughputPerHour = this.currentTime > 0
      ? (this.entitiesDeparted / this.currentTime) * 60 // Convert from per-minute to per-hour
      : 0;

    return {
      currentTime: this.currentTime,
      entitiesCreated: this.entitiesCreated,
      entitiesDeparted: this.entitiesDeparted,
      entitiesInSystem: this.entitiesCreated - this.entitiesDeparted,
      avgCycleTime,
      throughput: throughputPerHour // per hour (FIXED!)
    };
  }
}
