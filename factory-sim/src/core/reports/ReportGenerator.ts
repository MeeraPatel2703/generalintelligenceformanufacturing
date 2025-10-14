/**
 * PROFESSIONAL REPORT GENERATOR
 * 
 * Generates SIMIO-grade simulation reports with:
 * - Executive summaries (1-2 pages)
 * - Technical deep-dives
 * - Comparison reports
 * - AI-powered insights and narratives
 * - Multiple export formats (HTML, PDF-ready)
 */

import { ComprehensiveMetrics } from '../metrics/MetricsCollector';

// ============================================================================
// INTERFACES
// ============================================================================

export interface SimulationReport {
  metadata: ReportMetadata;
  executiveSummary: ExecutiveSummary;
  sections: ReportSections;
  insights: AIInsights;
  recommendations: Recommendation[];
  htmlContent?: string;
}

export interface ReportMetadata {
  reportId: string;
  generatedAt: Date;
  simulationId: string;
  systemName: string;
  reportType: 'executive' | 'technical' | 'comparison';
  author: string;
}

export interface ExecutiveSummary {
  keyFindings: string[];
  criticalMetrics: CriticalMetric[];
  overallAssessment: string;
  bottomLine: string;
}

export interface CriticalMetric {
  name: string;
  value: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  context: string;
}

export interface ReportSections {
  throughputAnalysis: ThroughputSection;
  resourceAnalysis: ResourceSection;
  queueAnalysis: QueueSection;
  financialAnalysis: FinancialSection;
  bottleneckAnalysis: BottleneckSection;
  recommendations: RecommendationSection;
}

export interface ThroughputSection {
  title: string;
  summary: string;
  metrics: any;
  insights: string[];
  charts?: ChartDefinition[];
}

export interface ResourceSection {
  title: string;
  summary: string;
  resources: any[];
  insights: string[];
  utilizationSummary: string;
}

export interface QueueSection {
  title: string;
  summary: string;
  queues: any[];
  insights: string[];
}

export interface FinancialSection {
  title: string;
  summary: string;
  metrics: any;
  insights: string[];
  profitabilityAssessment: string;
}

export interface BottleneckSection {
  title: string;
  summary: string;
  bottlenecks: any[];
  impact: string;
  recommendations: string[];
}

export interface RecommendationSection {
  title: string;
  summary: string;
  recommendations: Recommendation[];
  priorityMatrix: any;
}

export interface AIInsights {
  overallAssessment: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  surprises: string[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'bottleneck' | 'resource' | 'quality' | 'cost' | 'process';
  priority: 'high' | 'medium' | 'low';
  impact: number; // 0-100
  effort: 'low' | 'medium' | 'high';
  estimatedROI: number;
  implementationSteps: string[];
  risks: string[];
}

export interface ChartDefinition {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'gauge';
  title: string;
  data: any;
  config: any;
}

// ============================================================================
// REPORT GENERATOR
// ============================================================================

export class ReportGenerator {
  
  /**
   * Generate comprehensive simulation report
   */
  async generateReport(
    metrics: ComprehensiveMetrics,
    reportType: 'executive' | 'technical' | 'comparison' = 'executive'
  ): Promise<SimulationReport> {
    
    console.log('[ReportGenerator] Generating', reportType, 'report...');
    
    const metadata: ReportMetadata = {
      reportId: `report_${Date.now()}`,
      generatedAt: new Date(),
      simulationId: metrics.metadata.simulationId,
      systemName: metrics.metadata.systemName,
      reportType,
      author: 'SIMIO-Grade DES System'
    };
    
    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(metrics);
    
    // Generate detailed sections
    const sections = this.generateSections(metrics);
    
    // Generate AI insights (for now, rule-based; can be enhanced with Claude API)
    const insights = this.generateAIInsights(metrics);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics);
    
    const report: SimulationReport = {
      metadata,
      executiveSummary,
      sections,
      insights,
      recommendations
    };
    
    console.log('[ReportGenerator] Report generated successfully');
    
