/**
 * Experiment Designer - Level 8 Editability
 *
 * Visual experiment builder:
 * - Edit AI-suggested experiments
 * - Add custom experiments
 * - Multi-parameter optimization
 * - Define objectives and constraints
 */

import React, { useState } from 'react';
import { useDESModelStore } from '../../store/desModelStore';
import type { Experiment } from '../../types/extraction';
import './ExperimentDesigner.css';

export const ExperimentDesigner: React.FC = () => {
  const {
    extractedSystem,
    addExperiment,
    updateExperiment,
    removeExperiment,
  } = useDESModelStore();

  const [selectedExperiment, setSelectedExperiment] = useState<number | null>(null);
  const [showAddExperiment, setShowAddExperiment] = useState(false);

  if (!extractedSystem) {
    return (
      <div className="experiment-designer empty">
        <p>No system loaded. Extract a system first.</p>
      </div>
    );
  }

  return (
    <div className="experiment-designer">
      <div className="designer-header">
        <h2>EXPERIMENT DESIGNER</h2>
        <button
          className="btn-primary"
          onClick={() => setShowAddExperiment(true)}
        >
          + Add Custom Experiment
        </button>
      </div>

      {/* AI Suggested Experiments */}
      <div className="experiments-section">
        <h3>AI Suggested Experiments</h3>
        <div className="experiments-list">
          {extractedSystem.experiments.map((experiment, idx) => (
            <ExperimentCard
              key={idx}
              experiment={experiment}
              index={idx}
              isSelected={selectedExperiment === idx}
              onSelect={() => setSelectedExperiment(idx)}
              onUpdate={(updates) => updateExperiment(idx, updates)}
              onRemove={() => removeExperiment(idx)}
            />
          ))}

          {extractedSystem.experiments.length === 0 && (
            <p className="empty-message">
              No experiments suggested. Add a custom experiment to begin.
            </p>
          )}
        </div>
      </div>

      {/* Add Custom Experiment Form */}
      {showAddExperiment && (
        <div className="add-experiment-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Custom Experiment</h3>
              <button
                className="close-btn"
                onClick={() => setShowAddExperiment(false)}
              >
                ×
              </button>
            </div>

            <AddExperimentForm
              onAdd={(exp) => {
                addExperiment(exp);
                setShowAddExperiment(false);
              }}
              onCancel={() => setShowAddExperiment(false)}
            />
          </div>
        </div>
      )}

      {/* Experiment Configuration */}
      <div className="experiment-config">
        <h3>Simulation Settings</h3>
        <div className="config-grid">
          <div className="config-item">
            <label>Replications:</label>
            <select defaultValue="auto">
              <option value="auto">Auto-determine (Est: 30)</option>
              <option value="10">10</option>
              <option value="30">30</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <div className="config-item">
            <label>Confidence Level:</label>
            <select defaultValue="95">
              <option value="90">90%</option>
              <option value="95">95%</option>
              <option value="99">99%</option>
            </select>
          </div>
        </div>
      </div>

      {/* Run Actions */}
      <div className="run-actions">
        <button className="btn-secondary">Preview Scenarios</button>
        <button className="btn-primary">Run All Experiments</button>
      </div>
    </div>
  );
};

// ============================================================================
// EXPERIMENT CARD
// ============================================================================

interface ExperimentCardProps {
  experiment: Experiment;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<Experiment>) => void;
  onRemove: () => void;
}

const ExperimentCard: React.FC<ExperimentCardProps> = ({
  experiment,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`experiment-card ${isSelected ? 'selected' : ''}`}>
      <div className="card-header" onClick={onSelect}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          onClick={(e) => e.stopPropagation()}
        />
        <span className="experiment-name">{experiment.name}</span>
        <span className="badge">{experiment.scenario}</span>
        <button
          className="expand-btn"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="card-body">
          <div className="experiment-description">
            <label>Description:</label>
            <textarea
              value={experiment.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="parameters-list">
            <h4>Parameters:</h4>
            {experiment.parameters.map((param, idx) => (
              <div key={idx} className="parameter-item">
                <div className="param-info">
                  <strong>{param.name}</strong>
                  <span className="param-type">{param.type}</span>
                </div>
                <div className="param-values">
                  <span>Baseline: {param.baselineValue}</span>
                  <span>Test: {param.testValues.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="card-actions">
            <button className="btn-edit">Edit Parameters</button>
            <button className="btn-delete" onClick={onRemove}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ADD EXPERIMENT FORM
// ============================================================================

interface AddExperimentFormProps {
  onAdd: (experiment: Experiment) => void;
  onCancel: () => void;
}

const AddExperimentForm: React.FC<AddExperimentFormProps> = ({
  onAdd,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scenario, setScenario] = useState<'what_if' | 'optimization' | 'sensitivity'>('what_if');

  const handleSubmit = () => {
    const newExperiment: Experiment = {
      name,
      description,
      scenario,
      parameters: [],
      warmupPeriod: 0,
      warmupUnit: 'hours',
      runLength: 8,
      runLengthUnit: 'hours',
      replications: 30,
    };

    onAdd(newExperiment);
  };

  return (
    <div className="add-experiment-form">
      <div className="form-group">
        <label>Experiment Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Optimize Resource Capacity"
        />
      </div>

      <div className="form-group">
        <label>Description:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this experiment will test..."
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>Experiment Type:</label>
        <select value={scenario} onChange={(e) => setScenario(e.target.value as any)}>
          <option value="what_if">What-If Analysis</option>
          <option value="optimization">Optimization</option>
          <option value="sensitivity">Sensitivity Analysis</option>
        </select>
      </div>

      <div className="form-actions">
        <button className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!name || !description}
        >
          Add Experiment
        </button>
      </div>
    </div>
  );
};
