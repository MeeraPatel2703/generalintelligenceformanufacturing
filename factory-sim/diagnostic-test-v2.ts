/**
 * DIAGNOSTIC TEST V2 - Test with proper Poisson arrival generation
 *
 * This test generates arrivals throughout the entire simulation period
 * using the same method as the IndustrialSimulationAdapter
 */

import { IndustrialDESKernel, DESEvent, Distribution } from './src/des-core/IndustrialDESKernel';
import { MersenneTwister } from './src/des-core/MersenneTwister';

console.log('='.repeat(80));
console.log('DIAGNOSTIC TEST V2: CONTINUOUS POISSON ARRIVALS');
console.log('='.repeat(80));

// Create simulation kernel
const kernel = new IndustrialDESKernel(12345);

// Add a simple resource (single server)
kernel.addResource('server1', 'Server 1', 1);

// Configuration
const endTime = 60; // 60 minutes
const arrivalRate = 30; // per hour
const arrivalRatePerMinute = arrivalRate / 60; // 0.5 per minute
const serviceTime = 1.5; // minutes (constant)

console.log('\n[TEST SETUP]');
console.log(`  Simulation end time: ${endTime} minutes`);
console.log(`  Arrival rate: ${arrivalRate} per hour (${arrivalRatePerMinute.toFixed(4)} per minute)`);
console.log(`  Mean inter-arrival: ${(1 / arrivalRatePerMinute).toFixed(2)} minutes`);
console.log(`  Service time: ${serviceTime} minutes (constant)`);
console.log(`  Expected arrivals: ~${Math.floor(endTime * arrivalRatePerMinute)} entities`);

// Generate arrivals using Poisson process (same as adapter does)
console.log('\n[GENERATING ARRIVALS]');
const rng = kernel.getRNGStreamManager().getStream('arrivals');

let currentTime = 0;
let arrivalCount = 0;
const maxArrivals = 10000; // safety limit

while (currentTime < endTime && arrivalCount < maxArrivals) {
  // Sample exponential inter-arrival time
  const interarrival = -Math.log(1 - rng.random()) / arrivalRatePerMinute;
  currentTime += interarrival;

  // Check if this arrival is within simulation time
  if (currentTime >= endTime) {
    break;
  }

  const entityId = `entity_${arrivalCount}`;

  // Schedule arrival event
  kernel.scheduleEvent(new DESEvent(
    currentTime,
    'arrival',
    0,
    entityId,
    undefined,
    {
      entityType: 'Customer',
      firstResource: 'server1',
      serviceTimeDistribution: { type: 'constant', value: serviceTime } as Distribution
    }
  ));

  if (arrivalCount < 5) {
    console.log(`  Scheduled arrival ${arrivalCount}: time=${currentTime.toFixed(4)}`);
  }

  arrivalCount++;
}

console.log(`  Total arrivals scheduled: ${arrivalCount}`);
console.log(`  Last arrival time: ${(currentTime - (currentTime >= endTime ? (-Math.log(1 - rng.random()) / arrivalRatePerMinute) : 0)).toFixed(2)} minutes`);

// Run simulation
console.log(`\n[RUNNING SIMULATION]`);
const startTime = Date.now();
kernel.run(endTime, 0);
const runTime = Date.now() - startTime;

console.log(`  Simulation completed in ${runTime}ms`);

// Get statistics
const stats = kernel.getStatistics();

console.log('\n' + '='.repeat(80));
console.log('DIAGNOSTIC REPORT');
console.log('='.repeat(80));

console.log('\n[SIMULATION STATE]');
console.log(`  ✓ Does simulation start? YES`);
console.log(`  ✓ Do entities get created? ${stats.simulation.entitiesCreated > 0 ? 'YES' : 'NO'}`);
console.log(`  ✓ Does simulation clock advance? ${stats.simulation.currentTime > 0 ? 'YES' : 'NO'}`);
console.log(`  ✓ Do entities depart? ${stats.simulation.entitiesDeparted > 0 ? 'YES' : 'NO'}`);
console.log(`  ✓ Does simulation reach endTime? ${stats.simulation.currentTime >= endTime ? 'YES' : 'NO'}`);

console.log('\n[FINAL METRICS]');
console.log(`  Simulation time: ${stats.simulation.currentTime.toFixed(2)} minutes`);
console.log(`  Progress: ${((stats.simulation.currentTime / endTime) * 100).toFixed(1)}%`);
console.log(`  Entities created: ${stats.simulation.entitiesCreated} (expected: ~${arrivalCount})`);
console.log(`  Entities departed: ${stats.simulation.entitiesDeparted}`);
console.log(`  Entities in system: ${stats.simulation.entitiesInSystem}`);
console.log(`  Event count: ${stats.simulation.eventCount}`);

