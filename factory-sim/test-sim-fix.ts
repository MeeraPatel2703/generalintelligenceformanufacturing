/**
 * Test script to verify the simulation fix
 * Tests that entities are created and simulation time advances
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { IndustrialSimulationAdapter } from './src/des-core/IndustrialSimulationAdapter';
import { ExtractedSystem } from './src/types/extraction';

console.log('╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║                     SIMULATION FIX VERIFICATION TEST                       ║');
console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

// Load the snow tubing model
const modelPath = join(__dirname, 'snow-tubing-model.json');
console.log(`[Test] Loading model from: ${modelPath}\n`);

let system: ExtractedSystem;
try {
  const modelJson = readFileSync(modelPath, 'utf-8');
  system = JSON.parse(modelJson);
  console.log(`[Test] ✓ Model loaded successfully`);
  console.log(`[Test]   System: ${system.systemName}`);
  console.log(`[Test]   Entities: ${system.entities.length}`);
  console.log(`[Test]   Resources: ${system.resources.length}`);
  console.log(`[Test]   Processes: ${system.processes.length}\n`);
} catch (error) {
  console.error(`[Test] ✗ Failed to load model:`, error);
  process.exit(1);
}

// Create simulation adapter
console.log('[Test] Creating Industrial Simulation Adapter...\n');
let adapter: IndustrialSimulationAdapter;
try {
  adapter = new IndustrialSimulationAdapter(system, 12345);
  console.log('\n[Test] ✓ Adapter created successfully\n');
} catch (error) {
  console.error('[Test] ✗ Failed to create adapter:', error);
  process.exit(1);
}

// Get initial stats
const initialStats = adapter.getStats();
console.log('╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║                         INITIAL STATE                                      ║');
console.log('╠════════════════════════════════════════════════════════════════════════════╣');
console.log(`║  Time: ${initialStats.currentTime.toFixed(2).padEnd(70)}║`);
console.log(`║  Entities Created: ${initialStats.entitiesCreated.toString().padEnd(59)}║`);
console.log(`║  Entities Departed: ${initialStats.entitiesDeparted.toString().padEnd(58)}║`);
console.log(`║  Entities In System: ${initialStats.entitiesInSystem.toString().padEnd(56)}║`);
console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

// Run simulation for 10 steps
console.log('[Test] Running simulation for 10 steps...\n');
for (let i = 0; i < 10; i++) {
  adapter.step();
  const stats = adapter.getStats();
  
  if (i < 5 || i === 9) {
    console.log(`[Test] Step ${i + 1}: Time=${stats.currentTime.toFixed(2)} min, ` +
                `Created=${stats.entitiesCreated}, ` +
                `InSystem=${stats.entitiesInSystem}, ` +
                `Departed=${stats.entitiesDeparted}`);
  } else if (i === 5) {
    console.log(`[Test] ...`);
  }
}

// Get final stats
const finalStats = adapter.getStats();
console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║                         FINAL STATE (after 10 steps)                      ║');
console.log('╠════════════════════════════════════════════════════════════════════════════╣');
console.log(`║  Time: ${finalStats.currentTime.toFixed(2).padEnd(70)}║`);
console.log(`║  Entities Created: ${finalStats.entitiesCreated.toString().padEnd(59)}║`);
console.log(`║  Entities Departed: ${finalStats.entitiesDeparted.toString().padEnd(58)}║`);
console.log(`║  Entities In System: ${finalStats.entitiesInSystem.toString().padEnd(56)}║`);
console.log(`║  Throughput: ${finalStats.throughput.toFixed(2).padEnd(65)}║`);
console.log(`║  Avg Cycle Time: ${finalStats.avgCycleTime.toFixed(2).padEnd(61)}║`);
console.log(`║  Avg Wait Time: ${finalStats.avgWaitTime.toFixed(2).padEnd(62)}║`);
console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

// Verification
console.log('╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║                           VERIFICATION RESULTS                             ║');
console.log('╠════════════════════════════════════════════════════════════════════════════╣');

let allPassed = true;

// Check 1: Time advanced
if (finalStats.currentTime > 0) {
  console.log('║  ✓ PASS: Simulation time advanced                                         ║');
} else {
  console.log('║  ✗ FAIL: Simulation time did NOT advance                                  ║');
  allPassed = false;
}

// Check 2: Entities created
if (finalStats.entitiesCreated > 0) {
  console.log(`║  ✓ PASS: Entities created (${finalStats.entitiesCreated} entities)${' '.repeat(50 - finalStats.entitiesCreated.toString().length)}║`);
} else {
  console.log('║  ✗ FAIL: NO entities created                                              ║');
  allPassed = false;
}

// Check 3: Entities in system or departed
if (finalStats.entitiesInSystem > 0 || finalStats.entitiesDeparted > 0) {
  console.log(`║  ✓ PASS: Entities flowing through system (${finalStats.entitiesInSystem} in system, ${finalStats.entitiesDeparted} departed)${' '.repeat(29 - finalStats.entitiesInSystem.toString().length - finalStats.entitiesDeparted.toString().length)}║`);
} else {
  console.log('║  ✗ FAIL: No entities in system or departed                                ║');
  allPassed = false;
}

console.log('╠════════════════════════════════════════════════════════════════════════════╣');
if (allPassed) {
  console.log('║                    🎉 ALL CHECKS PASSED! 🎉                                ║');
} else {
  console.log('║                    ❌ SOME CHECKS FAILED ❌                                ║');
}
console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

process.exit(allPassed ? 0 : 1);

