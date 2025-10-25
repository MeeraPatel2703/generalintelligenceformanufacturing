// Complete example of integrating the DES Parser with the platform
// This demonstrates the full workflow from text/document → ProcessGraph → simulation

import { DESParser, parseTextToProcessGraph } from '../src/services/desParser';
import { ProcessGraph } from '../src/types/processGraph';
import { validateProcessGraph } from '../src/validation/processGraphSchema';
import {
  normalizeTime,
  normalizeDistance,
  normalizeSpeed,
  validateDistribution
} from '../src/utils/normalization';

// ============================================================================
// EXAMPLE 1: Simple M/M/1 Queue
// ============================================================================

async function example1_SimpleQueue() {
  console.log('\n=== EXAMPLE 1: Simple M/M/1 Queue ===\n');

  const description = `
    We have a single-server queue at a coffee shop.
    Customers arrive at a rate of 20 per hour (Poisson process).
    Service time is exponentially distributed with a mean of 2.5 minutes.
    Run the simulation for 8 hours with 50 replications.
    Use a 30-minute warmup period.
  `;

  const result = await parseTextToProcessGraph(description);

  if (!result.success) {
    console.error('Parse failed:', result.error);
    console.error('Validation errors:', result.validation?.errors);
    return;
  }

  console.log('✓ Parse successful!');
  console.log('✓ Repair attempts:', result.repairAttempts);
  console.log('✓ Entities:', result.processGraph!.entities.length);
  console.log('✓ Stations:', result.processGraph!.stations.length);
  console.log('✓ Run config:', result.processGraph!.runConfig);

  // Integrate with simulation platform
  // const engine = new SimioDestroyerPlatform();
  // configureFromProcessGraph(engine, result.processGraph!);
}

// ============================================================================
// EXAMPLE 2: Manufacturing Line with Rework
// ============================================================================

async function example2_ManufacturingLine() {
  console.log('\n=== EXAMPLE 2: Manufacturing Line ===\n');

  const description = `
    NovaFab PCB Assembly Line

    Parts arrive every 10 minutes following an exponential distribution.

    Stations:
    1. Printing: Triangular(8, 10, 12) minutes
    2. Placement: Normal(15, 2) minutes, requires 2 operators from OpPool
    3. Reflow: Constant 20 minutes
    4. AOI (Inspection): 5 minutes, 10% fail and return to Printing

    Material Handling:
    - Printing to Placement: 25 feet at 4 ft/s via conveyor C1 (accumulating, capacity 10)
    - Placement to Reflow: 30 feet at 3 ft/s
    - Reflow to AOI: 15 feet at 4 ft/s

    Resources:
    - OpPool: 5 operators with SMT skill level 2

    Schedule:
    - Day shift: Monday-Friday, 8:00-16:00
    - Breaks: 10:00 (15 min), 12:00 (30 min)

    Experiments to test:
    1. Add one Placement machine
    2. Add one operator to OpPool

    Run for 2 days (2880 minutes) with 30 replications, 4-hour warmup.
  `;

  const result = await parseTextToProcessGraph(description);

  if (!result.success) {
    console.error('Parse failed:', result.error);
    return;
  }

  console.log('✓ Parse successful!');
  console.log('\nExtracted Configuration:');
  console.log('  Entities:', result.processGraph!.entities.map(e => e.id));
  console.log('  Stations:', result.processGraph!.stations.map(s => `${s.id} (${s.kind})`));
  console.log('  Routes:', result.processGraph!.routes.length);
  console.log('  Resources:', result.processGraph!.resources?.map(r => `${r.id} (${r.count} ${r.type}s)`));
  console.log('  Calendars:', result.processGraph!.calendars?.map(c => c.id));
  console.log('  Experiments:', result.processGraph!.experiments?.map(e => e.id));

  console.log('\nProcess Times:');
  result.processGraph!.stations.forEach(station => {
    if (station.processTime) {
      const dist = station.processTime;
      console.log(`  ${station.id}: ${dist.type} distribution`);
    }
  });

  console.log('\nMissing Information:', result.processGraph!.metadata.missing);
  console.log('Assumptions:', result.processGraph!.metadata.assumptions);
}

// ============================================================================
// EXAMPLE 3: Document Parsing (PDF/DOCX)
// ============================================================================

