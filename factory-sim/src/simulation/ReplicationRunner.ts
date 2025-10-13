/**
 * Replication Runner and Output Analyzer
 *
 * Handles multiple simulation replications and statistical analysis
 * Matches Simio's experimental design and output analysis capabilities
 */

import { AdvancedDESEngine, SimulationConfig, SimulationStats } from './AdvancedDESEngine';
import { Statistics } from './StatisticalDistributions';

export interface ReplicationConfig {
  numberOfReplications: number;
  baseRandomSeed: number;
  confidenceLevel: number; // 0.90, 0.95, 0.99
  runLength: number;
  warmupPeriod: number;
}

export interface OutputStatistic {
  name: string;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  median: number;
  confidenceInterval: {
    level: number;
    lower: number;
    upper: number;
    halfWidth: number;
  };
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

export interface ReplicationResults {
  summary: {
    numberOfReplications: number;
    averageReplicationTime: number;
    totalSimulationTime: number;
  };
  outputs: Map<string, OutputStatistic>;
  rawData: Map<string, number[]>;
  convergence: {
    converged: boolean;
    requiredReplications: number;
    targetHalfWidth: number;
    actualHalfWidth: number;
  };
}

export class ReplicationRunner {
  private config: ReplicationConfig;
  private results: Map<string, number[]> = new Map();
  private replicationTimes: number[] = [];

  constructor(config: Partial<ReplicationConfig> = {}) {
    this.config = {
      numberOfReplications: config.numberOfReplications || 30,
      baseRandomSeed: config.baseRandomSeed || 12345,
      confidenceLevel: config.confidenceLevel || 0.95,
      runLength: config.runLength || 1000,
      warmupPeriod: config.warmupPeriod || 100
    };
  }

