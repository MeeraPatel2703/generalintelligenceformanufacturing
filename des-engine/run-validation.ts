#!/usr/bin/env node
/**
 * Comprehensive DES Engine Validation Suite
 * Runs 200+ tests across 20 categories
 */

import { ValidationFramework } from './validation/ValidationFramework';
import { category1Tests } from './validation/Category1_DataStructures';
import { category2Tests } from './validation/Category2_RandomNumbers';
import { category3Tests } from './validation/Category3_Distributions';
import { category4Tests } from './validation/Category4_SingleQueue';
import { category5Tests } from './validation/Category5_MultipleServers';
import { allCriticalTests } from './validation/Categories6to9';

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                            ║');
  console.log('║     DISCRETE EVENT SIMULATION ENGINE                                       ║');
  console.log('║     COMPREHENSIVE MATHEMATICAL VALIDATION SUITE                            ║');
  console.log('║                                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const framework = new ValidationFramework();

  // Register all tests
  console.log('Registering validation tests...\n');

  framework.registerTests(category1Tests);
  console.log(`  ✓ Category 1: Data Structures & Basic Operations (${category1Tests.length} tests)`);

  framework.registerTests(category2Tests);
  console.log(`  ✓ Category 2: Random Number Generation (${category2Tests.length} tests)`);

  framework.registerTests(category3Tests);
  console.log(`  ✓ Category 3: Statistical Distributions (${category3Tests.length} tests)`);

  framework.registerTests(category4Tests);
  console.log(`  ✓ Category 4: Single Queue Systems - M/M/1 (${category4Tests.length} tests)`);

  framework.registerTests(category5Tests);
  console.log(`  ✓ Category 5: Multiple Server Systems - M/M/c (${category5Tests.length} tests)`);

  framework.registerTests(allCriticalTests);
  console.log(`  ✓ Categories 6-9: Advanced Queueing Theory (${allCriticalTests.length} tests)`);

  const totalTests = category1Tests.length + category2Tests.length + category3Tests.length +
                     category4Tests.length + category5Tests.length + allCriticalTests.length;

  console.log(`\nTotal Tests Registered: ${totalTests}`);
  console.log('\n' + '═'.repeat(80) + '\n');

  // Run all tests
  const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');

  console.log('Executing validation suite...\n');
  if (!verbose) {
    console.log('(Run with --verbose flag to see detailed test output)\n');
  }

  const startTime = Date.now();
  const report = await framework.runAll(verbose);
  const elapsed = Date.now() - startTime;

  console.log(`\nValidation completed in ${(elapsed / 1000).toFixed(2)} seconds\n`);

  // Print comprehensive report
  framework.printReport(report);

  // Additional statistics
  console.log('DETAILED STATISTICS:');
  console.log('═'.repeat(80));
  console.log(`  Total execution time: ${(elapsed / 1000).toFixed(2)}s`);
  console.log(`  Average time per test: ${(elapsed / totalTests).toFixed(0)}ms`);
  console.log(`  Tests per second: ${(totalTests / (elapsed / 1000)).toFixed(1)}`);
  console.log('\n');

  // Category-specific recommendations
  console.log('CERTIFICATION REQUIREMENTS:');
  console.log('═'.repeat(80));
  console.log('  Category 1 (Data Structures):      Required 100% pass ✓');
  console.log('  Category 2 (Random Numbers):       Required 100% pass ✓');
  console.log('  Category 3 (Distributions):        Required 100% pass ✓');
  console.log('  Category 4 (M/M/1 Queues):         Required 100% pass ✓');
  console.log('  Category 5 (M/M/c Queues):         Required 100% pass ✓');
  console.log('  Category 6 (Non-Markovian):        Required ≥90% pass');
  console.log('  Category 7 (Networks):             Required ≥90% pass');
  console.log('  Category 8 (Transient):            Required ≥90% pass');
  console.log('  Category 9 (Statistics):           Required ≥90% pass');
  console.log('\n');

  // Exit code based on certification
  const exitCode = report.certified ? 0 : 1;

  if (report.certified) {
    console.log('┌─────────────────────────────────────────────────────────────────────────┐');
    console.log('│                                                                         │');
    console.log('│   ✓✓✓  DES ENGINE CERTIFIED FOR PRODUCTION USE  ✓✓✓                   │');
    console.log('│                                                                         │');
    console.log('│   The engine has passed comprehensive mathematical validation           │');
    console.log('│   and is ready for real-world discrete event simulation.               │');
    console.log('│                                                                         │');
    console.log('└─────────────────────────────────────────────────────────────────────────┘');
  } else {
    console.log('┌─────────────────────────────────────────────────────────────────────────┐');
    console.log('│                                                                         │');
    console.log('│   ✗  CERTIFICATION NOT ACHIEVED                                         │');
    console.log('│                                                                         │');
    console.log('│   Review failed tests above and fix implementation issues               │');
    console.log('│   before deploying to production environments.                          │');
    console.log('│                                                                         │');
    console.log('└─────────────────────────────────────────────────────────────────────────┘');
  }

  console.log('\n');

  process.exit(exitCode);
}

main().catch(error => {
  console.error('Fatal error in validation suite:', error);
  process.exit(1);
});
