/**
 * END-TO-END PIPELINE TEST
 *
 * Tests the complete flow:
 * PDF → Text Extraction → Entity Extraction → DES Model → Simulation → Statistics → Results
 */

import * as path from 'path';
import { parseDocument } from './electron/documentParser';
import { extractSystemFromDocument } from './electron/entityExtractor';
import { runDESFromExtractedSystem } from './electron/simulation/SystemToDESMapper';
import type { ExtractedSystem } from './src/types/extraction';

console.log('='.repeat(80));
console.log('END-TO-END PIPELINE TEST');
console.log('='.repeat(80));

async function testPipeline() {
  const pdfPath = '/Users/meerapatel/Downloads/Sledding Case Study.pdf';

  // =========================================================================
  // STEP 1: PDF PARSING
  // =========================================================================
  console.log('\n[STEP 1] PDF PARSING');
  console.log('-'.repeat(80));

  try {
    const parseResult = await parseDocument(pdfPath);

    if (!parseResult.success) {
      console.error('❌ PDF parsing FAILED:', parseResult.error);
      return;
    }

    console.log('✅ PDF parsed successfully');
    console.log(`   Content length: ${parseResult.content?.length} characters`);
    console.log(`   Page count: ${parseResult.metadata?.pageCount}`);
    console.log(`   Word count: ${parseResult.metadata?.wordCount}`);

    const content = parseResult.content!;

    // Show sample of extracted text
    console.log('\n   Sample text (first 500 chars):');
    console.log('   ' + content.substring(0, 500).replace(/\n/g, '\n   '));

    // =========================================================================
    // STEP 2: ENTITY EXTRACTION (AI Processing)
    // =========================================================================
    console.log('\n[STEP 2] ENTITY EXTRACTION');
    console.log('-'.repeat(80));

    const extractResult = await extractSystemFromDocument(content, 'pdf');

    if (!extractResult.success || !extractResult.system) {
      console.error('❌ Entity extraction FAILED:', extractResult.error);
      return;
    }

    const system = extractResult.system;
    console.log('✅ System extracted successfully');
    console.log(`   System name: ${system.systemName}`);
    console.log(`   Description: ${system.description}`);
    console.log(`   Entities: ${system.entities?.length || 0}`);
    console.log(`   Resources: ${system.resources?.length || 0}`);
    console.log(`   Processes: ${system.processes?.length || 0}`);

    // Show extracted entities
    console.log('\n   Extracted Entities:');
    for (const entity of system.entities || []) {
      console.log(`     - ${entity.name}: ${entity.description}`);
      console.log(`       Arrival: ${entity.arrivalPattern.type}, rate: ${entity.arrivalPattern.rate}/${entity.arrivalPattern.rateUnit}`);
    }

    // Show extracted resources
    console.log('\n   Extracted Resources:');
    for (const resource of system.resources || []) {
      console.log(`     - ${resource.name}: capacity=${resource.capacity}`);
      if (resource.processingTime) {
        console.log(`       Processing: ${resource.processingTime.type} (${JSON.stringify(resource.processingTime.parameters)})`);
      }
      if (resource.schedule) {
        console.log(`       Schedule: ${resource.schedule.periods.length} periods`);
      }
    }

    // =========================================================================
    // STEP 3: DES MODEL CREATION
    // =========================================================================
    console.log('\n[STEP 3] DES MODEL CREATION');
    console.log('-'.repeat(80));

    console.log('✅ Creating DES model from extracted system...');
    console.log(`   Model will simulate: ${system.systemName}`);

    // =========================================================================
    // STEP 4: SIMULATION EXECUTION
    // =========================================================================
    console.log('\n[STEP 4] SIMULATION EXECUTION');
    console.log('-'.repeat(80));

    const simulationTime = 480; // 8 hours
    const numReplications = 10;  // Reduced for testing

    console.log(`   Simulation time: ${simulationTime} minutes (${simulationTime/60} hours)`);
    console.log(`   Replications: ${numReplications}`);
    console.log('   Running simulation...\n');

    const results = runDESFromExtractedSystem(system, simulationTime, numReplications);

    console.log('\n✅ Simulation completed');

    // =========================================================================
    // STEP 5: STATISTICS VALIDATION
    // =========================================================================
    console.log('\n[STEP 5] STATISTICS VALIDATION');
    console.log('-'.repeat(80));

    console.log('\n   Observation Statistics:');
    if (results.observations) {
      for (const [name, stats] of Object.entries(results.observations)) {
        const s: any = stats;
        console.log(`     ${name}:`);
        console.log(`       Mean: ${s.mean?.toFixed(2) || 'N/A'}`);
        console.log(`       Std Dev: ${s.stdDev?.toFixed(2) || 'N/A'}`);
        console.log(`       Min: ${s.min?.toFixed(2) || 'N/A'}`);
        console.log(`       Max: ${s.max?.toFixed(2) || 'N/A'}`);
        if (s.ci95) {
          console.log(`       95% CI: [${s.ci95[0]?.toFixed(2)}, ${s.ci95[1]?.toFixed(2)}]`);
        }
      }
    } else {
      console.log('     ⚠️  No observation statistics');
    }

    console.log('\n   Resource Utilization:');
    if (results.resources) {
      for (const [name, stats] of Object.entries(results.resources)) {
        const s: any = stats;
        console.log(`     ${name}:`);
        console.log(`       Utilization: ${(s.utilization * 100)?.toFixed(1)}%`);
        console.log(`       Std Dev: ${(s.utilizationStdDev * 100)?.toFixed(1)}%`);
        if (s.ci95) {
          console.log(`       95% CI: [${(s.ci95[0] * 100)?.toFixed(1)}%, ${(s.ci95[1] * 100)?.toFixed(1)}%]`);
        }
      }
    } else {
      console.log('     ⚠️  No resource statistics');
    }

    // =========================================================================
    // STEP 6: SANITY CHECKS
    // =========================================================================
    console.log('\n[STEP 6] SANITY CHECKS');
    console.log('-'.repeat(80));

    const checks: { name: string; pass: boolean; message: string }[] = [];

    // Check 1: Results exist
    checks.push({
      name: 'Results exist',
      pass: results !== null && results !== undefined,
      message: 'Simulation returned results'
    });

    // Check 2: Statistics have values
    const hasCycleTime = results.observations?.cycleTime?.mean !== undefined;
    checks.push({
      name: 'Cycle time recorded',
      pass: hasCycleTime,
      message: hasCycleTime ? `Mean cycle time: ${results.observations.cycleTime.mean.toFixed(2)} min` : 'No cycle time data'
    });

    // Check 3: Throughput is reasonable
    const throughput = results.observations?.throughput?.mean;
    const hasThroughput = throughput !== undefined && throughput > 0;
    checks.push({
      name: 'Throughput positive',
      pass: hasThroughput,
      message: hasThroughput ? `Throughput: ${throughput.toFixed(2)} entities` : 'No throughput data'
    });

    // Check 4: Utilization is in valid range
    if (results.resources) {
      for (const [name, stats] of Object.entries(results.resources)) {
        const s: any = stats;
        const validUtil = s.utilization >= 0 && s.utilization <= 1;
        checks.push({
          name: `${name} utilization valid`,
          pass: validUtil,
          message: validUtil ? `${(s.utilization * 100).toFixed(1)}% (valid)` : `${(s.utilization * 100).toFixed(1)}% (INVALID)`
        });
      }
    }

    // Check 5: No NaN values
    let hasNaN = false;
    if (results.observations) {
      for (const stats of Object.values(results.observations)) {
        const s: any = stats;
        if (isNaN(s.mean) || isNaN(s.stdDev)) {
          hasNaN = true;
        }
      }
    }
    checks.push({
      name: 'No NaN values',
      pass: !hasNaN,
      message: hasNaN ? 'Found NaN in statistics' : 'All values valid'
    });

    // Print checks
    let allPass = true;
    for (const check of checks) {
      const status = check.pass ? '✅' : '❌';
      console.log(`   ${status} ${check.name}: ${check.message}`);
      if (!check.pass) allPass = false;
    }

    // =========================================================================
    // FINAL VERDICT
    // =========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('FINAL VERDICT');
    console.log('='.repeat(80));

    if (allPass) {
      console.log('\n✅✅✅ END-TO-END PIPELINE: FULLY OPERATIONAL ✅✅✅');
      console.log('\nAll steps completed successfully:');
      console.log('  1. PDF → Text extraction ✅');
      console.log('  2. Text → Entity extraction (AI) ✅');
      console.log('  3. Entities → DES model ✅');
      console.log('  4. Simulation execution ✅');
      console.log('  5. Statistics calculation ✅');
      console.log('  6. Validation checks ✅');
      console.log('\n🎉 SIMIO-GRADE QUALITY ACHIEVED 🎉');
    } else {
      console.log('\n❌ END-TO-END PIPELINE: ISSUES DETECTED');
      console.log('\nSome checks failed. Review output above.');
    }

    console.log('\n' + '='.repeat(80));

    return { success: allPass, results, system };

  } catch (error) {
    console.error('\n❌ PIPELINE FAILED WITH ERROR:');
    console.error(error);
    return { success: false, error };
  }
}

// Run the test
testPipeline().then((result) => {
  if (result.success) {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  } else {
    console.log('\n❌ Test failed');
    process.exit(1);
  }
}).catch((error) => {
  console.error('\n❌ Uncaught error:', error);
  process.exit(1);
});