    return report;
  }
  
  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(metrics: ComprehensiveMetrics): ExecutiveSummary {
    const keyFindings: string[] = [];
    const criticalMetrics: CriticalMetric[] = [];
    
    // Throughput finding
    const throughputRate = metrics.throughput.entitiesPerHour;
    keyFindings.push(
      `System processed ${metrics.throughput.totalEntitiesProcessed} entities with a throughput rate of ${throughputRate.toFixed(1)} entities/hour`
    );
    
    // Resource utilization finding
    if (metrics.resources.length > 0) {
      const avgUtilization = metrics.resources.reduce((sum, r) => sum + r.utilization, 0) / metrics.resources.length;
      const utilizationStatus = avgUtilization > 0.85 ? 'critical' : avgUtilization > 0.7 ? 'warning' : 'good';
      
      keyFindings.push(
        `Average resource utilization: ${(avgUtilization * 100).toFixed(1)}% - ${this.getUtilizationAssessment(avgUtilization)}`
      );
      
      criticalMetrics.push({
        name: 'System Utilization',
        value: `${(avgUtilization * 100).toFixed(1)}%`,
        status: utilizationStatus,
        trend: 'stable',
        context: 'Overall resource efficiency'
      });
    }
    
    // Financial finding
    if (metrics.financial) {
      keyFindings.push(
        `Financial performance: ${metrics.financial.profitMargin.toFixed(1)}% profit margin with ${metrics.financial.roi.toFixed(1)}% ROI`
      );
      
      criticalMetrics.push({
        name: 'Profit Margin',
        value: `${metrics.financial.profitMargin.toFixed(1)}%`,
        status: metrics.financial.profitMargin > 20 ? 'excellent' : metrics.financial.profitMargin > 10 ? 'good' : 'warning',
        trend: 'stable',
        context: 'Revenue minus operating costs'
      });
    }
    
    // Bottleneck finding
    if (metrics.advanced.bottlenecks && metrics.advanced.bottlenecks.length > 0) {
      const topBottleneck = metrics.advanced.bottlenecks[0];
      keyFindings.push(
        `Primary bottleneck identified: ${topBottleneck.resourceName} (severity: ${topBottleneck.severity.toFixed(0)}%)`
      );
      
      criticalMetrics.push({
        name: 'Bottleneck Severity',
        value: `${topBottleneck.severity.toFixed(0)}%`,
        status: topBottleneck.severity > 70 ? 'critical' : 'warning',
        trend: 'stable',
        context: `Constraining ${topBottleneck.resourceName}`
      });
    }
    
    // Efficiency metric
    criticalMetrics.push({
      name: 'Cycle Time',
      value: `${metrics.throughput.averageCycleTime.toFixed(2)} min`,
      status: metrics.throughput.averageCycleTime < 15 ? 'excellent' : metrics.throughput.averageCycleTime < 30 ? 'good' : 'warning',
      trend: 'stable',
      context: 'Average time in system'
    });
    
    // Overall assessment
    const overallAssessment = this.generateOverallAssessment(metrics);
    
    // Bottom line
    const bottomLine = this.generateBottomLine(metrics);
    
    return {
      keyFindings,
      criticalMetrics,
      overallAssessment,
      bottomLine
    };
  }
  
  /**
   * Generate all report sections
   */
  private generateSections(metrics: ComprehensiveMetrics): ReportSections {
    return {
      throughputAnalysis: this.generateThroughputSection(metrics),
      resourceAnalysis: this.generateResourceSection(metrics),
      queueAnalysis: this.generateQueueSection(metrics),
      financialAnalysis: this.generateFinancialSection(metrics),
      bottleneckAnalysis: this.generateBottleneckSection(metrics),
      recommendations: this.generateRecommendationSection(metrics)
    };
  }
  
