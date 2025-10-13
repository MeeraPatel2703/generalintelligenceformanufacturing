# 🛡️ Validation System Documentation

## Overview

The validation system enforces mathematical correctness, type safety, and DES-specific constraints across the entire simulation pipeline. All critical functions should use these validators before processing data.

---

## Quick Start

```typescript
import {
  validateEntity,
  validateResource,
  validateDistribution,
  validateArrivalRate,
  validateConservationLaw,
  ValidationError,
  MathematicalError
} from './validation';

// Validate before processing
try {
  validateEntity(entityData);
  validateArrivalRate(arrivalRate);
  // Safe to proceed
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message, 'Field:', error.field);
  }
  // Handle error appropriately
}
```

---

## Error Types

### `ValidationError`
**When**: Input data fails basic validation (type, existence, range)  
**Properties**: `message`, `field`, `value`  
**Example**: Missing required field, wrong type, out of range

### `MathematicalError`
**When**: DES mathematical constraints violated  
**Properties**: `message`, `context`  
**Example**: Time going backwards, negative probability

### `ConservationLawError` (extends `MathematicalError`)
**When**: Entity conservation law violated  
**Properties**: `message`, `context` (entities created/departed/in system)  
**Example**: Entities created ≠ departed + in system

---

## Core Validators

### Basic Type Validation

#### `validateExists(value, fieldName)`
Checks that value is not null or undefined.

```typescript
validateExists(entity.id, 'entity.id');
// Throws if entity.id is null or undefined
```

#### `validateType(value, expectedType, fieldName)`
Verifies JavaScript type matches expected.

```typescript
validateType(entity.name, 'string', 'entity.name');
// Throws if entity.name is not a string
```

#### `validateRange(value, min, max, fieldName)`
Ensures number is within inclusive range [min, max].

```typescript
validateRange(utilization, 0, 1, 'utilization');
// Throws if utilization < 0 or > 1
```

#### `validatePositive(value, fieldName)`
Requires number to be > 0.

```typescript
validatePositive(arrivalRate, 'arrivalRate');
// Throws if arrivalRate ≤ 0
```

#### `validateNonNegative(value, fieldName)`
Requires number to be ≥ 0.

```typescript
validateNonNegative(waitTime, 'waitTime');
// Throws if waitTime < 0
```

#### `validatePattern(value, pattern, fieldName)`
Checks string against regex pattern.

```typescript
validatePattern(entityId, /^entity_[a-z]+_\d+$/, 'entityId');
// Throws if entityId doesn't match format
```

#### `validateNonEmptyArray(value, fieldName)`
Ensures array exists and has at least one element.

```typescript
validateNonEmptyArray(process.steps, 'process.steps');
// Throws if steps is empty or not an array
```

---

## DES-Specific Validators

### Entity Validation

#### `validateEntityId(entityId)`
Validates entity ID format: `entity_<type>_<number>`

```typescript
validateEntityId('entity_part_1');  // ✅ Pass
validateEntityId('part1');          // ❌ Fail - wrong format
```

#### `validateEntity(entity)`
Comprehensive entity object validation:
- ID format
- Type exists and is string
- State exists
- All time values are non-negative

```typescript
validateEntity({
  id: 'entity_part_1',
  type: 'Part',
  state: 'WAITING',
  creationTime: 0,
  totalWaitTime: 5.2,
  totalProcessingTime: 3.1,
  totalTravelTime: 0.5
});
```

#### `validateEntityTiming(totalTime, waitTime, processingTime, travelTime, tolerance?)`
Ensures timing statistics are consistent:  
`totalTime = waitTime + processingTime + travelTime` (within tolerance)

```typescript
validateEntityTiming(8.8, 5.2, 3.1, 0.5);  // ✅ Pass (8.8 = 5.2 + 3.1 + 0.5)
validateEntityTiming(10.0, 5.2, 3.1, 0.5); // ❌ Fail - doesn't sum correctly
```

### Resource Validation

#### `validateResourceId(resourceId)`
Validates resource ID format: `resource_<number>`