// Performance metrics
const cycleTimeStats = stats.tally.entity_cycle_time;
const waitTimeStats = stats.tally.entity_wait_time;

console.log('\n[PERFORMANCE METRICS]');
if (cycleTimeStats && cycleTimeStats.count > 0) {
  console.log(`  Avg cycle time: ${cycleTimeStats.mean.toFixed(2)} min (n=${cycleTimeStats.count})`);
  console.log(`    Min: ${cycleTimeStats.min.toFixed(2)}, Max: ${cycleTimeStats.max.toFixed(2)}`);
}

if (waitTimeStats && waitTimeStats.count > 0) {
  console.log(`  Avg wait time: ${waitTimeStats.mean.toFixed(2)} min (n=${waitTimeStats.count})`);
  console.log(`    Min: ${waitTimeStats.min.toFixed(2)}, Max: ${waitTimeStats.max.toFixed(2)}`);
}

// Throughput
if (stats.simulation.currentTime > 0) {
  const throughputPerMinute = stats.simulation.entitiesDeparted / stats.simulation.currentTime;
  const throughputPerHour = throughputPerMinute * 60;
  console.log(`  Throughput: ${throughputPerHour.toFixed(2)} per hour`);

  const throughputDiff = Math.abs(throughputPerHour - arrivalRate) / arrivalRate * 100;
  if (throughputDiff < 10) {
    console.log(`    ✓ Matches arrival rate (${arrivalRate}/hr) within 10%`);
  } else {
    console.log(`    ! Differs from arrival rate by ${throughputDiff.toFixed(1)}%`);
  }
}

// Resource utilization
const resourceStats = stats.resources['server1'];
if (resourceStats) {
  console.log(`\n[RESOURCE UTILIZATION]`);
  console.log(`  Utilization: ${resourceStats.utilization}`);
  console.log(`  Total busy time: ${resourceStats.totalBusyTime} minutes`);
  console.log(`  Current load: ${resourceStats.currentLoad}`);
  console.log(`  Queue length: ${resourceStats.queueLength}`);

  // Theoretical utilization for M/M/1
  const rho = (arrivalRatePerMinute * serviceTime);
  console.log(`\n  Theoretical (M/M/1):`);
  console.log(`    ρ = λ×μ = ${arrivalRatePerMinute.toFixed(4)} × ${serviceTime.toFixed(2)} = ${rho.toFixed(4)}`);
  console.log(`    Expected utilization: ${(rho * 100).toFixed(2)}%`);
  console.log(`    Actual utilization: ${resourceStats.utilization}`);
}

// Validation
console.log('\n[VALIDATION]');
const conservationValid = kernel.validateConservation();
if (conservationValid) {
  console.log(`  ✓ Conservation law holds`);
} else {
  console.log(`  ✗ CONSERVATION LAW VIOLATED!`);
}

if (stats.simulation.currentTime >= endTime * 0.99) {
  console.log(`  ✓ Simulation ran to completion (≥99% of endTime)`);
} else {
  console.log(`  ✗ Simulation stopped early at ${stats.simulation.currentTime.toFixed(2)} min`);
}

if (stats.simulation.entitiesCreated === arrivalCount) {
  console.log(`  ✓ All scheduled arrivals occurred`);
} else {
  console.log(`  ✗ Arrival count mismatch: scheduled ${arrivalCount}, created ${stats.simulation.entitiesCreated}`);
}

// Summary
console.log('\n' + '='.repeat(80));
console.log('CONCLUSION');
console.log('='.repeat(80));

const issues: string[] = [];

if (stats.simulation.entitiesCreated === 0) {
  issues.push('NO ARRIVALS - Arrival generation broken');
}

if (stats.simulation.entitiesDeparted === 0 && stats.simulation.entitiesCreated > 0) {
  issues.push('NO DEPARTURES - Service logic broken');
}

if (stats.simulation.currentTime < endTime * 0.99) {
  issues.push(`Simulation stopped early (${stats.simulation.currentTime.toFixed(2)} / ${endTime})`);
}

if (!conservationValid) {
  issues.push('Conservation law violated');
}

if (issues.length === 0) {
  console.log('\n✓✓✓ ALL TESTS PASSED! ✓✓✓');
  console.log('\nThe DES kernel is working correctly with continuous Poisson arrivals.');
  console.log('The simulation runs to completion, processes all entities, and maintains conservation laws.');
} else {
  console.log('\n✗✗✗ ISSUES DETECTED ✗✗✗\n');
  issues.forEach((issue, idx) => {
    console.log(`${idx + 1}. ${issue}`);
  });
}

console.log('\n' + '='.repeat(80));
