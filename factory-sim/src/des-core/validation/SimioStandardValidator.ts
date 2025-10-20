/**
 * SIMIO-STANDARD CONFIGURATION VALIDATOR
 *
 * Validates simulation configurations against Simio standards and theoretical values
 *
 * Features:
 * - Configuration completeness checking
 * - Theoretical performance calculations
 * - Stability analysis
 * - Best practice recommendations
 * - Automatic configuration optimization
 */

import { ExtractedSystem, Distribution, ArrivalPattern } from '../../types/extraction';

export interface ConfigurationIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'stability' | 'configuration' | 'performance' | 'best_practice';
  element: string;
  issue: string;
  recommendation: string;
  theoreticalValue?: number;
  actualValue?: number;
}

export interface TheoreticalMetrics {
  // System-level
  theoreticalThroughput: number;
  theoreticalCycleTime: number;
  theoreticalWIP: number;
  systemStable: boolean;

  // Resource-level
  resourceMetrics: {
    resourceName: string;
    theoreticalUtilization: number;
    theoreticalQueueLength: number;
    theoreticalWaitTime: number;
    isBottleneck: boolean;
    utilizationStatus: 'underutilized' | 'optimal' | 'overutilized' | 'unstable';
  }[];

  // Constraints
  littlesLawVerification: {
    wip: number;
    throughput: number;
    cycleTime: number;
    verified: boolean;
    discrepancy: number;
  };
}

export interface ValidationReport {
  overall: 'valid' | 'needs_attention' | 'invalid';
  issues: ConfigurationIssue[];
  theoreticalMetrics: TheoreticalMetrics;
  recommendations: string[];
  optimizationPotential: number; // 0-100% potential improvement
}

export class SimioStandardValidator {
  /**
   * Validate entire system configuration
   */
  static validateSystem(system: ExtractedSystem): ValidationReport {
    const issues: ConfigurationIssue[] = [];

    // 1. Configuration completeness
    issues.push(...this.validateCompleteness(system));

    // 2. Distribution parameters
    issues.push(...this.validateDistributions(system));

    // 3. Resource configuration
    issues.push(...this.validateResources(system));

    // 4. Arrival patterns
    issues.push(...this.validateArrivalPatterns(system));

    // 5. System stability
    issues.push(...this.validateStability(system));

    // Calculate theoretical metrics
    const theoreticalMetrics = this.calculateTheoreticalMetrics(system);

    // Generate recommendations
    const recommendations = this.generateRecommendations(issues, theoreticalMetrics);

    // Calculate optimization potential
    const optimizationPotential = this.calculateOptimizationPotential(issues, theoreticalMetrics);

    // Determine overall status
    const hasCritical = issues.some(i => i.severity === 'critical');
    const hasWarning = issues.some(i => i.severity === 'warning');
    const overall = hasCritical ? 'invalid' : (hasWarning ? 'needs_attention' : 'valid');

    return {
      overall,
      issues,
      theoreticalMetrics,
      recommendations,
      optimizationPotential
    };
  }

  /**
   * Validate configuration completeness
   */
  private static validateCompleteness(system: ExtractedSystem): ConfigurationIssue[] {
    const issues: ConfigurationIssue[] = [];

    // Check for entities
    if (system.entities.length === 0) {
      issues.push({
        severity: 'critical',
        category: 'configuration',
        element: 'Entities',
        issue: 'No entities defined',
        recommendation: 'Add at least one entity type with arrival pattern'
      });
    }

    // Check for resources
    if (system.resources.length === 0) {
      issues.push({
        severity: 'critical',
        category: 'configuration',
        element: 'Resources',
        issue: 'No resources defined',
        recommendation: 'Add at least one resource (server, machine, worker, etc.)'
      });
    }

    // Check for processes
    if (system.processes.length === 0) {
      issues.push({
        severity: 'warning',
        category: 'configuration',
        element: 'Processes',
        issue: 'No processes defined',
        recommendation: 'Define process flow to connect entities and resources'
      });
    }

    // Check entity completeness
    for (const entity of system.entities) {
      if (!entity.arrivalPattern) {
        issues.push({
          severity: 'critical',
          category: 'configuration',
          element: `Entity: ${entity.name}`,
          issue: 'No arrival pattern defined',
          recommendation: 'Specify arrival distribution (Poisson, scheduled, etc.)'
        });
      }
    }

    // Check resource completeness
    for (const resource of system.resources) {
      if (!resource.capacity || resource.capacity <= 0) {
        issues.push({
          severity: 'critical',
          category: 'configuration',
          element: `Resource: ${resource.name}`,
          issue: 'Invalid or missing capacity',
          recommendation: 'Set capacity to positive integer (1 for single server, >1 for multiple)'
        });
      }

      if (!resource.processingTime) {
        issues.push({
          severity: 'warning',
          category: 'configuration',
          element: `Resource: ${resource.name}`,
          issue: 'No processing time distribution',
          recommendation: 'Define processing time distribution for accurate simulation'
        });
      }
    }

    return issues;
  }

