/**
 * Statistical Distributions for Process Time Sampling
 *
 * All distributions are validated and guaranteed to return non-negative values.
 */

import { RandomNumberGenerator } from './rng';
import { ProcessTimeConfig } from '../../src/types/simulation';

export abstract class Distribution {
  abstract sample(rng: RandomNumberGenerator): number;
  abstract getMean(): number;
  abstract getStdDev(): number;
}

/**
 * Normal (Gaussian) Distribution
 * Uses Box-Muller transform for sampling
 */
export class NormalDistribution extends Distribution {
  constructor(private mean: number, private stdDev: number) {
    super();
    if (stdDev < 0) throw new Error('Standard deviation must be non-negative');
  }

  sample(rng: RandomNumberGenerator): number {
    // Box-Muller transform
    const u1 = rng.random();
    const u2 = rng.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    // Ensure non-negative (truncate at 0)
    return Math.max(0, this.mean + z0 * this.stdDev);
  }

  getMean(): number {
    return this.mean;
  }

  getStdDev(): number {
    return this.stdDev;
  }
}

/**
 * Exponential Distribution
 * Used for inter-arrival times and failure times
 */
export class ExponentialDistribution extends Distribution {
  private lambda: number;

  constructor(mean: number) {
    super();
    if (mean <= 0) throw new Error('Mean must be positive');
    this.lambda = 1 / mean;
  }

  sample(rng: RandomNumberGenerator): number {
    return -Math.log(1 - rng.random()) / this.lambda;
  }

  getMean(): number {
    return 1 / this.lambda;
  }

  getStdDev(): number {
    return 1 / this.lambda;
  }
}

/**
 * Triangular Distribution
 * Defined by min, mode (most likely), and max
 */
export class TriangularDistribution extends Distribution {
  constructor(
    private min: number,
    private mode: number,
    private max: number
  ) {
    super();
    if (min > mode || mode > max) {
      throw new Error('Must have min <= mode <= max');
    }
  }

  sample(rng: RandomNumberGenerator): number {
    const u = rng.random();
    const F = (this.mode - this.min) / (this.max - this.min);

    if (u < F) {
      return this.min + Math.sqrt(u * (this.max - this.min) * (this.mode - this.min));
    } else {
      return this.max - Math.sqrt((1 - u) * (this.max - this.min) * (this.max - this.mode));
    }
  }

  getMean(): number {
    return (this.min + this.mode + this.max) / 3;
  }

  getStdDev(): number {
    const variance = (
      this.min * this.min +
      this.mode * this.mode +
      this.max * this.max -
      this.min * this.mode -
      this.min * this.max -
      this.mode * this.max
    ) / 18;
    return Math.sqrt(variance);
  }
}

/**
 * Constant Distribution
 * Always returns the same value (deterministic)
 */
export class ConstantDistribution extends Distribution {
  constructor(private value: number) {
    super();
    if (value < 0) throw new Error('Value must be non-negative');
  }

  sample(_rng: RandomNumberGenerator): number {
    return this.value;
  }

  getMean(): number {
    return this.value;
  }

  getStdDev(): number {
    return 0;
  }
}

/**
 * Uniform Distribution
 * Returns values uniformly distributed between min and max
 */
export class UniformDistribution extends Distribution {
  constructor(private min: number, private max: number) {
    super();
    if (min >= max) throw new Error('Min must be less than max');
    if (min < 0) throw new Error('Min must be non-negative');
  }

  sample(rng: RandomNumberGenerator): number {
    return this.min + rng.random() * (this.max - this.min);
  }

  getMean(): number {
    return (this.min + this.max) / 2;
  }

  getStdDev(): number {
    return Math.sqrt(Math.pow(this.max - this.min, 2) / 12);
  }
}

/**
 * Factory function to create distributions from config
 */
export function createDistribution(config: ProcessTimeConfig): Distribution {
  switch (config.distribution) {
    case 'normal':
      if (config.mean === undefined || config.stdDev === undefined) {
        throw new Error('Normal distribution requires mean and stdDev');
      }
      return new NormalDistribution(config.mean, config.stdDev);

    case 'exponential':
      if (config.mean === undefined) {
        throw new Error('Exponential distribution requires mean');
      }
      return new ExponentialDistribution(config.mean);

    case 'triangular':
      if (config.min === undefined || config.mode === undefined || config.max === undefined) {
        throw new Error('Triangular distribution requires min, mode, and max');
      }
      return new TriangularDistribution(config.min, config.mode, config.max);

    case 'constant':
      if (config.mean === undefined) {
        throw new Error('Constant distribution requires mean (value)');
      }
      return new ConstantDistribution(config.mean);

    default:
      throw new Error(`Unknown distribution type: ${config.distribution}`);
  }
}
