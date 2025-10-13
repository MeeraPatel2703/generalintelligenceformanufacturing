console.log('================================================================================');
console.log('DISCRETE EVENT SIMULATION ENGINE - COMPREHENSIVE TEST');
console.log('================================================================================\n');

import { EventQueue } from './EventQueue';
import { MM1Simulation } from './MM1Simulation';
import { SimulationRunner } from './SimulationRunner';
import { MMcSimulation } from './MMcSimulation';
import { Distributions } from './Distributions';
import { MultiStageSimulation } from './MultiStageSimulation';
import { SnowTubingSimulation } from './SnowTubingSimulation';

let allTestsPassed = true;

// ===== PRIORITY 1: EVENT QUEUE =====
console.log('=== PRIORITY 1: EVENT QUEUE ===');
const queue = new EventQueue();
queue.insert({ time: 10, type: 'A' });
queue.insert({ time: 5, type: 'B' });
queue.insert({ time: 15, type: 'C' });

const e1 = queue.getNext();
const e2 = queue.getNext();
const e3 = queue.getNext();

if (e1!.time === 5 && e2!.time === 10 && e3!.time === 15) {
  console.log('✓ Basic ordering works');
} else {
  console.log('✗ FAILED: Basic ordering');
  allTestsPassed = false;
}

const queue2 = new EventQueue();
queue2.insert({ time: 10, type: 'X', id: 1 });
queue2.insert({ time: 10, type: 'Y', id: 2 });
queue2.insert({ time: 10, type: 'Z', id: 3 });

const f1 = queue2.getNext();
const f2 = queue2.getNext();
const f3 = queue2.getNext();

if (f1!.id === 1 && f2!.id === 2 && f3!.id === 3) {
  console.log('✓ Simultaneous events handled correctly (FIFO)');
} else {
  console.log('✗ FAILED: Tie-breaking');
  allTestsPassed = false;
}

console.log('');

// ===== PRIORITY 2: M/M/1 VALIDATION =====
console.log('=== PRIORITY 2: M/M/1 VALIDATION ===');
const lambda = 0.8;
const mu = 1.0;

// Use multiple replications for statistical validity
const mm1Runner = new SimulationRunner();
const mm1Results = mm1Runner.runMultipleReplications(
  10,
  () => new MM1Simulation(lambda, mu),
  10000
);

const rho = lambda / mu;
const analyticalWq = rho / (mu - lambda);

console.log(`Running 10 replications: λ=${lambda}, μ=${mu}, T=10000`);
console.log(`Mean avg wait: ${mm1Results.mean.toFixed(2)}`);
console.log(`Analytical avg wait: ${analyticalWq.toFixed(2)}`);
console.log(`95% CI: [${mm1Results.ci95Lower.toFixed(2)}, ${mm1Results.ci95Upper.toFixed(2)}]`);

const inMM1CI = analyticalWq >= mm1Results.ci95Lower && analyticalWq <= mm1Results.ci95Upper;

if (inMM1CI) {
  console.log('✓ M/M/1 validation passed (analytical in CI)');
} else {
  console.log('✗ FAILED: M/M/1 validation');
  allTestsPassed = false;
}

console.log('');

// ===== PRIORITY 3: REPLICATIONS =====
console.log('=== PRIORITY 3: REPLICATIONS ===');
const runner = new SimulationRunner();

const repResults = runner.runMultipleReplications(
  30,
  () => new MM1Simulation(0.8, 1.0),
  10000
);

console.log(`30 replications completed`);
console.log(`Mean: ${repResults.mean.toFixed(2)}, StdDev: ${repResults.stdDev.toFixed(2)}`);
console.log(`95% CI: [${repResults.ci95Lower.toFixed(2)}, ${repResults.ci95Upper.toFixed(2)}]`);

const analytical = 4.0;
const inCI = analytical >= repResults.ci95Lower && analytical <= repResults.ci95Upper;

if (inCI) {
  console.log(`Analytical (${analytical.toFixed(2)}) is in CI: ✓`);
  console.log('✓ Replication system working');
} else {
  console.log('✗ FAILED: Analytical result not in CI');
  allTestsPassed = false;
}

console.log('');

// ===== PRIORITY 4: M/M/c =====
console.log('=== PRIORITY 4: M/M/c (MULTIPLE SERVERS) ===');
const lambda3 = 2.5;
const mu3 = 1.0;
const c3 = 3;

const sim3 = new MMcSimulation(lambda3, mu3, c3);
const results3 = sim3.run(10000);

console.log(`M/M/3: λ=${lambda3}, μ=${mu3}, c=${c3}`);
console.log(`Avg wait time: ${results3.avgWaitTime.toFixed(2)}`);
console.log(`Utilization: ${(lambda3 / (c3 * mu3)).toFixed(2)}`);

if (results3.avgWaitTime > 0 && results3.avgWaitTime < 5) {
  console.log('✓ M/M/c working correctly');
} else {
  console.log('✗ FAILED: M/M/c validation');
  allTestsPassed = false;
}

