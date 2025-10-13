/**
 * Statistical Testing Utilities for DES Validation
 * Implements hypothesis tests and goodness-of-fit measures
 */

export class StatisticalTests {
  /**
   * Chi-Square Goodness-of-Fit Test
   * Tests if observed frequencies match expected distribution
   * Returns p-value (reject null if p < 0.05)
   */
  static chiSquareTest(observed: number[], expected: number[]): { chiSq: number; df: number; pValue: number } {
    if (observed.length !== expected.length) {
      throw new Error('Observed and expected arrays must have same length');
    }

    let chiSq = 0;
    for (let i = 0; i < observed.length; i++) {
      if (expected[i] === 0) continue;
      chiSq += Math.pow(observed[i] - expected[i], 2) / expected[i];
    }

    const df = observed.length - 1;
    const pValue = this.chiSquarePValue(chiSq, df);

    return { chiSq, df, pValue };
  }

  /**
   * Kolmogorov-Smirnov Test
   * Tests if sample comes from specified distribution
   * Returns D statistic and p-value
   */
  static ksTest(samples: number[], cdf: (x: number) => number): { D: number; pValue: number } {
    const sorted = [...samples].sort((a, b) => a - b);
    const n = sorted.length;

    let maxD = 0;
    for (let i = 0; i < n; i++) {
      const empiricalCDF = (i + 1) / n;
      const theoreticalCDF = cdf(sorted[i]);
      const D = Math.abs(empiricalCDF - theoreticalCDF);
      maxD = Math.max(maxD, D);
    }

    const pValue = this.ksPValue(maxD, n);
    return { D: maxD, pValue };
  }

  /**
   * Shapiro-Wilk Test for Normality
   * Tests if sample comes from normal distribution
   */
  static shapiroWilkTest(samples: number[]): { W: number; pValue: number } {
    const n = samples.length;
    if (n < 3 || n > 5000) {
      throw new Error('Sample size must be between 3 and 5000');
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const mean = samples.reduce((a, b) => a + b, 0) / n;

    // Calculate variance
    const variance = samples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0);

    // Calculate b (numerator of W)
    const a = this.shapiroWilkCoefficients(n);
    let b = 0;
    const k = Math.floor(n / 2);
    for (let i = 0; i < k; i++) {
      b += a[i] * (sorted[n - 1 - i] - sorted[i]);
    }

    const W = (b * b) / variance;
    const pValue = this.shapiroWilkPValue(W, n);

    return { W, pValue };
  }

  /**
   * Runs Test for Randomness
   * Tests if sequence is random (no autocorrelation)
   */
  static runsTest(samples: number[]): { runs: number; expected: number; pValue: number } {
    const median = this.median(samples);
    const binary = samples.map(x => x >= median ? 1 : 0);

    // Count runs
    let runs = 1;
    for (let i = 1; i < binary.length; i++) {
      if (binary[i] !== binary[i - 1]) runs++;
    }

    // Count 1s and 0s
    const n1 = binary.filter(x => x === 1).length;
    const n0 = binary.filter(x => x === 0).length;
    const n = n1 + n0;

    // Expected runs and variance
    const expectedRuns = (2 * n1 * n0) / n + 1;
    const variance = (2 * n1 * n0 * (2 * n1 * n0 - n)) / (n * n * (n - 1));
    const stdDev = Math.sqrt(variance);

    // Z-score
    const z = (runs - expectedRuns) / stdDev;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

    return { runs, expected: expectedRuns, pValue };
  }

  /**
   * Autocorrelation at lag k
   */
  static autocorrelation(samples: number[], lag: number): number {
    const n = samples.length;
    const mean = samples.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n - lag; i++) {
      numerator += (samples[i] - mean) * (samples[i + lag] - mean);
    }

    for (let i = 0; i < n; i++) {
      denominator += Math.pow(samples[i] - mean, 2);
    }