  /**
   * Generate throughput analysis section
   */
  private generateThroughputSection(metrics: ComprehensiveMetrics): ThroughputSection {
    const insights: string[] = [];
    
    // Analyze efficiency
    const efficiency = metrics.throughput.throughputEfficiency;
    if (efficiency < 70) {
      insights.push(`System is operating at ${efficiency.toFixed(1)}% of theoretical capacity - significant improvement opportunity`);
    } else if (efficiency > 90) {
      insights.push(`Excellent throughput efficiency at ${efficiency.toFixed(1)}% of theoretical maximum`);
    }
    
    // Analyze cycle time
    const cycleTime = metrics.throughput.averageCycleTime;
    insights.push(`Average cycle time of ${cycleTime.toFixed(2)} minutes suggests ${cycleTime < 20 ? 'efficient' : 'moderate'} processing`);
    
    // Analyze value-added ratio
    const valueAdded = metrics.throughput.valueAddedRatio * 100;
    if (valueAdded < 60) {
      insights.push(`Value-added ratio of ${valueAdded.toFixed(1)}% indicates excessive non-value-added time`);
    }
    
    return {
      title: 'Throughput Performance Analysis',
      summary: this.generateThroughputSummary(metrics.throughput),
      metrics: metrics.throughput,
      insights
    };
  }
  
  /**
   * Generate resource analysis section
   */
  private generateResourceSection(metrics: ComprehensiveMetrics): ResourceSection {
    const insights: string[] = [];
    
    // Analyze utilization distribution
    const utilizations = metrics.resources.map(r => r.utilization);
    const maxUtil = Math.max(...utilizations);
    const minUtil = Math.min(...utilizations);
    
    if (maxUtil - minUtil > 0.4) {
      insights.push(`High utilization variance (${((maxUtil - minUtil) * 100).toFixed(1)}%) suggests unbalanced workload`);
    }
    
    // Identify underutilized resources
    const underutilized = metrics.resources.filter(r => r.utilization < 0.5);
    if (underutilized.length > 0) {
      insights.push(`${underutilized.length} resource(s) underutilized (< 50%) - consider reallocation`);
    }
    
    // Analyze queue lengths
    const heavyQueues = metrics.resources.filter(r => r.averageQueueLength > 5);
    if (heavyQueues.length > 0) {
      insights.push(`${heavyQueues.length} resource(s) experiencing significant queuing - potential capacity constraints`);
    }
    
    const avgUtilization = utilizations.reduce((a, b) => a + b, 0) / utilizations.length;
    const utilizationSummary = `Average system utilization: ${(avgUtilization * 100).toFixed(1)}% - ${this.getUtilizationAssessment(avgUtilization)}`;
    
    return {
      title: 'Resource Utilization & Performance',
      summary: utilizationSummary,
      resources: metrics.resources,
      insights,
      utilizationSummary
    };
  }
  
  /**
   * Generate queue analysis section
   */
  private generateQueueSection(metrics: ComprehensiveMetrics): QueueSection {
    const insights: string[] = [];
    
    if (metrics.queues.length > 0) {
      const avgWaitTime = metrics.queues.reduce((sum, q) => sum + q.averageWaitTime, 0) / metrics.queues.length;
      insights.push(`Average wait time across all queues: ${avgWaitTime.toFixed(2)} minutes`);
      
      const longWaitQueues = metrics.queues.filter(q => q.averageWaitTime > 10);
      if (longWaitQueues.length > 0) {
        insights.push(`${longWaitQueues.length} queue(s) with excessive wait times (> 10 min) - immediate attention needed`);
      }
      
      const serviceLevels = metrics.queues.map(q => q.serviceLevel);
      const avgServiceLevel = serviceLevels.reduce((a, b) => a + b, 0) / serviceLevels.length;
      insights.push(`Average service level: ${(avgServiceLevel * 100).toFixed(1)}% of entities served within target time`);
    }
    
    return {
      title: 'Queue Performance Analysis',
      summary: insights[0] || 'No significant queuing observed',
      queues: metrics.queues,
      insights
    };
  }
  
