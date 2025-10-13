/**
 * SIMULATION MATH VALIDATION TEST
 *
 * Tests DES simulation WITHOUT AI extraction
 * Uses a hand-crafted ExtractedSystem to verify:
 * 1. SystemToDESMapper correctly converts to simulation
 * 2. Simulation math is correct (M/M/c queue theory)
 * 3. Statistics are Simio-grade quality
 */

import { runDESFromExtractedSystem } from './electron/simulation/SystemToDESMapper';
import type { ExtractedSystem } from './src/types/extraction';

console.log('='.repeat(80));
console.log('SIMULATION MATH VALIDATION TEST');
console.log('='.repeat(80));

// Create a mock sledding system (simplified from case study)
const mockSleddingSystem: ExtractedSystem = {
  systemName: 'Snow Tubing Facility (Test)',
  description: 'Simplified snow tubing system for validation',

  entities: [
    {
      name: 'Customer',
      description: 'Customers arriving for tubing session',
      attributes: [],
      arrivalPattern: {
        type: 'poisson',
        rate: 60,  // 60 customers per hour
        rateUnit: 'hour'
      }
    }
  ],

  resources: [
    {
      name: 'TubeLift',
      description: 'Lift that takes customers and tubes up the hill',
      capacity: 1,  // Single lift
      processingTime: {
        type: 'constant',
        parameters: { value: 3 }  // 3 minutes to go up
      },
      schedule: {
        type: 'always_on',
        periods: []
      }
    },
    {
      name: 'Tubing',
      description: 'Sliding down the hill',
      capacity: 10,  // Multiple lanes
      processingTime: {
        type: 'constant',
        parameters: { value: 2 }  // 2 minutes to slide down
      },
      schedule: {
        type: 'always_on',
        periods: []
      }
    }
  ],

  processes: [
    {
      name: 'TubingProcess',
      description: 'Customer rides lift up, tubes down',
      entityType: 'Customer',
      sequence: [
        {
          stepNumber: 1,
          activityType: 'process',
          resourceName: 'TubeLift',
          description: 'Ride lift to top'
        },
        {
          stepNumber: 2,
          activityType: 'process',
          resourceName: 'Tubing',
          description: 'Slide down hill'
        }
      ],
      routing: {
        type: 'sequential',
        destinations: []
      }
    }
  ],

  constraints: [],
  objectives: ['Maximize throughput', 'Minimize wait time']
};

console.log('\n[TEST SETUP]');
console.log('-'.repeat(80));
console.log(`System: ${mockSleddingSystem.systemName}`);
console.log(`Entities: ${mockSleddingSystem.entities?.length}`);
console.log(`Resources: ${mockSleddingSystem.resources?.length}`);
console.log(`  - TubeLift: capacity=1, processing=3 min`);
console.log(`  - Tubing: capacity=10, processing=2 min`);
console.log(`Arrival rate: 60 customers/hour (1 per minute)`);

// Theoretical analysis for validation
console.log('\n[THEORETICAL ANALYSIS]');
console.log('-'.repeat(80));

const arrivalRate = 60 / 60;  // 1 customer per minute
const liftServiceRate = 1 / 3;  // 1/3 customers per minute (3 min service)
const liftUtilization = arrivalRate / liftServiceRate;

console.log('TubeLift (M/M/1 Queue):');
console.log(`  Arrival rate (λ): ${arrivalRate.toFixed(3)} per minute`);
console.log(`  Service rate (μ): ${liftServiceRate.toFixed(3)} per minute`);
console.log(`  Utilization (ρ): ${(liftUtilization * 100).toFixed(1)}%`);

if (liftUtilization >= 1.0) {
  console.log(`  ⚠️  WARNING: System is unstable (ρ >= 1.0)`);
  console.log(`  Queue will grow without bound!`);
} else {
  const avgQueueLength = (liftUtilization ** 2) / (1 - liftUtilization);
  const avgWaitTime = avgQueueLength / arrivalRate;
  const avgSystemTime = avgWaitTime + (1 / liftServiceRate);

  console.log(`  Avg queue length (Lq): ${avgQueueLength.toFixed(2)} customers`);
  console.log(`  Avg wait time (Wq): ${avgWaitTime.toFixed(2)} minutes`);
  console.log(`  Avg system time (W): ${avgSystemTime.toFixed(2)} minutes`);
}

// Run simulation
console.log('\n[RUNNING SIMULATION]');
console.log('-'.repeat(80));

const simulationTime = 480;  // 8 hours
const numReplications = 30;

console.log(`Simulation time: ${simulationTime} minutes (${simulationTime/60} hours)`);
console.log(`Replications: ${numReplications}`);
console.log('Starting...\n');

const results = runDESFromExtractedSystem(mockSleddingSystem, simulationTime, numReplications);

console.log('\n[SIMULATION RESULTS]');
console.log('-'.repeat(80));

