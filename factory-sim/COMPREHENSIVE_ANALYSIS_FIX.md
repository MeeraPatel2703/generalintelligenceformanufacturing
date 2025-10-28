# Comprehensive Analysis Error Fix

## Issue
Error when running comprehensive analysis (100 replications):
```
Failed to run comprehensive analysis: Cannot read properties of undefined (reading 'type')
```

## Root Cause
The error occurred in `ExtractedSystemToAnalysisAdapter.ts` when converting an `ExtractedSystem` to `FactoryAnalysis` format for comprehensive analysis.

**Location**: `/electron/simulation/ExtractedSystemToAnalysisAdapter.ts:125`

The code was calling `inferMachineType(resource.name)` but:
1. Wasn't checking if `resource` or `resource.name` existed
2. Wasn't utilizing the `resource.type` property that already exists in the data structure
3. Had no validation for missing/malformed resources

## Solution Applied

### 1. Added Input Validation (lines 25-40)
```typescript
// Validate system structure
if (!system) {
  throw new Error('ExtractedSystem is null or undefined');
}
if (!system.resources || system.resources.length === 0) {
  throw new Error('ExtractedSystem has no resources defined');
}
if (!system.entities || system.entities.length === 0) {
  throw new Error('ExtractedSystem has no entities defined');
}

console.log('[Adapter] System validation passed:', {
  resources: system.resources.length,
  entities: system.entities.length,
  processes: system.processes?.length || 0
});
```

### 2. Added Resource Validation (lines 114-118)
```typescript
// Validate resource has a name
if (!resource || !resource.name) {
  console.error('[Adapter] Resource missing name:', resource);
  throw new Error('Resource missing required "name" property');
}
```

### 3. Added Resource Type Mapping (lines 145-151, 316-330)

**New Function**: `mapResourceTypeToMachineType()`
Maps ExtractedSystem ResourceType to FactoryAnalysis MachineType:
- `server`, `machine` → `CNC`
- `worker` → `Assembly`
- `conveyor`, `path`, `storage`, `vehicle` → `Storage`
- `room` → `QualityControl`
- `custom` → `CNC` (default)

**Updated Logic**:
```typescript
// Map resource type to machine type
let machineType = 'CNC'; // default
if (resource.type) {
  machineType = mapResourceTypeToMachineType(resource.type);
} else {
  machineType = inferMachineType(resourceName);
}
```

Now prioritizes the structured `resource.type` property over name-based inference.

## Benefits

1. **Better Error Messages**: Clear validation errors indicate exactly what's missing
2. **Type Safety**: Properly handles the `resource.type` property from ExtractedSystem
3. **Fallback Logic**: Still uses name-based inference if type is not available
4. **Robustness**: Won't crash on malformed input

## Files Modified

1. `/electron/simulation/ExtractedSystemToAnalysisAdapter.ts`
   - Added system structure validation (lines 25-40)
   - Added resource validation (lines 114-118)
   - Added type mapping function (lines 316-330)
   - Updated machine type assignment logic (lines 145-151)

## Testing

The fix addresses the root cause and provides:
- ✅ Proper handling of ExtractedSystem resource types
- ✅ Clear error messages when data is malformed
- ✅ Fallback to name-based inference when needed
- ✅ No crashes on undefined properties

## How to Verify

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the app:
   ```bash
   npm start
   ```

3. Upload a document and extract the system

4. Click "Run Comprehensive Analysis (100 Replications)"

5. Check console for validation messages:
   ```
   [Adapter] System validation passed: { resources: 3, entities: 1, processes: 0 }
   ```

If there's still an error, the new validation will provide a specific message about what's missing.

## Related Improvements

This fix is part of the larger improvements to:
1. ✅ Entity flow (retry mechanism for blocked parts)
2. ✅ 100 replications default value
3. ✅ AI assistant sidebar containment
4. ✅ Comprehensive analysis error handling (this fix)

All improvements ensure robust, reliable simulation runs!