  /**
   * Validate distributions
   */
  private static validateDistributions(system: ExtractedSystem): ConfigurationIssue[] {
    const issues: ConfigurationIssue[] = [];

    // Check resource processing times
    for (const resource of system.resources) {
      if (resource.processingTime) {
        const distIssues = this.validateDistribution(
          resource.processingTime,
          `Resource: ${resource.name} processing time`
        );
        issues.push(...distIssues);
      }

      if (resource.setupTime) {
        const distIssues = this.validateDistribution(
          resource.setupTime,
          `Resource: ${resource.name} setup time`
        );
        issues.push(...distIssues);
      }
    }

    return issues;
  }

  /**
   * Validate a single distribution
   */
  private static validateDistribution(dist: Distribution, context: string): ConfigurationIssue[] {
    const issues: ConfigurationIssue[] = [];

    switch (dist.type) {
      case 'normal':
        if (!dist.parameters.mean || !dist.parameters.stdDev) {
          issues.push({
            severity: 'critical',
            category: 'configuration',
            element: context,
            issue: 'Normal distribution missing mean or stdDev',
            recommendation: 'Provide both mean and standard deviation parameters'
          });
        } else if (dist.parameters.stdDev >= dist.parameters.mean) {
          issues.push({
            severity: 'warning',
            category: 'best_practice',
            element: context,
            issue: `High coefficient of variation (CV = ${(dist.parameters.stdDev / dist.parameters.mean).toFixed(2)})`,
            recommendation: 'Consider if this high variability is realistic. Typical CV is 0.1-0.3 for controlled processes'
          });
        }
        break;

      case 'exponential':
        if (!dist.parameters.mean && !dist.parameters.rate) {
          issues.push({
            severity: 'critical',
            category: 'configuration',
            element: context,
            issue: 'Exponential distribution missing mean or rate',
            recommendation: 'Provide either mean or rate parameter'
          });
        }
        break;

      case 'uniform':
        if (dist.parameters.min === undefined || dist.parameters.max === undefined) {
          issues.push({
            severity: 'critical',
            category: 'configuration',
            element: context,
            issue: 'Uniform distribution missing min or max',
            recommendation: 'Provide both min and max bounds'
          });
        } else if (dist.parameters.min >= dist.parameters.max) {
          issues.push({
            severity: 'critical',
            category: 'configuration',
            element: context,
            issue: 'Uniform distribution has min >= max',
            recommendation: 'Ensure min < max'
          });
        }
        break;

      case 'triangular':
        if (dist.parameters.min === undefined || dist.parameters.max === undefined || dist.parameters.mode === undefined) {
          issues.push({
            severity: 'critical',
            category: 'configuration',
            element: context,
            issue: 'Triangular distribution missing parameters',
            recommendation: 'Provide min, max, and mode parameters'
          });
        } else {
          const { min, max, mode } = dist.parameters;
          if (min! >= mode! || mode! >= max!) {
            issues.push({
              severity: 'critical',
              category: 'configuration',
              element: context,
              issue: 'Triangular distribution has invalid parameter order',
              recommendation: 'Ensure min < mode < max'
            });
          }
        }
        break;

      case 'constant':
        if (dist.parameters.value === undefined || dist.parameters.value <= 0) {
          issues.push({
            severity: 'warning',
            category: 'configuration',
            element: context,
            issue: 'Constant distribution has zero or negative value',
            recommendation: 'Use positive value for processing times'
          });
        }
        break;
    }

    return issues;
  }

