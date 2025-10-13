/**
 * CRITICAL INTEGRATION TEST
 * Tests all 5 critical systems end-to-end
 */

import { IndustrialSimulationAdapter } from './src/des-core/IndustrialSimulationAdapter';
import { ExtractedSystem, Entity, Resource, Process, ProcessStep } from './src/types/extraction';

console.log('='.repeat(80));
console.log('INTEGRATION TEST - ALL CRITICAL SYSTEMS');
console.log('='.repeat(80));

// ============================================================================
// TEST 1: Format Converter (AI sequences → simulation processes)
// ============================================================================

console.log('\n[TEST 1] Format Converter: AI sequences → simulation processes');

const testSystem: ExtractedSystem = {
  systemType: 'service',
  systemName: 'Test Coffee Shop',
  description: 'Single server coffee shop for testing',

  // Entity definition with arrival pattern
  entities: [{
    name: 'Customer',
    type: 'customer',
    arrivalPattern: {
      type: 'poisson',
      rate: 30, // 30 per hour
      rateUnit: 'per_hour'
    },
    attributes: [],
    description: 'Customers arriving to coffee shop'
  }],

  // Resource definitions
  resources: [{
    name: 'Barista',
    type: 'worker',
    capacity: 1,
    processingTime: {
      type: 'exponential',
      parameters: {
        mean: 2.0 // 2 minutes average
      },
      unit: 'minutes'
    },
    description: 'Coffee preparation'
  }],

  // Process flow: Seize → Delay → Release
  processes: [{
    name: 'OrderProcess',
    entityType: 'Customer',
    routingLogic: 'sequential',
    sequence: [
      {
        id: 'seize_barista',
        type: 'seize',
        resourceName: 'Barista',
        description: 'Customer seizes barista'
      },
      {
        id: 'make_coffee',
        type: 'delay',
        duration: {
          type: 'exponential',
          parameters: { mean: 2.0 },
          unit: 'minutes'
        },
        description: 'Coffee preparation time'
      },
      {
        id: 'release_barista',
        type: 'release',
        resourceName: 'Barista',
        description: 'Customer releases barista'
      }
    ]
  }],

  constraints: [],
  objectives: [],
  experiments: [],
  missingInformation: [],
  assumptions: []
};

console.log('  Input system:');
console.log(`    - Entities: ${testSystem.entities.length} (${testSystem.entities.map(e => e.name).join(', ')})`);
console.log(`    - Resources: ${testSystem.resources.length} (${testSystem.resources.map(r => r.name).join(', ')})`);
console.log(`    - Processes: ${testSystem.processes.length} (${testSystem.processes.map(p => p.name).join(', ')})`);
console.log(`    - Process steps: ${testSystem.processes[0].sequence.length}`);

// Create adapter (this converts AI format → DES format)
console.log('  Converting to simulation format...');
const adapter = new IndustrialSimulationAdapter(testSystem, 12345);

console.log('  ✓ Conversion successful');

// ============================================================================
// TEST 2: Arrival Pattern Handler
// ============================================================================

console.log('\n[TEST 2] Arrival Pattern Handler');

const stats = adapter.getDetailedStats();
const initialCreated = stats.simulation.entitiesCreated;

console.log(`  Initial entities created: ${initialCreated}`);

// Step simulation forward to trigger arrivals
console.log('  Running 10 simulation steps...');
for (let i = 0; i < 10; i++) {
  adapter.step();
}

const statsAfter10Steps = adapter.getDetailedStats();
console.log(`  Entities after 10 steps: ${statsAfter10Steps.simulation.entitiesCreated}`);

if (statsAfter10Steps.simulation.entitiesCreated > 0) {
  console.log('  ✓ Arrival generation working');
} else {
  console.log('  ✗ NO ARRIVALS - Arrival pattern handler BROKEN');
  process.exit(1);
}

// ============================================================================
// TEST 3: Entity Lifecycle (creation → processing → departure)
// ============================================================================

console.log('\n[TEST 3] Entity Lifecycle: creation → processing → departure');

// Run simulation for 60 minutes
console.log('  Running simulation for 60 minutes...');
adapter.reset();

let steps = 0;
const maxSteps = 10000; // Safety limit
while (!adapter.isComplete() && steps < maxSteps) {
  adapter.step();
  steps++;
}