```typescript
validateResourceId('resource_0');  // ✅ Pass
validateResourceId('machine1');    // ❌ Fail - wrong format
```

#### `validateCapacity(capacity)`
Ensures capacity is positive integer.

```typescript
validateCapacity(5);    // ✅ Pass
validateCapacity(5.5);  // ❌ Fail - not integer
validateCapacity(0);    // ❌ Fail - not positive
```

#### `validateResourceLoad(currentLoad, capacity)`
Verifies resource not overloaded: `currentLoad ≤ capacity`

```typescript
validateResourceLoad(3, 5);  // ✅ Pass
validateResourceLoad(6, 5);  // ❌ Fail - overloaded!
```

#### `validateResource(resource)`
Comprehensive resource object validation:
- ID format
- Name exists
- Capacity is valid
- Current load ≤ capacity
- Queue and inService are arrays

```typescript
validateResource({
  id: 'resource_0',
  name: 'Assembly Station',
  capacity: 2,
  currentLoad: 1,
  queue: ['entity_part_1'],
  inService: ['entity_part_2']
});
```

### Rate & Time Validation

#### `validateArrivalRate(rate)`
Validates arrival rate λ:
- Must be positive
- Warning if > 1000 per minute (suspicious)

```typescript
validateArrivalRate(5);     // ✅ Pass
validateArrivalRate(0);     // ❌ Fail - not positive
validateArrivalRate(2000);  // ⚠️ Pass with warning
```

#### `validateServiceRate(serviceRate, arrivalRate?)`
Validates service rate μ:
- Must be positive
- Warning if μ ≤ λ (unstable system)

```typescript
validateServiceRate(10, 5);  // ✅ Pass (stable: 10 > 5)
validateServiceRate(5, 10);  // ⚠️ Pass with warning (unstable)
```

#### `validateSimulationTime(newTime, currentTime, fieldName?)`
Ensures time is non-negative and non-decreasing.

```typescript
validateSimulationTime(10.5, 10.0);  // ✅ Pass (time advances)
validateSimulationTime(9.0, 10.0);   // ❌ Fail - time going backwards!
```

#### `validateEventTime(eventTime, currentTime)`
Verifies event scheduled in future: `eventTime ≥ currentTime`

```typescript
validateEventTime(15.0, 10.0);  // ✅ Pass
validateEventTime(5.0, 10.0);   // ❌ Fail - event in past!
```

### Probability Validation

#### `validateProbability(probability, fieldName?)`
Ensures probability in range [0, 1].

```typescript
validateProbability(0.75);   // ✅ Pass
validateProbability(1.5);    // ❌ Fail - > 1
validateProbability(-0.1);   // ❌ Fail - < 0
```

#### `validateProbabilityDistribution(probabilities)`
Validates discrete probability distribution:
- All values in [0, 1]
- Sum equals 1.0 (within tolerance 0.0001)

```typescript
validateProbabilityDistribution([0.25, 0.5, 0.25]);  // ✅ Pass (sums to 1.0)
validateProbabilityDistribution([0.3, 0.4, 0.2]);    // ❌ Fail (sums to 0.9)
```

### Distribution Validation

#### `validateDistribution(distribution)`
Comprehensive distribution parameter validation.

**Supported Types:**

**Constant/Fixed/Deterministic:**
```typescript
validateDistribution({
  type: 'constant',
  parameters: { value: 5.0 }  // Must be non-negative
});
```

**Exponential:**
```typescript
validateDistribution({
  type: 'exponential',
  parameters: { rate: 2.0 }  // Rate > 0 (or mean > 0)
});
```

**Uniform:**
```typescript
validateDistribution({
  type: 'uniform',
  parameters: { min: 2.0, max: 8.0 }  // min < max, both ≥ 0
});
```

**Triangular:**
```typescript
validateDistribution({
  type: 'triangular',
  parameters: { min: 1.0, mode: 3.0, max: 5.0 }  // min ≤ mode ≤ max
});
```

**Normal:**
```typescript
validateDistribution({
  type: 'normal',
  parameters: { mean: 10.0, stdDev: 2.0 }  // stdDev > 0
});
```

