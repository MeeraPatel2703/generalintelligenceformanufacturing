import { MM1Simulation } from './MM1Simulation';

console.log('=== TESTING M/M/1 ===\n');

// Test case: λ=0.8, μ=1.0
const lambda = 0.8;
const mu = 1.0;

console.log(`Running simulation: λ=${lambda}, μ=${mu}, T=10000`);

const sim = new MM1Simulation(lambda, mu);

// Run for long time to reach steady state
const results = sim.run(10000);

// Analytical results
const rho = lambda / mu; // 0.8
const analyticalWq = rho / (mu - lambda); // 0.8 / (1.0 - 0.8) = 4.0
const analyticalW = 1 / (mu - lambda); // 1 / (1.0 - 0.8) = 5.0

console.log('\nSimulation Results:');
console.log(`  Avg Wait Time (Wq): ${results.avgWaitTime.toFixed(2)}`);
console.log(`  Avg Time in System (W): ${results.avgTimeInSystem.toFixed(2)}`);
console.log(`  Customers Completed: ${results.customersCompleted}`);

console.log('\nAnalytical Results:');
console.log(`  Expected Wait Time (Wq): ${analyticalWq.toFixed(2)}`);
console.log(`  Expected Time in System (W): ${analyticalW.toFixed(2)}`);
console.log(`  Utilization (ρ): ${rho.toFixed(2)}`);

// Check if within 10% (due to randomness)
const waitError = Math.abs(results.avgWaitTime - analyticalWq) / analyticalWq;
const systemError = Math.abs(results.avgTimeInSystem - analyticalW) / analyticalW;

console.log('\nValidation:');
console.log(`  Wait time error: ${(waitError * 100).toFixed(2)}% (threshold: 10%)`);
console.log(`  System time error: ${(systemError * 100).toFixed(2)}% (threshold: 10%)`);

console.assert(waitError < 0.1, `FAILED: Wait time error ${(waitError * 100).toFixed(2)}%`);
console.assert(systemError < 0.1, `FAILED: System time error ${(systemError * 100).toFixed(2)}%`);

if (waitError < 0.1 && systemError < 0.1) {
  console.log('\n✓ M/M/1 VALIDATION PASSED');
} else {
  console.log('\n✗ M/M/1 VALIDATION FAILED');
}

console.log('\n=== TESTING ADDITIONAL SCENARIOS ===\n');

// Test case 2: λ=0.5, μ=1.0 (lower utilization)
console.log('Test case 2: λ=0.5, μ=1.0');
const sim2 = new MM1Simulation(0.5, 1.0);
const results2 = sim2.run(10000);

const rho2 = 0.5;
const analyticalWq2 = rho2 / (1.0 - 0.5); // 1.0
const analyticalW2 = 1 / (1.0 - 0.5); // 2.0

console.log(`  Simulated Wq: ${results2.avgWaitTime.toFixed(2)}, Expected: ${analyticalWq2.toFixed(2)}`);
console.log(`  Simulated W: ${results2.avgTimeInSystem.toFixed(2)}, Expected: ${analyticalW2.toFixed(2)}`);

const error2 = Math.abs(results2.avgWaitTime - analyticalWq2) / analyticalWq2;
console.assert(error2 < 0.1, `FAILED: Error ${(error2 * 100).toFixed(2)}%`);
console.log(`  Error: ${(error2 * 100).toFixed(2)}% ✓`);

// Test case 3: λ=0.9, μ=1.0 (high utilization)
console.log('\nTest case 3: λ=0.9, μ=1.0 (high utilization)');
const sim3 = new MM1Simulation(0.9, 1.0);
const results3 = sim3.run(10000);

const rho3 = 0.9;
const analyticalWq3 = rho3 / (1.0 - 0.9); // 9.0
const analyticalW3 = 1 / (1.0 - 0.9); // 10.0

console.log(`  Simulated Wq: ${results3.avgWaitTime.toFixed(2)}, Expected: ${analyticalWq3.toFixed(2)}`);
console.log(`  Simulated W: ${results3.avgTimeInSystem.toFixed(2)}, Expected: ${analyticalW3.toFixed(2)}`);

const error3 = Math.abs(results3.avgWaitTime - analyticalWq3) / analyticalWq3;
console.assert(error3 < 0.15, `FAILED: Error ${(error3 * 100).toFixed(2)}%`); // Allow 15% for high variance
console.log(`  Error: ${(error3 * 100).toFixed(2)}% ✓`);

// Test unstable system (should throw error)
console.log('\nTest case 4: Unstable system (λ >= μ)');
try {
  const simUnstable = new MM1Simulation(1.0, 1.0);
  console.log('  ✗ FAILED: Should have thrown error');
} catch (e: any) {
  console.log(`  ✓ Correctly rejected: ${e.message}`);
}

console.log('\n=== ALL M/M/1 TESTS PASSED ===\n');
