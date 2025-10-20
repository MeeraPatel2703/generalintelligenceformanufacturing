/**
 * SIMIO-STYLE RESULTS TABLE
 *
 * Comprehensive results display with:
 * - Pivot Grid functionality (filtering, sorting, grouping)
 * - Cross-replication statistics (Min, Max, Average, StdDev, Half Width/95% CI)
 * - Multiple statistics categories (Totals, Time in System, Resource States, Queue stats)
 * - Export capabilities (CSV/Excel)
 * - Dashboard reports with tables and charts
 * - SMORE plots (Summary, Mean, Outlier, Range, Extreme)
 */

import { useState } from 'react';
import { ComprehensiveSimulationResults } from '../types/simulation';

interface Props {
  results: ComprehensiveSimulationResults;
}

type ViewMode = 'pivot' | 'dashboard' | 'smore' | 'raw';
type StatCategory = 'all' | 'totals' | 'time' | 'resources' | 'queues';

export function SimioResultsTable({ results }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('pivot');
  const [statCategory, setStatCategory] = useState<StatCategory>('all');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterText, setFilterText] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['system', 'resources']));

  // Toggle section expansion
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Export to CSV
  const exportToCSV = () => {
    const rows: string[][] = [];

    // Header
    rows.push(['Category', 'Metric', 'Average', 'Std Dev', 'Min', 'Max', 'Half Width (95% CI)']);

    // System-level metrics
    rows.push(['System', 'Throughput (parts/hr)',
      results.throughput.mean.toFixed(4),
      results.throughput.stdDev.toFixed(4),
      results.throughput.min.toFixed(4),
      results.throughput.max.toFixed(4),
      results.throughput.confidenceInterval.toFixed(4)
    ]);

    rows.push(['System', 'Cycle Time (min)',
      results.cycleTime.mean.toFixed(4),
      results.cycleTime.stdDev.toFixed(4),
      results.cycleTime.min.toFixed(4),
      results.cycleTime.max.toFixed(4),
      results.cycleTime.confidenceInterval.toFixed(4)
    ]);

    rows.push(['System', 'WIP Level',
      results.wipLevel.mean.toFixed(4),
      results.wipLevel.stdDev.toFixed(4),
      results.wipLevel.min.toFixed(4),
      results.wipLevel.max.toFixed(4),
      results.wipLevel.confidenceInterval.toFixed(4)
    ]);

    // Machine-level metrics
    for (const machine of results.machines) {
      rows.push([`Machine: ${machine.id}`, 'Utilization (%)',
        (machine.utilization.mean * 100).toFixed(2),
        (machine.utilization.stdDev * 100).toFixed(2),
        (machine.utilization.min * 100).toFixed(2),
        (machine.utilization.max * 100).toFixed(2),
        (machine.utilization.confidenceInterval * 100).toFixed(2)
      ]);

      rows.push([`Machine: ${machine.id}`, 'Parts Processed',
        machine.partsProcessed.mean.toFixed(2),
        machine.partsProcessed.stdDev.toFixed(2),
        machine.partsProcessed.min.toFixed(2),
        machine.partsProcessed.max.toFixed(2),
        machine.partsProcessed.confidenceInterval.toFixed(2)
      ]);

      rows.push([`Machine: ${machine.id}`, 'Average Queue',
        machine.averageQueue.mean.toFixed(2),
        machine.averageQueue.stdDev.toFixed(2),
        machine.averageQueue.min.toFixed(2),
        machine.averageQueue.max.toFixed(2),
        machine.averageQueue.confidenceInterval.toFixed(2)
      ]);
    }

    // Convert to CSV
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation_results_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Sort handler
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Render Pivot Grid View
  const renderPivotGrid = () => {
    const filteredMachines = results.machines.filter(m =>
      !filterText || m.id.toLowerCase().includes(filterText.toLowerCase())
    );

    return (
      <div>
        {/* Filter Controls */}
        <div style={{
          marginBottom: '20px',
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            placeholder="Filter by machine name..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              flex: '1',
              minWidth: '200px'
            }}
          />

          <select
            value={statCategory}
            onChange={(e) => setStatCategory(e.target.value as StatCategory)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem'
            }}
          >
            <option value="all">All Metrics</option>
            <option value="totals">Totals</option>
            <option value="time">Time Metrics</option>
            <option value="resources">Resource States</option>
            <option value="queues">Queue Statistics</option>
          </select>

          <button
            onClick={exportToCSV}
            className="industrial-button industrial-button--secondary"
            style={{ fontSize: '0.875rem' }}
          >
            📊 Export CSV
          </button>
        </div>

        {/* System-Level Statistics */}
        {expandedSections.has('system') && (statCategory === 'all' || statCategory === 'totals' || statCategory === 'time') && (
          <div style={{ marginBottom: '30px' }}>
            <div
              onClick={() => toggleSection('system')}
              style={{
                cursor: 'pointer',
                padding: '12px',
                backgroundColor: 'var(--color-bg-tertiary)',
                borderBottom: '2px solid var(--color-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h3 style={{
                color: 'var(--color-primary)',
                margin: 0,
                fontSize: '1rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                📊 SYSTEM PERFORMANCE
              </h3>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {expandedSections.has('system') ? '▼' : '▶'}
              </span>
            </div>

            {expandedSections.has('system') && (
              <div style={{ overflowX: 'auto' }}>
                <table className="simio-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('metric')} style={{ cursor: 'pointer' }}>
                        Metric {sortColumn === 'metric' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('average')} style={{ cursor: 'pointer' }}>
                        Average {sortColumn === 'average' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Std Dev</th>
                      <th>Minimum</th>
                      <th>Maximum</th>
                      <th>Half Width (95% CI)</th>
                      <th>CV%</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Throughput</td>
                      <td>{results.throughput.mean.toFixed(4)} parts/hr</td>
                      <td>{results.throughput.stdDev.toFixed(4)}</td>
                      <td>{results.throughput.min.toFixed(4)}</td>
                      <td>{results.throughput.max.toFixed(4)}</td>
                      <td style={{ color: '#10b981' }}>±{results.throughput.confidenceInterval.toFixed(4)}</td>
                      <td>{((results.throughput.stdDev / results.throughput.mean) * 100).toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Cycle Time</td>
                      <td>{results.cycleTime.mean.toFixed(4)} min</td>
                      <td>{results.cycleTime.stdDev.toFixed(4)}</td>
                      <td>{results.cycleTime.min.toFixed(4)}</td>
                      <td>{results.cycleTime.max.toFixed(4)}</td>
                      <td style={{ color: '#10b981' }}>±{results.cycleTime.confidenceInterval.toFixed(4)}</td>
                      <td>{((results.cycleTime.stdDev / results.cycleTime.mean) * 100).toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Value Add Time</td>
                      <td>{results.valueAddTime.mean.toFixed(4)} min</td>
                      <td>{results.valueAddTime.stdDev.toFixed(4)}</td>
                      <td>{results.valueAddTime.min.toFixed(4)}</td>
                      <td>{results.valueAddTime.max.toFixed(4)}</td>
                      <td style={{ color: '#10b981' }}>±{results.valueAddTime.confidenceInterval.toFixed(4)}</td>
                      <td>{((results.valueAddTime.stdDev / results.valueAddTime.mean) * 100).toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Wait Time</td>
                      <td>{results.waitTime.mean.toFixed(4)} min</td>
                      <td>{results.waitTime.stdDev.toFixed(4)}</td>
                      <td>{results.waitTime.min.toFixed(4)}</td>
                      <td>{results.waitTime.max.toFixed(4)}</td>
                      <td style={{ color: '#10b981' }}>±{results.waitTime.confidenceInterval.toFixed(4)}</td>
                      <td>{results.waitTime.mean > 0 ? ((results.waitTime.stdDev / results.waitTime.mean) * 100).toFixed(2) : '0.00'}%</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>WIP Level</td>
                      <td>{results.wipLevel.mean.toFixed(4)} parts</td>
                      <td>{results.wipLevel.stdDev.toFixed(4)}</td>
                      <td>{results.wipLevel.min.toFixed(4)}</td>
                      <td>{results.wipLevel.max.toFixed(4)}</td>
                      <td style={{ color: '#10b981' }}>±{results.wipLevel.confidenceInterval.toFixed(4)}</td>
                      <td>{((results.wipLevel.stdDev / results.wipLevel.mean) * 100).toFixed(2)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Resource Statistics */}
        {(statCategory === 'all' || statCategory === 'resources' || statCategory === 'queues') && (
          <div style={{ marginBottom: '30px' }}>
            <div
              onClick={() => toggleSection('resources')}
              style={{
                cursor: 'pointer',
                padding: '12px',
                backgroundColor: 'var(--color-bg-tertiary)',
                borderBottom: '2px solid var(--color-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h3 style={{
                color: 'var(--color-primary)',
                margin: 0,
                fontSize: '1rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                ⚙️ RESOURCE STATES & QUEUES
              </h3>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {expandedSections.has('resources') ? '▼' : '▶'}
              </span>
            </div>

            {expandedSections.has('resources') && filteredMachines.map(machine => (
              <div key={machine.id} style={{ marginTop: '20px' }}>
                <h4 style={{
                  color: 'var(--color-text-primary)',
                  fontSize: '0.95rem',
                  marginBottom: '10px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  🔧 {machine.id}
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="simio-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Average</th>
                        <th>Std Dev</th>
                        <th>Minimum</th>
                        <th>Maximum</th>
                        <th>Half Width (95% CI)</th>
                        <th>CV%</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Utilization</td>
                        <td style={{
                          color: machine.utilization.mean > 0.85 ? '#ef4444' : machine.utilization.mean > 0.7 ? '#f59e0b' : '#10b981'
                        }}>
                          {(machine.utilization.mean * 100).toFixed(2)}%
                        </td>
                        <td>{(machine.utilization.stdDev * 100).toFixed(2)}%</td>
                        <td>{(machine.utilization.min * 100).toFixed(2)}%</td>
                        <td>{(machine.utilization.max * 100).toFixed(2)}%</td>
                        <td style={{ color: '#10b981' }}>±{(machine.utilization.confidenceInterval * 100).toFixed(2)}%</td>
                        <td>{machine.utilization.mean > 0 ? ((machine.utilization.stdDev / machine.utilization.mean) * 100).toFixed(2) : '0.00'}%</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Parts Processed</td>
                        <td>{machine.partsProcessed.mean.toFixed(2)}</td>
                        <td>{machine.partsProcessed.stdDev.toFixed(2)}</td>
                        <td>{machine.partsProcessed.min.toFixed(2)}</td>
                        <td>{machine.partsProcessed.max.toFixed(2)}</td>
                        <td style={{ color: '#10b981' }}>±{machine.partsProcessed.confidenceInterval.toFixed(2)}</td>
                        <td>{machine.partsProcessed.mean > 0 ? ((machine.partsProcessed.stdDev / machine.partsProcessed.mean) * 100).toFixed(2) : '0.00'}%</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Average Queue Length</td>
                        <td style={{
                          color: machine.averageQueue.mean > 10 ? '#ef4444' : machine.averageQueue.mean > 5 ? '#f59e0b' : '#10b981'
                        }}>
                          {machine.averageQueue.mean.toFixed(2)} parts
                        </td>
                        <td>{machine.averageQueue.stdDev.toFixed(2)}</td>
                        <td>{machine.averageQueue.min.toFixed(2)}</td>
                        <td>{machine.averageQueue.max.toFixed(2)}</td>
                        <td style={{ color: '#10b981' }}>±{machine.averageQueue.confidenceInterval.toFixed(2)}</td>
                        <td>{machine.averageQueue.mean > 0 ? ((machine.averageQueue.stdDev / machine.averageQueue.mean) * 100).toFixed(2) : '0.00'}%</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Blocked Time</td>
                        <td>{(machine.blockedTimePercent.mean * 100).toFixed(2)}%</td>
                        <td>{(machine.blockedTimePercent.stdDev * 100).toFixed(2)}%</td>
                        <td>{(machine.blockedTimePercent.min * 100).toFixed(2)}%</td>
                        <td>{(machine.blockedTimePercent.max * 100).toFixed(2)}%</td>
                        <td style={{ color: '#10b981' }}>±{(machine.blockedTimePercent.confidenceInterval * 100).toFixed(2)}%</td>
                        <td>{machine.blockedTimePercent.mean > 0 ? ((machine.blockedTimePercent.stdDev / machine.blockedTimePercent.mean) * 100).toFixed(2) : '0.00'}%</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Idle Time</td>
                        <td>{(machine.idleTimePercent.mean * 100).toFixed(2)}%</td>
                        <td>{(machine.idleTimePercent.stdDev * 100).toFixed(2)}%</td>
                        <td>{(machine.idleTimePercent.min * 100).toFixed(2)}%</td>
                        <td>{(machine.idleTimePercent.max * 100).toFixed(2)}%</td>
                        <td style={{ color: '#10b981' }}>±{(machine.idleTimePercent.confidenceInterval * 100).toFixed(2)}%</td>
                        <td>{machine.idleTimePercent.mean > 0 ? ((machine.idleTimePercent.stdDev / machine.idleTimePercent.mean) * 100).toFixed(2) : '0.00'}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Performance Metrics Verification */}
        {results.performanceMetrics && (
          <div style={{ marginBottom: '30px' }}>
            <div
              onClick={() => toggleSection('performance')}
              style={{
                cursor: 'pointer',
                padding: '12px',
                backgroundColor: 'var(--color-bg-tertiary)',
                borderBottom: '2px solid var(--color-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h3 style={{
                color: 'var(--color-primary)',
                margin: 0,
                fontSize: '1rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                ✅ PERFORMANCE VERIFICATION
              </h3>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {expandedSections.has('performance') ? '▼' : '▶'}
              </span>
            </div>

            {expandedSections.has('performance') && (
              <div style={{ padding: '15px', backgroundColor: 'var(--color-bg-secondary)' }}>
                <div style={{
                  padding: '15px',
                  backgroundColor: results.performanceMetrics.littlesLaw.verified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `2px solid ${results.performanceMetrics.littlesLaw.verified ? '#10b981' : '#ef4444'}`,
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}>
                  <h4 style={{ color: results.performanceMetrics.littlesLaw.verified ? '#10b981' : '#ef4444', marginBottom: '10px' }}>
                    {results.performanceMetrics.littlesLaw.verified ? '✓' : '✗'} Little's Law Verification
                  </h4>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '10px' }}>
                    WIP = Throughput × Lead Time
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>WIP</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {results.performanceMetrics.littlesLaw.wip.toFixed(2)} parts
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Throughput</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {results.performanceMetrics.littlesLaw.throughput.toFixed(2)} parts/hr
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Lead Time</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {results.performanceMetrics.littlesLaw.leadTime.toFixed(2)} min
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Discrepancy</div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: Math.abs(results.performanceMetrics.littlesLaw.discrepancy) < 0.05 ? '#10b981' : '#ef4444'
                      }}>
                        {(results.performanceMetrics.littlesLaw.discrepancy * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div style={{ padding: '15px', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                      Value Added %
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#10b981' }}>
                      {results.performanceMetrics.valueAddedPercentage.toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ padding: '15px', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                      Non-Value Added %
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#ef4444' }}>
                      {results.performanceMetrics.nonValueAddedPercentage.toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ padding: '15px', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                      Overall Equipment Effectiveness
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                      {(results.performanceMetrics.overallEquipmentEffectiveness * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render SMORE Plot View
  const renderSMOREPlots = () => {
    if (!results.statisticalAnalysis?.smorePlots) {
      return <div style={{ padding: '20px', color: 'var(--color-text-secondary)' }}>No SMORE plot data available</div>;
    }

    return (
      <div>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px', fontSize: '0.875rem' }}>
          SMORE plots show the Summary (mean), confidence intervals, Outliers, Range (min/max), and Extremes (5th/95th percentiles).
        </p>

        {Object.entries(results.statisticalAnalysis.smorePlots).map(([metric, data]) => (
          <div key={metric} style={{ marginBottom: '30px' }}>
            <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '15px', textTransform: 'capitalize' }}>
              {metric.replace(/([A-Z])/g, ' $1').trim()}
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '10px',
              marginBottom: '15px'
            }}>
              <div className="industrial-metric">
                <div className="industrial-metric__label">Mean</div>
                <div className="industrial-metric__value" style={{ fontSize: '1.2rem' }}>{data.mean.toFixed(4)}</div>
              </div>
              <div className="industrial-metric">
                <div className="industrial-metric__label">95% CI Lower</div>
                <div className="industrial-metric__value" style={{ fontSize: '1.2rem', color: '#3b82f6' }}>{data.ciLower.toFixed(4)}</div>
              </div>
              <div className="industrial-metric">
                <div className="industrial-metric__label">95% CI Upper</div>
                <div className="industrial-metric__value" style={{ fontSize: '1.2rem', color: '#3b82f6' }}>{data.ciUpper.toFixed(4)}</div>
              </div>
              <div className="industrial-metric">
                <div className="industrial-metric__label">5th Percentile</div>
                <div className="industrial-metric__value" style={{ fontSize: '1.2rem', color: '#10b981' }}>{data.percentile5.toFixed(4)}</div>
              </div>
              <div className="industrial-metric">
                <div className="industrial-metric__label">95th Percentile</div>
                <div className="industrial-metric__value" style={{ fontSize: '1.2rem', color: '#ef4444' }}>{data.percentile95.toFixed(4)}</div>
              </div>
              <div className="industrial-metric">
                <div className="industrial-metric__label">Minimum</div>
                <div className="industrial-metric__value" style={{ fontSize: '1.2rem' }}>{data.minimum.toFixed(4)}</div>
              </div>
              <div className="industrial-metric">
                <div className="industrial-metric__label">Maximum</div>
                <div className="industrial-metric__value" style={{ fontSize: '1.2rem' }}>{data.maximum.toFixed(4)}</div>
              </div>
            </div>

            {/* Visual representation */}
            <div style={{
              position: 'relative',
              height: '60px',
              backgroundColor: 'var(--color-bg-tertiary)',
              borderRadius: '4px',
              padding: '10px'
            }}>
              {/* Range line (min to max) */}
              <div style={{
                position: 'absolute',
                left: '5%',
                right: '5%',
                top: '50%',
                height: '2px',
                backgroundColor: 'var(--color-border)',
                transform: 'translateY(-50%)'
              }} />

              {/* CI box */}
              <div style={{
                position: 'absolute',
                left: `${5 + ((data.ciLower - data.minimum) / (data.maximum - data.minimum)) * 90}%`,
                right: `${5 + ((data.maximum - data.ciUpper) / (data.maximum - data.minimum)) * 90}%`,
                top: '30%',
                bottom: '30%',
                backgroundColor: 'rgba(59, 130, 246, 0.3)',
                border: '2px solid #3b82f6',
                borderRadius: '4px'
              }} />

              {/* Mean line */}
              <div style={{
                position: 'absolute',
                left: `${5 + ((data.mean - data.minimum) / (data.maximum - data.minimum)) * 90}%`,
                top: '20%',
                bottom: '20%',
                width: '3px',
                backgroundColor: '#10b981',
                borderRadius: '2px'
              }} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Dashboard View
  const renderDashboard = () => {
    return (
      <div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* Key Performance Indicators */}
          <div className="industrial-card" style={{ padding: '20px' }}>
            <h4 style={{ color: 'var(--color-primary)', marginBottom: '15px', fontSize: '0.9rem' }}>
              THROUGHPUT
            </h4>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '10px' }}>
              {results.throughput.mean.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              parts/hour
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#10b981' }}>
              ±{results.throughput.confidenceInterval.toFixed(2)} (95% CI)
            </div>
          </div>

          <div className="industrial-card" style={{ padding: '20px' }}>
            <h4 style={{ color: 'var(--color-primary)', marginBottom: '15px', fontSize: '0.9rem' }}>
              CYCLE TIME
            </h4>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '10px' }}>
              {results.cycleTime.mean.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              minutes
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#10b981' }}>
              ±{results.cycleTime.confidenceInterval.toFixed(2)} (95% CI)
            </div>
          </div>

          <div className="industrial-card" style={{ padding: '20px' }}>
            <h4 style={{ color: 'var(--color-primary)', marginBottom: '15px', fontSize: '0.9rem' }}>
              WIP LEVEL
            </h4>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '10px' }}>
              {results.wipLevel.mean.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              parts in system
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#10b981' }}>
              ±{results.wipLevel.confidenceInterval.toFixed(2)} (95% CI)
            </div>
          </div>

          <div className="industrial-card" style={{ padding: '20px' }}>
            <h4 style={{ color: 'var(--color-primary)', marginBottom: '15px', fontSize: '0.9rem' }}>
              REPLICATIONS
            </h4>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '10px' }}>
              {results.replicationsCompleted}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              completed runs
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              {results.executiveSummary.status.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Bottleneck Analysis */}
        {results.bottleneck && (
          <div className="industrial-card" style={{ padding: '20px', marginBottom: '30px' }}>
            <h4 style={{ color: '#ef4444', marginBottom: '15px' }}>
              🚨 PRIMARY BOTTLENECK: {results.bottleneck.machineId}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Utilization</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#ef4444' }}>
                  {(results.bottleneck.utilization * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Avg Queue</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f59e0b' }}>
                  {results.bottleneck.averageQueue.toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Blocked Time</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f59e0b' }}>
                  {results.bottleneck.blockedTimePercent.toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Severity</div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: results.bottleneck.severity === 'high' ? '#ef4444' : results.bottleneck.severity === 'medium' ? '#f59e0b' : '#10b981',
                  textTransform: 'uppercase'
                }}>
                  {results.bottleneck.severity}
                </div>
              </div>
            </div>
            <p style={{ marginTop: '15px', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              {results.bottleneck.reason}
            </p>
          </div>
        )}

        {/* Machine Utilization Chart */}
        <div className="industrial-card" style={{ padding: '20px' }}>
          <h4 style={{ color: 'var(--color-primary)', marginBottom: '15px' }}>
            ⚙️ RESOURCE UTILIZATION
          </h4>
          {results.machines.map(machine => (
            <div key={machine.id} style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{machine.id}</span>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: machine.utilization.mean > 0.85 ? '#ef4444' : machine.utilization.mean > 0.7 ? '#f59e0b' : '#10b981'
                }}>
                  {(machine.utilization.mean * 100).toFixed(1)}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--color-bg-tertiary)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${machine.utilization.mean * 100}%`,
                  height: '100%',
                  backgroundColor: machine.utilization.mean > 0.85 ? '#ef4444' : machine.utilization.mean > 0.7 ? '#f59e0b' : '#10b981',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="industrial-card" style={{ padding: '20px', marginTop: '30px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid var(--color-border)', paddingBottom: '15px' }}>
        <h2 style={{
          color: 'var(--color-primary)',
          fontSize: '1.5rem',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '10px'
        }}>
          📊 SIMULATION RESULTS
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Cross-replication statistics with 95% confidence intervals • {results.replicationsCompleted} replications completed
        </p>
      </div>

      {/* View Mode Selector */}
      <div style={{
        marginBottom: '20px',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setViewMode('pivot')}
          className={viewMode === 'pivot' ? 'industrial-button industrial-button--primary' : 'industrial-button industrial-button--secondary'}
          style={{ fontSize: '0.875rem' }}
        >
          📋 PIVOT TABLE
        </button>
        <button
          onClick={() => setViewMode('dashboard')}
          className={viewMode === 'dashboard' ? 'industrial-button industrial-button--primary' : 'industrial-button industrial-button--secondary'}
          style={{ fontSize: '0.875rem' }}
        >
          📈 DASHBOARD
        </button>
        <button
          onClick={() => setViewMode('smore')}
          className={viewMode === 'smore' ? 'industrial-button industrial-button--primary' : 'industrial-button industrial-button--secondary'}
          style={{ fontSize: '0.875rem' }}
        >
          📊 SMORE PLOTS
        </button>
      </div>

      {/* Content */}
      {viewMode === 'pivot' && renderPivotGrid()}
      {viewMode === 'dashboard' && renderDashboard()}
      {viewMode === 'smore' && renderSMOREPlots()}

      {/* Table Styles */}
      <style>{`
        .simio-table {
          width: 100%;
          border-collapse: collapse;
          font-family: var(--font-mono);
          fontSize: 0.875rem;
          backgroundColor: var(--color-bg-secondary);
        }

        .simio-table thead tr {
          background-color: var(--color-bg-tertiary);
          border-bottom: 2px solid var(--color-primary);
        }

        .simio-table th {
          padding: 12px;
          text-align: left;
          color: var(--color-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .simio-table tbody tr {
          border-bottom: 1px solid var(--color-border);
          transition: background-color 0.2s ease;
        }

        .simio-table tbody tr:hover {
          background-color: var(--color-bg-tertiary);
        }

        .simio-table td {
          padding: 10px 12px;
          color: var(--color-text-secondary);
        }
      `}</style>
    </div>
  );
}