**Empirical/Discrete:**
```typescript
validateDistribution({
  type: 'empirical',
  parameters: {
    values: [1, 2, 3],
    probabilities: [0.2, 0.5, 0.3]  // Must sum to 1.0
  }
});
```

### Conservation Law Validation

#### `validateConservationLaw(entitiesCreated, entitiesDeparted, entitiesInSystem)`
Verifies fundamental DES conservation law:  
**`entitiesCreated = entitiesDeparted + entitiesInSystem`**

```typescript
validateConservationLaw(100, 75, 25);  // ✅ Pass (100 = 75 + 25)
validateConservationLaw(100, 75, 30);  // ❌ Fail - 5 entities missing!
```

**⚠️ Call this periodically during simulation to detect entity leaks!**

---

## Utility Functions

### `sanitizeForLog(data)`
Removes sensitive/large fields before logging.

```typescript
const safeData = sanitizeForLog(userInput);
console.log('[Debug]', safeData);  // Won't log passwords or huge arrays
```

**Behavior:**
- Arrays > 10 elements → `Array(N)`
- Fields with 'password' or 'secret' → `[REDACTED]`
- Recursively processes objects

### `aggregateValidation(validations)`
Runs multiple validation functions and collects errors.

```typescript
const result = aggregateValidation([
  () => validateEntity(entity),
  () => validateResource(resource),
  () => validateConservationLaw(created, departed, inSystem)
]);

if (!result.valid) {
  console.error('Validation failed:', result.errors);
  return { success: false, errors: result.errors };
}
```

**Returns:**
```typescript
{
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

---

## Usage Patterns

### Pattern 1: Function Entry Validation

```typescript
export function scheduleEntityArrival(
  entityType: string,
  arrivalRate: number,
  startTime: number
): ScheduleResult {
  // VALIDATION BLOCK - First thing in every function
  try {
    validateExists(entityType, 'entityType');
    validateType(entityType, 'string', 'entityType');
    validateArrivalRate(arrivalRate);
    validateNonNegative(startTime, 'startTime');
  } catch (error) {
    console.error('[scheduleEntityArrival] Validation failed', {
      error: error.message,
      input: { entityType, arrivalRate, startTime }
    });
    throw error;
  }
  
  // Safe to proceed with operation
  // ...
}
```

### Pattern 2: Object Validation Before Processing

```typescript
export function processEntity(entityData: any): void {
  // Validate entire entity object
  try {
    validateEntity(entityData);
  } catch (error) {
    return {
      success: false,
      error: `Invalid entity: ${error.message}`
    };
  }
  
  // Entity is guaranteed valid
  // ...
}
```

### Pattern 3: Continuous Invariant Checking

```typescript
export class DESKernel {
  public step(): void {
    // Process event
    // ...
    
    // AFTER each event, verify invariants
    if (DEBUG_MODE) {
      try {
        validateConservationLaw(
          this.stats.entitiesCreated,
          this.stats.entitiesDeparted,
          this.entities.size
        );
      } catch (error) {
        console.error('[CRITICAL] Conservation law violated!', error);
        this.halt();  // Stop simulation immediately
      }
    }
  }
}
```

### Pattern 4: Batch Validation

```typescript
export function validateSimulationState(kernel: DESKernel): ValidationResult {
  return aggregateValidation([
    // Check all entities
    ...Array.from(kernel.getEntities()).map(entity => 
      () => validateEntity(entity)
    ),
    
    // Check all resources
    ...Array.from(kernel.getResources()).map(resource =>
      () => validateResource(resource)
    ),
    
    // Check conservation law
    () => validateConservationLaw(
      kernel.getStatistics().entitiesCreated,
      kernel.getStatistics().entitiesDeparted,
      kernel.getEntitiesInSystem()
    )
  ]);
}
```

---

## Performance Considerations

### When to Validate

**ALWAYS validate:**
- Function entry points (public APIs)
- User input
- AI-extracted data
- Before state transitions
- Before mathematical operations

**Can skip in:**
- Internal hot paths (after initial validation)
- Performance-critical loops (validate before loop, not inside)
- Pure calculation functions (validate inputs once)

### DEBUG_MODE Pattern

```typescript
// Validate aggressively in development
if (process.env.NODE_ENV === 'development') {
  validateConservationLaw(created, departed, inSystem);
}

