# DES Parser System - Complete Guide

## Overview

The **DES (Discrete Event Simulation) Parser System** is a comprehensive AI-powered parser that converts natural language descriptions and documents into validated, executable simulation models.

### Key Features

✅ **Complete DES Coverage** - Entities, arrivals, stations, routes, resources, experiments, calendars, etc.
✅ **Self-Repair Logic** - Automatically fixes validation errors (up to N attempts)
✅ **Strict Schema Validation** - Zod-based validation ensuring type safety
✅ **Unit Normalization** - Converts all units to canonical forms (minutes, feet, ft/s, entities/hour)
✅ **No Hallucinations** - Only extracts explicitly stated information
✅ **Document Support** - PDF, DOCX, TXT, Markdown
✅ **Type-Safe** - Full TypeScript coverage

---

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Usage Examples](#usage-examples)
5. [ProcessGraph Schema](#processgraph-schema)
6. [Validation & Repair](#validation--repair)
7. [Integration with Platform](#integration-with-platform)
8. [Advanced Features](#advanced-features)
9. [Troubleshooting](#troubleshooting)
10. [API Reference](#api-reference)

---

## Installation

```bash
npm install zod
```

Required files:
```
src/
  types/processGraph.ts          # TypeScript types
  validation/processGraphSchema.ts  # Zod validation schema
  services/desParser.ts          # Parser service
  utils/normalization.ts         # Unit conversion utilities
prompts/
  MASTER_DES_PARSER_PROMPT.md    # AI system prompt
examples/
  parser-integration-example.ts  # Usage examples
```

---

## Quick Start

### Parse Text Description

```typescript
import { parseTextToProcessGraph } from './src/services/desParser';

const description = `
  Customers arrive at a rate of 20 per hour.
  Service time is exponentially distributed with mean 2.5 minutes.
  Run for 8 hours with 50 replications.
`;

const result = await parseTextToProcessGraph(description);

if (result.success) {
  console.log('Parsed successfully!');
  console.log('Stations:', result.processGraph!.stations);
  console.log('Run config:', result.processGraph!.runConfig);
}
```

### Parse Document

```typescript
import { parseDocumentToProcessGraph } from './src/services/desParser';

const result = await parseDocumentToProcessGraph('./specs/factory.pdf');

if (result.success) {
  console.log('Entities:', result.processGraph!.entities);
  console.log('Experiments:', result.processGraph!.experiments);
}
```

### Custom Configuration

```typescript
import { createParser } from './src/services/desParser';

const parser = createParser({
  maxRepairAttempts: 3,
  enableLogging: true,
  strictMode: false
});

const result = await parser.parseText(description);
```

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                    User Input                           │
│  (Text description, PDF, DOCX, TXT, Markdown)           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              Document Parser                            │
│  (Extracts text from PDFs, DOCX)                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                DES Parser                               │
│  - Loads master system prompt                           │
│  - Calls LLM with prompt + user text                    │
│  - Extracts ProcessGraph JSON                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│           Zod Schema Validator                          │
│  - Validates structure                                  │
│  - Checks constraints (min≤mode≤max, etc.)              │
│  - Validates references (stations, resources)           │
│  - Checks probabilities sum to 1.0                      │
└────────────────┬────────────────────────────────────────┘
                 │
           Valid? No ──────┐
                 │         │
                Yes        │
                 │         ▼
                 │   ┌─────────────────────────────────┐
                 │   │     Self-Repair Logic           │
                 │   │  - Generate repair prompt       │
                 │   │  - Call LLM to fix errors       │
                 │   │  - Re-validate (max N attempts) │
                 │   └──────────┬──────────────────────┘
                 │              │
                 ▼              │
          ┌─────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│          Validated ProcessGraph                         │
│  Ready for simulation platform integration              │
└─────────────────────────────────────────────────────────┘
```

---

## Usage Examples

### Example 1: Simple M/M/1 Queue

```typescript
const description = `
  Single-server queue with Poisson arrivals at 20/hour.
  Service time: Exponential(2.5 minutes).
  Run for 8 hours, 50 replications.
`;

const result = await parseTextToProcessGraph(description);
// result.processGraph contains:
// - 1 entity (Customer)
// - 1 arrival (Poisson)
// - 2 stations (Server, Exit)
// - 1 route
// - runConfig: 480 min, 50 reps
```

### Example 2: Manufacturing Line

```typescript
const description = `
  Parts arrive every 10 minutes (exponential).

  Stations:
  1. Machining: Triangular(8, 10, 12) minutes
  2. Assembly: Normal(15, 2) minutes, needs 2 operators
  3. Inspection: 5 minutes, 10% rework to Machining

  Operators: 5 available in OpPool

  Run for 2 days, 30 replications, 4-hour warmup.
`;

const result = await parseTextToProcessGraph(description);
// result.processGraph contains:
// - Stations with process time distributions
// - Rework loop (Inspection → Machining @ 10%)
// - Resource pool (5 operators)
// - Proper run configuration
```

### Example 3: With Material Handling

```typescript
const description = `
  Conveyor C1: 30 feet at 4 ft/s, accumulating, capacity 10
  Connects Printing to Placement (25 feet)

  AGV system:
  - 3 vehicles, 5 ft/s, capacity 2 parts each
  - Network nodes: N1, N2, N3, N4
  - Edges: N1-N2 (50 ft), N2-N3 (40 ft), N3-N4 (30 ft)
`;

const result = await parseTextToProcessGraph(description);
// result.processGraph.routes contains:
// - Transport type: conveyor
// - Segment configuration
// - AGV system configuration
```

### Example 4: With Shifts & Calendars

```typescript
const description = `
  Day shift: Monday-Friday, 8:00-16:00
  Breaks:
  - 10:00 for 15 minutes
  - 12:00 for 30 minutes

  Holidays: 2025-01-01, 2025-07-04, 2025-12-25
`;

const result = await parseTextToProcessGraph(description);
// result.processGraph.calendars contains:
// - Shift blocks for each day
// - Break periods
// - Holiday dates
```

### Example 5: With Experiments

```typescript
const description = `
  Baseline: 2 Placement machines

  Experiments to test:
  1. Add 1 Placement machine (count = 3)
  2. Reduce cycle time by 20% (multiply by 0.8)

  Measure: throughput, utilization
`;

const result = await parseTextToProcessGraph(description);
// result.processGraph.experiments contains:
// - Experiment definitions
// - Change operations (set, add, multiply)
// - KPIs to track
```

---

## ProcessGraph Schema

### Core Structure

```typescript
interface ProcessGraph {
  entities: Entity[];
  arrivals: Arrival[];
  stations: Station[];
  routes: Route[];
  resources?: ResourcePool[];
  calendars?: Calendar[];
  experiments?: Experiment[];
  runConfig: RunConfig;
  metadata: Metadata;
}
```

### Distributions

All time-related values use distributions:

```typescript
type Distribution =
  | { type: 'constant'; params: { value: number }; units: 'minutes' }
  | { type: 'normal'; params: { mean: number; stdev: number }; units: 'minutes' }
  | { type: 'exponential'; params: { mean: number }; units: 'minutes' }
  | { type: 'triangular'; params: { min: number; mode: number; max: number }; units: 'minutes' }
  | { type: 'uniform'; params: { min: number; max: number }; units: 'minutes' }
  | { type: 'lognormal'; params: { mu: number; sigma: number }; units: 'minutes' }
  | { type: 'gamma'; params: { shape: number; scale: number }; units: 'minutes' }
  | { type: 'weibull'; params: { shape: number; scale: number }; units: 'minutes' }
  | { type: 'erlang'; params: { k: number; rate: number }; units: 'minutes' }
  | { type: 'empirical'; params: { values: number[]; weights?: number[] }; units: 'minutes' };
```

### Validation Rules

✅ **Distribution params**: Must be positive, ordered correctly (min ≤ mode ≤ max)
✅ **Route probabilities**: Must sum to 1.0 (±1e-6) for each source station
✅ **References**: All referenced stations, resources, calendars must exist
✅ **Rework targets**: Must reference existing stations
✅ **Run config**: warmup < runLength, replications ≥ 1
✅ **Time format**: HH:MM (00:00 to 23:59)

---

## Validation & Repair

### How Validation Works

1. **Schema validation** - Zod checks types, required fields, ranges
2. **Cross-reference checks** - Ensures routes reference existing stations
3. **Probability validation** - Checks branch probabilities sum to 1.0
4. **Distribution validation** - Checks parameter ordering and positivity

### Self-Repair Process

If validation fails:

1. **Extract errors** - Collect all validation errors
2. **Generate repair prompt** - Create specific instructions for LLM
3. **Call LLM** - Ask LLM to fix the errors
4. **Re-validate** - Check if repaired graph is now valid
5. **Repeat** - Up to `maxRepairAttempts` times

Example repair prompt:
```
VALIDATION ERRORS:
- routes: Routes from 'Machining' have probabilities summing to 1.2, expected 1.0
- stations: Triangular distribution mode must be <= max

INSTRUCTIONS:
1. Normalize route probabilities to sum to 1.0
2. Fix triangular distribution parameter ordering
3. Return corrected JSON
```

### Handling Missing Information

If information is missing:
- **Do NOT fabricate** - Leave field empty
- **Document in metadata.missing** - Track what's unknown
- **Suggest defaults** - Use industry-standard defaults where appropriate

Example:
```json
{
  "metadata": {
    "missing": [
      "conveyor_speed_C2",
      "shift_schedule_weekend"
    ],
    "assumptions": [
      "Assumed FIFO queue discipline where not specified",
      "Assumed 24x7 operation (no calendar given)"
    ]
  }
}
```

---

## Integration with Platform

### Step-by-Step Integration

```typescript
import { parseTextToProcessGraph } from './src/services/desParser';
import { SimioDestroyerPlatform } from './platform';

// 1. Parse specification
const result = await parseTextToProcessGraph(description);

if (!result.success) {
  throw new Error(result.error);
}

const graph = result.processGraph!;

// 2. Create platform instance
const platform = new SimioDestroyerPlatform({
  enable3D: true,
  enableMaterialHandling: graph.routes.some(r => r.transport),
  enableFailures: graph.stations.some(s => s.downtime),
  enableShifts: (graph.calendars?.length || 0) > 0
});

// 3. Configure entities
graph.entities.forEach(entity => {
  platform.addEntityType(entity.id, entity.class);
});

// 4. Configure arrivals
graph.arrivals.forEach(arrival => {
  if (arrival.policy === 'poisson') {
    arrival.windows.forEach(window => {
      platform.addArrival(window.start, window.end, window.rate);
    });
  }
});

// 5. Configure stations
graph.stations.forEach(station => {
  platform.addStation(station.id, {
    kind: station.kind,
    count: station.count,
    capacity: station.capacity,
    processTime: station.processTime,
    queue: station.queue
  });
});

// 6. Configure routes
graph.routes.forEach(route => {
  platform.addRoute(route.from, route.to, route.probability);
});

// 7. Configure resources
graph.resources?.forEach(resource => {
  platform.addResourcePool(resource.id, resource.type, resource.count);
});

// 8. Run simulation
const results = platform.run(
  graph.runConfig.runLength_min,
  graph.runConfig.replications,
  graph.runConfig.warmup_min
);

console.log('Results:', results);
```

---

## Advanced Features

### Setup Configurations

**Cadence Setup** (every N parts):
```typescript
{
  mode: 'cadence',
  cadence: {
    every_n: 20,
    time: { type: 'constant', params: { value: 15 }, units: 'minutes' }
  }
}
```

**Class-Based Setup**:
```typescript
{
  mode: 'class_based',
  class_based: {
    matrix: {
      'A': { 'A': {...}, 'B': {...} },
      'B': { 'A': {...}, 'B': {...} }
    }
  }
}
```

### Downtime/Failures

```typescript
{
  type: 'time_based',
  mtbf: { type: 'exponential', params: { mean: 480 }, units: 'minutes' },
  mttr: { type: 'triangular', params: { min: 30, mode: 45, max: 90 }, units: 'minutes' }
}
```

### BOM/Assembly

```typescript
{
  kind: 'assembly',
  bom: [
    { entity_id: 'PartA', quantity: 2 },
    { entity_id: 'PartB', quantity: 1 }
  ],
  assembly_time: { type: 'normal', params: { mean: 20, stdev: 3 }, units: 'minutes' }
}
```

---

## Troubleshooting

### Common Errors

**Error**: "min must be <= mode"
**Solution**: Check triangular distribution parameters

**Error**: "Routes from 'X' sum to 1.2"
**Solution**: Normalize probabilities to sum to 1.0

**Error**: "Rework target 'Y' does not exist"
**Solution**: Ensure rework.to references a valid station ID

**Error**: "warmup_min must be < runLength_min"
**Solution**: Set warmup period less than total run length

### Debugging Tips

1. **Enable logging**: Set `enableLogging: true` in parser config
2. **Check metadata**: Look at `metadata.missing` and `metadata.assumptions`
3. **Validate manually**: Use `validateProcessGraph()` directly
4. **Inspect validation errors**: Check `validation.errors` array
5. **Test distributions**: Use `validateDistribution()` on each distribution

---

## API Reference

### DESParser Class

```typescript
class DESParser {
  constructor(config?: Partial<ParserConfig>);

  parseText(text: string): Promise<ParserResult>;
  parseDocument(filePath: string): Promise<ParserResult>;
}
```

### Convenience Functions

```typescript
parseTextToProcessGraph(text: string): Promise<ParserResult>
parseDocumentToProcessGraph(filePath: string): Promise<ParserResult>
createParser(config: Partial<ParserConfig>): DESParser
```

### Validation

```typescript
validateProcessGraph(graph: unknown): ValidationResult
parseProcessGraph(data: unknown): ProcessGraph  // throws on error
safeParseProcessGraph(data: unknown): SafeParseReturnType
```

### Normalization

```typescript
normalizeTime(value: number, unit: string): number
normalizeDistance(value: number, unit: string): number
normalizeSpeed(value: number, unit: string): number
normalizeRate(value: number, unit: string): number
validateDistribution(dist: Distribution): { valid: boolean; error?: string }
validateProbabilities(probs: number[]): boolean
normalizeProbabilities(probs: number[]): number[]
```

---

## Best Practices

### Writing Good Specifications

✅ **Be explicit**: "20 per hour" not "busy"
✅ **Include units**: "10 minutes" not "10"
✅ **Specify distributions**: "Triangular(8,10,12)" not "around 10"
✅ **Define all stations**: Don't skip intermediate buffers
✅ **Specify probabilities**: "30% rework" not "some rework"

### Example: Good vs Bad

❌ **Bad**:
```
Parts come in frequently.
Machine takes a while.
Sometimes breaks.
```

✅ **Good**:
```
Parts arrive at 30 per hour (Poisson).
Machine processes parts in Normal(10, 1.5) minutes.
Machine fails every 480 minutes (exponential) and takes Triangular(30, 45, 90) minutes to repair.
```

---

## Summary

The DES Parser System provides:

1. ✅ **Comprehensive extraction** of all DES components
2. ✅ **Strict validation** with self-repair logic
3. ✅ **Type-safe** TypeScript implementation
4. ✅ **Unit normalization** to canonical forms
5. ✅ **Document support** (PDF, DOCX, TXT, MD)
6. ✅ **Platform integration** ready

**Result**: Production-ready simulation models from natural language!

---

## License

MIT

---

## Contributing

See CONTRIBUTING.md for guidelines.

---

## Support

For issues or questions:
- GitHub Issues: [github.com/yourorg/simio-destroyer/issues](https://github.com)
- Documentation: [docs.simio-destroyer.com](https://docs.simio-destroyer.com)
- Discord: [discord.gg/simio-destroyer](https://discord.gg)
