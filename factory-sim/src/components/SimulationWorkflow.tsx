import React, { useState } from 'react';
import { ProcessGraph } from '../types/processGraph';
import { ParserResult } from '../services/desParser';
import ParsedDataReview from './ParsedDataReview';

type WorkflowStage = 'input' | 'parsing' | 'review' | 'simulation' | 'results';

interface SimulationWorkflowProps {
  // Optional: pass initial parser result if already parsed
  initialParserResult?: ParserResult;
}

const SimulationWorkflow: React.FC<SimulationWorkflowProps> = ({ initialParserResult }) => {
  const [stage, setStage] = useState<WorkflowStage>(
    initialParserResult ? 'review' : 'input'
  );
  const [parserResult, setParserResult] = useState<ParserResult | null>(
    initialParserResult || null
  );
  const [approvedGraph, setApprovedGraph] = useState<ProcessGraph | null>(null);
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setInputText(''); // Clear text input if file is selected
    }
  };

  // Handle parse button click
  const handleParse = async () => {
    setStage('parsing');
    setParseError(null);

    try {
      let result: ParserResult;

      if (file) {
        // Parse document file
        const filePath = (file as any).path; // Electron file path
        result = await window.electron.parseDocument(filePath);
      } else if (inputText.trim()) {
        // Parse text
        result = await window.electron.parseText(inputText);
      } else {
        setParseError('Please provide input text or upload a file');
        setStage('input');
        return;
      }

      if (result.success && result.processGraph) {
        setParserResult(result);
        setStage('review');
      } else {
        setParseError(result.error || 'Parsing failed for unknown reason');
        setStage('input');
      }
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Unknown error');
      setStage('input');
    }
  };

  // Handle approval from review stage
  const handleApprove = (editedGraph: ProcessGraph) => {
    setApprovedGraph(editedGraph);
    setStage('simulation');
  };

  // Handle rejection from review stage
  const handleReject = () => {
    setParserResult(null);
    setApprovedGraph(null);
    setStage('input');
  };

  // Handle simulation completion
  const handleSimulationComplete = () => {
    setStage('results');
  };

  return (
    <div className="simulation-workflow">
      {/* Progress Stepper */}
      <div className="workflow-stepper">
        <div className={`step ${stage === 'input' || stage === 'parsing' ? 'active' : 'completed'}`}>
          <div className="step-number">1</div>
          <div className="step-label">Parse Input</div>
        </div>
        <div className="step-connector" />
        <div className={`step ${stage === 'review' ? 'active' : stage === 'simulation' || stage === 'results' ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Review & Edit</div>
        </div>
        <div className="step-connector" />
        <div className={`step ${stage === 'simulation' ? 'active' : stage === 'results' ? 'completed' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Run Simulation</div>
        </div>
        <div className="step-connector" />
        <div className={`step ${stage === 'results' ? 'active' : ''}`}>
          <div className="step-number">4</div>
          <div className="step-label">View Results</div>
        </div>
      </div>

      {/* Stage Content */}
      <div className="workflow-content">
        {/* INPUT STAGE */}
        {stage === 'input' && (
          <div className="stage-container">
            <h2>Step 1: Provide Input</h2>
            <p className="stage-description">
              Upload a document (PDF, DOCX, TXT) or paste text describing your simulation model
            </p>

            {parseError && (
              <div className="error-banner">
                <strong>Parse Error:</strong> {parseError}
              </div>
            )}

            <div className="input-section">
              <div className="input-option">
                <h3>Option 1: Upload Document</h3>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  className="file-input"
                />
                {file && (
                  <div className="file-selected">
                    ✓ Selected: {file.name}
                  </div>
                )}
              </div>

              <div className="input-divider">
                <span>OR</span>
              </div>

              <div className="input-option">
                <h3>Option 2: Paste Text</h3>
                <textarea
                  className="text-input"
                  placeholder="Paste your simulation description here...&#10;&#10;Example:&#10;We have a factory with 3 machines: CNC (12 min cycle time), Assembly (8 min), and Quality Check (5 min). Parts arrive every 10 minutes. Flow is CNC → Assembly → QC → Finish."
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    setFile(null); // Clear file if text is entered
                  }}
                  rows={12}
                />
              </div>
            </div>

            <button
              className="primary-button"
              onClick={handleParse}
              disabled={!file && !inputText.trim()}
            >
              Parse Input →
            </button>
          </div>
        )}

        {/* PARSING STAGE */}
        {stage === 'parsing' && (
          <div className="stage-container">
            <h2>Parsing...</h2>
            <div className="loading-spinner">
              <div className="spinner" />
              <p>Extracting simulation parameters from your input...</p>
            </div>
          </div>
        )}

        {/* REVIEW STAGE */}
        {stage === 'review' && parserResult && parserResult.processGraph && (
          <ParsedDataReview
            initialGraph={parserResult.processGraph}
            validation={parserResult.validation!}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}

        {/* SIMULATION STAGE */}
        {stage === 'simulation' && approvedGraph && (
          <div className="stage-container">
            <h2>Step 3: Run Simulation</h2>
            <p className="stage-description">
              Ready to run discrete event simulation with your approved configuration
            </p>

            <div className="simulation-summary">
              <h3>Configuration Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <strong>Stations:</strong> {approvedGraph.stations.length}
                </div>
                <div className="summary-item">
                  <strong>Routes:</strong> {approvedGraph.routes.length}
                </div>
                <div className="summary-item">
                  <strong>Entities:</strong> {approvedGraph.entities.length}
                </div>
                <div className="summary-item">
                  <strong>Run Length:</strong> {approvedGraph.runConfig.runLength_min} min
                </div>
                <div className="summary-item">
                  <strong>Replications:</strong> {approvedGraph.runConfig.replications}
                </div>
                <div className="summary-item">
                  <strong>Confidence:</strong> {approvedGraph.runConfig.confidence}%
                </div>
              </div>
            </div>

            <button
              className="primary-button"
              onClick={handleSimulationComplete}
            >
              Start Simulation →
            </button>

            <button
              className="secondary-button"
              onClick={() => setStage('review')}
            >
              ← Back to Review
            </button>
          </div>
        )}

        {/* RESULTS STAGE */}
        {stage === 'results' && (
          <div className="stage-container">
            <h2>Step 4: Results</h2>
            <p className="stage-description">Simulation complete!</p>

            <div className="results-placeholder">
              <p>Results will be displayed here</p>
              <p className="text-sm opacity-80">
                (Integration with SimulationRunner component needed)
              </p>
            </div>

            <button
              className="secondary-button"
              onClick={() => {
                setStage('input');
                setParserResult(null);
                setApprovedGraph(null);
                setInputText('');
                setFile(null);
              }}
            >
              Start New Simulation
            </button>
          </div>
        )}
      </div>

      <style>{`
        .simulation-workflow {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          background: #1a202c;
          color: white;
          min-height: 100vh;
        }

        .workflow-stepper {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 3rem;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          opacity: 0.4;
          transition: opacity 0.3s ease;
        }

        .step.active,
        .step.completed {
          opacity: 1;
        }

        .step-number {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #4a5568;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .step.active .step-number {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
        }

        .step.completed .step-number {
          background: #48bb78;
        }

        .step-label {
          font-size: 0.9rem;
          font-weight: 600;
          text-align: center;
        }

        .step-connector {
          width: 100px;
          height: 3px;
          background: #4a5568;
          margin: 0 1rem;
        }

        .workflow-content {
          background: #2d3748;
          border-radius: 8px;
          padding: 2rem;
        }

        .stage-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .stage-container h2 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
        }

        .stage-description {
          opacity: 0.8;
          margin: 0 0 2rem 0;
          font-size: 1.1rem;
        }

        .error-banner {
          background: #fed7d7;
          border: 2px solid #fc8181;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 2rem;
          color: #742a2a;
        }

        .input-section {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .input-option h3 {
          margin: 0 0 1rem 0;
          font-size: 1.3rem;
        }

        .file-input {
          display: block;
          width: 100%;
          padding: 1rem;
          border: 2px dashed rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.2);
          color: white;
          cursor: pointer;
        }

        .file-input:hover {
          border-color: rgba(255, 255, 255, 0.5);
        }

        .file-selected {
          margin-top: 1rem;
          padding: 0.75rem;
          background: rgba(72, 187, 120, 0.2);
          border: 1px solid #48bb78;
          border-radius: 4px;
          color: #48bb78;
        }

        .input-divider {
          text-align: center;
          position: relative;
          margin: 1rem 0;
        }

        .input-divider::before,
        .input-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 45%;
          height: 1px;
          background: rgba(255, 255, 255, 0.2);
        }

        .input-divider::before {
          left: 0;
        }

        .input-divider::after {
          right: 0;
        }

        .input-divider span {
          padding: 0 1rem;
          background: #2d3748;
          opacity: 0.6;
        }

        .text-input {
          width: 100%;
          padding: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.2);
          color: white;
          font-family: inherit;
          font-size: 1rem;
          line-height: 1.5;
          resize: vertical;
        }

        .text-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .primary-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          font-size: 1.2rem;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: transform 0.2s ease;
          width: 100%;
          margin-top: 1rem;
        }

        .primary-button:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .primary-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .secondary-button {
          background: #718096;
          color: white;
          border: none;
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 1rem;
          width: 100%;
        }

        .secondary-button:hover {
          background: #4a5568;
        }

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          padding: 4rem 2rem;
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .simulation-summary {
          background: rgba(255, 255, 255, 0.05);
          padding: 1.5rem;
          border-radius: 6px;
          margin-bottom: 2rem;
        }

        .simulation-summary h3 {
          margin: 0 0 1rem 0;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .summary-item {
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .summary-item strong {
          color: #a0aec0;
          display: block;
          margin-bottom: 0.25rem;
          font-size: 0.9rem;
        }

        .results-placeholder {
          background: rgba(255, 255, 255, 0.05);
          padding: 4rem 2rem;
          border-radius: 6px;
          text-align: center;
          margin-bottom: 2rem;
        }

        .results-placeholder p {
          margin: 0.5rem 0;
        }

        .text-sm {
          font-size: 0.9rem;
        }

        .opacity-80 {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default SimulationWorkflow;
