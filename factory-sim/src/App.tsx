import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import { FactoryAnalysis } from './types/analysis'
import { SimulationResults as SimResults } from './types/simulation'
import { LoadingSpinner } from './components/LoadingSpinner'
import { AnalysisResults } from './components/AnalysisResults'
import SimulationRunner from './components/SimulationRunner'
import SimulationResults from './components/SimulationResults'
import { DocumentExtraction } from './pages/DocumentExtraction'
import { IntegratedSimulation } from './pages/IntegratedSimulation'
import { useDESModelStore } from './store/desModelStore'
import './index.css'

interface CSVData {
  fileName: string
  fileSize: number
  filePath: string
  headers: string[]
  rows: string[][]
  totalRows: number
  rawContent: string
}

function App() {
  const [mode, setMode] = useState<'analysis' | 'builder' | 'extraction' | 'simulation'>('extraction')
  const { extractedSystem } = useDESModelStore()

  // Check URL hash for routing
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash === '/simulation') {
      setMode('simulation');
    } else if (hash === '') {
      setMode('extraction');
    }
  }, []);

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === '/simulation') {
        setMode('simulation');
      } else if (hash === '') {
        setMode('extraction');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const [csvData, setCsvData] = useState<CSVData | null>(null)
  const [analysis, setAnalysis] = useState<FactoryAnalysis | null>(null)
  const [simResults, setSimResults] = useState<SimResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cached, setCached] = useState(false)
  const [cacheAgeMinutes, setCacheAgeMinutes] = useState<number>(0)

  const handleUploadClick = async () => {
    try {
      setLoading(true)
      setError(null)
      setAnalysis(null)

      if (!window.electron) {
        throw new Error('window.electron is not defined - preload script may not have loaded')
      }

      const dialogResult = await window.electron.openFileDialog()

      if (dialogResult.canceled || !dialogResult.filePath) {
        setLoading(false)
        return
      }

      const fileResult = await window.electron.readFile(dialogResult.filePath)

      if (!fileResult.success || !fileResult.content) {
        setError(fileResult.error || 'Failed to read file')
        setLoading(false)
        return
      }

      const parseResult = Papa.parse<string[]>(fileResult.content, {
        skipEmptyLines: true
      })

      if (parseResult.errors.length > 0) {
        setError(`CSV parsing error: ${parseResult.errors[0].message}`)
        setLoading(false)
        return
      }

      const data = parseResult.data
      if (data.length === 0) {
        setError('CSV file is empty')
        setLoading(false)
        return
      }

      const headers = data[0]
      const rows = data.slice(1)

      setCsvData({
        fileName: fileResult.name || 'Unknown',
        fileSize: fileResult.size || 0,
        filePath: fileResult.path || '',
        headers,
        rows,
        totalRows: rows.length,
        rawContent: fileResult.content
      })

      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      setLoading(false)
    }
  }

  const handleAnalyzeClick = async () => {
    if (!csvData || !window.electron) return

    try {
      setAnalyzing(true)
      setError(null)

      console.log('[App] Starting AI analysis...')

      const result = await window.electron.analyzeFactoryData(csvData.rawContent)

      if (!result.success) {
        throw new Error(result.error || 'AI analysis failed')
      }

      console.log('[App] Analysis complete:', result.analysis)

      setAnalysis(result.analysis || null)
      setCached(result.cached || false)
      setCacheAgeMinutes(result.cache_age_minutes || 0)
      setAnalyzing(false)
    } catch (err) {
      console.error('[App] Analysis error:', err)
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setAnalyzing(false)
    }
  }

  const handleExportAnalysis = () => {
    if (!analysis) return

    const json = JSON.stringify(analysis, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `factory-analysis-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setCsvData(null)
    setAnalysis(null)
    setSimResults(null)
    setError(null)
    setCached(false)
    setCacheAgeMinutes(0)
  }

  const handleSimulationResults = (results: SimResults) => {
    setSimResults(results)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  // Mode switcher component - SIMPLIFIED!
  const ModeSwitcher = () => (
    <div className="mode-switcher">
      <button 
        onClick={() => { setMode('extraction'); window.location.hash = ''; }} 
        className={`mode-btn ${mode === 'extraction' ? 'active' : ''}`}
      >
        📄 UPLOAD
      </button>
      {extractedSystem && (
        <button 
          onClick={() => { setMode('simulation'); window.location.hash = '/simulation'; }} 
          className={`mode-btn ${mode === 'simulation' ? 'active' : ''}`}
        >
          ▶️ SIMULATION
        </button>
      )}
    </div>
  );

  const modeSwitcherStyles = `
    .mode-switcher {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 1000;
      display: flex;
      gap: 0.5rem;
      background: var(--color-bg-secondary, #111);
      padding: 0.5rem;
      border: 1px solid var(--color-border, #2a2a2a);
    }

    .mode-btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--color-border-light, #404040);
      background: transparent;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
      font-size: 0.75rem;
      color: var(--color-text-secondary, #a0a0a0);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-family: var(--font-mono, monospace);
    }

    .mode-btn:hover {
      background: var(--color-bg-tertiary, #1a1a1a);
      color: var(--color-text-primary, #fff);
      border-color: var(--color-text-primary, #fff);
    }

    .mode-btn.active {
      background: var(--color-text-primary, #fff);
      color: var(--color-bg-primary, #0a0a0a);
      border-color: var(--color-text-primary, #fff);
    }
  `;

  // Integrated Simulation mode - SIMPLIFIED!
  if (mode === 'simulation') {
    if (!extractedSystem) {
      return (
        <div className="app">
          <ModeSwitcher />
          <style>{modeSwitcherStyles}</style>
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            backgroundColor: 'var(--color-bg-primary)', 
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div className="industrial-card" style={{ padding: '60px', maxWidth: '600px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
              <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '20px', fontSize: '1.5rem' }}>
                No System Loaded
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '30px', fontSize: '1rem' }}>
                Please upload a PDF document first to extract your system.
              </p>
              <button 
                onClick={() => { setMode('extraction'); window.location.hash = ''; }}
                className="industrial-button industrial-button--primary"
              >
                📄 UPLOAD DOCUMENT
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="app">
        <ModeSwitcher />
        <IntegratedSimulation system={extractedSystem} />
        <style>{modeSwitcherStyles}</style>
      </div>
    );
  }

  // Document extraction mode
  if (mode === 'extraction') {
    return (
      <div className="app">
        <ModeSwitcher />
        <DocumentExtraction />
        <style>{modeSwitcherStyles}</style>
      </div>
    );
  }

  // CSV Analysis mode
  return (
    <div className="industrial-container">
      <div className="blueprint-background"></div>
      <ModeSwitcher />
      <style>{modeSwitcherStyles}</style>
      <div className="industrial-content">
        <div className="industrial-hero">
          <div className="industrial-hero__label">Data Analysis</div>
          <h1 className="industrial-hero__title">CSV ANALYSIS</h1>
          <div className="industrial-hero__divider"></div>
          <p className="industrial-hero__subtitle">
            Upload DCS/SCADA export CSV files for AI-powered factory data analysis
          </p>
        </div>

        {!csvData && (
          <div style={{ textAlign: 'center' }}>
            <button
              className="industrial-button"
              onClick={handleUploadClick}
              disabled={loading}
            >
              {loading ? 'Loading file...' : 'Upload CSV'}
            </button>
            <p style={{
              marginTop: '1rem',
              fontSize: '0.75rem',
              color: 'var(--color-text-tertiary)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.05em'
            }}>
              CSV • DCS EXPORT • SCADA DATA
            </p>
          </div>
        )}

        {error && (
          <div className="industrial-card" style={{ borderColor: '#f87171' }}>
            <div className="industrial-status industrial-status--error" style={{ marginBottom: '1rem' }}>
              <span className="industrial-status__indicator"></span>
              ERROR
            </div>
            <p style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
          </div>
        )}

        {csvData && !analysis && !analyzing && (
          <>
            <div className="industrial-card">
              <div className="industrial-card__header">
                <h2 className="industrial-card__title">File Specifications</h2>
                <span className="industrial-card__meta">READY FOR ANALYSIS</span>
              </div>

              <div className="industrial-info-grid">
                <div className="industrial-info-item">
                  <span className="industrial-info-label">File Name</span>
                  <span className="industrial-info-value" style={{ fontSize: '1rem' }}>
                    {csvData.fileName}
                  </span>
                </div>
                <div className="industrial-info-item">
                  <span className="industrial-info-label">File Size</span>
                  <span className="industrial-info-value">
                    {formatFileSize(csvData.fileSize)}
                  </span>
                </div>
                <div className="industrial-info-item">
                  <span className="industrial-info-label">Total Rows</span>
                  <span className="industrial-info-value">
                    {csvData.totalRows.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="industrial-action-bar">
              <button className="industrial-button" onClick={handleAnalyzeClick}>
                Analyze with AI
              </button>
              <button className="industrial-button industrial-button--secondary" onClick={handleReset}>
                Upload Different File
              </button>
            </div>

            <div className="industrial-card">
              <div className="industrial-card__header">
                <h2 className="industrial-card__title">Data Preview</h2>
                <span className="industrial-card__meta">
                  SHOWING 10 OF {csvData.totalRows.toLocaleString()} ROWS
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.875rem'
                }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>#</th>
                      {csvData.headers.map((header, index) => (
                        <th key={index} style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.rows.slice(0, 10).map((row, rowIndex) => (
                      <tr key={rowIndex} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.75rem', color: 'var(--color-text-tertiary)' }}>{rowIndex + 1}</td>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} style={{ padding: '0.75rem', color: 'var(--color-text-secondary)' }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {analyzing && (
          <LoadingSpinner message={`ANALYZING ${csvData?.totalRows.toLocaleString()} ROWS...`} />
        )}

        {analysis && !analyzing && (
          <>
            <AnalysisResults
              analysis={analysis}
              cached={cached}
              cacheAgeMinutes={cacheAgeMinutes}
              onExport={handleExportAnalysis}
              onReset={handleReset}
            />

            {/* Simulation Section */}
            <SimulationRunner
              analysis={analysis}
              onResults={handleSimulationResults}
            />

            {simResults && (
              <SimulationResults results={simResults} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App
