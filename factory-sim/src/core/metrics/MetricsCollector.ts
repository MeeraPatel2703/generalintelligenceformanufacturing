/**
 * SIMIO-GRADE METRICS COLLECTOR
 * 
 * Comprehensive metrics collection system covering all aspects of DES:
 * - Throughput metrics (cycle time, takt, efficiency)
 * - Resource utilization (OEE, availability, costs)
 * - Queue statistics (wait times, lengths, service levels)
 * - Process performance (FPY, Cpk, six sigma)
 * - Financial metrics (ROI, costs, margins)
 * - Advanced analytics (predictions, correlations)
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface ThroughputMetrics {
  // Basic
  totalEntitiesProcessed: number;
  entitiesPerHour: number;
  averageCycleTime: number;
  taktTime: number;
  
  // Advanced
  throughputEfficiency: number; // Actual vs theoretical
  valueAddedRatio: number;
  firstPassYield: number;
  
  // Time-series
  throughputOverTime: TimeSeriesPoint[];
  cycleTimes: number[];
}

export interface ResourceMetrics {
  resourceId: string;
  resourceName: string;
  
  // Utilization
  utilization: number; // % busy
  availability: number; // % available when needed
  oee: number; // Overall Equipment Effectiveness
  
  // Time breakdown
  totalTime: number;
  busyTime: number;
  idleTime: number;
  blockedTime: number;
  setupTime: number;
  
  // Throughput
  entitiesServed: number;
  entitiesPerHour: number;
  
  // Queue
  averageQueueLength: number;
  maxQueueLength: number;
  averageWaitTime: number;
  maxWaitTime: number;
  
  // Financial
  totalCost: number;
  costPerEntity: number;
  utilizationCost: number; // Cost of underutilization
}

export interface QueueMetrics {
  queueId: string;
  queueName: string;
  
  // Length metrics
  averageLength: number;
  maxLength: number;
  minLength: number;
  lengthStdDev: number;
  
  // Wait time metrics
  averageWaitTime: number;
  maxWaitTime: number;
  medianWaitTime: number;
  percentile95WaitTime: number;
  percentile99WaitTime: number;
  
  // Throughput
  totalEntities: number;
  serviceLevel: number; // % served within target time
  
  // Time-series
  lengthOverTime: TimeSeriesPoint[];
  waitTimes: number[];
}

export interface ProcessMetrics {
  processId: string;
  processName: string;
  
  // Efficiency
  cycleEfficiency: number; // Value-add time / total time
  processEfficiency: number;
  
  // Quality
  firstPassYield: number;
  defectRate: number;
  reworkRate: number;
  
  // Variation
  averageCycleTime: number;
  cycleTimeStdDev: number;
  cpk: number; // Process capability index
  
  // Bottleneck analysis
  isBottleneck: boolean;
  bottleneckSeverity: number; // 0-100
  utilizationRate: number;
}

export interface FinancialMetrics {
  // Costs
  totalOperatingCost: number;
  costPerEntity: number;
  laborCost: number;
  resourceCost: number;
  overheadCost: number;
  
  // Revenue
  revenuePerEntity: number;
  totalRevenue: number;
  
  // Profitability
  profitMargin: number;
  roi: number;
  
  // Inventory
  averageWIP: number;
  wipCost: number;
}

export interface AdvancedMetrics {
  // Statistical
  confidenceIntervals: ConfidenceInterval[];
  
  // Bottlenecks
  bottlenecks: BottleneckAnalysis[];
  
  // Predictions
  predictedThroughput: number;
  capacityUtilization: number;
  
  // Optimization
  currentOptimality: number; // % of theoretical optimal
  improvementPotential: ImprovementOpportunity[];
}

export interface TimeSeriesPoint {
  time: number;
  value: number;
}

export interface ConfidenceInterval {
  metric: string;
  mean: number;
  lower: number;
  upper: number;
  confidence: number;
}

export interface BottleneckAnalysis {
  resourceId: string;
  resourceName: string;
  severity: number; // 0-100
  utilization: number;
  queueLength: number;
  impact: string;
  recommendations: string[];
}

export interface ImprovementOpportunity {
  area: string;
  description: string;
  estimatedImpact: number;
  difficulty: 'Low' | 'Medium' | 'High';
  priority: number;
}

export interface ComprehensiveMetrics {
  metadata: MetricsMetadata;
  throughput: ThroughputMetrics;
  resources: ResourceMetrics[];
  queues: QueueMetrics[];
  processes: ProcessMetrics[];
  financial: FinancialMetrics;
  advanced: AdvancedMetrics;
}

export interface MetricsMetadata {
  simulationId: string;
  timestamp: Date;
  simulationTime: number;
  warmupTime: number;
  replications: number;
  systemName: string;
}

// ============================================================================
// METRICS COLLECTOR
// ============================================================================

export class MetricsCollector {
  private simulationStartTime: number = 0;
  private simulationEndTime: number = 0;
  private warmupTime: number = 0;
  
  // Data collection
  private entityCompletionTimes: number[] = [];
  private cycleTimes: number[] = [];
  private throughputSamples: TimeSeriesPoint[] = [];
  
  // Resource tracking
  private resourceStats: Map<string, ResourceTracker> = new Map();
  
  // Queue tracking
  private queueStats: Map<string, QueueTracker> = new Map();
  
  // Process tracking
  private processStats: Map<string, ProcessTracker> = new Map();
  
  // Financial tracking
  private totalCost: number = 0;
  private totalRevenue: number = 0;
  
  constructor(warmupTime: number = 0) {
    this.warmupTime = warmupTime;
  }
  
  /**
   * Initialize simulation tracking
   */
  startSimulation(currentTime: number): void {
    this.simulationStartTime = currentTime;
    this.resetAll();
  }
  
  /**
   * Finalize simulation tracking
   */
  endSimulation(currentTime: number): void {
    this.simulationEndTime = currentTime;
  }
  
  /**
   * Record entity arrival
   */
  recordArrival(entityId: string, time: number, entityType: string): void {
    if (time < this.warmupTime) return;
    // Track arrival for throughput calculations
  }
  
  /**
   * Record entity completion
   */
  recordCompletion(
    entityId: string,
    arrivalTime: number,
    completionTime: number
  ): void {
    if (completionTime < this.warmupTime) return;
    
    const cycleTime = completionTime - arrivalTime;
    this.cycleTimes.push(cycleTime);
    this.entityCompletionTimes.push(completionTime);
  }
  
  /**
   * Record resource state change
   */
  recordResourceStateChange(
    resourceId: string,
    resourceName: string,
    time: number,
    newState: 'busy' | 'idle' | 'blocked',
    queueLength: number
  ): void {
    if (time < this.warmupTime) return;
    
    let tracker = this.resourceStats.get(resourceId);
    if (!tracker) {
      tracker = new ResourceTracker(resourceId, resourceName);
      this.resourceStats.set(resourceId, tracker);
    }
    
    tracker.recordStateChange(time, newState, queueLength);
  }
  
  /**
   * Record queue state
   */
  recordQueueState(
    queueId: string,
    queueName: string,
    time: number,
    length: number,
    waitTime: number
  ): void {
    if (time < this.warmupTime) return;
    
    let tracker = this.queueStats.get(queueId);
    if (!tracker) {
      tracker = new QueueTracker(queueId, queueName);
      this.queueStats.set(queueId, tracker);
    }
    
    tracker.recordState(time, length, waitTime);
  }
  
  /**
   * Calculate all metrics
   */
  calculateMetrics(
    systemName: string,
    simulationId: string = 'sim-' + Date.now()
  ): ComprehensiveMetrics {
    
    const simulationTime = this.simulationEndTime - this.simulationStartTime;
    const effectiveTime = simulationTime - this.warmupTime;
    
    return {
      metadata: {
        simulationId,
        timestamp: new Date(),
        simulationTime,
        warmupTime: this.warmupTime,
        replications: 1,
        systemName
      },
      
      throughput: this.calculateThroughputMetrics(effectiveTime),
      resources: this.calculateResourceMetrics(effectiveTime),
      queues: this.calculateQueueMetrics(),
      processes: this.calculateProcessMetrics(),
      financial: this.calculateFinancialMetrics(effectiveTime),
      advanced: this.calculateAdvancedMetrics()
    };
  }
  
  // ============================================================================
  // THROUGHPUT CALCULATIONS
  // ============================================================================
  
  private calculateThroughputMetrics(effectiveTime: number): ThroughputMetrics {
    const entitiesCompleted = this.cycleTimes.length;
    const entitiesPerHour = effectiveTime > 0 
      ? (entitiesCompleted / effectiveTime) * 60 
      : 0;
    
    const avgCycleTime = this.calculateMean(this.cycleTimes);
    const taktTime = entitiesCompleted > 0 ? effectiveTime / entitiesCompleted : 0;
    
    // Calculate theoretical max throughput (assuming no queues/blocking)
    const theoreticalThroughput = this.calculateTheoreticalMaxThroughput();
    const throughputEfficiency = theoreticalThroughput > 0
      ? (entitiesPerHour / theoreticalThroughput) * 100
      : 0;
    
    // Value-added ratio (processing time / total cycle time)
    const valueAddedRatio = this.calculateValueAddedRatio();
    
    return {
      totalEntitiesProcessed: entitiesCompleted,
      entitiesPerHour,
      averageCycleTime: avgCycleTime,
      taktTime,
      throughputEfficiency,
      valueAddedRatio,
      firstPassYield: 1.0, // Assuming no defects for now
      throughputOverTime: this.throughputSamples,
      cycleTimes: this.cycleTimes
    };
  }
  
  // ============================================================================
  // RESOURCE CALCULATIONS
  // ============================================================================
  
  private calculateResourceMetrics(effectiveTime: number): ResourceMetrics[] {
    const metrics: ResourceMetrics[] = [];
    
    for (const [resourceId, tracker] of this.resourceStats) {
      const utilization = tracker.calculateUtilization(effectiveTime);
      const availability = tracker.calculateAvailability();
      const oee = utilization * availability; // Simplified OEE
      
      const queueMetrics = tracker.calculateQueueMetrics();
      
      metrics.push({
        resourceId,
        resourceName: tracker.resourceName,
        utilization,
        availability,
        oee,
        totalTime: effectiveTime,
        busyTime: tracker.busyTime,
        idleTime: tracker.idleTime,
        blockedTime: tracker.blockedTime,
        setupTime: 0, // TODO: Track setup time
        entitiesServed: tracker.entitiesServed,
        entitiesPerHour: effectiveTime > 0 
          ? (tracker.entitiesServed / effectiveTime) * 60 
          : 0,
        averageQueueLength: queueMetrics.avgLength,
        maxQueueLength: queueMetrics.maxLength,
        averageWaitTime: queueMetrics.avgWaitTime,
        maxWaitTime: queueMetrics.maxWaitTime,
        totalCost: this.calculateResourceCost(tracker, effectiveTime),
        costPerEntity: tracker.entitiesServed > 0
          ? this.calculateResourceCost(tracker, effectiveTime) / tracker.entitiesServed
          : 0,
        utilizationCost: this.calculateUtilizationCost(tracker, effectiveTime)
      });
    }
    
    return metrics;
  }
  
  // ============================================================================
  // QUEUE CALCULATIONS
  // ============================================================================
  
  private calculateQueueMetrics(): QueueMetrics[] {
    const metrics: QueueMetrics[] = [];
    
    for (const [queueId, tracker] of this.queueStats) {
      const waitTimes = tracker.waitTimes;
      const lengths = tracker.lengths;
      
      metrics.push({
        queueId,
        queueName: tracker.queueName,
        averageLength: this.calculateMean(lengths),
        maxLength: Math.max(...lengths, 0),
        minLength: Math.min(...lengths, 0),
        lengthStdDev: this.calculateStdDev(lengths),
        averageWaitTime: this.calculateMean(waitTimes),
        maxWaitTime: Math.max(...waitTimes, 0),
        medianWaitTime: this.calculatePercentile(waitTimes, 50),
        percentile95WaitTime: this.calculatePercentile(waitTimes, 95),
        percentile99WaitTime: this.calculatePercentile(waitTimes, 99),
        totalEntities: waitTimes.length,
        serviceLevel: this.calculateServiceLevel(waitTimes, 5.0), // 5 min target
        lengthOverTime: tracker.lengthOverTime,
        waitTimes
      });
    }
    
    return metrics;
  }
  
  // ============================================================================
  // PROCESS CALCULATIONS
  // ============================================================================
  
  private calculateProcessMetrics(): ProcessMetrics[] {
    const metrics: ProcessMetrics[] = [];
    
    // For each process, calculate metrics
    for (const [processId, tracker] of this.processStats) {
      const cycleTimes = tracker.cycleTimes;
      const avgCycleTime = this.calculateMean(cycleTimes);
      const stdDev = this.calculateStdDev(cycleTimes);
      
      // Calculate Cpk (process capability index)
      const cpk = this.calculateCpk(cycleTimes, tracker.targetCycleTime);
      
      metrics.push({
        processId,
        processName: tracker.processName,
        cycleEfficiency: tracker.cycleEfficiency,
        processEfficiency: tracker.processEfficiency,
        firstPassYield: tracker.firstPassYield,
        defectRate: 1 - tracker.firstPassYield,
        reworkRate: tracker.reworkRate,
        averageCycleTime: avgCycleTime,
        cycleTimeStdDev: stdDev,
        cpk,
        isBottleneck: tracker.isBottleneck,
        bottleneckSeverity: tracker.bottleneckSeverity,
        utilizationRate: tracker.utilizationRate
      });
    }
    
    return metrics;
  }
  
  // ============================================================================
  // FINANCIAL CALCULATIONS
  // ============================================================================
  
  private calculateFinancialMetrics(effectiveTime: number): FinancialMetrics {
    const entitiesCompleted = this.cycleTimes.length;
    
    // Calculate total operating cost
    let totalOperatingCost = 0;
    for (const tracker of this.resourceStats.values()) {
      totalOperatingCost += this.calculateResourceCost(tracker, effectiveTime);
    }
    
    const costPerEntity = entitiesCompleted > 0 
      ? totalOperatingCost / entitiesCompleted 
      : 0;
    
    // Assuming $100 revenue per entity (configurable)
    const revenuePerEntity = 100;
    const totalRevenue = entitiesCompleted * revenuePerEntity;
    
    const profitMargin = totalRevenue > 0
      ? ((totalRevenue - totalOperatingCost) / totalRevenue) * 100
      : 0;
    
    const roi = totalOperatingCost > 0
      ? ((totalRevenue - totalOperatingCost) / totalOperatingCost) * 100
      : 0;
    
    return {
      totalOperatingCost,
      costPerEntity,
      laborCost: totalOperatingCost * 0.6, // Assuming 60% labor
      resourceCost: totalOperatingCost * 0.3, // 30% resources
      overheadCost: totalOperatingCost * 0.1, // 10% overhead
      revenuePerEntity,
      totalRevenue,
      profitMargin,
      roi,
      averageWIP: this.calculateAverageWIP(),
      wipCost: this.calculateAverageWIP() * revenuePerEntity * 0.5
    };
  }
  
  // ============================================================================
  // ADVANCED CALCULATIONS
  // ============================================================================
  
  private calculateAdvancedMetrics(): AdvancedMetrics {
    return {
      confidenceIntervals: this.calculateConfidenceIntervals(),
      bottlenecks: this.identifyBottlenecks(),
      predictedThroughput: this.predictThroughput(),
      capacityUtilization: this.calculateCapacityUtilization(),
      currentOptimality: this.calculateOptimality(),
      improvementPotential: this.identifyImprovements()
    };
  }
  
  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  
  private calculateStdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(x => Math.pow(x - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }
  
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
  
  private calculateServiceLevel(waitTimes: number[], targetTime: number): number {
    if (waitTimes.length === 0) return 1.0;
    const withinTarget = waitTimes.filter(t => t <= targetTime).length;
    return withinTarget / waitTimes.length;
  }
  
  private calculateCpk(values: number[], target: number, tolerance: number = target * 0.2): number {
    if (values.length < 2) return 0;
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStdDev(values);
    if (stdDev === 0) return 0;
    
    const upperLimit = target + tolerance;
    const lowerLimit = target - tolerance;
    
    const cpkUpper = (upperLimit - mean) / (3 * stdDev);
    const cpkLower = (mean - lowerLimit) / (3 * stdDev);
    
    return Math.min(cpkUpper, cpkLower);
  }
  
  private calculateResourceCost(tracker: ResourceTracker, time: number): number {
    // Assuming $50/hour cost per resource
    const costPerHour = 50;
    return (time / 60) * costPerHour;
  }
  
  private calculateUtilizationCost(tracker: ResourceTracker, time: number): number {
    const underutilization = Math.max(0, 1 - (tracker.busyTime / time));
    const costPerHour = 50;
    return underutilization * (time / 60) * costPerHour;
  }
  
  private calculateAverageWIP(): number {
    // Calculate average entities in system
    const totalWIP = this.entityCompletionTimes.length;
    return totalWIP * 0.5; // Simplified: half of total at any given time
  }
  
  private calculateTheoretical MaxThroughput(): number {
    // Find the bottleneck resource's theoretical max
    let maxThroughput = Infinity;
    for (const tracker of this.resourceStats.values()) {
      const resourceThroughput = 60 / (tracker.avgServiceTime || 1);
      maxThroughput = Math.min(maxThroughput, resourceThroughput);
    }
    return maxThroughput === Infinity ? 0 : maxThroughput;
  }
  
  private calculateValueAddedRatio(): number {
    // Processing time / total cycle time
    // Simplified: assume 70% of cycle time is value-added
    return 0.7;
  }
  
  private calculateConfidenceIntervals(): ConfidenceInterval[] {
    const intervals: ConfidenceInterval[] = [];
    
    // Cycle time confidence interval
    if (this.cycleTimes.length > 1) {
      const mean = this.calculateMean(this.cycleTimes);
      const stdDev = this.calculateStdDev(this.cycleTimes);
      const stderr = stdDev / Math.sqrt(this.cycleTimes.length);
      const margin = 1.96 * stderr; // 95% CI
      
      intervals.push({
        metric: 'Cycle Time',
        mean,
        lower: mean - margin,
        upper: mean + margin,
        confidence: 0.95
      });
    }
    
    return intervals;
  }
  
  private identifyBottlenecks(): BottleneckAnalysis[] {
    const bottlenecks: BottleneckAnalysis[] = [];
    
    for (const [resourceId, tracker] of this.resourceStats) {
      const utilization = tracker.busyTime / (tracker.busyTime + tracker.idleTime + tracker.blockedTime);
      
      // A resource is a bottleneck if utilization > 85% and has significant queues
      const avgQueueLength = tracker.calculateQueueMetrics().avgLength;
      
      if (utilization > 0.85 || avgQueueLength > 5) {
        const severity = Math.min(100, (utilization * 100 + avgQueueLength * 5));
        
        bottlenecks.push({
          resourceId,
          resourceName: tracker.resourceName,
          severity,
          utilization: utilization * 100,
          queueLength: avgQueueLength,
          impact: this.describeBottleneckImpact(severity),
          recommendations: this.generateBottleneckRecommendations(tracker, severity)
        });
      }
    }
    
    return bottlenecks.sort((a, b) => b.severity - a.severity);
  }
  
  private describeBottleneckImpact(severity: number): string {
    if (severity > 80) return 'CRITICAL - Severely limiting throughput';
    if (severity > 60) return 'HIGH - Significantly impacting performance';
    if (severity > 40) return 'MEDIUM - Moderate impact on flow';
    return 'LOW - Minor constraint';
  }
  
  private generateBottleneckRecommendations(tracker: ResourceTracker, severity: number): string[] {
    const recommendations: string[] = [];
    
    if (severity > 70) {
      recommendations.push('Add parallel capacity');
      recommendations.push('Reduce processing time');
    }
    
    if (tracker.calculateQueueMetrics().avgLength > 5) {
      recommendations.push('Improve upstream flow');
      recommendations.push('Consider buffer management');
    }
    
    if (tracker.blockedTime > tracker.busyTime * 0.1) {
      recommendations.push('Improve downstream capacity');
    }
    
    return recommendations;
  }
  
  private predictThroughput(): number {
    // Simple linear prediction based on current trend
    const recent = this.cycleTimes.slice(-10);
    if (recent.length < 2) return 0;
    
    const avgCycleTime = this.calculateMean(recent);
    return avgCycleTime > 0 ? 60 / avgCycleTime : 0;
  }
  
  private calculateCapacityUtilization(): number {
    let totalUtilization = 0;
    let count = 0;
    
    for (const tracker of this.resourceStats.values()) {
      const totalTime = tracker.busyTime + tracker.idleTime + tracker.blockedTime;
      if (totalTime > 0) {
        totalUtilization += tracker.busyTime / totalTime;
        count++;
      }
    }
    
    return count > 0 ? (totalUtilization / count) * 100 : 0;
  }
  
  private calculateOptimality(): number {
    // Compare current throughput to theoretical maximum
    const actualThroughput = this.cycleTimes.length;
    const theoreticalMax = this.calculateTheoreticalMaxThroughput();
    
    if (theoreticalMax === 0) return 0;
    
    const avgCycleTime = this.calculateMean(this.cycleTimes);
    const simulationTime = this.simulationEndTime - this.simulationStartTime;
    const actualRate = avgCycleTime > 0 ? 60 / avgCycleTime : 0;
    
    return Math.min(100, (actualRate / theoreticalMax) * 100);
  }
  
  private identifyImprovements(): ImprovementOpportunity[] {
    const opportunities: ImprovementOpportunity[] = [];
    
    // Check for bottlenecks
    const bottlenecks = this.identifyBottlenecks();
    if (bottlenecks.length > 0) {
      const top = bottlenecks[0];
      opportunities.push({
        area: 'Bottleneck Elimination',
        description: `Resolve bottleneck at ${top.resourceName}`,
        estimatedImpact: top.severity * 0.5,
        difficulty: top.severity > 70 ? 'High' : 'Medium',
        priority: top.severity
      });
    }
    
    // Check for idle resources
    for (const tracker of this.resourceStats.values()) {
      const utilization = tracker.busyTime / (tracker.busyTime + tracker.idleTime + tracker.blockedTime);
      if (utilization < 0.5) {
        opportunities.push({
          area: 'Resource Optimization',
          description: `Reduce or reallocate underutilized resource: ${tracker.resourceName}`,
          estimatedImpact: (1 - utilization) * 20,
          difficulty: 'Low',
          priority: (1 - utilization) * 50
        });
      }
    }
    
    return opportunities.sort((a, b) => b.priority - a.priority);
  }
  
  private resetAll(): void {
    this.entityCompletionTimes = [];
    this.cycleTimes = [];
    this.throughputSamples = [];
    this.resourceStats.clear();
    this.queueStats.clear();
    this.processStats.clear();
    this.totalCost = 0;
    this.totalRevenue = 0;
  }
}

