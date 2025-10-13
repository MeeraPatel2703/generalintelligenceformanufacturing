import { EventQueue, Event } from './EventQueue';

interface Customer {
  id: number;
  arrivalTime: number;
}

interface SimulationResults {
  avgWaitTime: number;
  avgTimeInSystem: number;
  customersCompleted: number;
}

export class MM1Simulation {
  private currentTime: number = 0;
  private eventQueue: EventQueue;

  // System state
  private serverBusy: boolean = false;
  private queue: Customer[] = [];

  // Parameters
  private arrivalRate: number; // λ (customers per minute)
  private serviceRate: number; // μ (customers per minute)

  // Statistics
  private customersCompleted: number = 0;
  private totalWaitTime: number = 0;
  private totalTimeInSystem: number = 0;
  private nextCustomerId: number = 0;

  constructor(arrivalRate: number, serviceRate: number) {
    this.arrivalRate = arrivalRate;
    this.serviceRate = serviceRate;
    this.eventQueue = new EventQueue();

    // Verify stable system
    if (arrivalRate >= serviceRate) {
      throw new Error(`System is unstable: λ=${arrivalRate} >= μ=${serviceRate}`);
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

    if (this.serverBusy) {
      // Server busy - join queue
      this.queue.push(customer);
    } else {
      // Server free - start service
      this.startService(customer);
    }
  }

  private startService(customer: Customer): void {
    this.serverBusy = true;

    const waitTime = this.currentTime - customer.arrivalTime;
    this.totalWaitTime += waitTime;

    const serviceTime = this.exponential(this.serviceRate);

    this.eventQueue.insert({
      time: this.currentTime + serviceTime,
      type: 'DEPARTURE',
      customer: customer
    });
  }

  private handleDeparture(event: Event): void {
    const customer = event.customer as Customer;

    const timeInSystem = this.currentTime - customer.arrivalTime;
    this.totalTimeInSystem += timeInSystem;
    this.customersCompleted++;

    if (this.queue.length > 0) {
      // Serve next customer
      const nextCustomer = this.queue.shift()!;
      this.startService(nextCustomer);
    } else {
      // Server becomes idle
      this.serverBusy = false;
    }
  }

  private exponential(rate: number): number {
    // Generate exponential random variable
    return -Math.log(Math.random()) / rate;
  }
}
