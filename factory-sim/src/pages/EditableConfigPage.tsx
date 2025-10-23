/**
 * EDITABLE CONFIGURATION PAGE
 *
 * End-to-end editable interface for all parsed system data
 * Appears after AI parsing, before simulation
 */

import React, { useState } from 'react';
import { ExtractedSystem } from '../types/extraction';
import './EditableConfigPage.css';

interface EditableConfigPageProps {
  system: ExtractedSystem;
  onSave: (updatedSystem: ExtractedSystem) => void;
  onCancel: () => void;
}

type EditMode = 'overview' | 'entities' | 'resources' | 'processes' | 'routing' | 'distributions' | 'kpis';

export const EditableConfigPage: React.FC<EditableConfigPageProps> = ({ system, onSave, onCancel }) => {
  const [editedSystem, setEditedSystem] = useState<ExtractedSystem>(JSON.parse(JSON.stringify(system)));
  const [mode, setMode] = useState<EditMode>('overview');
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (path: string[], value: any) => {
    setEditedSystem(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      let current: any = updated;

      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }

      current[path[path.length - 1]] = value;
      setHasChanges(true);
      return updated;
    });
  };

  const handleArrayAdd = (path: string[], newItem: any) => {
    setEditedSystem(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      let current: any = updated;

      for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
      }

      if (Array.isArray(current)) {
        current.push(newItem);
      }

      setHasChanges(true);
      return updated;
    });
  };

  const handleArrayRemove = (path: string[], index: number) => {
    setEditedSystem(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      let current: any = updated;

      for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
      }

      if (Array.isArray(current)) {
        current.splice(index, 1);
      }

      setHasChanges(true);
      return updated;
    });
  };

  const handleSave = () => {
    onSave(editedSystem);
  };

  const handleReset = () => {
    setEditedSystem(JSON.parse(JSON.stringify(system)));
    setHasChanges(false);
  };

  return (
    <div className="editable-config-page">
      {/* Header */}
      <div className="config-header">
        <div className="config-header__title">
          <h1>📝 Edit System Configuration</h1>
          <p className="config-header__subtitle">
            Review and modify all parsed data before simulation
          </p>
        </div>

        <div className="config-header__actions">
          {hasChanges && (
            <button className="config-btn config-btn--secondary" onClick={handleReset}>
              ↺ Reset Changes
            </button>
          )}
          <button className="config-btn config-btn--secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="config-btn config-btn--primary" onClick={handleSave}>
            ✓ Save & Continue to Simulation
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="config-nav">
        <button
          className={`config-nav__tab ${mode === 'overview' ? 'active' : ''}`}
          onClick={() => setMode('overview')}
        >
          📋 Overview
        </button>
        <button
          className={`config-nav__tab ${mode === 'entities' ? 'active' : ''}`}
          onClick={() => setMode('entities')}
        >
          📦 Entities ({editedSystem.entities?.length || 0})
        </button>
        <button
          className={`config-nav__tab ${mode === 'resources' ? 'active' : ''}`}
          onClick={() => setMode('resources')}
        >
          🏭 Resources ({editedSystem.resources?.length || 0})
        </button>
        <button
          className={`config-nav__tab ${mode === 'processes' ? 'active' : ''}`}
          onClick={() => setMode('processes')}
        >
          ⚙️ Processes ({editedSystem.processes?.length || 0})
        </button>
        <button
          className={`config-nav__tab ${mode === 'routing' ? 'active' : ''}`}
          onClick={() => setMode('routing')}
        >
          🔀 Routing
        </button>
        <button
          className={`config-nav__tab ${mode === 'distributions' ? 'active' : ''}`}
          onClick={() => setMode('distributions')}
        >
          📊 Distributions
        </button>
        <button
          className={`config-nav__tab ${mode === 'kpis' ? 'active' : ''}`}
          onClick={() => setMode('kpis')}
        >
          📈 KPIs ({editedSystem.kpis?.length || 0})
        </button>
      </div>

      {/* Content Area */}
      <div className="config-content">
        {mode === 'overview' && (
          <OverviewEditor system={editedSystem} onChange={handleChange} />
        )}
        {mode === 'entities' && (
          <EntitiesEditor
            entities={editedSystem.entities || []}
            onChange={handleChange}
            onAdd={handleArrayAdd}
            onRemove={handleArrayRemove}
          />
        )}
        {mode === 'resources' && (
          <ResourcesEditor
            resources={editedSystem.resources || []}
            onChange={handleChange}
            onAdd={handleArrayAdd}
            onRemove={handleArrayRemove}
          />
        )}
        {mode === 'processes' && (
          <ProcessesEditor
            processes={editedSystem.processes || []}
            onChange={handleChange}
            onAdd={handleArrayAdd}
            onRemove={handleArrayRemove}
          />
        )}
        {mode === 'routing' && (
          <RoutingEditor system={editedSystem} onChange={handleChange} />
        )}
        {mode === 'distributions' && (
          <DistributionsEditor system={editedSystem} onChange={handleChange} />
        )}
        {mode === 'kpis' && (
          <KPIsEditor
            kpis={editedSystem.kpis || []}
            onChange={handleChange}
            onAdd={handleArrayAdd}
            onRemove={handleArrayRemove}
          />
        )}
      </div>

      {/* Status Bar */}
      {hasChanges && (
        <div className="config-status-bar">
          ⚠️ You have unsaved changes
        </div>
      )}
    </div>
  );
};

