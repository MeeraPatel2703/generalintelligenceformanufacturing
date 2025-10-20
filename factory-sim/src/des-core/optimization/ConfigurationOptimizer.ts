/**
 * CONFIGURATION OPTIMIZER
 *
 * Automatically optimizes simulation configurations to meet Simio standards
 * Uses theoretical calculations to recommend and apply improvements
 */

import { ExtractedSystem, Resource, Distribution, ArrivalPattern } from '../../types/extraction';
import { SimioStandardValidator, ValidationReport, ConfigurationIssue } from '../validation/SimioStandardValidator';

export interface OptimizationResult {
  success: boolean;
  improvementsMade: OptimizationChange[];
  beforeValidation: ValidationReport;
  afterValidation: ValidationReport;
  performanceImpact: {
    throughputChange: number; // %
    cycleTimeChange: number; // %
    utilizationImprovement: number; // %
    stabilityAchieved: boolean;
  };
}

export interface OptimizationChange {
  type: 'capacity' | 'distribution' | 'arrival_rate' | 'configuration';
  element: string;
  oldValue: any;
  newValue: any;
  rationale: string;
  expectedImpact: string;
}

export interface OptimizationGoals {
  targetUtilization?: number; // 0-1, default 0.75
  ensureStability?: boolean; // default true
  fixCriticalIssues?: boolean; // default true
  optimizeBottlenecks?: boolean; // default true
  balanceUtilization?: boolean; // default false
}

export class ConfigurationOptimizer {
  /**
   * Optimize system configuration automatically
   */
  static optimize(
    system: ExtractedSystem,
    goals: OptimizationGoals = {}
  ): OptimizationResult {
    // Set defaults
    const targetUtilization = goals.targetUtilization ?? 0.75;
    const ensureStability = goals.ensureStability ?? true;
    const fixCriticalIssues = goals.fixCriticalIssues ?? true;
    const optimizeBottlenecks = goals.optimizeBottlenecks ?? true;
    const balanceUtilization = goals.balanceUtilization ?? false;

    // Validate before optimization
    const beforeValidation = SimioStandardValidator.validateSystem(system);

    // Clone system for optimization
    const optimizedSystem = JSON.parse(JSON.stringify(system)) as ExtractedSystem;
    const changes: OptimizationChange[] = [];

    // Step 1: Fix critical configuration issues
    if (fixCriticalIssues) {
      const criticalChanges = this.fixCriticalIssues(optimizedSystem, beforeValidation.issues);
      changes.push(...criticalChanges);
    }

    // Step 2: Ensure system stability
    if (ensureStability) {
      const stabilityChanges = this.ensureStability(optimizedSystem, targetUtilization);
      changes.push(...stabilityChanges);
    }

    // Step 3: Optimize bottlenecks
    if (optimizeBottlenecks) {
      const bottleneckChanges = this.optimizeBottlenecks(optimizedSystem, targetUtilization);
      changes.push(...bottleneckChanges);
    }

    // Step 4: Balance utilization across resources
    if (balanceUtilization) {
      const balanceChanges = this.balanceUtilization(optimizedSystem, targetUtilization);
      changes.push(...balanceChanges);
    }

    // Validate after optimization
    const afterValidation = SimioStandardValidator.validateSystem(optimizedSystem);

    // Calculate performance impact
    const performanceImpact = {
      throughputChange: this.calculatePercentChange(
        beforeValidation.theoreticalMetrics.theoreticalThroughput,
        afterValidation.theoreticalMetrics.theoreticalThroughput
      ),
      cycleTimeChange: this.calculatePercentChange(
        beforeValidation.theoreticalMetrics.theoreticalCycleTime,
        afterValidation.theoreticalMetrics.theoreticalCycleTime
      ),
      utilizationImprovement: this.calculateUtilizationImprovement(
        beforeValidation,
        afterValidation,
        targetUtilization
      ),
      stabilityAchieved: afterValidation.theoreticalMetrics.systemStable
    };

    // Apply changes to original system if successful
    if (changes.length > 0 && afterValidation.overall !== 'invalid') {
      Object.assign(system, optimizedSystem);
    }

    return {
      success: afterValidation.overall !== 'invalid',
      improvementsMade: changes,
      beforeValidation,
      afterValidation,
      performanceImpact
    };
  }

