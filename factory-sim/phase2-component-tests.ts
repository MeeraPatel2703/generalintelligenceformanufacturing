/**
 * PHASE 2: FUNDAMENTAL COMPONENT TESTING
 *
 * Test Event Queue, RNG, and Clock advancement in isolation
 */

import { IndustrialDESKernel, DESEvent } from './src/des-core/IndustrialDESKernel';
import { BinaryHeap } from './src/des-core/BinaryHeap';

console.log('='.repeat(80));
console.log('PHASE 2: FUNDAMENTAL COMPONENT TESTING');
console.log('='.repeat(80));

// ============================================================================
// TEST 2.1: Event Queue Ordering
// ============================================================================
console.log('\n[TEST 2.1] Event Queue Ordering');

function testEventQueue(): boolean {
  const queue = new BinaryHeap<DESEvent>();

  // Add events out of order
  queue.insert(new DESEvent(10, 'C', 0));
  queue.insert(new DESEvent(5, 'A', 0));
  queue.insert(new DESEvent(8, 'B', 0));
  queue.insert(new DESEvent(5, 'A2', 1)); // Same time, higher priority (later in FIFO)

  // Extract and verify order
  const events: DESEvent[] = [];
  while (!queue.isEmpty()) {
    const event = queue.extractMin();
    if (event) events.push(event);
  }

  // Verify time ordering
  console.assert(events[0].time === 5, "First event should be time 5");
  console.assert(events[1].time === 5, "Second event should be time 5");
  console.assert(events[2].time === 8, "Third event should be time 8");
  console.assert(events[3].time === 10, "Fourth event should be time 10");

  // Verify FIFO within same time (lower priority number = earlier)
  console.assert(events[0].priority < events[1].priority, "FIFO: First event at time 5 should have lower priority");

  console.log('  Events extracted in order:');
  events.forEach((e, i) => {
    console.log(`    ${i + 1}. time=${e.time.toFixed(1)}, type=${e.type}, priority=${e.priority}`);
  });

  if (events[0].time === 5 && events[2].time === 8 && events[3].time === 10) {
    console.log('  ✓ Event queue ordering: PASS');
    return true;
  } else {
    console.log('  ✗ Event queue ordering: FAIL');
    return false;
  }
}

const queueTestPass = testEventQueue();

// ============================================================================
// TEST 2.2: Random Number Generation
// ============================================================================
console.log('\n[TEST 2.2] Random Number Generation');

