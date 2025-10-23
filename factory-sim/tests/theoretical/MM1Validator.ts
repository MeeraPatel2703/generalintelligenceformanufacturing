/**
 * M/M/1 QUEUE VALIDATION TEST
 *
 * Validates DES engine against queueing theory for single-server queues
 *
 * Test Strategy:
 * 1. Run simulation with known parameters
 * 2. Calculate theoretical values
 * 3. Compare simulation results to theory
 * 4. Verify within acceptable tolerance
 */

import { MM1Queue, QueuingUtils } from '../../src/theoretical/QueuingFormulas';
import { runMM1Replications } from '../../electron/simulation/MM1QueueSimulation';

interface ValidationResult {
  testName: string;
  lambda: number;
  mu: number;
  replications: number;
  metrics: {
    metric: string;
    theoretical: number;
    simulated: number;
    simulatedCI: [number, number];
    percentError: number;
    withinCI: boolean;
    passed: boolean;
  }[];
  overallPassed: boolean;
  executionTime: number;
}

interface SimulationMetrics {
  utilization: { mean: number; ci: [number, number] };
  avgInSystem: { mean: number; ci: [number, number] };
  avgInQueue: { mean: number; ci: [number, number] };
  avgTimeInSystem: { mean: number; ci: [number, number] };
  avgTimeInQueue: { mean: number; ci: [number, number] };
}

export class MM1Validator {
  private tolerance: number;

  constructor(tolerance: number = 0.05) {
    this.tolerance = tolerance; // 5% default tolerance
  }

  /**
   * Run a complete validation test
   */
  async validate(
    lambda: number,
    mu: number,
    replications: number = 100,
    entitiesPerReplication: number = 10000
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const testName = `M/M/1: λ=${lambda}/hr, μ=${mu}/hr`;

    console.log(`\n${'='.repeat(100)}`);
    console.log(`TEST: ${testName}`);
    console.log(`${'='.repeat(100)}\n`);

    // Calculate theoretical values
    const theory = MM1Queue.analyze(lambda, mu);

    console.log('THEORETICAL VALUES:');
    console.log(`  ρ (Utilization):     ${(theory.rho * 100).toFixed(2)}%`);
    console.log(`  L (Avg in system):   ${theory.L.toFixed(4)} customers`);
    console.log(`  Lq (Avg in queue):   ${theory.Lq.toFixed(4)} customers`);
    console.log(`  W (Time in system):  ${theory.W.toFixed(4)} hours = ${(theory.W * 60).toFixed(2)} minutes`);
    console.log(`  Wq (Time in queue):  ${theory.Wq.toFixed(4)} hours = ${(theory.Wq * 60).toFixed(2)} minutes`);
    console.log(`  P0 (Idle prob):      ${(theory.P0 * 100).toFixed(2)}%`);
    console.log(`  Stable:              ${theory.stable ? '✓ YES' : '✗ NO'}\n`);

    if (!theory.stable) {
      console.log('⚠️  SYSTEM IS UNSTABLE - Skipping simulation\n');
      return {
        testName,
        lambda,
        mu,
        replications: 0,
        metrics: [],
        overallPassed: false,
        executionTime: Date.now() - startTime
      };
    }

    // Run simulation
    console.log('RUNNING SIMULATION:');
    console.log(`  Replications: ${replications}`);
    console.log(`  Entities per replication: ${entitiesPerReplication}`);
    console.log(`  Total entities: ${replications * entitiesPerReplication}\n`);

    const simResults = await this.runSimulation(lambda, mu, replications, entitiesPerReplication);

    console.log('SIMULATION RESULTS:');
    console.log(`  ρ (Utilization):     ${(simResults.utilization.mean * 100).toFixed(2)}% [${(simResults.utilization.ci[0] * 100).toFixed(2)}%, ${(simResults.utilization.ci[1] * 100).toFixed(2)}%]`);
    console.log(`  L (Avg in system):   ${simResults.avgInSystem.mean.toFixed(4)} [${simResults.avgInSystem.ci[0].toFixed(4)}, ${simResults.avgInSystem.ci[1].toFixed(4)}]`);
    console.log(`  Lq (Avg in queue):   ${simResults.avgInQueue.mean.toFixed(4)} [${simResults.avgInQueue.ci[0].toFixed(4)}, ${simResults.avgInQueue.ci[1].toFixed(4)}]`);
    console.log(`  W (Time in system):  ${simResults.avgTimeInSystem.mean.toFixed(4)} hrs [${simResults.avgTimeInSystem.ci[0].toFixed(4)}, ${simResults.avgTimeInSystem.ci[1].toFixed(4)}]`);
    console.log(`  Wq (Time in queue):  ${simResults.avgTimeInQueue.mean.toFixed(4)} hrs [${simResults.avgTimeInQueue.ci[0].toFixed(4)}, ${simResults.avgTimeInQueue.ci[1].toFixed(4)}]\n`);

    // Compare results
    const metrics = [
      this.compareMetric('Utilization (ρ)', theory.rho, simResults.utilization.mean, simResults.utilization.ci),
      this.compareMetric('Avg in System (L)', theory.L, simResults.avgInSystem.mean, simResults.avgInSystem.ci),
      this.compareMetric('Avg in Queue (Lq)', theory.Lq, simResults.avgInQueue.mean, simResults.avgInQueue.ci),
      this.compareMetric('Time in System (W)', theory.W, simResults.avgTimeInSystem.mean, simResults.avgTimeInSystem.ci),
      this.compareMetric('Time in Queue (Wq)', theory.Wq, simResults.avgTimeInQueue.mean, simResults.avgTimeInQueue.ci),
    ];

    console.log('VALIDATION RESULTS:');
    console.log('─'.repeat(100));
    console.log(`${'Metric'.padEnd(25)} ${'Theory'.padEnd(15)} ${'Simulated'.padEnd(15)} ${'Error'.padEnd(12)} ${'Status'.padEnd(10)}`);
    console.log('─'.repeat(100));

    metrics.forEach(m => {
      const status = m.passed ? '✓ PASS' : '✗ FAIL';
      const statusColor = m.passed ? status : `\x1b[31m${status}\x1b[0m`;
      console.log(
        `${m.metric.padEnd(25)} ${m.theoretical.toFixed(4).padEnd(15)} ${m.simulated.toFixed(4).padEnd(15)} ${(m.percentError.toFixed(2) + '%').padEnd(12)} ${statusColor}`
      );
    });
    console.log('─'.repeat(100));

    const overallPassed = metrics.every(m => m.passed);
    const passRate = (metrics.filter(m => m.passed).length / metrics.length) * 100;

    console.log(`\nOVERALL: ${overallPassed ? '✓ PASSED' : '✗ FAILED'} (${passRate.toFixed(0)}% of metrics within tolerance)`);
    console.log(`Execution time: ${((Date.now() - startTime) / 1000).toFixed(2)}s\n`);

    return {
      testName,
      lambda,
      mu,
      replications,
      metrics,
      overallPassed,
      executionTime: Date.now() - startTime
    };
  }