  /**
   * Run multiple replications of a simulation
   */
  async runReplications(
    setupEngine: (engine: AdvancedDESEngine) => void,
    progressCallback?: (current: number, total: number) => void
  ): Promise<ReplicationResults> {
    console.log(`[ReplicationRunner] Starting ${this.config.numberOfReplications} replications...`);

    this.results.clear();
    this.replicationTimes = [];

    for (let rep = 0; rep < this.config.numberOfReplications; rep++) {
      const repStart = Date.now();

      // Create engine with unique seed for this replication
      const seed = this.config.baseRandomSeed + rep * 1000;
      const engine = new AdvancedDESEngine({
        startTime: 0,
        endTime: this.config.runLength,
        warmupTime: this.config.warmupPeriod,
        seed,
        collectDetailedStats: true
      });

      // Setup engine (add resources, processes, etc.)
      setupEngine(engine);

      // Initialize and run
      engine.initialize();
      engine.run();

      // Collect results
      const stats = engine.getStats();
      this.collectReplicationData(rep, stats);

      const repTime = (Date.now() - repStart) / 1000;
      this.replicationTimes.push(repTime);

      console.log(`[ReplicationRunner] Completed replication ${rep + 1}/${this.config.numberOfReplications} in ${repTime.toFixed(2)}s`);

      if (progressCallback) {
        progressCallback(rep + 1, this.config.numberOfReplications);
      }

      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    return this.analyzeResults();
  }

  /**
   * Collect data from a single replication
   */
  private collectReplicationData(repNumber: number, stats: SimulationStats): void {
    // System-wide metrics
    this.addResult('TotalEntitiesCreated', stats.totalEntitiesCreated);
    this.addResult('TotalEntitiesCompleted', stats.totalEntitiesCompleted);
    this.addResult('AvgTimeInSystem', stats.avgTimeInSystem);
    this.addResult('AvgWaitTime', stats.avgWaitTime);
    this.addResult('AvgProcessTime', stats.avgProcessTime);
    this.addResult('MaxTimeInSystem', stats.maxTimeInSystem);
    this.addResult('Throughput', stats.throughput);
    this.addResult('ThroughputPerHour', stats.throughput * 60);

    // Resource-specific metrics
    stats.resourceStats.forEach((resourceStat, resourceId) => {
      this.addResult(`${resourceId}_Utilization`, resourceStat.utilization);
      this.addResult(`${resourceId}_MaxQueue`, resourceStat.maxQueueLength);
      this.addResult(`${resourceId}_AvgQueue`, resourceStat.avgQueueLength);
      this.addResult(`${resourceId}_AvgWaitTime`, resourceStat.avgWaitTime);
      this.addResult(`${resourceId}_Availability`, resourceStat.availability);
    });
  }

  private addResult(metricName: string, value: number): void {
    if (!this.results.has(metricName)) {
      this.results.set(metricName, []);
    }
    this.results.get(metricName)!.push(value);
  }

  /**
   * Analyze results across all replications
   */
  private analyzeResults(): ReplicationResults {
    const outputs = new Map<string, OutputStatistic>();

    // Analyze each metric
    this.results.forEach((values, metricName) => {
      const stat = this.computeOutputStatistic(metricName, values);
      outputs.set(metricName, stat);
    });

    // Check for convergence
    const primaryMetric = this.results.get('AvgTimeInSystem') || [];
    const convergence = this.checkConvergence(primaryMetric);

    return {
      summary: {
        numberOfReplications: this.config.numberOfReplications,
        averageReplicationTime: Statistics.mean(this.replicationTimes),
        totalSimulationTime: Statistics.sum(this.replicationTimes)
      },
      outputs,
      rawData: this.results,
      convergence
    };
  }

  /**
   * Compute comprehensive statistics for a single output
   */
  private computeOutputStatistic(name: string, values: number[]): OutputStatistic {
    const mean = Statistics.mean(values);
    const stdDev = Statistics.stdDev(values);
    const min = Statistics.min(values);
    const max = Statistics.max(values);
    const median = Statistics.median(values);

    // Confidence interval
    const ci = this.computeConfidenceInterval(values, this.config.confidenceLevel);

    // Percentiles
    const percentiles = {
      p10: Statistics.percentile(values, 10),
      p25: Statistics.percentile(values, 25),
      p50: Statistics.percentile(values, 50),
      p75: Statistics.percentile(values, 75),
      p90: Statistics.percentile(values, 90),
      p95: Statistics.percentile(values, 95),
      p99: Statistics.percentile(values, 99)
    };

    return {
      name,
      mean,
      stdDev,
      min,
      max,
      median,
      confidenceInterval: ci,
      percentiles
    };
  }

  /**
   * Compute confidence interval using t-distribution
   */
  private computeConfidenceInterval(
    values: number[],
    confidenceLevel: number
  ): { level: number; lower: number; upper: number; halfWidth: number } {
    const n = values.length;
    const mean = Statistics.mean(values);
    const stdDev = Statistics.stdDev(values);

    // t-value lookup (simplified - use approximation)
    const tValue = this.getTValue(n - 1, confidenceLevel);
    const halfWidth = tValue * (stdDev / Math.sqrt(n));

    return {
      level: confidenceLevel,
      lower: mean - halfWidth,
      upper: mean + halfWidth,
      halfWidth
    };
  }

  /**
   * Get t-distribution critical value (simplified lookup table)
   */
  private getTValue(degreesOfFreedom: number, confidenceLevel: number): number {
    // Simplified t-table for common confidence levels
    // For large df, approaches normal distribution
    if (degreesOfFreedom >= 30) {
      if (confidenceLevel === 0.90) return 1.645;
      if (confidenceLevel === 0.95) return 1.96;
      if (confidenceLevel === 0.99) return 2.576;
    } else if (degreesOfFreedom >= 20) {
      if (confidenceLevel === 0.90) return 1.725;
      if (confidenceLevel === 0.95) return 2.086;
      if (confidenceLevel === 0.99) return 2.845;
    } else if (degreesOfFreedom >= 10) {
      if (confidenceLevel === 0.90) return 1.812;
      if (confidenceLevel === 0.95) return 2.228;
      if (confidenceLevel === 0.99) return 3.169;
    }

    // Default to 95% CI
    return 2.0;
  }

  /**
   * Check if results have converged
   * Uses sequential procedure to determine if enough replications have been run
   */
  private checkConvergence(
    values: number[],
    targetRelativeError: number = 0.05
  ): {
    converged: boolean;
    requiredReplications: number;
    targetHalfWidth: number;
    actualHalfWidth: number;
  } {
    const n = values.length;
    const mean = Statistics.mean(values);
    const stdDev = Statistics.stdDev(values);
    const tValue = this.getTValue(n - 1, this.config.confidenceLevel);

    const actualHalfWidth = tValue * (stdDev / Math.sqrt(n));
    const targetHalfWidth = targetRelativeError * Math.abs(mean);

    // Estimate required replications using sample size formula
    const requiredN = Math.ceil(
      Math.pow((tValue * stdDev) / targetHalfWidth, 2)
    );

    return {
      converged: actualHalfWidth <= targetHalfWidth,
      requiredReplications: Math.max(n, requiredN),
      targetHalfWidth,
      actualHalfWidth
    };
  }

  /**
   * Export results to CSV
   */
  exportToCSV(results: ReplicationResults): string {
    const lines: string[] = [];

    // Header
    lines.push('Metric,Mean,StdDev,Min,Max,Median,CI_Lower,CI_Upper,CI_HalfWidth');

    // Data rows
    results.outputs.forEach((stat, name) => {
      lines.push([
        name,
        stat.mean.toFixed(4),
        stat.stdDev.toFixed(4),
        stat.min.toFixed(4),
        stat.max.toFixed(4),
        stat.median.toFixed(4),
        stat.confidenceInterval.lower.toFixed(4),
        stat.confidenceInterval.upper.toFixed(4),
        stat.confidenceInterval.halfWidth.toFixed(4)
      ].join(','));
    });

    return lines.join('\n');
  }

  /**
   * Generate text report
   */
  generateReport(results: ReplicationResults): string {
    const report: string[] = [];

    report.push('='.repeat(80));
    report.push('SIMULATION OUTPUT ANALYSIS REPORT');
    report.push('='.repeat(80));
    report.push('');

    // Summary
    report.push('SUMMARY');
    report.push('-'.repeat(80));
    report.push(`Number of Replications: ${results.summary.numberOfReplications}`);
    report.push(`Average Replication Time: ${results.summary.averageReplicationTime.toFixed(2)}s`);
    report.push(`Total Simulation Time: ${results.summary.totalSimulationTime.toFixed(2)}s`);
    report.push(`Confidence Level: ${(this.config.confidenceLevel * 100).toFixed(0)}%`);
    report.push('');

    // Convergence
    report.push('CONVERGENCE ANALYSIS');
    report.push('-'.repeat(80));
    report.push(`Converged: ${results.convergence.converged ? 'YES' : 'NO'}`);
    report.push(`Required Replications: ${results.convergence.requiredReplications}`);
    report.push(`Target Half-Width: ${results.convergence.targetHalfWidth.toFixed(4)}`);
    report.push(`Actual Half-Width: ${results.convergence.actualHalfWidth.toFixed(4)}`);
    report.push('');

    // Key outputs
    report.push('KEY PERFORMANCE INDICATORS');
    report.push('-'.repeat(80));

    const keyMetrics = [
      'AvgTimeInSystem',
      'ThroughputPerHour',
      'AvgWaitTime',
      'TotalEntitiesCompleted'
    ];

    keyMetrics.forEach(metricName => {
      const stat = results.outputs.get(metricName);
      if (stat) {
        report.push(`\n${stat.name}:`);
        report.push(`  Mean: ${stat.mean.toFixed(4)}`);
        report.push(`  StdDev: ${stat.stdDev.toFixed(4)}`);
        report.push(`  ${(this.config.confidenceLevel * 100).toFixed(0)}% CI: [${stat.confidenceInterval.lower.toFixed(4)}, ${stat.confidenceInterval.upper.toFixed(4)}]`);
        report.push(`  Min: ${stat.min.toFixed(4)}, Max: ${stat.max.toFixed(4)}`);
      }
    });

    report.push('');
    report.push('='.repeat(80));

    return report.join('\n');
  }
}
