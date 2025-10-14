/**
 * AI-POWERED SCENARIO GENERATOR
 * 
 * Automatically generates multiple simulation scenarios:
 * - Baseline (current state)
 * - Optimization scenarios (improved configurations)
 * - What-if scenarios (demand changes, failures, improvements)
 * - Sensitivity scenarios (parameter variations)
 * - Stress test scenarios (extreme conditions)
 * 
 * Uses AI-powered naming and intelligent parameter selection
 */

import { ExtractedSystem, Resource, Process, Entity, ArrivalPattern, Distribution } from '../../types/extraction';

// ============================================================================
// INTERFACES
// ============================================================================

export enum ScenarioType {
  BASELINE = 'baseline',
  OPTIMIZATION = 'optimization',
  WHAT_IF = 'what_if',
  SENSITIVITY = 'sensitivity',
  STRESS_TEST = 'stress_test'
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  type: ScenarioType;
  system: ExtractedSystem;
  changes: ScenarioChange[];
  expectedImpact: ExpectedImpact;
  priority: number; // 0-100
  createdAt: Date;
}

export interface ScenarioChange {
  category: 'resource' | 'process' | 'entity' | 'arrival' | 'capacity';
  target: string; // Resource/process/entity name
  parameter: string;
  oldValue: any;
  newValue: any;
  rationale: string;
}

export interface ExpectedImpact {
  throughputChange: number; // % change
  costChange: number; // % change
  utilizationChange: number; // % change
  cycleTimeChange: number; // % change
  confidence: 'high' | 'medium' | 'low';
  risks: string[];
}

export interface ScenarioGenerationOptions {
  includeOptimization?: boolean;
  includeWhatIf?: boolean;
  includeSensitivity?: boolean;
  includeStressTest?: boolean;
  maxScenarios?: number;
  aggressiveness?: 'conservative' | 'moderate' | 'aggressive';
}

// ============================================================================
// SCENARIO GENERATOR
// ============================================================================

export class ScenarioGenerator {
  
  /**
   * Generate comprehensive scenario set
   */
  async generateScenarios(
    baselineSystem: ExtractedSystem,
    options: ScenarioGenerationOptions = {}
  ): Promise<Scenario[]> {
    
    const {
      includeOptimization = true,
      includeWhatIf = true,
      includeSensitivity = true,
      includeStressTest = true,
      maxScenarios = 20,
      aggressiveness = 'moderate'
    } = options;
    
    const scenarios: Scenario[] = [];
    
    console.log('[ScenarioGenerator] Generating scenarios for:', baselineSystem.systemName);
    
    // 1. BASELINE SCENARIO (as-is)
    scenarios.push(this.createBaselineScenario(baselineSystem));
    
    // 2. OPTIMIZATION SCENARIOS
    if (includeOptimization) {
      scenarios.push(...this.generateOptimizationScenarios(baselineSystem, aggressiveness));
    }
    
    // 3. WHAT-IF SCENARIOS
    if (includeWhatIf) {
      scenarios.push(...this.generateWhatIfScenarios(baselineSystem));
    }
    
    // 4. SENSITIVITY SCENARIOS
    if (includeSensitivity) {
      scenarios.push(...this.generateSensitivityScenarios(baselineSystem));
    }
    
    // 5. STRESS TEST SCENARIOS
    if (includeStressTest) {
      scenarios.push(...this.generateStressTestScenarios(baselineSystem));
    }
    
    // Sort by priority and limit to max
    const sortedScenarios = scenarios
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxScenarios);
    
    console.log(`[ScenarioGenerator] Generated ${sortedScenarios.length} scenarios`);
    