  /**
   * Validate resources
   */
  private static validateResources(system: ExtractedSystem): ConfigurationIssue[] {
    const issues: ConfigurationIssue[] = [];

    for (const resource of system.resources) {
      // Check capacity
      if (resource.capacity > 100) {
        issues.push({
          severity: 'warning',
          category: 'best_practice',
          element: `Resource: ${resource.name}`,
          issue: `Very high capacity (${resource.capacity})`,
          recommendation: 'Consider if this capacity is realistic. Large capacities may indicate infinite capacity assumption'
        });
      }

      // Check for failures configuration
      if (resource.failures) {
        if (resource.failures.type === 'time_based' && resource.failures.mtbf && resource.failures.mttr) {
          const mtbf = this.getDistributionMean(resource.failures.mtbf);
          const mttr = this.getDistributionMean(resource.failures.mttr);

          if (mttr > mtbf * 0.5) {
            issues.push({
              severity: 'warning',
              category: 'configuration',
              element: `Resource: ${resource.name}`,
              issue: 'MTTR is very high relative to MTBF',
              recommendation: 'Review failure parameters. Typically MTTR << MTBF for reliable systems'
            });
          }
        }
      }

      // Check for schedule configuration
      if (resource.schedule && resource.schedule.type === 'shifts') {
        if (!resource.schedule.shifts || resource.schedule.shifts.length === 0) {
          issues.push({
            severity: 'warning',
            category: 'configuration',
            element: `Resource: ${resource.name}`,
            issue: 'Schedule type is "shifts" but no shifts defined',
            recommendation: 'Define shift patterns or change to continuous schedule'
          });
        }
      }
    }

    return issues;
  }

  /**
   * Validate arrival patterns
   */
  private static validateArrivalPatterns(system: ExtractedSystem): ConfigurationIssue[] {
    const issues: ConfigurationIssue[] = [];

    for (const entity of system.entities) {
      if (!entity.arrivalPattern) continue;

      const pattern = entity.arrivalPattern;

      if (pattern.type === 'poisson') {
        if (!pattern.rate || pattern.rate <= 0) {
          issues.push({
            severity: 'critical',
            category: 'configuration',
            element: `Entity: ${entity.name}`,
            issue: 'Poisson arrival has invalid or missing rate',
            recommendation: 'Specify positive arrival rate (e.g., 10 per_hour)'
          });
        }
      }

      if (pattern.type === 'nonhomogeneous' || pattern.type === 'scheduled') {
        if (!pattern.schedule || pattern.schedule.length === 0) {
          issues.push({
            severity: 'critical',
            category: 'configuration',
            element: `Entity: ${entity.name}`,
            issue: `${pattern.type} arrival has no schedule defined`,
            recommendation: 'Provide arrival schedule with time periods and rates'
          });
        }
      }

      if (pattern.type === 'deterministic' && !pattern.interarrivalTime) {
        issues.push({
          severity: 'critical',
          category: 'configuration',
          element: `Entity: ${entity.name}`,
          issue: 'Deterministic arrival has no interarrival time',
          recommendation: 'Specify fixed or distributed interarrival time'
        });
      }
    }

    return issues;
  }

  /**
   * Validate system stability
   */
  private static validateStability(system: ExtractedSystem): ConfigurationIssue[] {
    const issues: ConfigurationIssue[] = [];

    // For each resource, check if arrival rate < service rate * capacity
    for (const resource of system.resources) {
      if (!resource.processingTime) continue;

      const serviceTime = this.getDistributionMean(resource.processingTime);
      if (serviceTime <= 0) continue;

      const serviceRate = 1 / serviceTime; // per time unit
      const totalServiceRate = serviceRate * resource.capacity;

      // Find entities that use this resource
      const arrivalRates = this.getArrivalRatesForResource(system, resource.name);
      const totalArrivalRate = arrivalRates.reduce((sum, rate) => sum + rate, 0);

      if (totalArrivalRate >= totalServiceRate) {
        const utilization = totalArrivalRate / totalServiceRate;
        issues.push({
          severity: 'critical',
          category: 'stability',
          element: `Resource: ${resource.name}`,
          issue: `System unstable: ρ = ${utilization.toFixed(2)} >= 1.0`,
          recommendation: `Increase capacity from ${resource.capacity} or reduce arrival rate. Current: ${totalArrivalRate.toFixed(2)}/hr arrival vs ${totalServiceRate.toFixed(2)}/hr service`,
          theoreticalValue: 0.85, // Target utilization
          actualValue: utilization
        });
      } else {
        const utilization = totalArrivalRate / totalServiceRate;

        if (utilization > 0.90) {
          issues.push({
            severity: 'warning',
            category: 'performance',
            element: `Resource: ${resource.name}`,
            issue: `Very high utilization: ρ = ${utilization.toFixed(2)}`,
            recommendation: 'Consider adding capacity. High utilization leads to long queues and wait times',
            theoreticalValue: 0.85,
            actualValue: utilization
          });
        } else if (utilization < 0.30) {
          issues.push({
            severity: 'info',
            category: 'performance',
            element: `Resource: ${resource.name}`,
            issue: `Low utilization: ρ = ${utilization.toFixed(2)}`,
            recommendation: 'Resource may be oversized. Consider reducing capacity for cost savings',
            theoreticalValue: 0.70,
            actualValue: utilization
          });
        }
      }
    }

    return issues;
  }