  /**
   * Fix critical configuration issues
   */
  private static fixCriticalIssues(
    system: ExtractedSystem,
    issues: ConfigurationIssue[]
  ): OptimizationChange[] {
    const changes: OptimizationChange[] = [];

    const criticalIssues = issues.filter(i => i.severity === 'critical');

    for (const issue of criticalIssues) {
      // Fix missing arrival patterns
      if (issue.issue.includes('No arrival pattern')) {
        const entityName = issue.element.replace('Entity: ', '');
        const entity = system.entities.find(e => e.name === entityName);

        if (entity && !entity.arrivalPattern) {
          entity.arrivalPattern = {
            type: 'poisson',
            rate: 10,
            rateUnit: 'per_hour'
          };

          changes.push({
            type: 'configuration',
            element: entityName,
            oldValue: 'none',
            newValue: 'Poisson(10/hour)',
            rationale: 'Added default arrival pattern',
            expectedImpact: 'Enables simulation to run'
          });
        }
      }

      // Fix missing processing times
      if (issue.issue.includes('No processing time distribution')) {
        const resourceName = issue.element.replace('Resource: ', '').replace(' processing time', '');
        const resource = system.resources.find(r => r.name === resourceName);

        if (resource && !resource.processingTime) {
          resource.processingTime = {
            type: 'exponential',
            parameters: { mean: 5 },
            unit: 'minutes'
          };

          changes.push({
            type: 'distribution',
            element: resourceName,
            oldValue: 'none',
            newValue: 'Exponential(mean=5min)',
            rationale: 'Added default processing time',
            expectedImpact: 'Enables accurate time calculations'
          });
        }
      }

      // Fix invalid capacities
      if (issue.issue.includes('Invalid or missing capacity')) {
        const resourceName = issue.element.replace('Resource: ', '');
        const resource = system.resources.find(r => r.name === resourceName);

        if (resource && (!resource.capacity || resource.capacity <= 0)) {
          resource.capacity = 1;

          changes.push({
            type: 'capacity',
            element: resourceName,
            oldValue: resource.capacity || 0,
            newValue: 1,
            rationale: 'Set minimum valid capacity',
            expectedImpact: 'Enables resource to process entities'
          });
        }
      }

      // Fix distribution parameter issues
      if (issue.category === 'configuration' && issue.issue.includes('distribution')) {
        // Handle various distribution parameter fixes
        // (Implementation would iterate through resources and fix parameters)
      }
    }

    return changes;
  }

  /**
   * Ensure system stability
   */
  private static ensureStability(
    system: ExtractedSystem,
    targetUtilization: number
  ): OptimizationChange[] {
    const changes: OptimizationChange[] = [];

    for (const resource of system.resources) {
      if (!resource.processingTime) continue;

      const serviceTime = this.getDistributionMean(resource.processingTime);
      if (serviceTime <= 0) continue;

      const serviceRate = 1 / serviceTime;
      const totalServiceRate = serviceRate * resource.capacity;

      const arrivalRate = this.getTotalArrivalRateForResource(system, resource.name);
      const utilization = arrivalRate / totalServiceRate;

      // If unstable or over target, increase capacity
      if (utilization >= 1.0 || utilization > targetUtilization + 0.1) {
        const requiredCapacity = Math.ceil(arrivalRate / (serviceRate * targetUtilization));
        const oldCapacity = resource.capacity;

        resource.capacity = Math.max(requiredCapacity, oldCapacity + 1);

        changes.push({
          type: 'capacity',
          element: resource.name,
          oldValue: oldCapacity,
          newValue: resource.capacity,
          rationale: `Reduced utilization from ${(utilization * 100).toFixed(1)}% to ~${(targetUtilization * 100).toFixed(1)}%`,
          expectedImpact: `Queue length: ${this.estimateQueueReduction(utilization, arrivalRate / (serviceRate * resource.capacity))}`
        });
      }
    }

    return changes;
  }

