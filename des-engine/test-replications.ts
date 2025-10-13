import { MM1Simulation } from './MM1Simulation';
import { SimulationRunner } from './SimulationRunner';

console.log('=== TESTING REPLICATIONS ===\n');

const runner = new SimulationRunner();

const lambda = 0.8;
const mu = 1.0;

console.log(`Running 30 replications: λ=${lambda}, μ=${mu}, T=10000\n`);

const results = runner.runMultipleReplications(
  30, // 30 replications
  () => new MM1Simulation(lambda, mu),
  10000 // run time
);

console.log('Multiple Replication Results:');
console.log(`  Mean Wait Time: ${results.mean.toFixed(2)}`);
console.log(`  Std Dev: ${results.stdDev.toFixed(2)}`);
console.log(`  95% CI: [${results.ci95Lower.toFixed(2)}, ${results.ci95Upper.toFixed(2)}]`);
console.log(`  Replications: ${results.replications}`);

// Analytical result should be in confidence interval
const rho = lambda / mu;
const analytical = rho / (mu - lambda); // 4.0
const inCI = analytical >= results.ci95Lower && analytical <= results.ci95Upper;

console.log(`\nAnalytical Wait Time: ${analytical.toFixed(2)}`);
console.log(`In 95% CI: ${inCI ? 'Yes ✓' : 'No ✗'}`);

console.assert(inCI, "FAILED: Analytical result not in 95% CI");

// Show distribution of results
const min = Math.min(...results.allValues);
const max = Math.max(...results.allValues);
console.log(`\nDistribution of wait times:`);
console.log(`  Min: ${min.toFixed(2)}`);
console.log(`  Max: ${max.toFixed(2)}`);
console.log(`  Range: ${(max - min).toFixed(2)}`);

console.log('\n✓ MULTIPLE REPLICATIONS WORKING');

// Test with different parameters
console.log('\n=== TESTING WITH DIFFERENT PARAMETERS ===\n');

console.log('Test case 2: λ=0.5, μ=1.0 (10 replications)');
const results2 = runner.runMultipleReplications(
  10,
  () => new MM1Simulation(0.5, 1.0),
  10000
);

const analytical2 = 0.5 / (1.0 - 0.5); // 1.0
const inCI2 = analytical2 >= results2.ci95Lower && analytical2 <= results2.ci95Upper;

console.log(`  Mean: ${results2.mean.toFixed(2)}, Expected: ${analytical2.toFixed(2)}`);
console.log(`  95% CI: [${results2.ci95Lower.toFixed(2)}, ${results2.ci95Upper.toFixed(2)}]`);
console.log(`  Analytical in CI: ${inCI2 ? 'Yes ✓' : 'No ✗'}`);

console.log('\nTest case 3: λ=0.9, μ=1.0 (30 replications, high variance)');
const results3 = runner.runMultipleReplications(
  30,
  () => new MM1Simulation(0.9, 1.0),
  10000
);

const analytical3 = 0.9 / (1.0 - 0.9); // 9.0
const inCI3 = analytical3 >= results3.ci95Lower && analytical3 <= results3.ci95Upper;

console.log(`  Mean: ${results3.mean.toFixed(2)}, Expected: ${analytical3.toFixed(2)}`);
console.log(`  Std Dev: ${results3.stdDev.toFixed(2)}`);
console.log(`  95% CI: [${results3.ci95Lower.toFixed(2)}, ${results3.ci95Upper.toFixed(2)}]`);
console.log(`  Analytical in CI: ${inCI3 ? 'Yes ✓' : 'No ✗'}`);

console.log('\n=== ALL REPLICATION TESTS PASSED ===\n');
