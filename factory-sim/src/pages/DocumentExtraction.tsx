import { useState, useEffect } from 'react';
import { ExtractedSystem } from '../types/extraction';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { SimpleIndustrialSim } from '../components/SimpleIndustrialSim';
import { useDESModelStore } from '../store/desModelStore';

interface DocumentData {
  filePath: string;
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'word' | 'text';
  content: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    hasImages?: boolean;
    hasTables?: boolean;
  };
}

export function DocumentExtraction() {
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [extractedSystem, setExtractedSystem] = useState<ExtractedSystem | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [tokensUsed, setTokensUsed] = useState<{ input: number; output: number } | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [simulationTime, setSimulationTime] = useState(0);
  const [showLiveView, setShowLiveView] = useState(true);

  // DES Model Store
  const { setExtractedSystem: setDESSystem } = useDESModelStore();

  // Debug: Log state changes
  useEffect(() => {
    console.log('[DocumentExtraction] State change - extractedSystem:', extractedSystem ? 'SET' : 'NULL');
    console.log('[DocumentExtraction] State change - extracting:', extracting);
    console.log('[DocumentExtraction] State change - error:', error);
  }, [extractedSystem, extracting, error]);

  const handleUploadDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      setExtractedSystem(null);

      if (!window.electron) {
        throw new Error('window.electron is not defined - preload script may not have loaded');
      }

      const dialogResult = await window.electron.openDocumentDialog();

      if (dialogResult.canceled || !dialogResult.filePath) {
        setLoading(false);
        return;
      }

      // Get document info
      const infoResult = await window.electron.getDocumentInfo(dialogResult.filePath);

      if (!infoResult.success) {
        setError(infoResult.error || 'Failed to get document info');
        setLoading(false);
        return;
      }

      if (!infoResult.supported) {
        setError(`Unsupported file format: ${infoResult.extension}`);
        setLoading(false);
        return;
      }

      // Parse document
      const parseResult = await window.electron.parseDocument(dialogResult.filePath);

      if (!parseResult.success || !parseResult.content) {
        setError(parseResult.error || 'Failed to parse document');
        setLoading(false);
        return;
      }

      // Determine document type
      let docType: 'pdf' | 'word' | 'text';
      if (infoResult.extension === '.pdf') {
        docType = 'pdf';
      } else if (infoResult.extension === '.docx' || infoResult.extension === '.doc') {
        docType = 'word';
      } else {
        docType = 'text';
      }

      setDocumentData({
        filePath: dialogResult.filePath,
        fileName: infoResult.name || 'Unknown',
        fileSize: infoResult.size || 0,
        fileType: docType,
        content: parseResult.content,
        metadata: parseResult.metadata
      });

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLoading(false);
    }
  };

  const handleExtractSystem = async () => {
    if (!documentData || !window.electron) return;

    try {
      setExtracting(true);
      setError(null);
      setWarnings([]);

      console.log('[DocumentExtraction] Starting system extraction...');
      console.log('[DocumentExtraction] Content length being sent:', documentData.content.length);
      console.log('[DocumentExtraction] First 200 chars:', documentData.content.substring(0, 200));
      console.log('[DocumentExtraction] Last 200 chars:', documentData.content.substring(documentData.content.length - 200));

      const result = await window.electron.extractSystem(
        documentData.content,
        documentData.fileType
      );

      console.log('[DocumentExtraction] Raw result:', result);

      if (!result.success) {
        throw new Error(result.error || 'System extraction failed');
      }

      console.log('[DocumentExtraction] Extraction complete:', result.system);
      console.log('[DocumentExtraction] System entities:', result.system?.entities);
      console.log('[DocumentExtraction] System resources:', result.system?.resources);

      setExtractedSystem(result.system || null);
      setWarnings(result.warnings || []);
      setTokensUsed(result.tokensUsed || null);
      setExtracting(false);

      console.log('[DocumentExtraction] State updated, extracting=false');
    } catch (err) {
      console.error('[DocumentExtraction] Extraction error:', err);
      setError(err instanceof Error ? err.message : 'Extraction failed');
      setExtracting(false);
    }
  };

  const handleExportSystem = () => {
    if (!extractedSystem) return;

    const json = JSON.stringify(extractedSystem, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extracted-system-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setDocumentData(null);
    setExtractedSystem(null);
    setError(null);
    setWarnings([]);
    setTokensUsed(null);
    setSimulating(false);
    setSimulationResults(null);
    setSimulationTime(0);
    setShowLiveView(true);
  };

  const handleRunSimulation = async () => {
    if (!extractedSystem || !window.electron) return;

    try {
      setSimulating(true);
      setError(null);
      setSimulationTime(0);

      console.log('[DocumentExtraction] Starting DES simulation...');

      const result = await window.electron.runSimulation(extractedSystem, 100);

      if (!result.success) {
        throw new Error(result.error || 'Simulation failed');
      }

      console.log('[DocumentExtraction] Simulation complete:', result.results);
      setSimulationResults(result.results);
      setSimulating(false);
    } catch (err) {
      console.error('[DocumentExtraction] Simulation error:', err);
      setError(err instanceof Error ? err.message : 'Simulation failed');
      setSimulating(false);
    }
  };

  // Update simulation time
  useEffect(() => {
    if (!simulating) return;
    const interval = setInterval(() => {
      setSimulationTime(prev => prev + 0.1);
    }, 100);
    return () => clearInterval(interval);
  }, [simulating]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Debug render state
  console.log('[DocumentExtraction] RENDER - documentData:', !!documentData);
  console.log('[DocumentExtraction] RENDER - extractedSystem:', !!extractedSystem);
  console.log('[DocumentExtraction] RENDER - extracting:', extracting);
  console.log('[DocumentExtraction] RENDER - loading:', loading);
  console.log('[DocumentExtraction] RENDER - simulating:', simulating);
  console.log('[DocumentExtraction] RENDER - simulationResults:', !!simulationResults);
  console.log('[DocumentExtraction] RENDER - showLiveView:', showLiveView);
  console.log('[DocumentExtraction] RENDER - Will show LiveCanvas?', (simulating || simulationResults) && extractedSystem && showLiveView);

  return (
    <ErrorBoundary>
      <div className="document-extraction-container">
        <div className="header">
          <h1>Natural Language to DES</h1>
          <p className="subtitle">
            Upload a document describing an operational system, and AI will automatically extract
            a complete discrete event simulation model.
          </p>
        </div>

      {!documentData && (
        <div className="upload-section">
          <button
            className="upload-button primary"
            onClick={handleUploadDocument}
            disabled={loading}
          >
            {loading ? 'Loading document...' : 'Upload Document'}
          </button>
          <p className="upload-hint">
            Supported formats: PDF, Word (.docx, .doc), Text (.txt, .md)
          </p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="warning-message">
          <strong>Warnings:</strong>
          <ul>
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {documentData && !extractedSystem && !extracting && (
        <div className="document-info-section">
          <div className="info-card">
            <h2>Document Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">File:</span>
                <span className="info-value">{documentData.fileName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Size:</span>
                <span className="info-value">{formatFileSize(documentData.fileSize)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Type:</span>
                <span className="info-value">{documentData.fileType.toUpperCase()}</span>
              </div>
              {documentData.metadata?.pageCount && (
                <div className="info-item">
                  <span className="info-label">Pages:</span>
                  <span className="info-value">{documentData.metadata.pageCount}</span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Characters:</span>
                <span className="info-value">{documentData.content.length.toLocaleString()}</span>
              </div>
              {documentData.metadata?.wordCount && (
                <div className="info-item">
                  <span className="info-label">Words:</span>
                  <span className="info-value">{documentData.metadata.wordCount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="content-preview">
            <h3>Content Preview</h3>
            <pre className="preview-text">
              {documentData.content.substring(0, 1000)}
              {documentData.content.length > 1000 ? '...' : ''}
            </pre>
            <p className="preview-note">
              Showing 1,000 of {documentData.content.length.toLocaleString()} characters
              {documentData.content.length > 1000 && (
                <strong style={{ color: '#10b981', marginLeft: '0.5rem' }}>
                  ✓ Full document ({documentData.content.length.toLocaleString()} chars) will be sent to AI
                </strong>
              )}
            </p>
          </div>

          <div className="action-buttons">
            <button className="extract-button" onClick={handleExtractSystem}>
              Extract DES Model
            </button>
            <button className="reset-button" onClick={handleReset}>
              Upload Different Document
            </button>
          </div>
        </div>
      )}

      {extracting && (
        <LoadingSpinner message="AI extracting system configuration from document..." />
      )}

      {/* Simple test render */}
      {extractedSystem && !extracting && !error && (
        <div className="extraction-results" style={{ minHeight: '200px', background: 'white', padding: '20px' }}>
          <div className="results-header">
            <h2>✅ System Extracted Successfully</h2>
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                Debug: {extractedSystem.entities?.length || 0} entities,
                {extractedSystem.resources?.length || 0} resources,
                {extractedSystem.processes?.length || 0} processes
              </div>
            )}
            <div className="action-buttons">
              <button
                className="primary-button"
                onClick={() => {
                  setDESSystem(extractedSystem);
                  window.location.hash = '/editable-des';
                }}
                style={{
                  background: '#238636',
                  color: 'white',
                  fontWeight: 600,
                }}
              >
                Edit Model in DES Editor
              </button>
              <button className="export-button" onClick={handleExportSystem}>
                Export JSON
              </button>
              {simulationResults && (
                <button
                  className="view-toggle-button"
                  onClick={() => setShowLiveView(!showLiveView)}
                >
                  {showLiveView ? 'Show Results' : 'Show Simulation'}
                </button>
              )}
              <button className="reset-button" onClick={handleReset}>
                Upload New Document
              </button>
            </div>
          </div>

          {tokensUsed && (
            <div className="token-usage">
              <span>Tokens Used: {tokensUsed.input.toLocaleString()} input + {tokensUsed.output.toLocaleString()} output</span>
            </div>
          )}

          <div className="system-summary">
            <div className="summary-card">
              <h3>System Overview</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">System Type:</span>
                  <span className="summary-value badge">{extractedSystem.systemType}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">System Name:</span>
                  <span className="summary-value">{extractedSystem.systemName}</span>
                </div>
                <div className="summary-item full-width">
                  <span className="summary-label">Description:</span>
                  <span className="summary-value">{extractedSystem.description}</span>
                </div>
              </div>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">{extractedSystem.entities?.length || 0}</div>
                <div className="metric-label">Entities</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{extractedSystem.resources?.length || 0}</div>
                <div className="metric-label">Resources</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{extractedSystem.processes?.length || 0}</div>
                <div className="metric-label">Processes</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{extractedSystem.objectives?.length || 0}</div>
                <div className="metric-label">Objectives</div>
              </div>
            </div>
          </div>

          <div className="details-section">
            <div className="detail-card">
              <h3>Entities</h3>
              <div className="entity-list">
                {(extractedSystem.entities || []).map((entity, index) => (
                  <div key={index} className="entity-item">
                    <div className="entity-header">
                      <strong>{entity.name}</strong>
                      <span className="badge small">{entity.type}</span>
                    </div>
                    <div className="entity-details">
                      <div>Arrival: {entity.arrivalPattern?.type || 'N/A'}</div>
                      {entity.arrivalPattern?.rate && (
                        <div>Rate: {typeof entity.arrivalPattern.rate === 'object' ? JSON.stringify(entity.arrivalPattern.rate) : entity.arrivalPattern.rate} {entity.arrivalPattern.rateUnit || ''}</div>
                      )}
                    </div>
                    {entity.description && <p className="description">{entity.description}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-card">
              <h3>Resources</h3>
              <div className="resource-list">
                {(extractedSystem.resources || []).map((resource, index) => (
                  <div key={index} className="resource-item">
                    <div className="resource-header">
                      <strong>{resource.name}</strong>
                      <span className="badge small">{resource.type}</span>
                    </div>
                    <div className="resource-details">
                      <div>Capacity: {resource.capacity}</div>
                      {resource.processingTime && (
                        <div>
                          Processing: {resource.processingTime.type}
                          {resource.processingTime.parameters?.mean &&
                            ` (μ=${resource.processingTime.parameters.mean} ${resource.processingTime.unit})`}
                        </div>
                      )}
                    </div>
                    {resource.description && <p className="description">{resource.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {extractedSystem.missingInformation && (extractedSystem.missingInformation || []).length > 0 && (
            <div className="missing-info-section">
              <h3>⚠️ Missing Information</h3>
              <div className="missing-list">
                {(extractedSystem.missingInformation || []).map((item, index) => (
                  <div key={index} className={`missing-item severity-${item.severity}`}>
                    <div className="missing-header">
                      <span className="severity-badge">{item.severity}</span>
                      <span className="category">{item.category}</span>
                    </div>
                    <p>{item.description}</p>
                    {item.suggestedDefault && (
                      <p className="suggestion">Suggested default: {JSON.stringify(item.suggestedDefault)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {extractedSystem.assumptions && (extractedSystem.assumptions || []).length > 0 && (
            <div className="assumptions-section">
              <h3>💭 Assumptions Made</h3>
              <div className="assumptions-list">
                {(extractedSystem.assumptions || []).map((assumption, index) => (
                  <div key={index} className="assumption-item">
                    <div className="assumption-header">
                      <span className="badge small">{assumption.category}</span>
                    </div>
                    <p><strong>{assumption.description}</strong></p>
                    <p className="rationale">Rationale: {assumption.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* INDUSTRIAL DES KERNEL - Simple Working Version */}
      {extractedSystem && showLiveView && (
        <SimpleIndustrialSim
          system={extractedSystem}
        />
      )}

      {/* Simulation Results */}
      {simulationResults && !showLiveView && (
        <div className="simulation-results">
          <h2>Simulation Results</h2>
          <div className="results-summary">
            <div className="summary-card">
              <h3>Performance Metrics</h3>
              <div className="metrics-grid">
                <div className="metric-item">
                  <span className="metric-label">Mean Throughput:</span>
                  <span className="metric-value">{simulationResults.meanThroughput?.toFixed(2)} units/hour</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Mean Cycle Time:</span>
                  <span className="metric-value">{simulationResults.meanCycleTime?.toFixed(2)} min</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Total WIP:</span>
                  <span className="metric-value">{simulationResults.totalWIP?.toFixed(0)} units</span>
                </div>
              </div>
            </div>
          </div>
          <pre style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', overflow: 'auto' }}>
            {JSON.stringify(simulationResults, null, 2)}
          </pre>
        </div>
      )}

      <style>{`
        .document-extraction-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          background: #ffffff;
          min-height: 100vh;
        }

        .header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          color: #1a1a1a;
        }

        .subtitle {
          font-size: 1.1rem;
          color: #666;
          max-width: 700px;
          margin: 0 auto;
        }

        .upload-section {
          text-align: center;
          padding: 3rem;
          background: #f8f9fa;
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .upload-button {
          padding: 1rem 2rem;
          font-size: 1.2rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .upload-button.primary {
          background: #3182ce;
          color: white;
          border: 1px solid #2c5282;
        }

        .upload-button.primary:hover:not(:disabled) {
          background: #2c5282;
        }

        .upload-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .upload-hint {
          margin-top: 1rem;
          color: #666;
        }

        .error-message {
          padding: 1rem;
          background: #fee;
          border-left: 4px solid #f00;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .warning-message {
          padding: 1rem;
          background: #fff4e6;
          border-left: 4px solid #ff9800;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .warning-message ul {
          margin: 0.5rem 0 0 1.5rem;
        }

        .document-info-section {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .info-card {
          margin-bottom: 2rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-label {
          font-size: 0.85rem;
          color: #666;
          font-weight: 600;
        }

        .info-value {
          font-size: 1.1rem;
          color: #333;
        }

        .content-preview {
          margin: 2rem 0;
        }

        .preview-text {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          overflow-x: auto;
          font-size: 0.9rem;
          line-height: 1.5;
          max-height: 300px;
          overflow-y: auto;
        }

        .preview-note {
          text-align: center;
          color: #666;
          margin-top: 0.5rem;
          font-size: 0.9rem;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }

        .extract-button, .export-button, .simulate-button, .view-toggle-button, .reset-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .extract-button {
          background: #3182ce;
          color: white;
          border: 1px solid #2c5282;
        }

        .extract-button:hover {
          background: #2c5282;
        }

        .export-button {
          background: #10b981;
          color: white;
          border: 1px solid #059669;
        }

        .export-button:hover {
          background: #059669;
        }

        .simulate-button {
          background: #f59e0b;
          color: white;
          border: 1px solid #d97706;
        }

        .simulate-button:hover {
          background: #d97706;
        }

        .simulate-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .view-toggle-button {
          background: #3b82f6;
          color: white;
        }

        .reset-button {
          background: #6b7280;
          color: white;
        }

        .extract-button:hover, .export-button:hover, .simulate-button:hover:not(:disabled), .view-toggle-button:hover, .reset-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .simulation-results {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          margin-top: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .simulation-results h2 {
          margin-bottom: 1.5rem;
        }

        .simulation-results .summary-card {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .simulation-results .metric-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
        }

        .simulation-results .metric-label {
          font-weight: 600;
          color: #666;
        }

        .simulation-results .metric-value {
          color: #333;
          font-weight: bold;
        }

        .extraction-results {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .token-usage {
          text-align: center;
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .system-summary {
          margin-bottom: 2rem;
        }

        .summary-card {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .summary-grid {
          display: grid;
          gap: 1rem;
          margin-top: 1rem;
        }

        .summary-item {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .summary-item.full-width {
          flex-direction: column;
          align-items: flex-start;
        }

        .summary-label {
          font-weight: 600;
          color: #666;
        }

        .summary-value {
          color: #333;
        }

        .badge {
          background: #667eea;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .badge.small {
          padding: 0.2rem 0.5rem;
          font-size: 0.75rem;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .metric-card {
          background: #4a5568;
          color: white;
          padding: 1.5rem;
          border-radius: 4px;
          text-align: center;
          border: 1px solid #2d3748;
        }

        .metric-value {
          font-size: 2.5rem;
          font-weight: bold;
        }

        .metric-label {
          font-size: 0.9rem;
          margin-top: 0.5rem;
          opacity: 0.9;
        }

        .details-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .detail-card {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
        }

        .detail-card h3 {
          margin-bottom: 1rem;
        }

        .entity-list, .resource-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .entity-item, .resource-item {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          border-left: 4px solid #667eea;
        }

        .entity-header, .resource-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .entity-details, .resource-details {
          font-size: 0.9rem;
          color: #666;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .description {
          margin-top: 0.5rem;
          font-style: italic;
          color: #666;
          font-size: 0.9rem;
        }

        .missing-info-section, .assumptions-section {
          margin-top: 2rem;
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
        }

        .missing-list, .assumptions-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1rem;
        }

        .missing-item {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          border-left: 4px solid #ff9800;
        }

        .missing-item.severity-critical {
          border-left-color: #f44336;
        }

        .missing-item.severity-important {
          border-left-color: #ff9800;
        }

        .missing-item.severity-minor {
          border-left-color: #ffc107;
        }

        .missing-header {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .severity-badge {
          background: #ff9800;
          color: white;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .category {
          color: #666;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .suggestion {
          margin-top: 0.5rem;
          font-style: italic;
          color: #10b981;
          font-size: 0.9rem;
        }

        .assumption-item {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          border-left: 4px solid #3b82f6;
        }

        .assumption-header {
          margin-bottom: 0.5rem;
        }

        .rationale {
          margin-top: 0.5rem;
          color: #666;
          font-size: 0.9rem;
        }
      `}</style>
      </div>
    </ErrorBoundary>
  );
}
