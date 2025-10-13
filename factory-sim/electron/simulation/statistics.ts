/**
 * Statistics Collector
 *
 * Collects and aggregates statistics across multiple simulation replications.
 * Calculates means, standard deviations, and confidence intervals.
 */

import { StatisticResult, ReplicationResult } from '../../src/types/simulation';

/**
 * Time-weighted statistic (for continuous variables like utilization)
 */
class TimeWeightedStat {
  private lastValue: number = 0;
  private lastTime: number = 0;
  private area: number = 0;

  update(value: number, time: number): void {
    if (this.lastTime > 0) {
      const duration = time - this.lastTime;
      this.area += this.lastValue * duration;
    }
    this.lastValue = value;
    this.lastTime = time;
  }

  getMean(totalTime: number): number {
    return totalTime > 0 ? this.area / totalTime : 0;
  }

  reset(): void {
    this.lastValue = 0;
    this.lastTime = 0;
    this.area = 0;
  }
}

/**
 * Sample statistic (for discrete observations like cycle times)
 */
class SampleStat {
  private values: number[] = [];

  record(value: number): void {
    this.values.push(value);
  }

  getValues(): number[] {
    return this.values;
  }

  getCount(): number {
    return this.values.length;
  }

  getMean(): number {
    if (this.values.length === 0) return 0;
    return this.values.reduce((sum, val) => sum + val, 0) / this.values.length;
  }

  getStdDev(): number {
    if (this.values.length === 0) return 0;
    const mean = this.getMean();
    const variance = this.values.reduce((sum, val) =>
      sum + Math.pow(val - mean, 2), 0
    ) / this.values.length;
    return Math.sqrt(variance);
  }

  getMin(): number {
    return this.values.length > 0 ? Math.min(...this.values) : 0;
  }

  getMax(): number {
    return this.values.length > 0 ? Math.max(...this.values) : 0;
  }

  reset(): void {
    this.values = [];
  }
}

/**
 * Statistics collector for a single replication
 */
export class ReplicationStatistics {
  // Time-weighted statistics (continuous)
  private timeWeightedStats: Map<string, TimeWeightedStat> = new Map();

  // Sample statistics (discrete)
  private sampleStats: Map<string, SampleStat> = new Map();

  // Simulation time tracking
  private startTime: number = 0;
  private endTime: number = 0;

  constructor() {}

  /**
   * Record time-weighted observation
   */
  recordTimeWeighted(name: string, value: number, time: number): void {
    if (!this.timeWeightedStats.has(name)) {
      this.timeWeightedStats.set(name, new TimeWeightedStat());
    }
    this.timeWeightedStats.get(name)!.update(value, time);
  }

  /**
   * Record sample observation
   */
  recordSample(name: string, value: number): void {
    if (!this.sampleStats.has(name)) {
      this.sampleStats.set(name, new SampleStat());
    }
    this.sampleStats.get(name)!.record(value);
  }

  /**
   * Set simulation time bounds
   */
  setTimeBounds(startTime: number, endTime: number): void {
    this.startTime = startTime;
    this.endTime = endTime;
  }

  /**
   * Get time-weighted mean
   */
  getTimeWeightedMean(name: string): number {
    const stat = this.timeWeightedStats.get(name);
    if (!stat) return 0;
    return stat.getMean(this.endTime - this.startTime);
  }

  /**
   * Get sample statistic
   */
  getSampleStat(name: string): SampleStat | null {
    return this.sampleStats.get(name) || null;
  }

  /**
   * Reset all statistics
   */
  reset(): void {
    this.timeWeightedStats.clear();
    this.sampleStats.clear();
    this.startTime = 0;
    this.endTime = 0;
  }
}

/**
 * Aggregate statistics across multiple replications
 */
export class AggregateStatistics {
  /**
   * Calculate aggregate statistics from replication results
   */
  static aggregate(replications: ReplicationResult[]): {
    [key: string]: StatisticResult;
  } {
    const results: { [key: string]: StatisticResult } = {};

    if (replications.length === 0) return results;

    // Aggregate each metric
    const metrics = [
      'throughput',
      'cycleTime',
      'valueAddTime',
      'waitTime',
      'wipLevel'
    ];

    for (const metric of metrics) {
      const values = replications.map(rep => (rep as any)[metric]);
      results[metric] = this.calculateStatResult(values);
    }

    return results;
  }

  /**
   * Calculate StatisticResult from array of values
   */
  static calculateStatResult(values: number[]): StatisticResult {
    if (values.length === 0) {
      return {
        mean: 0,
        stdDev: 0,
        confidenceInterval: 0,
        min: 0,
        max: 0
      };
    }

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

    const variance = values.reduce((sum, val) =>
      sum + Math.pow(val - mean, 2), 0
    ) / values.length;

    const stdDev = Math.sqrt(variance);

    // 95% confidence interval (t-distribution approximation with z=1.96)
    const confidenceInterval = 1.96 * (stdDev / Math.sqrt(values.length));

    return {
      mean,
      stdDev,
      confidenceInterval,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  /**
   * Calculate aggregate machine statistics
   */
  static aggregateMachineStats(
    replications: ReplicationResult[],
    machineIds: string[]
  ): Map<string, any> {
    const machineStats = new Map();

    for (const machineId of machineIds) {
      // Utilization
      const utilValues = replications.map(rep =>
        rep.machineUtilization[machineId] || 0
      );

      // Queue lengths
      const queueValues = replications.map(rep =>
        rep.machineQueues[machineId] || 0
      );

      // Blocked time
      const blockedValues = replications.map(rep =>
        rep.machineBlocked[machineId] || 0
      );

      // Parts processed
      const partsValues = replications.map(rep =>
        rep.machinePartsProcessed[machineId] || 0
      );

      machineStats.set(machineId, {
        utilization: this.calculateStatResult(utilValues),
        averageQueue: this.calculateStatResult(queueValues),
        blockedTimePercent: this.calculateStatResult(blockedValues),
        partsProcessed: this.calculateStatResult(partsValues),
        idleTimePercent: this.calculateStatResult(
          utilValues.map(u => 1 - u - (blockedValues[utilValues.indexOf(u)] || 0))
        )
      });
    }

    return machineStats;
  }
}
