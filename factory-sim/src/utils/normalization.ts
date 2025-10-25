// Normalization utilities for DES parser
// Converts various units to canonical forms and validates data

import { Distribution } from '../types/processGraph';

// ============================================================================
// UNIT CONVERSION
// ============================================================================

/**
 * Convert time to minutes
 */
export function normalizeTime(value: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase().trim();

  switch (normalizedUnit) {
    case 'min':
    case 'mins':
    case 'minute':
    case 'minutes':
      return value;

    case 'sec':
    case 'secs':
    case 'second':
    case 'seconds':
      return value / 60;

    case 'hr':
    case 'hrs':
    case 'hour':
    case 'hours':
      return value * 60;

    case 'day':
    case 'days':
      return value * 1440;

    case 'week':
    case 'weeks':
      return value * 10080;

    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
}

/**
 * Convert distance to feet
 */
export function normalizeDistance(value: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase().trim();

  switch (normalizedUnit) {
    case 'ft':
    case 'feet':
    case 'foot':
      return value;

    case 'in':
    case 'inch':
    case 'inches':
      return value / 12;

    case 'm':
    case 'meter':
    case 'meters':
    case 'metre':
    case 'metres':
      return value * 3.28084;

    case 'cm':
    case 'centimeter':
    case 'centimeters':
      return value * 0.0328084;

    case 'km':
    case 'kilometer':
    case 'kilometers':
      return value * 3280.84;

    case 'mi':
    case 'mile':
    case 'miles':
      return value * 5280;

    default:
      throw new Error(`Unknown distance unit: ${unit}`);
  }
}

/**
 * Convert speed to ft/s
 */
export function normalizeSpeed(value: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase().trim().replace(/\s+/g, '');

  switch (normalizedUnit) {
    case 'ft/s':
    case 'fps':
    case 'feet/second':
    case 'feet/sec':
      return value;

    case 'ft/min':
    case 'fpm':
    case 'feet/minute':
      return value / 60;

    case 'm/s':
    case 'meters/second':
    case 'metres/second':
      return value * 3.28084;

    case 'm/min':
    case 'meters/minute':
    case 'metres/minute':
      return value * 3.28084 / 60;

    case 'mph':
    case 'mi/hr':
    case 'miles/hour':
      return value * 1.46667;

    case 'km/h':
    case 'kmh':
    case 'km/hr':
    case 'kilometers/hour':
      return value * 0.911344;

    default:
      throw new Error(`Unknown speed unit: ${unit}`);
  }
}

/**
 * Convert rate to entities/hour
 */
export function normalizeRate(value: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase().trim().replace(/\s+/g, '');

  switch (normalizedUnit) {
    case 'entities/hour':
    case 'entities/hr':
    case 'parts/hour':
    case 'parts/hr':
    case 'per_hour':
    case '/hour':
    case '/hr':
      return value;

    case 'entities/minute':
    case 'entities/min':
    case 'parts/minute':
    case 'parts/min':
    case 'per_minute':
    case '/minute':
    case '/min':
      return value * 60;

    case 'entities/second':
    case 'entities/sec':
    case 'parts/second':
    case 'parts/sec':
    case 'per_second':
    case '/second':
    case '/sec':
      return value * 3600;

    case 'entities/day':
    case 'parts/day':
    case 'per_day':
    case '/day':
      return value / 24;

    default:
      throw new Error(`Unknown rate unit: ${unit}`);
  }
}

// ============================================================================
// DISTRIBUTION VALIDATION
// ============================================================================

/**
 * Validate distribution parameters
 */
export function validateDistribution(dist: Distribution): { valid: boolean; error?: string } {
  switch (dist.type) {
    case 'constant':
      return { valid: true };

    case 'normal':
      if (dist.params.stdev <= 0) {
        return { valid: false, error: 'Normal distribution stdev must be > 0' };
      }
      return { valid: true };

    case 'lognormal':
      if (dist.params.sigma <= 0) {
        return { valid: false, error: 'Lognormal distribution sigma must be > 0' };
      }
      return { valid: true };

    case 'exponential':
      if (dist.params.mean <= 0) {
        return { valid: false, error: 'Exponential distribution mean must be > 0' };
      }
      return { valid: true };

    case 'gamma':
      if (dist.params.shape <= 0) {
        return { valid: false, error: 'Gamma distribution shape must be > 0' };
      }
      if (dist.params.scale <= 0) {
        return { valid: false, error: 'Gamma distribution scale must be > 0' };
      }
      return { valid: true };

    case 'weibull':
      if (dist.params.shape <= 0) {
        return { valid: false, error: 'Weibull distribution shape must be > 0' };
      }
      if (dist.params.scale <= 0) {
        return { valid: false, error: 'Weibull distribution scale must be > 0' };
      }
      return { valid: true };

    case 'uniform':
      if (dist.params.min > dist.params.max) {
        return { valid: false, error: 'Uniform distribution min must be <= max' };
      }
      return { valid: true };

    case 'triangular':
      if (dist.params.min > dist.params.mode) {
        return { valid: false, error: 'Triangular distribution min must be <= mode' };
      }
      if (dist.params.mode > dist.params.max) {
        return { valid: false, error: 'Triangular distribution mode must be <= max' };
      }
      return { valid: true };

    case 'erlang':
      if (dist.params.k < 1) {
        return { valid: false, error: 'Erlang distribution k must be >= 1' };
      }
      if (!Number.isInteger(dist.params.k)) {
        return { valid: false, error: 'Erlang distribution k must be an integer' };
      }
      if (dist.params.rate <= 0) {
        return { valid: false, error: 'Erlang distribution rate must be > 0' };
      }
      return { valid: true };

    case 'empirical':
      if (dist.params.values.length === 0) {
        return { valid: false, error: 'Empirical distribution must have at least one value' };
      }
      if (dist.params.weights && dist.params.weights.length !== dist.params.values.length) {
        return { valid: false, error: 'Empirical distribution weights must match values length' };
      }
      return { valid: true };

    default:
      return { valid: false, error: `Unknown distribution type: ${(dist as any).type}` };
  }
}

/**
 * Repair distribution if possible
 */
export function repairDistribution(dist: Distribution): Distribution {
  switch (dist.type) {
    case 'triangular': {
      const { min, mode, max } = dist.params;
      // Ensure min <= mode <= max
      const sortedValues = [min, mode, max].sort((a, b) => a - b);
      return {
        ...dist,
        params: {
          min: sortedValues[0],
          mode: sortedValues[1],
          max: sortedValues[2]
        }
      };
    }

    case 'uniform': {
      const { min, max } = dist.params;
      if (min > max) {
        return {
          ...dist,
          params: { min: max, max: min }
        };
      }
      return dist;
    }

    default:
      return dist;
  }
}

// ============================================================================
// PROBABILITY VALIDATION
// ============================================================================

/**
 * Validate that probabilities sum to 1.0
 */
export function validateProbabilities(probs: number[], tolerance = 1e-6): boolean {
  const sum = probs.reduce((acc, p) => acc + p, 0);
  return Math.abs(sum - 1.0) < tolerance;
}

/**
 * Normalize probabilities to sum to 1.0
 */
export function normalizeProbabilities(probs: number[]): number[] {
  const sum = probs.reduce((acc, p) => acc + p, 0);
  if (sum === 0) {
    // Equal probabilities
    return probs.map(() => 1 / probs.length);
  }
  return probs.map(p => p / sum);
}

// ============================================================================
// TIME FORMATTING
// ============================================================================

/**
 * Parse HH:MM time string to minutes from midnight
 */
export function parseTime(timeStr: string): number {
  const match = timeStr.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}. Expected HH:MM`);
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (hours < 0 || hours > 23) {
    throw new Error(`Invalid hours: ${hours}. Must be 0-23`);
  }
  if (minutes < 0 || minutes > 59) {
    throw new Error(`Invalid minutes: ${minutes}. Must be 0-59`);
  }

  return hours * 60 + minutes;
}

/**
 * Format minutes from midnight to HH:MM
 */
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = Math.floor(minutes % 60);
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Validate time range (start < end)
 */
export function validateTimeRange(start: string, end: string): boolean {
  return parseTime(start) < parseTime(end);
}

// ============================================================================
// IDENTIFIER VALIDATION
// ============================================================================

/**
 * Validate identifier (alphanumeric, underscore, hyphen)
 */
export function validateIdentifier(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

/**
 * Sanitize identifier
 */
export function sanitizeIdentifier(id: string): string {
  return id
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/^[0-9]/, '_$&'); // Don't start with number
}

// ============================================================================
// DATA QUALITY CHECKS
// ============================================================================

/**
 * Check if value is within reasonable bounds for DES
 */
export function checkReasonableBounds(value: number, type: 'time' | 'distance' | 'speed' | 'rate'): boolean {
  switch (type) {
    case 'time':
      // 0 to 1 week in minutes
      return value >= 0 && value <= 10080;

    case 'distance':
      // 0 to 10 miles in feet
      return value >= 0 && value <= 52800;

    case 'speed':
      // 0 to 100 mph in ft/s
      return value >= 0 && value <= 146.667;

    case 'rate':
      // 0 to 10000 entities/hour
      return value >= 0 && value <= 10000;

    default:
      return true;
  }
}

/**
 * Generate warning for unusual values
 */
export function checkForWarnings(value: number, type: 'time' | 'distance' | 'speed' | 'rate'): string | null {
  if (!checkReasonableBounds(value, type)) {
    return `Unusual ${type} value: ${value}. Please verify.`;
  }
  return null;
}

// ============================================================================
// ROUND-TRIPPING
// ============================================================================

/**
 * Round number to reasonable precision
 */
export function roundToPrecision(value: number, decimals = 4): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Clean small floating point errors
 */
export function cleanFloat(value: number, epsilon = 1e-10): number {
  if (Math.abs(value - Math.round(value)) < epsilon) {
    return Math.round(value);
  }
  return value;
}
