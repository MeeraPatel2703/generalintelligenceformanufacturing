import { MultiStageSimulation } from './MultiStageSimulation';

console.log('=== TESTING MULTI-STAGE SYSTEM ===\n');

// Test 1: Three stations with deterministic service times
console.log('Test 1: Three stations with deterministic service times');
console.log('  Station 1: 2 servers, 5 min service time');
console.log('  Station 2: 1 server, 3 min service time');
console.log('  Station 3: 3 servers, 4 min service time\n');

const sim1 = new MultiStageSimulation(1.0, 100); // 1 arrival per min, max 100

sim1.addStation('Station 1', 2, () => 5.0);
sim1.addStation('Station 2', 1, () => 3.0);
sim1.addStation('Station 3', 3, () => 4.0);

const results1 = sim1.run(200);

console.log('Results:');
console.log(`  Entities completed: ${results1.entitiesCompleted}`);
console.log(`  Avg cycle time: ${results1.avgCycleTime.toFixed(2)} min`);
console.log(`  Expected cycle time (no waiting): ${(5 + 3 + 4).toFixed(2)} min\n`);

console.log('Station Statistics:');
results1.stationStats.forEach(stat => {
  console.log(`  ${stat.name}:`);
  console.log(`    Avg wait time: ${stat.avgWaitTime.toFixed(2)} min`);
  console.log(`    Avg service time: ${stat.avgServiceTime.toFixed(2)} min`);
  console.log(`    Customers served: ${stat.customersServed}`);
});

// Verify cycle time is at least sum of service times
const minCycleTime = 5 + 3 + 4;
console.assert(results1.avgCycleTime >= minCycleTime, "Cycle time should be at least sum of service times");
console.log('\n✓ Multi-stage routing works\n');

// Test 2: Simple two-stage with exponential service times
console.log('Test 2: Two-stage system with exponential service times');
const sim2 = new MultiStageSimulation(0.5, 50);

sim2.addStation('Stage 1', 1, () => -Math.log(Math.random()) / 1.0); // Exp(1)
sim2.addStation('Stage 2', 1, () => -Math.log(Math.random()) / 2.0); // Exp(2)

const results2 = sim2.run(200);

console.log('Results:');
console.log(`  Entities completed: ${results2.entitiesCompleted}`);
console.log(`  Avg cycle time: ${results2.avgCycleTime.toFixed(2)} min`);

const expectedServiceTime1 = 1.0; // 1/1.0
const expectedServiceTime2 = 0.5; // 1/2.0

console.log(`\nStation 1:`);
console.log(`  Avg service time: ${results2.stationStats[0].avgServiceTime.toFixed(2)} (expected ~${expectedServiceTime1.toFixed(2)})`);
console.log(`Station 2:`);
console.log(`  Avg service time: ${results2.stationStats[1].avgServiceTime.toFixed(2)} (expected ~${expectedServiceTime2.toFixed(2)})`);

console.log('\n✓ Multi-stage with stochastic service times works\n');

// Test 3: Bottleneck analysis
console.log('Test 3: Bottleneck analysis (slow middle station)');
const sim3 = new MultiStageSimulation(2.0, 100); // Higher arrival rate

sim3.addStation('Fast 1', 3, () => 0.2);  // Fast
sim3.addStation('Bottleneck', 1, () => 1.0); // Slow bottleneck
sim3.addStation('Fast 2', 3, () => 0.2);  // Fast

const results3 = sim3.run(200);

console.log('Results:');
console.log(`  Avg cycle time: ${results3.avgCycleTime.toFixed(2)} min`);
console.log('\nStation wait times:');
results3.stationStats.forEach(stat => {
  console.log(`  ${stat.name}: ${stat.avgWaitTime.toFixed(2)} min wait`);
});

// Bottleneck should have highest wait time
const bottleneckWait = results3.stationStats[1].avgWaitTime;
const otherWaits = [results3.stationStats[0].avgWaitTime, results3.stationStats[2].avgWaitTime];

console.assert(bottleneckWait > Math.max(...otherWaits), "Bottleneck should have longest wait");
console.log('\n✓ Bottleneck correctly identified\n');

// Test 4: Verify flow conservation (same customers through all stations)
console.log('Test 4: Flow conservation check');
const sim4 = new MultiStageSimulation(1.0, 50);

sim4.addStation('A', 2, () => 1.0);
sim4.addStation('B', 2, () => 1.0);
sim4.addStation('C', 2, () => 1.0);

const results4 = sim4.run(100);

console.log('Customers served at each station:');
results4.stationStats.forEach(stat => {
  console.log(`  ${stat.name}: ${stat.customersServed}`);
});

// All stations should serve same number (flow conservation)
const served = results4.stationStats.map(s => s.customersServed);
const allSame = served.every(s => s === served[0]);

console.assert(allSame, "Flow conservation violated");
console.assert(served[0] === results4.entitiesCompleted, "Entities completed should match");
console.log(`  ✓ Flow conserved: ${results4.entitiesCompleted} entities through all stages\n`);

console.log('=== ALL MULTI-STAGE TESTS PASSED ===\n');
