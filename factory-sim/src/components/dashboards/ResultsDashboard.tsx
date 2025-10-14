/**
 * ENHANCED RESULTS DASHBOARD
 * 
 * Professional visualization of simulation results with:
 * - Interactive charts
 * - Key performance indicators
 * - Resource utilization visualization
 * - Bottleneck heatmap
 * - Financial summary
 * - Trend analysis
 */

import React, { useState } from 'react';
import { ComprehensiveMetrics } from '../../core/metrics/MetricsCollector';
import { 
  GaugeChart, 
  BarChart, 
  MiniMetricCard, 
  ComparisonBar,
  Heatmap 
} from '../charts/ChartComponents';
import '../../styles/industrial-theme.css';

interface ResultsDashboardProps {
  metrics: ComprehensiveMetrics;
  onClose: () => void;
  onExportReport: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  metrics,
  onClose,
  onExportReport
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'financial' | 'bottlenecks'>('overview');
  
  // Calculate derived metrics
  const avgUtilization = metrics.resources.length > 0
    ? metrics.resources.reduce((sum, r) => sum + r.utilization, 0) / metrics.resources.length
    : 0;
  
  const totalCost = metrics.financial?.totalOperatingCost || 0;
  const totalRevenue = metrics.financial?.totalRevenue || 0;
  const profitMargin = metrics.financial?.profitMargin || 0;
  
