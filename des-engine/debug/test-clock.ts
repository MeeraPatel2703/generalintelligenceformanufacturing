// STEP 2: TEST IF SIMULATION CLOCK ADVANCES

import { EventQueue } from '../EventQueue';

console.log("=== TESTING SIMULATION CLOCK ===");

class TestSimulation {
  protected currentTime = 0;
  protected eventQueue = new EventQueue();

  protected scheduleEvent(time: number, type: string) {
    this.eventQueue.insert({ time, type });
  }

  run(endTime: number) {
    console.log(`Starting simulation, endTime=${endTime}`);

    // Schedule one test event
    this.scheduleEvent(5, 'TEST');

    let eventCount = 0;

    // Main loop
    while (!this.eventQueue.isEmpty()) {
      const event = this.eventQueue.getNext();

      if (!event || event.time > endTime) break;

      this.currentTime = event.time;
      eventCount++;

      console.log(`Time ${this.currentTime}: ${event.type}`);
    }

    console.log(`\nSimulation ended`);
    console.log(`Events processed: ${eventCount}`);
    console.log(`Final time: ${this.currentTime}`);

    if (eventCount === 1 && this.currentTime === 5) {
      console.log("✓ SIMULATION CLOCK WORKS");
    } else {
      console.log("✗ SIMULATION CLOCK BROKEN");
    }
  }
}

const sim = new TestSimulation();
sim.run(10);
