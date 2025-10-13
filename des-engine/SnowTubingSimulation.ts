import { EventQueue, Event } from './EventQueue';
import { Distributions } from './Distributions';

interface Person {
  id: number;
  groupId: number;
  arrivalTime: number;
  ticketEndTime?: number;
  tubeEndTime?: number;
}

interface Resource {
  name: string;
  numServers: number;
  servers: boolean[];
  queue: Person[];
  totalWaitTime: number;
  totalServiceTime: number;
  customersServed: number;
}

interface SnowTubingResults {
  sessionDuration: number;
  totalArrivals: number;
  customersProcessed: number;
  avgTicketWait: number;
  avgTubeWait: number;
  avgSledWait: number;
  avgTotalTime: number;
}

export class SnowTubingSimulation {
  private currentTime: number = 0;
  private eventQueue: EventQueue;
  private dist: Distributions;

  // Resources
  private ticketBooth: Resource;
  private tubePickup: Resource;
  private sleddingLanes: Resource;

  // System state
  private nextPersonId: number = 0;
  private nextGroupId: number = 0;
  private totalPeopleArrived: number = 0;
  private totalPeopleCompleted: number = 0;
  private totalTimeInSystem: number = 0;

  constructor() {
    this.eventQueue = new EventQueue();
    this.dist = new Distributions();

    // Initialize resources
    this.ticketBooth = {
      name: 'Ticket Booth',
      numServers: 2,
      servers: Array(2).fill(false),
      queue: [],
      totalWaitTime: 0,
      totalServiceTime: 0,
      customersServed: 0
    };

    this.tubePickup = {
      name: 'Tube Pickup',
      numServers: 5,
      servers: Array(5).fill(false),
      queue: [],
      totalWaitTime: 0,
      totalServiceTime: 0,
      customersServed: 0
    };

    this.sleddingLanes = {
      name: 'Sledding Lanes',
      numServers: 10,
      servers: Array(10).fill(false),
      queue: [],
      totalWaitTime: 0,
      totalServiceTime: 0,
      customersServed: 0
    };
  }

  run(sessionDuration: number = 105): SnowTubingResults {
    // Schedule arrivals (200 people in first 15 minutes)
    this.scheduleArrivals(200, 15);

    // Main event loop
    while (!this.eventQueue.isEmpty()) {
      const event = this.eventQueue.getNext()!;

      if (event.time > sessionDuration) break;

      this.currentTime = event.time;

      switch (event.type) {
        case 'GROUP_ARRIVAL':
          this.handleGroupArrival(event);
          break;
        case 'TICKET_DEPARTURE':
          this.handleTicketDeparture(event);
          break;
        case 'TUBE_ARRIVAL':
          this.arriveAtResource(event.person, this.tubePickup, 'TUBE');
          break;
        case 'TUBE_DEPARTURE':
          this.handleTubeDeparture(event);
          break;
        case 'SLED_ARRIVAL':
          this.arriveAtResource(event.person, this.sleddingLanes, 'SLED');
          break;
        case 'SLED_DEPARTURE':
          this.handleSledDeparture(event);
          break;
      }
    }

    // Calculate results
    const avgTicketWait = this.ticketBooth.totalWaitTime / this.ticketBooth.customersServed;
    const avgTubeWait = this.tubePickup.totalWaitTime / this.tubePickup.customersServed;
    const avgSledWait = this.sleddingLanes.totalWaitTime / this.sleddingLanes.customersServed;
    const avgTotalTime = this.totalTimeInSystem / this.totalPeopleCompleted;

    return {
      sessionDuration,
      totalArrivals: this.totalPeopleArrived,
      customersProcessed: this.totalPeopleCompleted,
      avgTicketWait,
      avgTubeWait,
      avgSledWait,
      avgTotalTime
    };
  }

  private scheduleArrivals(totalPeople: number, arrivalDuration: number): void {
    const rate = totalPeople / arrivalDuration; // avg arrivals per minute
    let time = 0;
    let arrived = 0;

    while (arrived < totalPeople) {
      const interArrival = this.dist.exponential(rate);
      time += interArrival;

      if (time > arrivalDuration) break;

      const groupSize = this.sampleGroupSize();

      this.eventQueue.insert({
        time: time,
        type: 'GROUP_ARRIVAL',
        groupSize: groupSize,
        groupId: this.nextGroupId++
      });

      arrived += groupSize;
    }
  }

  private sampleGroupSize(): number {
    return this.dist.discrete(
      [2, 3, 4, 5, 6],
      [0.15, 0.20, 0.35, 0.20, 0.10]
    );
  }

