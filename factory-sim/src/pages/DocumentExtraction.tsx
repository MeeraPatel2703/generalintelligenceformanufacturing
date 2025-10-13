import { useState, useEffect } from 'react';
import { ExtractedSystem } from '../types/extraction';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { SimpleIndustrialSim } from '../components/SimpleIndustrialSim';
import { useDESModelStore } from '../store/desModelStore';
import '../styles/industrial-theme.css';

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
    setShowLiveView(true);
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
      <div className="industrial-container">
        {/* Blueprint Background */}
        <div className="blueprint-background">
          <div className="technical-icon technical-icon-1"></div>
          <div className="technical-icon technical-icon-2"></div>
          <div className="technical-icon technical-icon-3"></div>
          <div className="technical-icon technical-icon-4"></div>
        </div>

        <div className="industrial-content">
          {/* Hero Section */}
                {!documentData && !extractedSystem && (
                  <div className="industrial-hero">
                    <div className="industrial-hero__label">Building</div>
                    <h1 className="industrial-hero__title">
                      AGENTIC DES
                    </h1>
              <div className="industrial-hero__divider"></div>
              <p className="industrial-hero__subtitle">
                Transform natural language documents into executable discrete event simulations.
                Upload your operational system description and let AI extract the complete model.
              </p>
              
              <button
                className="industrial-button"
                onClick={handleUploadDocument}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Upload Document'}
              </button>
              
              <p style={{ 
                marginTop: '1rem', 
                fontSize: '0.75rem', 
                color: 'var(--color-text-tertiary)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.05em'
              }}>
                PDF • DOCX • TXT • MARKDOWN
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="industrial-card" style={{ borderColor: '#f87171' }}>
              <div className="industrial-status industrial-status--error" style={{ marginBottom: '1rem' }}>
                <span className="industrial-status__indicator"></span>
                ERROR
              </div>
              <p style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
            </div>
          )}

          {/* Warnings Display */}
          {warnings.length > 0 && (
            <div className="industrial-card" style={{ borderColor: '#fbbf24' }}>
              <div className="industrial-status industrial-status--warning" style={{ marginBottom: '1rem' }}>
                <span className="industrial-status__indicator"></span>
                WARNINGS
              </div>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0,
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem'
              }}>
                {warnings.map((warning, index) => (
                  <li key={index} style={{ marginBottom: '0.5rem' }}>→ {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Document Information Section */}
          {documentData && !extractedSystem && !extracting && (
            <>
              <div className="industrial-card">
                <div className="industrial-card__header">
                  <h2 className="industrial-card__title">Document Specifications</h2>
                  <span className="industrial-card__meta">READY FOR EXTRACTION</span>
                </div>
                
                <div className="industrial-info-grid">
                  <div className="industrial-info-item">
                    <span className="industrial-info-label">File Name</span>
                    <span className="industrial-info-value" style={{ fontSize: '1rem' }}>
                      {documentData.fileName}
                    </span>
                  </div>
                  <div className="industrial-info-item">
                    <span className="industrial-info-label">Size</span>
                    <span className="industrial-info-value">
                      {formatFileSize(documentData.fileSize)}
                    </span>
                  </div>
                  <div className="industrial-info-item">
                    <span className="industrial-info-label">Type</span>
                    <span className="industrial-info-value">
                      {documentData.fileType.toUpperCase()}
                    </span>
                  </div>
                  {documentData.metadata?.pageCount && (
                    <div className="industrial-info-item">
                      <span className="industrial-info-label">Pages</span>
                      <span className="industrial-info-value">
                        {documentData.metadata.pageCount}
                      </span>
                    </div>
                  )}
                  <div className="industrial-info-item">
                    <span className="industrial-info-label">Characters</span>
                    <span className="industrial-info-value">
                      {documentData.content.length.toLocaleString()}
                    </span>
                  </div>
                  {documentData.metadata?.wordCount && (
                    <div className="industrial-info-item">
                      <span className="industrial-info-label">Words</span>
                      <span className="industrial-info-value">
                        {documentData.metadata.wordCount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="industrial-card">
                <div className="industrial-card__header">
                  <h2 className="industrial-card__title">Content Preview</h2>
                  <span className="industrial-card__meta">
                    1000 / {documentData.content.length.toLocaleString()} CHARS
                  </span>
                </div>
                <pre className="industrial-code-block">
{documentData.content.substring(0, 1000)}{documentData.content.length > 1000 ? '...' : ''}
                </pre>
                {documentData.content.length > 1000 && (
                  <div className="industrial-status industrial-status--success" style={{ marginTop: '1rem' }}>
                    <span className="industrial-status__indicator"></span>
                    FULL DOCUMENT WILL BE PROCESSED
                  </div>
                )}
              </div>

              <div className="industrial-action-bar">
                <button className="industrial-button" onClick={handleExtractSystem}>
                  Extract DES Model
                </button>
                <button className="industrial-button industrial-button--secondary" onClick={handleReset}>
                  Upload Different Document
                </button>
              </div>
            </>
          )}

          {/* Extracting State */}
          {extracting && (
            <div className="industrial-loader">
              <div className="industrial-loader__spinner"></div>
              <span className="industrial-loader__text">
                AI Extracting System Configuration
              </span>
              <span className="text-tertiary text-mono" style={{ fontSize: '0.75rem' }}>
                Analyzing document structure and operational flows...
              </span>
            </div>
          )}

          {/* Extraction Results */}
          {extractedSystem && !extracting && !error && (
            <>
              {/* Success Header */}
              <div className="industrial-card">
                <div className="industrial-status industrial-status--success" style={{ marginBottom: '1rem' }}>
                  <span className="industrial-status__indicator"></span>
                  EXTRACTION COMPLETE
                </div>
                
                {tokensUsed && (
                  <p className="text-mono text-tertiary" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                    {tokensUsed.input.toLocaleString()} INPUT TOKENS • {tokensUsed.output.toLocaleString()} OUTPUT TOKENS
                  </p>
                )}

                <div className="industrial-action-bar">
                  <button
                    className="industrial-button"
                    onClick={() => {
                      setDESSystem(extractedSystem);
                      window.location.hash = '/editable-des';
                    }}
                  >
                    Edit Model in DES Editor
                  </button>
                  <button className="industrial-button industrial-button--secondary" onClick={handleExportSystem}>
                    Export JSON
                  </button>
                  {simulationResults && (
                    <button
                      className="industrial-button industrial-button--secondary"
                      onClick={() => setShowLiveView(!showLiveView)}
                    >
                      {showLiveView ? 'Show Results' : 'Show Simulation'}
                    </button>
                  )}
                  <button className="industrial-button industrial-button--secondary" onClick={handleReset}>
                    Upload New Document
                  </button>
                </div>
              </div>

              {/* System Overview */}
              <div className="industrial-card">
                <div className="industrial-card__header">
                  <h2 className="industrial-card__title">System Overview</h2>
                  <span className="industrial-card__meta">{extractedSystem.systemType?.toUpperCase()}</span>
                </div>
                
                <div className="industrial-info-grid">
                  <div className="industrial-info-item">
                    <span className="industrial-info-label">System Name</span>
                    <span className="industrial-info-value" style={{ fontSize: '1rem' }}>
                      {extractedSystem.systemName}
                    </span>
                  </div>
                  <div className="industrial-info-item">
                    <span className="industrial-info-label">Entities</span>
                    <span className="industrial-info-value">
                      {extractedSystem.entities?.length || 0}
                    </span>
                  </div>
                  <div className="industrial-info-item">
                    <span className="industrial-info-label">Resources</span>
                    <span className="industrial-info-value">
                      {extractedSystem.resources?.length || 0}
                    </span>
                  </div>
                  <div className="industrial-info-item">
                    <span className="industrial-info-label">Processes</span>
                    <span className="industrial-info-value">
                      {extractedSystem.processes?.length || 0}
                    </span>
                  </div>
                </div>

                {extractedSystem.description && (
                  <p className="text-secondary" style={{ marginTop: '1rem', lineHeight: '1.6' }}>
                    {extractedSystem.description}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Close industrial-content */}
        </div>
        
        {/* Close industrial-container */}
      </div>
        
      {/* Simulation Component - Rendered outside blueprint container for clean display */}
      {extractedSystem && showLiveView && (
        <SimpleIndustrialSim system={extractedSystem} />
      )}
    </ErrorBoundary>
  );
}
