# 🏭 Development Guidelines - General Intelligence for Manufacturing

## Project Overview
This project implements an AI-native discrete event simulation platform that transforms natural language documents into executable simulations using GPT-4o and a custom-built industrial-grade DES kernel.

---

## 🎯 Core Engineering Standards

### Mathematical Rigor
This is a **discrete event simulation engine** - mathematical correctness is non-negotiable.

**Conservation Laws Must Hold:**
```
Entities Created = Entities Departed + Entities In System
Total Time = Wait Time + Processing Time + Travel Time
Resource Utilization = Busy Time / Total Simulation Time
```

**Statistical Validity:**
- Use Welford's algorithm for online variance calculation
- Maintain independent random number streams
- Validate against queueing theory (M/M/1, M/M/c)
- Sample size ≥ 30 for confidence intervals

---

## 📁 Project Structure

```
simiodestroyer/
├── des-engine/              # Pure DES validation & testing
│   └── validation/          # Mathematical correctness tests
├── factory-sim/             # Main application
│   ├── src/
│   │   ├── des-core/        # ⚠️ CRITICAL - Simulation kernel
│   │   │   ├── IndustrialDESKernel.ts
│   │   │   ├── IndustrialSimulationAdapter.ts
│   │   │   ├── BinaryHeap.ts
│   │   │   ├── MersenneTwister.ts
│   │   │   └── Statistics.ts
│   │   ├── components/      # React UI components
│   │   ├── pages/           # Main application pages
│   │   ├── styles/          # CSS and themes
│   │   └── types/           # TypeScript type definitions
│   └── electron/            # Electron main process
└── .cursorrules            # AI assistant guidelines
```

---

## 🔒 Critical Code Zones

### 🚨 TIER 1: MATHEMATICAL CORE (Highest Scrutiny)
Changes require mathematical validation and testing:
- `des-core/IndustrialDESKernel.ts` - Event calendar, entity lifecycle, resource management
- `des-core/BinaryHeap.ts` - Priority queue (O(log n) operations)
- `des-core/MersenneTwister.ts` - Random number generation
- `des-core/Statistics.ts` - Statistical collection algorithms

**Before ANY change:**
1. Verify mathematical correctness
2. Run validation tests
3. Check conservation laws
4. Validate against theoretical models

### ⚠️ TIER 2: SIMULATION LOGIC (High Scrutiny)
- `des-core/IndustrialSimulationAdapter.ts` - AI model → DES translation
- `electron/entityExtractor.ts` - GPT-4o extraction prompts
- `electron/simulation/SystemToDESMapper.ts` - System conversion

**Before changes:**
1. Validate input/output schemas
2. Test edge cases (null, empty, invalid)
3. Verify error handling
4. Check logging completeness

### 📊 TIER 3: UI/VISUALIZATION (Moderate Scrutiny)
- `components/AnimatedSimulationCanvas.tsx` - Real-time visualization
- `pages/DocumentExtraction.tsx` - Main UI flow
- `styles/*` - Visual design

**Standards:**
1. Type safety maintained
2. Error boundaries present
3. Loading states handled
4. User feedback clear

---

## ✅ Code Quality Checklist

### Every Function Must Have:

```typescript
/**
 * [One-line description of what function does]
 * 
 * Mathematical basis: [If applicable - e.g., "Uses exponential distribution with rate λ"]
 * 
 * @param paramName - Description with constraints (e.g., "Rate λ > 0, typically 0.1-10 per minute")
 * @returns Description of return value and its meaning
 * @throws {ErrorType} When and why this error occurs
 * 
 * @example
 * const result = functionName(validInput);
 * // Expected: result.success === true
 */
export function functionName(
  paramName: TypeWithConstraints
): StronglyTypedReturn {
  // 1. VALIDATION - First line of defense
  validateInput(paramName);
  
  // 2. OPERATION - Core logic with error handling
  try {
    const result = performOperation(paramName);
    
    // 3. POST-VALIDATION - Verify output integrity
    validateOutput(result);
    
    return result;
  } catch (error) {
    // 4. ERROR LOGGING - Never fail silently
    console.error('[functionName] Operation failed', {
      error: error.message,
      input: paramName,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}
```

