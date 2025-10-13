// STEP 3: TEST IF ARRIVALS ARE BEING SCHEDULED

import { EventQueue } from '../EventQueue';

console.log("=== TESTING ARRIVAL GENERATION ===");

class ArrivalTest {
  protected currentTime = 0;
  protected eventQueue = new EventQueue();
  private arrivalCount = 0;

  protected scheduleEvent(time: number, type: string) {
    this.eventQueue.insert({ time, type });
  }

  run(endTime: number) {
    console.log("Scheduling first arrival...");

    // Schedule first arrival at time 0
    this.scheduleArrival(0);

    // Main loop
    while (!this.eventQueue.isEmpty()) {
      const event = this.eventQueue.getNext();

      if (!event || event.time > endTime) break;

      this.currentTime = event.time;

      if (event.type === 'ARRIVAL') {
        this.handleArrival();
      }
    }

    console.log(`\nTotal arrivals: ${this.arrivalCount}`);

    if (this.arrivalCount > 0) {
      console.log("✓ ARRIVALS WORKING");
      console.log(`\nExpected ~10 arrivals (1 per 10 time units), got ${this.arrivalCount}`);
    } else {
      console.log("✗ NO ARRIVALS GENERATED - THIS IS THE PROBLEM");
    }
  }

  private scheduleArrival(currentTime: number) {
    // Simple: arrival every 10 time units
    const nextArrivalTime = currentTime + 10;

    console.log(`  Scheduling arrival at time ${nextArrivalTime}`);

    this.scheduleEvent(nextArrivalTime, 'ARRIVAL');
  }

  private handleArrival() {
    this.arrivalCount++;
    console.log(`Time ${this.currentTime}: Arrival #${this.arrivalCount}`);

    // CRITICAL: Schedule next arrival
    this.scheduleArrival(this.currentTime);
  }
}

const sim = new ArrivalTest();
sim.run(100);

// Should print: "Total arrivals: 10" (or close)
