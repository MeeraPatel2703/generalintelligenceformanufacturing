/**
 * Standalone test to verify DES simulation clock advances
 * and entities flow through the system correctly
 */

import { DESEngine } from './src/simulation/DESEngine';

console.log('='.repeat(80));
console.log('DES SIMULATION CLOCK TEST - Snow Tubing Example');
console.log('='.repeat(80));
console.log('');

// Create engine
const engine = new DESEngine();

// Configure Resources
engine.addResource('lift', 'Ski Lift', 6);  // 6-person capacity
engine.addResource('lane1', 'Tubing Lane 1', 1);  // 1 person at a time

// Configure Processes
// Lift ride: 5 minutes, then go to tubing
engine.addProcess('lift-ride', 'Lift Ride Up', 'lift', {
  distribution: 'constant',
  params: { value: 5.0 }
}, 'tubing-ride');

// Tubing ride: 3 minutes, then exit
engine.addProcess('tubing-ride', 'Tubing Ride Down', 'lane1', {
  distribution: 'constant',
  params: { value: 3.0 }
}, null);  // null = depart system

// Set arrival rate: 0.2 sledders per minute (12 per hour)
engine.setArrivalRate(0.2);

// Run for 60 minutes
engine.setMaxSimTime(60);

console.log('Configuration:');
console.log('  - Lift: 6 capacity, 5 min ride up');
console.log('  - Tubing Lane: 1 capacity, 3 min ride down');
console.log('  - Arrival rate: 0.2 sledders/min (12/hour)');
console.log('  - Simulation duration: 60 minutes');
console.log('');

// Initialize simulation
engine.initialize();

console.log('Running simulation...');
console.log('');

// Track progress
let eventCount = 0;
let lastCheckTime = 0;
const checkInterval = 10;  // Report every 10 minutes

// Run the simulation
while (engine.step()) {
  eventCount++;
  const currentTime = engine.getCurrentTime();

  // Report progress every 10 sim-minutes
  if (currentTime - lastCheckTime >= checkInterval) {
    const stats = engine.getStats();
    console.log(`[T=${currentTime.toFixed(1)} min] Events: ${eventCount}, Arrived: ${stats.totalEntitiesCreated}, Departed: ${stats.totalEntitiesDeparted}`);
    lastCheckTime = Math.floor(currentTime / checkInterval) * checkInterval;
  }
}

// Get final statistics
const finalStats = engine.getStats();
const finalTime = engine.getCurrentTime();
const allEntities = engine.getEntities();
const inSystem = allEntities.filter(e => e.state !== 'departed').length;

console.log('');
console.log('='.repeat(80));
console.log('SIMULATION COMPLETE');
console.log('='.repeat(80));
console.log('');
console.log(`Final Time: ${finalTime.toFixed(2)} minutes`);
console.log(`Total Events Processed: ${eventCount}`);
console.log('');
console.log('Entity Statistics:');
console.log(`  Sledders Created: ${finalStats.totalEntitiesCreated}`);
console.log(`  Sledders Departed: ${finalStats.totalEntitiesDeparted}`);
console.log(`  Still in System: ${inSystem}`);
console.log(`  Avg Cycle Time: ${finalStats.avgCycleTime.toFixed(2)} min`);
console.log(`  Throughput: ${finalStats.throughput.toFixed(4)} sledders/min`);
console.log('');

// Verification checks
console.log('Verification:');
const timeAdvanced = finalTime >= 60;
const entitiesCreated = finalStats.totalEntitiesCreated > 0;
const entitiesDeparted = finalStats.totalEntitiesDeparted > 0;
const systemDrained = inSystem === 0;
const allCompleted = finalStats.totalEntitiesDeparted === finalStats.totalEntitiesCreated;

console.log(`  ${timeAdvanced ? '✓' : '✗'} Time advanced to ${finalTime.toFixed(1)} min (expected >= 60)`);
console.log(`  ${entitiesCreated ? '✓' : '✗'} Entities created: ${finalStats.totalEntitiesCreated}`);
console.log(`  ${entitiesDeparted ? '✓' : '✗'} Entities departed: ${finalStats.totalEntitiesDeparted}`);
console.log(`  ${systemDrained ? '✓' : '✗'} System fully drained (${inSystem} remaining)`);
console.log(`  ${allCompleted ? '✓' : '✗'} All entities completed their journey`);
console.log('');

// Overall result
const allTestsPassed = timeAdvanced && entitiesCreated && entitiesDeparted && systemDrained && allCompleted;

if (allTestsPassed) {
  console.log('✅ TEST PASSED - Simulation clock advances and entities flow correctly!');
  console.log('');
  console.log('Key findings:');
  console.log(`  - Simulation ran from T=0 to T=${finalTime.toFixed(1)} minutes`);
  console.log(`  - ${finalStats.totalEntitiesCreated} sledders entered the system`);
  console.log(`  - ${finalStats.totalEntitiesDeparted} sledders completed both lift and tubing`);
  console.log(`  - Average time in system: ${finalStats.avgCycleTime.toFixed(2)} minutes`);
  console.log(`  - Expected cycle time: 5 + 3 = 8 minutes (matches: ${Math.abs(finalStats.avgCycleTime - 8) < 0.5 ? 'YES' : 'NO'})`);
} else {
  console.log('❌ TEST FAILED - Issues detected:');
  if (!timeAdvanced) console.log('   - Time did not advance properly');
  if (!entitiesCreated) console.log('   - No entities were created');
  if (!entitiesDeparted) console.log('   - No entities departed');
  if (!systemDrained) console.log(`   - System not drained (${inSystem} entities stuck)`);
  if (!allCompleted) console.log('   - Not all entities completed');
}

console.log('');
process.exit(allTestsPassed ? 0 : 1);