  /**
   * Optimize bottlenecks
   */
  private static optimizeBottlenecks(
    system: ExtractedSystem,
    targetUtilization: number
  ): OptimizationChange[] {
    const changes: OptimizationChange[] = [];

    // Find bottleneck resource
    let maxUtilization = 0;
    let bottleneck: Resource | null = null;
    let bottleneckArrivalRate = 0;

    for (const resource of system.resources) {
      if (!resource.processingTime) continue;

      const serviceTime = this.getDistributionMean(resource.processingTime);
      if (serviceTime <= 0) continue;

      const serviceRate = 1 / serviceTime;
      const totalServiceRate = serviceRate * resource.capacity;
      const arrivalRate = this.getTotalArrivalRateForResource(system, resource.name);
      const utilization = arrivalRate / totalServiceRate;

      if (utilization > maxUtilization) {
        maxUtilization = utilization;
        bottleneck = resource;
        bottleneckArrivalRate = arrivalRate;
      }
    }

    // Optimize bottleneck
    if (bottleneck && maxUtilization > targetUtilization) {
      const serviceTime = this.getDistributionMean(bottleneck.processingTime!);
      const serviceRate = 1 / serviceTime;

      // Option 1: Add capacity
      const requiredCapacity = Math.ceil(bottleneckArrivalRate / (serviceRate * targetUtilization));

      if (requiredCapacity > bottleneck.capacity) {
        const oldCapacity = bottleneck.capacity;
        bottleneck.capacity = requiredCapacity;

        changes.push({
          type: 'capacity',
          element: bottleneck.name,
          oldValue: oldCapacity,
          newValue: requiredCapacity,
          rationale: `Bottleneck optimization: reduced utilization from ${(maxUtilization * 100).toFixed(1)}% to ~${(targetUtilization * 100).toFixed(1)}%`,
          expectedImpact: `System throughput increase: ~${((1 / maxUtilization - 1) * 100).toFixed(1)}%`
        });
      }
    }

    return changes;
  }

  /**
   * Balance utilization across resources
   */
  private static balanceUtilization(
    system: ExtractedSystem,
    targetUtilization: number
  ): OptimizationChange[] {
    const changes: OptimizationChange[] = [];

    // Calculate current utilization for all resources
    const utilizations: { resource: Resource; utilization: number; arrivalRate: number }[] = [];

    for (const resource of system.resources) {
      if (!resource.processingTime) continue;

      const serviceTime = this.getDistributionMean(resource.processingTime);
      if (serviceTime <= 0) continue;

      const serviceRate = 1 / serviceTime;
      const totalServiceRate = serviceRate * resource.capacity;
      const arrivalRate = this.getTotalArrivalRateForResource(system, resource.name);
      const utilization = arrivalRate / totalServiceRate;

      utilizations.push({ resource, utilization, arrivalRate });
    }

    // Adjust capacities to balance utilization
    for (const item of utilizations) {
      const deviation = Math.abs(item.utilization - targetUtilization);

      // If significantly different from target, adjust
      if (deviation > 0.15) {
        const serviceTime = this.getDistributionMean(item.resource.processingTime!);
        const serviceRate = 1 / serviceTime;

        const idealCapacity = Math.ceil(item.arrivalRate / (serviceRate * targetUtilization));
        const oldCapacity = item.resource.capacity;

        if (idealCapacity !== oldCapacity && idealCapacity > 0) {
          item.resource.capacity = idealCapacity;

          changes.push({
            type: 'capacity',
            element: item.resource.name,
            oldValue: oldCapacity,
            newValue: idealCapacity,
            rationale: `Balanced utilization from ${(item.utilization * 100).toFixed(1)}% to ~${(targetUtilization * 100).toFixed(1)}%`,
            expectedImpact: `Improved system balance`
          });
        }
      }
    }

    return changes;
  }

