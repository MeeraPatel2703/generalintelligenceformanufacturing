// DIAGNOSE THE ACTUAL FACTORY SIMULATION

import { DESEngine } from '../../../factory-sim/src/simulation/DESEngine';

console.log("=== DIAGNOSING FACTORY SIMULATION ===\n");

const engine = new DESEngine();

// Configure minimal system
console.log("Step 1: Adding resource...");
engine.addResource('machine1', 'Machine 1', 1);

console.log("Step 2: Adding process...");
engine.addProcess('process1', 'Process 1', 'machine1', {
  distribution: 'constant',
  params: { value: 5 }
}, null);

console.log("Step 3: Setting arrival rate...");
engine.setArrivalRate(1); // 1 per minute

console.log("Step 4: Setting max sim time...");
engine.setMaxSimTime(50);

console.log("Step 5: Initializing...");
engine.initialize();

console.log("\nRunning simulation step-by-step...");

let stepCount = 0;
let running = true;

while (running && stepCount < 100) {
  running = engine.step();
  stepCount++;

  if (stepCount % 10 === 0) {
    const stats = engine.getStats();
    console.log(`Step ${stepCount}: Time=${engine.getCurrentTime().toFixed(2)}, Created=${stats.totalEntitiesCreated}, Departed=${stats.totalEntitiesDeparted}`);
  }
}

console.log("\n=== FINAL RESULTS ===");
const finalStats = engine.getStats();
console.log(`Total steps: ${stepCount}`);
console.log(`Final time: ${engine.getCurrentTime()}`);
console.log(`Entities created: ${finalStats.totalEntitiesCreated}`);
console.log(`Entities departed: ${finalStats.totalEntitiesDeparted}`);
console.log(`Throughput: ${finalStats.throughput.toFixed(4)}`);

if (finalStats.totalEntitiesCreated === 0) {
  console.log("\n✗ BUG CONFIRMED: NO ENTITIES CREATED");
  console.log("The initialize() method should schedule first arrival at time 0");
  console.log("Checking event queue status...");
} else {
  console.log("\n✓ ENGINE WORKS - Problem must be in the adapter/UI integration");
}
