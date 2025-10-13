# Discrete Event Simulation Engine

A working DES engine built from scratch with validated components.

## What Works

This is a **fully functional** discrete event simulation engine with:

### ✓ Core Components

1. **EventQueue** - Priority queue with FIFO tie-breaking
2. **M/M/1 Simulation** - Single server queue validated against analytical formulas
3. **M/M/c Simulation** - Multiple server queue with Erlang-C validation
4. **Replication Framework** - Statistical analysis with confidence intervals
5. **Distribution Library** - Exponential, Uniform, Triangular, Normal, Discrete
6. **Multi-Stage Routing** - Complex workflows with bottleneck analysis
7. **Snow Tubing Model** - Real-world application example

### Running Tests

```bash
npm install
npm run test:all          # Comprehensive test suite
npm run test:queue        # Event queue tests
npm run test:mm1          # M/M/1 validation
npm run test:replications # Replication framework
npm run test:mmc          # M/M/c validation
npm run test:distributions # Distribution tests
npm run test:multistage   # Multi-stage routing
npm run test:snowtubing   # Snow tubing model
```

### Validation Results

All components are **mathematically validated**:

- Event Queue: Maintains time order, handles ties correctly (FIFO)
- M/M/1: Matches queueing theory within 95% confidence intervals
- M/M/c: Validated against Erlang-C formulas
- Distributions: Verified mean/variance against theoretical values
- Multi-stage: Flow conservation verified, bottleneck detection working
- Snow Tubing: Handles complex arrival patterns and resource constraints

## Example Usage

### Simple M/M/1 Queue

```typescript
import { MM1Simulation } from './MM1Simulation';

const sim = new MM1Simulation(0.8, 1.0); // λ=0.8, μ=1.0
const results = sim.run(10000);

console.log(`Avg wait time: ${results.avgWaitTime.toFixed(2)}`);
// Expected: ~4.0 minutes (matches theory)
```

### Multiple Servers (M/M/c)

```typescript
import { MMcSimulation } from './MMcSimulation';

const sim = new MMcSimulation(2.5, 1.0, 3); // λ=2.5, μ=1.0, c=3
const results = sim.run(10000);

console.log(`Avg wait time: ${results.avgWaitTime.toFixed(2)}`);
// Validated against Erlang-C formula
```

### Statistical Replications

```typescript
import { SimulationRunner } from './SimulationRunner';
import { MM1Simulation } from './MM1Simulation';

const runner = new SimulationRunner();
const results = runner.runMultipleReplications(
  30,
  () => new MM1Simulation(0.8, 1.0),
  10000
);

console.log(`Mean: ${results.mean.toFixed(2)}`);
console.log(`95% CI: [${results.ci95Lower.toFixed(2)}, ${results.ci95Upper.toFixed(2)}]`);
```

### Multi-Stage System

```typescript
import { MultiStageSimulation } from './MultiStageSimulation';

const sim = new MultiStageSimulation(1.0, 100);

sim.addStation('Station 1', 2, () => 5.0);  // 2 servers, 5 min service
sim.addStation('Station 2', 1, () => 3.0);  // 1 server, 3 min service
sim.addStation('Station 3', 3, () => 4.0);  // 3 servers, 4 min service

const results = sim.run(200);

console.log(`Avg cycle time: ${results.avgCycleTime.toFixed(2)} min`);
results.stationStats.forEach(stat => {
  console.log(`${stat.name}: ${stat.avgWaitTime.toFixed(2)} min wait`);
});
```

### Custom Distributions

```typescript
import { Distributions } from './Distributions';

const dist = new Distributions();

// Exponential inter-arrival times
const interArrival = dist.exponential(5); // rate = 5/hour

// Triangular service times
const serviceTime = dist.triangular(20, 30, 45); // min, mode, max (seconds)

// Normal processing times
const processTime = dist.normal(100, 15); // mean=100, stdDev=15

// Discrete group sizes
const groupSize = dist.discrete([2,3,4,5,6], [0.15,0.20,0.35,0.20,0.10]);
```

## Architecture

### Event-Driven Simulation

The engine uses a **time-ordered event queue** to process discrete events:

1. Events are inserted with timestamps
2. Events are processed in chronological order
3. Processing events can schedule new events
4. Simulation continues until end time or queue is empty

### Key Design Decisions

- **Min-heap event queue** for O(log n) insert/extract
- **FIFO tie-breaking** for simultaneous events (deterministic behavior)
- **Generic resource modeling** (servers, queues, statistics)
- **Separation of concerns** (simulation logic vs. statistical analysis)

## What This Engine Does

✓ **Correctly simulates** discrete event systems
✓ **Validates against theory** (M/M/1, M/M/c, distributions)
✓ **Handles complex routing** (multi-stage, bottlenecks)
✓ **Provides statistical rigor** (replications, confidence intervals)
✓ **Supports various distributions** (exponential, uniform, triangular, normal, discrete)
✓ **Models real systems** (see snow tubing example)

## Files

- `EventQueue.ts` - Priority queue for time-ordered events
- `MM1Simulation.ts` - Single server queue
- `MMcSimulation.ts` - Multiple server queue
- `SimulationRunner.ts` - Replication framework
- `Distributions.ts` - Random variate generation
- `MultiStageSimulation.ts` - Multi-stage routing
- `SnowTubingSimulation.ts` - Real-world example
- `test-*.ts` - Comprehensive test suite

## Test Output

```
================================================================================
✓✓✓ ALL TESTS PASSED - DES ENGINE IS WORKING ✓✓✓
================================================================================

1. ✓ EventQueue class that maintains time order
2. ✓ M/M/1 simulation that matches analytical results
3. ✓ Multiple replication support with confidence intervals
4. ✓ M/M/c simulation (multiple servers)
5. ✓ Distribution library (Exponential, Uniform, Triangular, Normal)
6. ✓ Multi-stage routing
7. ✓ Simplified snow tubing model
```

## Next Steps

This engine provides the **foundation** for building more complex simulations:

- Add animation/visualization (now that core logic works)
- Build domain-specific models (manufacturing, healthcare, networks)
- Add warm-up period detection
- Implement variance reduction techniques
- Add input modeling and output analysis tools

**The core simulation engine is complete and validated.**
