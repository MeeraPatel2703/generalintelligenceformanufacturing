/**
 * SIMIO-STYLE RESULTS PAGE
 *
 * Displays comprehensive simulation results with the most important metrics
 * that Simio users expect to see after running a DES model
 */

import React from 'react';
import { SimulationStats, Resource } from '../simulation/DESEngine';

interface SimioStyleResultsProps {
  stats: SimulationStats;
  resources: Resource[];
  simulationTime: number;
  entityHistory?: Array<{
    id: string;
    arrivalTime: number;
    departureTime?: number;
    cycleTime?: number;
  }>;
}

export const SimioStyleResults: React.FC<SimioStyleResultsProps> = ({
  stats,
  resources,
  simulationTime,
  entityHistory = []
}) => {
  // Calculate additional metrics
  const totalCapacity = resources.reduce((sum, r) => sum + r.capacity, 0);
  const avgUtilization = Object.values(stats.resourceUtilization).reduce((sum, u) => sum + u, 0) / resources.length;

  // Find bottleneck (highest utilization)
  const bottleneck = resources.reduce((max, r) => {
    const util = stats.resourceUtilization[r.id] || 0;
    const maxUtil = stats.resourceUtilization[max.id] || 0;
    return util > maxUtil ? r : max;
  }, resources[0]);

  const bottleneckUtil = stats.resourceUtilization[bottleneck?.id] || 0;

  // Calculate WIP (Work in Process)
  const avgWIP = stats.totalEntitiesCreated - stats.totalEntitiesDeparted;

  // Calculate throughput rate (entities per time unit)
  const throughputRate = simulationTime > 0 ? stats.totalEntitiesDeparted / simulationTime : 0;

  // Get utilization color
  const getUtilizationColor = (util: number): string => {
    if (util >= 0.95) return '#dc2626'; // Red - overutilized
    if (util >= 0.85) return '#f59e0b'; // Orange - high
    if (util >= 0.70) return '#10b981'; // Green - good
    return '#60a5fa'; // Blue - underutilized
  };

  // Get severity badge
  const getSeverityLevel = (util: number): { label: string; color: string } => {
    if (util >= 0.95) return { label: 'CRITICAL', color: '#dc2626' };
    if (util >= 0.85) return { label: 'HIGH', color: '#f59e0b' };
    if (util >= 0.70) return { label: 'MODERATE', color: '#10b981' };
    return { label: 'LOW', color: '#60a5fa' };
  };

  return (
    <div className="simio-results-container">
      <div className="results-header">
        <h2>Simulation Results</h2>
        <div className="simulation-info">
          <span>Simulation Time: {simulationTime.toFixed(2)} time units</span>
          <span>Model Type: Discrete Event Simulation (DES)</span>
        </div>
      </div>

      {/* KEY PERFORMANCE INDICATORS */}
      <section className="kpi-section">
        <h3>Key Performance Indicators</h3>
        <div className="kpi-grid">
          <div className="kpi-card throughput">
            <div className="kpi-icon">📊</div>
            <div className="kpi-content">
              <div className="kpi-label">Throughput</div>
              <div className="kpi-value">{stats.totalEntitiesDeparted}</div>
              <div className="kpi-subtitle">
                {throughputRate.toFixed(3)} entities/time unit
              </div>
            </div>
          </div>

          <div className="kpi-card cycle-time">
            <div className="kpi-icon">⏱️</div>
            <div className="kpi-content">
              <div className="kpi-label">Avg Cycle Time</div>
              <div className="kpi-value">{stats.avgCycleTime.toFixed(2)}</div>
              <div className="kpi-subtitle">time units</div>
            </div>
          </div>

          <div className="kpi-card utilization">
            <div className="kpi-icon">⚡</div>
            <div className="kpi-content">
              <div className="kpi-label">Avg Utilization</div>
              <div className="kpi-value">{(avgUtilization * 100).toFixed(1)}%</div>
              <div className="kpi-subtitle">{resources.length} resources</div>
            </div>
          </div>

          <div className="kpi-card wip">
            <div className="kpi-icon">📦</div>
            <div className="kpi-content">
              <div className="kpi-label">Work in Process</div>
              <div className="kpi-value">{avgWIP}</div>
              <div className="kpi-subtitle">entities</div>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTLENECK ANALYSIS */}
      {bottleneck && (
        <section className="bottleneck-section">
          <h3>Bottleneck Analysis</h3>
          <div
            className="bottleneck-card"
            style={{ borderLeftColor: getUtilizationColor(bottleneckUtil) }}
          >
            <div className="bottleneck-header">
              <div>
                <h4>{bottleneck.name}</h4>
                <span className="resource-id">{bottleneck.id}</span>
              </div>
              <span
                className="severity-badge"
                style={{ backgroundColor: getSeverityLevel(bottleneckUtil).color }}
              >
                {getSeverityLevel(bottleneckUtil).label}
              </span>
            </div>

            <div className="bottleneck-metrics">
              <div className="metric">
                <span className="metric-label">Utilization</span>
                <span className="metric-value">{(bottleneckUtil * 100).toFixed(1)}%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Capacity</span>
                <span className="metric-value">{bottleneck.capacity}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Max Queue</span>
                <span className="metric-value">{bottleneck.statistics.maxQueue}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Times Seized</span>
                <span className="metric-value">{bottleneck.statistics.totalSeized}</span>
              </div>
            </div>

            <div className="bottleneck-recommendation">
              {bottleneckUtil >= 0.95 && (
                <>
                  <strong>⚠️ Recommendation:</strong> This resource is severely overutilized.
                  Consider increasing capacity or reducing processing time to improve throughput.
                </>
              )}
              {bottleneckUtil >= 0.85 && bottleneckUtil < 0.95 && (
                <>
                  <strong>💡 Recommendation:</strong> This resource is highly utilized.
                  Monitor closely as it may become a constraint under increased demand.
                </>
              )}
              {bottleneckUtil < 0.85 && (
                <>
                  <strong>✅ Status:</strong> System is operating within normal parameters.
                  No immediate bottleneck concerns.
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* RESOURCE PERFORMANCE TABLE */}
      <section className="resource-section">
        <h3>Resource Performance</h3>
        <div className="resource-table-wrapper">
          <table className="resource-table">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Capacity</th>
                <th>Utilization</th>
                <th>Times Seized</th>
                <th>Max Queue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => {
                const utilization = stats.resourceUtilization[resource.id] || 0;
                return (
                  <tr
                    key={resource.id}
                    className={resource.id === bottleneck?.id ? 'bottleneck-row' : ''}
                  >
                    <td>
                      <div className="resource-name-cell">
                        <strong>{resource.name}</strong>
                        {resource.id === bottleneck?.id && (
                          <span className="bottleneck-tag">🔴 BOTTLENECK</span>
                        )}
                      </div>
                    </td>
                    <td>{resource.capacity}</td>
                    <td>
                      <div className="utilization-cell">
                        <div className="utilization-bar-container">
                          <div
                            className="utilization-bar"
                            style={{
                              width: `${utilization * 100}%`,
                              backgroundColor: getUtilizationColor(utilization)
                            }}
                          />
                        </div>
                        <span className="utilization-text">
                          {(utilization * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td>{resource.statistics.totalSeized}</td>
                    <td>{resource.statistics.maxQueue}</td>
                    <td>
                      <span
                        className="status-indicator"
                        style={{ backgroundColor: getUtilizationColor(utilization) }}
                      >
                        {utilization >= 0.95 ? 'CRITICAL' :
                         utilization >= 0.85 ? 'HIGH' :
                         utilization >= 0.70 ? 'GOOD' : 'IDLE'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* SYSTEM STATISTICS */}
      <section className="stats-section">
        <h3>System Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Entities Created</span>
            <span className="stat-value">{stats.totalEntitiesCreated}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Entities Departed</span>
            <span className="stat-value">{stats.totalEntitiesDeparted}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Still in System</span>
            <span className="stat-value">{avgWIP}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg Process Time</span>
            <span className="stat-value">{stats.avgProcessTime.toFixed(2)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg Wait Time</span>
            <span className="stat-value">{stats.avgWaitTime.toFixed(2)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">System Throughput</span>
            <span className="stat-value">{(stats.throughput * 60).toFixed(2)}/hr</span>
          </div>
        </div>
      </section>

      {/* SIMULATION NOTES */}
      <section className="notes-section">
        <h4>📝 Simulation Notes</h4>
        <ul>
          <li>Results based on single replication deterministic simulation</li>
          <li>Utilization = (Busy Time) / (Available Time × Capacity)</li>
          <li>Bottleneck identified by highest utilization rate</li>
          <li>Queue statistics measured at each resource</li>
          <li>All times measured in simulation time units</li>
        </ul>
      </section>

      <style>{`
        .simio-results-container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
          border-radius: 12px;
          margin-top: 2rem;
          color: white;
        }

        .results-header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .results-header h2 {
          margin: 0 0 0.5rem 0;
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
        }

        .simulation-info {
          display: flex;
          justify-content: center;
          gap: 2rem;
          font-size: 0.95rem;
          opacity: 0.95;
        }

        /* KPI Section */
        .kpi-section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .kpi-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
          color: white;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .kpi-card {
          background: rgba(255, 255, 255, 0.15);
          padding: 1.5rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: transform 0.2s ease;
        }

        .kpi-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.2);
        }

        .kpi-icon {
          font-size: 2.5rem;
        }

        .kpi-content {
          flex: 1;
        }

        .kpi-label {
          font-size: 0.9rem;
          opacity: 0.9;
          margin-bottom: 0.25rem;
        }

        .kpi-value {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1;
        }

        .kpi-subtitle {
          font-size: 0.85rem;
          opacity: 0.8;
          margin-top: 0.25rem;
        }

        /* Bottleneck Section */
        .bottleneck-section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .bottleneck-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
          color: white;
        }

        .bottleneck-card {
          background: white;
          color: #333;
          padding: 1.5rem;
          border-radius: 8px;
          border-left: 6px solid;
        }

        .bottleneck-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 1rem;
        }

        .bottleneck-header h4 {
          margin: 0;
          font-size: 1.5rem;
          color: #1a1a1a;
        }

        .resource-id {
          font-size: 0.9rem;
          color: #666;
        }

        .severity-badge {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          color: white;
          font-weight: 700;
          font-size: 0.85rem;
        }

        .bottleneck-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .metric {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .metric-label {
          font-size: 0.85rem;
          color: #666;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
        }

        .bottleneck-recommendation {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 4px;
          border-left: 4px solid #667eea;
          font-size: 0.95rem;
          color: #333;
        }

        /* Resource Table */
        .resource-section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .resource-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
          color: white;
        }

        .resource-table-wrapper {
          overflow-x: auto;
        }

        .resource-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }

        .resource-table thead {
          background: #1a1a2e;
          color: white;
        }

        .resource-table th {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
        }

        .resource-table td {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          color: #333;
        }

        .resource-table tbody tr:last-child td {
          border-bottom: none;
        }

        .bottleneck-row {
          background: #fef3c7 !important;
        }

        .resource-name-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .bottleneck-tag {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          background: #dc2626;
          color: white;
          border-radius: 4px;
        }

        .utilization-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .utilization-bar-container {
          width: 100%;
          height: 20px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .utilization-bar {
          height: 100%;
          transition: width 0.3s ease;
        }

        .utilization-text {
          font-size: 0.9rem;
          font-weight: 600;
          color: #333;
        }

        .status-indicator {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
        }

        /* Stats Section */
        .stats-section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .stats-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
          color: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .stat-item {
          background: rgba(255, 255, 255, 0.1);
          padding: 1rem;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .stat-label {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        /* Notes Section */
        .notes-section {
          background: rgba(255, 255, 255, 0.05);
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .notes-section h4 {
          margin: 0 0 1rem 0;
          color: white;
        }

        .notes-section ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .notes-section li {
          margin: 0.5rem 0;
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .kpi-grid,
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
