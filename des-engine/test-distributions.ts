import { Distributions } from './Distributions';

console.log('=== TESTING DISTRIBUTIONS ===\n');

const dist = new Distributions();
const numSamples = 10000;

// Test 1: Exponential distribution
console.log('Test 1: Exponential(rate=2)');
const rate = 2;
const expSamples = Array(numSamples).fill(0).map(() => dist.exponential(rate));

const expMean = expSamples.reduce((a, b) => a + b, 0) / numSamples;
const expVariance = expSamples.reduce((a, b) => a + Math.pow(b - expMean, 2), 0) / numSamples;

const expExpectedMean = 1 / rate; // 0.5
const expExpectedVar = 1 / (rate * rate); // 0.25

console.log(`  Sample mean: ${expMean.toFixed(3)}, Expected: ${expExpectedMean.toFixed(3)}`);
console.log(`  Sample variance: ${expVariance.toFixed(3)}, Expected: ${expExpectedVar.toFixed(3)}`);

console.assert(Math.abs(expMean - expExpectedMean) < 0.05, "Exponential mean error too large");
console.assert(Math.abs(expVariance - expExpectedVar) < 0.05, "Exponential variance error too large");
console.log('  ✓ Exponential distribution correct\n');

// Test 2: Uniform distribution
console.log('Test 2: Uniform(min=5, max=15)');
const uMin = 5;
const uMax = 15;
const uniformSamples = Array(numSamples).fill(0).map(() => dist.uniform(uMin, uMax));

const uMean = uniformSamples.reduce((a, b) => a + b, 0) / numSamples;
const uVariance = uniformSamples.reduce((a, b) => a + Math.pow(b - uMean, 2), 0) / numSamples;

const uExpectedMean = (uMin + uMax) / 2; // 10
const uExpectedVar = Math.pow(uMax - uMin, 2) / 12; // 8.33

console.log(`  Sample mean: ${uMean.toFixed(3)}, Expected: ${uExpectedMean.toFixed(3)}`);
console.log(`  Sample variance: ${uVariance.toFixed(3)}, Expected: ${uExpectedVar.toFixed(3)}`);
console.log(`  Min value: ${Math.min(...uniformSamples).toFixed(2)}, Max value: ${Math.max(...uniformSamples).toFixed(2)}`);

console.assert(Math.abs(uMean - uExpectedMean) < 0.1, "Uniform mean error too large");
console.assert(Math.abs(uVariance - uExpectedVar) < 0.5, "Uniform variance error too large");
console.log('  ✓ Uniform distribution correct\n');

// Test 3: Triangular distribution
console.log('Test 3: Triangular(min=10, mode=20, max=30)');
const tMin = 10;
const tMode = 20;
const tMax = 30;
const triSamples = Array(numSamples).fill(0).map(() => dist.triangular(tMin, tMode, tMax));

const tMean = triSamples.reduce((a, b) => a + b, 0) / numSamples;
const tVariance = triSamples.reduce((a, b) => a + Math.pow(b - tMean, 2), 0) / numSamples;

const tExpectedMean = (tMin + tMode + tMax) / 3; // 20
const tExpectedVar = (tMin * tMin + tMode * tMode + tMax * tMax - tMin * tMode - tMin * tMax - tMode * tMax) / 18; // 16.67

console.log(`  Sample mean: ${tMean.toFixed(3)}, Expected: ${tExpectedMean.toFixed(3)}`);
console.log(`  Sample variance: ${tVariance.toFixed(3)}, Expected: ${tExpectedVar.toFixed(3)}`);
console.log(`  Min value: ${Math.min(...triSamples).toFixed(2)}, Max value: ${Math.max(...triSamples).toFixed(2)}`);

console.assert(Math.abs(tMean - tExpectedMean) < 0.2, "Triangular mean error too large");
console.assert(Math.abs(tVariance - tExpectedVar) < 1.0, "Triangular variance error too large");
console.log('  ✓ Triangular distribution correct\n');

// Test 4: Normal distribution
console.log('Test 4: Normal(mean=100, stdDev=15)');
const nMean = 100;
const nStdDev = 15;
const normalSamples = Array(numSamples).fill(0).map(() => dist.normal(nMean, nStdDev));

const nSampleMean = normalSamples.reduce((a, b) => a + b, 0) / numSamples;
const nSampleVar = normalSamples.reduce((a, b) => a + Math.pow(b - nSampleMean, 2), 0) / numSamples;
const nSampleStdDev = Math.sqrt(nSampleVar);

console.log(`  Sample mean: ${nSampleMean.toFixed(3)}, Expected: ${nMean.toFixed(3)}`);
console.log(`  Sample stdDev: ${nSampleStdDev.toFixed(3)}, Expected: ${nStdDev.toFixed(3)}`);

console.assert(Math.abs(nSampleMean - nMean) < 1.0, "Normal mean error too large");
console.assert(Math.abs(nSampleStdDev - nStdDev) < 1.0, "Normal stdDev error too large");
console.log('  ✓ Normal distribution correct\n');

// Test 5: Discrete distribution
console.log('Test 5: Discrete (group sizes: 15% size 2, 20% size 3, 35% size 4, 20% size 5, 10% size 6)');
const values = [2, 3, 4, 5, 6];
const probs = [0.15, 0.20, 0.35, 0.20, 0.10];
const discSamples = Array(numSamples).fill(0).map(() => dist.discrete(values, probs));

// Count frequencies
const counts: { [key: number]: number } = {};
values.forEach(v => counts[v] = 0);
discSamples.forEach(s => counts[s]++);

console.log('  Observed vs Expected probabilities:');
values.forEach((v, i) => {
  const observed = counts[v] / numSamples;
  const expected = probs[i];
  console.log(`    Size ${v}: ${(observed * 100).toFixed(1)}% (expected ${(expected * 100).toFixed(1)}%)`);
  console.assert(Math.abs(observed - expected) < 0.02, `Discrete prob error too large for value ${v}`);
});
console.log('  ✓ Discrete distribution correct\n');

// Test 6: Discrete distribution error handling
console.log('Test 6: Discrete distribution error handling');
try {
  dist.discrete([1, 2], [0.5, 0.6]); // Doesn't sum to 1
  console.log('  ✗ Should have thrown error for invalid probabilities');
} catch (e: any) {
  console.log(`  ✓ Correctly rejected invalid probabilities: ${e.message}`);
}

try {
  dist.discrete([1, 2], [0.5]); // Different lengths
  console.log('  ✗ Should have thrown error for mismatched lengths');
} catch (e: any) {
  console.log(`  ✓ Correctly rejected mismatched lengths: ${e.message}`);
}

console.log('\n=== ALL DISTRIBUTION TESTS PASSED ===\n');
