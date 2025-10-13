import React, { useState } from 'react';
import { FactoryAnalysis } from '../types/analysis';
import { SimulationResults } from '../types/simulation';

interface SimulationRunnerProps {
  analysis: FactoryAnalysis;
  onResults: (results: SimulationResults) => void;
}

const SimulationRunner: React.FC<SimulationRunnerProps> = ({ analysis, onResults }) => {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [numReplications, setNumReplications] = useState(100);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async () => {
    setRunning(true);
    setProgress(0);
    setError(null);

    try {
      // Set up progress listener
      window.electron.onSimulationProgress((p: number) => {
        setProgress(p * 100);
      });

      console.log('[SimRunner] Starting simulation with', numReplications, 'replications');
      const result = await window.electron.runSimulation(analysis, numReplications);

      if (result.success && result.results) {
        console.log('[SimRunner] Simulation complete:', result.results);
        onResults(result.results);
        setProgress(100);
      } else {
        setError(result.error || 'Simulation failed');
        console.error('[SimRunner] Simulation failed:', result.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[SimRunner] Simulation error:', err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="simulation-runner">
      <div className="config-section">
        <h3>Simulation Configuration</h3>

        <div className="config-row">
          <label htmlFor="replications">Number of Replications:</label>
          <input
            id="replications"
            type="number"
            min="100"
            max="10000"
            step="100"
            value={numReplications}
            onChange={(e) => setNumReplications(parseInt(e.target.value))}
            disabled={running}
          />
          <span className="help-text">
            (More replications = higher accuracy, longer runtime)
          </span>
        </div>

        <div className="info-box">
          <p><strong>Simulation Type:</strong> Discrete Event Simulation (DES)</p>
          <p><strong>Machines:</strong> {analysis.machines.length}</p>
          <p><strong>Flow:</strong> {analysis.flow_sequence.join(' → ')}</p>
          <p><strong>Expected Runtime:</strong> ~{Math.ceil(numReplications / 10)} seconds</p>
          <p className="text-sm opacity-90 mt-2">
            Note: DES models queues, blocking, and state changes for accurate bottleneck analysis
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={running}
          className="run-button"
        >
          {running ? 'Running Simulation...' : 'Run Simulation'}
        </button>

        {running && (
          <div className="progress-section">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="progress-text">
              {progress < 100 ? `Progress: ${progress.toFixed(1)}%` : 'Complete!'}
            </p>
          </div>
        )}

        {error && (
          <div className="error-box">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      <style>{`
        .simulation-runner {
          margin: 2rem 0;
          padding: 1.5rem;
          background: #4a5568;
          border-radius: 4px;
          color: white;
          border: 1px solid #2d3748;
        }

        .config-section h3 {
          margin-top: 0;
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .config-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .config-row label {
          font-weight: 600;
          min-width: 200px;
        }

        .config-row input {
          padding: 0.5rem;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          background: white;
          font-size: 1rem;
          width: 120px;
        }

        .help-text {
          font-size: 0.85rem;
          opacity: 0.9;
          font-style: italic;
        }

        .info-box {
          background: rgba(255, 255, 255, 0.1);
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .info-box p {
          margin: 0.5rem 0;
        }

        .run-button {
          background: #3182ce;
          color: white;
          border: none;
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s ease;
          width: 100%;
        }

        .run-button:hover:not(:disabled) {
          background: #2c5282;
        }

        .run-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .progress-section {
          margin-top: 1.5rem;
        }

        .progress-bar {
          width: 100%;
          height: 30px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .progress-fill {
          height: 100%;
          background: #48bb78;
          transition: width 0.3s ease;
        }

        .progress-text {
          text-align: center;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .error-box {
          background: #fed7d7;
          border: 1px solid #fc8181;
          padding: 1rem;
          border-radius: 4px;
          margin-top: 1rem;
          color: #742a2a;
        }
      `}</style>
    </div>
  );
};

export default SimulationRunner;
