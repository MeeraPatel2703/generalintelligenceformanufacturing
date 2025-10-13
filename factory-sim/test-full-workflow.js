/**
 * Full End-to-End Workflow Test
 * This tests the ACTUAL extraction with OpenAI API
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function testFullWorkflow() {
  console.log('\n========================================');
  console.log('FULL WORKFLOW TEST');
  console.log('========================================\n');

  // Step 1: Verify environment
  console.log('Step 1: Environment Check');
  if (!process.env.OPENAI_API_KEY) {
    console.error('✗ FAIL: OPENAI_API_KEY not found');
    return false;
  }
  console.log('✓ OPENAI_API_KEY present (length:', process.env.OPENAI_API_KEY.length, ')');

  // Step 2: Load compiled modules
  console.log('\nStep 2: Loading Compiled Modules');

  let entityExtractor, documentParser;
  try {
    // These are the actual compiled Electron modules
    entityExtractor = require('./dist-electron/electron/entityExtractor.js');
    documentParser = require('./dist-electron/electron/documentParser.js');
    console.log('✓ Modules loaded successfully');
  } catch (err) {
    console.error('✗ FAIL: Could not load modules:', err.message);
    console.error('  Run: npm run build:all');
    return false;
  }

  // Step 3: Read test document
  console.log('\nStep 3: Reading Test Document');
  const testDocPath = path.join(__dirname, 'test-snow-tubing.txt');
  if (!fs.existsSync(testDocPath)) {
    console.error('✗ FAIL: test-snow-tubing.txt not found');
    return false;
  }

  const documentContent = fs.readFileSync(testDocPath, 'utf-8');
  console.log('✓ Document loaded:', documentContent.length, 'characters');

  // Step 4: Test AI Extraction (ACTUAL API CALL)
  console.log('\nStep 4: Testing AI Extraction (calling OpenAI API...)');
  console.log('⏳ This will take 10-30 seconds...');

  let extractionResult;
  try {
    const startTime = Date.now();
    extractionResult = await entityExtractor.extractSystemFromDocument(
      documentContent,
      'text'
    );
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('✓ Extraction completed in', duration, 'seconds');

    if (!extractionResult.success) {
      console.error('✗ FAIL: Extraction returned success=false');
      console.error('  Error:', extractionResult.error);
      return false;
    }

    console.log('✓ Extraction successful');

  } catch (err) {
    console.error('✗ FAIL: Extraction threw error:', err.message);
    if (err.message.includes('OPENAI_API_KEY not configured')) {
      console.error('\n❌❌❌ THE BUG STILL EXISTS! ❌❌❌');
      console.error('The fix did NOT work!\n');
    }
    return false;
  }

  // Step 5: Validate extracted system structure
  console.log('\nStep 5: Validating Extracted System Structure');

  const system = extractionResult.system;

  if (!system) {
    console.error('✗ FAIL: No system in extraction result');
    return false;
  }

  console.log('✓ System object present');

  // Check required fields
  const checks = [
    { name: 'systemName', value: system.systemName },
    { name: 'systemType', value: system.systemType },
    { name: 'description', value: system.description },
    { name: 'entities', value: system.entities, isArray: true },
    { name: 'resources', value: system.resources, isArray: true },
    { name: 'processes', value: system.processes, isArray: true }
  ];

  let allChecksPass = true;
  for (const check of checks) {
    if (check.isArray) {
      if (Array.isArray(check.value) && check.value.length > 0) {
        console.log(`✓ ${check.name}: ${check.value.length} items`);
      } else {
        console.error(`✗ FAIL: ${check.name} is empty or missing`);
        allChecksPass = false;
      }
    } else {
      if (check.value) {
        console.log(`✓ ${check.name}: "${check.value}"`);
      } else {
        console.error(`✗ FAIL: ${check.name} is missing`);
        allChecksPass = false;
      }
    }
  }

  if (!allChecksPass) {
    return false;
  }

  // Step 6: Detailed structure validation
  console.log('\nStep 6: Detailed Structure Validation');

  // Check entities have arrival patterns
  if (system.entities[0]?.arrivalPattern) {
    console.log('✓ First entity has arrival pattern:', system.entities[0].arrivalPattern.type);
  } else {
    console.error('✗ FAIL: Entity missing arrival pattern');
    return false;
  }

  // Check resources have capacity
  if (system.resources[0]?.capacity !== undefined) {
    console.log('✓ First resource has capacity:', system.resources[0].capacity);
  } else {
    console.error('✗ FAIL: Resource missing capacity');
    return false;
  }

  // Check processes have sequences
  if (system.processes[0]?.sequence && system.processes[0].sequence.length > 0) {
    console.log('✓ First process has', system.processes[0].sequence.length, 'steps');

    // Check for seize/delay/release pattern
    const stepTypes = system.processes[0].sequence.map(s => s.type);
    if (stepTypes.includes('seize') || stepTypes.includes('delay') || stepTypes.includes('release')) {
      console.log('✓ Process includes seize/delay/release steps');
    } else {
      console.warn('⚠ Warning: Process may be missing seize/delay/release steps');
    }
  } else {
    console.error('✗ FAIL: Process missing sequence');
    return false;
  }

  // Step 7: Save results for inspection
  console.log('\nStep 7: Saving Results');
  const outputPath = path.join(__dirname, 'test-extraction-result.json');
  fs.writeFileSync(outputPath, JSON.stringify(extractionResult, null, 2));
  console.log('✓ Results saved to:', outputPath);

  // Step 8: Token usage check
  if (extractionResult.tokensUsed) {
    console.log('\nStep 8: Token Usage');
    console.log('  Input tokens:', extractionResult.tokensUsed.input);
    console.log('  Output tokens:', extractionResult.tokensUsed.output);
    console.log('  Total:', extractionResult.tokensUsed.input + extractionResult.tokensUsed.output);
  }

  return true;
}

// Run the test
testFullWorkflow().then(success => {
  console.log('\n========================================');
  if (success) {
    console.log('✅✅✅ FULL WORKFLOW TEST PASSED ✅✅✅');
    console.log('========================================\n');
    console.log('The application is working correctly!');
    console.log('- .env loading: ✓');
    console.log('- OpenAI API: ✓');
    console.log('- System extraction: ✓');
    console.log('- Data structure: ✓');
    console.log('\nYou can now run: npm start');
    process.exit(0);
  } else {
    console.log('❌❌❌ FULL WORKFLOW TEST FAILED ❌❌❌');
    console.log('========================================\n');
    console.log('Check the error messages above.');
    process.exit(1);
  }
}).catch(err => {
  console.error('\n❌ UNHANDLED ERROR:', err.message);
  console.error(err.stack);
  process.exit(1);
});
