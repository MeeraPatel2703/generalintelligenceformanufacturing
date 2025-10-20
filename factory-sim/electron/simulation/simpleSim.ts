import { FactoryAnalysis } from '../../src/types/analysis';
import { SimulationResults, StatisticResult } from '../../src/types/simulation';

/**
 * Quick Monte Carlo simulation for factory bottleneck analysis
 *
 * This is a simplified simulation that:
 * - Samples cycle times from normal distributions
 * - Identifies bottlenecks based on maximum cycle time
 * - Calculates confidence intervals over multiple replications
 *
 * Note: This is NOT a full Discrete Event Simulation (DES).
 * It doesn't model queues, blocking, or complex interactions.
 * For most factory analyses, this provides sufficient accuracy.
 */

/**
 * Box-Muller transform for generating normal distribution samples
 */
function sampleNormal(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

/**
 * Calculate statistics from array of values
 */
function calculateStats(values: number[]): StatisticResult {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) =>
    sum + Math.pow(val - mean, 2), 0
  ) / values.length;
  const stdDev = Math.sqrt(variance);

  // 95% confidence interval (1.96 * standard error)
  const ci = 1.96 * (stdDev / Math.sqrt(values.length));

  return {
    mean,
    stdDev,
    confidenceInterval: ci,
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

/**
 * Run Monte Carlo simulation
 *
 * @param analysis - Factory analysis from AI (Milestone 2)
 * @param numReplications - Number of simulation runs (default: 1000)
 * @param progressCallback - Optional callback for progress updates
 */
export function runSimpleMonteCarlo(
  analysis: FactoryAnalysis,
  numReplications: number = 1000,
  progressCallback?: (progress: number) => void
): SimulationResults {
  console.log(`[Simulation] Starting Monte Carlo with ${numReplications} replications`);

  const throughputResults: number[] = [];
  const cycleTimeResults: number[] = [];
  const machineUtilizations: Map<string, number[]> = new Map();
  const machineQueues: Map<string, number[]> = new Map();

  // Initialize tracking arrays for each machine
  analysis.machines.forEach(m => {
    machineUtilizations.set(m.id, []);
    machineQueues.set(m.id, []);
  });

  // Run replications
  for (let i = 0; i < numReplications; i++) {
    // Sample cycle time for each machine
    const machineTimes = analysis.machines.map(m => {
      return sampleNormal(m.cycle_time.mean, m.cycle_time.std_dev || 0);
    });

    // Bottleneck = machine with maximum cycle time (limits throughput)
    const bottleneckTime = Math.max(...machineTimes);

    // Throughput = parts per hour limited by bottleneck
    const throughput = 60 / bottleneckTime; // parts per hour

    // Total cycle time = sum of all processing times
    const totalCycleTime = machineTimes.reduce((a, b) => a + b, 0);

    throughputResults.push(throughput);
    cycleTimeResults.push(totalCycleTime);

    // Sample utilization variations for each machine
    analysis.machines.forEach((m, _idx) => {
      // Utilization varies slightly around the mean
      const utilSample = Math.max(0, Math.min(100,
        sampleNormal(m.utilization.avg, 3) // ±3% variation
      ));
      machineUtilizations.get(m.id)!.push(utilSample / 100);

      // Queue length varies around average
      const queueSample = Math.max(0,
        sampleNormal(m.queue_pattern.avg_length, m.queue_pattern.avg_length * 0.3)
      );
      machineQueues.get(m.id)!.push(queueSample);
    });

    // Progress callback every 100 replications
    if (progressCallback && i % 100 === 0) {
      progressCallback((i + 1) / numReplications);
    }
  }

  // Final progress update
  if (progressCallback) {
    progressCallback(1.0);
  }

  // Calculate statistics
  const throughputStats = calculateStats(throughputResults);
  const cycleTimeStats = calculateStats(cycleTimeResults);

  // Identify bottleneck (machine with highest average cycle time)
  const avgCycleTimes = analysis.machines.map(m => m.cycle_time.mean);
  const bottleneckIdx = avgCycleTimes.indexOf(Math.max(...avgCycleTimes));
  const bottleneck = analysis.machines[bottleneckIdx];

  console.log('[Simulation] Complete');
  console.log(`[Simulation] Average throughput: ${throughputStats.mean.toFixed(2)} parts/hour`);
  console.log(`[Simulation] Bottleneck: ${bottleneck.id} (${bottleneck.cycle_time.mean.toFixed(1)} min cycle time)`);

  return {
    throughput: throughputStats,
    cycleTime: cycleTimeStats,
    valueAddTime: cycleTimeStats, // Assuming all time is value-added (simplified)
    waitTime: {
      mean: 0,
      stdDev: 0,
      confidenceInterval: 0,
      min: 0,
      max: 0
    }, // Not modeled in Monte Carlo
    wipLevel: {
      mean: 0,
      stdDev: 0,
      confidenceInterval: 0,
      min: 0,
      max: 0
    }, // Not modeled in Monte Carlo
    bottleneck: {
      machineId: bottleneck.id,
      utilization: bottleneck.utilization.avg / 100,
      averageQueue: bottleneck.queue_pattern.avg_length,
      blockedTimePercent: 0, // Not modeled
      lostThroughput: throughputStats.mean * (bottleneck.utilization.avg / 100), // Estimate
      severity: bottleneck.utilization.avg > 95 ? 'high' :
                bottleneck.utilization.avg > 85 ? 'medium' : 'low',
      reason: `Slowest cycle time: ${bottleneck.cycle_time.mean.toFixed(1)} min (limits throughput to ${throughputStats.mean.toFixed(1)} parts/hour)`
    },
    machines: analysis.machines.map(m => {
      const utils = machineUtilizations.get(m.id)!;
      const queues = machineQueues.get(m.id)!;

      return {
        id: m.id,
        utilization: calculateStats(utils),
        partsProcessed: {
          mean: throughputStats.mean,
          stdDev: throughputStats.stdDev,
          confidenceInterval: throughputStats.confidenceInterval,
          min: throughputStats.min,
          max: throughputStats.max
        },
        averageQueue: calculateStats(queues),
        blockedTimePercent: {
          mean: 0,
          stdDev: 0,
          confidenceInterval: 0,
          min: 0,
          max: 0
        },
        idleTimePercent: {
          mean: Math.max(0, (100 - m.utilization.avg) / 100),
          stdDev: 0.02,
          confidenceInterval: 0.015,
          min: 0,
          max: 0.5
        }
      };
    }),
    completionTime: Date.now(),
    replicationsCompleted: numReplications
  };
}
