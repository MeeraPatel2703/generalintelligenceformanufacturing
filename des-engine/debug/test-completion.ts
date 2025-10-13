// TEST: Verify simulation runs to completion and gives correct results

import { DESEngine } from '../../factory-sim/src/simulation/DESEngine';

console.log("=== TESTING SIMULATION COMPLETION ===\n");

const engine = new DESEngine();

// Configure a simple 3-station system
console.log("Configuring 3-station system:");
console.log("  Order Station (0/1) → Payment Window (0/1) → Pickup Window (0/1)\n");

engine.addResource('order', 'Order Station', 1);
engine.addResource('payment', 'Payment Window', 1);
engine.addResource('pickup', 'Pickup Window', 1);

engine.addProcess('p-order', 'Order Process', 'order', {
  distribution: 'uniform',
  params: { min: 1, max: 3 }
}, 'p-payment');

engine.addProcess('p-payment', 'Payment Process', 'payment', {
  distribution: 'uniform',
  params: { min: 0.5, max: 1.5 }
}, 'p-pickup');

engine.addProcess('p-pickup', 'Pickup Process', 'pickup', {
  distribution: 'uniform',
  params: { min: 0.5, max: 1 }
}, null);

engine.setArrivalRate(10); // 10 customers per minute
engine.setMaxSimTime(100); // Run for 100 minutes

console.log("Starting simulation (maxSimTime = 100 min)...\n");

engine.initialize();

let steps = 0;
let lastPrintTime = 0;

while (engine.step()) {
  steps++;

  // Print progress every 20 time units
  const currentTime = engine.getCurrentTime();
  if (currentTime - lastPrintTime >= 20) {
    const stats = engine.getStats();
    const progress = (currentTime / 100) * 100;
    console.log(`Time: ${currentTime.toFixed(1)} min (${progress.toFixed(1)}%) - Created: ${stats.totalEntitiesCreated}, Departed: ${stats.totalEntitiesDeparted}`);
    lastPrintTime = currentTime;
  }
}

console.log("\n=== SIMULATION COMPLETE ===\n");

const finalStats = engine.getStats();
const finalTime = engine.getCurrentTime();
const progress = (finalTime / 100) * 100;

console.log(`Total steps: ${steps}`);
console.log(`Final time: ${finalTime.toFixed(2)} min`);
console.log(`Progress: ${progress.toFixed(1)}%`);
console.log(`\nEntities created: ${finalStats.totalEntitiesCreated}`);
console.log(`Entities departed: ${finalStats.totalEntitiesDeparted}`);
console.log(`Avg cycle time: ${finalStats.avgCycleTime.toFixed(2)} min`);
console.log(`Throughput: ${finalStats.throughput.toFixed(2)} entities/min`);
console.log(`\nExpected throughput: ~${(10 / 1).toFixed(2)} entities/min (arrival rate / utilization)`);

// Verify completion
console.log("\n=== VERIFICATION ===\n");

if (finalTime >= 99.5) {
  console.log("✓ Simulation ran to completion (time >= 99.5)");
} else {
  console.log(`✗ Simulation stopped early at ${finalTime.toFixed(2)} min`);
}

if (finalStats.totalEntitiesCreated > 900) {
  console.log(`✓ Created sufficient entities (${finalStats.totalEntitiesCreated} > 900)`);
} else {
  console.log(`✗ Too few entities created (${finalStats.totalEntitiesCreated})`);
}

if (finalStats.totalEntitiesDeparted === finalStats.totalEntitiesCreated ||
    Math.abs(finalStats.totalEntitiesDeparted - finalStats.totalEntitiesCreated) <= 5) {
  console.log(`✓ All entities departed (${finalStats.totalEntitiesDeparted} ≈ ${finalStats.totalEntitiesCreated})`);
} else {
  console.log(`⚠ Some entities still in system: Created=${finalStats.totalEntitiesCreated}, Departed=${finalStats.totalEntitiesDeparted}`);
}

if (finalStats.throughput > 0 && finalStats.throughput < 15) {
  console.log(`✓ Throughput is reasonable (${finalStats.throughput.toFixed(2)} entities/min)`);
} else {
  console.log(`✗ Throughput seems wrong (${finalStats.throughput.toFixed(2)})`);
}

console.log("\n=== RESOURCE UTILIZATION ===\n");

const resources = engine.getResources();
resources.forEach(resource => {
  const util = finalStats.resourceUtilization[resource.id] || 0;
  console.log(`${resource.name}: ${(util * 100).toFixed(1)}% utilized`);
});

console.log("\n✓ TEST COMPLETE");
