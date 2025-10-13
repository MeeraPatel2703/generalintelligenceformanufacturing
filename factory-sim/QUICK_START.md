# Factory Sim - Quick Start Guide

## Installation & Running

```bash
# Install dependencies (if not already done)
npm install

# Build the application
npm run build:all

# Start the application
npm start
```

## Testing the Simulation

```bash
# Run the sledding simulation test
npx tsx test-des-clock.ts
```

Expected output: ✅ TEST PASSED with all entities completing their journey.

## Project Structure

```
factory-sim/
├── src/
│   ├── simulation/
│   │   └── DESEngine.ts          # Core DES simulation engine
│   └── components/               # React UI components
├── electron/
│   ├── main.ts                   # Electron main process (ES modules)
│   ├── preload.ts                # Electron preload (compiled to CommonJS)
│   └── simulation/               # Simulation runners and mappers
├── dist/                         # Frontend build output
├── dist-electron/                # Electron build output
│   └── electron/
│       ├── main.js               # Compiled main process
│       └── preload.cjs           # Compiled preload (CommonJS)
├── test-des-clock.ts             # Standalone test
├── TEST_SLEDDING.md              # Test documentation
└── VERSION_SUMMARY.md            # Comprehensive version summary
```

## Key Features

### 1. DES Simulation Engine
- Event-driven time advancement
- Resource management (capacity, queueing)
- Process modeling with distributions
- Multi-stage routing
- Complete statistics tracking

### 2. Electron Desktop App
- File upload (CSV, PDF, DOCX)
- AI-powered system extraction
- Interactive simulation configuration
- Real-time visualization
- Results export

### 3. Document Processing
- PDF parsing (pdf-parse v2.x)
- Word document parsing (mammoth)
- Text file support
- AI entity extraction via OpenAI

## Configuration Files

### tsconfig.node.json
Compiles main Electron process as ES2022 modules.

### tsconfig.preload.json
Compiles preload script as CommonJS (required by Electron).

### package.json
- "type": "module" - Enables ES modules
- Build scripts handle dual compilation

## Common Commands

```bash
# Full build (frontend + electron)
npm run build:all

# Build frontend only
npm run build:frontend

# Build electron only
npm run build:electron

# Type checking
npm run type-check

# Package application
npm run package:mac     # macOS
npm run package:win     # Windows
npm run package:linux   # Linux
```

## Troubleshooting

### Module Errors
If you see ERR_REQUIRE_ESM errors:
```bash
# Clean and rebuild
rm -rf dist/ dist-electron/
npm run build:all
```

### Preload Not Loading
Check that preload.cjs exists in dist-electron/electron/:
```bash
ls -la dist-electron/electron/preload.cjs
```

### Simulation Not Running
Verify the DES engine test passes:
```bash
npx tsx test-des-clock.ts
```

## Environment Variables

Create a .env file in the project root:
```env
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

These are required for AI-powered document analysis and system extraction.

## How the Simulation Works

### 1. Define Resources
```typescript
engine.addResource('lift', 'Ski Lift', 6);  // 6-person capacity
```

### 2. Define Processes
```typescript
engine.addProcess('lift-ride', 'Lift Ride', 'lift', {
  distribution: 'constant',
  params: { value: 5.0 }  // 5 minutes
}, 'next-process');  // Route to next process
```

### 3. Set Arrival Rate
```typescript
engine.setArrivalRate(0.2);  // 0.2 entities per minute
```

### 4. Run Simulation
```typescript
engine.setMaxSimTime(60);  // 60 minutes
engine.initialize();

while (engine.step()) {
  // Simulation runs step by step
}

const stats = engine.getStats();
// stats.totalEntitiesCreated
// stats.totalEntitiesDeparted
// stats.avgCycleTime
// stats.throughput
```

## Supported Distributions

- Constant: Fixed time
- Exponential: Memoryless (for arrivals)
- Uniform: Random between min and max
- Triangular: Three-point estimate
- Normal: Gaussian distribution
- Discrete: Specific probabilities

## Example Use Cases

1. Manufacturing: Model production lines with machines and buffers
2. Service Operations: Model customer queues and service counters
3. Healthcare: Model patient flow through emergency departments
4. Transportation: Model vehicle routing and traffic flow
5. Recreation: Model snow tubing, ski lifts, amusement parks

## Next Steps

1. Upload a document (PDF/DOCX) with your system description
2. Let AI extract entities, resources, and processes
3. Review and edit the extracted configuration
4. Run simulation with multiple replications
5. Analyze results and optimize your system

## Support

For issues or questions, refer to:
- VERSION_SUMMARY.md - Comprehensive technical documentation
- TEST_SLEDDING.md - Test results and validation
- Source code comments in src/simulation/DESEngine.ts

## Status

✅ PRODUCTION READY - October 13, 2025

All core functionality tested and verified:
- Simulation clock advances correctly
- Entities flow through system properly
- Resources and queuing work as expected
- Electron app loads without errors
- Document parsing functional
- End-to-end pipeline complete
