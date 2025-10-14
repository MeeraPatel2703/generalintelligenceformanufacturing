/**
 * SCENARIO RUNNER & COMPARISON ENGINE
 * 
 * Runs multiple scenarios and compares results:
 * - Parallel scenario execution
 * - Results collection and storage
 * - Side-by-side comparison
 * - Ranking and recommendations
 * - Export comparison reports
 */

import { Scenario } from './ScenarioGenerator';
import { IndustrialSimulationAdapter } from '../../des-core/IndustrialSimulationAdapter';
import { ComprehensiveMetrics } from '../metrics/MetricsCollector';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ScenarioResult {
  scenario: Scenario;
  metrics: ComprehensiveMetrics;
  runTime: number; // Simulation time in ms
  status: 'success' | 'failed' | 'timeout';
  error?: string;
}

export interface ScenarioComparison {
  scenarios: ScenarioResult[];
  baseline: ScenarioResult;
  rankings: ScenarioRanking[];
  recommendations: ComparisonRecommendation[];
  bestScenarios: {
    throughput: ScenarioResult;
    cost: ScenarioResult;
    utilization: ScenarioResult;
    cycleTime: ScenarioResult;
    overall: ScenarioResult;
  };
}

export interface ScenarioRanking {
  scenarioId: string;
  scenarioName: string;
  ranks: {
    throughput: number;
    cost: number;
    utilization: number;
    cycleTime: number;
    overall: number;
  };
  scores: {
    throughput: number;
    cost: number;
    utilization: number;
    cycleTime: number;
    overall: number;
  };
}

export interface ComparisonRecommendation {
  title: string;
  description: string;
  recommendedScenario: string;
  reason: string;
  tradeoffs: string[];
  nextSteps: string[];
}

export interface RunOptions {
  simulationTime?: number;
  parallelRuns?: boolean;
  timeout?: number;
}

// ============================================================================
// SCENARIO RUNNER
// ============================================================================

export class ScenarioRunner {
  
  /**
   * Run all scenarios and return results
   */
  async runScenarios(
    scenarios: Scenario[],
    options: RunOptions = {}
  ): Promise<ScenarioResult[]> {
    
    const {
      simulationTime = 100,
      parallelRuns = false,
      timeout = 30000
    } = options;
    
    console.log(`[ScenarioRunner] Running ${scenarios.length} scenarios...`);
    
    const results: ScenarioResult[] = [];
    
    if (parallelRuns) {
      // Run scenarios in parallel
      const promises = scenarios.map(scenario =>
        this.runSingleScenario(scenario, simulationTime, timeout)
      );
      results.push(...await Promise.all(promises));
    } else {
      // Run scenarios sequentially
      for (const scenario of scenarios) {
        const result = await this.runSingleScenario(scenario, simulationTime, timeout);
        results.push(result);
      }
    }
    
    console.log(`[ScenarioRunner] Completed ${results.length} scenario runs`);
    
    return results;
  }
  