  /**
   * Generate financial analysis section
   */
  private generateFinancialSection(metrics: ComprehensiveMetrics): FinancialSection {
    const insights: string[] = [];
    
    if (metrics.financial) {
      const f = metrics.financial;
      
      insights.push(`Total revenue: $${f.totalRevenue.toFixed(2)} from ${metrics.throughput.totalEntitiesProcessed} entities`);
      insights.push(`Operating costs: $${f.totalOperatingCost.toFixed(2)} (Labor: ${((f.laborCost / f.totalOperatingCost) * 100).toFixed(1)}%)`);
      
      if (f.profitMargin > 20) {
        insights.push(`Strong profit margin of ${f.profitMargin.toFixed(1)}% indicates healthy operations`);
      } else if (f.profitMargin < 10) {
        insights.push(`Low profit margin of ${f.profitMargin.toFixed(1)}% - cost optimization opportunities exist`);
      }
      
      if (f.roi > 50) {
        insights.push(`Excellent ROI of ${f.roi.toFixed(1)}% demonstrates effective resource investment`);
      }
      
      const profitabilityAssessment = this.assessProfitability(f.profitMargin, f.roi);
      
      return {
        title: 'Financial Performance',
        summary: `Profit margin: ${f.profitMargin.toFixed(1)}%, ROI: ${f.roi.toFixed(1)}%`,
        metrics: metrics.financial,
        insights,
        profitabilityAssessment
      };
    }
    
    return {
      title: 'Financial Performance',
      summary: 'Financial analysis not available',
      metrics: null,
      insights: [],
      profitabilityAssessment: 'Insufficient data'
    };
  }
  
  /**
   * Generate bottleneck analysis section
   */
  private generateBottleneckSection(metrics: ComprehensiveMetrics): BottleneckSection {
    const bottlenecks = metrics.advanced.bottlenecks || [];
    const recommendations: string[] = [];
    
    if (bottlenecks.length > 0) {
      const topBottleneck = bottlenecks[0];
      
      recommendations.push(...topBottleneck.recommendations);
      
      // Add strategic recommendations
      if (topBottleneck.severity > 80) {
        recommendations.push('Consider adding parallel capacity immediately');
        recommendations.push('Implement dedicated queue management');
      }
      
      const impact = bottlenecks.length === 1
        ? `Single critical bottleneck limiting system performance`
        : `${bottlenecks.length} bottlenecks identified, top severity: ${topBottleneck.severity.toFixed(0)}%`;
      
      return {
        title: 'Bottleneck Analysis',
        summary: `${bottlenecks.length} bottleneck(s) identified`,
        bottlenecks,
        impact,
        recommendations
      };
    }
    
    return {
      title: 'Bottleneck Analysis',
      summary: 'No significant bottlenecks detected',
      bottlenecks: [],
      impact: 'System flow is well-balanced',
      recommendations: ['Maintain current resource allocation', 'Monitor for changes in demand']
    };
  }
  
  /**
   * Generate recommendation section
   */
  private generateRecommendationSection(metrics: ComprehensiveMetrics): RecommendationSection {
    const recommendations = this.generateRecommendations(metrics);
    
    return {
      title: 'Strategic Recommendations',
      summary: `${recommendations.length} actionable recommendations identified`,
      recommendations,
      priorityMatrix: this.createPriorityMatrix(recommendations)
    };
  }
  
  /**
   * Generate AI insights (rule-based for now, can be enhanced with Claude API)
   */
  private generateAIInsights(metrics: ComprehensiveMetrics): AIInsights {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];
    const threats: string[] = [];
    const surprises: string[] = [];
    
    // Analyze strengths
    if (metrics.throughput.throughputEfficiency > 85) {
      strengths.push('High throughput efficiency indicates optimal process flow');
    }
    
    if (metrics.financial && metrics.financial.profitMargin > 15) {
      strengths.push('Strong profit margins demonstrate effective cost management');
    }
    
    if (metrics.throughput.firstPassYield > 0.95) {
      strengths.push('Excellent quality with minimal rework required');
    }
    
    // Analyze weaknesses
    if (metrics.resources.some(r => r.utilization > 0.9)) {
      weaknesses.push('Some resources operating at maximum capacity - no buffer for variability');
    }
    
    if (metrics.queues.some(q => q.averageWaitTime > 15)) {
      weaknesses.push('Excessive wait times in certain queues impacting cycle time');
    }
    
    // Identify opportunities
    if (metrics.advanced.improvementPotential.length > 0) {
      const topOpp = metrics.advanced.improvementPotential[0];
      opportunities.push(`${topOpp.area}: ${topOpp.description} (Est. impact: +${topOpp.estimatedImpact.toFixed(1)}%)`);
    }
    