  /**
   * Compare a single metric
   */
  private compareMetric(
    metric: string,
    theoretical: number,
    simulated: number,
    ci: [number, number]
  ) {
    const percentError = Math.abs((simulated - theoretical) / theoretical) * 100;
    const withinCI = theoretical >= ci[0] && theoretical <= ci[1];
    const passed = percentError <= this.tolerance * 100 || withinCI;

    return {
      metric,
      theoretical,
      simulated,
      simulatedCI: ci,
      percentError,
      withinCI,
      passed
    };
  }

  /**
   * Run the actual DES simulation
   * Connects to the real MM1QueueSimulation engine
   */
  private async runSimulation(
    lambda: number,
    mu: number,
    replications: number,
    entities: number
  ): Promise<SimulationMetrics> {
    // Run replications using the real DES engine
    const results = runMM1Replications({
      lambda,
      mu,
      numCustomers: entities,
      warmupCustomers: Math.floor(entities * 0.1), // 10% warmup
      seed: 12345 // Fixed seed for reproducibility
    }, replications);

    return {
      utilization: this.calculateStats(results.utilizationSamples),
      avgInSystem: this.calculateStats(results.avgNumberInSystemSamples),
      avgInQueue: this.calculateStats(results.avgNumberInQueueSamples),
      avgTimeInSystem: this.calculateStats(results.avgTimeInSystemSamples),
      avgTimeInQueue: this.calculateStats(results.avgTimeInQueueSamples)
    };
  }

  /**
   * Calculate mean and 95% confidence interval
   */
  private calculateStats(samples: number[]): { mean: number; ci: [number, number] } {
    const n = samples.length;
    const mean = samples.reduce((sum, x) => sum + x, 0) / n;
    const variance = samples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    const stderr = stdDev / Math.sqrt(n);

    // t-value for 95% CI with large n (≈1.96)
    const tValue = 1.96;
    const margin = tValue * stderr;

    return {
      mean,
      ci: [mean - margin, mean + margin]
    };
  }

  /**
   * Run a suite of standard tests
   */
  async runTestSuite(): Promise<ValidationResult[]> {
    console.log('\n\n');
    console.log('█'.repeat(100));
    console.log('M/M/1 VALIDATION TEST SUITE');
    console.log('█'.repeat(100));

    const tests = [
      { lambda: 45, mu: 60, name: 'Optimal Load (ρ=0.75)' },
      { lambda: 30, mu: 60, name: 'Light Load (ρ=0.50)' },
      { lambda: 54, mu: 60, name: 'Heavy Load (ρ=0.90)' },
      { lambda: 15, mu: 60, name: 'Very Light Load (ρ=0.25)' },
      { lambda: 57, mu: 60, name: 'Very Heavy Load (ρ=0.95)' },
    ];

    const results: ValidationResult[] = [];

    for (const test of tests) {
      console.log(`\n\n${'▼'.repeat(100)}`);
      console.log(`TEST CASE: ${test.name}`);
      console.log(`${'▼'.repeat(100)}`);

      const result = await this.validate(test.lambda, test.mu, 100, 10000);
      results.push(result);

      // Short delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    console.log('\n\n');
    console.log('█'.repeat(100));
    console.log('TEST SUITE SUMMARY');
    console.log('█'.repeat(100));
    console.log('\n');

    const passedTests = results.filter(r => r.overallPassed).length;
    const totalTests = results.length;
    const passRate = (passedTests / totalTests) * 100;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Pass Rate: ${passRate.toFixed(1)}%`);
    console.log(`\n${passRate === 100 ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}\n`);

    results.forEach((r, i) => {
      const status = r.overallPassed ? '✓' : '✗';
      console.log(`  ${status} ${tests[i].name.padEnd(30)} (ρ=${r.lambda}/${r.mu}=${(r.lambda / r.mu).toFixed(2)})`);
    });

    console.log('\n');

    return results;
  }
}

// Export convenience function
export async function validateMM1(lambda: number, mu: number, replications?: number) {
  const validator = new MM1Validator(0.05); // 5% tolerance
  return validator.validate(lambda, mu, replications);
}

export async function runMM1TestSuite() {
  const validator = new MM1Validator(0.05);
  return validator.runTestSuite();
}
