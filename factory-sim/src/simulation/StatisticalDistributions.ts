
/**
 * Statistical Distributions Library
 *
 * Complete implementation of all probability distributions used in DES
 * Matches Simio's distribution capabilities
 */

export class RandomNumberGenerator {
  private seed: number;
  private m: number = 2147483647; // 2^31 - 1 (Mersenne prime)
  private a: number = 48271;
  private q: number = 44488;
  private r: number = 3399;

  constructor(seed: number = Date.now()) {
    this.seed = seed > 0 ? seed : Date.now();
  }

  // Linear Congruential Generator (LCG) - Parks and Miller
  next(): number {
    const hi = Math.floor(this.seed / this.q);
    const lo = this.seed % this.q;
    this.seed = this.a * lo - this.r * hi;
    if (this.seed <= 0) {
      this.seed += this.m;
    }
    return this.seed / this.m;
  }

  setSeed(seed: number): void {
    this.seed = seed > 0 ? seed : Date.now();
  }

  getSeed(): number {
    return this.seed;
  }
}

export class Distributions {
  private rng: RandomNumberGenerator;

  constructor(seed?: number) {
    this.rng = new RandomNumberGenerator(seed);
  }

  setSeed(seed: number): void {
    this.rng.setSeed(seed);
  }

  // ============================================================================
  // CONTINUOUS DISTRIBUTIONS
  // ============================================================================

  /**
   * Constant distribution - always returns the same value
   */
  constant(value: number): number {
    return value;
  }

  /**
   * Uniform distribution - equal probability between min and max
   */
  uniform(min: number, max: number): number {
    return min + (max - min) * this.rng.next();
  }

  /**
   * Triangular distribution - simple distribution with mode
   */
  triangular(min: number, mode: number, max: number): number {
    const u = this.rng.next();
    const f = (mode - min) / (max - min);

    if (u < f) {
      return min + Math.sqrt(u * (max - min) * (mode - min));
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }
  }

  /**
   * Exponential distribution - commonly used for interarrival times
   * Mean = 1/lambda, Variance = 1/lambda^2
   */
  exponential(lambda: number): number {
    return -Math.log(1 - this.rng.next()) / lambda;
  }

  /**
   * Normal (Gaussian) distribution using Box-Muller transform
   */
  normal(mean: number, stdDev: number): number {
    const u1 = this.rng.next();
    const u2 = this.rng.next();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z0 * stdDev;
  }

  /**
   * Lognormal distribution - exponential of normal distribution
   * Used for skewed distributions with positive values
   */
  lognormal(logMean: number, logStdDev: number): number {
    return Math.exp(this.normal(logMean, logStdDev));
  }

  /**
   * Weibull distribution - flexible distribution for reliability analysis
   * Alpha (scale), Beta (shape)
   */
  weibull(alpha: number, beta: number): number {
    const u = this.rng.next();
    return alpha * Math.pow(-Math.log(1 - u), 1 / beta);
  }

