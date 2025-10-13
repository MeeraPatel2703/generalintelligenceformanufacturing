/**
 * Random Number Generator with Seedable State
 *
 * Uses seedrandom for reproducible simulations.
 * Critical for variance reduction and debugging.
 */

import seedrandom from 'seedrandom';

export class RandomNumberGenerator {
  private rng: seedrandom.PRNG;
  private currentSeed: number;

  constructor(seed: number = Date.now()) {
    this.currentSeed = seed;
    this.rng = seedrandom(seed.toString());
  }

  /**
   * Get uniform random number [0, 1)
   */
  random(): number {
    return this.rng();
  }

  /**
   * Get uniform random integer in [min, max]
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  /**
   * Reset RNG with new seed
   */
  setSeed(seed: number): void {
    this.currentSeed = seed;
    this.rng = seedrandom(seed.toString());
  }

  /**
   * Get current seed value
   */
  getSeed(): number {
    return this.currentSeed;
  }

  /**
   * Create independent RNG stream (for parallel replications)
   */
  createStream(streamId: number): RandomNumberGenerator {
    return new RandomNumberGenerator(this.currentSeed + streamId * 1000000);
  }
}