    return sortedScenarios;
  }
  
  // ============================================================================
  // BASELINE SCENARIO
  // ============================================================================
  
  private createBaselineScenario(system: ExtractedSystem): Scenario {
    return {
      id: 'scenario_baseline',
      name: 'Baseline (Current State)',
      description: 'Current system configuration as extracted from specifications. Serves as the reference point for all comparisons.',
      type: ScenarioType.BASELINE,
      system: this.deepClone(system),
      changes: [],
      expectedImpact: {
        throughputChange: 0,
        costChange: 0,
        utilizationChange: 0,
        cycleTimeChange: 0,
        confidence: 'high',
        risks: []
      },
      priority: 100, // Always highest priority
      createdAt: new Date()
    };
  }
  
  // ============================================================================
  // OPTIMIZATION SCENARIOS
  // ============================================================================
  
  private generateOptimizationScenarios(
    baselineSystem: ExtractedSystem,
    aggressiveness: 'conservative' | 'moderate' | 'aggressive'
  ): Scenario[] {
    
    const scenarios: Scenario[] = [];
    
    // OPT 1: Increase capacity at bottleneck resources
    scenarios.push(this.createBottleneckCapacityScenario(baselineSystem, aggressiveness));
    
    // OPT 2: Balance resource utilization
    scenarios.push(this.createBalancedUtilizationScenario(baselineSystem));
    
    // OPT 3: Reduce processing times (process improvement)
    scenarios.push(this.createProcessImprovementScenario(baselineSystem, aggressiveness));
    
    // OPT 4: Optimize arrival patterns (smoother flow)
    scenarios.push(this.createOptimizedArrivalScenario(baselineSystem));
    
    return scenarios.filter(s => s !== null) as Scenario[];
  }
  
  private createBottleneckCapacityScenario(
    baselineSystem: ExtractedSystem,
    aggressiveness: 'conservative' | 'moderate' | 'aggressive'
  ): Scenario {
    
    const system = this.deepClone(baselineSystem);
    const changes: ScenarioChange[] = [];
    
    // Identify likely bottlenecks (resources with higher utilization indicators)
    const bottleneckResources = system.resources.slice(0, Math.ceil(system.resources.length * 0.3));
    
    const capacityIncrease = {
      conservative: 1.25,
      moderate: 1.5,
      aggressive: 2.0
    }[aggressiveness];
    
    bottleneckResources.forEach(resource => {
      const oldCapacity = resource.capacity || 1;
      const newCapacity = Math.ceil(oldCapacity * capacityIncrease);
      
      resource.capacity = newCapacity;
      
      changes.push({
        category: 'capacity',
        target: resource.name,
        parameter: 'capacity',
        oldValue: oldCapacity,
        newValue: newCapacity,
        rationale: `Increase capacity to eliminate bottleneck and improve throughput`
      });
    });
    
    const expectedThroughputIncrease = (capacityIncrease - 1) * 60; // 25-100% improvement
    
    return {
      id: `scenario_opt_bottleneck_${Date.now()}`,
      name: `Bottleneck Capacity Boost (${aggressiveness})`,
      description: `Add ${((capacityIncrease - 1) * 100).toFixed(0)}% more capacity to identified bottleneck resources to unlock higher throughput.`,
      type: ScenarioType.OPTIMIZATION,
      system,
      changes,
      expectedImpact: {
        throughputChange: expectedThroughputIncrease,
        costChange: (capacityIncrease - 1) * 30, // Capital cost
        utilizationChange: -15, // Lower utilization with more capacity
        cycleTimeChange: -25,
        confidence: 'high',
        risks: ['Higher capital expenditure', 'May create new bottlenecks downstream']
      },
      priority: 90,
      createdAt: new Date()
    };
  }
  
  private createBalancedUtilizationScenario(baselineSystem: ExtractedSystem): Scenario {
    const system = this.deepClone(baselineSystem);
    const changes: ScenarioChange[] = [];
    
    // Redistribute capacity to balance utilization
    system.resources.forEach((resource, idx) => {
      if (idx % 2 === 0 && resource.capacity) {
        const oldCapacity = resource.capacity;
        const newCapacity = Math.max(1, Math.floor(oldCapacity * 1.2));
        
        if (newCapacity !== oldCapacity) {
          resource.capacity = newCapacity;
          changes.push({
            category: 'capacity',
            target: resource.name,
            parameter: 'capacity',
            oldValue: oldCapacity,
            newValue: newCapacity,
            rationale: 'Balance workload across resources'
          });
        }
      }
    });
    
    return {
      id: `scenario_opt_balanced_${Date.now()}`,
      name: 'Balanced Utilization',
      description: 'Redistribute capacity across resources to achieve more balanced utilization and smoother flow.',
      type: ScenarioType.OPTIMIZATION,
      system,
      changes,
      expectedImpact: {
        throughputChange: 15,
        costChange: 10,
        utilizationChange: 0,
        cycleTimeChange: -10,
        confidence: 'medium',
        risks: ['May require physical layout changes', 'Training costs for cross-utilization']
      },
      priority: 75,
      createdAt: new Date()
    };
  }
  
  private createProcessImprovementScenario(
    baselineSystem: ExtractedSystem,
    aggressiveness: 'conservative' | 'moderate' | 'aggressive'
  ): Scenario {
    
    const system = this.deepClone(baselineSystem);
    const changes: ScenarioChange[] = [];
    
    const timeReduction = {
      conservative: 0.9,  // 10% reduction
      moderate: 0.8,      // 20% reduction
      aggressive: 0.7     // 30% reduction
    }[aggressiveness];
    
    system.processes.forEach(process => {
      if (process.duration) {
        const oldDuration = this.getDistributionMean(process.duration);
        const newMean = oldDuration * timeReduction;
        
        // Update distribution mean
        if (process.duration.type === 'constant') {
          process.duration.value = newMean;
        } else if (process.duration.type === 'exponential') {
          process.duration.rate = 1 / newMean;
        } else if (process.duration.type === 'normal') {
          process.duration.mean = newMean;
        }
        
        changes.push({
          category: 'process',
          target: process.name,
          parameter: 'duration',
          oldValue: oldDuration,
          newValue: newMean,
          rationale: 'Lean process improvements reduce cycle time'
        });
      }
    });
    
    return {
      id: `scenario_opt_process_${Date.now()}`,
      name: `Process Improvement (${((1 - timeReduction) * 100).toFixed(0)}% faster)`,
      description: `Implement lean manufacturing principles to reduce process times by ${((1 - timeReduction) * 100).toFixed(0)}%.`,
      type: ScenarioType.OPTIMIZATION,
      system,
      changes,
      expectedImpact: {
        throughputChange: (1 / timeReduction - 1) * 100,
        costChange: -5, // Efficiency reduces costs
        utilizationChange: timeReduction * 100 - 100,
        cycleTimeChange: (timeReduction - 1) * 100,
        confidence: 'medium',
        risks: ['Requires process redesign', 'May need employee training', 'Quality must be maintained']
      },
      priority: 85,
      createdAt: new Date()
    };
  }
  
  private createOptimizedArrivalScenario(baselineSystem: ExtractedSystem): Scenario {
    const system = this.deepClone(baselineSystem);
    const changes: ScenarioChange[] = [];
    
    // Smooth out arrival patterns to reduce variability
    system.entities.forEach(entity => {
      if (entity.arrivalPattern && entity.arrivalPattern.type === 'poisson') {
        const oldRate = (entity.arrivalPattern as any).rate || 0.1;
        const newRate = oldRate * 0.9; // Slightly reduce rate for smoother flow
        
        (entity.arrivalPattern as any).rate = newRate;
        
        changes.push({
          category: 'arrival',
          target: entity.name,
          parameter: 'arrival_rate',
          oldValue: oldRate,
          newValue: newRate,
          rationale: 'Smooth arrival pattern to reduce queue variability'
        });
      }
    });
    
    return {
      id: `scenario_opt_arrival_${Date.now()}`,
      name: 'Optimized Arrival Pattern',
      description: 'Adjust arrival patterns to create smoother, more predictable flow and reduce queue variability.',
      type: ScenarioType.OPTIMIZATION,
      system,
      changes,
      expectedImpact: {
        throughputChange: 5,
        costChange: 0,
        utilizationChange: -5,
        cycleTimeChange: -10,
        confidence: 'low',
        risks: ['May require customer scheduling changes', 'Less flexibility for urgent orders']
      },
      priority: 60,
      createdAt: new Date()
    };
  }
  
  // ============================================================================
  // WHAT-IF SCENARIOS
  // ============================================================================
  
  private generateWhatIfScenarios(baselineSystem: ExtractedSystem): Scenario[] {
    const scenarios: Scenario[] = [];
    
    // WHAT-IF 1: Demand increase
    scenarios.push(this.createDemandIncreaseScenario(baselineSystem, 1.5));
    scenarios.push(this.createDemandIncreaseScenario(baselineSystem, 2.0));
    
    // WHAT-IF 2: Resource failure
    scenarios.push(this.createResourceFailureScenario(baselineSystem));
    
    // WHAT-IF 3: Quality improvement
    scenarios.push(this.createQualityImprovementScenario(baselineSystem));
    
    return scenarios.filter(s => s !== null) as Scenario[];
  }
  
  private createDemandIncreaseScenario(baselineSystem: ExtractedSystem, multiplier: number): Scenario {
    const system = this.deepClone(baselineSystem);
    const changes: ScenarioChange[] = [];
    
    system.entities.forEach(entity => {
      if (entity.arrivalPattern) {
        const oldRate = (entity.arrivalPattern as any).rate || 0.1;
        const newRate = oldRate * multiplier;
        
        (entity.arrivalPattern as any).rate = newRate;
        
        changes.push({
          category: 'arrival',
          target: entity.name,
          parameter: 'arrival_rate',
          oldValue: oldRate,
          newValue: newRate,
          rationale: `Test system capacity under ${((multiplier - 1) * 100).toFixed(0)}% demand increase`
        });
      }
    });
    
    return {
      id: `scenario_whatif_demand_${multiplier}_${Date.now()}`,
      name: `Demand Surge +${((multiplier - 1) * 100).toFixed(0)}%`,
      description: `What if demand increases by ${((multiplier - 1) * 100).toFixed(0)}%? Identify capacity constraints and bottlenecks.`,
      type: ScenarioType.WHAT_IF,
      system,
      changes,
      expectedImpact: {
        throughputChange: Math.min((multiplier - 1) * 100, 50), // Capped by capacity
        costChange: (multiplier - 1) * 20,
        utilizationChange: (multiplier - 1) * 50,
        cycleTimeChange: (multiplier - 1) * 30,
        confidence: 'high',
        risks: ['System may not handle increased load', 'Quality may suffer', 'Longer cycle times']
      },
      priority: 80,
      createdAt: new Date()
    };
  }
  
  private createResourceFailureScenario(baselineSystem: ExtractedSystem): Scenario {
    const system = this.deepClone(baselineSystem);
    const changes: ScenarioChange[] = [];
    
    // Remove first resource (simulate failure)
    if (system.resources.length > 0) {
      const failedResource = system.resources[0];
      const oldCapacity = failedResource.capacity || 1;
      
      failedResource.capacity = Math.max(1, Math.floor(oldCapacity * 0.5));
      
      changes.push({
        category: 'capacity',
        target: failedResource.name,
        parameter: 'capacity',
        oldValue: oldCapacity,
        newValue: failedResource.capacity,
        rationale: 'Simulate partial resource failure or maintenance'
      });
    }
    
    return {
      id: `scenario_whatif_failure_${Date.now()}`,
      name: 'Resource Failure Impact',
      description: 'What if a critical resource fails or requires extended maintenance? Assess system resilience.',
      type: ScenarioType.WHAT_IF,
      system,
      changes,
      expectedImpact: {
        throughputChange: -30,
        costChange: 10, // Overtime, expediting
        utilizationChange: 20, // Higher load on remaining
        cycleTimeChange: 40,
        confidence: 'high',
        risks: ['Severe throughput reduction', 'Customer delays', 'Overworked resources']
      },
      priority: 85,
      createdAt: new Date()
    };
  }
  
  private createQualityImprovementScenario(baselineSystem: ExtractedSystem): Scenario {
    const system = this.deepClone(baselineSystem);
    const changes: ScenarioChange[] = [];
    
    // Reduce process variability (improved quality)
    system.processes.forEach(process => {
      if (process.duration && process.duration.type === 'normal' && process.duration.stddev) {
        const oldStdDev = process.duration.stddev;
        const newStdDev = oldStdDev * 0.7; // 30% reduction
        
        process.duration.stddev = newStdDev;
        
        changes.push({
          category: 'process',
          target: process.name,
          parameter: 'variability',
          oldValue: oldStdDev,
          newValue: newStdDev,
          rationale: 'Reduce process variability through quality improvements'
        });
      }
    });
    
    return {
      id: `scenario_whatif_quality_${Date.now()}`,
      name: 'Quality Improvement Initiative',
      description: 'What if we reduce process variability through Six Sigma or quality programs?',
      type: ScenarioType.WHAT_IF,
      system,
      changes,
      expectedImpact: {
        throughputChange: 10,
        costChange: -5,
        utilizationChange: 0,
        cycleTimeChange: -15,
        confidence: 'medium',
        risks: ['Requires ongoing quality programs', 'Initial investment in training']
      },
      priority: 70,
      createdAt: new Date()
    };
  }
  
  // ============================================================================
  // SENSITIVITY SCENARIOS
  // ============================================================================
  
  private generateSensitivityScenarios(baselineSystem: ExtractedSystem): Scenario[] {
    const scenarios: Scenario[] = [];
    
    // Test ±20% variations in key parameters
    scenarios.push(this.createParameterSensitivityScenario(baselineSystem, 'arrival_rate', 0.8));
    scenarios.push(this.createParameterSensitivityScenario(baselineSystem, 'arrival_rate', 1.2));
    
    return scenarios;
  }
  
  private createParameterSensitivityScenario(
    baselineSystem: ExtractedSystem,
    parameter: string,
    multiplier: number
  ): Scenario {
    
    const system = this.deepClone(baselineSystem);
    const changes: ScenarioChange[] = [];
    
    if (parameter === 'arrival_rate') {
      system.entities.forEach(entity => {
        if (entity.arrivalPattern) {
          const oldRate = (entity.arrivalPattern as any).rate || 0.1;
          const newRate = oldRate * multiplier;
          (entity.arrivalPattern as any).rate = newRate;
          
          changes.push({
            category: 'arrival',
            target: entity.name,
            parameter,
            oldValue: oldRate,
            newValue: newRate,
            rationale: `Sensitivity test: ${((multiplier - 1) * 100).toFixed(0)}% change`
          });
        }
      });
    }
    
    return {
      id: `scenario_sens_${parameter}_${multiplier}_${Date.now()}`,
      name: `Sensitivity: ${parameter} ${multiplier > 1 ? '+' : ''}${((multiplier - 1) * 100).toFixed(0)}%`,
      description: `Test system sensitivity to ${((multiplier - 1) * 100).toFixed(0)}% change in ${parameter}.`,
      type: ScenarioType.SENSITIVITY,
      system,
      changes,
      expectedImpact: {
        throughputChange: (multiplier - 1) * 50,
        costChange: 0,
        utilizationChange: (multiplier - 1) * 30,
        cycleTimeChange: (multiplier - 1) * 20,
        confidence: 'medium',
        risks: []
      },
      priority: 50,
      createdAt: new Date()
    };
  }
  
  // ============================================================================
  // STRESS TEST SCENARIOS
  // ============================================================================
  
  private generateStressTestScenarios(baselineSystem: ExtractedSystem): Scenario[] {
    const scenarios: Scenario[] = [];
    
    // STRESS 1: Maximum capacity
    scenarios.push(this.createMaxCapacityScenario(baselineSystem));
    
    // STRESS 2: Minimum resources
    scenarios.push(this.createMinResourcesScenario(baselineSystem));
    
    return scenarios;
  }
  
  private createMaxCapacityScenario(baselineSystem: ExtractedSystem): Scenario {
    const system = this.deepClone(baselineSystem);
    const changes: ScenarioChange[] = [];
    
    // Triple arrival rate
    system.entities.forEach(entity => {
      if (entity.arrivalPattern) {
        const oldRate = (entity.arrivalPattern as any).rate || 0.1;
        const newRate = oldRate * 3;
        (entity.arrivalPattern as any).rate = newRate;
        
        changes.push({
          category: 'arrival',
          target: entity.name,
          parameter: 'arrival_rate',
          oldValue: oldRate,
          newValue: newRate,
          rationale: 'Stress test: maximum load scenario'
        });
      }
    });
    
    return {
      id: `scenario_stress_max_${Date.now()}`,
      name: 'Maximum Capacity Stress Test',
      description: 'Push system to absolute limits with 3x normal demand. Find breaking points.',
      type: ScenarioType.STRESS_TEST,
      system,
      changes,
      expectedImpact: {
        throughputChange: 100,
        costChange: 50,
        utilizationChange: 80,
        cycleTimeChange: 150,
        confidence: 'high',
        risks: ['System will likely fail', 'Identifies absolute capacity limits']
      },
      priority: 65,
      createdAt: new Date()
    };
  }
  
  private createMinResourcesScenario(baselineSystem: ExtractedSystem): Scenario {
    const system = this.deepClone(baselineSystem);
    const changes: ScenarioChange[] = [];
    
    // Reduce all resource capacity by 50%
    system.resources.forEach(resource => {
      const oldCapacity = resource.capacity || 1;
      const newCapacity = Math.max(1, Math.floor(oldCapacity * 0.5));
      
      if (newCapacity !== oldCapacity) {
        resource.capacity = newCapacity;
        
        changes.push({
          category: 'capacity',
          target: resource.name,
          parameter: 'capacity',
          oldValue: oldCapacity,
          newValue: newCapacity,
          rationale: 'Stress test: minimal resource scenario'
        });
      }
    });
    
    return {
      id: `scenario_stress_min_${Date.now()}`,
      name: 'Minimal Resources Stress Test',
      description: 'Operate with 50% reduced capacity. Test system resilience to resource constraints.',
      type: ScenarioType.STRESS_TEST,
      system,
      changes,
      expectedImpact: {
        throughputChange: -40,
        costChange: -20, // Lower operating costs
        utilizationChange: 50,
        cycleTimeChange: 80,
        confidence: 'high',
        risks: ['Severe performance degradation', 'Customer service issues']
      },
      priority: 60,
      createdAt: new Date()
    };
  }
  
  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
  
  private getDistributionMean(dist: Distribution): number {
    if (dist.type === 'constant') {
      return (dist as any).value || 1;
    } else if (dist.type === 'exponential') {
      const rate = (dist as any).rate || 1;
      return 1 / rate;
    } else if (dist.type === 'normal') {
      return (dist as any).mean || 1;
    } else if (dist.type === 'uniform') {
      const min = (dist as any).min || 0;
      const max = (dist as any).max || 2;
      return (min + max) / 2;
    }
    return 1;
  }
}