  /**
   * Run a single scenario
   */
  private async runSingleScenario(
    scenario: Scenario,
    simulationTime: number,
    timeout: number
  ): Promise<ScenarioResult> {
    
    const startTime = Date.now();
    
    try {
      console.log(`[ScenarioRunner] Running: ${scenario.name}`);
      
      // Create simulator with scenario's system configuration
      const simulator = new IndustrialSimulationAdapter(scenario.system);
      
      // Run simulation
      simulator.run(simulationTime);
      
      // Get comprehensive metrics
      const metrics = simulator.getComprehensiveMetrics();
      
      const runTime = Date.now() - startTime;
      
      // Check timeout
      if (runTime > timeout) {
        console.warn(`[ScenarioRunner] Scenario ${scenario.name} exceeded timeout`);
        return {
          scenario,
          metrics,
          runTime,
          status: 'timeout',
          error: `Execution time ${runTime}ms exceeded timeout ${timeout}ms`
        };
      }
      
      console.log(`[ScenarioRunner] ✓ ${scenario.name} completed in ${runTime}ms`);
      
      return {
        scenario,
        metrics,
        runTime,
        status: 'success'
      };
      
    } catch (error) {
      console.error(`[ScenarioRunner] ✗ ${scenario.name} failed:`, error);
      
      return {
        scenario,
        metrics: null as any, // Failed scenarios don't have metrics
        runTime: Date.now() - startTime,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Compare scenario results and generate comprehensive comparison
   */
  compareScenarios(results: ScenarioResult[]): ScenarioComparison {
    
    console.log(`[ScenarioRunner] Comparing ${results.length} scenarios`);
    
    // Filter successful runs
    const successfulResults = results.filter(r => r.status === 'success');
    
    if (successfulResults.length === 0) {
      throw new Error('No successful scenario runs to compare');
    }
    
    // Find baseline
    const baseline = successfulResults.find(r => r.scenario.type === 'baseline');
    if (!baseline) {
      throw new Error('Baseline scenario not found');
    }
    
    // Generate rankings
    const rankings = this.rankScenarios(successfulResults);
    
    // Identify best scenarios for each metric
    const bestScenarios = this.identifyBestScenarios(successfulResults);
    
    // Generate recommendations
    const recommendations = this.generateComparisonRecommendations(
      successfulResults,
      baseline,
      rankings,
      bestScenarios
    );
    
    return {
      scenarios: successfulResults,
      baseline,
      rankings,
      recommendations,
      bestScenarios
    };
  }
  
  /**
   * Rank scenarios across multiple dimensions
   */
  private rankScenarios(results: ScenarioResult[]): ScenarioRanking[] {
    
    const rankings: ScenarioRanking[] = [];
    
    // Extract metrics for comparison
    const throughputs = results.map(r => r.metrics.throughput.entitiesPerHour);
    const costs = results.map(r => r.metrics.financial?.totalOperatingCost || 0);
    const utilizations = results.map(r => {
      const avgUtil = r.metrics.resources.reduce((sum, res) => sum + res.utilization, 0) / r.metrics.resources.length;
      return avgUtil;
    });
    const cycleTimes = results.map(r => r.metrics.throughput.averageCycleTime);
    
    results.forEach((result, idx) => {
      const throughputRank = this.getRank(throughputs[idx], throughputs, true);
      const costRank = this.getRank(costs[idx], costs, false); // Lower is better
      const utilizationRank = this.getRank(utilizations[idx], utilizations, true);
      const cycleTimeRank = this.getRank(cycleTimes[idx], cycleTimes, false); // Lower is better
      
      // Calculate scores (0-100)
      const throughputScore = this.normalizeScore(throughputs[idx], throughputs, true);
      const costScore = this.normalizeScore(costs[idx], costs, false);
      const utilizationScore = this.normalizeScore(utilizations[idx], utilizations, true);
      const cycleTimeScore = this.normalizeScore(cycleTimes[idx], cycleTimes, false);
      
      // Overall score (weighted average)
      const overallScore = (
        throughputScore * 0.3 +
        costScore * 0.25 +
        utilizationScore * 0.2 +
        cycleTimeScore * 0.25
      );
      
      const overallRank = idx + 1; // Will be re-ranked after sorting
      
      rankings.push({
        scenarioId: result.scenario.id,
        scenarioName: result.scenario.name,
        ranks: {
          throughput: throughputRank,
          cost: costRank,
          utilization: utilizationRank,
          cycleTime: cycleTimeRank,
          overall: overallRank
        },
        scores: {
          throughput: throughputScore,
          cost: costScore,
          utilization: utilizationScore,
          cycleTime: cycleTimeScore,
          overall: overallScore
        }
      });
    });
    
    // Re-rank by overall score
    rankings.sort((a, b) => b.scores.overall - a.scores.overall);
    rankings.forEach((ranking, idx) => {
      ranking.ranks.overall = idx + 1;
    });
    
    return rankings;
  }
  
  /**
   * Get rank of value in array (1-based)
   */
  private getRank(value: number, values: number[], higherIsBetter: boolean): number {
    const sorted = [...values].sort((a, b) => higherIsBetter ? b - a : a - b);
    return sorted.indexOf(value) + 1;
  }
  
  /**
   * Normalize value to 0-100 score
   */
  private normalizeScore(value: number, values: number[], higherIsBetter: boolean): number {
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    if (max === min) return 100;
    
    if (higherIsBetter) {
      return ((value - min) / (max - min)) * 100;
    } else {
      return ((max - value) / (max - min)) * 100;
    }
  }
  
  /**
   * Identify best scenarios for each metric
   */
  private identifyBestScenarios(results: ScenarioResult[]): any {
    
    let bestThroughput = results[0];
    let bestCost = results[0];
    let bestUtilization = results[0];
    let bestCycleTime = results[0];
    let bestOverall = results[0];
    
    let maxThroughput = 0;
    let minCost = Infinity;
    let bestUtilValue = 0; // Target ~0.75-0.85
    let minCycleTime = Infinity;
    let maxOverallScore = 0;
    
    results.forEach(result => {
      const throughput = result.metrics.throughput.entitiesPerHour;
      const cost = result.metrics.financial?.totalOperatingCost || 0;
      const avgUtil = result.metrics.resources.reduce((sum, res) => sum + res.utilization, 0) / result.metrics.resources.length;
      const cycleTime = result.metrics.throughput.averageCycleTime;
      
      // Best throughput
      if (throughput > maxThroughput) {
        maxThroughput = throughput;
        bestThroughput = result;
      }
      
      // Best cost
      if (cost < minCost && cost > 0) {
        minCost = cost;
        bestCost = result;
      }
      
      // Best utilization (closest to 0.80)
      const targetUtil = 0.80;
      if (Math.abs(avgUtil - targetUtil) < Math.abs(bestUtilValue - targetUtil)) {
        bestUtilValue = avgUtil;
        bestUtilization = result;
      }
      
      // Best cycle time
      if (cycleTime < minCycleTime && cycleTime > 0) {
        minCycleTime = cycleTime;
        bestCycleTime = result;
      }
      
      // Best overall (composite score)
      const overallScore = (
        (throughput / 10) * 0.3 +
        (1000 / (cost || 1)) * 0.25 +
        (avgUtil * 100) * 0.2 +
        (100 / (cycleTime || 1)) * 0.25
      );
      
      if (overallScore > maxOverallScore) {
        maxOverallScore = overallScore;
        bestOverall = result;
      }
    });
    
    return {
      throughput: bestThroughput,
      cost: bestCost,
      utilization: bestUtilization,
      cycleTime: bestCycleTime,
      overall: bestOverall
    };
  }
  
  /**
   * Generate comparison recommendations
   */
  private generateComparisonRecommendations(
    results: ScenarioResult[],
    baseline: ScenarioResult,
    rankings: ScenarioRanking[],
    bestScenarios: any
  ): ComparisonRecommendation[] {
    
    const recommendations: ComparisonRecommendation[] = [];
    
    // RECOMMENDATION 1: Best overall scenario
    if (bestScenarios.overall.scenario.id !== baseline.scenario.id) {
      const improvement = this.calculateImprovementVsBaseline(bestScenarios.overall, baseline);
      
      recommendations.push({
        title: 'Implement Best Overall Configuration',
        description: `The "${bestScenarios.overall.scenario.name}" scenario offers the best overall performance with balanced improvements across all metrics.`,
        recommendedScenario: bestScenarios.overall.scenario.name,
        reason: `Achieves +${improvement.throughput.toFixed(1)}% throughput, ${improvement.cost.toFixed(1)}% cost change, and ${improvement.cycleTime.toFixed(1)}% cycle time improvement compared to baseline.`,
        tradeoffs: bestScenarios.overall.scenario.expectedImpact.risks,
        nextSteps: bestScenarios.overall.scenario.changes.map((c: any) => c.rationale)
      });
    }
    
    // RECOMMENDATION 2: Quick wins (high impact, low effort)
    const quickWins = results.filter(r => {
      const ranking = rankings.find(rank => rank.scenarioId === r.scenario.id);
      return ranking && ranking.scores.overall > 70 && r.scenario.changes.length <= 3;
    });
    
    if (quickWins.length > 0) {
      const topQuickWin = quickWins[0];
      recommendations.push({
        title: 'Quick Win Opportunity',
        description: `"${topQuickWin.scenario.name}" offers significant improvements with minimal changes.`,
        recommendedScenario: topQuickWin.scenario.name,
        reason: `Only ${topQuickWin.scenario.changes.length} change(s) required for substantial performance gains.`,
        tradeoffs: topQuickWin.scenario.expectedImpact.risks,
        nextSteps: ['Implement immediately', 'Monitor results', 'Scale if successful']
      });
    }
    
    // RECOMMENDATION 3: High-risk, high-reward
    const aggressiveScenarios = results.filter(r =>
      r.scenario.expectedImpact.throughputChange > 50 &&
      r.scenario.expectedImpact.risks.length > 0
    );
    
    if (aggressiveScenarios.length > 0) {
      const topAggressive = aggressiveScenarios[0];
      recommendations.push({
        title: 'High-Impact Transformation',
        description: `"${topAggressive.scenario.name}" offers dramatic improvements but requires careful implementation.`,
        recommendedScenario: topAggressive.scenario.name,
        reason: `Potential for +${topAggressive.scenario.expectedImpact.throughputChange.toFixed(0)}% throughput increase if risks are managed.`,
        tradeoffs: topAggressive.scenario.expectedImpact.risks,
        nextSteps: ['Pilot test in limited area', 'Develop risk mitigation plan', 'Phased rollout']
      });
    }
    
    return recommendations;
  }
  
  /**
   * Calculate improvement percentage vs baseline
   */
  private calculateImprovementVsBaseline(scenario: ScenarioResult, baseline: ScenarioResult): any {
    const throughputImprovement = ((scenario.metrics.throughput.entitiesPerHour - baseline.metrics.throughput.entitiesPerHour) / baseline.metrics.throughput.entitiesPerHour) * 100;
    
    const costChange = baseline.metrics.financial && scenario.metrics.financial
      ? ((scenario.metrics.financial.totalOperatingCost - baseline.metrics.financial.totalOperatingCost) / baseline.metrics.financial.totalOperatingCost) * 100
      : 0;
    
    const cycleTimeImprovement = ((baseline.metrics.throughput.averageCycleTime - scenario.metrics.throughput.averageCycleTime) / baseline.metrics.throughput.averageCycleTime) * 100;
    
    return {
      throughput: throughputImprovement,
      cost: costChange,
      cycleTime: cycleTimeImprovement
    };
  }
}