async function example3_DocumentParsing() {
  console.log('\n=== EXAMPLE 3: Document Parsing ===\n');

  const parser = new DESParser({
    maxRepairAttempts: 3,
    enableLogging: true
  });

  // Parse a specification document
  const result = await parser.parseDocument('./specs/factory-layout.pdf');

  if (!result.success) {
    console.error('Document parse failed:', result.error);
    return;
  }

  console.log('✓ Document parsed successfully');
  console.log('✓ Input type:', result.metadata?.inputType);
  console.log('✓ Input size:', result.metadata?.inputSize, 'bytes');
  console.log('✓ Parse time:', result.metadata?.parseTime, 'ms');
}

// ============================================================================
// EXAMPLE 4: Validation and Custom Checks
// ============================================================================

async function example4_ValidationAndChecks() {
  console.log('\n=== EXAMPLE 4: Validation and Custom Checks ===\n');

  // Manually construct a ProcessGraph
  const processGraph: ProcessGraph = {
    entities: [
      {
        id: 'Part',
        batchSize: 1,
        class: 'Standard',
        attributes: [],
        priority: 0
      }
    ],
    arrivals: [
      {
        policy: 'poisson',
        windows: [
          {
            start: '00:00',
            end: '08:00',
            rate: 30,
            units: 'entities/hour'
          }
        ],
        batch: 1
      }
    ],
    stations: [
      {
        id: 'Machine1',
        kind: 'machine',
        count: 1,
        capacity: 1,
        queue: 'FIFO',
        processTime: {
          type: 'triangular',
          params: { min: 5, mode: 7, max: 10 },
          units: 'minutes'
        }
      },
      {
        id: 'Exit',
        kind: 'sink',
        count: 1,
        capacity: 999999,
        queue: 'FIFO'
      }
    ],
    routes: [
      {
        from: 'Machine1',
        to: 'Exit',
        probability: 1.0
      }
    ],
    runConfig: {
      runLength_min: 480,
      warmup_min: 60,
      replications: 30,
      confidence: 95
    },
    metadata: {
      model_id: 'Manual_Model',
      version: '1.0',
      description: 'Manually constructed for testing'
    }
  };

  // Validate
  const validation = validateProcessGraph(processGraph);

  if (validation.valid) {
    console.log('✓ ProcessGraph is valid!');
  } else {
    console.log('✗ Validation failed:');
    validation.errors.forEach(err => {
      console.log(`  - ${err.path}: ${err.message}`);
    });
  }

  // Check distributions
  processGraph.stations.forEach(station => {
    if (station.processTime) {
      const distCheck = validateDistribution(station.processTime);
      if (distCheck.valid) {
        console.log(`✓ ${station.id} process time distribution is valid`);
      } else {
        console.log(`✗ ${station.id} distribution error: ${distCheck.error}`);
      }
    }
  });
}

// ============================================================================
// EXAMPLE 5: Integration with Simulation Platform
// ============================================================================

function example5_PlatformIntegration(processGraph: ProcessGraph) {
  console.log('\n=== EXAMPLE 5: Platform Integration ===\n');

  console.log('Converting ProcessGraph to platform configuration...\n');

  // Step 1: Configure entities
  console.log('1. Configuring entities:');
  processGraph.entities.forEach(entity => {
    console.log(`   - Entity: ${entity.id}, class: ${entity.class}, batch: ${entity.batchSize}`);
    // platform.addEntityType(entity.id, entity.class);
  });

  // Step 2: Configure arrivals
  console.log('\n2. Configuring arrivals:');
  processGraph.arrivals.forEach((arrival, idx) => {
    console.log(`   - Arrival ${idx + 1}: ${arrival.policy} policy`);
    if (arrival.policy === 'poisson') {
      arrival.windows.forEach(window => {
        console.log(`     ${window.start}-${window.end}: ${window.rate} ${window.units}`);
      });
    }
    // platform.configureArrivals(arrival);
  });

  // Step 3: Configure stations
  console.log('\n3. Configuring stations:');
  processGraph.stations.forEach(station => {
    console.log(`   - Station: ${station.id} (${station.kind})`);
    console.log(`     Count: ${station.count}, Capacity: ${station.capacity}`);
    console.log(`     Queue: ${station.queue}`);

    if (station.processTime) {
      const dist = station.processTime;
      console.log(`     Process time: ${dist.type} distribution`);
    }

    // platform.addStation(station.id, {
    //   kind: station.kind,
    //   count: station.count,
    //   capacity: station.capacity,
    //   processTime: station.processTime
    // });
  });

  // Step 4: Configure routes
  console.log('\n4. Configuring routes:');
  processGraph.routes.forEach(route => {
    console.log(`   - ${route.from} → ${route.to} (p=${route.probability})`);
    if (route.distance_ft) {
      console.log(`     Distance: ${route.distance_ft} ft at ${route.speed_ftps} ft/s`);
    }
    // platform.addRoute(route.from, route.to, route.probability, route.distance_ft);
  });

  // Step 5: Configure resources
  if (processGraph.resources && processGraph.resources.length > 0) {
    console.log('\n5. Configuring resources:');
    processGraph.resources.forEach(resource => {
      console.log(`   - ${resource.id}: ${resource.count} ${resource.type}(s)`);
      if (resource.skills) {
        console.log(`     Skills: ${resource.skills.map(s => `${s.name}(${s.level})`).join(', ')}`);
      }
      // platform.addResourcePool(resource.id, resource.type, resource.count);
    });
  }

  // Step 6: Configure calendars
  if (processGraph.calendars && processGraph.calendars.length > 0) {
    console.log('\n6. Configuring calendars:');
    processGraph.calendars.forEach(calendar => {
      console.log(`   - Calendar: ${calendar.id}`);
      calendar.shifts.forEach(shift => {
        console.log(`     ${shift.day}: ${shift.start}-${shift.end}`);
      });
      // platform.addCalendar(calendar.id, calendar.shifts, calendar.breaks);
    });
  }

  // Step 7: Run configuration
  console.log('\n7. Run configuration:');
  const rc = processGraph.runConfig;
  console.log(`   Duration: ${rc.runLength_min} min`);
  console.log(`   Warmup: ${rc.warmup_min} min`);
  console.log(`   Replications: ${rc.replications}`);
  console.log(`   Confidence: ${rc.confidence}%`);

  // platform.run(rc.runLength_min, rc.replications, rc.warmup_min);

  console.log('\n✓ Platform configured successfully!');
}