### Input Validation Pattern:

```typescript
function validateEntityArrival(arrival: any): void {
  // Existence checks
  if (!arrival) throw new ValidationError('Arrival data required');
  if (!arrival.entityType) throw new ValidationError('Entity type required');
  
  // Type checks
  if (typeof arrival.entityType !== 'string') {
    throw new TypeError(`entityType must be string, got ${typeof arrival.entityType}`);
  }
  
  // Range checks
  if (arrival.rate <= 0) {
    throw new RangeError(`Arrival rate must be positive, got ${arrival.rate}`);
  }
  if (arrival.rate > 1000) {
    throw new RangeError(`Arrival rate suspiciously high: ${arrival.rate}/min`);
  }
  
  // Mathematical consistency
  if (arrival.interarrivalTime && arrival.rate) {
    const expectedRate = 1 / arrival.interarrivalTime;
    if (Math.abs(arrival.rate - expectedRate) > 0.01) {
      console.warn('[Validation] Rate and interarrival time inconsistent', {
        rate: arrival.rate,
        interarrivalTime: arrival.interarrivalTime,
        expected: expectedRate
      });
    }
  }
}
```

---

## 🧪 Testing Requirements

### DES Kernel Tests (Mandatory)
Located in `des-engine/validation/`:

```bash
# Run all validation tests
cd des-engine
npm test

# Expected: All tests pass
# - Binary heap operations
# - Random number quality (chi-square, runs test)
# - Distribution sampling
# - M/M/1 queue validation
# - M/M/c queue validation
```

**Validation Criteria:**
- M/M/1 theoretical values within 5% of simulated
- Chi-square test p-value > 0.05 for RNG
- Runs test confirms independence
- Conservation laws hold exactly (no tolerance)

### Manual Testing Checklist:

#### Document Upload Flow:
- [ ] PDF uploads correctly
- [ ] Word (.docx) uploads correctly
- [ ] Text files upload correctly
- [ ] Large files (>1MB) handled
- [ ] Invalid files rejected gracefully
- [ ] Error messages are clear

#### AI Extraction:
- [ ] GPT-4o returns valid JSON
- [ ] All required fields present
- [ ] Invalid extractions handled
- [ ] Token usage displayed
- [ ] Extraction time reasonable (<30s)

#### Simulation Execution:
- [ ] Entities created at correct rate
- [ ] Resources utilized properly
- [ ] Statistics update in real-time
- [ ] Conservation laws hold
- [ ] Simulation completes successfully
- [ ] No memory leaks over long runs

#### Visualization:
- [ ] Entities animate smoothly
- [ ] Resource states update correctly
- [ ] Zoom/pan works
- [ ] Speed controls effective
- [ ] No frame drops at 60 FPS
- [ ] Heat maps display properly

---

## 🐛 Debugging Guidelines

### Logging Conventions:

```typescript
// Component-level logging
console.log('[ComponentName:functionName] Message', {
  relevantData: value,
  timestamp: new Date().toISOString()
});

// DES kernel logging (performance-critical)
if (DEBUG_MODE) {
  console.log('[Kernel:scheduleEvent]', {
    time: event.time,
    type: event.type,
    entityId: event.entityId
  });
}

// Error logging (always enabled)
console.error('[ComponentName] Critical error', {
  error: error.message,
  stack: error.stack,
  context: { /* relevant state */ },
  timestamp: new Date().toISOString()
});
```

### Common Issues & Solutions:

#### "Simulation time not advancing"
**Root cause:** Event calendar empty or events not being scheduled
**Debug:**
```typescript
console.log('[Debug] Event calendar size:', kernel.getEventCount());
console.log('[Debug] Next event:', kernel.peekNextEvent());
console.log('[Debug] Current time:', kernel.getCurrentTime());
```

#### "Entities not flowing through system"
**Root cause:** Process sequence parsing error or routing logic issue
**Debug:**
```typescript
console.log('[Debug] Process flows:', Array.from(processFlows.entries()));
console.log('[Debug] Entity current stage:', entityCurrentStage.get(entityId));
console.log('[Debug] Resource queue:', resource.queue);
```