// ============================================================================
// TRACKING CLASSES
// ============================================================================

class ResourceTracker {
  resourceId: string;
  resourceName: string;
  
  busyTime: number = 0;
  idleTime: number = 0;
  blockedTime: number = 0;
  
  entitiesServed: number = 0;
  avgServiceTime: number = 0;
  
  private lastStateChangeTime: number = 0;
  private currentState: 'busy' | 'idle' | 'blocked' = 'idle';
  
  private queueLengths: number[] = [];
  private waitTimes: number[] = [];
  
  constructor(resourceId: string, resourceName: string) {
    this.resourceId = resourceId;
    this.resourceName = resourceName;
  }
  
  recordStateChange(time: number, newState: 'busy' | 'idle' | 'blocked', queueLength: number): void {
    const duration = time - this.lastStateChangeTime;
    
    if (duration > 0) {
      switch (this.currentState) {
        case 'busy':
          this.busyTime += duration;
          break;
        case 'idle':
          this.idleTime += duration;
          break;
        case 'blocked':
          this.blockedTime += duration;
          break;
      }
    }
    
    if (newState === 'busy') {
      this.entitiesServed++;
    }
    
    this.queueLengths.push(queueLength);
    this.currentState = newState;
    this.lastStateChangeTime = time;
  }
  
