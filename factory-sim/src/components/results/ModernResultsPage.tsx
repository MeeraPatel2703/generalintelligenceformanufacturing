/**
 * MODERN RESULTS PAGE
 * Sleek, modular, and interactive simulation results display
 */

import React, { useState } from 'react';
import { ComprehensiveSimulationResults } from '../../types/simulation';
import { MetricCard } from './cards/MetricCard';
import { BottleneckCard } from './cards/BottleneckCard';
import { ResourceCard } from './cards/ResourceCard';
import { PerformanceChart } from './charts/PerformanceChart';
import './ModernResultsPage.css';

interface Props {
  results: ComprehensiveSimulationResults;
  onBack?: () => void;
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
}

export const ModernResultsPage: React.FC<Props> = ({ results, onBack, onExport }) => {
  const [activeView, setActiveView] = useState<'overview' | 'detailed' | 'charts'>('overview');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  return (
    <div className="modern-results-page">
      {/* Animated Header */}
      <header className="results-header">
        <div className="header-content">
          {onBack && (
            <button onClick={onBack} className="back-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
              </svg>
              Back
            </button>
          )}

          <div className="header-title">
            <h1>Simulation Results</h1>
            <span className={`status-pill ${results.executiveSummary.status}`}>
              {results.executiveSummary.status}
            </span>
          </div>

          <div className="header-actions">
            <button onClick={() => onExport?.('pdf')} className="action-btn">
              <span>📄</span> PDF
            </button>
            <button onClick={() => onExport?.('excel')} className="action-btn">
              <span>📊</span> Excel
            </button>
          </div>
        </div>

        {/* View Switcher */}
        <nav className="view-switcher">
          {(['overview', 'detailed', 'charts'] as const).map(view => (
            <button
              key={view}
              className={`view-btn ${activeView === view ? 'active' : ''}`}
              onClick={() => setActiveView(view)}
            >
              {view === 'overview' && '🎯'}
              {view === 'detailed' && '📊'}
              {view === 'charts' && '📈'}
              <span>{view.charAt(0).toUpperCase() + view.slice(1)}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Warning Banner */}
      {results.executiveSummary.warnings.length > 0 && (
        <div className="warning-banner">
          <div className="warning-icon">⚠️</div>
          <div className="warning-content">
            {results.executiveSummary.warnings.map((warning, i) => (
              <div key={i} className="warning-item">{warning}</div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="results-content">
        {activeView === 'overview' && (
          <OverviewView results={results} onMetricClick={setSelectedMetric} />
        )}
        {activeView === 'detailed' && (
          <DetailedView results={results} />
        )}
        {activeView === 'charts' && (
          <ChartsView results={results} />
        )}
      </main>

      {/* Metric Detail Modal */}
      {selectedMetric && (
        <MetricDetailModal
          metric={selectedMetric}
          results={results}
          onClose={() => setSelectedMetric(null)}
        />
      )}
    </div>
  );
};

// =============================================================================
// VIEW COMPONENTS
// =============================================================================

const OverviewView: React.FC<{
  results: ComprehensiveSimulationResults;
  onMetricClick: (metric: string) => void;
}> = ({ results, onMetricClick }) => {
  const summary = results.executiveSummary;

  return (
    <div className="overview-view">
      {/* Hero Metrics */}
      <section className="hero-metrics">
        <MetricCard
          title="Total Throughput"
          value={summary.keyMetrics.totalThroughput}
          unit="units/week"
          icon="🚀"
          trend={summary.keyMetrics.totalThroughput > 100 ? 'up' : 'neutral'}
          onClick={() => onMetricClick('throughput')}
        />
        <MetricCard
          title="Lead Time"
          value={summary.keyMetrics.averageLeadTime}
          unit="days"
          icon="⏱️"
          trend={summary.keyMetrics.averageLeadTime < 5 ? 'up' : 'down'}
          onClick={() => onMetricClick('leadTime')}
        />
        <MetricCard
          title="Utilization"
          value={summary.keyMetrics.systemUtilization * 100}
          unit="%"
          icon="🏭"
          trend={summary.keyMetrics.systemUtilization > 0.85 ? 'up' : 'neutral'}
          onClick={() => onMetricClick('utilization')}
        />
        <MetricCard
          title="Quality Rate"
          value={summary.keyMetrics.qualityRate * 100}
          unit="%"
          icon="⭐"
          trend={summary.keyMetrics.qualityRate > 0.95 ? 'up' : 'down'}
          onClick={() => onMetricClick('quality')}
        />
      </section>

      {/* Bottleneck Analysis */}
      {results.bottleneckAnalysis && (
        <section className="bottleneck-section">
          <h2 className="section-title">
            <span className="title-icon">🎯</span>
            Bottleneck Analysis
          </h2>
          <BottleneckCard analysis={results.bottleneckAnalysis} />
        </section>
      )}

      {/* Resource Performance */}
      <section className="resources-section">
        <h2 className="section-title">
          <span className="title-icon">⚙️</span>
          Resource Performance
        </h2>
        <div className="resources-grid">
          {results.resourceStats.slice(0, 6).map(resource => (
            <ResourceCard
              key={resource.resourceName}
              resource={resource}
              isBottleneck={
                results.bottleneckAnalysis?.primaryBottleneck.resource === resource.resourceName
              }
            />
          ))}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-label">Simulation Date</div>
            <div className="stat-value">
              {new Date(summary.runDate).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <div className="stat-label">Duration</div>
            <div className="stat-value">{summary.simulationDuration} hours</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <div className="stat-label">Replications</div>
            <div className="stat-value">{summary.replications}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-label">On-Time Delivery</div>
            <div className="stat-value">
              {(summary.keyMetrics.onTimeDelivery * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const DetailedView: React.FC<{ results: ComprehensiveSimulationResults }> = ({ results }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('entities');

  const sections = [
    { id: 'entities', title: 'Entity Statistics', icon: '📦' },
    { id: 'queues', title: 'Queue Analysis', icon: '⏳' },
    { id: 'performance', title: 'Performance Metrics', icon: '⚡' },
    { id: 'costs', title: 'Cost Analysis', icon: '💰' }
  ];

  return (
    <div className="detailed-view">
      {sections.map(section => (
        <div key={section.id} className="detail-section">
          <button
            className={`section-header ${expandedSection === section.id ? 'expanded' : ''}`}
            onClick={() => setExpandedSection(
              expandedSection === section.id ? null : section.id
            )}
          >
            <span className="section-icon">{section.icon}</span>
            <span className="section-title">{section.title}</span>
            <span className="expand-icon">
              {expandedSection === section.id ? '▼' : '▶'}
            </span>
          </button>

          {expandedSection === section.id && (
            <div className="section-content">
              {section.id === 'entities' && <EntityDetails stats={results.entityStats} />}
              {section.id === 'queues' && <QueueDetails stats={results.queueStats} />}
              {section.id === 'performance' && <PerformanceDetails metrics={results.performanceMetrics} />}
              {section.id === 'costs' && <CostDetails analysis={results.costAnalysis} />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ChartsView: React.FC<{ results: ComprehensiveSimulationResults }> = ({ results }) => {
  return (
    <div className="charts-view">
      <section className="chart-section">
        <h3 className="chart-title">Resource Utilization Over Time</h3>
        <div className="chart-container">
          <PerformanceChart data={results.timeSeriesData} type="utilization" />
        </div>
      </section>

      <section className="chart-section">
        <h3 className="chart-title">Throughput Trends</h3>
        <div className="chart-container">
          <PerformanceChart data={results.timeSeriesData} type="throughput" />
        </div>
      </section>

      <section className="chart-section">
        <h3 className="chart-title">Queue Length Analysis</h3>
        <div className="chart-container">
          <PerformanceChart data={results.timeSeriesData} type="queue" />
        </div>
      </section>
    </div>
  );
};

// =============================================================================
// DETAIL COMPONENTS
// =============================================================================

const EntityDetails: React.FC<{ stats: any }> = ({ stats }) => (
  <div className="entity-details">
    <div className="detail-grid">
      <div className="detail-card">
        <div className="detail-label">Total Created</div>
        <div className="detail-value">{stats.totalEntitiesCreated}</div>
      </div>
      <div className="detail-card">
        <div className="detail-label">Total Destroyed</div>
        <div className="detail-value">{stats.totalEntitiesDestroyed}</div>
      </div>
      <div className="detail-card">
        <div className="detail-label">Currently In System</div>
        <div className="detail-value">{stats.entitiesInSystem}</div>
      </div>
    </div>

    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Average</th>
            <th>Min</th>
            <th>Max</th>
            <th>Std Dev</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Time in System</td>
            <td>{stats.timeInSystem.average.toFixed(2)} hrs</td>
            <td>{stats.timeInSystem.minimum.toFixed(2)}</td>
            <td>{stats.timeInSystem.maximum.toFixed(2)}</td>
            <td>{stats.timeInSystem.standardDeviation.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Value Added Time</td>
            <td>{stats.valueAdded.average.toFixed(2)} hrs</td>
            <td>{stats.valueAdded.minimum.toFixed(2)}</td>
            <td>{stats.valueAdded.maximum.toFixed(2)}</td>
            <td>{stats.valueAdded.standardDeviation.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

const QueueDetails: React.FC<{ stats: any[] }> = ({ stats }) => (
  <div className="queue-details">
    <div className="queue-grid">
      {stats.map(queue => (
        <div key={queue.queueName} className="queue-card">
          <div className="queue-header">
            <h4>{queue.queueName}</h4>
            <span className={`queue-status ${queue.percentTimeEmpty > 50 ? 'low' : 'high'}`}>
              {queue.percentTimeEmpty > 50 ? 'Low Load' : 'High Load'}
            </span>
          </div>
          <div className="queue-metrics">
            <div className="queue-metric">
              <span className="metric-label">Avg Length</span>
              <span className="metric-value">{queue.avgQueueLength.toFixed(2)}</span>
            </div>
            <div className="queue-metric">
              <span className="metric-label">Max Length</span>
              <span className="metric-value">{queue.maxQueueLength}</span>
            </div>
            <div className="queue-metric">
              <span className="metric-label">Avg Wait</span>
              <span className="metric-value">{queue.avgWaitTime.toFixed(2)} hrs</span>
            </div>
            <div className="queue-metric">
              <span className="metric-label">Entries</span>
              <span className="metric-value">{queue.numberEntered}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const PerformanceDetails: React.FC<{ metrics: any }> = ({ metrics }) => (
  <div className="performance-details">
    <div className="performance-grid">
      <div className="performance-card">
        <h4>Little's Law Verification</h4>
        <div className="law-formula">WIP = Throughput × Lead Time</div>
        <div className="law-values">
          <div>WIP: {metrics.littlesLaw.wip.toFixed(2)}</div>
          <div>Throughput: {metrics.littlesLaw.throughput.toFixed(3)}/hr</div>
          <div>Lead Time: {metrics.littlesLaw.leadTime.toFixed(2)} hrs</div>
        </div>
        <div className={`verification-badge ${metrics.littlesLaw.verified ? 'verified' : 'error'}`}>
          {metrics.littlesLaw.verified ? '✓ Verified' : '✗ Discrepancy'}
        </div>
      </div>

      <div className="performance-card">
        <h4>Quality Metrics</h4>
        <div className="quality-metrics">
          <div className="quality-item">
            <span className="quality-label">First Pass Yield</span>
            <span className="quality-value">{(metrics.firstPassYield * 100).toFixed(1)}%</span>
          </div>
          <div className="quality-item">
            <span className="quality-label">Total Yield</span>
            <span className="quality-value">{(metrics.totalYield * 100).toFixed(1)}%</span>
          </div>
          <div className="quality-item">
            <span className="quality-label">Defect Rate</span>
            <span className="quality-value error">{(metrics.defectRate * 100).toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const CostDetails: React.FC<{ analysis: any }> = ({ analysis }) => (
  <div className="cost-details">
    <div className="cost-summary-grid">
      <div className="cost-summary-card total">
        <div className="cost-label">Total Cost</div>
        <div className="cost-value">${analysis.totalCost.toLocaleString()}</div>
      </div>
      <div className="cost-summary-card revenue">
        <div className="cost-label">Revenue</div>
        <div className="cost-value">${analysis.revenue.toLocaleString()}</div>
      </div>
      <div className="cost-summary-card profit">
        <div className="cost-label">Profit</div>
        <div className="cost-value">${analysis.profit.toLocaleString()}</div>
      </div>
      <div className="cost-summary-card margin">
        <div className="cost-label">Profit Margin</div>
        <div className="cost-value">{analysis.profitMargin.toFixed(1)}%</div>
      </div>
    </div>

    <div className="cost-breakdown">
      <h4>Cost Breakdown</h4>
      {Object.entries(analysis.breakdown).map(([category, amount]: [string, any]) => {
        const percentage = (amount / analysis.totalCost) * 100;
        return (
          <div key={category} className="cost-breakdown-item">
            <div className="breakdown-header">
              <span>{category.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span>${amount.toLocaleString()}</span>
            </div>
            <div className="breakdown-bar">
              <div className="breakdown-fill" style={{ width: `${percentage}%` }}>
                <span className="breakdown-percentage">{percentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// =============================================================================
// MODAL COMPONENT
// =============================================================================

const MetricDetailModal: React.FC<{
  metric: string;
  results: ComprehensiveSimulationResults;
  onClose: () => void;
}> = ({ metric, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{metric.charAt(0).toUpperCase() + metric.slice(1)} Details</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p>Detailed analysis for {metric} would appear here with charts and statistics.</p>
        </div>
      </div>
    </div>
  );
};

export default ModernResultsPage;
