/**
 * COMPREHENSIVE VALIDATION TEST RUNNER
 *
 * Executes all 34+ validation metrics across 5 categories
 */

import { runComprehensiveTests } from './comprehensive/ComprehensiveValidator';

function printSectionHeader(title: string) {
  console.log('\n' + '='.repeat(80));
  console.log(title);
  console.log('='.repeat(80) + '\n');
}

function printMetric(name: string, value: any, target: any, passed: boolean, unit: string = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const statusColored = passed ? status : `\x1b[31m${status}\x1b[0m`;
  console.log(`  ${name.padEnd(35)} ${String(value).padStart(12)}${unit.padStart(8)} (target: ${target}${unit})  ${statusColored}`);
}

async function main() {
  const startTime = Date.now();

  try {
    // Run comprehensive tests
    const results = await runComprehensiveTests(45, 60, 100, 10000);

    // ========================================================================
    // CATEGORY 1: THEORETICAL ACCURACY
    // ========================================================================
    printSectionHeader('CATEGORY 1: THEORETICAL ACCURACY METRICS (9 tests)');

    printMetric(
      'Utilization (ρ)',
      results.theoreticalAccuracy.utilization.simulated.toFixed(4),
      `±3% of ${results.theoreticalAccuracy.utilization.theoretical.toFixed(2)}`,
      results.theoreticalAccuracy.utilization.passed,
      ` (${results.theoreticalAccuracy.utilization.error.toFixed(2)}% err)`
    );

    printMetric(
      'Avg in System (L)',
      results.theoreticalAccuracy.avgInSystem.simulated.toFixed(4),
      `±5% of ${results.theoreticalAccuracy.avgInSystem.theoretical.toFixed(2)}`,
      results.theoreticalAccuracy.avgInSystem.passed,
      ` (${results.theoreticalAccuracy.avgInSystem.error.toFixed(2)}% err)`
    );

    printMetric(
      'Avg in Queue (Lq)',
      results.theoreticalAccuracy.avgInQueue.simulated.toFixed(4),
      `±5% of ${results.theoreticalAccuracy.avgInQueue.theoretical.toFixed(2)}`,
      results.theoreticalAccuracy.avgInQueue.passed,
      ` (${results.theoreticalAccuracy.avgInQueue.error.toFixed(2)}% err)`
    );

    printMetric(
      'Time in System (W)',
      results.theoreticalAccuracy.avgTimeInSystem.simulated.toFixed(4),
      `±5% of ${results.theoreticalAccuracy.avgTimeInSystem.theoretical.toFixed(4)}`,
      results.theoreticalAccuracy.avgTimeInSystem.passed,
      ` hrs (${results.theoreticalAccuracy.avgTimeInSystem.error.toFixed(2)}% err)`
    );

    printMetric(
      'Time in Queue (Wq)',
      results.theoreticalAccuracy.avgTimeInQueue.simulated.toFixed(4),
      `±5% of ${results.theoreticalAccuracy.avgTimeInQueue.theoretical.toFixed(4)}`,
      results.theoreticalAccuracy.avgTimeInQueue.passed,
      ` hrs (${results.theoreticalAccuracy.avgTimeInQueue.error.toFixed(2)}% err)`
    );

    printMetric(
      'Idle Probability (P₀)',
      results.theoreticalAccuracy.idleProbability.simulated.toFixed(4),
      `±5% of ${results.theoreticalAccuracy.idleProbability.theoretical.toFixed(4)}`,
      results.theoreticalAccuracy.idleProbability.passed,
      ` (${results.theoreticalAccuracy.idleProbability.error.toFixed(2)}% err)`
    );

    printMetric(
      'Throughput',
      results.theoreticalAccuracy.throughput.simulated.toFixed(2),
      `±3% of ${results.theoreticalAccuracy.throughput.theoretical.toFixed(2)}`,
      results.theoreticalAccuracy.throughput.passed,
      ` /hr (${results.theoreticalAccuracy.throughput.error.toFixed(2)}% err)`
    );

    printMetric(
      'Stability Check',
      `ρ=${results.theoreticalAccuracy.stabilityCheck.rho.toFixed(2)} < 1`,
      'ρ < 1',
      results.theoreticalAccuracy.stabilityCheck.passed,
      ''
    );

    printMetric(
      "Little's Law (L = λW)",
      `L=${results.theoreticalAccuracy.littlesLaw.L.toFixed(4)}`,
      `λW=${results.theoreticalAccuracy.littlesLaw.lambdaW.toFixed(4)}`,
      results.theoreticalAccuracy.littlesLaw.passed,
      ` (${results.theoreticalAccuracy.littlesLaw.error.toFixed(2)}% err)`
    );

    const cat1Pass = Object.values(results.theoreticalAccuracy).filter(t => t.passed).length;
    const cat1Total = Object.values(results.theoreticalAccuracy).length;
    console.log(`\n  Category 1 Score: ${cat1Pass}/${cat1Total} passed (${(cat1Pass/cat1Total*100).toFixed(0)}%)`);

    // ========================================================================
    // CATEGORY 2: STATISTICAL VALIDITY
    // ========================================================================
    printSectionHeader('CATEGORY 2: STATISTICAL VALIDITY METRICS (5 tests)');

    printMetric(
      'Warmup Period',
      `${results.statisticalValidity.warmupLength.percentage}% implemented`,
      'Auto-detected',
      results.statisticalValidity.warmupLength.passed,
      ''
    );

    printMetric(
      'CI Half-Width',
      results.statisticalValidity.ciHalfWidth.avgHalfWidth.toFixed(6),
      `≤${results.statisticalValidity.ciHalfWidth.targetPercent}% of mean`,
      results.statisticalValidity.ciHalfWidth.passed,
      ' hrs'
    );

    printMetric(
      'CI Coverage',
      `${results.statisticalValidity.ciCoverage.coverage}%`,
      '93-97%',
      results.statisticalValidity.ciCoverage.passed,
      ''
    );

    printMetric(
      'Replication Adequacy',
      `${results.statisticalValidity.replicationAdequacy.replications} reps`,
      'Adequate for ≤3% CI',
      results.statisticalValidity.replicationAdequacy.passed,
      ''
    );

    printMetric(
      'Batch Independence (Lag-1)',
      results.statisticalValidity.batchIndependence.autocorrelation.toFixed(4),
      '< 0.1',
      results.statisticalValidity.batchIndependence.passed,
      ''
    );

    const cat2Pass = Object.values(results.statisticalValidity).filter(t => t.passed).length;
    const cat2Total = Object.values(results.statisticalValidity).length;
    console.log(`\n  Category 2 Score: ${cat2Pass}/${cat2Total} passed (${(cat2Pass/cat2Total*100).toFixed(0)}%)`);

    // ========================================================================
    // CATEGORY 3: DETERMINISM & RNG
    // ========================================================================
    printSectionHeader('CATEGORY 3: DETERMINISM & RNG METRICS (3 tests)');

    printMetric(
      'Determinism Check',
      'Identical runs',
      'Same seed → same output',
      results.determinismRNG.determinismCheck.passed,
      ''
    );

    printMetric(
      'Stream Independence',
      `ρ=${results.determinismRNG.streamIndependence.correlation.toFixed(4)}`,
      '< 0.20',
      results.determinismRNG.streamIndependence.passed,
      ''
    );

    printMetric(
      'RNG Quality (KS Test)',
      `p=${results.determinismRNG.rngQuality.pValue.toFixed(3)}`,
      '> 0.05',
      results.determinismRNG.rngQuality.passed,
      ''
    );

    const cat3Pass = Object.values(results.determinismRNG).filter(t => t.passed).length;
    const cat3Total = Object.values(results.determinismRNG).length;
    console.log(`\n  Category 3 Score: ${cat3Pass}/${cat3Total} passed (${(cat3Pass/cat3Total*100).toFixed(0)}%)`);

    // ========================================================================
    // CATEGORY 4: PERFORMANCE & SCALABILITY
    // ========================================================================
    printSectionHeader('CATEGORY 4: PERFORMANCE & SCALABILITY METRICS (4 tests)');

    printMetric(
      'Event Throughput',
      `${(results.performance.eventThroughput.eventsPerSec / 1000000).toFixed(2)}M`,
      '≥1M events/s (good)',
      results.performance.eventThroughput.passed,
      ' events/s'
    );

    printMetric(
      'Wall-Clock (per rep)',
      results.performance.wallClockTime.timeSeconds.toFixed(3),
      '≤1s for 8h model',
      results.performance.wallClockTime.passed,
      ' seconds'
    );

    printMetric(
      'Batch Time (1k reps)',
      results.performance.batchTime.timeSeconds.toFixed(1),
      '≤60s',
      results.performance.batchTime.passed,
      ' seconds'
    );

    printMetric(
      'Memory Footprint',
      results.performance.memoryFootprint.estimatedMB.toFixed(1),
      '≤1500 MB',
      results.performance.memoryFootprint.passed,
      ' MB (est.)'
    );

    const cat4Pass = Object.values(results.performance).filter(t => t.passed).length;
    const cat4Total = Object.values(results.performance).length;
    console.log(`\n  Category 4 Score: ${cat4Pass}/${cat4Total} passed (${(cat4Pass/cat4Total*100).toFixed(0)}%)`);

    // ========================================================================
    // CATEGORY 5: FUNCTIONAL CORRECTNESS
    // ========================================================================
    printSectionHeader('CATEGORY 5: FUNCTIONAL CORRECTNESS METRICS (5 tests)');

    printMetric(
      'Queue Ordering',
      results.functionalCorrectness.queueOrdering.discipline,
      'FIFO verified',
      results.functionalCorrectness.queueOrdering.passed,
      ''
    );

    printMetric(
      'Entity Conservation',
      `${results.functionalCorrectness.entityConservation.arrivals} in, ${results.functionalCorrectness.entityConservation.departures} out`,
      'Balance = 0',
      results.functionalCorrectness.entityConservation.passed,
      ` (bal=${results.functionalCorrectness.entityConservation.balance})`
    );

    printMetric(
      'Time Accounting',
      'W = Wq + (1/μ)',
      'Verified',
      results.functionalCorrectness.timeAccounting.passed,
      ''
    );

    printMetric(
      'Resource Utilization',
      results.functionalCorrectness.resourceUtilization.calculated.toFixed(4),
      `${results.functionalCorrectness.resourceUtilization.expected.toFixed(4)}`,
      results.functionalCorrectness.resourceUtilization.passed,
      ''
    );

    printMetric(
      'Event Ordering',
      'Monotonic clock',
      'Non-decreasing',
      results.functionalCorrectness.eventOrdering.passed,
      ''
    );

    const cat5Pass = Object.values(results.functionalCorrectness).filter(t => t.passed).length;
    const cat5Total = Object.values(results.functionalCorrectness).length;
    console.log(`\n  Category 5 Score: ${cat5Pass}/${cat5Total} passed (${(cat5Pass/cat5Total*100).toFixed(0)}%)`);

    // ========================================================================
    // FINAL SUMMARY
    // ========================================================================
    printSectionHeader('FINAL VALIDATION SUMMARY');

    console.log(`  Total Tests:       ${results.summary.totalTests}`);
    console.log(`  Passed:            ${results.summary.passed}`);
    console.log(`  Failed:            ${results.summary.failed}`);
    console.log(`  Pass Rate:         ${results.summary.passRate.toFixed(1)}%`);
    console.log();

    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`  Total Runtime:     ${totalTime.toFixed(2)}s`);
    console.log();

    if (results.summary.passRate === 100) {
      console.log('  ✅✅✅  ALL VALIDATION METRICS PASSED  ✅✅✅');
      console.log();
      console.log('  🎉 DES ENGINE IS FULLY VALIDATED!');
      console.log('  The engine meets all theoretical, statistical, deterministic,');
      console.log('  performance, and functional correctness requirements.');
    } else {
      console.log('  ⚠️  SOME VALIDATION METRICS FAILED');
      console.log();
      console.log(`  ${results.summary.failed} test(s) did not meet target criteria.`);
      console.log('  Review the detailed output above to identify issues.');
    }

    console.log();
    console.log('='.repeat(80));
    console.log();

    // Category breakdown
    console.log('Category Breakdown:');
    console.log(`  1. Theoretical Accuracy:      ${cat1Pass}/${cat1Total} (${(cat1Pass/cat1Total*100).toFixed(0)}%)`);
    console.log(`  2. Statistical Validity:      ${cat2Pass}/${cat2Total} (${(cat2Pass/cat2Total*100).toFixed(0)}%)`);
    console.log(`  3. Determinism & RNG:         ${cat3Pass}/${cat3Total} (${(cat3Pass/cat3Total*100).toFixed(0)}%)`);
    console.log(`  4. Performance & Scalability: ${cat4Pass}/${cat4Total} (${(cat4Pass/cat4Total*100).toFixed(0)}%)`);
    console.log(`  5. Functional Correctness:    ${cat5Pass}/${cat5Total} (${(cat5Pass/cat5Total*100).toFixed(0)}%)`);
    console.log();

    process.exit(results.summary.passRate === 100 ? 0 : 1);

  } catch (error) {
    console.error('\n❌ VALIDATION SUITE FAILED WITH ERROR:\n');
    console.error(error);
    console.error();
    process.exit(1);
  }
}

main();
