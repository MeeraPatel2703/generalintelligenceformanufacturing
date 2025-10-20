/**
 * COMPREHENSIVE RESULTS PAGE
 *
 * Displays ALL Simio-style statistics and metrics:
 * - Executive Summary Dashboard
 * - Entity Statistics
 * - Resource Utilization
 * - Queue Statistics
 * - Performance Metrics
 * - Cost Analysis
 * - Statistical Analysis with Confidence Intervals
 * - Time Series Charts
 * - Bottleneck Analysis
 * - SMORE Plots
 * - Export capabilities
 */

import React, { useState } from 'react';
import { ComprehensiveSimulationResults } from '../types/simulation';

interface Props {
  results: ComprehensiveSimulationResults;
  onBack?: () => void;
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
}

export const ComprehensiveResultsPage: React.FC<Props> = ({ results, onBack, onExport }) => {
  const [activeTab, setActiveTab] = useState<string>('summary');

  const tabs = [
    { id: 'summary', label: 'Executive Summary', icon: '📊' },
    { id: 'entities', label: 'Entity Statistics', icon: '📦' },
    { id: 'resources', label: 'Resource Utilization', icon: '🏭' },
    { id: 'queues', label: 'Queue Statistics', icon: '⏳' },
    { id: 'performance', label: 'Performance Metrics', icon: '⚡' },
    { id: 'cost', label: 'Cost Analysis', icon: '💰' },
    { id: 'statistical', label: 'Statistical Analysis', icon: '📈' },
    { id: 'timeseries', label: 'Time Series', icon: '📉' },
    { id: 'bottleneck', label: 'Bottleneck Analysis', icon: '🎯' }
  ];

  return (
    <div className="comprehensive-results">
      {/* Header */}
      <div className="results-header">
        <div className="header-left">
          {onBack && (
            <button onClick={onBack} className="back-button">
              ← Back
            </button>
          )}
          <h1>Simulation Results</h1>
          <div className="status-badge" data-status={results.executiveSummary.status}>
            {results.executiveSummary.status.toUpperCase()}
          </div>
        </div>

        <div className="header-actions">
          <button onClick={() => onExport?.('pdf')} className="export-btn">
            📄 Export PDF
          </button>
          <button onClick={() => onExport?.('excel')} className="export-btn">
            📊 Export Excel
          </button>
          <button onClick={() => onExport?.('csv')} className="export-btn">
            📋 Export CSV
          </button>
        </div>
      </div>

      {/* Warnings Banner */}
      {results.executiveSummary.warnings.length > 0 && (
        <div className="warnings-banner">
          <div className="warning-icon">⚠️</div>
          <div className="warning-content">
            <h3>Warnings</h3>
            <ul>
              {results.executiveSummary.warnings.map((warning: string, i: number) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="results-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="results-content">
        {activeTab === 'summary' && <ExecutiveSummaryView summary={results.executiveSummary} />}
        {activeTab === 'entities' && <EntityStatisticsView stats={results.entityStats} />}
        {activeTab === 'resources' && <ResourceStatisticsView stats={results.resourceStats} />}
        {activeTab === 'queues' && <QueueStatisticsView stats={results.queueStats} />}
        {activeTab === 'performance' && <PerformanceMetricsView metrics={results.performanceMetrics} />}
        {activeTab === 'cost' && <CostAnalysisView analysis={results.costAnalysis} />}
        {activeTab === 'statistical' && <StatisticalAnalysisView analysis={results.statisticalAnalysis} />}
        {activeTab === 'timeseries' && <TimeSeriesView data={results.timeSeriesData} />}
        {activeTab === 'bottleneck' && <BottleneckAnalysisView analysis={results.bottleneckAnalysis} />}
      </div>

      <style jsx>{`
        .comprehensive-results {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #f5f7fa;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          background: white;
          border-bottom: 1px solid #e1e8ed;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .back-button {
          padding: 0.5rem 1rem;
          background: #f0f0f0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .back-button:hover {
          background: #e0e0e0;
        }

        .results-header h1 {
          margin: 0;
          font-size: 1.8rem;
          color: #2c3e50;
        }

        .status-badge {
          padding: 0.4rem 1rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge[data-status="success"] {
          background: #d4edda;
          color: #155724;
        }

        .status-badge[data-status="warning"] {
          background: #fff3cd;
          color: #856404;
        }

        .status-badge[data-status="error"] {
          background: #f8d7da;
          color: #721c24;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .export-btn {
          padding: 0.6rem 1.2rem;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .export-btn:hover {
          background: #2980b9;
        }

        .warnings-banner {
          display: flex;
          gap: 1rem;
          padding: 1rem 2rem;
          background: #fff3cd;
          border-bottom: 1px solid #ffc107;
        }

        .warning-icon {
          font-size: 1.5rem;
        }

        .warning-content h3 {
          margin: 0 0 0.5rem 0;
          color: #856404;
        }

        .warning-content ul {
          margin: 0;
          padding-left: 1.5rem;
          color: #856404;
        }

        .results-tabs {
          display: flex;
          padding: 0 2rem;
          background: white;
          border-bottom: 2px solid #e1e8ed;
          overflow-x: auto;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          white-space: nowrap;
          color: #7f8c8d;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .tab:hover {
          background: #f8f9fa;
          color: #2c3e50;
        }

        .tab.active {
          border-bottom-color: #3498db;
          color: #3498db;
          font-weight: 600;
        }

        .tab-icon {
          font-size: 1.2rem;
        }

        .results-content {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .results-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .results-tabs {
            overflow-x: scroll;
          }

          .results-content {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

// =============================================================================
// TAB CONTENT COMPONENTS
// =============================================================================

const ExecutiveSummaryView: React.FC<{ summary: any }> = ({ summary }) => (
  <div className="executive-summary">
    <div className="summary-grid">
      {/* Simulation Info Card */}
      <div className="info-card">
        <h2>Simulation Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Run Date:</span>
            <span className="value">{new Date(summary.runDate).toLocaleString()}</span>
          </div>
          <div className="info-item">
            <span className="label">Duration:</span>
            <span className="value">{summary.simulationDuration} hours</span>
          </div>
          <div className="info-item">
            <span className="label">Warm-up:</span>
            <span className="value">{summary.warmupPeriod} hours</span>
          </div>
          <div className="info-item">
            <span className="label">Replications:</span>
            <span className="value">{summary.replications}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <MetricCard
        title="Total Throughput"
        value={summary.keyMetrics.totalThroughput.toFixed(1)}
        unit="units/week"
        icon="🚀"
        trend="neutral"
      />

      <MetricCard
        title="Average Lead Time"
        value={summary.keyMetrics.averageLeadTime.toFixed(1)}
        unit="days"
        icon="⏱️"
        trend="neutral"
      />

      <MetricCard
        title="System Utilization"
        value={(summary.keyMetrics.systemUtilization * 100).toFixed(1)}
        unit="%"
        icon="🏭"
        trend={summary.keyMetrics.systemUtilization > 0.85 ? 'up' : 'down'}
      />

      <MetricCard
        title="On-Time Delivery"
        value={(summary.keyMetrics.onTimeDelivery * 100).toFixed(1)}
        unit="%"
        icon="✅"
        trend={summary.keyMetrics.onTimeDelivery > 0.90 ? 'up' : 'down'}
      />

      <MetricCard
        title="Quality Rate"
        value={(summary.keyMetrics.qualityRate * 100).toFixed(1)}
        unit="%"
        icon="⭐"
        trend={summary.keyMetrics.qualityRate > 0.95 ? 'up' : 'down'}
      />
    </div>

    <style jsx>{`
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
      }

      .info-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .info-card h2 {
        margin: 0 0 1rem 0;
        font-size: 1.2rem;
        color: #2c3e50;
      }

      .info-grid {
        display: grid;
        gap: 0.75rem;
      }

      .info-item {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #ecf0f1;
      }

      .info-item:last-child {
        border-bottom: none;
      }

      .label {
        color: #7f8c8d;
        font-weight: 500;
      }

      .value {
        color: #2c3e50;
        font-weight: 600;
      }
    `}</style>
  </div>
);

const MetricCard: React.FC<{
  title: string;
  value: string;
  unit: string;
  icon: string;
  trend: 'up' | 'down' | 'neutral';
}> = ({ title, value, unit, icon, trend }) => (
  <div className={`metric-card trend-${trend}`}>
    <div className="metric-icon">{icon}</div>
    <div className="metric-content">
      <div className="metric-title">{title}</div>
      <div className="metric-value">
        {value} <span className="metric-unit">{unit}</span>
      </div>
    </div>

    <style jsx>{`
      .metric-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        display: flex;
        gap: 1rem;
        border-left: 4px solid #95a5a6;
      }

      .metric-card.trend-up {
        border-left-color: #27ae60;
      }

      .metric-card.trend-down {
        border-left-color: #e74c3c;
      }

      .metric-icon {
        font-size: 2.5rem;
      }

      .metric-content {
        flex: 1;
      }

      .metric-title {
        font-size: 0.9rem;
        color: #7f8c8d;
        margin-bottom: 0.5rem;
      }

      .metric-value {
        font-size: 2rem;
        font-weight: 700;
        color: #2c3e50;
      }

      .metric-unit {
        font-size: 0.9rem;
        font-weight: 400;
        color: #95a5a6;
      }
    `}</style>
  </div>
);

const EntityStatisticsView: React.FC<{ stats: any }> = ({ stats }) => (
  <div className="entity-stats">
    <h2>Entity Flow Statistics</h2>

    <div className="stats-grid">
      <StatCard label="Total Created" value={stats.totalEntitiesCreated} />
      <StatCard label="Total Destroyed" value={stats.totalEntitiesDestroyed} />
      <StatCard label="In System" value={stats.entitiesInSystem} />
    </div>

    <h3>Time Statistics</h3>
    <StatisticTable
      stats={[
        { name: 'Time in System', data: stats.timeInSystem },
        { name: 'Value Added Time', data: stats.valueAdded },
        { name: 'Flow Time', data: stats.flowTime },
        { name: 'Cycle Time', data: stats.cycleTime }
      ]}
    />

    <h3>By Entity Type</h3>
    <EntityTypeTable types={stats.byEntityType} />

    <style jsx>{`
      .entity-stats h2, .entity-stats h3 {
        color: #2c3e50;
        margin: 1.5rem 0 1rem;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }
    `}</style>
  </div>
);

const ResourceStatisticsView: React.FC<{ stats: any[] }> = ({ stats }) => (
  <div className="resource-stats">
    <h2>Resource Utilization Statistics</h2>

    {stats.map(resource => (
      <div key={resource.resourceName} className="resource-card">
        <div className="resource-header">
          <h3>{resource.resourceName}</h3>
          <div className="resource-type">{resource.resourceType}</div>
        </div>

        <div className="utilization-bar">
          <div
            className="utilization-fill"
            style={{ width: `${resource.utilization.average * 100}%` }}
          />
          <span className="utilization-text">
            {(resource.utilization.average * 100).toFixed(1)}% Utilization
          </span>
        </div>

        <div className="resource-stats-grid">
          <div className="stat-item">
            <span className="stat-label">Capacity:</span>
            <span className="stat-value">{resource.capacity}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Seizures:</span>
            <span className="stat-value">{resource.numberOfSeizures}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg Seizure Time:</span>
            <span className="stat-value">{resource.averageSeizureTime.toFixed(2)} hrs</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg Content:</span>
            <span className="stat-value">{resource.contentAverage.toFixed(2)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Max Content:</span>
            <span className="stat-value">{resource.contentMaximum}</span>
          </div>
        </div>

        <h4>Time Breakdown</h4>
        <div className="time-breakdown">
          <TimeBar label="Busy" value={resource.busyTime.average} color="#27ae60" />
          <TimeBar label="Idle" value={resource.idleTime.average} color="#95a5a6" />
        </div>
      </div>
    ))}

    <style jsx>{`
      .resource-stats h2 {
        color: #2c3e50;
        margin-bottom: 1.5rem;
      }

      .resource-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .resource-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .resource-header h3 {
        margin: 0;
        color: #2c3e50;
      }

      .resource-type {
        padding: 0.3rem 0.8rem;
        background: #ecf0f1;
        border-radius: 12px;
        font-size: 0.85rem;
        color: #7f8c8d;
      }

      .utilization-bar {
        position: relative;
        height: 40px;
        background: #ecf0f1;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 1rem;
      }

      .utilization-fill {
        position: absolute;
        height: 100%;
        background: linear-gradient(90deg, #3498db, #2980b9);
        transition: width 0.3s;
      }

      .utilization-text {
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        color: #2c3e50;
        z-index: 1;
      }

      .resource-stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin: 1rem 0;
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .stat-label {
        font-size: 0.85rem;
        color: #7f8c8d;
      }

      .stat-value {
        font-size: 1.1rem;
        font-weight: 600;
        color: #2c3e50;
      }

      .resource-card h4 {
        margin: 1.5rem 0 1rem;
        color: #2c3e50;
      }

      .time-breakdown {
        display: grid;
        gap: 0.75rem;
      }
    `}</style>
  </div>
);

const QueueStatisticsView: React.FC<{ stats: any[] }> = ({ stats }) => (
  <div className="queue-stats">
    <h2>Queue Statistics</h2>

    <div className="queue-table">
      <table>
        <thead>
          <tr>
            <th>Queue Name</th>
            <th>Avg Length</th>
            <th>Max Length</th>
            <th>Avg Wait (hrs)</th>
            <th>Max Wait (hrs)</th>
            <th>Entered</th>
            <th>% Time Empty</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(queue => (
            <tr key={queue.queueName}>
              <td>{queue.queueName}</td>
              <td>{queue.avgQueueLength.toFixed(2)}</td>
              <td>{queue.maxQueueLength}</td>
              <td>{queue.avgWaitTime.toFixed(2)}</td>
              <td>{queue.maxWaitTime.toFixed(2)}</td>
              <td>{queue.numberEntered}</td>
              <td>{queue.percentTimeEmpty.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <style jsx>{`
      .queue-stats h2 {
        color: #2c3e50;
        margin-bottom: 1.5rem;
      }

      .queue-table {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th {
        background: #ecf0f1;
        padding: 1rem;
        text-align: left;
        font-weight: 600;
        color: #2c3e50;
        border-bottom: 2px solid #bdc3c7;
      }

      td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #ecf0f1;
        color: #2c3e50;
      }

      tr:hover {
        background: #f8f9fa;
      }
    `}</style>
  </div>
);

const PerformanceMetricsView: React.FC<{ metrics: any }> = ({ metrics }) => (
  <div className="performance-metrics">
    <h2>Performance Metrics</h2>

    {/* Little's Law Verification */}
    <div className="metric-card">
      <h3>Little's Law Verification</h3>
      <div className="littles-law">
        <div className="law-formula">
          WIP = Throughput × Lead Time
        </div>
        <div className="law-values">
          <div>WIP: {metrics.littlesLaw.wip.toFixed(2)}</div>
          <div>Throughput: {metrics.littlesLaw.throughput.toFixed(3)}/hr</div>
          <div>Lead Time: {metrics.littlesLaw.leadTime.toFixed(2)} hrs</div>
        </div>
        <div className={`law-status ${metrics.littlesLaw.verified ? 'verified' : 'error'}`}>
          {metrics.littlesLaw.verified ? '✓ Verified' : '✗ Discrepancy Detected'}
          {!metrics.littlesLaw.verified && ` (${metrics.littlesLaw.discrepancy.toFixed(1)}%)`}
        </div>
      </div>
    </div>

    {/* Quality Metrics */}
    <div className="metric-card">
      <h3>Quality Metrics</h3>
      <div className="quality-grid">
        <QualityMetric label="First Pass Yield" value={metrics.firstPassYield} />
        <QualityMetric label="Total Yield" value={metrics.totalYield} />
        <QualityMetric label="Defect Rate" value={metrics.defectRate} inverse />
        <QualityMetric label="Rework Rate" value={metrics.reworkRate} inverse />
      </div>
    </div>

    {/* Delivery Metrics */}
    <div className="metric-card">
      <h3>Delivery Performance</h3>
      <div className="delivery-grid">
        <ProgressBar label="On-Time Delivery" value={metrics.onTimeDeliveryRate * 100} target={95} />
        <ProgressBar label="Late Orders" value={metrics.lateOrderPercentage * 100} target={5} inverse />
      </div>
    </div>

    <style jsx>{`
      .performance-metrics h2 {
        color: #2c3e50;
        margin-bottom: 1.5rem;
      }

      .metric-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .metric-card h3 {
        margin: 0 0 1rem 0;
        color: #2c3e50;
        font-size: 1.1rem;
      }

      .littles-law {
        display: grid;
        gap: 1rem;
      }

      .law-formula {
        font-size: 1.2rem;
        font-weight: 600;
        color: #3498db;
        text-align: center;
        padding: 1rem;
        background: #ecf0f1;
        border-radius: 6px;
      }

      .law-values {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        text-align: center;
      }

      .law-values > div {
        padding: 0.75rem;
        background: #f8f9fa;
        border-radius: 6px;
        font-weight: 500;
      }

      .law-status {
        padding: 0.75rem;
        border-radius: 6px;
        text-align: center;
        font-weight: 600;
      }

      .law-status.verified {
        background: #d4edda;
        color: #155724;
      }

      .law-status.error {
        background: #f8d7da;
        color: #721c24;
      }

      .quality-grid, .delivery-grid {
        display: grid;
        gap: 1rem;
      }
    `}</style>
  </div>
);

const CostAnalysisView: React.FC<{ analysis: any }> = ({ analysis }) => (
  <div className="cost-analysis">
    <h2>Cost Analysis</h2>

    <div className="cost-summary">
      <div className="cost-card total-cost">
        <div className="cost-label">Total Cost</div>
        <div className="cost-value">${analysis.totalCost.toLocaleString()}</div>
      </div>
      <div className="cost-card revenue">
        <div className="cost-label">Revenue</div>
        <div className="cost-value">${analysis.revenue.toLocaleString()}</div>
      </div>
      <div className="cost-card profit">
        <div className="cost-label">Profit</div>
        <div className="cost-value">${analysis.profit.toLocaleString()}</div>
      </div>
      <div className="cost-card margin">
        <div className="cost-label">Profit Margin</div>
        <div className="cost-value">{analysis.profitMargin.toFixed(1)}%</div>
      </div>
    </div>

    <h3>Cost Breakdown</h3>
    <CostBreakdownChart breakdown={analysis.breakdown} total={analysis.totalCost} />

    <style jsx>{`
      .cost-analysis h2 {
        color: #2c3e50;
        margin-bottom: 1.5rem;
      }

      .cost-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .cost-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        text-align: center;
      }

      .cost-label {
        font-size: 0.9rem;
        color: #7f8c8d;
        margin-bottom: 0.5rem;
      }

      .cost-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #2c3e50;
      }

      .cost-card.total-cost {
        border-left: 4px solid #e74c3c;
      }

      .cost-card.revenue {
        border-left: 4px solid #3498db;
      }

      .cost-card.profit {
        border-left: 4px solid #27ae60;
      }

      .cost-card.margin {
        border-left: 4px solid #f39c12;
      }

      .cost-analysis h3 {
        margin: 2rem 0 1rem;
        color: #2c3e50;
      }
    `}</style>
  </div>
);

const StatisticalAnalysisView: React.FC<{ analysis: any }> = ({ analysis }) => (
  <div className="statistical-analysis">
    <h2>Statistical Analysis</h2>

    <h3>Confidence Intervals (95%)</h3>
    <div className="ci-table">
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Point Estimate</th>
            <th>Lower Bound</th>
            <th>Upper Bound</th>
            <th>Std Error</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(analysis.confidenceIntervals).map(([metric, ci]: [string, any]) => (
            <tr key={metric}>
              <td>{metric}</td>
              <td>{ci.pointEstimate.toFixed(2)}</td>
              <td>{ci.lowerBound.toFixed(2)}</td>
              <td>{ci.upperBound.toFixed(2)}</td>
              <td>{ci.standardError.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <h3>SMORE Plots</h3>
    <div className="smore-plots">
      {Object.entries(analysis.smorePlots).map(([metric, data]: [string, any]) => (
        <SMOREPlot key={metric} metric={metric} data={data} />
      ))}
    </div>

    <style jsx>{`
      .statistical-analysis h2, .statistical-analysis h3 {
        color: #2c3e50;
        margin: 1.5rem 0 1rem;
      }

      .ci-table {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        overflow-x: auto;
        margin-bottom: 2rem;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th {
        background: #ecf0f1;
        padding: 1rem;
        text-align: left;
        font-weight: 600;
        color: #2c3e50;
        border-bottom: 2px solid #bdc3c7;
      }

      td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #ecf0f1;
        color: #2c3e50;
      }

      .smore-plots {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
      }
    `}</style>
  </div>
);

const TimeSeriesView: React.FC<{ data: any }> = ({ data }) => (
  <div className="time-series">
    <h2>Time Series Data</h2>
    <p>Interactive time series charts showing system behavior over time.</p>

    {/* Would integrate with Chart.js or D3.js for actual implementation */}
    <div className="chart-placeholder">
      <div className="placeholder-text">
        📊 Time series visualization would appear here
        <br />
        <small>Showing WIP, throughput, and resource utilization over {data.timePoints.length} time points</small>
      </div>
    </div>

    <style jsx>{`
      .time-series h2 {
        color: #2c3e50;
        margin-bottom: 1rem;
      }

      .chart-placeholder {
        background: white;
        padding: 4rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        text-align: center;
        color: #7f8c8d;
        margin-top: 1.5rem;
      }

      .placeholder-text {
        font-size: 1.1rem;
      }

      .placeholder-text small {
        display: block;
        margin-top: 1rem;
        font-size: 0.9rem;
      }
    `}</style>
  </div>
);

const BottleneckAnalysisView: React.FC<{ analysis: any }> = ({ analysis }) => (
  <div className="bottleneck-analysis">
    <h2>Bottleneck Analysis</h2>

    <div className="bottleneck-card primary">
      <h3>🎯 Primary Bottleneck</h3>
      <div className="bottleneck-name">{analysis.primaryBottleneck.resource}</div>
      <div className="bottleneck-util">{(analysis.primaryBottleneck.utilization * 100).toFixed(1)}% Utilization</div>
      <div className="impact-score">Impact Score: {analysis.primaryBottleneck.impactScore.toFixed(1)}</div>
    </div>

    {analysis.secondaryBottlenecks.length > 0 && (
      <>
        <h3>Secondary Bottlenecks</h3>
        <div className="secondary-bottlenecks">
          {analysis.secondaryBottlenecks.map((bottleneck: any) => (
            <div key={bottleneck.resource} className="bottleneck-item">
              <span className="resource-name">{bottleneck.resource}</span>
              <span className="utilization">{(bottleneck.utilization * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </>
    )}

    <h3>Recommendations</h3>
    <div className="recommendations">
      {analysis.recommendations.map((rec: string, i: number) => (
        <div key={i} className="recommendation">
          <span className="rec-number">{i + 1}</span>
          <span className="rec-text">{rec}</span>
        </div>
      ))}
    </div>

    <style jsx>{`
      .bottleneck-analysis h2, .bottleneck-analysis h3 {
        color: #2c3e50;
        margin: 1.5rem 0 1rem;
      }

      .bottleneck-card {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        text-align: center;
        margin-bottom: 2rem;
      }

      .bottleneck-card.primary {
        border: 3px solid #e74c3c;
      }

      .bottleneck-card h3 {
        margin: 0 0 1rem 0;
        font-size: 1.2rem;
      }

      .bottleneck-name {
        font-size: 2rem;
        font-weight: 700;
        color: #e74c3c;
        margin-bottom: 0.5rem;
      }

      .bottleneck-util {
        font-size: 1.5rem;
        color: #2c3e50;
        margin-bottom: 0.5rem;
      }

      .impact-score {
        color: #7f8c8d;
        font-size: 1.1rem;
      }

      .secondary-bottlenecks {
        display: grid;
        gap: 0.75rem;
      }

      .bottleneck-item {
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 6px;
        display: flex;
        justify-content: space-between;
        box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      }

      .resource-name {
        font-weight: 600;
        color: #2c3e50;
      }

      .utilization {
        color: #f39c12;
        font-weight: 600;
      }

      .recommendations {
        display: grid;
        gap: 0.75rem;
      }

      .recommendation {
        background: white;
        padding: 1rem;
        border-radius: 6px;
        display: flex;
        gap: 1rem;
        box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      }

      .rec-number {
        flex-shrink: 0;
        width: 2rem;
        height: 2rem;
        background: #3498db;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
      }

      .rec-text {
        color: #2c3e50;
        line-height: 2rem;
      }
    `}</style>
  </div>
);

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const StatCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="stat-card">
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value.toLocaleString()}</div>

    <style jsx>{`
      .stat-card {
        background: white;
        padding: 1rem;
        border-radius: 6px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      }

      .stat-label {
        font-size: 0.85rem;
        color: #7f8c8d;
        margin-bottom: 0.5rem;
      }

      .stat-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #2c3e50;
      }
    `}</style>
  </div>
);

const StatisticTable: React.FC<{ stats: Array<{ name: string; data: any }> }> = ({ stats }) => (
  <div className="statistic-table">
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Average</th>
          <th>Min</th>
          <th>Max</th>
          <th>Std Dev</th>
          <th>95% CI</th>
        </tr>
      </thead>
      <tbody>
        {stats.map(stat => (
          <tr key={stat.name}>
            <td>{stat.name}</td>
            <td>{stat.data.average.toFixed(2)}</td>
            <td>{stat.data.minimum.toFixed(2)}</td>
            <td>{stat.data.maximum.toFixed(2)}</td>
            <td>{stat.data.standardDeviation.toFixed(2)}</td>
            <td>
              [{(stat.data.average - stat.data.halfWidth).toFixed(2)}, {(stat.data.average + stat.data.halfWidth).toFixed(2)}]
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <style jsx>{`
      .statistic-table {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        overflow-x: auto;
        margin-bottom: 2rem;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th {
        background: #ecf0f1;
        padding: 0.75rem;
        text-align: left;
        font-weight: 600;
        font-size: 0.9rem;
        color: #2c3e50;
        border-bottom: 2px solid #bdc3c7;
      }

      td {
        padding: 0.75rem;
        border-bottom: 1px solid #ecf0f1;
        color: #2c3e50;
        font-size: 0.9rem;
      }

      tr:hover {
        background: #f8f9fa;
      }
    `}</style>
  </div>
);

const EntityTypeTable: React.FC<{ types: any }> = ({ types }) => (
  <div className="entity-type-table">
    <table>
      <thead>
        <tr>
          <th>Type</th>
          <th>Created</th>
          <th>Destroyed</th>
          <th>In System</th>
          <th>Avg Time</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(types).map(([type, data]: [string, any]) => (
          <tr key={type}>
            <td><strong>{type}</strong></td>
            <td>{data.created}</td>
            <td>{data.destroyed}</td>
            <td>{data.inSystem}</td>
            <td>{data.avgTimeInSystem.toFixed(2)} hrs</td>
          </tr>
        ))}
      </tbody>
    </table>

    <style jsx>{`
      .entity-type-table {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th {
        background: #ecf0f1;
        padding: 0.75rem;
        text-align: left;
        font-weight: 600;
        font-size: 0.9rem;
        color: #2c3e50;
        border-bottom: 2px solid #bdc3c7;
      }

      td {
        padding: 0.75rem;
        border-bottom: 1px solid #ecf0f1;
        color: #2c3e50;
        font-size: 0.9rem;
      }

      tr:hover {
        background: #f8f9fa;
      }
    `}</style>
  </div>
);

const TimeBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="time-bar">
    <div className="time-label">{label}</div>
    <div className="bar-container">
      <div className="bar-fill" style={{ width: `${(value / 168) * 100}%`, background: color }} />
      <span className="time-value">{value.toFixed(1)} hrs</span>
    </div>

    <style jsx>{`
      .time-bar {
        display: grid;
        grid-template-columns: 100px 1fr;
        gap: 1rem;
        align-items: center;
      }

      .time-label {
        font-weight: 500;
        color: #2c3e50;
      }

      .bar-container {
        position: relative;
        height: 30px;
        background: #ecf0f1;
        border-radius: 6px;
        overflow: hidden;
      }

      .bar-fill {
        position: absolute;
        height: 100%;
        transition: width 0.3s;
      }

      .time-value {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        line-height: 30px;
        font-weight: 600;
        color: #2c3e50;
        font-size: 0.9rem;
      }
    `}</style>
  </div>
);

const QualityMetric: React.FC<{ label: string; value: number; inverse?: boolean }> = ({
  label,
  value,
  inverse = false
}) => {
  const percentage = value * 100;
  const isGood = inverse ? percentage < 5 : percentage > 95;

  return (
    <div className="quality-metric">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${isGood ? 'good' : 'warning'}`}>
        {percentage.toFixed(1)}%
      </div>

      <style jsx>{`
        .quality-metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .metric-label {
          font-weight: 500;
          color: #2c3e50;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .metric-value.good {
          color: #27ae60;
        }

        .metric-value.warning {
          color: #f39c12;
        }
      `}</style>
    </div>
  );
};

const ProgressBar: React.FC<{
  label: string;
  value: number;
  target: number;
  inverse?: boolean;
}> = ({ label, value, target, inverse = false }) => {
  const meetsTarget = inverse ? value <= target : value >= target;

  return (
    <div className="progress-bar">
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        <span className={`progress-value ${meetsTarget ? 'good' : 'warning'}`}>
          {value.toFixed(1)}% {meetsTarget ? '✓' : ''}
        </span>
      </div>
      <div className="bar-track">
        <div
          className={`bar-fill ${meetsTarget ? 'good' : 'warning'}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
        <div className="target-marker" style={{ left: `${target}%` }} />
      </div>
      <div className="target-label">Target: {target}%</div>

      <style jsx>{`
        .progress-bar {
          margin-bottom: 1.5rem;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .progress-label {
          font-weight: 500;
          color: #2c3e50;
        }

        .progress-value {
          font-weight: 700;
          font-size: 1.1rem;
        }

        .progress-value.good {
          color: #27ae60;
        }

        .progress-value.warning {
          color: #f39c12;
        }

        .bar-track {
          position: relative;
          height: 30px;
          background: #ecf0f1;
          border-radius: 8px;
          overflow: hidden;
        }

        .bar-fill {
          position: absolute;
          height: 100%;
          transition: width 0.5s;
        }

        .bar-fill.good {
          background: linear-gradient(90deg, #27ae60, #2ecc71);
        }

        .bar-fill.warning {
          background: linear-gradient(90deg, #f39c12, #f1c40f);
        }

        .target-marker {
          position: absolute;
          top: 0;
          height: 100%;
          width: 3px;
          background: #e74c3c;
          z-index: 2;
        }

        .target-label {
          margin-top: 0.25rem;
          font-size: 0.85rem;
          color: #7f8c8d;
          text-align: right;
        }
      `}</style>
    </div>
  );
};

const CostBreakdownChart: React.FC<{ breakdown: any; total: number }> = ({ breakdown, total }) => (
  <div className="cost-breakdown">
    {Object.entries(breakdown).map(([category, amount]: [string, any]) => {
      const percentage = (amount / total) * 100;
      return (
        <div key={category} className="cost-item">
          <div className="cost-item-header">
            <span className="cost-category">{category.replace(/([A-Z])/g, ' $1').trim()}</span>
            <span className="cost-amount">${amount.toLocaleString()}</span>
          </div>
          <div className="cost-bar">
            <div className="cost-bar-fill" style={{ width: `${percentage}%` }} />
            <span className="cost-percentage">{percentage.toFixed(1)}%</span>
          </div>
        </div>
      );
    })}

    <style jsx>{`
      .cost-breakdown {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .cost-item {
        margin-bottom: 1.5rem;
      }

      .cost-item:last-child {
        margin-bottom: 0;
      }

      .cost-item-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
      }

      .cost-category {
        font-weight: 600;
        color: #2c3e50;
        text-transform: capitalize;
      }

      .cost-amount {
        font-weight: 700;
        color: #3498db;
      }

      .cost-bar {
        position: relative;
        height: 28px;
        background: #ecf0f1;
        border-radius: 6px;
        overflow: hidden;
      }

      .cost-bar-fill {
        position: absolute;
        height: 100%;
        background: linear-gradient(90deg, #3498db, #2980b9);
        transition: width 0.5s;
      }

      .cost-percentage {
        position: absolute;
        right: 0.75rem;
        line-height: 28px;
        font-weight: 600;
        color: #2c3e50;
        font-size: 0.9rem;
      }
    `}</style>
  </div>
);

const SMOREPlot: React.FC<{ metric: string; data: any }> = ({ metric, data }) => (
  <div className="smore-plot">
    <h4>{metric}</h4>
    <div className="plot-container">
      <div className="plot-axis">
        <span>{data.minimum.toFixed(1)}</span>
        <span>{data.maximum.toFixed(1)}</span>
      </div>
      <div className="plot-visual">
        {/* Range line */}
        <div className="range-line" />

        {/* 5th-95th percentile box */}
        <div
          className="percentile-box"
          style={{
            left: `${((data.percentile5 - data.minimum) / (data.maximum - data.minimum)) * 100}%`,
            width: `${((data.percentile95 - data.percentile5) / (data.maximum - data.minimum)) * 100}%`
          }}
        />

        {/* Confidence interval */}
        <div
          className="ci-line"
          style={{
            left: `${((data.ciLower - data.minimum) / (data.maximum - data.minimum)) * 100}%`,
            width: `${((data.ciUpper - data.ciLower) / (data.maximum - data.minimum)) * 100}%`
          }}
        />

        {/* Mean marker */}
        <div
          className="mean-marker"
          style={{
            left: `${((data.mean - data.minimum) / (data.maximum - data.minimum)) * 100}%`
          }}
        />
      </div>
      <div className="plot-legend">
        <div className="legend-item">
          <div className="legend-symbol range" />
          <span>Range</span>
        </div>
        <div className="legend-item">
          <div className="legend-symbol percentile" />
          <span>5th-95th Percentile</span>
        </div>
        <div className="legend-item">
          <div className="legend-symbol ci" />
          <span>95% CI</span>
        </div>
        <div className="legend-item">
          <div className="legend-symbol mean" />
          <span>Mean</span>
        </div>
      </div>
    </div>

    <style jsx>{`
      .smore-plot {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .smore-plot h4 {
        margin: 0 0 1rem 0;
        color: #2c3e50;
      }

      .plot-axis {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        color: #7f8c8d;
        margin-bottom: 0.5rem;
      }

      .plot-visual {
        position: relative;
        height: 60px;
        margin-bottom: 1rem;
      }

      .range-line {
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 2px;
        background: #bdc3c7;
      }

      .percentile-box {
        position: absolute;
        top: 15px;
        height: 30px;
        background: rgba(52, 152, 219, 0.2);
        border: 2px solid #3498db;
      }

      .ci-line {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        height: 8px;
        background: #27ae60;
        border-radius: 4px;
      }

      .mean-marker {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 4px;
        height: 40px;
        background: #e74c3c;
      }

      .plot-legend {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
        font-size: 0.85rem;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .legend-symbol {
        width: 20px;
        height: 12px;
        border-radius: 2px;
      }

      .legend-symbol.range {
        background: #bdc3c7;
      }

      .legend-symbol.percentile {
        background: rgba(52, 152, 219, 0.2);
        border: 2px solid #3498db;
      }

      .legend-symbol.ci {
        background: #27ae60;
      }

      .legend-symbol.mean {
        width: 4px;
        background: #e74c3c;
      }
    `}</style>
  </div>
);

export default ComprehensiveResultsPage;