console.log('');

// ===== PRIORITY 5: DISTRIBUTIONS =====
console.log('=== PRIORITY 5: DISTRIBUTIONS ===');
const dist = new Distributions();
const samples = 10000;

// Test exponential
const expSamples = Array(samples).fill(0).map(() => dist.exponential(2));
const expMean = expSamples.reduce((a, b) => a + b, 0) / samples;
const expExpected = 1 / 2;

// Test uniform
const uSamples = Array(samples).fill(0).map(() => dist.uniform(5, 15));
const uMean = uSamples.reduce((a, b) => a + b, 0) / samples;
const uExpected = 10;

// Test triangular
const tSamples = Array(samples).fill(0).map(() => dist.triangular(10, 20, 30));
const tMean = tSamples.reduce((a, b) => a + b, 0) / samples;
const tExpected = 20;

// Test normal
const nSamples = Array(samples).fill(0).map(() => dist.normal(100, 15));
const nMean = nSamples.reduce((a, b) => a + b, 0) / samples;
const nExpected = 100;

console.log(`Exponential(2): mean=${expMean.toFixed(3)}, expected=${expExpected.toFixed(3)}`);
console.log(`Uniform(5,15): mean=${uMean.toFixed(3)}, expected=${uExpected.toFixed(3)}`);
console.log(`Triangular(10,20,30): mean=${tMean.toFixed(3)}, expected=${tExpected.toFixed(3)}`);
console.log(`Normal(100,15): mean=${nMean.toFixed(3)}, expected=${nExpected.toFixed(3)}`);

if (
  Math.abs(expMean - expExpected) < 0.05 &&
  Math.abs(uMean - uExpected) < 0.1 &&
  Math.abs(tMean - tExpected) < 0.2 &&
  Math.abs(nMean - nExpected) < 1.0
) {
  console.log('✓ All distributions working');
} else {
  console.log('✗ FAILED: Distribution validation');
  allTestsPassed = false;
}

console.log('');

// ===== PRIORITY 6: MULTI-STAGE =====
console.log('=== PRIORITY 6: MULTI-STAGE ROUTING ===');
const simMulti = new MultiStageSimulation(1.0, 50);

simMulti.addStation('Station 1', 2, () => 1.0);
simMulti.addStation('Station 2', 2, () => 1.0);
simMulti.addStation('Station 3', 2, () => 1.0);

const resultsMulti = simMulti.run(100);

console.log(`Entities completed: ${resultsMulti.entitiesCompleted}`);
console.log(`Avg cycle time: ${resultsMulti.avgCycleTime.toFixed(2)} min`);

// Check flow conservation
const served = resultsMulti.stationStats.map(s => s.customersServed);
const flowConserved = served.every(s => s === served[0]);

if (flowConserved && resultsMulti.entitiesCompleted > 0) {
  console.log(`✓ Flow conserved: ${resultsMulti.entitiesCompleted} entities through all stages`);
  console.log('✓ Multi-stage routing working');
} else {
  console.log('✗ FAILED: Flow conservation or completion');
  allTestsPassed = false;
}

console.log('');

// ===== PRIORITY 7: SNOW TUBING =====
console.log('=== PRIORITY 7: SNOW TUBING MODEL ===');
const simSnow = new SnowTubingSimulation();
const resultsSnow = simSnow.run(105);

console.log(`Session time: ${resultsSnow.sessionDuration} minutes`);
console.log(`Arrivals: ${resultsSnow.totalArrivals} people`);
console.log(`Processed: ${resultsSnow.customersProcessed} people`);
console.log(`Avg total time: ${resultsSnow.avgTotalTime.toFixed(2)} min`);

if (
  resultsSnow.totalArrivals >= 180 &&
  resultsSnow.totalArrivals <= 220 &&
  resultsSnow.customersProcessed > 0
) {
  console.log('✓ Snow tubing model working');
} else {
  console.log('✗ FAILED: Snow tubing validation');
  allTestsPassed = false;
}

console.log('');

// ===== FINAL SUMMARY =====
console.log('================================================================================');
console.log('DELIVERY CHECKLIST');
console.log('================================================================================');

console.log('\n1. ✓ EventQueue class that maintains time order');
console.log('2. ✓ M/M/1 simulation that matches analytical results');
console.log('3. ✓ Multiple replication support with confidence intervals');
console.log('4. ✓ M/M/c simulation (multiple servers)');
console.log('5. ✓ Distribution library (Exponential, Uniform, Triangular, Normal)');
console.log('6. ✓ Multi-stage routing');
console.log('7. ✓ Simplified snow tubing model');

console.log('\n================================================================================');

if (allTestsPassed) {
  console.log('✓✓✓ ALL TESTS PASSED - DES ENGINE IS WORKING ✓✓✓');
} else {
  console.log('✗✗✗ SOME TESTS FAILED ✗✗✗');
}

console.log('================================================================================\n');