  /**
   * Gamma distribution - generalizes exponential and Erlang
   * Used for waiting times, processing times
   */
  gamma(shape: number, scale: number): number {
    if (shape < 1) {
      // Use Ahrens-Dieter algorithm for shape < 1
      const u = this.rng.next();
      return this.gamma(1 + shape, scale) * Math.pow(u, 1 / shape);
    }

    // Marsaglia and Tsang's method for shape >= 1
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x: number;
      let v: number;

      do {
        x = this.normal(0, 1);
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = this.rng.next();

      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v * scale;
      }

      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    }
  }

  /**
   * Erlang distribution - special case of Gamma with integer shape
   * Sum of k exponential distributions, used for multi-stage processes
   */
  erlang(k: number, lambda: number): number {
    let sum = 0;
    for (let i = 0; i < k; i++) {
      sum += this.exponential(lambda);
    }
    return sum;
  }

  /**
   * Beta distribution - bounded distribution [0, 1]
   * Useful for modeling proportions and probabilities
   */
  beta(alpha: number, beta: number): number {
    const x = this.gamma(alpha, 1);
    const y = this.gamma(beta, 1);
    return x / (x + y);
  }

  /**
   * Pearson Type 5 distribution - used in project management
   */
  pearson5(alpha: number, beta: number): number {
    return 1 / this.gamma(alpha, 1 / beta);
  }

  /**
   * Pearson Type 6 distribution
   */
  pearson6(alpha1: number, alpha2: number, beta: number): number {
    const x1 = this.gamma(alpha1, beta);
    const x2 = this.gamma(alpha2, beta);
    return x1 / x2;
  }

  // ============================================================================
  // DISCRETE DISTRIBUTIONS
  // ============================================================================

  /**
   * Discrete distribution - sample from discrete probabilities
   * probs must sum to 1.0
   */
  discrete(probs: number[]): number {
    const u = this.rng.next();
    let cumulative = 0;

    for (let i = 0; i < probs.length; i++) {
      cumulative += probs[i];
      if (u <= cumulative) {
        return i;
      }
    }

    return probs.length - 1;
  }

  /**
   * Poisson distribution - number of events in fixed time interval
   */
  poisson(lambda: number): number {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;

    do {
      k++;
      p *= this.rng.next();
    } while (p > L);

    return k - 1;
  }

  /**
   * Binomial distribution - number of successes in n trials
   */
  binomial(n: number, p: number): number {
    let successes = 0;
    for (let i = 0; i < n; i++) {
      if (this.rng.next() < p) {
        successes++;
      }
    }
    return successes;
  }

  /**
   * Geometric distribution - number of trials until first success
   */
  geometric(p: number): number {
    return Math.floor(Math.log(1 - this.rng.next()) / Math.log(1 - p)) + 1;
  }

  /**
   * Negative Binomial distribution
   */
  negativeBinomial(r: number, p: number): number {
    let failures = 0;
    let successes = 0;

    while (successes < r) {
      if (this.rng.next() < p) {
        successes++;
      } else {
        failures++;
      }
    }

    return failures;
  }

  // ============================================================================
  // EMPIRICAL DISTRIBUTIONS
  // ============================================================================

  /**
   * Empirical distribution from data
   * Uses linear interpolation between points
   */
  empirical(values: number[], cumProbs: number[]): number {
    const u = this.rng.next();

    for (let i = 0; i < cumProbs.length - 1; i++) {
      if (u <= cumProbs[i + 1]) {
        // Linear interpolation
        const t = (u - cumProbs[i]) / (cumProbs[i + 1] - cumProbs[i]);
        return values[i] + t * (values[i + 1] - values[i]);
      }
    }

    return values[values.length - 1];
  }

  // ============================================================================
  // SPECIALIZED DISTRIBUTIONS
  // ============================================================================

  /**
   * Johnson SB distribution - bounded, flexible shape
   */
  johnsonSB(gamma: number, delta: number, lambda: number, xi: number): number {
    const z = this.normal(0, 1);
    const y = (z - gamma) / delta;
    return xi + lambda / (1 + Math.exp(-y));
  }

  /**
   * Johnson SU distribution - unbounded, flexible shape
   */
  johnsonSU(gamma: number, delta: number, lambda: number, xi: number): number {
    const z = this.normal(0, 1);
    const y = (z - gamma) / delta;
    return xi + lambda * Math.sinh(y);
  }

  /**
   * Log-logistic distribution
   */
  logLogistic(alpha: number, beta: number): number {
    const u = this.rng.next();
    return alpha * Math.pow(u / (1 - u), 1 / beta);
  }

  /**
   * Chi-squared distribution with k degrees of freedom
   */
  chiSquared(k: number): number {
    return this.gamma(k / 2, 2);
  }

  /**
   * Student's t-distribution
   */
  studentT(nu: number): number {
    const z = this.normal(0, 1);
    const v = this.chiSquared(nu);
    return z / Math.sqrt(v / nu);
  }

  /**
   * F-distribution
   */
  fDistribution(d1: number, d2: number): number {
    const x1 = this.chiSquared(d1) / d1;
    const x2 = this.chiSquared(d2) / d2;
    return x1 / x2;
  }

  // ============================================================================
  // TRUNCATED DISTRIBUTIONS
  // ============================================================================

  /**
   * Truncated normal distribution
   */
  truncatedNormal(mean: number, stdDev: number, min: number, max: number): number {
    let value: number;
    do {
      value = this.normal(mean, stdDev);
    } while (value < min || value > max);
    return value;
  }

  /**
   * Truncated exponential distribution
   */
  truncatedExponential(lambda: number, min: number, max: number): number {
    const u = this.rng.next();
    const Fmin = 1 - Math.exp(-lambda * min);
    const Fmax = 1 - Math.exp(-lambda * max);
    const Fu = Fmin + u * (Fmax - Fmin);
    return -Math.log(1 - Fu) / lambda;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Random boolean with probability p of true
   */
  randomBoolean(p: number = 0.5): boolean {
    return this.rng.next() < p;
  }

  /**
   * Random integer between min and max (inclusive)
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.uniform(min, max + 1));
  }

  /**
   * Random selection from array
   */
  randomChoice<T>(array: T[]): T {
    return array[this.randomInt(0, array.length - 1)];
  }

  /**
   * Shuffle array in place (Fisher-Yates)
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

// ============================================================================
// STATISTICAL FUNCTIONS
// ============================================================================

export class Statistics {
  /**
   * Calculate mean (average)
   */
  static mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate variance
   */
  static variance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.mean(values);
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  static stdDev(values: number[]): number {
    return Math.sqrt(this.variance(values));
  }

  /**
   * Calculate median
   */
  static median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Calculate percentile
   */
  static percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Calculate confidence interval
   */
  static confidenceInterval(values: number[], confidence: number = 0.95): { lower: number; upper: number; mean: number } {
    if (values.length === 0) return { lower: 0, upper: 0, mean: 0 };

    const mean = this.mean(values);
    const stdDev = this.stdDev(values);
    const n = values.length;

    // t-value for 95% confidence (approximation)
    const tValue = 1.96; // For large n, use normal approximation
    const marginOfError = tValue * (stdDev / Math.sqrt(n));

    return {
      mean,
      lower: mean - marginOfError,
      upper: mean + marginOfError
    };
  }

  /**
   * Calculate min
   */
  static min(values: number[]): number {
    return values.length === 0 ? 0 : Math.min(...values);
  }

  /**
   * Calculate max
   */
  static max(values: number[]): number {
    return values.length === 0 ? 0 : Math.max(...values);
  }

  /**
   * Calculate sum
   */
  static sum(values: number[]): number {
    return values.reduce((a, b) => a + b, 0);
  }

  /**
   * Calculate count
   */
  static count(values: any[]): number {
    return values.length;
  }
}
