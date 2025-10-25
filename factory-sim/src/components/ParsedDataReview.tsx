import React, { useState } from 'react';
import { ProcessGraph, Station, Entity, Arrival, Route, Distribution } from '../types/processGraph';
import { ValidationResult } from '../validation/processGraphSchema';
import ParsedDataValidator from './ParsedDataValidator';

interface ParsedDataReviewProps {
  initialGraph: ProcessGraph;
  validation: ValidationResult;
  onApprove: (editedGraph: ProcessGraph) => void;
  onReject: () => void;
}

type EditSection = 'entities' | 'arrivals' | 'stations' | 'routes' | 'resources' | 'calendars' | 'runConfig' | 'metadata';

const ParsedDataReview: React.FC<ParsedDataReviewProps> = ({
  initialGraph,
  validation,
  onApprove,
  onReject
}) => {
  const [graph, setGraph] = useState<ProcessGraph>(JSON.parse(JSON.stringify(initialGraph)));
  const [activeSection, setActiveSection] = useState<EditSection>('stations');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Update station field
  const updateStation = (index: number, field: keyof Station, value: any) => {
    const newGraph = { ...graph };
    newGraph.stations[index] = { ...newGraph.stations[index], [field]: value };
    setGraph(newGraph);
  };

  // Update distribution parameters
  const updateDistribution = (
    stationIndex: number,
    field: 'processTime',
    paramKey: string,
    value: number
  ) => {
    const newGraph = { ...graph };
    const station = newGraph.stations[stationIndex];
    if (station[field]) {
      const dist = station[field] as Distribution;
      dist.params = { ...dist.params, [paramKey]: value };
      setGraph(newGraph);
    }
  };

  // Add new station
  const addStation = () => {
    const newStation: Station = {
      id: `STN_${graph.stations.length + 1}`,
      kind: 'machine',
      count: 1,
      capacity: 1,
      queue: 'FIFO',
      processTime: {
        type: 'constant',
        params: { value: 1 },
        units: 'minutes'
      }
    };
    setGraph({ ...graph, stations: [...graph.stations, newStation] });
  };

  // Delete station
  const deleteStation = (index: number) => {
    const newGraph = { ...graph };
    newGraph.stations.splice(index, 1);
    setGraph(newGraph);
  };

  // Update route
  const updateRoute = (index: number, field: keyof Route, value: any) => {
    const newGraph = { ...graph };
    newGraph.routes[index] = { ...newGraph.routes[index], [field]: value };
    setGraph(newGraph);
  };

  // Add route
  const addRoute = () => {
    const newRoute: Route = {
      from: graph.stations[0]?.id || '',
      to: graph.stations[1]?.id || '',
      probability: 1.0
    };
    setGraph({ ...graph, routes: [...graph.routes, newRoute] });
  };

  // Delete route
  const deleteRoute = (index: number) => {
    const newGraph = { ...graph };
    newGraph.routes.splice(index, 1);
    setGraph(newGraph);
  };

  // Update entity
  const updateEntity = (index: number, field: keyof Entity, value: any) => {
    const newGraph = { ...graph };
    newGraph.entities[index] = { ...newGraph.entities[index], [field]: value };
    setGraph(newGraph);
  };

  // Update arrival
  const updateArrival = (index: number, value: Arrival) => {
    const newGraph = { ...graph };
    newGraph.arrivals[index] = value;
    setGraph(newGraph);
  };

  // Update run config
  const updateRunConfig = (field: string, value: any) => {
    const newGraph = { ...graph };
    newGraph.runConfig = { ...newGraph.runConfig, [field]: value };
    setGraph(newGraph);
  };

  // Render distribution editor
  const renderDistributionEditor = (
    dist: Distribution,
    stationIndex: number,
    field: 'processTime'
  ) => {
    return (
      <div className="distribution-editor">
        <div className="dist-type">
          <strong>Type:</strong> {dist.type}
        </div>
        <div className="dist-params">
          {Object.entries(dist.params).map(([key, value]) => (
            <div key={key} className="param-row">
              <label>{key}:</label>
              <input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) =>
                  updateDistribution(stationIndex, field, key, parseFloat(e.target.value))
                }
              />
            </div>
          ))}
        </div>
        <div className="dist-units">
          <strong>Units:</strong> {dist.units}
        </div>
      </div>
    );
  };

  // Summary stats
  const summaryStats = {
    entities: graph.entities.length,
    arrivals: graph.arrivals.length,
    stations: graph.stations.length,
    routes: graph.routes.length,
    resources: graph.resources?.length || 0,
    calendars: graph.calendars?.length || 0,
    errors: validation.errors.length,
    warnings: validation.warnings.length
  };

  return (
    <div className="parsed-data-review">
      <div className="review-header">
        <h2>Review Parsed Simulation Data</h2>
        <p className="subtitle">
          Review and edit the extracted simulation parameters before running
        </p>
      </div>

      {/* Live Validation */}
      <ParsedDataValidator graph={graph} onAutoFix={setGraph} />

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card" onClick={() => setActiveSection('entities')}>
          <div className="card-label">Entities</div>
          <div className="card-value">{summaryStats.entities}</div>
        </div>
        <div className="summary-card" onClick={() => setActiveSection('arrivals')}>
          <div className="card-label">Arrivals</div>
          <div className="card-value">{summaryStats.arrivals}</div>
        </div>
        <div className="summary-card" onClick={() => setActiveSection('stations')}>
          <div className="card-label">Stations</div>
          <div className="card-value">{summaryStats.stations}</div>
        </div>
        <div className="summary-card" onClick={() => setActiveSection('routes')}>
          <div className="card-label">Routes</div>
          <div className="card-value">{summaryStats.routes}</div>
        </div>
        <div className="summary-card" onClick={() => setActiveSection('resources')}>
          <div className="card-label">Resources</div>
          <div className="card-value">{summaryStats.resources}</div>
        </div>
        <div className="summary-card" onClick={() => setActiveSection('runConfig')}>
          <div className="card-label">Run Config</div>
          <div className="card-value">✓</div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="editor-container">
        {/* Stations Editor */}
        {activeSection === 'stations' && (
          <div className="section-editor">
            <div className="section-header">
              <h3>Stations / Machines ({graph.stations.length})</h3>
              <button className="add-button" onClick={addStation}>
                + Add Station
              </button>
            </div>

            {graph.stations.map((station, idx) => (
              <div key={station.id} className="item-card">
                <div className="item-header" onClick={() => toggleExpand(station.id)}>
                  <span className="expand-icon">
                    {expandedItems.has(station.id) ? '▼' : '▶'}
                  </span>
                  <span className="item-title">
                    {station.id} - {station.kind}
                  </span>
                  <button
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteStation(idx);
                    }}
                  >
                    Delete
                  </button>
                </div>

                {expandedItems.has(station.id) && (
                  <div className="item-details">
                    <div className="detail-row">
                      <label>ID:</label>
                      <input
                        type="text"
                        value={station.id}
                        onChange={(e) => updateStation(idx, 'id', e.target.value)}
                      />
                    </div>

                    <div className="detail-row">
                      <label>Kind:</label>
                      <select
                        value={station.kind}
                        onChange={(e) => updateStation(idx, 'kind', e.target.value)}
                      >
                        <option value="machine">Machine</option>
                        <option value="buffer">Buffer</option>
                        <option value="source">Source</option>
                        <option value="sink">Sink</option>
                        <option value="assembly">Assembly</option>
                        <option value="split">Split</option>
                      </select>
                    </div>

                    <div className="detail-row">
                      <label>Count (Parallel Servers):</label>
                      <input
                        type="number"
                        min="1"
                        value={station.count}
                        onChange={(e) => updateStation(idx, 'count', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="detail-row">
                      <label>Capacity:</label>
                      <input
                        type="number"
                        min="1"
                        value={station.capacity}
                        onChange={(e) => updateStation(idx, 'capacity', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="detail-row">
                      <label>Queue Discipline:</label>
                      <select
                        value={station.queue}
                        onChange={(e) => updateStation(idx, 'queue', e.target.value)}
                      >
                        <option value="FIFO">FIFO</option>
                        <option value="LIFO">LIFO</option>
                        <option value="SPT">SPT (Shortest Processing Time)</option>
                        <option value="LPT">LPT (Longest Processing Time)</option>
                        <option value="EDD">EDD (Earliest Due Date)</option>
                        <option value="CR">CR (Critical Ratio)</option>
                        <option value="SLACK">SLACK</option>
                        <option value="PRIORITY">PRIORITY</option>
                      </select>
                    </div>

                    {station.processTime && (
                      <div className="detail-section">
                        <h4>Process Time Distribution</h4>
                        {renderDistributionEditor(station.processTime, idx, 'processTime')}
                      </div>
                    )}

                    {station.scrap_probability !== undefined && (
                      <div className="detail-row">
                        <label>Scrap Probability:</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={station.scrap_probability}
                          onChange={(e) =>
                            updateStation(idx, 'scrap_probability', parseFloat(e.target.value))
                          }
                        />
                      </div>
                    )}

                    {station.yield !== undefined && (
                      <div className="detail-row">
                        <label>Yield:</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={station.yield}
                          onChange={(e) =>
                            updateStation(idx, 'yield', parseFloat(e.target.value))
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Routes Editor */}
        {activeSection === 'routes' && (
          <div className="section-editor">
            <div className="section-header">
              <h3>Routes ({graph.routes.length})</h3>
              <button className="add-button" onClick={addRoute}>
                + Add Route
              </button>
            </div>

            {graph.routes.map((route, idx) => (
              <div key={idx} className="item-card">
                <div className="item-header">
                  <span className="item-title">
                    {route.from} → {route.to}
                  </span>
                  <button
                    className="delete-button"
                    onClick={() => deleteRoute(idx)}
                  >
                    Delete
                  </button>
                </div>

                <div className="item-details">
                  <div className="detail-row">
                    <label>From:</label>
                    <select
                      value={route.from}
                      onChange={(e) => updateRoute(idx, 'from', e.target.value)}
                    >
                      {graph.stations.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="detail-row">
                    <label>To:</label>
                    <select
                      value={route.to}
                      onChange={(e) => updateRoute(idx, 'to', e.target.value)}
                    >
                      {graph.stations.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="detail-row">
                    <label>Probability:</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={route.probability}
                      onChange={(e) =>
                        updateRoute(idx, 'probability', parseFloat(e.target.value))
                      }
                    />
                  </div>

                  {route.distance_ft !== undefined && (
                    <div className="detail-row">
                      <label>Distance (ft):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={route.distance_ft}
                        onChange={(e) =>
                          updateRoute(idx, 'distance_ft', parseFloat(e.target.value))
                        }
                      />
                    </div>
                  )}

                  {route.speed_ftps !== undefined && (
                    <div className="detail-row">
                      <label>Speed (ft/s):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={route.speed_ftps}
                        onChange={(e) =>
                          updateRoute(idx, 'speed_ftps', parseFloat(e.target.value))
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Entities Editor */}
        {activeSection === 'entities' && (
          <div className="section-editor">
            <div className="section-header">
              <h3>Entities ({graph.entities.length})</h3>
            </div>

            {graph.entities.map((entity, idx) => (
              <div key={entity.id} className="item-card">
                <div className="item-header">
                  <span className="item-title">{entity.id} - {entity.class}</span>
                </div>

                <div className="item-details">
                  <div className="detail-row">
                    <label>ID:</label>
                    <input
                      type="text"
                      value={entity.id}
                      onChange={(e) => updateEntity(idx, 'id', e.target.value)}
                    />
                  </div>

                  <div className="detail-row">
                    <label>Class:</label>
                    <input
                      type="text"
                      value={entity.class}
                      onChange={(e) => updateEntity(idx, 'class', e.target.value)}
                    />
                  </div>

                  <div className="detail-row">
                    <label>Batch Size:</label>
                    <input
                      type="number"
                      min="1"
                      value={entity.batchSize}
                      onChange={(e) => updateEntity(idx, 'batchSize', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="detail-row">
                    <label>Priority:</label>
                    <input
                      type="number"
                      value={entity.priority}
                      onChange={(e) => updateEntity(idx, 'priority', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Run Config Editor */}
        {activeSection === 'runConfig' && (
          <div className="section-editor">
            <div className="section-header">
              <h3>Run Configuration</h3>
            </div>

            <div className="config-card">
              <div className="detail-row">
                <label>Run Length (minutes):</label>
                <input
                  type="number"
                  min="1"
                  value={graph.runConfig.runLength_min}
                  onChange={(e) => updateRunConfig('runLength_min', parseInt(e.target.value))}
                />
              </div>

              <div className="detail-row">
                <label>Warmup Period (minutes):</label>
                <input
                  type="number"
                  min="0"
                  value={graph.runConfig.warmup_min}
                  onChange={(e) => updateRunConfig('warmup_min', parseInt(e.target.value))}
                />
              </div>

              <div className="detail-row">
                <label>Number of Replications:</label>
                <input
                  type="number"
                  min="1"
                  value={graph.runConfig.replications}
                  onChange={(e) => updateRunConfig('replications', parseInt(e.target.value))}
                />
              </div>

              <div className="detail-row">
                <label>Confidence Level:</label>
                <select
                  value={graph.runConfig.confidence}
                  onChange={(e) => updateRunConfig('confidence', parseInt(e.target.value))}
                >
                  <option value={80}>80%</option>
                  <option value={90}>90%</option>
                  <option value={95}>95%</option>
                  <option value={99}>99%</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Metadata Section */}
        {activeSection === 'metadata' && (
          <div className="section-editor">
            <div className="section-header">
              <h3>Metadata</h3>
            </div>

            <div className="config-card">
              <div className="detail-row">
                <label>Model ID:</label>
                <span>{graph.metadata.model_id}</span>
              </div>

              <div className="detail-row">
                <label>Version:</label>
                <span>{graph.metadata.version}</span>
              </div>

              {graph.metadata.description && (
                <div className="detail-row">
                  <label>Description:</label>
                  <span>{graph.metadata.description}</span>
                </div>
              )}

              {graph.metadata.assumptions && graph.metadata.assumptions.length > 0 && (
                <div className="detail-section">
                  <h4>Assumptions Made:</h4>
                  <ul>
                    {graph.metadata.assumptions.map((assumption, idx) => (
                      <li key={idx}>{assumption}</li>
                    ))}
                  </ul>
                </div>
              )}

              {graph.metadata.missing && graph.metadata.missing.length > 0 && (
                <div className="detail-section">
                  <h4>Missing Fields:</h4>
                  <ul>
                    {graph.metadata.missing.map((field, idx) => (
                      <li key={idx}>{field}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="reject-button" onClick={onReject}>
          Reject & Re-Parse
        </button>
        <button className="approve-button" onClick={() => onApprove(graph)}>
          Approve & Continue to Simulation
        </button>
      </div>

      <style>{`
        .parsed-data-review {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
          background: #1a202c;
          color: white;
          min-height: 100vh;
        }

        .review-header h2 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
        }

        .subtitle {
          opacity: 0.8;
          margin: 0 0 2rem 0;
        }

        .validation-summary {
          background: rgba(255, 255, 255, 0.05);
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          border: 2px solid;
        }

        .validation-summary.valid {
          border-color: #48bb78;
        }

        .validation-summary.invalid {
          border-color: #f56565;
        }

        .validation-status {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .status-icon {
          font-size: 1.5rem;
        }

        .validation-errors, .validation-warnings {
          margin-top: 1rem;
        }

        .error-item, .warning-item {
          padding: 0.5rem;
          margin: 0.5rem 0;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .error-path, .warning-path {
          font-weight: 600;
          color: #f6ad55;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .summary-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 1.5rem;
          border-radius: 8px;
          text-align: center;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .summary-card:hover {
          transform: translateY(-4px);
        }

        .card-label {
          font-size: 0.9rem;
          opacity: 0.9;
          margin-bottom: 0.5rem;
        }

        .card-value {
          font-size: 2rem;
          font-weight: 700;
        }

        .editor-container {
          background: #2d3748;
          border-radius: 8px;
          padding: 2rem;
          margin-bottom: 2rem;
          min-height: 400px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        }

        .section-header h3 {
          margin: 0;
          font-size: 1.5rem;
        }

        .add-button {
          background: #48bb78;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }

        .add-button:hover {
          background: #38a169;
        }

        .item-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .item-header {
          display: flex;
          align-items: center;
          padding: 1rem;
          cursor: pointer;
          gap: 0.75rem;
        }

        .expand-icon {
          font-size: 0.8rem;
        }

        .item-title {
          flex: 1;
          font-weight: 600;
        }

        .delete-button {
          background: #f56565;
          color: white;
          border: none;
          padding: 0.4rem 0.8rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .delete-button:hover {
          background: #c53030;
        }

        .item-details {
          padding: 0 1rem 1rem 1rem;
        }

        .detail-row {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1rem;
        }

        .detail-row label {
          font-weight: 600;
        }

        .detail-row input,
        .detail-row select {
          padding: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.2);
          color: white;
          font-size: 1rem;
        }

        .detail-section {
          margin: 1.5rem 0;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .detail-section h4 {
          margin-top: 0;
        }

        .distribution-editor {
          background: rgba(0, 0, 0, 0.1);
          padding: 1rem;
          border-radius: 4px;
        }

        .dist-type, .dist-units {
          margin-bottom: 0.75rem;
        }

        .dist-params {
          display: grid;
          gap: 0.75rem;
        }

        .param-row {
          display: grid;
          grid-template-columns: 100px 1fr;
          gap: 0.5rem;
          align-items: center;
        }

        .param-row input {
          padding: 0.4rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.2);
          color: white;
        }

        .config-card {
          background: rgba(255, 255, 255, 0.05);
          padding: 1.5rem;
          border-radius: 6px;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .reject-button {
          background: #718096;
          color: white;
          border: none;
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 4px;
          cursor: pointer;
        }

        .reject-button:hover {
          background: #4a5568;
        }

        .approve-button {
          background: #48bb78;
          color: white;
          border: none;
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 4px;
          cursor: pointer;
        }

        .approve-button:hover {
          background: #38a169;
        }
      `}</style>
    </div>
  );
};

export default ParsedDataReview;