  return (
    <div className="industrial-modal-overlay" onClick={onClose}>
      <div 
        className="industrial-modal" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '1400px', maxHeight: '90vh', overflow: 'auto' }}
      >
        {/* HEADER */}
        <div className="industrial-modal__header">
          <h2>📊 SIMULATION RESULTS DASHBOARD</h2>
          <button 
            className="industrial-button industrial-button--secondary"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="industrial-modal__content">
          {/* SUCCESS STATUS */}
          <div className="industrial-status industrial-status--success" style={{ marginBottom: '1.5rem' }}>
            <span className="industrial-status__indicator"></span>
            SIMULATION COMPLETED SUCCESSFULLY
          </div>
          
          {/* KEY METRICS ROW */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <MiniMetricCard
              label="THROUGHPUT"
              value={metrics.throughput.entitiesPerHour}
              unit="per hour"
              status={metrics.throughput.throughputEfficiency > 80 ? 'good' : metrics.throughput.throughputEfficiency > 60 ? 'neutral' : 'bad'}
              change={metrics.throughput.throughputEfficiency - 70}
            />
            
            <MiniMetricCard
              label="AVG CYCLE TIME"
              value={metrics.throughput.averageCycleTime}
              unit="min"
              status={metrics.throughput.averageCycleTime < 15 ? 'good' : metrics.throughput.averageCycleTime < 30 ? 'neutral' : 'bad'}
            />
            
            <MiniMetricCard
              label="UTILIZATION"
              value={avgUtilization * 100}
              unit="%"
              status={avgUtilization > 0.75 && avgUtilization < 0.9 ? 'good' : 'neutral'}
            />
            
            <MiniMetricCard
              label="PROFIT MARGIN"
              value={profitMargin}
              unit="%"
              status={profitMargin > 20 ? 'good' : profitMargin > 10 ? 'neutral' : 'bad'}
            />
          </div>
          
          {/* TABS */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            borderBottom: '1px solid var(--color-border)',
            marginBottom: '1.5rem'
          }}>
            {(['overview', 'resources', 'financial', 'bottlenecks'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: activeTab === tab ? 'var(--color-bg-tertiary)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                  color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          
          {/* TAB CONTENT */}
          {activeTab === 'overview' && (
            <div>
              {/* GAUGES ROW */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '2rem',
                marginBottom: '2rem',
                padding: '1rem',
                background: 'var(--color-bg-secondary)',
                borderRadius: '8px'
              }}>
                <GaugeChart
                  value={metrics.throughput.throughputEfficiency}
                  label="Throughput Efficiency"
                  size={120}
                  thresholds={{ good: 70, warning: 85 }}
                />
                
                <GaugeChart
                  value={avgUtilization * 100}
                  label="Avg Utilization"
                  size={120}
                  thresholds={{ good: 75, warning: 90 }}
                />
                
                <GaugeChart
                  value={metrics.throughput.valueAddedRatio * 100}
                  label="Value-Added Ratio"
                  size={120}
                  thresholds={{ good: 60, warning: 40 }}
                />
                
                {metrics.financial && (
                  <GaugeChart
                    value={Math.min(100, metrics.financial.roi)}
                    label="ROI"
                    size={120}
                    thresholds={{ good: 30, warning: 15 }}
                  />
                )}
              </div>
              
              {/* THROUGHPUT BREAKDOWN */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  fontSize: '1rem', 
                  marginBottom: '1rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-primary)'
                }}>
                  📊 THROUGHPUT BREAKDOWN
                </h3>
                <div className="industrial-metrics-grid">
                  <div className="industrial-metric">
                    <div className="industrial-metric__label">ENTITIES PROCESSED</div>
                    <div className="industrial-metric__value">
                      {metrics.throughput.totalEntitiesProcessed}
                    </div>
                    <div className="industrial-metric__unit">total</div>
                  </div>
                  
                  <div className="industrial-metric">
                    <div className="industrial-metric__label">THROUGHPUT RATE</div>
                    <div className="industrial-metric__value">
                      {metrics.throughput.entitiesPerHour.toFixed(1)}
                    </div>
                    <div className="industrial-metric__unit">per hour</div>
                  </div>
                  
                  <div className="industrial-metric">
                    <div className="industrial-metric__label">TAKT TIME</div>
                    <div className="industrial-metric__value">
                      {metrics.throughput.taktTime.toFixed(2)}
                    </div>
                    <div className="industrial-metric__unit">minutes</div>
                  </div>
                  
                  <div className="industrial-metric">
                    <div className="industrial-metric__label">FIRST PASS YIELD</div>
                    <div className="industrial-metric__value">
                      {(metrics.throughput.firstPassYield * 100).toFixed(1)}
                    </div>
                    <div className="industrial-metric__unit">%</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'resources' && (
            <div>
              {/* RESOURCE UTILIZATION BAR CHART */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  fontSize: '1rem', 
                  marginBottom: '1rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-primary)'
                }}>
                  ⚙️ RESOURCE UTILIZATION
                </h3>
                <BarChart
                  data={metrics.resources.map(r => ({
                    label: r.resourceName,
                    value: r.utilization * 100,
                    color: r.utilization > 0.9 ? '#ef4444' : r.utilization > 0.75 ? '#f59e0b' : '#10b981'
                  }))}
                  height={250}
                  maxValue={100}
                />
              </div>
              
              {/* DETAILED RESOURCE TABLE */}
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ 
                  fontSize: '1rem', 
                  marginBottom: '1rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-primary)'
                }}>
                  DETAILED RESOURCE ANALYSIS
                </h3>
                <div className="industrial-table-container">
                  <table className="industrial-table">
                    <thead>
                      <tr>
                        <th>RESOURCE</th>
                        <th>UTILIZATION</th>
                        <th>OEE</th>
                        <th>SERVED</th>
                        <th>AVG QUEUE</th>
                        <th>COST/ENTITY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.resources.map((resource) => (
                        <tr key={resource.resourceId}>
                          <td style={{ fontWeight: 600 }}>{resource.resourceName}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div className="industrial-progress">
                                <div 
                                  className="industrial-progress__bar" 
                                  style={{ 
                                    width: `${resource.utilization * 100}%`,
                                    backgroundColor: resource.utilization > 0.9 ? '#ef4444' : resource.utilization > 0.75 ? '#f59e0b' : '#10b981'
                                  }}
                                ></div>
                              </div>
                              <span>{(resource.utilization * 100).toFixed(1)}%</span>
                            </div>
                          </td>
                          <td>{(resource.oee * 100).toFixed(1)}%</td>
                          <td>{resource.entitiesServed}</td>
                          <td>{resource.averageQueueLength.toFixed(1)}</td>
                          <td>${resource.costPerEntity.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'financial' && (
            <div>
              {/* FINANCIAL OVERVIEW */}
              {metrics.financial && (
                <>
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ 
                      fontSize: '1rem', 
                      marginBottom: '1rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--color-text-primary)'
                    }}>
                      💰 FINANCIAL PERFORMANCE
                    </h3>
                    
                    <div className="industrial-metrics-grid">
                      <div className="industrial-metric">
                        <div className="industrial-metric__label">TOTAL REVENUE</div>
                        <div className="industrial-metric__value">
                          ${totalRevenue.toFixed(2)}
                        </div>
                        <div className="industrial-metric__unit">USD</div>
                      </div>
                      
                      <div className="industrial-metric">
                        <div className="industrial-metric__label">OPERATING COST</div>
                        <div className="industrial-metric__value">
                          ${totalCost.toFixed(2)}
                        </div>
                        <div className="industrial-metric__unit">USD</div>
                      </div>
                      
                      <div className="industrial-metric">
                        <div className="industrial-metric__label">PROFIT</div>
                        <div className="industrial-metric__value">
                          ${(totalRevenue - totalCost).toFixed(2)}
                        </div>
                        <div className="industrial-metric__unit">USD</div>
                      </div>
                      
                      <div className="industrial-metric">
                        <div className="industrial-metric__label">ROI</div>
                        <div className="industrial-metric__value">
                          {metrics.financial.roi.toFixed(1)}
                        </div>
                        <div className="industrial-metric__unit">%</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* COST BREAKDOWN */}
                  <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ 
                      fontSize: '1rem', 
                      marginBottom: '1rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--color-text-primary)'
                    }}>
                      COST BREAKDOWN
                    </h3>
                    <BarChart
                      data={[
                        { label: 'Labor', value: metrics.financial.laborCost, color: '#3b82f6' },
                        { label: 'Resources', value: metrics.financial.resourceCost, color: '#10b981' },
                        { label: 'Overhead', value: metrics.financial.overheadCost, color: '#f59e0b' }
                      ]}
                      height={200}
                    />
                  </div>
                </>
              )}
            </div>
          )}
          
          {activeTab === 'bottlenecks' && (
            <div>
              {/* BOTTLENECK ANALYSIS */}
              {metrics.advanced.bottlenecks && metrics.advanced.bottlenecks.length > 0 ? (
                <>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    marginBottom: '1rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-text-primary)'
                  }}>
                    🔴 IDENTIFIED BOTTLENECKS
                  </h3>
                  
                  {metrics.advanced.bottlenecks.map((bottleneck, idx) => (
                    <div 
                      key={idx} 
                      className="industrial-card" 
                      style={{ 
                        marginBottom: '1rem', 
                        padding: '1rem',
                        borderLeft: `4px solid ${bottleneck.severity > 70 ? '#ef4444' : bottleneck.severity > 40 ? '#f59e0b' : '#22c55e'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                          {bottleneck.resourceName}
                        </h4>
                        <span className="industrial-badge" style={{ 
                          backgroundColor: bottleneck.severity > 70 ? '#ef4444' : bottleneck.severity > 40 ? '#f59e0b' : '#22c55e'
                        }}>
                          SEVERITY: {bottleneck.severity.toFixed(0)}%
                        </span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Utilization</div>
                          <div className="industrial-progress">
                            <div 
                              className="industrial-progress__bar" 
                              style={{ width: `${bottleneck.utilization}%` }}
                            ></div>
                          </div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{bottleneck.utilization.toFixed(1)}%</div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Queue Length</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{bottleneck.queueLength.toFixed(1)}</div>
                        </div>
                      </div>
                      
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '1rem 0' }}>
                        {bottleneck.impact}
                      </p>
                      
                      {bottleneck.recommendations.length > 0 && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <strong style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>RECOMMENDATIONS:</strong>
                          <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0, fontSize: '0.875rem' }}>
                            {bottleneck.recommendations.map((rec, i) => (
                              <li key={i} style={{ color: 'var(--color-text-secondary)' }}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <div className="industrial-status industrial-status--success">
                  <span className="industrial-status__indicator"></span>
                  NO SIGNIFICANT BOTTLENECKS DETECTED - System flow is well-balanced
                </div>
              )}
              
              {/* IMPROVEMENT OPPORTUNITIES */}
              {metrics.advanced.improvementPotential && metrics.advanced.improvementPotential.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    marginBottom: '1rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-text-primary)'
                  }}>
                    💡 IMPROVEMENT OPPORTUNITIES
                  </h3>
                  
                  {metrics.advanced.improvementPotential.slice(0, 3).map((opp, idx) => (
                    <div key={idx} className="industrial-card" style={{ padding: '1rem', marginBottom: '1rem', borderLeft: '4px solid var(--color-primary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                            {opp.area}
                          </h4>
                          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                            {opp.description}
                          </p>
                        </div>
                        <div style={{ marginLeft: '1rem', textAlign: 'right' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                            +{opp.estimatedImpact.toFixed(1)}%
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            {opp.difficulty} difficulty
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* ACTIONS */}
          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button 
              className="industrial-button industrial-button--secondary"
              onClick={onExportReport}
            >
              📄 EXPORT REPORT
            </button>
            <button 
              className="industrial-button industrial-button--primary"
              onClick={onClose}
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

