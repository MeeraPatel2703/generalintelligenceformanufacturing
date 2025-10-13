/**
 * Test the sledding/snow tubing simulation
 * Verify that time advances and entities flow correctly
 */

import { DESEngine } from './src/simulation/DESEngine.js';

console.log('='.repeat(80));
console.log('SNOW TUBING SIMULATION TEST');
console.log('='.repeat(80));
console.log('');

// Create engine
const engine = new DESEngine();

// Configure Lift (6-person capacity, shared resource)
engine.addResource('lift', 'Ski Lift', 6);

// Configure Tubing Lanes (6 separate lanes)
for (let i = 1; i <= 6; i++) {
  engine.addResource(`lane${i}`, `Tubing Lane ${i}`, 1);
}

// Add Lift Process (5 min ride up)
engine.addProcess('lift-ride', 'Lift Ride', 'lift', {
  distribution: 'constant',
  params: { value: 5 }
}, 'tubing-ride');

// Add Tubing Process (3 min ride down) - goes to lane1 for simplicity
engine.addProcess('tubing-ride', 'Tubing Ride', 'lane1', {
  distribution: 'constant',
  params: { value: 3 }
}, null); // null = exit system after this

// Set arrival rate: 12 sledders per hour = 0.2 per minute
engine.setArrivalRate(0.2);

// Run for 60 minutes
engine.setMaxSimTime(60);

console.log('Configuration:');
console.log('  - Lift: 6 capacity, 5 min process time');
console.log('  - Tubing Lane 1: 1 capacity, 3 min process time');
console.log('  - Arrival rate: 0.2 sledders/min (12 per hour)');
console.log('  - Simulation time: 60 minutes');
console.log('');

// Initialize and track progress
engine.initialize();

let lastTime = 0;
let eventCount = 0;
let timeCheckpoints = [10, 20, 30, 40, 50, 60];
let nextCheckpoint = 0;

console.log('Starting simulation...');
console.log('');

// Run step by step to monitor progress
while (engine.step()) {
  eventCount++;
  const currentTime = engine.getCurrentTime();

  // Check if we passed a checkpoint
  if (nextCheckpoint < timeCheckpoints.length && currentTime >= timeCheckpoints[nextCheckpoint]) {
    const stats = engine.getStats();
    const entities = engine.getEntities();

    console.log(`[T=${currentTime.toFixed(1)} min] Checkpoint ${timeCheckpoints[nextCheckpoint]} min`);
    console.log(`  Events processed: ${eventCount}`);
    console.log(`  Entities created: ${stats.totalEntitiesCreated}`);
    console.log(`  Entities departed: ${stats.totalEntitiesDeparted}`);
    console.log(`  Entities in system: ${entities.filter(e => e.state !== 'departed').length}`);
    console.log('');

    nextCheckpoint++;
  }

  lastTime = currentTime;
}

// Final results
const finalStats = engine.getStats();
const finalTime = engine.getCurrentTime();

console.log('='.repeat(80));
console.log('SIMULATION COMPLETE');
console.log('='.repeat(80));
console.log('');
console.log(`Final Time: ${finalTime.toFixed(2)} minutes`);
console.log(`Total Events: ${eventCount}`);
console.log('');
console.log('Statistics:');
console.log(`  Sledders Created: ${finalStats.totalEntitiesCreated}`);
console.log(`  Sledders Departed: ${finalStats.totalEntitiesDeparted}`);
console.log(`  Avg Cycle Time: ${finalStats.avgCycleTime.toFixed(2)} min`);
console.log(`  Throughput: ${finalStats.throughput.toFixed(2)} sledders/min`);
console.log('');

// Verify expected behavior
console.log('Verification:');
const allEntities = engine.getEntities();
const inSystem = allEntities.filter(e => e.state !== 'departed').length;

console.log(`  ✓ Time advanced: ${finalTime > 0 ? 'YES' : 'NO'}`);
console.log(`  ✓ Entities created: ${finalStats.totalEntitiesCreated > 0 ? 'YES' : 'NO'}`);
console.log(`  ✓ Entities departed: ${finalStats.totalEntitiesDeparted > 0 ? 'YES' : 'NO'}`);
console.log(`  ✓ System drained: ${inSystem === 0 ? 'YES' : `NO (${inSystem} still in system)`}`);

const allDeparted = finalStats.totalEntitiesDeparted === finalStats.totalEntitiesCreated;
console.log(`  ✓ All entities completed: ${allDeparted ? 'YES' : 'NO'}`);
console.log('');

if (allDeparted && finalStats.totalEntitiesDeparted > 0) {
  console.log('✅ TEST PASSED - Simulation clock advances and entities flow correctly!');
} else {
  console.log('❌ TEST FAILED - Issues detected with simulation');
}
console.log('');
