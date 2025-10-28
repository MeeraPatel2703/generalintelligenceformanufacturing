import React, { useState } from 'react';
import { ProcessGraph, Station, Entity, Arrival, Route, Distribution } from '../types/processGraph';
import { ValidationResult } from '../validation/processGraphSchema';
import ParsedDataValidator from './ParsedDataValidator';
import './ParsedDataReview.css';

interface ParsedDataReviewProps {
  initialGraph: ProcessGraph;
  validation: ValidationResult;
  onApprove: (editedGraph: ProcessGraph) => void;
  onReject: () => void;
}

type EditSection = 'entities' | 'arrivals' | 'stations' | 'routes' | 'resources' | 'calendars' | 'runConfig' | 'metadata' | 'setups' | 'quality' | 'failures' | 'buffers' | 'wip' | 'control' | 'kpis';

const ParsedDataReview: React.FC<ParsedDataReviewProps> = ({
  initialGraph,
  validation,
  onApprove,
  onReject
}) => {
  const [graph, setGraph] = useState<ProcessGraph>(JSON.parse(JSON.stringify(initialGraph)));
  const [activeSection, setActiveSection] = useState<EditSection>('stations');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [nlpInput, setNlpInput] = useState('');
  const [nlpProcessing, setNlpProcessing] = useState(false);
  const [nlpResponse, setNlpResponse] = useState<{
    success: boolean;
    message: string;
    changes?: string[];
  } | null>(null);

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

  // Add arrival
  const addArrival = () => {
    const newArrival: Arrival = {
      policy: 'poisson',
      windows: [{ start: '08:00', end: '17:00', rate: 10, units: 'entities/hour' }],
      batch: 1
    };
    setGraph({ ...graph, arrivals: [...graph.arrivals, newArrival] });
  };

  // Delete arrival
  const deleteArrival = (index: number) => {
    const newGraph = { ...graph };
    newGraph.arrivals.splice(index, 1);
    setGraph(newGraph);
  };

  // Update arrival policy
  const updateArrivalPolicy = (index: number, policy: string) => {
    const newGraph = { ...graph };
    let newArrival: Arrival;

    if (policy === 'poisson') {
      newArrival = {
        policy: 'poisson',
        windows: [{ start: '08:00', end: '17:00', rate: 10, units: 'entities/hour' }],
        batch: 1
      };
    } else if (policy === 'schedule_table') {
      newArrival = {
        policy: 'schedule_table',
        entries: [{ time: 0, quantity: 10 }]
      };
    } else if (policy === 'empirical') {
      newArrival = {
        policy: 'empirical',
        interarrival: { type: 'exponential', params: { mean: 10 }, units: 'minutes' }
      };
    } else {
      newArrival = {
        policy: 'orders',
        orders: [{ time: 0, quantity: 10, class: 'Default' }]
      };
    }

    newGraph.arrivals[index] = newArrival;
    setGraph(newGraph);
  };

  // Update arrival window
  const updateArrivalWindow = (arrivalIdx: number, windowIdx: number, field: string, value: any) => {
    const newGraph = { ...graph };
    const arrival = newGraph.arrivals[arrivalIdx];
    if (arrival.policy === 'poisson') {
      arrival.windows[windowIdx] = { ...arrival.windows[windowIdx], [field]: value };
      setGraph(newGraph);
    }
  };

  // Add arrival window
  const addArrivalWindow = (arrivalIdx: number) => {
    const newGraph = { ...graph };
    const arrival = newGraph.arrivals[arrivalIdx];
    if (arrival.policy === 'poisson') {
      arrival.windows.push({ start: '08:00', end: '17:00', rate: 10, units: 'entities/hour' });
      setGraph(newGraph);
    }
  };

  // Delete arrival window
  const deleteArrivalWindow = (arrivalIdx: number, windowIdx: number) => {
    const newGraph = { ...graph };
    const arrival = newGraph.arrivals[arrivalIdx];
    if (arrival.policy === 'poisson' && arrival.windows.length > 1) {
      arrival.windows.splice(windowIdx, 1);
      setGraph(newGraph);
    }
  };

  // Update schedule entry
  const updateScheduleEntry = (arrivalIdx: number, entryIdx: number, field: string, value: any) => {
    const newGraph = { ...graph };
    const arrival = newGraph.arrivals[arrivalIdx];
    if (arrival.policy === 'schedule_table') {
      arrival.entries[entryIdx] = { ...arrival.entries[entryIdx], [field]: value };
      setGraph(newGraph);
    }
  };

  // Add schedule entry
  const addScheduleEntry = (arrivalIdx: number) => {
    const newGraph = { ...graph };
    const arrival = newGraph.arrivals[arrivalIdx];
    if (arrival.policy === 'schedule_table') {
      arrival.entries.push({ time: 0, quantity: 10 });
      setGraph(newGraph);
    }
  };

  // Delete schedule entry
  const deleteScheduleEntry = (arrivalIdx: number, entryIdx: number) => {
    const newGraph = { ...graph };
    const arrival = newGraph.arrivals[arrivalIdx];
    if (arrival.policy === 'schedule_table' && arrival.entries.length > 1) {
      arrival.entries.splice(entryIdx, 1);
      setGraph(newGraph);
    }
  };

  // Update resource
  const updateResource = (index: number, field: string, value: any) => {
    const newGraph = { ...graph };
    if (!newGraph.resources) newGraph.resources = [];
    newGraph.resources[index] = { ...newGraph.resources[index], [field]: value };
    setGraph(newGraph);
  };

  // Add resource
  const addResource = () => {
    const newResource: any = {
      id: `Resource_${(graph.resources?.length || 0) + 1}`,
      type: 'operator',
      count: 1
    };
    setGraph({
      ...graph,
      resources: [...(graph.resources || []), newResource]
    });
  };

  // Delete resource
  const deleteResource = (index: number) => {
    const newGraph = { ...graph };
    if (newGraph.resources) {
      newGraph.resources.splice(index, 1);
      setGraph(newGraph);
    }
  };

  // Update run config
  const updateRunConfig = (field: string, value: any) => {
    const newGraph = { ...graph };
    newGraph.runConfig = { ...newGraph.runConfig, [field]: value };
    setGraph(newGraph);
  };

  // Handle NLP input
  const handleNlpSubmit = async () => {
    if (!nlpInput.trim()) return;

    setNlpProcessing(true);
    setNlpResponse(null);

    try {
      // Call NLP processor (via Electron IPC or API)
      const result = await window.electron.processNlpEdit({
        currentGraph: graph,
        nlpCommand: nlpInput
      });

      if (result.success && result.updatedGraph) {
        setGraph(result.updatedGraph);
        setNlpResponse({
          success: true,
          message: result.message || 'Changes applied successfully',
          changes: result.changes || []
        });
        setNlpInput(''); // Clear input on success
      } else {
        setNlpResponse({
          success: false,
          message: result.error || 'Failed to process command',
          changes: []
        });
      }
    } catch (error) {
      setNlpResponse({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        changes: []
      });
    } finally {
      setNlpProcessing(false);
    }
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
          <div className="card-label">Run Length</div>
          <div className="card-value">{(graph.runConfig.runLength_min / 60).toFixed(1)}h</div>
        </div>
        <div className="summary-card" onClick={() => setActiveSection('setups')}>
          <div className="card-label">Setups</div>
          <div className="card-value">{graph.stations.filter(s => s.setup).length}</div>
        </div>
        <div className="summary-card" onClick={() => setActiveSection('quality')}>
          <div className="card-label">Quality/Rework</div>
          <div className="card-value">{graph.stations.filter(s => s.rework || s.scrap).length}</div>
        </div>
        <div className="summary-card" onClick={() => setActiveSection('failures')}>
          <div className="card-label">Failures</div>
          <div className="card-value">{graph.stations.filter(s => s.downtime).length}</div>
        </div>
        <div className="summary-card" onClick={() => setActiveSection('buffers')}>
          <div className="card-label">Buffers</div>
          <div className="card-value">{graph.stations.filter(s => s.kind === 'buffer').length}</div>
        </div>
        <div className="summary-card" onClick={() => setActiveSection('kpis')}>
          <div className="card-label">KPIs</div>
          <div className="card-value">{graph.kpis?.length || 0}</div>
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

                    {/* Batching Configuration */}
                    {(station as any).batching && (
                      <div className="detail-section">
                        <h4>Batching</h4>
                        <label>Min Batch Size:</label>
                        <input
                          type="number"
                          min="1"
                          value={(station as any).batching.min || 1}
                          onChange={(e) => {
                            const newGraph = { ...graph };
                            if (!(newGraph.stations[idx] as any).batching) {
                              (newGraph.stations[idx] as any).batching = {};
                            }
                            (newGraph.stations[idx] as any).batching.min = parseInt(e.target.value);
                            setGraph(newGraph);
                          }}
                        />
                        <label>Max Batch Size:</label>
                        <input
                          type="number"
                          min="1"
                          value={(station as any).batching.max || 10}
                          onChange={(e) => {
                            const newGraph = { ...graph };
                            if (!(newGraph.stations[idx] as any).batching) {
                              (newGraph.stations[idx] as any).batching = {};
                            }
                            (newGraph.stations[idx] as any).batching.max = parseInt(e.target.value);
                            setGraph(newGraph);
                          }}
                        />
                        <label>Policy:</label>
                        <select
                          value={(station as any).batching.policy || 'wait-min'}
                          onChange={(e) => {
                            const newGraph = { ...graph };
                            if (!(newGraph.stations[idx] as any).batching) {
                              (newGraph.stations[idx] as any).batching = {};
                            }
                            (newGraph.stations[idx] as any).batching.policy = e.target.value;
                            setGraph(newGraph);
                          }}
                        >
                          <option value="wait-min">Wait for Min</option>
                          <option value="wait-full">Wait for Full</option>
                          <option value="periodic">Periodic Release</option>
                        </select>
                      </div>
                    )}

                    {/* Energy Model */}
                    {(station as any).energy && (
                      <div className="detail-section">
                        <h4>Energy Model</h4>
                        <label>Active Power (kW):</label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={(station as any).energy.active_kw || 0}
                          onChange={(e) => {
                            const newGraph = { ...graph };
                            if (!(newGraph.stations[idx] as any).energy) {
                              (newGraph.stations[idx] as any).energy = {};
                            }
                            (newGraph.stations[idx] as any).energy.active_kw = parseFloat(e.target.value);
                            setGraph(newGraph);
                          }}
                        />
                        <label>Idle Power (kW):</label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={(station as any).energy.idle_kw || 0}
                          onChange={(e) => {
                            const newGraph = { ...graph };
                            if (!(newGraph.stations[idx] as any).energy) {
                              (newGraph.stations[idx] as any).energy = {};
                            }
                            (newGraph.stations[idx] as any).energy.idle_kw = parseFloat(e.target.value);
                            setGraph(newGraph);
                          }}
                        />
                      </div>
                    )}

                    {/* Layout Position */}
                    {(station as any).position && (
                      <div className="detail-section">
                        <h4>Layout Position</h4>
                        <label>X:</label>
                        <input
                          type="number"
                          value={(station as any).position.x || 0}
                          onChange={(e) => {
                            const newGraph = { ...graph };
                            if (!(newGraph.stations[idx] as any).position) {
                              (newGraph.stations[idx] as any).position = {};
                            }
                            (newGraph.stations[idx] as any).position.x = parseFloat(e.target.value);
                            setGraph(newGraph);
                          }}
                        />
                        <label>Y:</label>
                        <input
                          type="number"
                          value={(station as any).position.y || 0}
                          onChange={(e) => {
                            const newGraph = { ...graph };
                            if (!(newGraph.stations[idx] as any).position) {
                              (newGraph.stations[idx] as any).position = {};
                            }
                            (newGraph.stations[idx] as any).position.y = parseFloat(e.target.value);
                            setGraph(newGraph);
                          }}
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

        {/* Arrivals Editor */}
        {activeSection === 'arrivals' && (
          <div className="section-editor">
            <div className="section-header">
              <h3>Arrivals ({graph.arrivals.length})</h3>
              <button className="add-button" onClick={addArrival}>
                + Add Arrival
              </button>
            </div>

            {graph.arrivals.map((arrival, idx) => (
              <div key={idx} className="item-card">
                <div className="item-header" onClick={() => toggleExpand(`arrival-${idx}`)}>
                  <span className="expand-icon">
                    {expandedItems.has(`arrival-${idx}`) ? '▼' : '▶'}
                  </span>
                  <span className="item-title">
                    Arrival {idx + 1} - {arrival.policy}
                  </span>
                  <button
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteArrival(idx);
                    }}
                  >
                    Delete
                  </button>
                </div>

                {expandedItems.has(`arrival-${idx}`) && (
                  <div className="item-details">
                    <div className="detail-row">
                      <label>Policy:</label>
                      <select
                        value={arrival.policy}
                        onChange={(e) => updateArrivalPolicy(idx, e.target.value as any)}
                      >
                        <option value="poisson">Poisson</option>
                        <option value="schedule_table">Schedule Table</option>
                        <option value="empirical">Empirical</option>
                        <option value="orders">Orders</option>
                      </select>
                    </div>

                    {/* Poisson Rate Table */}
                    {arrival.policy === 'poisson' && (
                      <>
                        <div className="detail-section">
                          <h4>Rate Windows</h4>
                          {arrival.windows.map((window, wIdx) => (
                            <div key={wIdx} className="window-card">
                              <div className="window-header">
                                <strong>Window {wIdx + 1}</strong>
                                <button
                                  className="delete-button-small"
                                  onClick={() => deleteArrivalWindow(idx, wIdx)}
                                >
                                  ×
                                </button>
                              </div>
                              <div className="window-fields">
                                <div className="detail-row">
                                  <label>Start:</label>
                                  <input
                                    type="text"
                                    placeholder="HH:MM"
                                    value={window.start}
                                    onChange={(e) =>
                                      updateArrivalWindow(idx, wIdx, 'start', e.target.value)
                                    }
                                  />
                                </div>
                                <div className="detail-row">
                                  <label>End:</label>
                                  <input
                                    type="text"
                                    placeholder="HH:MM"
                                    value={window.end}
                                    onChange={(e) =>
                                      updateArrivalWindow(idx, wIdx, 'end', e.target.value)
                                    }
                                  />
                                </div>
                                <div className="detail-row">
                                  <label>Rate (ent/hr):</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={window.rate}
                                    onChange={(e) =>
                                      updateArrivalWindow(idx, wIdx, 'rate', parseFloat(e.target.value))
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          <button className="add-button-small" onClick={() => addArrivalWindow(idx)}>
                            + Add Window
                          </button>
                        </div>

                        <div className="detail-row">
                          <label>Batch Size:</label>
                          <input
                            type="number"
                            min="1"
                            value={arrival.batch}
                            onChange={(e) =>
                              updateArrival(idx, { ...arrival, batch: parseInt(e.target.value) })
                            }
                          />
                        </div>
                      </>
                    )}

                    {/* Schedule Table */}
                    {arrival.policy === 'schedule_table' && (
                      <div className="detail-section">
                        <h4>Schedule Entries</h4>
                        <table className="schedule-table">
                          <thead>
                            <tr>
                              <th>Time (min)</th>
                              <th>Quantity</th>
                              <th>Class</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {arrival.entries.map((entry, eIdx) => (
                              <tr key={eIdx}>
                                <td>
                                  <input
                                    type="number"
                                    value={entry.time}
                                    onChange={(e) =>
                                      updateScheduleEntry(idx, eIdx, 'time', parseFloat(e.target.value))
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    min="1"
                                    value={entry.quantity}
                                    onChange={(e) =>
                                      updateScheduleEntry(idx, eIdx, 'quantity', parseInt(e.target.value))
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    value={entry.class || ''}
                                    onChange={(e) =>
                                      updateScheduleEntry(idx, eIdx, 'class', e.target.value)
                                    }
                                  />
                                </td>
                                <td>
                                  <button
                                    className="delete-button-small"
                                    onClick={() => deleteScheduleEntry(idx, eIdx)}
                                  >
                                    ×
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button className="add-button-small" onClick={() => addScheduleEntry(idx)}>
                          + Add Entry
                        </button>
                      </div>
                    )}

                    {/* Empirical */}
                    {arrival.policy === 'empirical' && (
                      <div className="detail-section">
                        <h4>Interarrival Distribution</h4>
                        {renderDistributionEditor(arrival.interarrival, idx, 'interarrival')}
                      </div>
                    )}

                    {/* Class Mix (for all policies) */}
                    {(arrival as any).class_mix && (arrival as any).class_mix.length > 0 && (
                      <div className="detail-section">
                        <h4>Class Mix</h4>
                        {(arrival as any).class_mix.map((mix: any, mixIdx: number) => (
                          <div key={mixIdx} className="mix-row">
                            <input
                              type="text"
                              placeholder="Class"
                              value={mix.class}
                              onChange={(e) => {
                                const newGraph = { ...graph };
                                (newGraph.arrivals[idx] as any).class_mix[mixIdx].class = e.target.value;
                                setGraph(newGraph);
                              }}
                            />
                            <input
                              type="number"
                              min="0"
                              max="1"
                              step="0.01"
                              placeholder="Proportion"
                              value={mix.proportion}
                              onChange={(e) => {
                                const newGraph = { ...graph };
                                (newGraph.arrivals[idx] as any).class_mix[mixIdx].proportion = parseFloat(e.target.value);
                                setGraph(newGraph);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Calendar Binding */}
                    {(arrival as any).calendar_id && (
                      <div className="detail-row">
                        <label>Calendar:</label>
                        <select
                          value={(arrival as any).calendar_id}
                          onChange={(e) => {
                            const newGraph = { ...graph };
                            (newGraph.arrivals[idx] as any).calendar_id = e.target.value;
                            setGraph(newGraph);
                          }}
                        >
                          <option value="">None</option>
                          {graph.calendars && graph.calendars.map(cal => (
                            <option key={cal.id} value={cal.id}>{cal.id}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Release Rules */}
                    {(arrival as any).release_rule && (
                      <div className="detail-row">
                        <label>Release Rule:</label>
                        <select
                          value={(arrival as any).release_rule}
                          onChange={(e) => {
                            const newGraph = { ...graph };
                            (newGraph.arrivals[idx] as any).release_rule = e.target.value;
                            setGraph(newGraph);
                          }}
                        >
                          <option value="immediate">Immediate</option>
                          <option value="periodic">Periodic</option>
                          <option value="edd">Earliest Due Date</option>
                          <option value="conwip">CONWIP-Gated</option>
                          <option value="kanban">Kanban-Gated</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Resources Editor */}
        {activeSection === 'resources' && (
          <div className="section-editor">
            <div className="section-header">
              <h3>Resources ({graph.resources?.length || 0})</h3>
              <button className="add-button" onClick={addResource}>
                + Add Resource Pool
              </button>
            </div>

            {(graph.resources || []).map((resource, idx) => (
              <div key={resource.id} className="item-card">
                <div className="item-header" onClick={() => toggleExpand(resource.id)}>
                  <span className="expand-icon">
                    {expandedItems.has(resource.id) ? '▼' : '▶'}
                  </span>
                  <span className="item-title">
                    {resource.id} - {resource.type} (x{resource.count})
                  </span>
                  <button
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteResource(idx);
                    }}
                  >
                    Delete
                  </button>
                </div>

                {expandedItems.has(resource.id) && (
                  <div className="item-details">
                    <div className="detail-row">
                      <label>ID:</label>
                      <input
                        type="text"
                        value={resource.id}
                        onChange={(e) => updateResource(idx, 'id', e.target.value)}
                      />
                    </div>

                    <div className="detail-row">
                      <label>Type:</label>
                      <select
                        value={resource.type}
                        onChange={(e) => updateResource(idx, 'type', e.target.value)}
                      >
                        <option value="operator">Operator</option>
                        <option value="tool">Tool</option>
                        <option value="vehicle">Vehicle</option>
                      </select>
                    </div>

                    <div className="detail-row">
                      <label>Count:</label>
                      <input
                        type="number"
                        min="1"
                        value={resource.count}
                        onChange={(e) => updateResource(idx, 'count', parseInt(e.target.value))}
                      />
                    </div>

                    {resource.home_station && (
                      <div className="detail-row">
                        <label>Home Station:</label>
                        <select
                          value={resource.home_station}
                          onChange={(e) => updateResource(idx, 'home_station', e.target.value)}
                        >
                          {graph.stations.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.id}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Skills/Qualifications */}
                    {(resource as any).skills && (resource as any).skills.length > 0 && (
                      <div className="detail-section">
                        <h4>Skills/Qualifications</h4>
                        {(resource as any).skills.map((skill: any, skillIdx: number) => (
                          <div key={skillIdx} className="skill-row">
                            <input
                              type="text"
                              placeholder="Skill name"
                              value={skill.name}
                              onChange={(e) => {
                                const newGraph = { ...graph };
                                (newGraph.resources![idx] as any).skills[skillIdx].name = e.target.value;
                                setGraph(newGraph);
                              }}
                            />
                            <input
                              type="number"
                              placeholder="Level"
                              min="1"
                              max="10"
                              value={skill.level}
                              onChange={(e) => {
                                const newGraph = { ...graph };
                                (newGraph.resources![idx] as any).skills[skillIdx].level = parseInt(e.target.value);
                                setGraph(newGraph);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Calendar Binding */}
                    {(resource as any).calendar_id && (
                      <div className="detail-row">
                        <label>Calendar:</label>
                        <select
                          value={(resource as any).calendar_id}
                          onChange={(e) => {
                            const newGraph = { ...graph };
                            (newGraph.resources![idx] as any).calendar_id = e.target.value;
                            setGraph(newGraph);
                          }}
                        >
                          <option value="">24/7 (No Calendar)</option>
                          {graph.calendars && graph.calendars.map(cal => (
                            <option key={cal.id} value={cal.id}>{cal.id}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Dispatching Policy */}
                    {(resource as any).dispatching && (
                      <div className="detail-row">
                        <label>Dispatching:</label>
                        <select
                          value={(resource as any).dispatching}
                          onChange={(e) => {
                            const newGraph = { ...graph };
                            (newGraph.resources![idx] as any).dispatching = e.target.value;
                            setGraph(newGraph);
                          }}
                        >
                          <option value="nearest">Nearest Available</option>
                          <option value="priority">Priority-Based</option>
                          <option value="cyclic">Cyclic Rotation</option>
                          <option value="random">Random</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
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

                  {/* Additional Entity Fields */}
                  {entity.attributes && entity.attributes.length > 0 && (
                    <div className="detail-section">
                      <h4>Attributes</h4>
                      {entity.attributes.map((attr: any, attrIdx: number) => (
                        <div key={attrIdx} className="attribute-row">
                          <input
                            type="text"
                            placeholder="Name"
                            value={attr.name}
                            onChange={(e) => {
                              const newGraph = { ...graph };
                              newGraph.entities[idx].attributes[attrIdx].name = e.target.value;
                              setGraph(newGraph);
                            }}
                          />
                          <select
                            value={attr.type}
                            onChange={(e) => {
                              const newGraph = { ...graph };
                              newGraph.entities[idx].attributes[attrIdx].type = e.target.value;
                              setGraph(newGraph);
                            }}
                          >
                            <option value="number">Number</option>
                            <option value="string">String</option>
                            <option value="boolean">Boolean</option>
                            <option value="datetime">DateTime</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  {entity.bom && entity.bom.length > 0 && (
                    <div className="detail-section">
                      <h4>Bill of Materials (BOM)</h4>
                      {entity.bom.map((component: any, bomIdx: number) => (
                        <div key={bomIdx} className="bom-row">
                          <span>{component.entity_id}</span>
                          <input
                            type="number"
                            min="1"
                            value={component.quantity}
                            onChange={(e) => {
                              const newGraph = { ...graph };
                              newGraph.entities[idx].bom[bomIdx].quantity = parseInt(e.target.value);
                              setGraph(newGraph);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {entity.cost_per_unit !== undefined && (
                    <div className="detail-row">
                      <label>Cost per Unit:</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={entity.cost_per_unit}
                        onChange={(e) => updateEntity(idx, 'cost_per_unit', parseFloat(e.target.value))}
                      />
                    </div>
                  )}
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
                <label>Run Length (hours):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={(graph.runConfig.runLength_min / 60).toFixed(1)}
                  onChange={(e) => updateRunConfig('runLength_min', Math.round(parseFloat(e.target.value) * 60))}
                />
                <span style={{ fontSize: '0.75rem', color: '#606060', marginLeft: '0.5rem' }}>
                  ({graph.runConfig.runLength_min} minutes)
                </span>
              </div>

              <div className="detail-row">
                <label>Warmup Period (hours):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={(graph.runConfig.warmup_min / 60).toFixed(1)}
                  onChange={(e) => updateRunConfig('warmup_min', Math.round(parseFloat(e.target.value) * 60))}
                />
                <span style={{ fontSize: '0.75rem', color: '#606060', marginLeft: '0.5rem' }}>
                  ({graph.runConfig.warmup_min} minutes)
                </span>
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

              <div className="detail-row">
                <label>Random Seed:</label>
                <input
                  type="number"
                  min="1"
                  value={graph.runConfig.seed || 12345}
                  onChange={(e) => updateRunConfig('seed', parseInt(e.target.value))}
                />
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

        {/* Setups Editor */}
        {activeSection === 'setups' && (
          <div className="section-editor">
            <div className="section-header">
              <h3>Setups / Changeovers ({graph.stations.filter(s => s.setup).length} stations with setups)</h3>
            </div>

            {graph.stations.filter(s => s.setup).map((station, idx) => {
              const stationIndex = graph.stations.indexOf(station);
              return (
                <div key={station.id} className="item-card">
                  <div className="item-header">
                    <strong>{station.id}</strong>
                    <span className="setup-mode">{station.setup?.mode || 'none'}</span>
                  </div>

                  <div className="detail-section">
                    <label>Setup Mode:</label>
                    <select
                      value={station.setup?.mode || 'none'}
                      onChange={(e) => {
                        const newGraph = { ...graph };
                        if (e.target.value === 'none') {
                          delete newGraph.stations[stationIndex].setup;
                        } else {
                          newGraph.stations[stationIndex].setup = {
                            mode: e.target.value as any,
                            ...(e.target.value === 'cadence' ? { cadence: { every_n: 10, time: { type: 'constant', params: { value: 5 }, units: 'minutes' } } } : {})
                          };
                        }
                        setGraph(newGraph);
                      }}
                    >
                      <option value="none">No Setup</option>
                      <option value="cadence">Cadence (every N parts)</option>
                      <option value="class_based">Class-Based</option>
                      <option value="sequence_dependent">Sequence-Dependent</option>
                    </select>
                  </div>

                  {station.setup?.mode === 'cadence' && station.setup.cadence && (
                    <div className="detail-section">
                      <label>Every N parts:</label>
                      <input
                        type="number"
                        value={station.setup.cadence.every_n}
                        onChange={(e) => {
                          const newGraph = { ...graph };
                          if (newGraph.stations[stationIndex].setup?.cadence) {
                            newGraph.stations[stationIndex].setup!.cadence!.every_n = parseInt(e.target.value);
                          }
                          setGraph(newGraph);
                        }}
                      />
                      <label>Setup time (min):</label>
                      <input
                        type="number"
                        value={station.setup.cadence.time.type === 'constant' ? station.setup.cadence.time.params.value : 0}
                        onChange={(e) => {
                          const newGraph = { ...graph };
                          if (newGraph.stations[stationIndex].setup?.cadence) {
                            newGraph.stations[stationIndex].setup!.cadence!.time = {
                              type: 'constant',
                              params: { value: parseFloat(e.target.value) },
                              units: 'minutes'
                            };
                          }
                          setGraph(newGraph);
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {graph.stations.filter(s => s.setup).length === 0 && (
              <div className="empty-state">No stations with setups configured. Edit stations to add setup policies.</div>
            )}
          </div>
        )}

        {/* Quality/Rework/Scrap Editor */}
        {activeSection === 'quality' && (
          <div className="section-editor">
            <div className="section-header">
              <h3>Quality / Rework / Scrap ({graph.stations.filter(s => s.rework || s.scrap).length} stations)</h3>
            </div>

            {graph.stations.filter(s => s.rework || s.scrap).map((station, idx) => {
              const stationIndex = graph.stations.indexOf(station);
              return (
                <div key={station.id} className="item-card">
                  <div className="item-header">
                    <strong>{station.id}</strong>
                  </div>

                  {station.rework && (
                    <div className="detail-section">
                      <h4>Rework</h4>
                      <label>Probability:</label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={station.rework.probability}
                        onChange={(e) => {
                          const newGraph = { ...graph };
                          if (newGraph.stations[stationIndex].rework) {
                            newGraph.stations[stationIndex].rework!.probability = parseFloat(e.target.value);
                          }
                          setGraph(newGraph);
                        }}
                      />
                      <label>Rework to:</label>
                      <select
                        value={station.rework.to}
                        onChange={(e) => {
                          const newGraph = { ...graph };
                          if (newGraph.stations[stationIndex].rework) {
                            newGraph.stations[stationIndex].rework!.to = e.target.value;
                          }
                          setGraph(newGraph);
                        }}
                      >
                        {graph.stations.map(s => (
                          <option key={s.id} value={s.id}>{s.id}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {station.scrap && (
                    <div className="detail-section">
                      <h4>Scrap</h4>
                      <label>Scrap Probability:</label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={station.scrap.probability}
                        onChange={(e) => {
                          const newGraph = { ...graph };
                          if (newGraph.stations[stationIndex].scrap) {
                            newGraph.stations[stationIndex].scrap!.probability = parseFloat(e.target.value);
                          }
                          setGraph(newGraph);
                        }}
                      />
                      {station.scrap.cost_per_unit !== undefined && (
                        <>
                          <label>Cost per scrapped unit:</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={station.scrap.cost_per_unit}
                            onChange={(e) => {
                              const newGraph = { ...graph };
                              if (newGraph.stations[stationIndex].scrap) {
                                newGraph.stations[stationIndex].scrap!.cost_per_unit = parseFloat(e.target.value);
                              }
                              setGraph(newGraph);
                            }}
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {graph.stations.filter(s => s.rework || s.scrap).length === 0 && (
              <div className="empty-state">No quality/rework configurations. Edit stations to add rework or scrap policies.</div>
            )}
          </div>
        )}

        {/* Failures/Downtime Editor */}
        {activeSection === 'failures' && (
          <div className="section-editor">
            <div className="section-header">
              <h3>Failures / Downtime ({graph.stations.filter(s => s.downtime).length} stations)</h3>
            </div>

            {graph.stations.filter(s => s.downtime).map((station, idx) => {
              const stationIndex = graph.stations.indexOf(station);
              return (
                <div key={station.id} className="item-card">
                  <div className="item-header">
                    <strong>{station.id}</strong>
                    <span className="failure-type">{station.downtime?.type || 'unknown'}</span>
                  </div>

                  <div className="detail-section">
                    <label>Failure Type:</label>
                    <select
                      value={station.downtime?.type || 'time_based'}
                      onChange={(e) => {
                        const newGraph = { ...graph };
                        newGraph.stations[stationIndex].downtime = {
                          type: e.target.value as 'time_based' | 'count_based',
                          mtbf: { type: 'exponential', params: { mean: 480 }, units: 'minutes' },
                          mttr: { type: 'constant', params: { value: 30 }, units: 'minutes' }
                        };
                        setGraph(newGraph);
                      }}
                    >
                      <option value="time_based">Time-Based (MTBF/MTTR)</option>
                      <option value="count_based">Count-Based</option>
                    </select>
                  </div>

                  {station.downtime?.type === 'time_based' && station.downtime.mtbf && (
                    <div className="detail-section">
                      <h4>MTBF (Mean Time Between Failures)</h4>
                      <label>Mean (minutes):</label>
                      <input
                        type="number"
                        value={station.downtime.mtbf.type === 'exponential' ? station.downtime.mtbf.params.mean : 0}
                        onChange={(e) => {
                          const newGraph = { ...graph };
                          if (newGraph.stations[stationIndex].downtime?.mtbf) {
                            newGraph.stations[stationIndex].downtime!.mtbf = {
                              type: 'exponential',
                              params: { mean: parseFloat(e.target.value) },
                              units: 'minutes'
                            };
                          }
                          setGraph(newGraph);
                        }}
                      />
                    </div>
                  )}

                  {station.downtime?.mttr && (
                    <div className="detail-section">
                      <h4>MTTR (Mean Time To Repair)</h4>
                      <label>Time (minutes):</label>
                      <input
                        type="number"
                        value={station.downtime.mttr.type === 'constant' ? station.downtime.mttr.params.value : 0}
                        onChange={(e) => {
                          const newGraph = { ...graph };
                          if (newGraph.stations[stationIndex].downtime?.mttr) {
                            newGraph.stations[stationIndex].downtime!.mttr = {
                              type: 'constant',
                              params: { value: parseFloat(e.target.value) },
                              units: 'minutes'
                            };
                          }
                          setGraph(newGraph);
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {graph.stations.filter(s => s.downtime).length === 0 && (
              <div className="empty-state">No failures/downtime configured. Edit stations to add failure models.</div>
            )}
          </div>
        )}

        {/* Buffers Editor */}
        {activeSection === 'buffers' && (
          <div className="section-editor">
            <div className="section-header">
              <h3>Buffers / Storage ({graph.stations.filter(s => s.kind === 'buffer').length} buffers)</h3>
            </div>

            {graph.stations.filter(s => s.kind === 'buffer').map((station, idx) => {
              const stationIndex = graph.stations.indexOf(station);
              return (
                <div key={station.id} className="item-card">
                  <div className="item-header">
                    <strong>{station.id}</strong>
                  </div>

                  <div className="detail-section">
                    <label>Capacity:</label>
                    <input
                      type="number"
                      min="1"
                      value={station.capacity}
                      onChange={(e) => {
                        const newGraph = { ...graph };
                        newGraph.stations[stationIndex].capacity = parseInt(e.target.value);
                        setGraph(newGraph);
                      }}
                    />
                    <label>Queue Discipline:</label>
                    <select
                      value={station.queue}
                      onChange={(e) => {
                        const newGraph = { ...graph };
                        newGraph.stations[stationIndex].queue = e.target.value as any;
                        setGraph(newGraph);
                      }}
                    >
                      <option value="FIFO">FIFO</option>
                      <option value="LIFO">LIFO</option>
                      <option value="PRIORITY">Priority</option>
                    </select>
                  </div>
                </div>
              );
            })}

            {graph.stations.filter(s => s.kind === 'buffer').length === 0 && (
              <div className="empty-state">No buffers in system. Add stations with kind="buffer" to manage storage areas.</div>
            )}
          </div>
        )}

        {/* KPIs Editor */}
        {activeSection === 'kpis' && (
          <div className="section-editor">
            <div className="section-header">
              <h3>KPIs / Statistics ({graph.kpis?.length || 0} metrics)</h3>
              <button className="add-button" onClick={() => {
                const newGraph = { ...graph };
                if (!newGraph.kpis) newGraph.kpis = [];
                newGraph.kpis.push({
                  name: 'new_kpi',
                  type: 'rate',
                  units: 'entities/hour'
                });
                setGraph(newGraph);
              }}>
                + Add KPI
              </button>
            </div>

            {graph.kpis && graph.kpis.map((kpi, idx) => (
              <div key={idx} className="item-card">
                <div className="item-header">
                  <strong>{kpi.name}</strong>
                  <button
                    className="delete-button-small"
                    onClick={() => {
                      const newGraph = { ...graph };
                      newGraph.kpis?.splice(idx, 1);
                      setGraph(newGraph);
                    }}
                  >
                    ×
                  </button>
                </div>

                <div className="detail-section">
                  <label>Name:</label>
                  <input
                    type="text"
                    value={kpi.name}
                    onChange={(e) => {
                      const newGraph = { ...graph };
                      if (newGraph.kpis) {
                        newGraph.kpis[idx].name = e.target.value;
                      }
                      setGraph(newGraph);
                    }}
                  />
                  <label>Type:</label>
                  <select
                    value={kpi.type}
                    onChange={(e) => {
                      const newGraph = { ...graph };
                      if (newGraph.kpis) {
                        newGraph.kpis[idx].type = e.target.value as any;
                      }
                      setGraph(newGraph);
                    }}
                  >
                    <option value="rate">Rate (throughput)</option>
                    <option value="percentage">Percentage (utilization)</option>
                    <option value="time">Time (cycle time)</option>
                    <option value="count">Count (queue length, WIP)</option>
                  </select>
                  {kpi.units && (
                    <>
                      <label>Units:</label>
                      <input
                        type="text"
                        value={kpi.units}
                        onChange={(e) => {
                          const newGraph = { ...graph };
                          if (newGraph.kpis) {
                            newGraph.kpis[idx].units = e.target.value;
                          }
                          setGraph(newGraph);
                        }}
                      />
                    </>
                  )}
                  {kpi.target !== undefined && (
                    <>
                      <label>Target:</label>
                      <input
                        type="number"
                        value={kpi.target}
                        onChange={(e) => {
                          const newGraph = { ...graph };
                          if (newGraph.kpis) {
                            newGraph.kpis[idx].target = parseFloat(e.target.value);
                          }
                          setGraph(newGraph);
                        }}
                      />
                    </>
                  )}
                </div>
              </div>
            ))}

            {(!graph.kpis || graph.kpis.length === 0) && (
              <div className="empty-state">No KPIs defined. Add metrics to track system performance.</div>
            )}
          </div>
        )}
      </div>

      {/* NLP Chatbot Section */}
      <div className="nlp-chatbot-section">
        <div className="chatbot-header">
          <h3>💬 Natural Language Editor</h3>
          <p className="chatbot-subtitle">Describe changes in plain English and I'll update the model</p>
        </div>

        <div className="chatbot-container">
          <div className="chatbot-input-area">
            <textarea
              className="chatbot-input"
              placeholder={`Examples:\n- "Add a new machine called Inspection with 5 minute cycle time"\n- "Change CNC cycle time to 15 minutes"\n- "Add arrival rate of 20 parts/hour from 8am to 5pm"\n- "Add 2 more operators to Assembly"\n- "Set rework probability to 8% for Testing"`}
              rows={4}
              value={nlpInput}
              onChange={(e) => setNlpInput(e.target.value)}
            />
            <button
              className="chatbot-submit"
              onClick={handleNlpSubmit}
              disabled={!nlpInput.trim() || nlpProcessing}
            >
              {nlpProcessing ? 'Processing...' : 'Apply Changes'}
            </button>
          </div>

          {nlpResponse && (
            <div className={`chatbot-response ${nlpResponse.success ? 'success' : 'error'}`}>
              <div className="response-header">
                <span className="response-icon">{nlpResponse.success ? '✓' : '⚠'}</span>
                <strong>{nlpResponse.success ? 'Changes Applied' : 'Error'}</strong>
              </div>
              <div className="response-message">{nlpResponse.message}</div>
              {nlpResponse.changes && nlpResponse.changes.length > 0 && (
                <div className="response-changes">
                  <h4>Changes Made:</h4>
                  <ul>
                    {nlpResponse.changes.map((change, idx) => (
                      <li key={idx}>{change}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="footer-actions">
        <button className="reject-button" onClick={() => {
          console.log('[ParsedDataReview] Reject clicked');
          onReject();
        }}>
          Reject & Re-Parse
        </button>
        <button className="approve-button" onClick={() => {
          console.log('[ParsedDataReview] Approve clicked - calling onApprove with graph:', graph);
          onApprove(graph);
        }}>
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

        .add-button-small {
          background: #4299e1;
          color: white;
          border: none;
          padding: 0.4rem 0.8rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          margin-top: 0.5rem;
        }

        .add-button-small:hover {
          background: #3182ce;
        }

        .delete-button-small {
          background: #f56565;
          color: white;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 3px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .delete-button-small:hover {
          background: #c53030;
        }

        .window-card {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 1rem;
          margin-bottom: 0.75rem;
        }

        .window-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .window-fields {
          display: grid;
          gap: 0.5rem;
        }

        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }

        .schedule-table th,
        .schedule-table td {
          padding: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          text-align: left;
        }

        .schedule-table th {
          background: rgba(255, 255, 255, 0.05);
          font-weight: 600;
        }

        .schedule-table input {
          width: 100%;
          padding: 0.4rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.2);
          color: white;
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


        .nlp-chatbot-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .chatbot-header h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          color: white;
        }

        .chatbot-subtitle {
          margin: 0;
          opacity: 0.9;
          color: white;
        }

        .chatbot-container {
          margin-top: 1.5rem;
        }

        .chatbot-input-area {
          display: flex;
          gap: 1rem;
          align-items: flex-end;
        }

        .chatbot-input {
          flex: 1;
          padding: 1rem;
          border: none;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.95);
          color: #1a202c;
          font-family: inherit;
          font-size: 1rem;
          line-height: 1.5;
          resize: vertical;
        }

        .chatbot-input::placeholder {
          color: rgba(0, 0, 0, 0.4);
          line-height: 1.5;
        }

        .chatbot-submit {
          background: white;
          color: #667eea;
          border: none;
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: transform 0.2s ease;
          white-space: nowrap;
        }

        .chatbot-submit:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .chatbot-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chatbot-response {
          margin-top: 1.5rem;
          padding: 1.5rem;
          border-radius: 6px;
          background: white;
          color: #1a202c;
        }

        .chatbot-response.success {
          border-left: 4px solid #48bb78;
        }

        .chatbot-response.error {
          border-left: 4px solid #f56565;
        }

        .response-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .response-icon {
          font-size: 1.2rem;
        }

        .response-message {
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .response-changes {
          background: rgba(0, 0, 0, 0.05);
          padding: 1rem;
          border-radius: 4px;
        }

        .response-changes h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
        }

        .response-changes ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .response-changes li {
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  );
};

export default ParsedDataReview;