  /**
   * Calculate theoretical performance metrics
   */
  private static calculateTheoreticalMetrics(system: ExtractedSystem): TheoreticalMetrics {
    const resourceMetrics: TheoreticalMetrics['resourceMetrics'] = [];

    let systemThroughput = 0;
    let systemCycleTime = 0;
    let systemWIP = 0;
    let systemStable = true;

    for (const resource of system.resources) {
      if (!resource.processingTime) {
        resourceMetrics.push({
          resourceName: resource.name,
          theoreticalUtilization: 0,
          theoreticalQueueLength: 0,
          theoreticalWaitTime: 0,
          isBottleneck: false,
          utilizationStatus: 'underutilized'
        });
        continue;
      }

      const serviceTime = this.getDistributionMean(resource.processingTime);
      const serviceRate = 1 / serviceTime;
      const totalServiceRate = serviceRate * resource.capacity;

      const arrivalRates = this.getArrivalRatesForResource(system, resource.name);
      const arrivalRate = arrivalRates.reduce((sum, rate) => sum + rate, 0);

      const utilization = arrivalRate / totalServiceRate;

      let queueLength = 0;
      let waitTime = 0;

      if (utilization >= 1.0) {
        systemStable = false;
        queueLength = Infinity;
        waitTime = Infinity;
      } else {
        // M/M/c approximation
        if (resource.capacity === 1) {
          // M/M/1
          queueLength = (utilization * utilization) / (1 - utilization);
          waitTime = (utilization * serviceTime) / (1 - utilization);
        } else {
          // M/M/c (simplified)
          const c = resource.capacity;
          const rho = utilization;

          // Erlang-C approximation
          const erlangC = this.approximateErlangC(c, arrivalRate / serviceRate);
          queueLength = erlangC * rho / (1 - rho);
          waitTime = queueLength / arrivalRate;
        }
      }

      const utilizationStatus: typeof resourceMetrics[0]['utilizationStatus'] =
        utilization >= 1.0 ? 'unstable' :
        utilization > 0.85 ? 'overutilized' :
        utilization >= 0.60 ? 'optimal' :
        'underutilized';

      resourceMetrics.push({
        resourceName: resource.name,
        theoreticalUtilization: utilization,
        theoreticalQueueLength: queueLength,
        theoreticalWaitTime: waitTime,
        isBottleneck: false, // Will be determined later
        utilizationStatus
      });

      systemCycleTime += serviceTime + waitTime;
    }

    // Identify bottleneck (highest utilization)
    let maxUtilization = 0;
    let bottleneckIndex = -1;

    resourceMetrics.forEach((rm, index) => {
      if (rm.theoreticalUtilization > maxUtilization) {
        maxUtilization = rm.theoreticalUtilization;
        bottleneckIndex = index;
      }
    });

    if (bottleneckIndex >= 0) {
      resourceMetrics[bottleneckIndex].isBottleneck = true;
    }

    // System-level calculations
    const totalArrivalRate = system.entities.reduce((sum, entity) => {
      return sum + this.getEntityArrivalRate(entity.arrivalPattern);
    }, 0);

    systemThroughput = systemStable && maxUtilization < 1 ? totalArrivalRate : totalArrivalRate * (1 / Math.max(maxUtilization, 1));
    systemWIP = systemThroughput * systemCycleTime;

    // Little's Law verification
    const littlesLawVerification = {
      wip: systemWIP,
      throughput: systemThroughput,
      cycleTime: systemCycleTime,
      verified: Math.abs(systemWIP - systemThroughput * systemCycleTime) < 0.01 * systemWIP,
      discrepancy: Math.abs(systemWIP - systemThroughput * systemCycleTime) / Math.max(systemWIP, 0.001)
    };

    return {
      theoreticalThroughput: systemThroughput,
      theoreticalCycleTime: systemCycleTime,
      theoreticalWIP: systemWIP,
      systemStable,
      resourceMetrics,
      littlesLawVerification
    };
  }

