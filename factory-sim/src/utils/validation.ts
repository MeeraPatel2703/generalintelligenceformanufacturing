/**
 * VALIDATION UTILITIES
 * 
 * Centralized validation functions enforcing DES mathematical correctness
 * and input/output integrity across the simulation system.
 * 
 * Usage:
 * ```typescript
 * import { validateEntity, validateResource, ValidationError } from './utils/validation';
 * 
 * try {
 *   validateEntity(entityData);
 *   // Safe to proceed
 * } catch (error) {
 *   console.error('Validation failed:', error.message);
 * }
 * ```
 */

/* ============================================================================
   CUSTOM ERROR TYPES
   ============================================================================ */

export class ValidationError extends Error {
  constructor(message: string, public field?: string, public value?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class MathematicalError extends Error {
  constructor(message: string, public context?: any) {
    super(message);
    this.name = 'MathematicalError';
  }
}

export class ConservationLawError extends MathematicalError {
  constructor(message: string, context?: any) {
    super(message, context);
    this.name = 'ConservationLawError';
  }
}

/* ============================================================================
   BASIC TYPE VALIDATORS
   ============================================================================ */

/**
 * Validate that value exists (not null, not undefined)
 */
export function validateExists(value: any, fieldName: string): void {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} is required`, fieldName, value);
  }
}

/**
 * Validate type matches expected type
 */
export function validateType(value: any, expectedType: string, fieldName: string): void {
  const actualType = typeof value;
  if (actualType !== expectedType) {
    throw new ValidationError(
      `${fieldName} must be ${expectedType}, got ${actualType}`,
      fieldName,
      value
    );
  }
}

/**
 * Validate number is within range [min, max]
 */
export function validateRange(value: number, min: number, max: number, fieldName: string): void {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`, fieldName, value);
  }
  if (value < min || value > max) {
    throw new ValidationError(
      `${fieldName} must be in range [${min}, ${max}], got ${value}`,
      fieldName,
      value
    );
  }
}

/**
 * Validate number is positive (> 0)
 */
export function validatePositive(value: number, fieldName: string): void {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`, fieldName, value);
  }
  if (value <= 0) {
    throw new ValidationError(
      `${fieldName} must be positive, got ${value}`,
      fieldName,
      value
    );
  }
}

/**
 * Validate number is non-negative (≥ 0)
 */
export function validateNonNegative(value: number, fieldName: string): void {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`, fieldName, value);
  }
  if (value < 0) {
    throw new ValidationError(
      `${fieldName} must be non-negative, got ${value}`,
      fieldName,
      value
    );
  }
}

/**
 * Validate string matches regex pattern
 */
export function validatePattern(value: string, pattern: RegExp, fieldName: string): void {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName, value);
  }
  if (!pattern.test(value)) {
    throw new ValidationError(
      `${fieldName} does not match required pattern`,
      fieldName,
      value
    );
  }
}

/**
 * Validate array is not empty
 */
export function validateNonEmptyArray(value: any[], fieldName: string): void {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`, fieldName, value);
  }
  if (value.length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`, fieldName, value);
  }
}

/* ============================================================================
   DES-SPECIFIC VALIDATORS
   ============================================================================ */

/**
 * Validate entity ID format: entity_<type>_<number>
 */
export function validateEntityId(entityId: string): void {
  validateExists(entityId, 'entityId');
  validateType(entityId, 'string', 'entityId');
  validatePattern(entityId, /^entity_[a-zA-Z0-9_]+-\d+$/, 'entityId');
}

/**
 * Validate resource ID format: resource_<number>
 */
export function validateResourceId(resourceId: string): void {
  validateExists(resourceId, 'resourceId');
  validateType(resourceId, 'string', 'resourceId');
  validatePattern(resourceId, /^resource_\d+$/, 'resourceId');
}

/**
 * Validate arrival rate (λ)
 * Must be positive and reasonable (< 1000/min)
 */
export function validateArrivalRate(rate: number): void {
  validateExists(rate, 'arrivalRate');
  validatePositive(rate, 'arrivalRate');
  
  // Sanity check: More than 1000 arrivals per minute is suspicious
  if (rate > 1000) {
    console.warn('[Validation] Arrival rate unusually high:', rate, 'per minute');
  }
}

/**
 * Validate service rate (μ)
 * Must be positive and greater than arrival rate for stability
 */
export function validateServiceRate(serviceRate: number, arrivalRate?: number): void {
  validateExists(serviceRate, 'serviceRate');
  validatePositive(serviceRate, 'serviceRate');
  
  // Stability check: μ > λ for M/M/1 stability
  if (arrivalRate !== undefined && serviceRate <= arrivalRate) {
    console.warn('[Validation] System may be unstable: serviceRate ≤ arrivalRate', {
      serviceRate,
      arrivalRate,
      utilization: arrivalRate / serviceRate
    });
  }
}

