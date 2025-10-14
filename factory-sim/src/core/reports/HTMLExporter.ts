/**
 * HTML REPORT EXPORTER
 * 
 * Converts SimulationReport to beautiful HTML with:
 * - Professional styling
 * - Print-ready layout
 * - Embedded charts/visualizations
 * - Export to PDF capability (via browser print)
 */

import { SimulationReport, CriticalMetric, Recommendation } from './ReportGenerator';

export class HTMLExporter {
  
  /**
   * Export report to HTML
   */
  exportToHTML(report: SimulationReport): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.metadata.systemName} - Simulation Report</title>
  ${this.getStyles()}
</head>
<body>
  <div class="report-container">
    ${this.generateHeader(report)}
    ${this.generateExecutiveSummary(report)}
    ${this.generateKeyMetrics(report)}
    ${this.generateInsights(report)}
    ${this.generateDetailedSections(report)}
    ${this.generateRecommendations(report)}
    ${this.generateFooter(report)}
  </div>
  ${this.getScripts()}
</body>
</html>
    `.trim();
  }
  
  /**
   * Get embedded CSS styles
   */
  private getStyles(): string {
    return `
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    line-height: 1.6;
    color: #1f2937;
    background: #f9fafb;
  }
  
  .report-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    background: white;
  }
  
  /* Header */
  .report-header {
    border-bottom: 3px solid #2563eb;
    padding-bottom: 2rem;
    margin-bottom: 2rem;
  }
  
  .report-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }
  
  .report-subtitle {
    font-size: 1.25rem;
    color: #6b7280;
    margin-bottom: 1rem;
  }
  
  .report-meta {
    display: flex;
    gap: 2rem;
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 1rem;
  }
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .meta-label {
    font-weight: 600;
  }
  
  /* Executive Summary */
  .executive-summary {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: white;
    padding: 2rem;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
  }
  
  .executive-summary h2 {
    font-size: 1.75rem;
    margin-bottom: 1rem;
  }
  
  .overall-assessment {
    font-size: 1.125rem;
    line-height: 1.8;
    margin-bottom: 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 1rem;
    border-radius: 0.375rem;
    border-left: 4px solid rgba(255, 255, 255, 0.5);
  }
  
  .key-findings {
    list-style: none;
  }
  
  .key-findings li {
    padding: 0.75rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .key-findings li:before {
    content: '✓';
    margin-right: 0.75rem;
    font-weight: bold;
  }
  
  .bottom-line {
    margin-top: 1.5rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 0.375rem;
    font-size: 1.125rem;
    font-weight: 600;
  }
  
  /* Metrics Grid */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .metric-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1.5rem;
    position: relative;
    overflow: hidden;
  }
  
  .metric-card.excellent {
    border-left: 4px solid #10b981;
  }
  
  .metric-card.good {
    border-left: 4px solid #3b82f6;
  }
  
  .metric-card.warning {
    border-left: 4px solid #f59e0b;
  }
  
  .metric-card.critical {
    border-left: 4px solid #ef4444;
  }
  
  .metric-name {
    font-size: 0.875rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }
  
  .metric-value {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }
  
  .metric-context {
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  /* Sections */
  .section {
    margin-bottom: 3rem;
  }
  
  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #e5e7eb;
  }
  
  .section-summary {
    background: #f9fafb;
    padding: 1rem;
    border-radius: 0.375rem;
    margin-bottom: 1.5rem;
    border-left: 4px solid #2563eb;
  }
  
  /* Table */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
  }
  
  .data-table th {
    background: #f3f4f6;
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.875rem;
    color: #374151;
    border-bottom: 2px solid #e5e7eb;
  }
  
  .data-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .data-table tr:hover {
    background: #f9fafb;
  }
  
  /* Progress Bar */
  .progress-bar {
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin-top: 0.25rem;
  }
  
  .progress-fill {
    height: 100%;
    background: #2563eb;
    transition: width 0.3s ease;
  }
  
  .progress-fill.excellent {
    background: #10b981;
  }
  
  .progress-fill.warning {
    background: #f59e0b;
  }
  
  .progress-fill.critical {
    background: #ef4444;
  }
  
  /* Insights */
  .insights-list {
    list-style: none;
    margin: 1rem 0;
  }
  
  .insights-list li {
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background: #f0f9ff;
    border-left: 3px solid #2563eb;
    border-radius: 0.25rem;
  }
  
  /* SWOT Analysis */
  .swot-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin: 1rem 0;
  }
  
  .swot-card {
    padding: 1.5rem;
    border-radius: 0.5rem;
  }
  
  .swot-card.strengths {
    background: #d1fae5;
    border: 1px solid #10b981;
  }
  
  .swot-card.weaknesses {
    background: #fee2e2;
    border: 1px solid #ef4444;
  }
  
  .swot-card.opportunities {
    background: #dbeafe;
    border: 1px solid #3b82f6;
  }
  
  .swot-card.threats {
    background: #fef3c7;
    border: 1px solid #f59e0b;
  }
  
  .swot-card h3 {
    font-size: 1.125rem;
    margin-bottom: 1rem;
  }
  
  .swot-card ul {
    list-style: none;
  }
  
  .swot-card li {
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  /* Recommendations */
  .recommendation-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 1rem;
  }
  
  .recommendation-card.high-priority {
    border-left: 4px solid #ef4444;
  }
  
  .recommendation-card.medium-priority {
    border-left: 4px solid #f59e0b;
  }
  
  .recommendation-card.low-priority {
    border-left: 4px solid #3b82f6;
  }
  
  .rec-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 1rem;
  }
  
  .rec-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .rec-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .rec-badge.high {
    background: #fee2e2;
    color: #991b1b;
  }
  
  .rec-badge.medium {
    background: #fef3c7;
    color: #92400e;
  }
  
  .rec-badge.low {
    background: #dbeafe;
    color: #1e40af;
  }
  
  .rec-description {
    color: #6b7280;
    margin-bottom: 1rem;
  }
  
  .rec-metrics {
    display: flex;
    gap: 2rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }
  
  .rec-metric-item {
    display: flex;
    flex-direction: column;
  }
  
  .rec-metric-label {
    color: #6b7280;
    font-size: 0.75rem;
    text-transform: uppercase;
  }
  
  .rec-metric-value {
    font-weight: 600;
    color: #1f2937;
  }
  
  .rec-steps {
    margin-top: 1rem;
  }
  
  .rec-steps h4 {
    font-size: 0.875rem;
    color: #374151;
    margin-bottom: 0.5rem;
  }
  
  .rec-steps ol {
    margin-left: 1.5rem;
    color: #6b7280;
  }
  
  /* Footer */
  .report-footer {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 2px solid #e5e7eb;
    text-align: center;
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  /* Print Styles */
  @media print {
    body {
      background: white;
    }
    
    .report-container {
      max-width: none;
      padding: 0;
    }
    
    .section {
      page-break-inside: avoid;
    }
    
    .recommendation-card {
      page-break-inside: avoid;
    }
  }
</style>
    `;
  }
  
  /**
   * Generate report header
   */
  private generateHeader(report: SimulationReport): string {
    const { metadata } = report;
    return `
<div class="report-header">
  <h1 class="report-title">${metadata.systemName}</h1>
  <h2 class="report-subtitle">Simulation Performance Report</h2>
  <div class="report-meta">
    <div class="meta-item">
      <span class="meta-label">Report ID:</span>
      <span>${metadata.reportId}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Generated:</span>
      <span>${metadata.generatedAt.toLocaleString()}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Type:</span>
      <span>${metadata.reportType.toUpperCase()}</span>
    </div>
  </div>
</div>
    `;
  }
  
  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(report: SimulationReport): string {
    const { executiveSummary } = report;
    return `
<div class="executive-summary">
  <h2>Executive Summary</h2>
  <div class="overall-assessment">
    <strong>Overall Assessment:</strong> ${executiveSummary.overallAssessment}
  </div>
  <ul class="key-findings">
    ${executiveSummary.keyFindings.map(finding => `<li>${finding}</li>`).join('\n    ')}
  </ul>
  <div class="bottom-line">
    <strong>Bottom Line:</strong> ${executiveSummary.bottomLine}
  </div>
</div>
    `;
  }
  
  /**
   * Generate key metrics cards
   */
  private generateKeyMetrics(report: SimulationReport): string {
    const { criticalMetrics } = report.executiveSummary;
    return `
<div class="metrics-grid">
  ${criticalMetrics.map(metric => this.generateMetricCard(metric)).join('\n  ')}
</div>
    `;
  }
  
  private generateMetricCard(metric: CriticalMetric): string {
    return `
<div class="metric-card ${metric.status}">
  <div class="metric-name">${metric.name}</div>
  <div class="metric-value">${metric.value}</div>
  <div class="metric-context">${metric.context}</div>
</div>
    `;
  }
  
  /**
   * Generate AI insights section
   */
  private generateInsights(report: SimulationReport): string {
    const { insights } = report;
    return `
<div class="section">
  <h2 class="section-title">AI-Powered Insights</h2>
  <div class="swot-grid">
    <div class="swot-card strengths">
      <h3>💪 Strengths</h3>
      <ul>
        ${insights.strengths.map(s => `<li>${s}</li>`).join('\n        ')}
        ${insights.strengths.length === 0 ? '<li>No specific strengths identified</li>' : ''}
      </ul>
    </div>
    <div class="swot-card weaknesses">
      <h3>⚠️ Weaknesses</h3>
      <ul>
        ${insights.weaknesses.map(w => `<li>${w}</li>`).join('\n        ')}
        ${insights.weaknesses.length === 0 ? '<li>No significant weaknesses found</li>' : ''}
      </ul>
    </div>
    <div class="swot-card opportunities">
      <h3>🎯 Opportunities</h3>
      <ul>
        ${insights.opportunities.map(o => `<li>${o}</li>`).join('\n        ')}
        ${insights.opportunities.length === 0 ? '<li>System well-optimized</li>' : ''}
      </ul>
    </div>
    <div class="swot-card threats">
      <h3>🔴 Threats</h3>
      <ul>
        ${insights.threats.map(t => `<li>${t}</li>`).join('\n        ')}
        ${insights.threats.length === 0 ? '<li>No immediate threats identified</li>' : ''}
      </ul>
    </div>
  </div>
  ${insights.surprises.length > 0 ? `
  <div class="section-summary">
    <strong>Unexpected Findings:</strong>
    <ul class="insights-list">
      ${insights.surprises.map(s => `<li>💡 ${s}</li>`).join('\n      ')}
    </ul>
  </div>
  ` : ''}
</div>
    `;
  }
  
  /**
   * Generate detailed analysis sections
   */
  private generateDetailedSections(report: SimulationReport): string {
    const { sections } = report;
    let html = '';
    
    // Throughput section
    html += this.generateThroughputSection(sections.throughputAnalysis);
    
    // Resource section
    html += this.generateResourceSection(sections.resourceAnalysis);
    
    // Financial section
    if (sections.financialAnalysis.metrics) {
      html += this.generateFinancialSection(sections.financialAnalysis);
    }
    
    // Bottleneck section
    if (sections.bottleneckAnalysis.bottlenecks.length > 0) {
      html += this.generateBottleneckSection(sections.bottleneckAnalysis);
    }
    
    return html;
  }
  
  private generateThroughputSection(section: any): string {
    return `
<div class="section">
  <h2 class="section-title">📊 ${section.title}</h2>
  <div class="section-summary">${section.summary}</div>
  <ul class="insights-list">
    ${section.insights.map((insight: string) => `<li>${insight}</li>`).join('\n    ')}
  </ul>
</div>
    `;
  }
  
  private generateResourceSection(section: any): string {
    return `
<div class="section">
  <h2 class="section-title">⚙️ ${section.title}</h2>
  <div class="section-summary">${section.utilizationSummary}</div>
  <table class="data-table">
    <thead>
      <tr>
        <th>Resource</th>
        <th>Utilization</th>
        <th>OEE</th>
        <th>Entities Served</th>
        <th>Avg Queue</th>
        <th>Cost/Entity</th>
      </tr>
    </thead>
    <tbody>
      ${section.resources.map((resource: any) => `
      <tr>
        <td><strong>${resource.resourceName}</strong></td>
        <td>
          ${(resource.utilization * 100).toFixed(1)}%
          <div class="progress-bar">
            <div class="progress-fill ${this.getUtilizationClass(resource.utilization)}" style="width: ${resource.utilization * 100}%"></div>
          </div>
        </td>
        <td>${(resource.oee * 100).toFixed(1)}%</td>
        <td>${resource.entitiesServed}</td>
        <td>${resource.averageQueueLength.toFixed(1)}</td>
        <td>$${resource.costPerEntity.toFixed(2)}</td>
      </tr>
      `).join('\n      ')}
    </tbody>
  </table>
  <ul class="insights-list">
    ${section.insights.map((insight: string) => `<li>${insight}</li>`).join('\n    ')}
  </ul>
</div>
    `;
  }
  
  private generateFinancialSection(section: any): string {
    const m = section.metrics;
    return `
<div class="section">
  <h2 class="section-title">💰 ${section.title}</h2>
  <div class="section-summary">${section.profitabilityAssessment}</div>
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-name">Total Revenue</div>
      <div class="metric-value">$${m.totalRevenue.toFixed(2)}</div>
      <div class="metric-context">From completed entities</div>
    </div>
    <div class="metric-card">
      <div class="metric-name">Operating Cost</div>
      <div class="metric-value">$${m.totalOperatingCost.toFixed(2)}</div>
      <div class="metric-context">Total expenses</div>
    </div>
    <div class="metric-card ${m.profitMargin > 15 ? 'excellent' : m.profitMargin > 10 ? 'good' : 'warning'}">
      <div class="metric-name">Profit Margin</div>
      <div class="metric-value">${m.profitMargin.toFixed(1)}%</div>
      <div class="metric-context">Revenue - Costs</div>
    </div>
    <div class="metric-card ${m.roi > 30 ? 'excellent' : m.roi > 15 ? 'good' : 'warning'}">
      <div class="metric-name">ROI</div>
      <div class="metric-value">${m.roi.toFixed(1)}%</div>
      <div class="metric-context">Return on investment</div>
    </div>
  </div>
  <ul class="insights-list">
    ${section.insights.map((insight: string) => `<li>${insight}</li>`).join('\n    ')}
  </ul>
</div>
    `;
  }
  
  private generateBottleneckSection(section: any): string {
    return `
<div class="section">
  <h2 class="section-title">🔴 ${section.title}</h2>
  <div class="section-summary"><strong>Impact:</strong> ${section.impact}</div>
  ${section.bottlenecks.map((bottleneck: any, idx: number) => `
  <div class="recommendation-card ${bottleneck.severity > 70 ? 'high-priority' : 'medium-priority'}">
    <div class="rec-header">
      <div class="rec-title">${bottleneck.resourceName}</div>
      <div class="rec-badge ${bottleneck.severity > 70 ? 'high' : 'medium'}">SEVERITY: ${bottleneck.severity.toFixed(0)}%</div>
    </div>
    <div class="rec-description">${bottleneck.impact}</div>
    ${bottleneck.recommendations.length > 0 ? `
    <div class="rec-steps">
      <h4>Recommended Actions:</h4>
      <ol>
        ${bottleneck.recommendations.map((rec: string) => `<li>${rec}</li>`).join('\n        ')}
      </ol>
    </div>
    ` : ''}
  </div>
  `).join('\n  ')}
</div>
    `;
  }
  
  /**
   * Generate recommendations section
   */
  private generateRecommendations(report: SimulationReport): string {
    const recommendations = report.recommendations;
    return `
<div class="section">
  <h2 class="section-title">💡 Strategic Recommendations</h2>
  <div class="section-summary">
    ${recommendations.length} actionable recommendations prioritized by impact and feasibility.
  </div>
  ${recommendations.map(rec => this.generateRecommendationCard(rec)).join('\n  ')}
</div>
    `;
  }
  
  private generateRecommendationCard(rec: Recommendation): string {
    return `
<div class="recommendation-card ${rec.priority}-priority">
  <div class="rec-header">
    <div class="rec-title">${rec.title}</div>
    <div class="rec-badge ${rec.priority}">${rec.priority}</div>
  </div>
  <div class="rec-description">${rec.description}</div>
  <div class="rec-metrics">
    <div class="rec-metric-item">
      <span class="rec-metric-label">Impact</span>
      <span class="rec-metric-value">${rec.impact.toFixed(0)}%</span>
    </div>
    <div class="rec-metric-item">
      <span class="rec-metric-label">Effort</span>
      <span class="rec-metric-value">${rec.effort.toUpperCase()}</span>
    </div>
    <div class="rec-metric-item">
      <span class="rec-metric-label">Est. ROI</span>
      <span class="rec-metric-value">${rec.estimatedROI.toFixed(0)}%</span>
    </div>
    <div class="rec-metric-item">
      <span class="rec-metric-label">Category</span>
      <span class="rec-metric-value">${rec.category.toUpperCase()}</span>
    </div>
  </div>
  ${rec.implementationSteps.length > 0 ? `
  <div class="rec-steps">
    <h4>Implementation Steps:</h4>
    <ol>
      ${rec.implementationSteps.map(step => `<li>${step}</li>`).join('\n      ')}
    </ol>
  </div>
  ` : ''}
  ${rec.risks.length > 0 ? `
  <div class="rec-steps">
    <h4>Risks to Consider:</h4>
    <ul>
      ${rec.risks.map(risk => `<li>${risk}</li>`).join('\n      ')}
    </ul>
  </div>
  ` : ''}
</div>
    `;
  }
  
  /**
   * Generate footer
   */
  private generateFooter(report: SimulationReport): string {
    return `
<div class="report-footer">
  <p>Generated by SIMIO-Grade DES System | ${report.metadata.generatedAt.toLocaleString()}</p>
  <p>Report ID: ${report.metadata.reportId} | Simulation ID: ${report.metadata.simulationId}</p>
  <p style="margin-top: 1rem; font-size: 0.75rem;">
    This report is print-ready. Use your browser's Print function (Ctrl/Cmd + P) to save as PDF.
  </p>
</div>
    `;
  }
  
  /**
   * Get embedded scripts (for future enhancements like charts)
   */
  private getScripts(): string {
    return `
<script>
  // Future: Add Chart.js or D3.js for visualizations
  console.log('Simulation Report Loaded');
</script>
    `;
  }
  
  /**
   * Helper methods
   */
  private getUtilizationClass(utilization: number): string {
    if (utilization > 0.9) return 'critical';
    if (utilization > 0.75) return 'warning';
    return 'excellent';
  }
}

