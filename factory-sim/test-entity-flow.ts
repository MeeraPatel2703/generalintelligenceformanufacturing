/**
 * Test Entity Flow - Verify parts flow through entire system
 */

import { SimulationEngine } from './electron/simulation/engine.js';
import { SimulationConfig } from './src/types/simulation.js';

console.log('='.repeat(80));
console.log('ENTITY FLOW TEST - Verifying parts complete full journey');
console.log('='.repeat(80));

// Simple 3-machine flow: M1 -> M2 -> M3
const testConfig: SimulationConfig = {
  machines: [
    {
      id: 'M1',
      type: 'CNC',
      processTime: {
        distribution: 'constant',
        mean: 5 // 5 minutes
      },
      capacity: 10
    },
    {
      id: 'M2',
      type: 'Assembly',
      processTime: {
        distribution: 'constant',
        mean: 8 // 8 minutes (bottleneck)
      },
      capacity: 10
    },
    {
      id: 'M3',
      type: 'QualityControl',
      processTime: {
        distribution: 'constant',
        mean: 3 // 3 minutes
      },
      capacity: 10
    }
  ],
  flowSequence: ['M1', 'M2', 'M3'],
  arrivalRate: 1 / 10, // 1 part every 10 minutes
  simulationTime: 480, // 8 hours
  warmupTime: 60, // 1 hour
  numReplications: 5,
  baseSeed: 12345
};

console.log('\nTest Configuration:');
console.log('  Flow: M1 (5min) -> M2 (8min) -> M3 (3min)');
console.log('  Arrival: 1 part every 10 minutes');
console.log('  Runtime: 480 minutes (8 hours)');
console.log('  Warmup: 60 minutes');
console.log('  Replications: 5');
console.log('  Expected: ~42 parts/replication (after warmup)');
console.log('');

// Create and run simulation
const engine = new SimulationEngine(testConfig);
console.log('Starting simulation...\n');

const results = engine.run((progress) => {
  const percent = (progress * 100).toFixed(0);
  if (Number(percent) % 20 === 0) {
    process.stdout.write(`\rProgress: ${percent}%`);
  }
});

console.log('\n\n' + '='.repeat(80));
console.log('SIMULATION RESULTS');
console.log('='.repeat(80));

console.log('\nThroughput:');
console.log(`  Mean: ${results.throughput.mean.toFixed(2)} parts/hour`);
console.log(`  Std Dev: ${results.throughput.stdDev.toFixed(2)}`);

console.log('\nCycle Time:');
console.log(`  Mean: ${results.cycleTime.mean.toFixed(2)} minutes`);
console.log(`  Std Dev: ${results.cycleTime.stdDev.toFixed(2)} min`);

console.log('\nBottleneck Analysis:');
console.log(`  Machine: ${results.bottleneck.machineId}`);
console.log(`  Utilization: ${(results.bottleneck.utilization * 100).toFixed(1)}%`);

if (results.machineStats) {
  console.log('\nMachine Utilization:');
  results.machineStats.forEach((stats, machineId) => {
    console.log(`  ${machineId}: ${(stats.utilization.mean * 100).toFixed(1)}%`);
  });

  console.log('\nMachine Queue Lengths (avg):');
  results.machineStats.forEach((stats, machineId) => {
    console.log(`  ${machineId}: ${stats.queue.mean.toFixed(2)} parts`);
  });
}

console.log('\n' + '='.repeat(80));

// Verify entities flowed through
if (results.throughput.mean > 0) {
  console.log('✅ SUCCESS: Entities are flowing through the entire system!');
  console.log(`   Throughput of ${results.throughput.mean.toFixed(2)} parts/hour confirms complete flow.`);
} else {
  console.log('❌ FAILURE: No entities completed the journey!');
  console.log('   This indicates a blocking or flow issue.');
  process.exit(1);
}

console.log('='.repeat(80));