/**
 * Validate resource capacity
 * Must be positive integer
 */
export function validateCapacity(capacity: number): void {
  validateExists(capacity, 'capacity');
  validateType(capacity, 'number', 'capacity');
  
  if (!Number.isInteger(capacity)) {
    throw new ValidationError('capacity must be an integer', 'capacity', capacity);
  }
  
  validatePositive(capacity, 'capacity');
  
  // Sanity check: Capacity > 1000 is unusual
  if (capacity > 1000) {
    console.warn('[Validation] Resource capacity unusually high:', capacity);
  }
}

/**
 * Validate resource utilization
 * Must be in range [0, 1]
 */
export function validateUtilization(utilization: number): void {
  validateExists(utilization, 'utilization');
  validateRange(utilization, 0, 1, 'utilization');
}

/**
 * Validate probability value
 * Must be in range [0, 1]
 */
export function validateProbability(probability: number, fieldName: string = 'probability'): void {
  validateExists(probability, fieldName);
  validateRange(probability, 0, 1, fieldName);
}

/**
 * Validate probability distribution sums to 1
 */
export function validateProbabilityDistribution(probabilities: number[]): void {
  validateNonEmptyArray(probabilities, 'probabilities');
  
  probabilities.forEach((p, i) => validateProbability(p, `probabilities[${i}]`));
  
  const sum = probabilities.reduce((a, b) => a + b, 0);
  const tolerance = 0.0001;
  
  if (Math.abs(sum - 1.0) > tolerance) {
    throw new MathematicalError(
      `Probabilities must sum to 1.0, got ${sum}`,
      { probabilities, sum }
    );
  }
}

/**
 * Validate simulation time
 * Must be non-negative and increasing
 */
export function validateSimulationTime(
  newTime: number,
  currentTime: number,
  fieldName: string = 'simulationTime'
): void {
  validateExists(newTime, fieldName);
  validateNonNegative(newTime, fieldName);
  
  if (newTime < currentTime) {
    throw new MathematicalError(
      `Time cannot go backwards: ${newTime} < ${currentTime}`,
      { newTime, currentTime }
    );
  }
}

/**
 * Validate event time is in the future
 */
export function validateEventTime(eventTime: number, currentTime: number): void {
  validateExists(eventTime, 'eventTime');
  validateNonNegative(eventTime, 'eventTime');
  
  if (eventTime < currentTime) {
    throw new MathematicalError(
      `Cannot schedule event in the past: ${eventTime} < ${currentTime}`,
      { eventTime, currentTime }
    );
  }
}

/**
 * Validate resource load constraints
 * currentLoad must not exceed capacity
 */
export function validateResourceLoad(currentLoad: number, capacity: number): void {
  validateNonNegative(currentLoad, 'currentLoad');
  validatePositive(capacity, 'capacity');
  
  if (currentLoad > capacity) {
    throw new MathematicalError(
      `Resource overloaded: currentLoad (${currentLoad}) > capacity (${capacity})`,
      { currentLoad, capacity }
    );
  }
}

/**
 * Validate conservation law: entities in = entities out + entities in system
 */
export function validateConservationLaw(
  entitiesCreated: number,
  entitiesDeparted: number,
  entitiesInSystem: number
): void {
  const expected = entitiesCreated;
  const actual = entitiesDeparted + entitiesInSystem;
  
  if (expected !== actual) {
    throw new ConservationLawError(
      `Conservation law violated: ${entitiesCreated} created ≠ ${entitiesDeparted} departed + ${entitiesInSystem} in system`,
      { entitiesCreated, entitiesDeparted, entitiesInSystem, difference: expected - actual }
    );
  }
}

/**
 * Validate entity timing statistics consistency
 * totalTime should equal sum of component times
 */
export function validateEntityTiming(
  totalTime: number,
  waitTime: number,
  processingTime: number,
  travelTime: number,
  tolerance: number = 0.001
): void {
  validateNonNegative(totalTime, 'totalTime');
  validateNonNegative(waitTime, 'waitTime');
  validateNonNegative(processingTime, 'processingTime');
  validateNonNegative(travelTime, 'travelTime');
  
  const sumOfParts = waitTime + processingTime + travelTime;
  const difference = Math.abs(totalTime - sumOfParts);
  
  if (difference > tolerance) {
    throw new MathematicalError(
      `Entity timing inconsistent: totalTime (${totalTime}) ≠ sum of parts (${sumOfParts})`,
      { totalTime, waitTime, processingTime, travelTime, difference }
    );
  }
}

/* ============================================================================
   COMPLEX OBJECT VALIDATORS
   ============================================================================ */

/**
 * Validate distribution parameters
 */
