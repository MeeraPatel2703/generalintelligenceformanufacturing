/**
 * PRACTICAL OPTIMIZATION ENGINE
 * 
 * Lightweight optimization using hill-climbing algorithm:
 * - Finds optimal resource capacities
 * - Optimizes process times
 * - Minimizes cost while maximizing throughput
 * - Quick convergence for practical use
 * - No complex genetic algorithm overhead
 */

import { ExtractedSystem } from '../../types/extraction';
import { IndustrialSimulationAdapter } from '../../des-core/IndustrialSimulationAdapter';
import { ComprehensiveMetrics } from '../metrics/MetricsCollector';

// ============================================================================
// INTERFACES
// ============================================================================

export interface OptimizationObjective {
  metric: 'throughput' | 'cost' | 'cycle_time' | 'utilization' | 'balanced';
  direction: 'maximize' | 'minimize';
  weight?: number; // For multi-objective optimization
}

export interface OptimizationConstraints {
  maxBudget?: number;
  maxCapacityIncrease?: number; // %
  minUtilization?: number;
  maxUtilization?: number;
}

export interface OptimizationResult {
  optimizedSystem: ExtractedSystem;
  baselineMetrics: ComprehensiveMetrics;
  optimizedMetrics: ComprehensiveMetrics;
  improvements: {
    throughputChange: number; // %
    costChange: number; // %
    cycleTimeChange: number; // %
    utilizationChange: number; // %
  };
  changes: OptimizationChange[];
  iterations: number;
  converged: boolean;
}

export interface OptimizationChange {
  parameter: string;
  resourceName?: string;
  oldValue: number;
  newValue: number;
  impact: string;
}

export interface OptimizationConfig {
  objective: OptimizationObjective;
  constraints: OptimizationConstraints;
  simulationTime?: number;
  maxIterations?: number;
  stepSize?: number; // How aggressively to change parameters
  tolerance?: number; // Convergence tolerance
}

// ============================================================================
// OPTIMIZATION ENGINE
// ============================================================================

export class OptimizationEngine {
  
  /**
   * Optimize system configuration
   */
  async optimize(
    baselineSystem: ExtractedSystem,
    config: OptimizationConfig
  ): Promise<OptimizationResult> {
    
    console.log('[OptimizationEngine] Starting optimization...');
    console.log('[OptimizationEngine] Objective:', config.objective.metric, config.objective.direction);
    
    const {
      simulationTime = 100,
      maxIterations = 20,
      stepSize = 0.1,
      tolerance = 0.01
    } = config;
    
    // Run baseline
    const baselineMetrics = await this.runSimulation(baselineSystem, simulationTime);
    const baselineScore = this.calculateScore(baselineMetrics, config.objective);
    
    console.log('[OptimizationEngine] Baseline score:', baselineScore.toFixed(2));
    
    // Initialize current system
    let currentSystem = this.deepClone(baselineSystem);
    let currentScore = baselineScore;
    let bestScore = baselineScore;
    let bestSystem = this.deepClone(currentSystem);
    let iteration = 0;
    let noImprovementCount = 0;
    const changes: OptimizationChange[] = [];
    
    // Hill-climbing optimization
    while (iteration < maxIterations && noImprovementCount < 5) {
      iteration++;
      console.log(`[OptimizationEngine] Iteration ${iteration}/${maxIterations}`);
      
      // Try optimizing each parameter
      const candidates = this.generateCandidates(
        currentSystem,
        config,
        stepSize
      );
      
      // Evaluate candidates
      let improved = false;
      for (const candidate of candidates) {
        const candidateMetrics = await this.runSimulation(candidate.system, simulationTime);
        const candidateScore = this.calculateScore(candidateMetrics, config.objective);
        
        if (candidateScore > bestScore + tolerance) {
          bestScore = candidateScore;
          bestSystem = this.deepClone(candidate.system);
          currentSystem = this.deepClone(candidate.system);
          currentScore = candidateScore;
          improved = true;
          
          changes.push(...candidate.changes);
          
          console.log(`[OptimizationEngine] ✓ Improved score: ${candidateScore.toFixed(2)} (+${((candidateScore - baselineScore) / baselineScore * 100).toFixed(1)}%)`);
          break; // Move to next iteration
        }
      }
      
      if (!improved) {
        noImprovementCount++;
        console.log(`[OptimizationEngine] No improvement (${noImprovementCount}/5)`);
      } else {
        noImprovementCount = 0;
      }
    }
    
    // Run final metrics on best system
    const optimizedMetrics = await this.runSimulation(bestSystem, simulationTime);
    
    const improvements = this.calculateImprovements(baselineMetrics, optimizedMetrics);
    
    console.log('[OptimizationEngine] ✅ Optimization complete');
    console.log('[OptimizationEngine] Final improvements:', improvements);
    
    return {
      optimizedSystem: bestSystem,
      baselineMetrics,
      optimizedMetrics,
      improvements,
      changes: this.consolidateChanges(changes),
      iterations: iteration,
      converged: noImprovementCount >= 5
    };
  }
  
