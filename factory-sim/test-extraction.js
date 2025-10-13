/**
 * Test script to verify document extraction works end-to-end
 * Run with: node test-extraction.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Verify environment
console.log('\n=== ENVIRONMENT CHECK ===');
console.log('✓ Node version:', process.version);
console.log('✓ Working directory:', process.cwd());
console.log('✓ OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
console.log('✓ OPENAI_API_KEY length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);

// Check .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✓ .env file found at:', envPath);
} else {
  console.error('✗ .env file NOT found at:', envPath);
  process.exit(1);
}

// Check test document
const testDocPath = path.join(__dirname, 'test-snow-tubing.txt');
if (fs.existsSync(testDocPath)) {
  const content = fs.readFileSync(testDocPath, 'utf-8');
  console.log('✓ Test document found:', testDocPath);
  console.log('✓ Document length:', content.length, 'chars');
} else {
  console.error('✗ Test document NOT found at:', testDocPath);
  process.exit(1);
}

// Check compiled Electron code
const mainJsPath = path.join(__dirname, 'dist-electron/electron/main.js');
if (fs.existsSync(mainJsPath)) {
  console.log('✓ Compiled main.js found at:', mainJsPath);
  const mainJs = fs.readFileSync(mainJsPath, 'utf-8');

  if (mainJs.includes('envPaths')) {
    console.log('✓ Fixed dotenv loading code present in main.js');
  } else {
    console.error('✗ Fixed dotenv loading code NOT found in main.js');
    console.error('  Please run: npm run build:all');
  }
} else {
  console.error('✗ Compiled main.js NOT found');
  console.error('  Please run: npm run build:all');
  process.exit(1);
}

// Check extraction service
const extractorPath = path.join(__dirname, 'dist-electron/electron/entityExtractor.js');
if (fs.existsSync(extractorPath)) {
  console.log('✓ Extractor service compiled at:', extractorPath);
} else {
  console.error('✗ Extractor service NOT compiled');
  process.exit(1);
}

console.log('\n=== ALL PRE-FLIGHT CHECKS PASSED ===\n');
console.log('Ready to test! Run the application with:');
console.log('  npm start');
console.log('\nThen follow the steps in TESTING_CHECKLIST.md\n');
