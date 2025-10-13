export class Distributions {
  private rng: () => number;

  constructor(rng: () => number = Math.random) {
    this.rng = rng;
  }

  exponential(rate: number): number {
    return -Math.log(this.rng()) / rate;
  }

  uniform(min: number, max: number): number {
    return min + (max - min) * this.rng();
  }

  triangular(min: number, mode: number, max: number): number {
    const u = this.rng();
    const f = (mode - min) / (max - min);

    if (u < f) {
      return min + Math.sqrt(u * (max - min) * (mode - min));
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }
  }

  normal(mean: number, stdDev: number): number {
    // Box-Muller transform
    const u1 = this.rng();
    const u2 = this.rng();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z0 * stdDev;
  }

  // Additional helper: discrete distribution for group sizes, etc.
  discrete(values: number[], probabilities: number[]): number {
    if (values.length !== probabilities.length) {
      throw new Error('Values and probabilities must have same length');
    }

    const sum = probabilities.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.001) {
      throw new Error(`Probabilities must sum to 1.0, got ${sum}`);
    }

    const u = this.rng();
    let cumulative = 0;

    for (let i = 0; i < values.length; i++) {
      cumulative += probabilities[i];
      if (u <= cumulative) {
        return values[i];
      }
    }

    return values[values.length - 1];
  }
}