  /**
   * Generate candidate solutions
   */
  private generateCandidates(
    currentSystem: ExtractedSystem,
    config: OptimizationConfig,
    stepSize: number
  ): Array<{ system: ExtractedSystem; changes: OptimizationChange[] }> {
    
    const candidates: Array<{ system: ExtractedSystem; changes: OptimizationChange[] }> = [];
    
    // Strategy 1: Increase capacity of highest-utilized resources
    if (!config.constraints.maxCapacityIncrease || config.constraints.maxCapacityIncrease > 0) {
      currentSystem.resources.forEach((resource, idx) => {
        if (resource.capacity && resource.capacity > 0) {
          const system = this.deepClone(currentSystem);
          const oldCapacity = system.resources[idx].capacity!;
          const newCapacity = Math.ceil(oldCapacity * (1 + stepSize));
          
          system.resources[idx].capacity = newCapacity;
          
          candidates.push({
            system,
            changes: [{
              parameter: 'capacity',
              resourceName: resource.name,
              oldValue: oldCapacity,
              newValue: newCapacity,
              impact: `Increase ${resource.name} capacity by ${(stepSize * 100).toFixed(0)}%`
            }]
          });
        }
      });
    }
    
    // Strategy 2: Reduce process times
    currentSystem.processes.forEach((process, idx) => {
      if (process.duration && process.duration.type === 'constant') {
        const system = this.deepClone(currentSystem);
        const oldValue = (system.processes[idx].duration as any).value;
        const newValue = oldValue * (1 - stepSize);
        
        (system.processes[idx].duration as any).value = newValue;
        
        candidates.push({
          system,
          changes: [{
            parameter: 'process_time',
            resourceName: process.name,
            oldValue,
            newValue,
            impact: `Reduce ${process.name} time by ${(stepSize * 100).toFixed(0)}%`
          }]
        });
      }
    });
    
    // Strategy 3: Decrease capacity (cost reduction)
    if (config.objective.metric === 'cost') {
      currentSystem.resources.forEach((resource, idx) => {
        if (resource.capacity && resource.capacity > 1) {
          const system = this.deepClone(currentSystem);
          const oldCapacity = system.resources[idx].capacity!;
          const newCapacity = Math.max(1, Math.floor(oldCapacity * (1 - stepSize)));
          
          if (newCapacity !== oldCapacity) {
            system.resources[idx].capacity = newCapacity;
            
            candidates.push({
              system,
              changes: [{
                parameter: 'capacity',
                resourceName: resource.name,
                oldValue: oldCapacity,
                newValue: newCapacity,
                impact: `Reduce ${resource.name} capacity to lower costs`
              }]
            });
          }
        }
      });
    }
    
    return candidates;
  }
  