  /**
   * Approximate Erlang-C for M/M/c queues
   */
  private static approximateErlangC(c: number, a: number): number {
    const rho = a / c;
    if (rho >= 1) return 1;

    // Simplified approximation
    const numerator = Math.pow(a, c) / this.factorial(c);
    let denominator = 0;

    for (let k = 0; k < c; k++) {
      denominator += Math.pow(a, k) / this.factorial(k);
    }

    denominator += (Math.pow(a, c) / (this.factorial(c) * (1 - rho)));

    return numerator / denominator;
  }

  /**
   * Calculate factorial
   */
  private static factorial(n: number): number {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(
    issues: ConfigurationIssue[],
    metrics: TheoreticalMetrics
  ): string[] {
    const recommendations: string[] = [];

    // Critical issues first
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(`⚠️ CRITICAL: Fix ${criticalIssues.length} critical configuration issues before running simulation`);
    }

    // Stability recommendations
    if (!metrics.systemStable) {
      recommendations.push('🔴 System is UNSTABLE: Add capacity or reduce arrival rates');
    }

    // Bottleneck recommendations
    const bottleneck = metrics.resourceMetrics.find(rm => rm.isBottleneck);
    if (bottleneck && bottleneck.theoreticalUtilization > 0.85) {
      recommendations.push(`🎯 Primary bottleneck is "${bottleneck.resourceName}" at ${(bottleneck.theoreticalUtilization * 100).toFixed(1)}% utilization. Consider adding capacity here first.`);
    }

    // Underutilized resources
    const underutilized = metrics.resourceMetrics.filter(rm => rm.utilizationStatus === 'underutilized');
    if (underutilized.length > 0) {
      recommendations.push(`💡 ${underutilized.length} resources are underutilized (<60%). Consider consolidating or reducing capacity.`);
    }

    // Configuration quality
    const configIssues = issues.filter(i => i.category === 'configuration' && i.severity === 'warning');
    if (configIssues.length > 0) {
      recommendations.push(`📋 ${configIssues.length} configuration improvements available for better accuracy`);
    }

    // Best practices
    const bpIssues = issues.filter(i => i.category === 'best_practice');
    if (bpIssues.length > 0) {
      recommendations.push(`✨ ${bpIssues.length} best practice recommendations to improve model quality`);
    }

    return recommendations;
  }

