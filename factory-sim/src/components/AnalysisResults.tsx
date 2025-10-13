import { FactoryAnalysis, MachineAnalysis } from '../types/analysis'
import './AnalysisResults.css'

interface AnalysisResultsProps {
  analysis: FactoryAnalysis
  cached?: boolean
  cacheAgeMinutes?: number
  onExport: () => void
  onReset: () => void
}

function MachineCard({ machine }: { machine: MachineAnalysis }) {
  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return '#dc3545' // Red
    if (utilization >= 75) return '#ffc107' // Yellow
    return '#28a745' // Green
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CNC':
        return '🔧'
      case 'Assembly':
        return '⚙️'
      case 'QualityControl':
        return '🔍'
      case 'Storage':
        return '📦'
      default:
        return '🏭'
    }
  }

  return (
    <div className={`machine-card ${machine.utilization.is_bottleneck ? 'bottleneck' : ''}`}>
      <div className="machine-header">
        <span className="machine-icon">{getTypeIcon(machine.type)}</span>
        <div>
          <h3>{machine.name}</h3>
          <span className="machine-id">{machine.id}</span>
        </div>
        {machine.utilization.is_bottleneck && (
          <span className="bottleneck-badge">⚠️ Bottleneck</span>
        )}
      </div>

      <div className="machine-details">
        <div className="detail-row">
          <span className="label">Type:</span>
          <span className="value">{machine.type}</span>
        </div>

        <div className="detail-row">
          <span className="label">Cycle Time:</span>
          <span className="value">
            {machine.cycle_time.mean.toFixed(1)} ± {machine.cycle_time.std_dev.toFixed(1)} {machine.cycle_time.unit}
          </span>
        </div>

        <div className="detail-row">
          <span className="label">Distribution:</span>
          <span className="value">{machine.cycle_time.distribution_type}</span>
        </div>

        <div className="detail-row">
          <span className="label">Utilization:</span>
          <div className="utilization-bar">
            <div
              className="utilization-fill"
              style={{
                width: `${machine.utilization.avg}%`,
                backgroundColor: getUtilizationColor(machine.utilization.avg)
              }}
            ></div>
            <span className="utilization-text">{machine.utilization.avg.toFixed(1)}%</span>
          </div>
        </div>

        <div className="detail-row">
          <span className="label">Queue (avg):</span>
          <span className="value">
            {machine.queue_pattern.avg_length.toFixed(1)} parts
            {machine.queue_pattern.is_growing && <span className="growing"> ↗ Growing</span>}
          </span>
        </div>
      </div>
    </div>
  )
}

function FlowDiagram({ flowSequence }: { flowSequence: string[] }) {
  return (
    <div className="flow-diagram">
      <h3>Production Flow</h3>
      <div className="flow-sequence">
        {flowSequence.map((machineId, index) => (
          <div key={machineId} className="flow-item">
            <div className="flow-node">{machineId}</div>
            {index < flowSequence.length - 1 && <div className="flow-arrow">→</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

function BottleneckAlert({ analysis }: { analysis: FactoryAnalysis }) {
  const getSeverityClass = (severity: string) => {
    return `severity-${severity}`
  }

  return (
    <div className={`bottleneck-alert ${getSeverityClass(analysis.bottleneck.severity)}`}>
      <div className="alert-header">
        <span className="alert-icon">⚠️</span>
        <h3>Bottleneck Detected</h3>
      </div>
      <div className="alert-body">
        <div className="alert-row">
          <span className="label">Machine:</span>
          <span className="value">{analysis.bottleneck.machine_id}</span>
        </div>
        <div className="alert-row">
          <span className="label">Utilization:</span>
          <span className="value">{analysis.bottleneck.utilization_pct.toFixed(1)}%</span>
        </div>
        <div className="alert-row">
          <span className="label">Queue Length:</span>
          <span className="value">{analysis.bottleneck.queue_length} parts</span>
        </div>
        <div className="alert-row">
          <span className="label">Severity:</span>
          <span className="value severity-badge">{analysis.bottleneck.severity.toUpperCase()}</span>
        </div>
        <div className="alert-reason">
          <strong>Reason:</strong> {analysis.bottleneck.reason}
        </div>
      </div>
    </div>
  )
}

function DataQualityPanel({ quality }: { quality: FactoryAnalysis['data_quality'] }) {
  return (
    <div className="data-quality">
      <h4>Data Quality</h4>
      <div className="quality-stats">
        <div className="stat">
          <span className="stat-label">Total Rows:</span>
          <span className="stat-value">{quality.total_rows.toLocaleString()}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Time Span:</span>
          <span className="stat-value">{quality.time_span_hours.toFixed(1)} hours</span>
        </div>
        <div className="stat">
          <span className="stat-label">Missing Data:</span>
          <span className="stat-value">{quality.missing_data_pct.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}

export function AnalysisResults({
  analysis,
  cached,
  cacheAgeMinutes,
  onExport,
  onReset
}: AnalysisResultsProps) {
  return (
    <div className="analysis-results">
      <div className="results-header">
        <h2>AI Analysis Results</h2>
        {cached && (
          <span className="cache-indicator">
            💾 Cached result from {cacheAgeMinutes} minute{cacheAgeMinutes !== 1 ? 's' : ''} ago
          </span>
        )}
      </div>

      <div className="results-actions">
        <button className="export-button" onClick={onExport}>
          📥 Export Analysis as JSON
        </button>
        <button className="reset-button" onClick={onReset}>
          🔄 Analyze Another File
        </button>
      </div>

      <div className="results-summary">
        <h3>
          Found {analysis.machines.length} machine{analysis.machines.length !== 1 ? 's' : ''}
        </h3>
      </div>

      <FlowDiagram flowSequence={analysis.flow_sequence} />

      <BottleneckAlert analysis={analysis} />

      <div className="machines-grid">
        {analysis.machines.map((machine) => (
          <MachineCard key={machine.id} machine={machine} />
        ))}
      </div>

      <DataQualityPanel quality={analysis.data_quality} />
    </div>
  )
}
