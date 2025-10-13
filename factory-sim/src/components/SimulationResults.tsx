import React from 'react';
import { SimulationResults as SimResults } from '../types/simulation';

interface SimulationResultsProps {
  results: SimResults;
}

const SimulationResults: React.FC<SimulationResultsProps> = ({ results }) => {
  const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toFixed(decimals);
  };

  const formatCI = (mean: number, ci: number): string => {
    return `${formatNumber(mean)} ± ${formatNumber(ci)}`;
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high'): string => {
    switch (severity) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffaa00';
      case 'low': return '#44ff44';
    }
  };

  return (
    <div className="simulation-results">
      <h2>Simulation Results</h2>
      <p className="subtitle">
        Based on {results.replicationsCompleted} Monte Carlo replications
      </p>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-content">
            <h3>Throughput</h3>
            <div className="metric-value">
              {formatNumber(results.throughput.mean, 1)} parts/hr
            </div>
            <div className="metric-ci">
              95% CI: ± {formatNumber(results.throughput.confidenceInterval, 2)}
            </div>
            <div className="metric-range">
              Range: {formatNumber(results.throughput.min, 1)} - {formatNumber(results.throughput.max, 1)}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <h3>Cycle Time</h3>
            <div className="metric-value">
              {formatNumber(results.cycleTime.mean, 1)} min
            </div>
            <div className="metric-ci">
              95% CI: ± {formatNumber(results.cycleTime.confidenceInterval, 2)}
            </div>
            <div className="metric-range">
              Range: {formatNumber(results.cycleTime.min, 1)} - {formatNumber(results.cycleTime.max, 1)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottleneck Analysis */}
      <div className="bottleneck-section">
        <h3>Bottleneck Analysis</h3>
        <div
          className="bottleneck-card"
          style={{ borderLeftColor: getSeverityColor(results.bottleneck.severity) }}
        >
          <div className="bottleneck-header">
            <span className="machine-id">{results.bottleneck.machineId}</span>
            <span
              className="severity-badge"
              style={{ backgroundColor: getSeverityColor(results.bottleneck.severity) }}
            >
              {results.bottleneck.severity.toUpperCase()}
            </span>
          </div>
          <p className="bottleneck-reason">{results.bottleneck.reason}</p>
          <div className="bottleneck-stats">
            <div className="stat">
              <strong>Utilization:</strong> {(results.bottleneck.utilization * 100).toFixed(1)}%
            </div>
            <div className="stat">
              <strong>Avg Queue:</strong> {formatNumber(results.bottleneck.averageQueue, 1)} parts
            </div>
            <div className="stat">
              <strong>Lost Throughput:</strong> {formatNumber(results.bottleneck.lostThroughput, 2)} parts/hr
            </div>
          </div>
        </div>
      </div>

      {/* Machine Details */}
      <div className="machines-section">
        <h3>Machine Performance</h3>
        <div className="machines-table">
          <table>
            <thead>
              <tr>
                <th>Machine ID</th>
                <th>Utilization</th>
                <th>Parts Processed</th>
                <th>Avg Queue</th>
                <th>Idle Time</th>
              </tr>
            </thead>
            <tbody>
              {results.machines.map((machine) => (
                <tr
                  key={machine.id}
                  className={machine.id === results.bottleneck.machineId ? 'bottleneck-row' : ''}
                >
                  <td>
                    <strong>{machine.id}</strong>
                    {machine.id === results.bottleneck.machineId && (
                      <span className="bottleneck-tag">BOTTLENECK</span>
                    )}
                  </td>
                  <td>
                    <div className="util-bar-container">
                      <div
                        className="util-bar"
                        style={{
                          width: `${machine.utilization.mean * 100}%`,
                          backgroundColor: machine.utilization.mean > 0.9 ? '#ff4444' :
                                          machine.utilization.mean > 0.8 ? '#ffaa00' : '#44ff44'
                        }}
                      />
                      <span className="util-text">
                        {(machine.utilization.mean * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="ci-text">
                      ± {(machine.utilization.confidenceInterval * 100).toFixed(1)}%
                    </div>
                  </td>
                  <td>
                    {formatCI(machine.partsProcessed.mean, machine.partsProcessed.confidenceInterval)}
                  </td>
                  <td>
                    {formatCI(machine.averageQueue.mean, machine.averageQueue.confidenceInterval)}
                  </td>
                  <td>
                    {(machine.idleTimePercent.mean * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistical Notes */}
      <div className="notes-section">
        <h4>Notes</h4>
        <ul>
          <li>95% confidence intervals shown (based on {results.replicationsCompleted} replications)</li>
          <li>Simulation type: Monte Carlo (stochastic sampling)</li>
          <li>Bottleneck identified by highest cycle time (throughput limiter)</li>
          <li>All times in minutes, throughput in parts/hour</li>
        </ul>
      </div>

      <style>{`
        .simulation-results {
          margin: 2rem 0;
          padding: 2rem;
          background: white;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }

        .simulation-results h2 {
          margin-top: 0;
          color: #333;
          font-size: 2rem;
        }

        .subtitle {
          color: #666;
          font-size: 1rem;
          margin-bottom: 2rem;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .metric-card {
          background: #4a5568;
          padding: 1.5rem;
          border-radius: 4px;
          color: white;
          border: 1px solid #2d3748;
        }

        .metric-content h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          opacity: 0.95;
        }

        .metric-value {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .metric-ci, .metric-range {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .bottleneck-section {
          margin: 2rem 0;
        }

        .bottleneck-section h3 {
          color: #333;
          margin-bottom: 1rem;
        }

        .bottleneck-card {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 4px;
          border-left: 4px solid;
        }

        .bottleneck-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .machine-id {
          font-size: 1.5rem;
          font-weight: 700;
          color: #333;
        }

        .severity-badge {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          color: white;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .bottleneck-reason {
          color: #555;
          font-size: 1.1rem;
          margin-bottom: 1rem;
        }

        .bottleneck-stats {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .bottleneck-stats .stat {
          color: #666;
        }

        .machines-section {
          margin: 2rem 0;
        }

        .machines-section h3 {
          color: #333;
          margin-bottom: 1rem;
        }

        .machines-table {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #667eea;
          color: white;
          padding: 1rem;
          text-align: left;
          font-weight: 600;
        }

        td {
          padding: 1rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .bottleneck-row {
          background: #fff3cd;
        }

        .bottleneck-tag {
          margin-left: 0.5rem;
          font-size: 0.8rem;
          color: #ff4444;
        }

        .util-bar-container {
          position: relative;
          width: 100%;
          height: 24px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.25rem;
        }

        .util-bar {
          height: 100%;
          transition: width 0.3s ease;
        }

        .util-text {
          position: absolute;
          top: 2px;
          left: 50%;
          transform: translateX(-50%);
          font-weight: 600;
          font-size: 0.9rem;
          color: #333;
        }

        .ci-text {
          font-size: 0.8rem;
          color: #666;
        }

        .notes-section {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f7fafc;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }

        .notes-section h4 {
          margin-top: 0;
          color: #333;
        }

        .notes-section ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .notes-section li {
          margin: 0.5rem 0;
          color: #555;
        }
      `}</style>
    </div>
  );
};

export default SimulationResults;