  /**
   * Helper: Calculate percent change
   */
  private static calculatePercentChange(before: number, after: number): number {
    if (before === 0) return 0;
    return ((after - before) / before) * 100;
  }

  /**
   * Helper: Calculate utilization improvement
   */
  private static calculateUtilizationImprovement(
    before: ValidationReport,
    after: ValidationReport,
    target: number
  ): number {
    const beforeDeviation = before.theoreticalMetrics.resourceMetrics.reduce((sum, rm) => {
      return sum + Math.abs(rm.theoreticalUtilization - target);
    }, 0) / before.theoreticalMetrics.resourceMetrics.length;

    const afterDeviation = after.theoreticalMetrics.resourceMetrics.reduce((sum, rm) => {
      return sum + Math.abs(rm.theoreticalUtilization - target);
    }, 0) / after.theoreticalMetrics.resourceMetrics.length;

    return ((beforeDeviation - afterDeviation) / Math.max(beforeDeviation, 0.01)) * 100;
  }

  /**
   * Helper: Estimate queue length reduction
   */
  private static estimateQueueReduction(oldUtil: number, newUtil: number): string {
    if (oldUtil >= 1.0) return 'Infinite → Finite';

    const oldQueue = (oldUtil * oldUtil) / (1 - oldUtil);
    const newQueue = (newUtil * newUtil) / (1 - newUtil);
    const reduction = ((oldQueue - newQueue) / oldQueue) * 100;

    return `${reduction.toFixed(1)}% reduction (${oldQueue.toFixed(1)} → ${newQueue.toFixed(1)})`;
  }

  /**
   * Helper: Get mean of distribution
   */
  private static getDistributionMean(dist: Distribution): number {
    switch (dist.type) {
      case 'constant':
        return dist.parameters.value || 0;
      case 'normal':
      case 'exponential':
      case 'lognormal':
        return dist.parameters.mean || 0;
      case 'uniform':
        return ((dist.parameters.min || 0) + (dist.parameters.max || 0)) / 2;
      case 'triangular':
        return ((dist.parameters.min || 0) + (dist.parameters.mode || 0) + (dist.parameters.max || 0)) / 3;
      case 'gamma':
        return (dist.parameters.shape || 1) * (dist.parameters.scale || 1);
      default:
        return 1;
    }
  }

  /**
   * Helper: Get total arrival rate for a resource
   */
  private static getTotalArrivalRateForResource(system: ExtractedSystem, resourceName: string): number {
    let total = 0;

    for (const entity of system.entities) {
      // Check if entity uses this resource
      const usesResource = system.processes.some(process =>
        process.entityType === entity.type &&
        process.sequence.some(step => step.resourceName === resourceName)
      );

      if (usesResource && entity.arrivalPattern) {
        total += this.getEntityArrivalRate(entity.arrivalPattern);
      }
    }

    return total;
  }

  /**
   * Helper: Get entity arrival rate
   */
  private static getEntityArrivalRate(pattern: ArrivalPattern): number {
    if (pattern.type === 'poisson' && pattern.rate) {
      switch (pattern.rateUnit) {
        case 'per_hour':
          return pattern.rate;
        case 'per_day':
          return pattern.rate / 24;
        case 'per_week':
          return pattern.rate / (24 * 7);
        default:
          return pattern.rate;
      }
    }

    if (pattern.type === 'deterministic' && pattern.interarrivalTime) {
      const mean = this.getDistributionMean(pattern.interarrivalTime);
      if (mean > 0) {
        return 1 / mean;
      }
    }

    if (pattern.schedule && pattern.schedule.length > 0) {
      const firstSchedule = pattern.schedule[0];
      if (firstSchedule.rate) {
        switch (firstSchedule.rateUnit) {
          case 'per_hour':
            return firstSchedule.rate;
          case 'per_day':
            return firstSchedule.rate / 24;
          case 'per_week':
            return firstSchedule.rate / (24 * 7);
        }
      }
    }

    return 0;
  }

