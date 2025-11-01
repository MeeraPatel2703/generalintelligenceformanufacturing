/**
 * DES Runner - Converts AI Analysis to DES Configuration
 *
 * Bridges the gap between AI-extracted parameters and the DES engine.
 * Now enhanced with comprehensive Simio-style statistics and analysis.
 */

import { SimulationEngine } from './engine';
import { ComprehensiveAnalyzer } from './ComprehensiveAnalyzer';
import { FactoryAnalysis } from '../../src/types/analysis';
import { SimulationConfig, SimulationResults, ComprehensiveSimulationResults } from '../../src/types/simulation';

/**
 * Convert AI analysis to DES simulation config
 */
export function analysisToSimConfig(analysis: FactoryAnalysis): SimulationConfig {
  // Convert machines
  const machines = analysis.machines.map(m => ({
    id: m.id,
    type: m.type as any,
    processTime: {
      distribution: 'normal' as const,
      mean: m.cycle_time.mean,
      stdDev: m.cycle_time.std_dev
    },
    capacity: Math.max(1, Math.floor(m.queue_pattern.avg_length * 2)), // Queue capacity
    mtbf: undefined,
    mttr: undefined
  }));

  // Flow sequence from AI analysis (use flow_routing or fall back to legacy)
  const flowSequence = analysis.flow_routing?.sequence || analysis.flow_sequence || [];

  // Estimate arrival rate from bottleneck utilization
  // throughput = arrival_rate (if system is not saturated)
  const bottleneckId = analysis.optimization?.bottleneck?.machine_id || analysis.bottleneck?.machine_id;
  const bottleneck = bottleneckId ? analysis.machines.find(m => m.id === bottleneckId) : undefined;
  const bottleneckCycleTime = bottleneck ? bottleneck.cycle_time.mean : 10;
  const bottleneckUtil = bottleneck ? bottleneck.utilization.avg / 100 : 0.8;

  // Arrival rate (parts/min) = utilization * (1 / cycle_time)
  const arrivalRate = bottleneckUtil * (1 / bottleneckCycleTime) * 0.9; // 90% of max to avoid saturation

  return {
    machines,
    flowSequence,
    arrivalRate,
    simulationTime: 480, // 8 hours in minutes
    warmupTime: 60,      // 1 hour warmup
    numReplications: 100, // Start with 100 for speed
    baseSeed: Date.now()
  };
}

/**
 * Run DES simulation from AI analysis
 */
export function runDESSimulation(
  analysis: FactoryAnalysis,
  numReplications: number = 100,
  progressCallback?: (progress: number) => void
): SimulationResults {
  console.log('[DES Runner] Converting AI analysis to simulation config...');

  // Convert analysis to simulation config
  const config = analysisToSimConfig(analysis);
  config.numReplications = numReplications;

  console.log('[DES Runner] Simulation config:');
  console.log(`  - Machines: ${config.machines.length}`);
  console.log(`  - Flow: ${config.flowSequence.join(' → ')}`);
  console.log(`  - Arrival rate: ${config.arrivalRate.toFixed(4)} parts/min`);
  console.log(`  - Simulation time: ${config.simulationTime} min`);
  console.log(`  - Replications: ${config.numReplications}`);

  // Create and run engine
  const engine = new SimulationEngine(config);
  const results = engine.run(progressCallback);

  console.log('[DES Runner] Simulation complete!');
  console.log(`  - Throughput: ${results.throughput.mean.toFixed(2)} parts/hr`);
  console.log(`  - Cycle time: ${results.cycleTime.mean.toFixed(2)} min`);
  console.log(`  - Bottleneck: ${results.bottleneck.machineId} (${(results.bottleneck.utilization * 100).toFixed(1)}% util)`);

  // Extract replications (without typescript error)
  const { replications, ...baseResults } = results as any;

  return baseResults;
}

/**
 * Run DES simulation with comprehensive Simio-style analysis
 */
export function runComprehensiveSimulation(
  analysis: FactoryAnalysis,
  numReplications: number = 100,
  progressCallback?: (progress: number) => void
): ComprehensiveSimulationResults {
  console.log('[DES Runner] Starting comprehensive simulation...');

  // Convert analysis to simulation config
  const config = analysisToSimConfig(analysis);
  config.numReplications = numReplications;

  console.log('[DES Runner] Simulation config:');
  console.log(`  - Machines: ${config.machines.length}`);
  console.log(`  - Flow: ${config.flowSequence.join(' → ')}`);
  console.log(`  - Arrival rate: ${config.arrivalRate.toFixed(4)} parts/min`);
  console.log(`  - Simulation time: ${config.simulationTime} min`);
  console.log(`  - Replications: ${config.numReplications}`);

  // Create and run engine
  const engine = new SimulationEngine(config);
  const engineResults = engine.run(progressCallback);

  console.log('[DES Runner] Simulation complete!');
  console.log(`  - Throughput: ${engineResults.throughput.mean.toFixed(2)} parts/hr`);
  console.log(`  - Cycle time: ${engineResults.cycleTime.mean.toFixed(2)} min`);
  console.log(`  - Bottleneck: ${engineResults.bottleneck.machineId} (${(engineResults.bottleneck.utilization * 100).toFixed(1)}% util)`);

  // Generate comprehensive analysis
  console.log('[DES Runner] Generating comprehensive analysis...');
  const analyzer = new ComprehensiveAnalyzer();
  const { replications, ...baseResults } = engineResults as any;
  const comprehensiveResults = analyzer.generateComprehensiveResults(
    baseResults,
    replications,
    config
  );

  console.log('[DES Runner] Comprehensive analysis complete!');
  console.log(`  - Status: ${comprehensiveResults.executiveSummary.status}`);
  console.log(`  - Warnings: ${comprehensiveResults.executiveSummary.warnings.length}`);
  console.log(`  - Improvement scenarios: ${comprehensiveResults.improvementScenarios?.length || 0}`);

  return comprehensiveResults;
}