  calculateUtilization(totalTime: number): number {
    return totalTime > 0 ? this.busyTime / totalTime : 0;
  }
  
  calculateAvailability(): number {
    const totalTime = this.busyTime + this.idleTime + this.blockedTime;
    const availableTime = this.busyTime + this.idleTime;
    return totalTime > 0 ? availableTime / totalTime : 1.0;
  }
  
  calculateQueueMetrics() {
    return {
      avgLength: this.queueLengths.length > 0 
        ? this.queueLengths.reduce((a, b) => a + b, 0) / this.queueLengths.length 
        : 0,
      maxLength: Math.max(...this.queueLengths, 0),
      avgWaitTime: this.waitTimes.length > 0
        ? this.waitTimes.reduce((a, b) => a + b, 0) / this.waitTimes.length
        : 0,
      maxWaitTime: Math.max(...this.waitTimes, 0)
    };
  }
}

class QueueTracker {
  queueId: string;
  queueName: string;
  
  lengths: number[] = [];
  waitTimes: number[] = [];
  lengthOverTime: TimeSeriesPoint[] = [];
  
  constructor(queueId: string, queueName: string) {
    this.queueId = queueId;
    this.queueName = queueName;
  }
  
  recordState(time: number, length: number, waitTime: number): void {
    this.lengths.push(length);
    if (waitTime > 0) {
      this.waitTimes.push(waitTime);
    }
    this.lengthOverTime.push({ time, value: length });
  }
}

class ProcessTracker {
  processId: string;
  processName: string;
  
  cycleTimes: number[] = [];
  cycleEfficiency: number = 0.7;
  processEfficiency: number = 0.85;
  firstPassYield: number = 0.95;
  reworkRate: number = 0.05;
  targetCycleTime: number = 10;
  
  isBottleneck: boolean = false;
  bottleneckSeverity: number = 0;
  utilizationRate: number = 0;
  
  constructor(processId: string, processName: string) {
    this.processId = processId;
    this.processName = processName;
  }
}

