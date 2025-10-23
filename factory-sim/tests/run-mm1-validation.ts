/**
 * TEST RUNNER FOR M/M/1 VALIDATION
 *
 * Executes the MM1 validation test suite and displays results
 *
 * Usage:
 *   npx tsx tests/run-mm1-validation.ts
 */

import { runMM1TestSuite } from './theoretical/MM1Validator';

async function main() {
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                          DES ENGINE VALIDATION TEST SUITE                                     ║');
  console.log('║                          M/M/1 Queue Theoretical Validation                                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const startTime = Date.now();

  try {
    const results = await runMM1TestSuite();

    console.log('\n\n');
    console.log('╔═══════════════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                                    FINAL SUMMARY                                              ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════════════════════╝');
    console.log('\n');

    const passedTests = results.filter(r => r.overallPassed).length;
    const totalTests = results.length;
    const passRate = (passedTests / totalTests) * 100;

    console.log(`Total Runtime: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Pass Rate: ${passRate.toFixed(1)}%`);
    console.log('\n');

    if (passRate === 100) {
      console.log('✅ ✅ ✅  ALL TESTS PASSED  ✅ ✅ ✅');
      console.log('\n');
      console.log('🎉 DES ENGINE VALIDATED AGAINST QUEUEING THEORY!');
      console.log('The simulation results match theoretical predictions within 5% tolerance.');
      console.log('\n');
    } else {
      console.log('⚠️  SOME TESTS FAILED');
      console.log('\n');
      console.log('The DES engine produced results that differ from queueing theory.');
      console.log('Review the detailed output above to identify discrepancies.');
      console.log('\n');
      console.log('Next steps:');
      console.log('1. Check event queue implementation');
      console.log('2. Verify statistical collection methods');
      console.log('3. Review random number generation');
      console.log('4. Increase replications to reduce variance');
      console.log('\n');
    }

    // Detailed breakdown
    console.log('Test Breakdown:');
    console.log('─'.repeat(95));
    results.forEach((r, i) => {
      const status = r.overallPassed ? '✓ PASS' : '✗ FAIL';
      const statusColor = r.overallPassed ? status : `\x1b[31m${status}\x1b[0m`;
      const rho = (r.lambda / r.mu).toFixed(2);
      console.log(`${statusColor.padEnd(15)} | ${r.testName.padEnd(50)} | ρ=${rho} | ${r.executionTime}ms`);
    });
    console.log('─'.repeat(95));
    console.log('\n');

    // Export results to JSON
    const jsonResults = {
      testSuite: 'M/M/1 Queue Validation',
      timestamp: new Date().toISOString(),
      totalRuntime: Date.now() - startTime,
      totalTests,
      passedTests,
      passRate,
      allTestsPassed: passRate === 100,
      results: results.map(r => ({
        testName: r.testName,
        lambda: r.lambda,
        mu: r.mu,
        rho: r.lambda / r.mu,
        replications: r.replications,
        passed: r.overallPassed,
        executionTime: r.executionTime,
        metrics: r.metrics
      }))
    };

    console.log('📄 Test results exported to: test-results-mm1.json\n');

    // Write to file if running in Node environment
    if (typeof require !== 'undefined') {
      try {
        const fs = require('fs');
        fs.writeFileSync(
          'test-results-mm1.json',
          JSON.stringify(jsonResults, null, 2),
          'utf-8'
        );
        console.log('✅ Results file written successfully\n');
      } catch (err) {
        console.log('⚠️  Could not write results file (this is normal in some environments)\n');
      }
    }

    process.exit(passRate === 100 ? 0 : 1);
  } catch (error) {
    console.error('\n\n');
    console.error('╔═══════════════════════════════════════════════════════════════════════════════════════════════╗');
    console.error('║                                    TEST SUITE FAILED                                          ║');
    console.error('╚═══════════════════════════════════════════════════════════════════════════════════════════════╝');
    console.error('\n');
    console.error('Error:', error);
    console.error('\n');
    process.exit(1);
  }
}

main();
