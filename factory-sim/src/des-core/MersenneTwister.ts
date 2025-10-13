/**
 * Mersenne Twister MT19937
 *
 * Industry-standard PRNG with period 2^19937-1
 * Used in: MATLAB, Python NumPy, GNU Scientific Library
 *
 * Properties:
 * - Extremely long period (2^19937-1)
 * - Fast generation
 * - Good statistical properties
 * - Passes most randomness tests
 *
 * Reference: Matsumoto & Nishimura (1998)
 */

export class MersenneTwister {
  private static readonly N = 624;
  private static readonly M = 397;
  private static readonly MATRIX_A = 0x9908b0df;
  private static readonly UPPER_MASK = 0x80000000;
  private static readonly LOWER_MASK = 0x7fffffff;

  private mt: Uint32Array;
  private index: number = MersenneTwister.N; // Initialize to N
  private seed: number;

  /**
   * Initialize with seed
   * @param seed - Unsigned 32-bit integer seed
   */
  constructor(seed: number = Date.now()) {
    this.seed = seed >>> 0; // Ensure unsigned
    this.mt = new Uint32Array(MersenneTwister.N);
    this.init(this.seed);
  }

  /**
   * Initialize the generator state
   */
  private init(seed: number): void {
    this.mt[0] = seed >>> 0;

    for (let i = 1; i < MersenneTwister.N; i++) {
      const s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
      this.mt[i] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) +
                     (s & 0x0000ffff) * 1812433253 + i) >>> 0;
    }

    this.index = MersenneTwister.N;
  }

  /**
   * Generate next batch of 624 values
   */
  private twist(): void {
    const N = MersenneTwister.N;
    const M = MersenneTwister.M;
    const MATRIX_A = MersenneTwister.MATRIX_A;
    const UPPER_MASK = MersenneTwister.UPPER_MASK;
    const LOWER_MASK = MersenneTwister.LOWER_MASK;
    const mag01 = [0, MATRIX_A];

    let kk: number;
    let y: number;

    for (kk = 0; kk < N - M; kk++) {
      y = (this.mt[kk] & UPPER_MASK) | (this.mt[kk + 1] & LOWER_MASK);
      this.mt[kk] = this.mt[kk + M] ^ (y >>> 1) ^ mag01[y & 0x1];
    }

    for (; kk < N - 1; kk++) {
      y = (this.mt[kk] & UPPER_MASK) | (this.mt[kk + 1] & LOWER_MASK);
      this.mt[kk] = this.mt[kk + (M - N)] ^ (y >>> 1) ^ mag01[y & 0x1];
    }

    y = (this.mt[N - 1] & UPPER_MASK) | (this.mt[0] & LOWER_MASK);
    this.mt[N - 1] = this.mt[M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];

    this.index = 0;
  }

  /**
   * Generate random unsigned 32-bit integer
   * Range: [0, 4294967295]
   */
  randomInt32(): number {
    if (this.index >= MersenneTwister.N) {
      this.twist();
    }

    let y = this.mt[this.index++];

    // Tempering
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;

    return y >>> 0;
  }

  /**
   * Generate random floating point in [0, 1)
   * This is the most commonly used method
   */
  random(): number {
    return this.randomInt32() / 4294967296;
  }

  /**
   * Generate random floating point in [0, 1]
   * Includes 1.0 (uses 53-bit resolution)
   */
  randomInclusive(): number {
    const a = this.randomInt32() >>> 5;
    const b = this.randomInt32() >>> 6;
    return (a * 67108864.0 + b) / 9007199254740992.0;
  }

  /**
   * Generate random floating point in (0, 1)
   * Excludes both 0 and 1
   */
  randomExclusive(): number {
    return (this.randomInt32() + 0.5) / 4294967296;
  }

  /**
   * Generate random integer in range [min, max]
   */
  randomRange(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  /**
   * Get current seed
   */
  getSeed(): number {
    return this.seed;
  }

  /**
   * Reset generator with new seed
   */
  setSeed(seed: number): void {
    this.init(seed);
  }

  /**
   * Save current state
   */
  saveState(): { mt: number[]; index: number; seed: number } {
    return {
      mt: Array.from(this.mt),
      index: this.index,
      seed: this.seed
    };
  }

  /**
   * Restore previous state
   */
  restoreState(state: { mt: number[]; index: number; seed: number }): void {
    this.mt = new Uint32Array(state.mt);
    this.index = state.index;
    this.seed = state.seed;
  }
}

/**
 * RNG Stream Manager
 *
 * Manages multiple independent RNG streams for:
 * - Different replications
 * - Different random processes
 * - Variance reduction techniques
 */

export class RNGStreamManager {
  private streams: Map<string, MersenneTwister> = new Map();
  private baseSeed: number;

  constructor(baseSeed: number = Date.now()) {
    this.baseSeed = baseSeed;
  }

  /**
   * Get or create a stream
   * @param streamId - Unique identifier for this stream
   */
  getStream(streamId: string): MersenneTwister {
    if (!this.streams.has(streamId)) {
      // Create independent stream using hash of ID
      const seed = this.hashString(streamId) ^ this.baseSeed;
      this.streams.set(streamId, new MersenneTwister(seed));
    }

    return this.streams.get(streamId)!;
  }

  /**
   * Get stream for specific replication
   * Ensures independence between replications
   */
  getReplicationStream(replicationNumber: number): MersenneTwister {
    return this.getStream(`replication-${replicationNumber}`);
  }

  /**
   * Get stream for specific process
   * Allows common random numbers across scenarios
   */
  getProcessStream(processName: string): MersenneTwister {
    return this.getStream(`process-${processName}`);
  }

  /**
   * Reset all streams
   */
  reset(): void {
    this.streams.clear();
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get statistics about streams
   */
  getStats(): { totalStreams: number; streamIds: string[] } {
    return {
      totalStreams: this.streams.size,
      streamIds: Array.from(this.streams.keys())
    };
  }
}

/**
 * Variance Reduction Techniques
 */

export class VarianceReduction {
  /**
   * Generate antithetic variate
   * If U ~ Uniform(0,1), then 1-U is also Uniform(0,1) and negatively correlated
   */
  static antitheticPair(rng: MersenneTwister): [number, number] {
    const u = rng.random();
    return [u, 1 - u];
  }

  /**
   * Common Random Numbers (CRN)
   * Use same seed for different scenarios to reduce comparison variance
   */
  static setupCRN(scenarios: string[], baseSeed: number): Map<string, number> {
    const seeds = new Map<string, number>();

    scenarios.forEach((scenario, index) => {
      seeds.set(scenario, baseSeed + index * 1000);
    });

    return seeds;
  }
}