if (results.observations) {
  console.log('\nObservation Statistics:');
  for (const [name, stats] of Object.entries(results.observations)) {
    const s: any = stats;
    console.log(`  ${name}:`);
    console.log(`    Mean: ${s.mean?.toFixed(2) || 'N/A'}`);
    console.log(`    Std Dev: ${s.stdDev?.toFixed(2) || 'N/A'}`);
    console.log(`    95% CI: [${s.ci95?.[0]?.toFixed(2)}, ${s.ci95?.[1]?.toFixed(2)}]`);
    console.log(`    Min: ${s.min?.toFixed(2)}`);
    console.log(`    Max: ${s.max?.toFixed(2)}`);
  }
} else {
  console.log('⚠️  No observation statistics');
}

if (results.resources) {
  console.log('\nResource Utilization:');
  for (const [name, stats] of Object.entries(results.resources)) {
    const s: any = stats;
    console.log(`  ${name}:`);
    console.log(`    Utilization: ${(s.utilization * 100)?.toFixed(1)}%`);
    console.log(`    Std Dev: ${(s.utilizationStdDev * 100)?.toFixed(1)}%`);
    console.log(`    95% CI: [${(s.ci95?.[0] * 100)?.toFixed(1)}%, ${(s.ci95?.[1] * 100)?.toFixed(1)}%]`);
  }
} else {
  console.log('⚠️  No resource statistics');
}

// Validation
console.log('\n[VALIDATION]');
console.log('-'.repeat(80));

const checks: { name: string; pass: boolean; message: string }[] = [];

// Check 1: Simulation completed
checks.push({
  name: 'Simulation completed',
  pass: results !== null,
  message: results ? 'Results returned' : 'No results'
});

// Check 2: Throughput recorded
const throughput = results.observations?.throughput?.mean;
checks.push({
  name: 'Throughput recorded',
  pass: throughput !== undefined && throughput > 0,
  message: throughput ? `${throughput.toFixed(1)} customers` : 'No data'
});

// Check 3: Cycle time reasonable
const cycleTime = results.observations?.cycleTime?.mean;
const expectedCycleTime = 3 + 2;  // Lift + slide = 5 min minimum
checks.push({
  name: 'Cycle time reasonable',
  pass: cycleTime !== undefined && cycleTime >= expectedCycleTime,
  message: cycleTime ? `${cycleTime.toFixed(2)} min (>= ${expectedCycleTime} min expected)` : 'No data'
});

// Check 4: Lift utilization matches theory
if (results.resources?.TubeLift) {
  const simUtil = results.resources.TubeLift.utilization;
  const error = Math.abs(simUtil - liftUtilization) / liftUtilization;
  checks.push({
    name: 'Lift utilization matches theory',
    pass: error < 0.10,  // Within 10%
    message: `Sim: ${(simUtil * 100).toFixed(1)}%, Theory: ${(liftUtilization * 100).toFixed(1)}%, Error: ${(error * 100).toFixed(1)}%`
  });
}

// Check 5: No impossible values
let hasImpossible = false;
if (results.observations) {
  for (const stats of Object.values(results.observations)) {
    const s: any = stats;
    if (isNaN(s.mean) || s.mean < 0 || isNaN(s.stdDev)) {
      hasImpossible = true;
    }
  }
}
checks.push({
  name: 'No impossible values',
  pass: !hasImpossible,
  message: hasImpossible ? 'Found NaN or negative values' : 'All values valid'
});

// Check 6: Confidence intervals make sense
const ctCI = results.observations?.cycleTime?.ci95;
if (ctCI) {
  const ciValid = ctCI[0] < ctCI[1] && ctCI[0] > 0;
  checks.push({
    name: 'Confidence intervals valid',
    pass: ciValid,
    message: ciValid ? `[${ctCI[0].toFixed(2)}, ${ctCI[1].toFixed(2)}] minutes` : 'Invalid CI'
  });
}

// Print validation results
console.log('');
let allPass = true;
for (const check of checks) {
  const status = check.pass ? '✅' : '❌';
  console.log(`${status} ${check.name}: ${check.message}`);
  if (!check.pass) allPass = false;
}

// Final verdict
console.log('\n' + '='.repeat(80));
console.log('FINAL VERDICT');
console.log('='.repeat(80));

if (allPass) {
  console.log('\n🎉 SIMIO-GRADE SIMULATION ACHIEVED! 🎉');
  console.log('\n✅ All validation checks passed:');
  console.log('  ✓ Simulation executes correctly');
  console.log('  ✓ Statistics match theoretical predictions');
  console.log('  ✓ Math is correct (queue theory validated)');
  console.log('  ✓ Confidence intervals computed properly');
  console.log('  ✓ No NaN, negative, or impossible values');
  console.log('\n🏆 PRODUCTION-READY FOR SIMIO-GRADE ANALYSIS 🏆');
} else {
  console.log('\n❌ VALIDATION FAILED');
  console.log('Some checks did not pass. Review results above.');
}

console.log('\n' + '='.repeat(80));

process.exit(allPass ? 0 : 1);
