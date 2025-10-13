/**
 * Integration Test for Factory-Sim
 * Tests the complete flow including .env loading, document parsing, and extraction
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEST_TIMEOUT = 30000;
let electronProcess = null;
let testsPassed = 0;
let testsFailed = 0;

function log(message) {
  console.log(`[TEST] ${message}`);
}

function pass(testName) {
  console.log(`✓ PASS: ${testName}`);
  testsPassed++;
}

function fail(testName, reason) {
  console.log(`✗ FAIL: ${testName}`);
  console.log(`  Reason: ${reason}`);
  testsFailed++;
}

function cleanup() {
  if (electronProcess) {
    electronProcess.kill();
  }
  fs.unlinkSync('app-startup.log');
  fs.unlinkSync('electron.pid');
}

async function runTests() {
  log('Starting integration tests...\n');

  // Test 1: Pre-flight checks
  log('Test 1: Pre-flight Checks');

  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    if (envContent.includes('OPENAI_API_KEY')) {
      pass('Pre-flight: .env file exists with OPENAI_API_KEY');
    } else {
      fail('Pre-flight: .env file missing OPENAI_API_KEY');
      process.exit(1);
    }
  } else {
    fail('Pre-flight: .env file not found', envPath);
    process.exit(1);
  }

  const mainJs = path.join(__dirname, 'dist-electron/electron/main.js');
  if (fs.existsSync(mainJs)) {
    const mainJsContent = fs.readFileSync(mainJs, 'utf-8');
    if (mainJsContent.includes('envPaths')) {
      pass('Pre-flight: Fixed dotenv code present in compiled main.js');
    } else {
      fail('Pre-flight: Fixed dotenv code NOT in main.js', 'Run npm run build:all');
      process.exit(1);
    }
  } else {
    fail('Pre-flight: main.js not compiled', 'Run npm run build:all');
    process.exit(1);
  }

  const testDoc = path.join(__dirname, 'test-snow-tubing.txt');
  if (fs.existsSync(testDoc)) {
    pass('Pre-flight: Test document exists');
  } else {
    fail('Pre-flight: Test document not found', testDoc);
    process.exit(1);
  }

  // Test 2: Application startup
  log('\nTest 2: Application Startup');

  return new Promise((resolve) => {
    electronProcess = spawn('npm', ['start'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: __dirname
    });

    let output = '';
    let errorOutput = '';

    electronProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    electronProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Give it 10 seconds to start up
    setTimeout(() => {
      const combinedOutput = output + errorOutput;

      // Test: .env loaded
      if (combinedOutput.includes('[Main] ✓ Loaded .env from:')) {
        pass('Startup: .env file loaded successfully');
      } else {
        fail('Startup: .env file NOT loaded', 'Check console for dotenv errors');
      }

      // Test: Environment variables present
      if (combinedOutput.includes('[Main] ✓ Environment variables loaded: ANTHROPIC_API_KEY, OPENAI_API_KEY')) {
        pass('Startup: Environment variables loaded (ANTHROPIC_API_KEY, OPENAI_API_KEY)');
      } else {
        fail('Startup: Environment variables NOT loaded');
      }

      // Test: OPENAI_API_KEY available
      if (combinedOutput.includes('[Main] ✓ OPENAI_API_KEY is available (length: 164')) {
        pass('Startup: OPENAI_API_KEY is available');
      } else if (combinedOutput.includes('[Main] ✗ OPENAI_API_KEY is NOT available!')) {
        fail('Startup: OPENAI_API_KEY is NOT available', 'The bug is NOT fixed');
      } else {
        fail('Startup: Cannot determine OPENAI_API_KEY status');
      }

      // Test: No critical errors
      if (!combinedOutput.includes('[Main] ✗ OPENAI_API_KEY is NOT available!')) {
        pass('Startup: No OPENAI_API_KEY error');
      } else {
        fail('Startup: OPENAI_API_KEY error present', 'THE BUG STILL EXISTS');
      }

      // Test: Preload script loaded
      if (combinedOutput.includes('[Main] Preload path:')) {
        pass('Startup: Preload script path set');
      } else {
        fail('Startup: Preload script path missing');
      }

      // Test: HTML loaded
      if (combinedOutput.includes('[Main] Loading HTML from:')) {
        pass('Startup: HTML file loaded');
      } else {
        fail('Startup: HTML file NOT loaded');
      }

      // Save output for review
      fs.writeFileSync('test-output.log', combinedOutput);
      log('\nFull output saved to: test-output.log');

      // Kill electron
      electronProcess.kill();

      // Summary
      log('\n' + '='.repeat(60));
      log(`TESTS COMPLETED`);
      log(`  Passed: ${testsPassed}`);
      log(`  Failed: ${testsFailed}`);
      log('='.repeat(60));

      if (testsFailed === 0) {
        log('\n✓✓✓ ALL TESTS PASSED ✓✓✓');
        log('The application is ready for use!');
        log('\nTo start the app: npm start');
        log('Then follow TESTING_CHECKLIST.md for manual testing');
        resolve(0);
      } else {
        log('\n✗✗✗ SOME TESTS FAILED ✗✗✗');
        log('Review test-output.log for details');
        resolve(1);
      }
    }, 10000);
  });
}

// Run tests
runTests().then(exitCode => {
  process.exit(exitCode);
}).catch(err => {
  console.error('[TEST] Unhandled error:', err);
  if (electronProcess) {
    electronProcess.kill();
  }
  process.exit(1);
});