// ============================================================================
// OVERVIEW EDITOR
// ============================================================================

interface OverviewEditorProps {
  system: ExtractedSystem;
  onChange: (path: string[], value: any) => void;
}

const OverviewEditor: React.FC<OverviewEditorProps> = ({ system, onChange }) => {
  return (
    <div className="editor-section">
      <h2>System Overview</h2>

      <div className="form-grid">
        <div className="form-group">
          <label>System Name</label>
          <input
            type="text"
            value={system.systemName || ''}
            onChange={(e) => onChange(['systemName'], e.target.value)}
            placeholder="Enter system name"
          />
        </div>

        <div className="form-group">
          <label>System Type</label>
          <select
            value={system.systemType || 'manufacturing'}
            onChange={(e) => onChange(['systemType'], e.target.value)}
          >
            <option value="manufacturing">Manufacturing</option>
            <option value="service">Service</option>
            <option value="logistics">Logistics</option>
            <option value="healthcare">Healthcare</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group full-width">
          <label>Description</label>
          <textarea
            value={system.description || ''}
            onChange={(e) => onChange(['description'], e.target.value)}
            rows={3}
            placeholder="System description"
          />
        </div>

        <div className="form-group">
          <label>Simulation Duration (hours)</label>
          <input
            type="number"
            value={system.simulationDuration || 8}
            onChange={(e) => onChange(['simulationDuration'], parseFloat(e.target.value))}
            min="0.1"
            step="0.1"
          />
        </div>

        <div className="form-group">
          <label>Warmup Period (hours)</label>
          <input
            type="number"
            value={system.warmupPeriod || 0}
            onChange={(e) => onChange(['warmupPeriod'], parseFloat(e.target.value))}
            min="0"
            step="0.1"
          />
        </div>

        <div className="form-group">
          <label>Number of Replications</label>
          <input
            type="number"
            value={system.replications || 1}
            onChange={(e) => onChange(['replications'], parseInt(e.target.value))}
            min="1"
          />
        </div>

        <div className="form-group">
          <label>Random Seed</label>
          <input
            type="number"
            value={system.randomSeed || 12345}
            onChange={(e) => onChange(['randomSeed'], parseInt(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ENTITIES EDITOR
// ============================================================================

interface EntitiesEditorProps {
  entities: any[];
  onChange: (path: string[], value: any) => void;
  onAdd: (path: string[], newItem: any) => void;
  onRemove: (path: string[], index: number) => void;
}

const EntitiesEditor: React.FC<EntitiesEditorProps> = ({ entities, onChange, onAdd, onRemove }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleAddEntity = () => {
    onAdd(['entities'], {
      name: 'NewEntity',
      type: 'product',
      attributes: {},
      arrivalRate: 10,
      arrivalDistribution: 'exponential'
    });
  };

  return (
    <div className="editor-section">
      <div className="section-header">
        <h2>Entities</h2>
        <button className="config-btn config-btn--small" onClick={handleAddEntity}>
          + Add Entity
        </button>
      </div>

      {entities.length === 0 ? (
        <div className="empty-state">
          <p>No entities defined. Click "Add Entity" to create one.</p>
        </div>
      ) : (
        <div className="items-list">
          {entities.map((entity, index) => (
            <div key={index} className="item-card">
              <div className="item-card__header" onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}>
                <h3>{entity.name || `Entity ${index + 1}`}</h3>
                <div className="item-card__actions">
                  <button
                    className="config-btn config-btn--danger config-btn--small"
                    onClick={(e) => { e.stopPropagation(); onRemove(['entities'], index); }}
                  >
                    Delete
                  </button>
                  <span className="expand-icon">{expandedIndex === index ? '▼' : '▶'}</span>
                </div>
              </div>

              {expandedIndex === index && (
                <div className="item-card__content">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        value={entity.name || ''}
                        onChange={(e) => onChange(['entities', index, 'name'], e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Type</label>
                      <input
                        type="text"
                        value={entity.type || ''}
                        onChange={(e) => onChange(['entities', index, 'type'], e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Arrival Rate (/hour)</label>
                      <input
                        type="number"
                        value={entity.arrivalRate || 0}
                        onChange={(e) => onChange(['entities', index, 'arrivalRate'], parseFloat(e.target.value))}
                        step="0.1"
                      />
                    </div>

                    <div className="form-group">
                      <label>Arrival Distribution</label>
                      <select
                        value={entity.arrivalDistribution || 'exponential'}
                        onChange={(e) => onChange(['entities', index, 'arrivalDistribution'], e.target.value)}
                      >
                        <option value="exponential">Exponential</option>
                        <option value="constant">Constant</option>
                        <option value="uniform">Uniform</option>
                        <option value="normal">Normal</option>
                        <option value="triangular">Triangular</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Priority</label>
                      <input
                        type="number"
                        value={entity.priority || 0}
                        onChange={(e) => onChange(['entities', index, 'priority'], parseInt(e.target.value))}
                      />
                    </div>

                    <div className="form-group">
                      <label>Initial Inventory</label>
                      <input
                        type="number"
                        value={entity.initialInventory || 0}
                        onChange={(e) => onChange(['entities', index, 'initialInventory'], parseInt(e.target.value))}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// RESOURCES EDITOR
// ============================================================================

interface ResourcesEditorProps {
  resources: any[];
  onChange: (path: string[], value: any) => void;
  onAdd: (path: string[], newItem: any) => void;
  onRemove: (path: string[], index: number) => void;
}

const ResourcesEditor: React.FC<ResourcesEditorProps> = ({ resources, onChange, onAdd, onRemove }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleAddResource = () => {
    onAdd(['resources'], {
      name: 'NewResource',
      type: 'machine',
      capacity: 1,
      initialCapacity: 1,
      schedules: []
    });
  };

  return (
    <div className="editor-section">
      <div className="section-header">
        <h2>Resources</h2>
        <button className="config-btn config-btn--small" onClick={handleAddResource}>
          + Add Resource
        </button>
      </div>

      {resources.length === 0 ? (
        <div className="empty-state">
          <p>No resources defined. Click "Add Resource" to create one.</p>
        </div>
      ) : (
        <div className="items-list">
          {resources.map((resource, index) => (
            <div key={index} className="item-card">
              <div className="item-card__header" onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}>
                <h3>{resource.name || `Resource ${index + 1}`}</h3>
                <div className="item-card__actions">
                  <button
                    className="config-btn config-btn--danger config-btn--small"
                    onClick={(e) => { e.stopPropagation(); onRemove(['resources'], index); }}
                  >
                    Delete
                  </button>
                  <span className="expand-icon">{expandedIndex === index ? '▼' : '▶'}</span>
                </div>
              </div>

              {expandedIndex === index && (
                <div className="item-card__content">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        value={resource.name || ''}
                        onChange={(e) => onChange(['resources', index, 'name'], e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Type</label>
                      <select
                        value={resource.type || 'machine'}
                        onChange={(e) => onChange(['resources', index, 'type'], e.target.value)}
                      >
                        <option value="machine">Machine</option>
                        <option value="worker">Worker</option>
                        <option value="conveyor">Conveyor</option>
                        <option value="buffer">Buffer</option>
                        <option value="transporter">Transporter</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Capacity</label>
                      <input
                        type="number"
                        value={resource.capacity || 1}
                        onChange={(e) => onChange(['resources', index, 'capacity'], parseInt(e.target.value))}
                        min="1"
                      />
                    </div>

                    <div className="form-group">
                      <label>Initial Capacity</label>
                      <input
                        type="number"
                        value={resource.initialCapacity || resource.capacity || 1}
                        onChange={(e) => onChange(['resources', index, 'initialCapacity'], parseInt(e.target.value))}
                        min="0"
                      />
                    </div>

                    <div className="form-group">
                      <label>Cost per Hour</label>
                      <input
                        type="number"
                        value={resource.costPerHour || 0}
                        onChange={(e) => onChange(['resources', index, 'costPerHour'], parseFloat(e.target.value))}
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div className="form-group">
                      <label>Failure Rate (failures/hour)</label>
                      <input
                        type="number"
                        value={resource.failureRate || 0}
                        onChange={(e) => onChange(['resources', index, 'failureRate'], parseFloat(e.target.value))}
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div className="form-group">
                      <label>Repair Time (hours)</label>
                      <input
                        type="number"
                        value={resource.repairTime || 0}
                        onChange={(e) => onChange(['resources', index, 'repairTime'], parseFloat(e.target.value))}
                        step="0.1"
                        min="0"
                      />
                    </div>

                    <div className="form-group">
                      <label>Queue Discipline</label>
                      <select
                        value={resource.queueDiscipline || 'FIFO'}
                        onChange={(e) => onChange(['resources', index, 'queueDiscipline'], e.target.value)}
                      >
                        <option value="FIFO">FIFO (First In First Out)</option>
                        <option value="LIFO">LIFO (Last In First Out)</option>
                        <option value="PRIORITY">Priority</option>
                        <option value="SPT">SPT (Shortest Processing Time)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PROCESSES EDITOR
// ============================================================================

interface ProcessesEditorProps {
  processes: any[];
  onChange: (path: string[], value: any) => void;
  onAdd: (path: string[], newItem: any) => void;
  onRemove: (path: string[], index: number) => void;
}

const ProcessesEditor: React.FC<ProcessesEditorProps> = ({ processes, onChange, onAdd, onRemove }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleAddProcess = () => {
    onAdd(['processes'], {
      name: 'NewProcess',
      resourceName: '',
      processingTime: 1.0,
      processingTimeDistribution: 'exponential',
      setupTime: 0,
      teardownTime: 0
    });
  };

  return (
    <div className="editor-section">
      <div className="section-header">
        <h2>Processes</h2>
        <button className="config-btn config-btn--small" onClick={handleAddProcess}>
          + Add Process
        </button>
      </div>

      {processes.length === 0 ? (
        <div className="empty-state">
          <p>No processes defined. Click "Add Process" to create one.</p>
        </div>
      ) : (
        <div className="items-list">
          {processes.map((process, index) => (
            <div key={index} className="item-card">
              <div className="item-card__header" onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}>
                <h3>{process.name || `Process ${index + 1}`}</h3>
                <div className="item-card__actions">
                  <button
                    className="config-btn config-btn--danger config-btn--small"
                    onClick={(e) => { e.stopPropagation(); onRemove(['processes'], index); }}
                  >
                    Delete
                  </button>
                  <span className="expand-icon">{expandedIndex === index ? '▼' : '▶'}</span>
                </div>
              </div>

              {expandedIndex === index && (
                <div className="item-card__content">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        value={process.name || ''}
                        onChange={(e) => onChange(['processes', index, 'name'], e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Resource Name</label>
                      <input
                        type="text"
                        value={process.resourceName || ''}
                        onChange={(e) => onChange(['processes', index, 'resourceName'], e.target.value)}
                        placeholder="Resource to use"
                      />
                    </div>

                    <div className="form-group">
                      <label>Processing Time (hours)</label>
                      <input
                        type="number"
                        value={process.processingTime || 1}
                        onChange={(e) => onChange(['processes', index, 'processingTime'], parseFloat(e.target.value))}
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div className="form-group">
                      <label>Processing Distribution</label>
                      <select
                        value={process.processingTimeDistribution || 'exponential'}
                        onChange={(e) => onChange(['processes', index, 'processingTimeDistribution'], e.target.value)}
                      >
                        <option value="constant">Constant</option>
                        <option value="exponential">Exponential</option>
                        <option value="uniform">Uniform</option>
                        <option value="normal">Normal</option>
                        <option value="triangular">Triangular</option>
                        <option value="lognormal">Lognormal</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Setup Time (hours)</label>
                      <input
                        type="number"
                        value={process.setupTime || 0}
                        onChange={(e) => onChange(['processes', index, 'setupTime'], parseFloat(e.target.value))}
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div className="form-group">
                      <label>Teardown Time (hours)</label>
                      <input
                        type="number"
                        value={process.teardownTime || 0}
                        onChange={(e) => onChange(['processes', index, 'teardownTime'], parseFloat(e.target.value))}
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div className="form-group">
                      <label>Batch Size</label>
                      <input
                        type="number"
                        value={process.batchSize || 1}
                        onChange={(e) => onChange(['processes', index, 'batchSize'], parseInt(e.target.value))}
                        min="1"
                      />
                    </div>

                    <div className="form-group">
                      <label>Yield (%)</label>
                      <input
                        type="number"
                        value={process.yield || 100}
                        onChange={(e) => onChange(['processes', index, 'yield'], parseFloat(e.target.value))}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ROUTING EDITOR
// ============================================================================

interface RoutingEditorProps {
  system: ExtractedSystem;
  onChange: (path: string[], value: any) => void;
}

const RoutingEditor: React.FC<RoutingEditorProps> = ({ system, onChange }) => {
  return (
    <div className="editor-section">
      <h2>Routing Configuration</h2>
      <p className="section-description">Define how entities flow through the system</p>

      <div className="form-group full-width">
        <label>Routing JSON</label>
        <textarea
          value={JSON.stringify(system.routing || {}, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onChange(['routing'], parsed);
            } catch (err) {
              // Invalid JSON, don't update
            }
          }}
          rows={15}
          className="json-editor"
          placeholder='{"paths": [], "rules": []}'
        />
      </div>
    </div>
  );
};

// ============================================================================
// DISTRIBUTIONS EDITOR
// ============================================================================

interface DistributionsEditorProps {
  system: ExtractedSystem;
  onChange: (path: string[], value: any) => void;
}

const DistributionsEditor: React.FC<DistributionsEditorProps> = ({ system, onChange }) => {
  return (
    <div className="editor-section">
      <h2>Statistical Distributions</h2>
      <p className="section-description">Configure probability distributions for stochastic elements</p>

      <div className="form-group full-width">
        <label>Distributions JSON</label>
        <textarea
          value={JSON.stringify(system.distributions || {}, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onChange(['distributions'], parsed);
            } catch (err) {
              // Invalid JSON, don't update
            }
          }}
          rows={15}
          className="json-editor"
          placeholder='{"interarrival": {}, "processing": {}}'
        />
      </div>
    </div>
  );
};

// ============================================================================
// KPIs EDITOR
// ============================================================================

interface KPIsEditorProps {
  kpis: any[];
  onChange: (path: string[], value: any) => void;
  onAdd: (path: string[], newItem: any) => void;
  onRemove: (path: string[], index: number) => void;
}

const KPIsEditor: React.FC<KPIsEditorProps> = ({ kpis, onChange, onAdd, onRemove }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleAddKPI = () => {
    onAdd(['kpis'], {
      name: 'NewKPI',
      type: 'throughput',
      target: 100,
      unit: 'units/hour'
    });
  };

  return (
    <div className="editor-section">
      <div className="section-header">
        <h2>Key Performance Indicators (KPIs)</h2>
        <button className="config-btn config-btn--small" onClick={handleAddKPI}>
          + Add KPI
        </button>
      </div>

      {kpis.length === 0 ? (
        <div className="empty-state">
          <p>No KPIs defined. Click "Add KPI" to create one.</p>
        </div>
      ) : (
        <div className="items-list">
          {kpis.map((kpi, index) => (
            <div key={index} className="item-card">
              <div className="item-card__header" onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}>
                <h3>{kpi.name || `KPI ${index + 1}`}</h3>
                <div className="item-card__actions">
                  <button
                    className="config-btn config-btn--danger config-btn--small"
                    onClick={(e) => { e.stopPropagation(); onRemove(['kpis'], index); }}
                  >
                    Delete
                  </button>
                  <span className="expand-icon">{expandedIndex === index ? '▼' : '▶'}</span>
                </div>
              </div>

              {expandedIndex === index && (
                <div className="item-card__content">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        value={kpi.name || ''}
                        onChange={(e) => onChange(['kpis', index, 'name'], e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Type</label>
                      <select
                        value={kpi.type || 'throughput'}
                        onChange={(e) => onChange(['kpis', index, 'type'], e.target.value)}
                      >
                        <option value="throughput">Throughput</option>
                        <option value="utilization">Utilization</option>
                        <option value="cycleTime">Cycle Time</option>
                        <option value="wip">Work in Progress</option>
                        <option value="cost">Cost</option>
                        <option value="quality">Quality</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Target Value</label>
                      <input
                        type="number"
                        value={kpi.target || 0}
                        onChange={(e) => onChange(['kpis', index, 'target'], parseFloat(e.target.value))}
                        step="0.1"
                      />
                    </div>

                    <div className="form-group">
                      <label>Unit</label>
                      <input
                        type="text"
                        value={kpi.unit || ''}
                        onChange={(e) => onChange(['kpis', index, 'unit'], e.target.value)}
                        placeholder="e.g., units/hour, %, minutes"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
