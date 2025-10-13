import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import { FactoryAnalysis } from './types/analysis'
import { SimulationResults as SimResults } from './types/simulation'
import { LoadingSpinner } from './components/LoadingSpinner'
import { AnalysisResults } from './components/AnalysisResults'
import SimulationRunner from './components/SimulationRunner'
import SimulationResults from './components/SimulationResults'
import { VisualBuilder } from './pages/VisualBuilder'
import { DocumentExtraction } from './pages/DocumentExtraction'
import { EditableDES } from './pages/EditableDES'
import { SimpleDESDemo } from './components/SimpleDESDemo'
// SimulationTest removed - Electron only now
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
  const [mode, setMode] = useState<'analysis' | 'builder' | 'extraction' | 'editable-des' | 'simple-demo'>('simple-demo')

  // Check URL hash for routing
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash === '/editable-des') {
      setMode('editable-des');
    } else if (hash === '') {
      setMode('extraction');
    }
  }, []);

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === '/editable-des') {
        setMode('editable-des');
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

  // Mode switcher component
  const ModeSwitcher = () => (
    <div className="mode-switcher">
      <button onClick={() => { setMode('simple-demo'); window.location.hash = ''; }} className={`mode-btn ${mode === 'simple-demo' ? 'active' : ''}`}>
        🎯 Simple Demo
      </button>
      <button onClick={() => { setMode('extraction'); window.location.hash = ''; }} className={`mode-btn ${mode === 'extraction' ? 'active' : ''}`}>
        Document to DES
      </button>
      <button onClick={() => { setMode('editable-des'); window.location.hash = '/editable-des'; }} className={`mode-btn ${mode === 'editable-des' ? 'active' : ''}`}>
        Editable DES
      </button>
      <button onClick={() => { setMode('analysis'); window.location.hash = ''; }} className={`mode-btn ${mode === 'analysis' ? 'active' : ''}`}>
        CSV Analysis
      </button>
      <button onClick={() => { setMode('builder'); window.location.hash = ''; }} className={`mode-btn ${mode === 'builder' ? 'active' : ''}`}>
        Visual Builder
      </button>
    </div>
  );

  const modeSwitcherStyles = `
    .mode-switcher {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 1000;
      display: flex;
      gap: 0.5rem;
      background: white;
      padding: 0.5rem;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    .mode-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #cbd5e0;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s ease;
      font-size: 0.9rem;
    }

    .mode-btn:hover {
      background: #edf2f7;
    }

    .mode-btn.active {
      background: #3182ce;
      color: white;
      border-color: #3182ce;
    }
  `;

  // Simple demo mode - MINIMAL WORKING EXAMPLE
  if (mode === 'simple-demo') {
    return (
      <div className="app">
        <ModeSwitcher />
        <SimpleDESDemo />
        <style>{modeSwitcherStyles}</style>
      </div>
    );
  }

  // Editable DES mode
  if (mode === 'editable-des') {
    return (
      <div className="app">
        <EditableDES />
      </div>
    );
  }

  // Document extraction mode
  if (mode === 'extraction') {
    return (
      <div className="app" style={{ background: '#f5f5f5', minHeight: '100vh' }}>
        <ModeSwitcher />
        <DocumentExtraction />
        <style>{modeSwitcherStyles}</style>
      </div>
    );
  }

  // Visual builder mode
  if (mode === 'builder') {
    return (
      <div className="app">
        <ModeSwitcher />
        <VisualBuilder />
        <style>{modeSwitcherStyles}</style>
      </div>
    );
  }

  // CSV Analysis mode
  return (
    <div className="app">
      <ModeSwitcher />
      <style>{modeSwitcherStyles}</style>
      <div className="container">
        <h1>Factory Simulation - AI Data Analysis</h1>

        {!csvData && (
          <div className="upload-section">
            <button
              className="upload-button"
              onClick={handleUploadClick}
              disabled={loading}
            >
              {loading ? 'Loading file...' : 'Upload CSV'}
            </button>
            <p className="upload-hint">Upload a DCS/SCADA export CSV to analyze factory data</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {csvData && !analysis && !analyzing && (
          <div className="data-section">
            <div className="file-info">
              <h2>File Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Name:</span>
                  <span className="info-value">{csvData.fileName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Size:</span>
                  <span className="info-value">{formatFileSize(csvData.fileSize)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Total Rows:</span>
                  <span className="info-value">{csvData.totalRows.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="analyze-section">
              <button className="analyze-button" onClick={handleAnalyzeClick}>
                Analyze with AI
              </button>
              <button className="reset-button" onClick={handleReset}>
                Upload Different File
              </button>
            </div>

            <div className="table-section">
              <h2>Data Preview (First 10 Rows)</h2>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="row-number">#</th>
                      {csvData.headers.map((header, index) => (
                        <th key={index}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.rows.slice(0, 10).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="row-number">{rowIndex + 1}</td>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvData.totalRows > 10 && (
                <p className="preview-note">
                  Showing 10 of {csvData.totalRows.toLocaleString()} rows
                </p>
              )}
            </div>
          </div>
        )}

        {analyzing && (
          <LoadingSpinner message={`AI analyzing ${csvData?.totalRows.toLocaleString()} rows...`} />
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
