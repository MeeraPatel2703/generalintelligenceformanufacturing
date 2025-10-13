import { EventQueue, Event } from './EventQueue';
import { Distributions } from './Distributions';

interface Entity {
  id: number;
  arrivalTime: number;
  stationArrival: number;
  stationTimes: number[];
}

interface Station {
  index: number;
  name: string;
  numServers: number;
  servers: boolean[];
  queue: Entity[];
  serviceTimeGenerator: () => number;

  // Statistics
  totalWaitTime: number;
  totalServiceTime: number;
  customersServed: number;
}

interface MultiStageResults {
  totalCycleTime: number;
  avgCycleTime: number;
  entitiesCompleted: number;
  stationStats: {
    name: string;
    avgWaitTime: number;
    avgServiceTime: number;
    customersServed: number;
  }[];
}

export class MultiStageSimulation {
  private currentTime: number = 0;
  private eventQueue: EventQueue;
  private stations: Station[] = [];
  private dist: Distributions;

  // System state
  private nextEntityId: number = 0;
  private entitiesCompleted: number = 0;
  private totalCycleTime: number = 0;

  // Arrival parameters
  private arrivalRate: number;
  private maxArrivals: number;
  private arrivalsScheduled: number = 0;

  constructor(arrivalRate: number, maxArrivals: number = Infinity) {
    this.arrivalRate = arrivalRate;
    this.maxArrivals = maxArrivals;
    this.eventQueue = new EventQueue();
    this.dist = new Distributions();
  }

  addStation(name: string, numServers: number, serviceTimeGenerator: () => number): void {
    this.stations.push({
      index: this.stations.length,
      name,
      numServers,
      servers: Array(numServers).fill(false),
      queue: [],
      serviceTimeGenerator,
      totalWaitTime: 0,
      totalServiceTime: 0,
      customersServed: 0
    });
  }

  run(endTime: number): MultiStageResults {
    // Schedule first arrival
    this.scheduleArrival();

    // Main event loop
    while (!this.eventQueue.isEmpty()) {
      const event = this.eventQueue.getNext()!;

      if (event.time > endTime) break;

      this.currentTime = event.time;

      if (event.type === 'ARRIVAL') {
        this.handleSystemArrival(event);
      } else if (event.type === 'STATION_ARRIVAL') {
        this.handleStationArrival(event);
      } else if (event.type === 'STATION_DEPARTURE') {
        this.handleStationDeparture(event);
      }
    }

    // Calculate statistics
    const avgCycleTime = this.totalCycleTime / this.entitiesCompleted;

    const stationStats = this.stations.map(station => ({
      name: station.name,
      avgWaitTime: station.totalWaitTime / station.customersServed,
      avgServiceTime: station.totalServiceTime / station.customersServed,
      customersServed: station.customersServed
    }));

    return {
      totalCycleTime: this.totalCycleTime,
      avgCycleTime,
      entitiesCompleted: this.entitiesCompleted,
      stationStats
    };
  }

  private scheduleArrival(): void {
    if (this.arrivalsScheduled >= this.maxArrivals) return;

    const interArrivalTime = this.dist.exponential(this.arrivalRate);
    this.eventQueue.insert({
      time: this.currentTime + interArrivalTime,
      type: 'ARRIVAL'
    });
    this.arrivalsScheduled++;
  }

  private handleSystemArrival(event: Event): void {
    const entity: Entity = {
      id: this.nextEntityId++,
      arrivalTime: this.currentTime,
      stationArrival: this.currentTime,
      stationTimes: []
    };

    // Schedule next arrival
    this.scheduleArrival();

    // Send to first station
    if (this.stations.length > 0) {
      this.arriveAtStation(entity, this.stations[0]);
    }
  }

  private arriveAtStation(entity: Entity, station: Station): void {
    entity.stationArrival = this.currentTime;

    // Find idle server
    const idleServerIndex = station.servers.findIndex(busy => !busy);

    if (idleServerIndex >= 0) {
      // Server available - start service immediately
      this.startService(entity, station, idleServerIndex);
    } else {
      // All servers busy - join queue
      station.queue.push(entity);
    }
  }

  private handleStationArrival(event: Event): void {
    const entity = event.entity as Entity;
    const station = this.stations[event.stationIndex];
    this.arriveAtStation(entity, station);
  }

  private startService(entity: Entity, station: Station, serverIndex: number): void {
    station.servers[serverIndex] = true;

    const waitTime = this.currentTime - entity.stationArrival;
    station.totalWaitTime += waitTime;

    const serviceTime = station.serviceTimeGenerator();
    station.totalServiceTime += serviceTime;

    this.eventQueue.insert({
      time: this.currentTime + serviceTime,
      type: 'STATION_DEPARTURE',
      entity,
      station,
      serverIndex
    });
  }

  private handleStationDeparture(event: Event): void {
    const station = event.station as Station;
    const entity = event.entity as Entity;
    const serverIndex = event.serverIndex;

    // Record time at this station
    const stationTime = this.currentTime - entity.stationArrival;
    entity.stationTimes.push(stationTime);
    station.customersServed++;

    // Route to next station or exit
    const nextStationIndex = station.index + 1;

    if (nextStationIndex < this.stations.length) {
      // Send to next station
      this.eventQueue.insert({
        time: this.currentTime,
        type: 'STATION_ARRIVAL',
        entity,
        stationIndex: nextStationIndex
      });
    } else {
      // Exit system
      this.recordExit(entity);
    }

    // Start serving next entity at this station
    if (station.queue.length > 0) {
      const next = station.queue.shift()!;
      this.startService(next, station, serverIndex);
    } else {
      // Server becomes idle
      station.servers[serverIndex] = false;
    }
  }

  private recordExit(entity: Entity): void {
    const cycleTime = this.currentTime - entity.arrivalTime;
    this.totalCycleTime += cycleTime;
    this.entitiesCompleted++;
  }
}
