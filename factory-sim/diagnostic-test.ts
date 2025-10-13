/**
 * DIAGNOSTIC TEST - PHASE 1: CURRENT STATE ANALYSIS
 *
 * This script runs the simulation and reports on what's working and what's broken.
 */

import { IndustrialDESKernel, DESEvent, Distribution } from './src/des-core/IndustrialDESKernel';

console.log('='.repeat(80));
console.log('PHASE 1: DIAGNOSE CURRENT STATE');
console.log('='.repeat(80));

// Create simple test simulation
const kernel = new IndustrialDESKernel(12345);

// Add a simple resource (single server)
kernel.addResource('server1', 'Server 1', 1);

// Schedule some arrivals manually
const numArrivals = 10;
const arrivalRate = 30; // per hour
const arrivalRatePerMinute = arrivalRate / 60; // 0.5 per minute
const meanInterarrival = 1 / arrivalRatePerMinute; // 2 minutes

console.log('\n[TEST SETUP]');
console.log(`  Arrival rate: ${arrivalRate} per hour (${arrivalRatePerMinute} per minute)`);
console.log(`  Mean inter-arrival: ${meanInterarrival.toFixed(2)} minutes`);
console.log(`  Scheduling ${numArrivals} arrivals...`);

// Schedule arrivals at fixed times for predictability
for (let i = 0; i < numArrivals; i++) {
  const arrivalTime = i * meanInterarrival;
  const entityId = `entity_${i}`;

  kernel.scheduleEvent(new DESEvent(
    arrivalTime,
    'arrival',
    0,
    entityId,
    undefined,
    {
      entityType: 'Customer',
      firstResource: 'server1',
      serviceTimeDistribution: { type: 'constant', value: 1.5 } as Distribution
    }
  ));

  if (i < 3) {
    console.log(`  Scheduled: Entity ${entityId} at time ${arrivalTime.toFixed(2)}`);
  }
}

console.log(`  ... (${numArrivals} total arrivals scheduled)`);

// Run simulation
const endTime = 60; // 60 minutes
console.log(`\n[RUNNING SIMULATION]`);
console.log(`  End time: ${endTime} minutes`);

const startTime = Date.now();
kernel.run(endTime, 0);
const runTime = Date.now() - startTime;

console.log(`  Simulation completed in ${runTime}ms`);

// Get statistics
const stats = kernel.getStatistics();

console.log('\n' + '='.repeat(80));
console.log('DIAGNOSTIC REPORT');
console.log('='.repeat(80));

// Check simulation state
console.log('\n[SIMULATION STATE]');
console.log(`  ✓ Does simulation start? YES`);
console.log(`  ✓ Do entities get created? ${stats.simulation.entitiesCreated > 0 ? 'YES' : 'NO'}`);
console.log(`  ✓ Does simulation clock advance? ${stats.simulation.currentTime > 0 ? 'YES' : 'NO'}`);
console.log(`  ✓ Do entities depart? ${stats.simulation.entitiesDeparted > 0 ? 'YES' : 'NO'}`);
console.log(`  ✓ Does simulation reach endTime? ${stats.simulation.currentTime >= endTime ? 'YES' : 'NO'}`);

console.log('\n[CURRENT STATE METRICS]');
console.log(`  Simulation time: ${stats.simulation.currentTime.toFixed(2)} minutes (expected: ${endTime.toFixed(2)} minutes)`);
console.log(`  Progress: ${((stats.simulation.currentTime / endTime) * 100).toFixed(1)}% (expected: 100%)`);
console.log(`  Entities created: ${stats.simulation.entitiesCreated} (expected: ${numArrivals})`);
console.log(`  Entities departed: ${stats.simulation.entitiesDeparted} (should equal created)`);
console.log(`  Entities in system: ${stats.simulation.entitiesInSystem}`);
console.log(`  Event count: ${stats.simulation.eventCount}`);

// Calculate expected vs actual
const expectedArrivals = numArrivals;
const actualArrivals = stats.simulation.entitiesCreated;
const expectedDepartures = Math.min(expectedArrivals, Math.floor(endTime / 1.5)); // rough estimate

console.log('\n[ANALYSIS]');
if (actualArrivals === expectedArrivals) {
  console.log(`  ✓ Arrival count matches expected (${expectedArrivals})`);
} else {
  console.log(`  ✗ Arrival count MISMATCH: expected ${expectedArrivals}, got ${actualArrivals}`);
}

if (stats.simulation.entitiesDeparted > 0) {
  console.log(`  ✓ Entities are departing (${stats.simulation.entitiesDeparted} departed)`);
} else {
  console.log(`  ✗ NO ENTITIES DEPARTED - Processing/service bug likely`);
}

if (stats.simulation.currentTime >= endTime) {
  console.log(`  ✓ Simulation ran to completion`);
} else {
  console.log(`  ✗ Simulation STOPPED EARLY at ${stats.simulation.currentTime.toFixed(2)} minutes`);
  console.log(`     (Should have run to ${endTime} minutes)`);
}

// Check for impossible values
console.log('\n[SANITY CHECKS]');
const cycleTimeStats = stats.tally.entity_cycle_time;
const waitTimeStats = stats.tally.entity_wait_time;
const serviceTimeStats = stats.tally.entity_service_time;

