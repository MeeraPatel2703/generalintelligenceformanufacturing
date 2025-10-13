// STEP 4: MINIMAL WORKING SIMULATION

import { EventQueue } from '../EventQueue';

class MinimalSimulation {
  private currentTime = 0;
  private eventQueue = new EventQueue();
  private entitiesCreated = 0;

  run() {
    console.log("=== MINIMAL WORKING SIMULATION ===\n");

    // Schedule ONE arrival at time 1
    this.eventQueue.insert({ time: 1, type: 'ARRIVAL' });
    console.log("Scheduled arrival at time 1");

    // Process events
    while (!this.eventQueue.isEmpty()) {
      const event = this.eventQueue.getNext();

      if (!event) break;

      this.currentTime = event.time;

      console.log(`Time ${this.currentTime}: ${event.type}`);

      if (event.type === 'ARRIVAL') {
        this.entitiesCreated++;
        console.log(`  Entity #${this.entitiesCreated} created`);
      }
    }

    console.log(`\n=== RESULTS ===`);
    console.log(`Entities Created: ${this.entitiesCreated}`);

    if (this.entitiesCreated === 1) {
      console.log("✓ MINIMAL SIMULATION WORKS!");
      console.log("\nNow add: multiple arrivals, then service, then...");
    } else {
      console.log("✗ STILL BROKEN");
    }
  }
}

new MinimalSimulation().run();