    const underutilized = metrics.resources.filter(r => r.utilization < 0.5);
    if (underutilized.length > 0) {
      opportunities.push(`${underutilized.length} underutilized resource(s) could be reallocated or reduced`);
    }
    
    // Identify threats
    if (metrics.advanced.bottlenecks.length > 0 && metrics.advanced.bottlenecks[0].severity > 70) {
      threats.push('Critical bottleneck could severely limit growth capacity');
    }
    
    if (metrics.financial && metrics.financial.profitMargin < 10) {
      threats.push('Thin profit margins leave little room for cost increases');
    }
    
    // Identify surprises (unexpected findings)
    const avgUtilization = metrics.resources.reduce((sum, r) => sum + r.utilization, 0) / metrics.resources.length;
    if (avgUtilization < 0.6 && metrics.throughput.throughputEfficiency > 80) {
      surprises.push('High efficiency despite moderate utilization - good process design');
    }
    
    const overallAssessment = this.generateOverallAssessment(metrics);
    
    return {
      overallAssessment,
      strengths,
      weaknesses,
      opportunities,
      threats,
      surprises
    };
  }
  
  /**
   * Generate recommendations
   */
  private generateRecommendations(metrics: ComprehensiveMetrics): Recommendation[] {
    const recommendations: Recommendation[] = [];
    let recId = 1;
    
    // Bottleneck recommendations
    metrics.advanced.bottlenecks.forEach((bottleneck, idx) => {
      if (bottleneck.severity > 60) {
        recommendations.push({
          id: `rec_${recId++}`,
          title: `Resolve ${bottleneck.resourceName} Bottleneck`,
          description: `${bottleneck.impact}. ${bottleneck.recommendations[0] || 'Add capacity or optimize process'}`,
          category: 'bottleneck',
          priority: bottleneck.severity > 80 ? 'high' : 'medium',
          impact: bottleneck.severity,
          effort: bottleneck.severity > 80 ? 'high' : 'medium',
          estimatedROI: bottleneck.severity * 1.5,
          implementationSteps: bottleneck.recommendations.slice(0, 3),
          risks: ['May require capital investment', 'Implementation downtime']
        });
      }
    });
    
    // Resource optimization recommendations
    const underutilized = metrics.resources.filter(r => r.utilization < 0.5);
    if (underutilized.length > 0) {
      recommendations.push({
        id: `rec_${recId++}`,
        title: 'Optimize Underutilized Resources',
        description: `${underutilized.length} resource(s) operating below 50% capacity. Consider reallocation, reduction, or reassignment.`,
        category: 'resource',
        priority: 'medium',
        impact: underutilized.length * 15,
        effort: 'low',
        estimatedROI: 25,
        implementationSteps: [
          'Identify alternative uses for underutilized resources',
          'Consider cross-training for flexibility',
          'Evaluate potential for capacity reduction'
        ],
        risks: ['May reduce flexibility for demand spikes']
      });
    }
    
    // Queue management recommendations
    const longQueues = metrics.queues.filter(q => q.averageWaitTime > 10);
    if (longQueues.length > 0) {
      recommendations.push({
        id: `rec_${recId++}`,
        title: 'Improve Queue Management',
        description: `${longQueues.length} queue(s) experiencing wait times > 10 minutes. Implement better scheduling or add capacity.`,
        category: 'process',
        priority: 'high',
        impact: 40,
        effort: 'medium',
        estimatedROI: 35,
        implementationSteps: [
          'Analyze arrival patterns for better scheduling',
          'Implement priority queue disciplines',
          'Consider buffer stock management'
        ],
        risks: ['Changes may affect other parts of system']
      });
    }
    
    // Financial recommendations
    if (metrics.financial && metrics.financial.profitMargin < 15) {
      recommendations.push({
        id: `rec_${recId++}`,
        title: 'Improve Profit Margins',
        description: `Current profit margin of ${metrics.financial.profitMargin.toFixed(1)}% below industry standards. Focus on cost reduction or revenue enhancement.`,
        category: 'cost',
        priority: 'high',
        impact: 50,
        effort: 'medium',
        estimatedROI: 40,
        implementationSteps: [
          'Analyze cost structure for reduction opportunities',
          'Evaluate pricing strategy',
          'Improve operational efficiency to reduce unit costs'
        ],
        risks: ['Cost cutting may impact quality', 'Price increases may reduce volume']
      });
    }
    
    // Sort by priority and impact
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.impact - a.impact;
    });
  }
  
  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  
  private getUtilizationAssessment(utilization: number): string {
    if (utilization > 0.9) return 'Critical - overutilized';
    if (utilization > 0.85) return 'High risk - near capacity';
    if (utilization > 0.7) return 'Healthy - good utilization';
    if (utilization > 0.5) return 'Moderate - room for growth';
    return 'Low - underutilized';
  }
  
  private generateOverallAssessment(metrics: ComprehensiveMetrics): string {
    const throughputEfficiency = metrics.throughput.throughputEfficiency;
    const avgUtilization = metrics.resources.reduce((sum, r) => sum + r.utilization, 0) / metrics.resources.length;
    const profitMargin = metrics.financial?.profitMargin || 0;
    
    let assessment = '';
    
    if (throughputEfficiency > 85 && avgUtilization < 0.85 && profitMargin > 15) {
      assessment = 'EXCELLENT: System is performing at high efficiency with healthy margins and balanced utilization. Continue monitoring and maintain current practices.';
    } else if (throughputEfficiency > 70 && avgUtilization < 0.9 && profitMargin > 10) {
      assessment = 'GOOD: System is performing well with moderate efficiency. Some optimization opportunities exist to improve margins and reduce bottlenecks.';
    } else if (throughputEfficiency > 50 || profitMargin > 5) {
      assessment = 'FAIR: System is functional but has significant improvement opportunities. Focus on bottleneck elimination and cost optimization.';
    } else {
      assessment = 'NEEDS IMPROVEMENT: System is underperforming. Immediate action required to address bottlenecks, improve efficiency, and enhance profitability.';
    }
    
    return assessment;
  }
  
  private generateBottomLine(metrics: ComprehensiveMetrics): string {
    const topImprovement = metrics.advanced.improvementPotential[0];
    const topBottleneck = metrics.advanced.bottlenecks[0];
    
    if (topBottleneck && topBottleneck.severity > 70) {
      return `PRIMARY ACTION: Resolve critical bottleneck at ${topBottleneck.resourceName} to unlock ${topBottleneck.severity.toFixed(0)}% performance improvement.`;
    }
    
    if (topImprovement) {
      return `PRIMARY OPPORTUNITY: ${topImprovement.area} offers +${topImprovement.estimatedImpact.toFixed(1)}% improvement with ${topImprovement.difficulty} implementation effort.`;
    }
    
    return `System is well-balanced. Focus on continuous improvement and monitoring for changing conditions.`;
  }
  
  private generateThroughputSummary(throughput: any): string {
    return `Processed ${throughput.totalEntitiesProcessed} entities at ${throughput.entitiesPerHour.toFixed(1)} per hour with ${throughput.averageCycleTime.toFixed(2)} minute average cycle time. Operating at ${throughput.throughputEfficiency.toFixed(1)}% of theoretical capacity.`;
  }
  
  private assessProfitability(margin: number, roi: number): string {
    if (margin > 20 && roi > 50) return 'Excellent profitability with strong returns';
    if (margin > 15 && roi > 30) return 'Good profitability with healthy returns';
    if (margin > 10 && roi > 15) return 'Moderate profitability - improvement opportunities exist';
    return 'Below-target profitability - cost optimization critical';
  }
  
  private createPriorityMatrix(recommendations: Recommendation[]): any {
    return {
      highPriorityHighImpact: recommendations.filter(r => r.priority === 'high' && r.impact > 50).length,
      highPriorityMediumImpact: recommendations.filter(r => r.priority === 'high' && r.impact <= 50).length,
      mediumPriority: recommendations.filter(r => r.priority === 'medium').length,
      lowPriority: recommendations.filter(r => r.priority === 'low').length
    };
  }
}

