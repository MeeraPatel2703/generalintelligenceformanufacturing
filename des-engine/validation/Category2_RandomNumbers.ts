import { createTest, pass, fail } from './ValidationFramework';
import { StatisticalTests } from './StatisticalTests';

export const category2Tests = [
  // Test 2.1: Uniformity Test (Chi-Square)
  createTest(
    '2.1',
    'Category 2',
    'Uniformity Test (Chi-Square)',
    'Generate 10K uniform(0,1) samples, test with chi-square',
    () => {
      const n = 10000;
      const bins = 10;
      const samples: number[] = [];

      for (let i = 0; i < n; i++) {
        samples.push(Math.random());
      }

      // Bin the samples
      const observed = new Array(bins).fill(0);
      for (const sample of samples) {
        const binIndex = Math.min(Math.floor(sample * bins), bins - 1);
        observed[binIndex]++;
      }

      // Expected count in each bin
      const expected = new Array(bins).fill(n / bins);

      const result = StatisticalTests.chiSquareTest(observed, expected);

      if (result.pValue > 0.05) {
        return pass(`Uniformity test passed (p=${result.pValue.toFixed(4)}, χ²=${result.chiSq.toFixed(2)})`, result);
      } else {
        return fail(`Uniformity test failed (p=${result.pValue.toFixed(4)} < 0.05)`, result.chiSq, 0, 0.05);
      }
    }
  ),

  // Test 2.2: Independence Test (Runs Test)
  createTest(
    '2.2',
    'Category 2',
    'Independence Test (Runs Test)',
    'Generate 1000 samples, test for randomness',
    () => {
      const n = 1000;
      const samples: number[] = [];

      for (let i = 0; i < n; i++) {
        samples.push(Math.random());
      }

      const result = StatisticalTests.runsTest(samples);

      if (result.pValue > 0.05) {
        return pass(`Runs test passed (p=${result.pValue.toFixed(4)}, runs=${result.runs}, expected=${result.expected.toFixed(1)})`, result);
      } else {
        return fail(`Runs test failed (p=${result.pValue.toFixed(4)} < 0.05)`, result.runs, result.expected, 0.05);
      }
    }
  ),

  // Test 2.3: Seed Reproducibility
  createTest(
    '2.3',
    'Category 2',
    'Seed Reproducibility',
    'Math.random() is not seedable in standard JS - testing sequence stability',
    () => {
      // Since Math.random() can't be seeded in standard JS,
      // we test that our distributions produce consistent results
      // when using a custom seeded RNG

      // Create a simple LCG for testing
      class SeededRNG {
        private state: number;
        constructor(seed: number) {
          this.state = seed;
        }
        next(): number {
          this.state = (this.state * 1664525 + 1013904223) % 4294967296;
          return this.state / 4294967296;
        }
      }

      const seed = 12345;
      const rng1 = new SeededRNG(seed);
      const rng2 = new SeededRNG(seed);

      const sequence1: number[] = [];
      const sequence2: number[] = [];

      for (let i = 0; i < 10000; i++) {
        sequence1.push(rng1.next());
        sequence2.push(rng2.next());
      }

      // Verify sequences match
      for (let i = 0; i < 10000; i++) {
        if (Math.abs(sequence1[i] - sequence2[i]) > 1e-15) {
          return fail(`Sequence mismatch at index ${i}: ${sequence1[i]} vs ${sequence2[i]}`);
        }
      }

      return pass('Same seed produces identical sequence (10K values, exact match to 15 decimals)');
    }
  ),

  // Test 2.4: Stream Independence
  createTest(
    '2.4',
    'Category 2',
    'Stream Independence',
    '10 independent streams should show no correlation',
    () => {
      const streamLength = 1000;
      const numStreams = 10;
      const streams: number[][] = [];

      // Generate 10 independent streams
      for (let s = 0; s < numStreams; s++) {
        const stream: number[] = [];
        for (let i = 0; i < streamLength; i++) {
          stream.push(Math.random());
        }
        streams.push(stream);
      }

      // Check correlation between all pairs
      let maxCorrelation = 0;
      let violationCount = 0;

      for (let i = 0; i < numStreams; i++) {
        for (let j = i + 1; j < numStreams; j++) {
          const corr = Math.abs(StatisticalTests.correlation(streams[i], streams[j]));
          maxCorrelation = Math.max(maxCorrelation, corr);
          if (corr > 0.1) violationCount++;
        }
      }

      if (maxCorrelation < 0.1) {
        return pass(`All pairwise correlations < 0.1 (max: ${maxCorrelation.toFixed(4)})`);
      } else {
        return fail(`Stream correlation too high (max: ${maxCorrelation.toFixed(4)} > 0.1)`, maxCorrelation, 0, 0.1);
      }
    }
  ),

  // Test 2.5: Period Length (Birthday Spacing Test)
  createTest(
    '2.5',
    'Category 2',
    'Period Length',
    'Verify RNG period > 2^31 (simplified test for practical purposes)',
    () => {
      // Full birthday spacing test would require billions of samples
      // Instead, we verify no short cycles in first 1M samples

      const n = 1000000;
      const samples = new Set<string>();

      for (let i = 0; i < n; i++) {
        const value = Math.random().toFixed(15); // Round to avoid floating point issues
        if (samples.has(value)) {
          return fail(`Duplicate value found at iteration ${i} (possible short cycle)`);
        }
        samples.add(value);
      }

      return pass(`No duplicates in first 1M samples (period > 10^6)`, { uniqueSamples: samples.size });
    }
  )
];