    return numerator / denominator;
  }

  /**
   * Pearson Correlation Coefficient
   */
  static correlation(x: number[], y: number[]): number {
    if (x.length !== y.length) throw new Error('Arrays must have same length');

    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let sumSqX = 0;
    let sumSqY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      sumSqX += dx * dx;
      sumSqY += dy * dy;
    }

    return numerator / Math.sqrt(sumSqX * sumSqY);
  }

  /**
   * Anderson-Darling Test for specific distribution
   */
  static andersonDarlingTest(samples: number[], cdf: (x: number) => number): { A2: number; pValue: number } {
    const sorted = [...samples].sort((a, b) => a - b);
    const n = sorted.length;

    let sum = 0;
    for (let i = 0; i < n; i++) {
      const F = cdf(sorted[i]);
      const F_comp = cdf(sorted[n - 1 - i]);
      if (F <= 0 || F >= 1) continue; // Skip boundary cases
      sum += (2 * i + 1) * (Math.log(F) + Math.log(1 - F_comp));
    }

    const A2 = -n - sum / n;
    const pValue = this.andersonDarlingPValue(A2, n);

    return { A2, pValue };
  }

  // ===== Helper Functions =====

  private static median(arr: number[]): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private static normalCDF(z: number): number {
    // Approximation of standard normal CDF
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - prob : prob;
  }

  private static chiSquarePValue(chiSq: number, df: number): number {
    // Approximation using incomplete gamma function
    return 1 - this.gammaP(df / 2, chiSq / 2);
  }

  private static gammaP(a: number, x: number): number {
    // Regularized lower incomplete gamma function
    if (x < 0 || a <= 0) return 0;
    if (x === 0) return 0;
    if (x > 100) return 1; // Approximation for large x

    // Series expansion
    let sum = 1 / a;
    let term = 1 / a;
    for (let n = 1; n < 100; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < 1e-10) break;
    }

    return Math.exp(-x + a * Math.log(x) - this.logGamma(a)) * sum;
  }

  private static logGamma(z: number): number {
    // Stirling's approximation
    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - this.logGamma(1 - z);

    z -= 1;
    const coefficients = [
      0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
    ];

    let x = coefficients[0];
    for (let i = 1; i < 9; i++) {
      x += coefficients[i] / (z + i);
    }

    const t = z + 7.5;
    return Math.log(Math.sqrt(2 * Math.PI)) + Math.log(x) + (z + 0.5) * Math.log(t) - t;
  }

  private static ksPValue(D: number, n: number): number {
    // Approximation for large n
    const lambda = (Math.sqrt(n) + 0.12 + 0.11 / Math.sqrt(n)) * D;
    let sum = 0;
    for (let k = 1; k <= 10; k++) {
      sum += Math.pow(-1, k - 1) * Math.exp(-2 * k * k * lambda * lambda);
    }
    return 2 * sum;
  }

  private static shapiroWilkCoefficients(n: number): number[] {
    // Simplified coefficients for Shapiro-Wilk test
    // This is a placeholder - full implementation would use actual tables
    const k = Math.floor(n / 2);
    const a = new Array(k);
    for (let i = 0; i < k; i++) {
      a[i] = 1.0; // Simplified - real implementation uses computed values
    }
    return a;
  }

  private static shapiroWilkPValue(W: number, n: number): number {
    // Approximation - real implementation would use lookup tables
    if (W > 0.95) return 0.5; // Likely normal
    if (W < 0.90) return 0.01; // Likely not normal
    return 0.1; // Borderline
  }

  private static andersonDarlingPValue(A2: number, n: number): number {
    // Approximation for exponential distribution
    const A2star = A2 * (1 + 0.6 / n);
    if (A2star < 0.2) return 1 - Math.exp(-13.436 + 101.14 * A2star - 223.73 * A2star * A2star);
    if (A2star < 0.34) return 1 - Math.exp(-8.318 + 42.796 * A2star - 59.938 * A2star * A2star);
    if (A2star < 0.6) return Math.exp(0.9177 - 4.279 * A2star - 1.38 * A2star * A2star);
    return Math.exp(1.2937 - 5.709 * A2star + 0.0186 * A2star * A2star);
  }

  /**
   * Calculate confidence interval for mean
   */
  static confidenceInterval(samples: number[], confidence: number = 0.95): { mean: number; lower: number; upper: number } {
    const n = samples.length;
    const mean = samples.reduce((a, b) => a + b, 0) / n;
    const variance = samples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1);
    const stdError = Math.sqrt(variance / n);

    // Use t-distribution for small samples, normal for large
    const tValue = n < 30 ? this.tValue(confidence, n - 1) : this.zValue(confidence);
    const margin = tValue * stdError;

    return { mean, lower: mean - margin, upper: mean + margin };
  }

  private static tValue(confidence: number, df: number): number {
    // Approximate t-values for common confidence levels
    if (confidence === 0.95) {
      if (df >= 30) return 1.96;
      if (df >= 20) return 2.086;
      if (df >= 10) return 2.228;
      return 2.5; // Conservative for small df
    }
    return 2.0; // Default approximation
  }

  private static zValue(confidence: number): number {
    if (confidence === 0.95) return 1.96;
    if (confidence === 0.99) return 2.576;
    if (confidence === 0.90) return 1.645;
    return 1.96; // Default
  }
}