  private handleGroupArrival(event: Event): void {
    const groupSize = event.groupSize;
    const groupId = event.groupId;

    // Create individual entities for each person
    for (let i = 0; i < groupSize; i++) {
      const person: Person = {
        id: this.nextPersonId++,
        groupId: groupId,
        arrivalTime: this.currentTime
      };

      this.totalPeopleArrived++;

      // Send to ticket booth
      this.arriveAtResource(person, this.ticketBooth, 'TICKET');
    }
  }

  private arriveAtResource(person: Person, resource: Resource, stage: string): void {
    // Find idle server
    const idleServerIndex = resource.servers.findIndex(busy => !busy);

    if (idleServerIndex >= 0) {
      this.startService(person, resource, idleServerIndex, stage);
    } else {
      resource.queue.push(person);
    }
  }

  private startService(person: Person, resource: Resource, serverIndex: number, stage: string): void {
    resource.servers[serverIndex] = true;

    let arrivalTimeAtThisStage = 0;
    if (stage === 'TICKET') {
      arrivalTimeAtThisStage = person.arrivalTime;
    } else if (stage === 'TUBE') {
      arrivalTimeAtThisStage = person.ticketEndTime!;
    } else if (stage === 'SLED') {
      arrivalTimeAtThisStage = person.tubeEndTime!;
    }

    const waitTime = this.currentTime - arrivalTimeAtThisStage;
    resource.totalWaitTime += waitTime;

    const serviceTime = this.getServiceTime(stage);
    resource.totalServiceTime += serviceTime;

    this.eventQueue.insert({
      time: this.currentTime + serviceTime,
      type: `${stage}_DEPARTURE`,
      person,
      resource,
      serverIndex
    });
  }

  private getServiceTime(stage: string): number {
    if (stage === 'TICKET') {
      // Process each person individually at ticket booth
      return this.dist.uniform(0.5, 1.5); // 0.5-1.5 min per person
    } else if (stage === 'TUBE') {
      // Get tube: Triangular(20, 30, 45) seconds
      return this.dist.triangular(20, 30, 45) / 60; // Convert to minutes
    } else if (stage === 'SLED') {
      // Sledding time based on distance and speed
      const distance = 500; // feet
      const speedMph = this.dist.uniform(15, 19);
      const speedFeetPerMin = speedMph * 5280 / 60;
      return distance / speedFeetPerMin; // minutes
    }
    return 1.0;
  }

  private handleTicketDeparture(event: Event): void {
    const person = event.person as Person;
    const resource = event.resource as Resource;
    const serverIndex = event.serverIndex;

    resource.customersServed++;
    person.ticketEndTime = this.currentTime;

    // Send to tube pickup
    this.eventQueue.insert({
      time: this.currentTime,
      type: 'TUBE_ARRIVAL',
      person
    });

    // Serve next customer
    this.serveNext(resource, serverIndex, 'TICKET');
  }

  private handleTubeDeparture(event: Event): void {
    const person = event.person as Person;
    const resource = event.resource as Resource;
    const serverIndex = event.serverIndex;

    resource.customersServed++;
    person.tubeEndTime = this.currentTime;

    // Send to sledding
    this.eventQueue.insert({
      time: this.currentTime,
      type: 'SLED_ARRIVAL',
      person
    });

    // Serve next customer
    this.serveNext(resource, serverIndex, 'TUBE');
  }

  private handleSledDeparture(event: Event): void {
    const person = event.person as Person;
    const resource = event.resource as Resource;
    const serverIndex = event.serverIndex;

    resource.customersServed++;

    // Exit system
    const totalTime = this.currentTime - person.arrivalTime;
    this.totalTimeInSystem += totalTime;
    this.totalPeopleCompleted++;

    // Serve next customer
    this.serveNext(resource, serverIndex, 'SLED');
  }

  private serveNext(resource: Resource, serverIndex: number, stage: string): void {
    // Check if there's anyone waiting at this resource
    if (stage === 'TICKET' && resource.queue.length > 0) {
      const next = resource.queue.shift()!;
      this.startService(next, resource, serverIndex, 'TICKET');
    } else if (stage === 'TUBE' && this.tubePickup.queue.length > 0) {
      const next = this.tubePickup.queue.shift()!;
      this.startService(next, this.tubePickup, serverIndex, 'TUBE');
    } else if (stage === 'SLED' && this.sleddingLanes.queue.length > 0) {
      const next = this.sleddingLanes.queue.shift()!;
      this.startService(next, this.sleddingLanes, serverIndex, 'SLED');
    } else {
      resource.servers[serverIndex] = false;
    }
  }

}