  /**
   * Print optimization report
   */
  static printOptimizationReport(result: OptimizationResult): void {
    console.log('═'.repeat(100));
    console.log('CONFIGURATION OPTIMIZATION REPORT');
    console.log('═'.repeat(100));
    console.log();

    console.log(`Optimization ${result.success ? '✅ SUCCESSFUL' : '🔴 FAILED'}`);
    console.log(`Changes Applied: ${result.improvementsMade.length}`);
    console.log();

    // Performance Impact
    console.log('─'.repeat(100));
    console.log('PERFORMANCE IMPACT');
    console.log('─'.repeat(100));
    const impact = result.performanceImpact;
    console.log(`  Throughput Change:       ${impact.throughputChange >= 0 ? '+' : ''}${impact.throughputChange.toFixed(1)}%`);
    console.log(`  Cycle Time Change:       ${impact.cycleTimeChange >= 0 ? '+' : ''}${impact.cycleTimeChange.toFixed(1)}%`);
    console.log(`  Utilization Improvement: ${impact.utilizationImprovement >= 0 ? '+' : ''}${impact.utilizationImprovement.toFixed(1)}%`);
    console.log(`  Stability Achieved:      ${impact.stabilityAchieved ? '✅ YES' : '🔴 NO'}`);
    console.log();

    // Changes Made
    if (result.improvementsMade.length > 0) {
      console.log('─'.repeat(100));
      console.log('OPTIMIZATION CHANGES');
      console.log('─'.repeat(100));

      for (const change of result.improvementsMade) {
        console.log(`  📝 ${change.element} [${change.type}]`);
        console.log(`     Before: ${JSON.stringify(change.oldValue)}`);
        console.log(`     After:  ${JSON.stringify(change.newValue)}`);
        console.log(`     Rationale: ${change.rationale}`);
        console.log(`     Impact: ${change.expectedImpact}`);
        console.log();
      }
    }

    // Before/After Comparison
    console.log('─'.repeat(100));
    console.log('BEFORE vs AFTER COMPARISON');
    console.log('─'.repeat(100));
    console.log('Metric'.padEnd(30) + 'Before'.padEnd(20) + 'After'.padEnd(20) + 'Change');
    console.log('─'.repeat(100));

    const before = result.beforeValidation.theoreticalMetrics;
    const after = result.afterValidation.theoreticalMetrics;

    console.log(
      'System Stable'.padEnd(30) +
      (before.systemStable ? '✅ Yes' : '🔴 No').padEnd(20) +
      (after.systemStable ? '✅ Yes' : '🔴 No').padEnd(20)
    );

    console.log(
      'Throughput'.padEnd(30) +
      before.theoreticalThroughput.toFixed(2).padEnd(20) +
      after.theoreticalThroughput.toFixed(2).padEnd(20) +
      `${impact.throughputChange >= 0 ? '+' : ''}${impact.throughputChange.toFixed(1)}%`
    );

    console.log(
      'Cycle Time'.padEnd(30) +
      before.theoreticalCycleTime.toFixed(2).padEnd(20) +
      after.theoreticalCycleTime.toFixed(2).padEnd(20) +
      `${impact.cycleTimeChange >= 0 ? '+' : ''}${impact.cycleTimeChange.toFixed(1)}%`
    );

    console.log(
      'WIP'.padEnd(30) +
      before.theoreticalWIP.toFixed(2).padEnd(20) +
      after.theoreticalWIP.toFixed(2).padEnd(20)
    );

    console.log(
      'Critical Issues'.padEnd(30) +
      result.beforeValidation.issues.filter(i => i.severity === 'critical').length.toString().padEnd(20) +
      result.afterValidation.issues.filter(i => i.severity === 'critical').length.toString().padEnd(20)
    );

    console.log(
      'Optimization Potential'.padEnd(30) +
      `${result.beforeValidation.optimizationPotential.toFixed(1)}%`.padEnd(20) +
      `${result.afterValidation.optimizationPotential.toFixed(1)}%`.padEnd(20)
    );

    console.log();
    console.log('═'.repeat(100));
  }
}