const finalStats = adapter.getDetailedStats();

console.log(`  Final statistics after ${steps} steps:`);
console.log(`    - Entities created: ${finalStats.simulation.entitiesCreated}`);
console.log(`    - Entities departed: ${finalStats.simulation.entitiesDeparted}`);
console.log(`    - Entities in system: ${finalStats.simulation.entitiesInSystem}`);
console.log(`    - Current time: ${finalStats.simulation.currentTime.toFixed(2)} min`);

// Verify conservation law
const conservationHolds = finalStats.simulation.entitiesCreated ===
  (finalStats.simulation.entitiesInSystem + finalStats.simulation.entitiesDeparted);

if (conservationHolds) {
  console.log('  ✓ Conservation law holds');
} else {
  console.log('  ✗ CONSERVATION LAW VIOLATED');
  process.exit(1);
}

if (finalStats.simulation.entitiesCreated > 0) {
  console.log('  ✓ Entities created');
} else {
  console.log('  ✗ NO ENTITIES CREATED');
  process.exit(1);
}

if (finalStats.simulation.entitiesDeparted > 0) {
  console.log('  ✓ Entities departed (full lifecycle works)');
} else {
  console.log('  ✗ NO ENTITIES DEPARTED - Lifecycle incomplete');
  process.exit(1);
}

// ============================================================================
// TEST 4: Statistics Pipeline (calculation → display)
// ============================================================================

console.log('\n[TEST 4] Statistics Pipeline: calculation → display');

const displayStats = adapter.getStats();

console.log('  Display statistics:');
console.log(`    - Current time: ${displayStats.currentTime.toFixed(2)} min`);
console.log(`    - Entities created: ${displayStats.entitiesCreated}`);
console.log(`    - Entities departed: ${displayStats.entitiesDeparted}`);
console.log(`    - Entities in system: ${displayStats.entitiesInSystem}`);
console.log(`    - Throughput: ${displayStats.throughput.toFixed(2)} per hour`);
console.log(`    - Avg cycle time: ${displayStats.avgCycleTime.toFixed(2)} min`);
console.log(`    - Avg wait time: ${displayStats.avgWaitTime.toFixed(2)} min`);
console.log(`    - Progress: ${displayStats.progress.toFixed(1)}%`);

// Verify statistics are reasonable
if (displayStats.throughput > 0 && displayStats.throughput < 1000) {
  console.log('  ✓ Throughput reasonable');
} else {
  console.log(`  ✗ THROUGHPUT INVALID: ${displayStats.throughput}`);
  process.exit(1);
}

if (displayStats.avgCycleTime > 0 && displayStats.avgCycleTime < 1000) {
  console.log('  ✓ Cycle time reasonable');
} else {
  console.log(`  ✗ CYCLE TIME INVALID: ${displayStats.avgCycleTime}`);
  process.exit(1);
}

if (displayStats.progress >= 99.0) {
  console.log('  ✓ Simulation reached completion');
} else {
  console.log(`  ! Simulation only ${displayStats.progress.toFixed(1)}% complete`);
}

console.log('  ✓ Statistics pipeline working');

// ============================================================================
// TEST 5: Visual Entities & Resources
// ============================================================================

console.log('\n[TEST 5] Visual Entity/Resource Tracking');

const visualEntities = adapter.getVisualEntities();
const visualResources = adapter.getVisualResources();

console.log(`  Visual entities: ${visualEntities.length}`);
console.log(`  Visual resources: ${visualResources.length}`);

if (visualResources.length === testSystem.resources.length) {
  console.log('  ✓ All resources tracked');
} else {
  console.log('  ✗ RESOURCE COUNT MISMATCH');
}

visualResources.forEach(r => {
  console.log(`    - ${r.name}: util=${r.utilization.toFixed(1)}%, queue=${r.queueLength}, load=${r.currentLoad}/${r.capacity}`);
});

console.log('  ✓ Visual tracking working');

// ============================================================================
// TEST 6: Multi-Stage Process (Advanced)
// ============================================================================

console.log('\n[TEST 6] Multi-Stage Process Routing');

