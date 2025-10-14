/**
 * Specification Editor - Level 1 Editability
 *
 * Review and edit AI-extracted system specification
 * - Inline editing of all fields
 * - Add/remove entities, resources, processes
 * - Visual confidence indicators
 * - Approval workflow
 */

import React, { useState } from 'react';
import { useDESModelStore } from '../../store/desModelStore';
import type { Entity, Resource, Process, Distribution } from '../../types/extraction';
import './SpecificationEditor.css';

export const SpecificationEditor: React.FC = () => {
  const {
    extractedSystem,
    updateEntity,
    addEntity,
    removeEntity,
    updateResource,
    addResource,
    removeResource,
    updateProcess,
    addProcess,
    removeProcess,
    aiConfidence,
  } = useDESModelStore();

  const [expandedSection, setExpandedSection] = useState<string | null>('entities');

  if (!extractedSystem) {
    return (
      <div className="spec-editor empty">
        <p>No system extracted yet. Upload a document to begin.</p>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="spec-editor">
      <div className="spec-header">
        <h2>EXTRACTED SYSTEM SPECIFICATION</h2>
        <div className="system-info">
          <div className="system-name">{extractedSystem.systemName}</div>
          <div className="system-type">{extractedSystem.systemType}</div>
        </div>
        <div className="confidence-bar">
          <span>AI Confidence:</span>
          <div className="bar">
            <div
              className="fill"
              style={{ width: `${aiConfidence * 100}%` }}
            />
          </div>
          <span>{(aiConfidence * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* ENTITIES SECTION */}
      <div className="spec-section">
        <div
          className="section-header"
          onClick={() => toggleSection('entities')}
        >
          <h3>ENTITIES</h3>
          <span className="count">{extractedSystem.entities.length}</span>
          <button className="expand-btn">
            {expandedSection === 'entities' ? '▼' : '▶'}
          </button>
        </div>

        {expandedSection === 'entities' && (
          <div className="section-content">
            {extractedSystem.entities.map((entity, idx) => (
              <EntityCard
                key={idx}
                entity={entity}
                index={idx}
                onUpdate={(updates) => updateEntity(idx, updates)}
                onRemove={() => removeEntity(idx)}
              />
            ))}
            <button
              className="add-btn"
              onClick={() =>
                addEntity({
                  name: 'New Entity',
                  type: 'custom',
                  arrivalPattern: {
                    type: 'poisson',
                    rate: 10,
                    rateUnit: 'per_hour',
                  },
                  attributes: [],
                })
              }
            >
              + Add Entity
            </button>
          </div>
        )}
      </div>

      {/* RESOURCES SECTION */}
      <div className="spec-section">
        <div
          className="section-header"
          onClick={() => toggleSection('resources')}
        >
          <h3>RESOURCES</h3>
          <span className="count">{extractedSystem.resources.length}</span>
          <button className="expand-btn">
            {expandedSection === 'resources' ? '▼' : '▶'}
          </button>
        </div>

        {expandedSection === 'resources' && (
          <div className="section-content">
            {extractedSystem.resources.map((resource, idx) => (
              <ResourceCard
                key={idx}
                resource={resource}
                index={idx}
                onUpdate={(updates) => updateResource(idx, updates)}
                onRemove={() => removeResource(idx)}
              />
            ))}
            <button
              className="add-btn"
              onClick={() =>
                addResource({
                  name: 'New Resource',
                  type: 'server',
                  capacity: 1,
                })
              }
            >
              + Add Resource
            </button>
          </div>
        )}
      </div>

      {/* PROCESSES SECTION */}
      <div className="spec-section">
        <div
          className="section-header"
          onClick={() => toggleSection('processes')}
        >
          <h3>PROCESSES</h3>
          <span className="count">{extractedSystem.processes.length}</span>
          <button className="expand-btn">
            {expandedSection === 'processes' ? '▼' : '▶'}
          </button>
        </div>

        {expandedSection === 'processes' && (
          <div className="section-content">
            {extractedSystem.processes.map((process, idx) => (
              <ProcessCard
                key={idx}
                process={process}
                index={idx}
                onUpdate={(updates) => updateProcess(idx, updates)}
                onRemove={() => removeProcess(idx)}
              />
            ))}
            <button
              className="add-btn"
              onClick={() =>
                addProcess({
                  name: 'New Process',
                  entityType: 'customer',
                  sequence: [],
                  routingLogic: 'sequential',
                })
              }
            >
              + Add Process
            </button>
          </div>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div className="spec-actions">
        <button className="btn-primary">✓ Approve All</button>
        <button className="btn-secondary">▶ Generate Model</button>
      </div>
    </div>
  );
};

// ============================================================================
// ENTITY CARD
// ============================================================================

interface EntityCardProps {
  entity: Entity;
  index: number;
  onUpdate: (updates: Partial<Entity>) => void;
  onRemove: () => void;
}

const EntityCard: React.FC<EntityCardProps> = ({
  entity,
  onUpdate,
  onRemove,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="card entity-card">
      <div className="card-header">
        <input
          type="text"
          className="editable-title"
          value={entity.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
        <select
          className="badge small"
          value={entity.type}
          onChange={(e) => onUpdate({ type: e.target.value as any })}
        >
          <option value="customer">Customer</option>
          <option value="part">Part</option>
          <option value="vehicle">Vehicle</option>
          <option value="order">Order</option>
          <option value="custom">Custom</option>
        </select>
        <button className="btn-icon edit" onClick={() => setIsEditing(!isEditing)}>
          ✏️
        </button>
        <button className="btn-icon delete" onClick={onRemove}>
          🗑️
        </button>
      </div>

      <div className="card-content">
        <div className="property">
          <label>Arrival Pattern:</label>
          <select
            value={entity.arrivalPattern?.type || 'poisson'}
            onChange={(e) =>
              onUpdate({
                arrivalPattern: {
                  ...entity.arrivalPattern,
                  type: e.target.value as any,
                },
              })
            }
          >
            <option value="poisson">Poisson</option>
            <option value="nonhomogeneous">Non-homogeneous</option>
            <option value="scheduled">Scheduled</option>
            <option value="batch">Batch</option>
            <option value="deterministic">Deterministic</option>
          </select>
        </div>

        {entity.arrivalPattern?.type === 'poisson' && (
          <>
            <div className="property">
              <label>Rate:</label>
              <input
                type="number"
                value={entity.arrivalPattern.rate || 0}
                onChange={(e) =>
                  onUpdate({
                    arrivalPattern: {
                      ...entity.arrivalPattern,
                      rate: parseFloat(e.target.value),
                    },
                  })
                }
              />
              <select
                value={entity.arrivalPattern.rateUnit || 'per_hour'}
                onChange={(e) =>
                  onUpdate({
                    arrivalPattern: {
                      ...entity.arrivalPattern,
                      rateUnit: e.target.value as any,
                    },
                  })
                }
              >
                <option value="per_hour">per hour</option>
                <option value="per_day">per day</option>
                <option value="per_week">per week</option>
              </select>
            </div>
          </>
        )}

        {isEditing && (
          <div className="advanced-properties">
            <div className="property">
              <label>Description:</label>
              <textarea
                value={entity.description || ''}
                onChange={(e) => onUpdate({ description: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// RESOURCE CARD
// ============================================================================

interface ResourceCardProps {
  resource: Resource;
  index: number;
  onUpdate: (updates: Partial<Resource>) => void;
  onRemove: () => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onUpdate,
  onRemove,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="card resource-card">
      <div className="card-header">
        <input
          type="text"
          className="editable-title"
          value={resource.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
        <select
          className="badge small"
          value={resource.type}
          onChange={(e) => onUpdate({ type: e.target.value as any })}
        >
          <option value="server">Server</option>
          <option value="machine">Machine</option>
          <option value="worker">Worker</option>
          <option value="conveyor">Conveyor</option>
          <option value="storage">Storage</option>
          <option value="custom">Custom</option>
        </select>
        <button className="btn-icon edit" onClick={() => setIsEditing(!isEditing)}>
          ✏️
        </button>
        <button className="btn-icon delete" onClick={onRemove}>
          🗑️
        </button>
      </div>

      <div className="card-content">
        <div className="property">
          <label>Capacity:</label>
          <input
            type="number"
            value={resource.capacity}
            onChange={(e) => onUpdate({ capacity: parseInt(e.target.value) })}
            min={1}
          />
        </div>

        {resource.processingTime && (
          <div className="property">
            <label>Processing Time:</label>
            <DistributionEditor
              distribution={resource.processingTime}
              onChange={(dist) => onUpdate({ processingTime: dist })}
            />
          </div>
        )}

        {isEditing && (
          <div className="advanced-properties">
            <div className="property">
              <label>Cost per Hour:</label>
              <input
                type="number"
                value={resource.costPerHour || 0}
                onChange={(e) =>
                  onUpdate({ costPerHour: parseFloat(e.target.value) })
                }
                step={0.01}
              />
            </div>
            <div className="property">
              <label>Description:</label>
              <textarea
                value={resource.description || ''}
                onChange={(e) => onUpdate({ description: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// PROCESS CARD
// ============================================================================

interface ProcessCardProps {
  process: Process;
  index: number;
  onUpdate: (updates: Partial<Process>) => void;
  onRemove: () => void;
}

const ProcessCard: React.FC<ProcessCardProps> = ({
  process,
  onUpdate,
  onRemove,
}) => {
  return (
    <div className="card process-card">
      <div className="card-header">
        <input
          type="text"
          className="editable-title"
          value={process.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
        <span className="badge small">{process.sequence.length} steps</span>
        <button className="btn-icon delete" onClick={onRemove}>
          🗑️
        </button>
      </div>

      <div className="card-content">
        <div className="property">
          <label>Entity Type:</label>
          <input
            type="text"
            value={process.entityType}
            onChange={(e) => onUpdate({ entityType: e.target.value })}
          />
        </div>

        <div className="property">
          <label>Routing Logic:</label>
          <select
            value={process.routingLogic}
            onChange={(e) => onUpdate({ routingLogic: e.target.value as any })}
          >
            <option value="sequential">Sequential</option>
            <option value="conditional">Conditional</option>
            <option value="probabilistic">Probabilistic</option>
            <option value="parallel">Parallel</option>
            <option value="cyclic">Cyclic</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DISTRIBUTION EDITOR (Inline)
// ============================================================================

interface DistributionEditorProps {
  distribution: Distribution;
  onChange: (dist: Distribution) => void;
}

const DistributionEditor: React.FC<DistributionEditorProps> = ({
  distribution,
  onChange,
}) => {
  return (
    <div className="distribution-inline">
      <select
        value={distribution.type}
        onChange={(e) =>
          onChange({ ...distribution, type: e.target.value as any })
        }
      >
        <option value="constant">Constant</option>
        <option value="normal">Normal</option>
        <option value="exponential">Exponential</option>
        <option value="uniform">Uniform</option>
        <option value="triangular">Triangular</option>
      </select>

      {distribution.type === 'constant' && (
        <input
          type="number"
          value={distribution.parameters.value || 0}
          onChange={(e) =>
            onChange({
              ...distribution,
              parameters: { value: parseFloat(e.target.value) },
            })
          }
          step={0.1}
        />
      )}

      {distribution.type === 'uniform' && (
        <>
          <input
            type="number"
            placeholder="Min"
            value={distribution.parameters.min || 0}
            onChange={(e) =>
              onChange({
                ...distribution,
                parameters: {
                  ...distribution.parameters,
                  min: parseFloat(e.target.value),
                },
              })
            }
            step={0.1}
          />
          <input
            type="number"
            placeholder="Max"
            value={distribution.parameters.max || 0}
            onChange={(e) =>
              onChange({
                ...distribution,
                parameters: {
                  ...distribution.parameters,
                  max: parseFloat(e.target.value),
                },
              })
            }
            step={0.1}
          />
        </>
      )}

      {distribution.type === 'normal' && (
        <>
          <input
            type="number"
            placeholder="Mean"
            value={distribution.parameters.mean || 0}
            onChange={(e) =>
              onChange({
                ...distribution,
                parameters: {
                  ...distribution.parameters,
                  mean: parseFloat(e.target.value),
                },
              })
            }
            step={0.1}
          />
          <input
            type="number"
            placeholder="Std Dev"
            value={distribution.parameters.stdDev || 0}
            onChange={(e) =>
              onChange({
                ...distribution,
                parameters: {
                  ...distribution.parameters,
                  stdDev: parseFloat(e.target.value),
                },
              })
            }
            step={0.1}
          />
        </>
      )}

      <span className="unit">{distribution.unit}</span>
    </div>
  );
};