  /**
   * Calculate optimization score
   */
  private calculateScore(
    metrics: ComprehensiveMetrics,
    objective: OptimizationObjective
  ): number {
    
    switch (objective.metric) {
      case 'throughput':
        return metrics.throughput.entitiesPerHour;
      
      case 'cost':
        // Lower cost is better, so invert
        const cost = metrics.financial?.totalOperatingCost || 1000;
        return 10000 / cost;
      
      case 'cycle_time':
        // Lower cycle time is better, so invert
        const cycleTime = metrics.throughput.averageCycleTime || 30;
        return 1000 / cycleTime;
      
      case 'utilization':
        // Target 80% utilization (neither too high nor too low)
        const avgUtil = metrics.resources.reduce((sum, r) => sum + r.utilization, 0) / metrics.resources.length;
        const targetUtil = 0.80;
        return 100 - Math.abs(avgUtil - targetUtil) * 100;
      
      case 'balanced':
        // Weighted combination
        const throughput = metrics.throughput.entitiesPerHour / 10; // Normalize
        const costScore = 10000 / (metrics.financial?.totalOperatingCost || 1000);
        const cycleTimeScore = 1000 / (metrics.throughput.averageCycleTime || 30);
        const utilScore = 100 - Math.abs(0.80 - metrics.resources.reduce((sum, r) => sum + r.utilization, 0) / metrics.resources.length) * 100;
        
        return (
          throughput * 0.3 +
          costScore * 0.25 +
          cycleTimeScore * 0.25 +
          utilScore * 0.2
        );
      
      default:
        return metrics.throughput.entitiesPerHour;
    }
  }
  
  /**
   * Run simulation and get metrics
   */
  private async runSimulation(
    system: ExtractedSystem,
    simulationTime: number
  ): Promise<ComprehensiveMetrics> {
    
    const simulator = new IndustrialSimulationAdapter(system);
    simulator.run(simulationTime);
    return simulator.getComprehensiveMetrics();
  }
  
  /**
   * Calculate improvements vs baseline
   */
  private calculateImprovements(
    baseline: ComprehensiveMetrics,
    optimized: ComprehensiveMetrics
  ): any {
    
    const throughputChange = ((optimized.throughput.entitiesPerHour - baseline.throughput.entitiesPerHour) / baseline.throughput.entitiesPerHour) * 100;
    
    const costChange = baseline.financial && optimized.financial
      ? ((optimized.financial.totalOperatingCost - baseline.financial.totalOperatingCost) / baseline.financial.totalOperatingCost) * 100
      : 0;
    
    const cycleTimeChange = ((optimized.throughput.averageCycleTime - baseline.throughput.averageCycleTime) / baseline.throughput.averageCycleTime) * 100;
    
    const baselineUtil = baseline.resources.reduce((sum, r) => sum + r.utilization, 0) / baseline.resources.length;
    const optimizedUtil = optimized.resources.reduce((sum, r) => sum + r.utilization, 0) / optimized.resources.length;
    const utilizationChange = ((optimizedUtil - baselineUtil) / baselineUtil) * 100;
    
    return {
      throughputChange,
      costChange,
      cycleTimeChange,
      utilizationChange
    };
  }
  
  /**
   * Consolidate duplicate changes
   */
  private consolidateChanges(changes: OptimizationChange[]): OptimizationChange[] {
    const consolidated = new Map<string, OptimizationChange>();
    
    changes.forEach(change => {
      const key = `${change.parameter}_${change.resourceName}`;
      if (!consolidated.has(key)) {
        consolidated.set(key, change);
      } else {
        // Update to latest value
        const existing = consolidated.get(key)!;
        existing.newValue = change.newValue;
      }
    });
    
    return Array.from(consolidated.values());
  }
  
  /**
   * Deep clone object
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
  
  /**
   * Quick optimize with default settings
   */
  async quickOptimize(
    system: ExtractedSystem,
    objective: 'throughput' | 'cost' | 'balanced' = 'balanced'
  ): Promise<OptimizationResult> {
    
    return this.optimize(system, {
      objective: {
        metric: objective,
        direction: objective === 'cost' ? 'minimize' : 'maximize'
      },
      constraints: {
        maxCapacityIncrease: 50, // Max 50% increase
        minUtilization: 0.5,
        maxUtilization: 0.95
      },
      simulationTime: 100,
      maxIterations: 15,
      stepSize: 0.15,
      tolerance: 0.01
    });
  }
}