export function validateDistribution(distribution: any): void {
  validateExists(distribution, 'distribution');
  validateExists(distribution.type, 'distribution.type');
  
  const type = distribution.type.toLowerCase();
  const params = distribution.parameters || {};
  
  switch (type) {
    case 'constant':
    case 'fixed':
    case 'deterministic':
      validateExists(params.value, 'distribution.parameters.value');
      validateNonNegative(params.value, 'distribution.parameters.value');
      break;
      
    case 'exponential':
    case 'exp':
      validateExists(params.rate || params.mean, 'distribution.parameters.rate or mean');
      if (params.rate) validatePositive(params.rate, 'distribution.parameters.rate');
      if (params.mean) validatePositive(params.mean, 'distribution.parameters.mean');
      break;
      
    case 'uniform':
      validateExists(params.min, 'distribution.parameters.min');
      validateExists(params.max, 'distribution.parameters.max');
      validateNonNegative(params.min, 'distribution.parameters.min');
      validateNonNegative(params.max, 'distribution.parameters.max');
      if (params.min >= params.max) {
        throw new ValidationError('Uniform distribution: min must be < max', 'distribution.parameters');
      }
      break;
      
    case 'triangular':
      validateExists(params.min, 'distribution.parameters.min');
      validateExists(params.mode, 'distribution.parameters.mode');
      validateExists(params.max, 'distribution.parameters.max');
      validateNonNegative(params.min, 'distribution.parameters.min');
      validateNonNegative(params.mode, 'distribution.parameters.mode');
      validateNonNegative(params.max, 'distribution.parameters.max');
      if (!(params.min <= params.mode && params.mode <= params.max)) {
        throw new ValidationError('Triangular distribution: min ≤ mode ≤ max required', 'distribution.parameters');
      }
      break;
      
    case 'normal':
    case 'gaussian':
      validateExists(params.mean, 'distribution.parameters.mean');
      validateExists(params.stdDev || params.sigma, 'distribution.parameters.stdDev');
      const stdDev = params.stdDev || params.sigma;
      validatePositive(stdDev, 'distribution.parameters.stdDev');
      break;
      
    case 'empirical':
    case 'discrete':
      validateNonEmptyArray(params.values || params.data, 'distribution.parameters.values');
      validateNonEmptyArray(params.probabilities || params.probs, 'distribution.parameters.probabilities');
      validateProbabilityDistribution(params.probabilities || params.probs);
      break;
      
    default:
      console.warn('[Validation] Unknown distribution type:', type);
  }
}

/**
 * Validate entity object structure and values
 */
export function validateEntity(entity: any): void {
  validateExists(entity, 'entity');
  validateEntityId(entity.id);
  validateExists(entity.type, 'entity.type');
  validateType(entity.type, 'string', 'entity.type');
  validateExists(entity.state, 'entity.state');
  validateNonNegative(entity.creationTime, 'entity.creationTime');
  validateNonNegative(entity.totalWaitTime, 'entity.totalWaitTime');
  validateNonNegative(entity.totalProcessingTime, 'entity.totalProcessingTime');
  validateNonNegative(entity.totalTravelTime, 'entity.totalTravelTime');
}

/**
 * Validate resource object structure and values
 */
export function validateResource(resource: any): void {
  validateExists(resource, 'resource');
  validateResourceId(resource.id);
  validateExists(resource.name, 'resource.name');
  validateCapacity(resource.capacity);
  validateNonNegative(resource.currentLoad, 'resource.currentLoad');
  validateResourceLoad(resource.currentLoad, resource.capacity);
  
  if (resource.queue) {
    if (!Array.isArray(resource.queue)) {
      throw new ValidationError('resource.queue must be an array', 'resource.queue');
    }
  }
  
  if (resource.inService) {
    if (!Array.isArray(resource.inService)) {
      throw new ValidationError('resource.inService must be an array', 'resource.inService');
    }
  }
}

/* ============================================================================
   UTILITY FUNCTIONS
   ============================================================================ */

/**
 * Sanitize data for logging (remove sensitive/large fields)
 */
export function sanitizeForLog(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  
  const sanitized: any = Array.isArray(data) ? [] : {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip large arrays
    if (Array.isArray(value) && value.length > 10) {
      sanitized[key] = `Array(${value.length})`;
      continue;
    }
    
    // Skip sensitive fields
    if (key.toLowerCase().includes('password') || key.toLowerCase().includes('secret')) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    
    // Recursively sanitize objects
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLog(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Create validation result object
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Aggregate multiple validation checks
 */
export function aggregateValidation(
  validations: Array<() => void>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  for (const validate of validations) {
    try {
      validate();
    } catch (error) {
      if (error instanceof ValidationError || error instanceof MathematicalError) {
        errors.push(error.message);
      } else {
        errors.push(String(error));
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