// ============================================================================
// EXAMPLE 6: Unit Normalization
// ============================================================================

function example6_UnitNormalization() {
  console.log('\n=== EXAMPLE 6: Unit Normalization ===\n');

  // Time conversions
  console.log('Time normalization (to minutes):');
  console.log(`  30 seconds = ${normalizeTime(30, 'seconds')} minutes`);
  console.log(`  2 hours = ${normalizeTime(2, 'hours')} minutes`);
  console.log(`  1 day = ${normalizeTime(1, 'days')} minutes`);

  // Distance conversions
  console.log('\nDistance normalization (to feet):');
  console.log(`  10 meters = ${normalizeDistance(10, 'meters').toFixed(2)} feet`);
  console.log(`  100 inches = ${normalizeDistance(100, 'inches').toFixed(2)} feet`);
  console.log(`  1 mile = ${normalizeDistance(1, 'miles')} feet`);

  // Speed conversions
  console.log('\nSpeed normalization (to ft/s):');
  console.log(`  60 ft/min = ${normalizeSpeed(60, 'ft/min')} ft/s`);
  console.log(`  10 m/s = ${normalizeSpeed(10, 'm/s').toFixed(2)} ft/s`);
  console.log(`  30 mph = ${normalizeSpeed(30, 'mph').toFixed(2)} ft/s`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║    DES Parser Integration Examples                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  try {
    // Run examples
    // await example1_SimpleQueue();
    // await example2_ManufacturingLine();
    // await example3_DocumentParsing();
    await example4_ValidationAndChecks();
    example6_UnitNormalization();

    // Integration example (using result from example 2 or 4)
    const processGraph: ProcessGraph = {
      entities: [{ id: 'Part', batchSize: 1, class: 'Standard', attributes: [], priority: 0 }],
      arrivals: [{
        policy: 'poisson',
        windows: [{ start: '00:00', end: '08:00', rate: 30, units: 'entities/hour' }],
        batch: 1
      }],
      stations: [
        {
          id: 'Machine1',
          kind: 'machine',
          count: 1,
          capacity: 1,
          queue: 'FIFO',
          processTime: { type: 'triangular', params: { min: 5, mode: 7, max: 10 }, units: 'minutes' }
        },
        { id: 'Exit', kind: 'sink', count: 1, capacity: 999999, queue: 'FIFO' }
      ],
      routes: [{ from: 'Machine1', to: 'Exit', probability: 1.0 }],
      runConfig: { runLength_min: 480, warmup_min: 60, replications: 30, confidence: 95 },
      metadata: { model_id: 'Test', version: '1.0' }
    };

    example5_PlatformIntegration(processGraph);

    console.log('\n✓ All examples completed successfully!\n');
  } catch (error) {
    console.error('\n✗ Error running examples:', error);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export {
  example1_SimpleQueue,
  example2_ManufacturingLine,
  example3_DocumentParsing,
  example4_ValidationAndChecks,
  example5_PlatformIntegration,
  example6_UnitNormalization
};