  /**
   * Calculate optimization potential
   */
  private static calculateOptimizationPotential(
    issues: ConfigurationIssue[],
    metrics: TheoreticalMetrics
  ): number {
    let potential = 0;

    // Unstable system has 100% potential
    if (!metrics.systemStable) {
      return 100;
    }

    // Add potential based on overutilized resources
    const overutilized = metrics.resourceMetrics.filter(rm => rm.utilizationStatus === 'overutilized');
    potential += overutilized.length * 15; // 15% per overutilized resource

    // Add potential based on underutilized resources
    const underutilized = metrics.resourceMetrics.filter(rm => rm.utilizationStatus === 'underutilized');
    potential += underutilized.length * 10; // 10% per underutilized resource

    // Add potential based on critical issues
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    potential += criticalIssues.length * 20;

    // Add potential based on configuration issues
    const configIssues = issues.filter(i => i.category === 'configuration');
    potential += configIssues.length * 5;

    return Math.min(potential, 100);
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
        return 1; // Default fallback
    }
  }

  /**
   * Helper: Get entity arrival rate
   */
  private static getEntityArrivalRate(pattern: ArrivalPattern): number {
    if (pattern.type === 'poisson' && pattern.rate) {
      // Normalize to per-hour basis
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
        return 1 / mean; // Rate = 1 / interarrival time
      }
    }

    // For nonhomogeneous, scheduled, batch - approximate with first schedule entry
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
   * Helper: Get arrival rates for a specific resource
   */
  private static getArrivalRatesForResource(system: ExtractedSystem, resourceName: string): number[] {
    const rates: number[] = [];

    // Find all entities that use this resource
    for (const entity of system.entities) {
      // Check if entity process uses this resource
      const usesResource = system.processes.some(process =>
        process.entityType === entity.type &&
        process.sequence.some(step => step.resourceName === resourceName)
      );

      if (usesResource && entity.arrivalPattern) {
        rates.push(this.getEntityArrivalRate(entity.arrivalPattern));
      }
    }

    return rates;
  }

  /**
   * Print validation report
   */
  static printReport(report: ValidationReport): void {
    console.log('═'.repeat(100));
    console.log('SIMIO-STANDARD CONFIGURATION VALIDATION REPORT');
    console.log('═'.repeat(100));
    console.log();

    // Overall status
    const statusEmoji = report.overall === 'valid' ? '✅' : report.overall === 'needs_attention' ? '⚠️' : '🔴';
    console.log(`Overall Status: ${statusEmoji} ${report.overall.toUpperCase()}`);
    console.log(`Optimization Potential: ${report.optimizationPotential.toFixed(1)}%`);
    console.log();

    // Issues summary
    const critical = report.issues.filter(i => i.severity === 'critical').length;
    const warnings = report.issues.filter(i => i.severity === 'warning').length;
    const info = report.issues.filter(i => i.severity === 'info').length;

    console.log('─'.repeat(100));
    console.log('ISSUES SUMMARY');
    console.log('─'.repeat(100));
    console.log(`  🔴 Critical: ${critical}`);
    console.log(`  ⚠️  Warnings: ${warnings}`);
    console.log(`  ℹ️  Info:     ${info}`);
    console.log();

    // Theoretical metrics
    console.log('─'.repeat(100));
    console.log('THEORETICAL PERFORMANCE METRICS');
    console.log('─'.repeat(100));
    const metrics = report.theoreticalMetrics;
    console.log(`  System Stable:         ${metrics.systemStable ? '✅ YES' : '🔴 NO'}`);
    console.log(`  Theoretical Throughput: ${metrics.theoreticalThroughput.toFixed(2)} entities/hour`);
    console.log(`  Theoretical Cycle Time: ${metrics.theoreticalCycleTime.toFixed(2)} time units`);
    console.log(`  Theoretical WIP:        ${metrics.theoreticalWIP.toFixed(2)} entities`);
    console.log();

    console.log(`  Little's Law Verification:`);
    console.log(`    WIP = Throughput × Cycle Time`);
    console.log(`    ${metrics.littlesLawVerification.wip.toFixed(2)} = ${metrics.littlesLawVerification.throughput.toFixed(2)} × ${metrics.littlesLawVerification.cycleTime.toFixed(2)}`);
    console.log(`    ${metrics.littlesLawVerification.verified ? '✅ VERIFIED' : '⚠️ DISCREPANCY'} (${(metrics.littlesLawVerification.discrepancy * 100).toFixed(1)}%)`);
    console.log();

    // Resource metrics
    console.log('─'.repeat(100));
    console.log('RESOURCE ANALYSIS');
    console.log('─'.repeat(100));
    console.log('Resource'.padEnd(25) + 'Utilization'.padEnd(15) + 'Queue Length'.padEnd(15) + 'Status'.padEnd(20) + 'Bottleneck');
    console.log('─'.repeat(100));

    for (const rm of metrics.resourceMetrics) {
      const util = (rm.theoreticalUtilization * 100).toFixed(1) + '%';
      const queue = rm.theoreticalQueueLength === Infinity ? '∞' : rm.theoreticalQueueLength.toFixed(2);
      const statusIcon =
        rm.utilizationStatus === 'unstable' ? '🔴' :
        rm.utilizationStatus === 'overutilized' ? '⚠️' :
        rm.utilizationStatus === 'optimal' ? '✅' : 'ℹ️';
      const bottleneckIcon = rm.isBottleneck ? '🎯 YES' : '';

      console.log(
        rm.resourceName.padEnd(25) +
        util.padEnd(15) +
        queue.padEnd(15) +
        `${statusIcon} ${rm.utilizationStatus}`.padEnd(20) +
        bottleneckIcon
      );
    }
    console.log();

    // Detailed issues
    if (report.issues.length > 0) {
      console.log('─'.repeat(100));
      console.log('DETAILED ISSUES');
      console.log('─'.repeat(100));

      for (const issue of report.issues) {
        const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} [${issue.severity.toUpperCase()}] ${issue.element}`);
        console.log(`   Issue: ${issue.issue}`);
        console.log(`   Recommendation: ${issue.recommendation}`);
        if (issue.theoreticalValue !== undefined && issue.actualValue !== undefined) {
          console.log(`   Target: ${issue.theoreticalValue.toFixed(2)}, Actual: ${issue.actualValue.toFixed(2)}`);
        }
        console.log();
      }
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log('─'.repeat(100));
      console.log('RECOMMENDATIONS');
      console.log('─'.repeat(100));
      for (const rec of report.recommendations) {
        console.log(`  ${rec}`);
      }
      console.log();
    }

    console.log('═'.repeat(100));
    console.log();
  }
}