// Or use global DEBUG flag
if (DEBUG_MODE) {
  validateEntityTiming(totalTime, waitTime, procTime, travelTime);
}
```

### Validation vs. Assertion

**Validation**: For external/user input, can be disabled in production
**Assertion**: For internal invariants, should always run

```typescript
// Validation (can be conditional)
if (VALIDATE_INPUT) {
  validateEntity(userProvidedEntity);
}

// Assertion (always run)
console.assert(
  this.currentLoad <= this.capacity,
  'Resource overload - this should never happen!'
);
```

---

## Testing Your Validators

```typescript
import { validateEntity, ValidationError } from './validation';

describe('Entity Validation', () => {
  it('should accept valid entity', () => {
    const validEntity = {
      id: 'entity_part_1',
      type: 'Part',
      state: 'WAITING',
      creationTime: 0,
      totalWaitTime: 5.0,
      totalProcessingTime: 3.0,
      totalTravelTime: 0.5
    };
    
    expect(() => validateEntity(validEntity)).not.toThrow();
  });
  
  it('should reject entity with invalid ID', () => {
    const invalidEntity = { ...validEntity, id: 'invalid' };
    
    expect(() => validateEntity(invalidEntity)).toThrow(ValidationError);
  });
  
  it('should reject entity with negative time', () => {
    const invalidEntity = { ...validEntity, totalWaitTime: -1 };
    
    expect(() => validateEntity(invalidEntity)).toThrow(ValidationError);
  });
});
```

---

## Error Handling Best Practices

```typescript
try {
  validateDistribution(userDistribution);
  const sample = sampleFromDistribution(userDistribution);
  // ...
} catch (error) {
  if (error instanceof ValidationError) {
    // User provided bad input - show friendly message
    return {
      success: false,
      userMessage: `Invalid ${error.field}: ${error.message}`,
      technical: error
    };
  } else if (error instanceof MathematicalError) {
    // Mathematical constraint violated - log and alert
    console.error('[CRITICAL] Mathematical error', error.context);
    alertDevelopers(error);
    return { success: false, error: 'System integrity error' };
  } else {
    // Unknown error - log everything
    console.error('[UNKNOWN ERROR]', error);
    throw error;
  }
}
```

---

## Checklist for Adding New Validators

When creating new DES-specific validators:

- [ ] Document mathematical basis (e.g., "Based on Little's Law")
- [ ] Include JSDoc with @param, @returns, @throws
- [ ] Provide usage example in docstring
- [ ] Handle edge cases (null, undefined, NaN, Infinity)
- [ ] Add range checks for numerical parameters
- [ ] Log warnings for suspicious but valid values
- [ ] Write unit tests (valid case + multiple invalid cases)
- [ ] Update this README with examples

---

## FAQ

**Q: Should I validate every single variable?**  
A: Validate at trust boundaries (user input, AI extraction, function entry). Internal trusted data can skip validation in hot paths.

**Q: What if validation is too slow?**  
A: Profile first. Most validators are microseconds. If proven slow, add DEBUG_MODE checks or validate once before loops.

**Q: Can I throw custom error types?**  
A: Yes! Extend `ValidationError` or `MathematicalError`. Update error handling accordingly.

**Q: Should I validate in TypeScript types or runtime?**  
A: Both! TypeScript catches static errors. Runtime validation catches dynamic errors (user input, AI output, JSON data).

**Q: What about async validation?**  
A: These validators are synchronous. For async (e.g., API calls), create separate async validators following same patterns.

---

## Related Documentation

- See `.cursorrules` for AI assistant validation guidelines
- See `DEVELOPMENT_GUIDELINES.md` for overall code quality standards
- See `des-engine/validation/` for mathematical validation tests

---

**Remember: Validation is not overhead - it's insurance. The cost of detecting bugs early is 100x cheaper than debugging production issues.**

