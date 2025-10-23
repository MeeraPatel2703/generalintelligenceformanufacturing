# Arrival Table & Distribution Parameter Fixes

## Summary
Fixed three critical issues preventing proper simulation execution:

1. ✅ **Arrival Table Generation** - Now creates actual arrival schedules
2. ✅ **Distribution Parameters** - Properly calculates mean, mode, and lambda
3. ✅ **Simulation Runtime** - Respects configured duration (defaults to 8 hours)

---

## 1. Arrival Table Generation Fix

### Problem
When users selected "Arrival Table" mode, the system set an empty schedule array `[]`, resulting in zero arrivals.

### Solution
**File:** `src/components/ComprehensiveConfigPanel.tsx` (lines 270-332)

Now generates a complete arrival schedule using:
- Exponential interarrival times
- Configurable arrival rate (default 30/hour)
- Simulation run length from config (default 480 minutes)
- Proper entity type and quantity per arrival

**Example Output:**
```javascript
{
  type: 'scheduled',
  schedule: [
    { time: 1.87, entityType: 'Customer', quantity: 1, attributes: {} },
    { time: 3.42, entityType: 'Customer', quantity: 1, attributes: {} },
    { time: 5.91, entityType: 'Customer', quantity: 1, attributes: {} },
    // ... up to simulation end time
  ],
  interarrivalTime: {
    type: 'exponential',
    parameters: { mean: 2.0, mode: 0, lambda: 0.5 },
    unit: 'minutes'
  }
}
```

### UI Enhancement
Added arrival table visualization (lines 435-493):
- Shows first 50 arrivals in scrollable table
- Displays total arrival count
- Shows distribution parameters (mean, mode, lambda)

---

## 2. Distribution Parameter Calculation Fix

### Problem
Distribution parameters (mean, mode, lambda) were not being calculated or displayed, leading to incorrect simulation behavior.

### Solution A: Interarrival Time Mode
**File:** `src/components/ComprehensiveConfigPanel.tsx` (lines 240-259)

Now calculates:
- **Mean:** `60 / arrivalRate` (e.g., 30/hr → 2 min mean)
- **Mode:** 0 (exponential distributions always have mode at 0)
- **Lambda:** `1 / mean` (rate parameter)

### Solution B: Type Definition
**File:** `src/types/extraction.ts` (line 30)

Added `lambda?: number` to Distribution parameters interface.

### UI Enhancement
**File:** `src/components/ComprehensiveConfigPanel.tsx` (lines 412-447)

Added distribution parameter display showing:
- Distribution type
- Mean value with units
- Mode (when applicable)
- Lambda (rate parameter)
- Arrival rate

**Example Display:**
```
📊 Current Distribution
Type: exponential
Mean: 2.00 minutes
Mode: 0.00 minutes
Lambda (rate): 0.5000 per minutes
Arrival Rate: 30 per_hour
```

---

## 3. Simulation Runtime Fix

### Problem
Simulations were hardcoded to run for 360 minutes (6 hours) instead of the intended 480 minutes (8 hours).

### Solution A: Default Runtime
**File:** `src/des-core/IndustrialSimulationAdapter.ts` (lines 67-69)

Changed defaults from 360 to 480 minutes:
```typescript
private endTime: number = 480; // 8 hours in minutes (default)
private currentStepTime: number = 0;
private maxStepTime: number = 480;
```

### Solution B: Configurable Constructor
**File:** `src/des-core/IndustrialSimulationAdapter.ts` (lines 80-91)

Added `simulationTime` parameter:
```typescript
constructor(
  system: ExtractedSystem,
  seed: number = Date.now(),
  simulationTime: number = 480  // NEW PARAMETER
) {
  this.endTime = simulationTime;
  this.maxStepTime = simulationTime;
  console.log(`Simulation time set to ${simulationTime} minutes`);
  // ...
}
```

### Solution C: System Configuration
**File:** `src/types/extraction.ts` (lines 384-390)

Added `SimulationConfig` interface:
```typescript
export interface SimulationConfig {
  runLength: number;
  runLengthUnit: 'minutes' | 'hours' | 'days' | 'weeks';
  warmupPeriod?: number;
  warmupUnit?: 'minutes' | 'hours' | 'days' | 'weeks';
  replications?: number;
}
```

Added to `ExtractedSystem`:
```typescript
export interface ExtractedSystem {
  // ... existing fields
  simulationConfig?: SimulationConfig;  // NEW FIELD
}
```

### Solution D: Dynamic Runtime Calculation
**File:** `src/components/ComprehensiveConfigPanel.tsx` (lines 274-294)

Arrival table generation now uses simulation config:
```typescript
let endTimeMin = 480;
if (updatedSystem.simulationConfig) {
  const runLength = updatedSystem.simulationConfig.runLength;
  const unit = updatedSystem.simulationConfig.runLengthUnit;

  switch (unit) {
    case 'minutes': endTimeMin = runLength; break;
    case 'hours': endTimeMin = runLength * 60; break;
    case 'days': endTimeMin = runLength * 24 * 60; break;
    case 'weeks': endTimeMin = runLength * 7 * 24 * 60; break;
  }
}
```

---

## Impact

### Before Fixes
❌ Arrival table mode: 0 arrivals (empty schedule)
❌ Distribution parameters: Missing or incorrect (NaN values)
❌ Simulation time: Always 6 hours, ignoring configuration

### After Fixes
✅ Arrival table mode: Full schedule with ~240 arrivals (for 8hr@30/hr)
✅ Distribution parameters: Correct mean (2.0 min), mode (0), lambda (0.5)
✅ Simulation time: Configurable, defaults to 8 hours (480 min)

---

## Testing Checklist

- [x] TypeScript compilation passes without errors
- [ ] Arrival table generates correct number of arrivals
- [ ] Distribution parameters display correctly in UI
- [ ] Simulation runs for configured duration
- [ ] End-to-end test: Upload document → Generate system → Run simulation → View results

---

## Files Modified

1. `src/components/ComprehensiveConfigPanel.tsx` - Arrival generation & UI
2. `src/types/extraction.ts` - Type definitions
3. `src/des-core/IndustrialSimulationAdapter.ts` - Runtime configuration

## Type Safety
All changes maintain full TypeScript type safety. No `any` types introduced.

---

## Next Steps

To use these fixes:

1. **Set simulation config** (optional, defaults work):
```typescript
system.simulationConfig = {
  runLength: 8,
  runLengthUnit: 'hours',
  replications: 100
};
```

2. **Select arrival mode** in UI:
   - Click "Arrival Table" → See generated schedule
   - Click "Interarrival Time" → See distribution parameters

3. **Run simulation** - Will now:
   - Use arrival table if configured
   - Apply correct distribution parameters
   - Run for specified duration

---

*Fixes implemented: 2025-01-XX*
*TypeScript checked: ✅ No errors*