if (cycleTimeStats && cycleTimeStats.count > 0) {
  console.log(`  ✓ Cycle time recorded: mean=${cycleTimeStats.mean.toFixed(2)} min (n=${cycleTimeStats.count})`);
  if (cycleTimeStats.mean < 0) {
    console.log(`    ✗ IMPOSSIBLE: Negative cycle time!`);
  }
} else {
  console.log(`  ✗ No cycle time statistics recorded`);
}

if (waitTimeStats && waitTimeStats.count > 0) {
  console.log(`  ✓ Wait time recorded: mean=${waitTimeStats.mean.toFixed(2)} min (n=${waitTimeStats.count})`);
  if (waitTimeStats.mean < 0) {
    console.log(`    ✗ IMPOSSIBLE: Negative wait time!`);
  }
} else {
  console.log(`  ! No wait time statistics recorded`);
}

if (serviceTimeStats && serviceTimeStats.count > 0) {
  console.log(`  ✓ Service time recorded: mean=${serviceTimeStats.mean.toFixed(2)} min (n=${serviceTimeStats.count})`);
  if (serviceTimeStats.mean < 0) {
    console.log(`    ✗ IMPOSSIBLE: Negative service time!`);
  }
} else {
  console.log(`  ! No service time statistics recorded`);
}

// Check resource utilization
console.log('\n[RESOURCE STATISTICS]');
const resourceStats = stats.resources['server1'];
if (resourceStats) {
  console.log(`  Resource: ${resourceStats.name}`);
  console.log(`  Capacity: ${resourceStats.capacity}`);
  console.log(`  Current load: ${resourceStats.currentLoad}`);
  console.log(`  Queue length: ${resourceStats.queueLength}`);
  console.log(`  Utilization: ${resourceStats.utilization}`);
  console.log(`  Total busy time: ${resourceStats.totalBusyTime} minutes`);

  const utilValue = parseFloat(resourceStats.utilization);
  if (utilValue > 100) {
    console.log(`  ✗ IMPOSSIBLE: Utilization > 100%!`);
  }
} else {
  console.log(`  ✗ No resource statistics found`);
}

// Throughput check
if (stats.simulation.currentTime > 0 && stats.simulation.entitiesDeparted > 0) {
  const throughputPerMinute = stats.simulation.entitiesDeparted / stats.simulation.currentTime;
  const throughputPerHour = throughputPerMinute * 60;

  console.log('\n[THROUGHPUT CHECK]');
  console.log(`  Throughput: ${throughputPerHour.toFixed(2)} per hour`);
  console.log(`  Arrival rate: ${arrivalRate} per hour`);

  if (throughputPerHour > arrivalRate * 1.5) {
    console.log(`  ✗ IMPOSSIBLE: Throughput exceeds arrival rate by >50%!`);
  } else {
    console.log(`  ✓ Throughput is reasonable`);
  }
}

// Conservation law check
console.log('\n[CONSERVATION LAW CHECK]');
const conservationValid = kernel.validateConservation();
if (conservationValid) {
  console.log(`  ✓ Conservation law holds: Created = In System + Departed`);
  console.log(`    ${stats.simulation.entitiesCreated} = ${stats.simulation.entitiesInSystem} + ${stats.simulation.entitiesDeparted}`);
} else {
  console.log(`  ✗ CONSERVATION LAW VIOLATED!`);
  console.log(`    Created: ${stats.simulation.entitiesCreated}`);
  console.log(`    In System: ${stats.simulation.entitiesInSystem}`);
  console.log(`    Departed: ${stats.simulation.entitiesDeparted}`);
  console.log(`    Expected: ${stats.simulation.entitiesCreated} = ${stats.simulation.entitiesInSystem + stats.simulation.entitiesDeparted}`);
}

// Summary
console.log('\n' + '='.repeat(80));
console.log('SUSPECTED ISSUES');
console.log('='.repeat(80));

const issues: string[] = [];

if (stats.simulation.entitiesCreated === 0) {
  issues.push('NO ARRIVALS - Arrival generation completely broken');
}

if (stats.simulation.entitiesCreated < expectedArrivals) {
  issues.push(`INSUFFICIENT ARRIVALS - Only ${stats.simulation.entitiesCreated} of ${expectedArrivals} arrived`);
}

if (stats.simulation.entitiesDeparted === 0 && stats.simulation.entitiesCreated > 0) {
  issues.push('NO DEPARTURES - Service/processing logic broken');
}

if (stats.simulation.currentTime < endTime && stats.simulation.currentTime > 0) {
  issues.push(`SIMULATION STOPPED EARLY at ${stats.simulation.currentTime.toFixed(2)} min (expected ${endTime} min)`);
}

if (!conservationValid) {
  issues.push('CONSERVATION LAW VIOLATED - Entities being lost or created incorrectly');
}

if (issues.length === 0) {
  console.log('\n✓ No obvious issues detected - simulation appears to be working correctly!');
} else {
  console.log('');
  issues.forEach((issue, idx) => {
    console.log(`${idx + 1}. ${issue}`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('END OF PHASE 1 DIAGNOSTICS');
console.log('='.repeat(80));