function testDistributions(): boolean {
  const kernel = new IndustrialDESKernel(12345); // Fixed seed
  const samples = 10000;
  let allPass = true;

  // Test exponential
  console.log('\n  Testing Exponential Distribution:');
  const expSamples: number[] = [];
  for (let i = 0; i < samples; i++) {
    kernel.scheduleEvent(new DESEvent(0, 'test', 0, `entity_${i}`, undefined, {
      serviceTimeDistribution: { type: 'exponential', mean: 10.0 }
    }));
  }

  // Run mini simulation to sample
  let expMean = 0;
  let expCount = 0;

  // Directly sample using a test kernel
  const testKernel = new IndustrialDESKernel(12345);
  testKernel.addResource('test_resource', 'Test', 1);

  for (let i = 0; i < samples; i++) {
    testKernel.scheduleEvent(new DESEvent(
      i * 0.1,
      'arrival',
      0,
      `entity_${i}`,
      undefined,
      {
        entityType: 'test',
        firstResource: 'test_resource',
        serviceTimeDistribution: { type: 'exponential', mean: 10.0 }
      }
    ));
  }

  testKernel.run(samples * 0.1, 0);
  const stats = testKernel.getStatistics();
  const serviceTimeStat = stats.tally.entity_service_time;

  if (serviceTimeStat && serviceTimeStat.count > 0) {
    expMean = serviceTimeStat.mean;
    expCount = serviceTimeStat.count;

    console.log(`    Samples: ${expCount}`);
    console.log(`    Mean: ${expMean.toFixed(2)} (expected: 10.00)`);
    console.log(`    Std Dev: ${serviceTimeStat.stdDev.toFixed(2)}`);

    const error = Math.abs(expMean - 10.0) / 10.0;
    if (error < 0.05) {
      console.log(`    ✓ Exponential: PASS (error: ${(error * 100).toFixed(1)}%)`);
    } else {
      console.log(`    ✗ Exponential: FAIL (error: ${(error * 100).toFixed(1)}% > 5%)`);
      allPass = false;
    }
  } else {
    console.log(`    ✗ Exponential: NO DATA`);
    allPass = false;
  }

  // Test uniform
  console.log('\n  Testing Uniform Distribution:');
  const uniformKernel = new IndustrialDESKernel(12345);
  uniformKernel.addResource('test_resource', 'Test', 1);

  for (let i = 0; i < samples; i++) {
    uniformKernel.scheduleEvent(new DESEvent(
      i * 0.1,
      'arrival',
      0,
      `entity_${i}`,
      undefined,
      {
        entityType: 'test',
        firstResource: 'test_resource',
        serviceTimeDistribution: { type: 'uniform', min: 5.0, max: 15.0 }
      }
    ));
  }

  uniformKernel.run(samples * 0.1, 0);
  const uniformStats = uniformKernel.getStatistics();
  const uniformTimeStat = uniformStats.tally.entity_service_time;

  if (uniformTimeStat && uniformTimeStat.count > 0) {
    const uniformMean = uniformTimeStat.mean;
    console.log(`    Samples: ${uniformTimeStat.count}`);
    console.log(`    Mean: ${uniformMean.toFixed(2)} (expected: 10.00)`);
    console.log(`    Std Dev: ${uniformTimeStat.stdDev.toFixed(2)}`);

    const error = Math.abs(uniformMean - 10.0) / 10.0;
    if (error < 0.05) {
      console.log(`    ✓ Uniform: PASS (error: ${(error * 100).toFixed(1)}%)`);
    } else {
      console.log(`    ✗ Uniform: FAIL (error: ${(error * 100).toFixed(1)}% > 5%)`);
      allPass = false;
    }
  } else {
    console.log(`    ✗ Uniform: NO DATA`);
    allPass = false;
  }

  return allPass;
}

const distTestPass = testDistributions();

// ============================================================================
// TEST 2.3: Clock Advancement
// ============================================================================
console.log('\n[TEST 2.3] Clock Advancement');

function testClockAdvancement(): boolean {
  const kernel = new IndustrialDESKernel(12345);
  kernel.addResource('test_server', 'Test Server', 1);

  // Schedule 3 arrivals at specific times
  const times = [5, 10, 15];
  times.forEach((t, i) => {
    kernel.scheduleEvent(new DESEvent(
      t,
      'arrival',
      0,
      `entity_${i}`,
      undefined,
      {
        entityType: 'test',
        firstResource: 'test_server',
        serviceTimeDistribution: { type: 'constant', value: 1 }
      }
    ));
  });

  console.log('  Scheduled arrivals at: 5, 10, 15 minutes');

  // Run simulation
  kernel.run(20, 0);

  const stats = kernel.getStatistics();
  const finalTime = stats.simulation.currentTime;

  console.log(`  Final simulation time: ${finalTime.toFixed(2)} minutes`);
  console.log(`  Entities created: ${stats.simulation.entitiesCreated}`);
  console.log(`  Entities departed: ${stats.simulation.entitiesDeparted}`);

  // Clock should advance to at least 16 (last arrival at 15 + service time 1)
  if (finalTime >= 16.0 && stats.simulation.entitiesCreated === 3) {
    console.log('  ✓ Clock advancement: PASS');
    return true;
  } else {
    console.log('  ✗ Clock advancement: FAIL');
    return false;
  }
}

const clockTestPass = testClockAdvancement();

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('PHASE 2 TEST RESULTS');
console.log('='.repeat(80));

const allPassed = queueTestPass && distTestPass && clockTestPass;

console.log(`\n  Event Queue:    ${queueTestPass ? '✓ PASS' : '✗ FAIL'}`);
console.log(`  Distributions:  ${distTestPass ? '✓ PASS' : '✗ FAIL'}`);
console.log(`  Clock:          ${clockTestPass ? '✓ PASS' : '✗ FAIL'}`);

if (allPassed) {
  console.log('\n✓ All fundamental components working correctly');
  console.log('  → Kernel is sound, proceed to arrival generation testing');
} else {
  console.log('\n✗ Some fundamental components have issues');
  console.log('  → Fix these before proceeding to higher-level tests');
}

console.log('\n' + '='.repeat(80));