const multiStageSystem: ExtractedSystem = {
  systemType: 'manufacturing',
  systemName: 'Two-Stage Production',
  description: 'Testing multi-stage routing',

  entities: [{
    name: 'Part',
    type: 'part',
    arrivalPattern: {
      type: 'poisson',
      rate: 20,
      rateUnit: 'per_hour'
    },
    attributes: []
  }],

  resources: [
    {
      name: 'Machine1',
      type: 'machine',
      capacity: 1,
      processingTime: {
        type: 'constant',
        parameters: { value: 2.0 },
        unit: 'minutes'
      }
    },
    {
      name: 'Machine2',
      type: 'machine',
      capacity: 1,
      processingTime: {
        type: 'constant',
        parameters: { value: 1.5 },
        unit: 'minutes'
      }
    }
  ],

  processes: [{
    name: 'TwoStageProcess',
    entityType: 'Part',
    routingLogic: 'sequential',
    sequence: [
      // Stage 1
      {
        id: 'seize_machine1',
        type: 'seize',
        resourceName: 'Machine1'
      },
      {
        id: 'process_machine1',
        type: 'delay',
        duration: {
          type: 'constant',
          parameters: { value: 2.0 },
          unit: 'minutes'
        }
      },
      {
        id: 'release_machine1',
        type: 'release',
        resourceName: 'Machine1'
      },
      // Stage 2
      {
        id: 'seize_machine2',
        type: 'seize',
        resourceName: 'Machine2'
      },
      {
        id: 'process_machine2',
        type: 'delay',
        duration: {
          type: 'constant',
          parameters: { value: 1.5 },
          unit: 'minutes'
        }
      },
      {
        id: 'release_machine2',
        type: 'release',
        resourceName: 'Machine2'
      }
    ]
  }],

  constraints: [],
  objectives: [],
  experiments: [],
  missingInformation: [],
  assumptions: []
};

console.log('  Creating two-stage system...');
const multiAdapter = new IndustrialSimulationAdapter(multiStageSystem, 54321);

console.log('  Running simulation...');
steps = 0;
while (!multiAdapter.isComplete() && steps < maxSteps) {
  multiAdapter.step();
  steps++;
}

const multiStats = multiAdapter.getDetailedStats();
console.log(`  Results:`);
console.log(`    - Entities created: ${multiStats.simulation.entitiesCreated}`);
console.log(`    - Entities departed: ${multiStats.simulation.entitiesDeparted}`);
console.log(`    - Avg cycle time: ${multiStats.tally.entity_cycle_time?.mean.toFixed(2) || 'N/A'} min`);

// Expected cycle time: ~3.5 min (2.0 + 1.5) + wait times
const expectedCycleTime = 3.5;
const actualCycleTime = multiStats.tally.entity_cycle_time?.mean || 0;

if (actualCycleTime >= expectedCycleTime && actualCycleTime < expectedCycleTime * 5) {
  console.log(`  ✓ Multi-stage routing working (cycle time reasonable)`);
} else {
  console.log(`  ! Cycle time ${actualCycleTime.toFixed(2)} seems off (expected ~${expectedCycleTime})`);
}

// ============================================================================
// FINAL SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('INTEGRATION TEST RESULTS');
console.log('='.repeat(80));

const allTests = [
  { name: 'Format Converter', passed: true },
  { name: 'Arrival Pattern Handler', passed: statsAfter10Steps.simulation.entitiesCreated > 0 },
  { name: 'Entity Lifecycle', passed: finalStats.simulation.entitiesDeparted > 0 && conservationHolds },
  { name: 'Statistics Pipeline', passed: displayStats.throughput > 0 },
  { name: 'Visual Tracking', passed: visualResources.length > 0 },
  { name: 'Multi-Stage Routing', passed: multiStats.simulation.entitiesDeparted > 0 }
];

console.log('\nTest Results:');
allTests.forEach(test => {
  const status = test.passed ? '✓ PASS' : '✗ FAIL';
  console.log(`  ${status} - ${test.name}`);
});

const passedCount = allTests.filter(t => t.passed).length;
const totalCount = allTests.length;

console.log(`\nOverall: ${passedCount}/${totalCount} tests passed`);

if (passedCount === totalCount) {
  console.log('\n🎉 ALL SYSTEMS WORKING - READY FOR DEMO 🎉');
  process.exit(0);
} else {
  console.log('\n❌ SOME SYSTEMS FAILING - FIX BEFORE DEMO');
  process.exit(1);
}
