import { EventQueue, Event } from './EventQueue';

interface Customer {
  id: number;
  arrivalTime: number;
}

interface Server {
  busy: boolean;
  currentCustomer: Customer | null;
  id: number;
}

interface SimulationResults {
  avgWaitTime: number;
  avgTimeInSystem: number;
  customersCompleted: number;
}

export class MMcSimulation {
  private currentTime: number = 0;
  private eventQueue: EventQueue;

  // System state
  private servers: Server[];
  private numServers: number;
  private queue: Customer[] = [];

  // Parameters
  private arrivalRate: number; // λ
  private serviceRate: number; // μ (per server)

  // Statistics
  private customersCompleted: number = 0;
  private totalWaitTime: number = 0;
  private totalTimeInSystem: number = 0;
  private nextCustomerId: number = 0;

  constructor(arrivalRate: number, serviceRate: number, numServers: number) {
    this.arrivalRate = arrivalRate;
    this.serviceRate = serviceRate;
    this.numServers = numServers;
    this.eventQueue = new EventQueue();

    // Initialize servers
    this.servers = Array(numServers).fill(null).map((_, i) => ({
      busy: false,
      currentCustomer: null,
      id: i
    }));

    // Verify stable system
    if (arrivalRate >= serviceRate * numServers) {
      throw new Error(`System is unstable: λ=${arrivalRate} >= c*μ=${numServers * serviceRate}`);
    }
  }

  run(endTime: number): SimulationResults {
    // Schedule first arrival
    this.scheduleArrival();

    // Main event loop
    while (!this.eventQueue.isEmpty()) {
      const event = this.eventQueue.getNext()!;

      if (event.time > endTime) break;

      this.currentTime = event.time;

      if (event.type === 'ARRIVAL') {
        this.handleArrival(event);
      } else if (event.type === 'DEPARTURE') {
        this.handleDeparture(event);
      }
    }

    // Calculate statistics
    const avgWaitTime = this.totalWaitTime / this.customersCompleted;
    const avgTimeInSystem = this.totalTimeInSystem / this.customersCompleted;

    return { avgWaitTime, avgTimeInSystem, customersCompleted: this.customersCompleted };
  }

  private scheduleArrival(): void {
    const interArrivalTime = this.exponential(this.arrivalRate);
    this.eventQueue.insert({
      time: this.currentTime + interArrivalTime,
      type: 'ARRIVAL'
    });
  }

  private handleArrival(event: Event): void {
    const customer: Customer = {
      arrivalTime: this.currentTime,
      id: this.nextCustomerId++
    };

    // Schedule next arrival
    this.scheduleArrival();

    // Find idle server
    const idleServer = this.servers.find(s => !s.busy);

    if (idleServer) {
      this.startService(customer, idleServer);
    } else {
      // All servers busy - join queue
      this.queue.push(customer);
    }
  }

  private startService(customer: Customer, server: Server): void {
    server.busy = true;
    server.currentCustomer = customer;

    const waitTime = this.currentTime - customer.arrivalTime;
    this.totalWaitTime += waitTime;

    const serviceTime = this.exponential(this.serviceRate);

    this.eventQueue.insert({
      time: this.currentTime + serviceTime,
      type: 'DEPARTURE',
      server: server,
      customer: customer
    });
  }

  private handleDeparture(event: Event): void {
    const server = event.server as Server;
    const customer = event.customer as Customer;

    // Record statistics
    const timeInSystem = this.currentTime - customer.arrivalTime;
    this.totalTimeInSystem += timeInSystem;
    this.customersCompleted++;

    if (this.queue.length > 0) {
      // Serve next customer
      const nextCustomer = this.queue.shift()!;
      this.startService(nextCustomer, server);
    } else {
      // Server becomes idle
      server.busy = false;
      server.currentCustomer = null;
    }
  }

  private exponential(rate: number): number {
    return -Math.log(Math.random()) / rate;
  }
}