#### "Conservation law violation"
**Root cause:** Entity lost during state transition or departure not recorded
**Debug:**
```typescript
const created = kernel.getStatistics().entitiesCreated;
const departed = kernel.getStatistics().entitiesDeparted;
const inSystem = kernel.getEntitiesInSystem();
console.assert(created === departed + inSystem, 'Conservation law violated!');
```

---

## 🔄 Git Workflow

### Commit Message Format:
```
type(scope): brief description

- Detailed change 1
- Detailed change 2
- Mathematical validation status

Fixes #issue-number (if applicable)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructure (no behavior change)
- `perf`: Performance improvement
- `test`: Add/update tests
- `docs`: Documentation only
- `style`: Visual/UI changes (not code style)
- `chore`: Maintenance tasks

**Examples:**
```
feat(des-core): Add preemptive resource scheduling

- Implemented priority-based preemption in IndustrialDESKernel
- Added preemption event type to event calendar
- Updated resource management to handle interrupted service
- Validated against preemptive M/M/1 theoretical model (within 3%)

fix(adapter): Handle empty process sequences gracefully

- Added validation for empty process.steps arrays
- Fallback to default single-stage process
- Warning logged when using fallback
- No longer crashes on malformed AI extraction

refactor(statistics): Extract Welford's algorithm to utility

- Moved online variance calculation to Statistics.ts
- No behavior change, improved reusability
- All existing tests still pass
```

### Branch Strategy:
- `main` - Production-ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `refactor/*` - Code improvements

**Never commit:**
- `.env` files (secrets)
- `node_modules/`
- `dist/` or `build/` directories
- Personal API keys
- Large binary files (>50MB)

---

## 🚀 Performance Guidelines

### DES Kernel Performance Targets:
- **10,000 entities**: < 1 second simulation time
- **100,000 entities**: < 10 seconds simulation time
- **1,000,000 entities**: < 2 minutes simulation time

### Optimization Rules:
1. **Measure First**: Use `performance.now()` to identify bottlenecks
2. **Big-O Matters**: Maintain O(log n) event operations
3. **Avoid Premature Optimization**: Correctness before speed
4. **Cache Wisely**: Memoize expensive calculations when stable

### Known Performance Considerations:
- Binary heap operations are O(log n) - do not replace with array sorting
- RNG operations are fast - do not cache random values
- Statistics collection is O(1) with Welford's algorithm
- Entity lookup by ID uses Map - O(1) average case

---

## 🛡️ Security & Privacy

### API Key Management:
- Store in `.env` file (gitignored)
- Never log API keys
- Use environment variables only
- Rotate keys periodically

### User Data:
- Document content sent to OpenAI API
- No persistent storage of user documents
- Clear upload data on reset
- Inform users about AI processing

---

## 📚 Key Resources

### DES Theory:
- **Queueing Theory**: M/M/1, M/M/c models
- **Event-Driven Simulation**: Calendar-based advancement
- **Random Variate Generation**: Inverse transform method
- **Statistical Analysis**: Welford's algorithm, batch means

### Code References:
- Simio Reference Guide
- Arena Simulation Software documentation
- SimPy documentation (Python, but good DES concepts)

### Mathematical Validation:
- `des-engine/validation/` - Our test suite
- Queueing theory textbooks for theoretical values

---

## 🆘 Getting Help

### Internal:
1. Check this document
2. Review `.cursorrules` for AI assistant guidance
3. Examine existing test cases in `des-engine/validation/`
4. Read inline documentation in critical files

### External:
1. Queueing theory: Search for M/M/c formulas
2. TypeScript: Official documentation
3. React: Official documentation
4. Electron: Official guides

---

## ✨ Final Principles

1. **Correctness > Speed**: A slow correct simulation is better than a fast wrong one
2. **Clarity > Cleverness**: Code is read 10x more than written
3. **Validation > Assumption**: Never assume, always validate
4. **Graceful > Silent**: Fail loudly with context, not silently
5. **Tested > Untested**: Mathematical correctness requires validation

---

**Remember: This is simulation software used for decision-making. Bugs don't just break code - they lead to wrong conclusions.**

**Write code as if a factory's entire operations depend on its correctness. Because one day, they might.**

---

Last Updated: 2025-10-13

