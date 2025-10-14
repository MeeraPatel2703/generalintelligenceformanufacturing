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
import { IndustrialSimulationAdapter } from '../../des-core/IndustrialSimulationAdapter';
import './SpecificationEditor.css';
import '../../styles/industrial-theme.css';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

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

  const handleGenerateModel = async () => {
    if (!extractedSystem) return;
    
    setIsGenerating(true);
    try {
      console.log('[SpecEditor] Generating SIMIO-GRADE DES model from specification...');
      
      // Create simulator with the current specification
      const simulator = new IndustrialSimulationAdapter(extractedSystem);
      
      // Run simulation for 100 time units
      simulator.run(100);
      
      // ✨ Get COMPREHENSIVE SIMIO-GRADE METRICS (all 6 categories!)
      const comprehensiveMetrics = simulator.getComprehensiveMetrics();
      
      console.log('[SpecEditor] Simulation complete with comprehensive metrics:', comprehensiveMetrics);
      setSimulationResult(comprehensiveMetrics);
      setShowResults(true);
    } catch (error) {
      console.error('[SpecEditor] Generation failed:', error);
      alert(`Failed to generate model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveAll = () => {
    console.log('[SpecEditor] Approving all specifications');
    alert('Specification approved! All changes saved.');
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
      <div className="spec-actions" style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
        <button 
          className="industrial-button industrial-button--secondary"
          onClick={handleApproveAll}
        >
          ✓ APPROVE ALL
        </button>
        <button 
          className="industrial-button industrial-button--primary"
          onClick={handleGenerateModel}
          disabled={isGenerating}
        >
          {isGenerating ? '⟳ GENERATING...' : '▶ GENERATE MODEL'}
        </button>
      </div>

      {/* SIMULATION RESULTS MODAL - SIMIO-GRADE COMPREHENSIVE METRICS */}
      {showResults && simulationResult && (
        <div className="industrial-modal-overlay" onClick={() => setShowResults(false)}>
          <div className="industrial-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1200px' }}>
            <div className="industrial-modal__header">
              <h2>COMPREHENSIVE SIMULATION RESULTS</h2>
              <button 
                className="industrial-button industrial-button--secondary"
                onClick={() => setShowResults(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="industrial-modal__content">
              <div className="industrial-status industrial-status--success" style={{ marginBottom: '1.5rem' }}>
                <span className="industrial-status__indicator"></span>
                SIMIO-GRADE MODEL GENERATED & ANALYZED
              </div>

              {/* ========== THROUGHPUT METRICS ========== */}
              <h3 style={{ 
                marginTop: '1.5rem', 
                marginBottom: '1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                color: 'var(--color-text-primary)',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: '0.5rem'
              }}>
                📊 THROUGHPUT PERFORMANCE
              </h3>
              
              <div className="industrial-metrics-grid">
                <div className="industrial-metric">
                  <div className="industrial-metric__label">ENTITIES PROCESSED</div>
                  <div className="industrial-metric__value">
                    {simulationResult.throughput?.totalEntitiesProcessed || 0}
                  </div>
                  <div className="industrial-metric__unit">total</div>
                </div>

                <div className="industrial-metric">
                  <div className="industrial-metric__label">THROUGHPUT RATE</div>
                  <div className="industrial-metric__value">
                    {simulationResult.throughput?.entitiesPerHour?.toFixed(1) || '0'}
                  </div>
                  <div className="industrial-metric__unit">per hour</div>
                </div>

                <div className="industrial-metric">
                  <div className="industrial-metric__label">AVG CYCLE TIME</div>
                  <div className="industrial-metric__value">
                    {simulationResult.throughput?.averageCycleTime?.toFixed(2) || '0'}
                  </div>
                  <div className="industrial-metric__unit">minutes</div>
                </div>

                <div className="industrial-metric">
                  <div className="industrial-metric__label">EFFICIENCY</div>
                  <div className="industrial-metric__value">
                    {simulationResult.throughput?.throughputEfficiency?.toFixed(1) || '0'}
                  </div>
                  <div className="industrial-metric__unit">%</div>
                </div>
              </div>

              {/* ========== RESOURCE UTILIZATION ========== */}
              {simulationResult.resources && simulationResult.resources.length > 0 && (
                <>
                  <h3 style={{ 
                    marginTop: '2rem', 
                    marginBottom: '1rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1rem',
                    color: 'var(--color-text-primary)',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '0.5rem'
                  }}>
                    ⚙️ RESOURCE UTILIZATION & OEE
                  </h3>
                  
                  <div className="industrial-table-container">
                    <table className="industrial-table">
                      <thead>
                        <tr>
                          <th>RESOURCE</th>
                          <th>UTILIZATION</th>
                          <th>OEE</th>
                          <th>ENTITIES SERVED</th>
                          <th>AVG QUEUE</th>
                          <th>MAX QUEUE</th>
                          <th>COST/ENTITY</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simulationResult.resources.map((resource: any) => (
                          <tr key={resource.resourceId}>
                            <td style={{ fontWeight: 600 }}>{resource.resourceName}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div className="industrial-progress">
                                  <div 
                                    className="industrial-progress__bar" 
                                    style={{ 
                                      width: `${(resource.utilization || 0) * 100}%`,
                                      backgroundColor: resource.utilization > 0.85 ? '#ef4444' : resource.utilization > 0.7 ? '#f59e0b' : '#22c55e'
                                    }}
                                  ></div>
                                </div>
                                <span>{((resource.utilization || 0) * 100).toFixed(1)}%</span>
                              </div>
                            </td>
                            <td>{((resource.oee || 0) * 100).toFixed(1)}%</td>
                            <td>{resource.entitiesServed || 0}</td>
                            <td>{resource.averageQueueLength?.toFixed(1) || '0'}</td>
                            <td>{resource.maxQueueLength || 0}</td>
                            <td>${resource.costPerEntity?.toFixed(2) || '0'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ========== FINANCIAL METRICS ========== */}
              {simulationResult.financial && (
                <>
                  <h3 style={{ 
                    marginTop: '2rem', 
                    marginBottom: '1rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1rem',
                    color: 'var(--color-text-primary)',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '0.5rem'
                  }}>
                    💰 FINANCIAL PERFORMANCE
                  </h3>
                  
                  <div className="industrial-metrics-grid">
                    <div className="industrial-metric">
                      <div className="industrial-metric__label">TOTAL REVENUE</div>
                      <div className="industrial-metric__value">
                        ${simulationResult.financial.totalRevenue?.toFixed(2) || '0'}
                      </div>
                      <div className="industrial-metric__unit">USD</div>
                    </div>

                    <div className="industrial-metric">
                      <div className="industrial-metric__label">TOTAL COST</div>
                      <div className="industrial-metric__value">
                        ${simulationResult.financial.totalOperatingCost?.toFixed(2) || '0'}
                      </div>
                      <div className="industrial-metric__unit">USD</div>
                    </div>

                    <div className="industrial-metric">
                      <div className="industrial-metric__label">PROFIT MARGIN</div>
                      <div className="industrial-metric__value">
                        {simulationResult.financial.profitMargin?.toFixed(1) || '0'}
                      </div>
                      <div className="industrial-metric__unit">%</div>
                    </div>

                    <div className="industrial-metric">
                      <div className="industrial-metric__label">ROI</div>
                      <div className="industrial-metric__value">
                        {simulationResult.financial.roi?.toFixed(1) || '0'}
                      </div>
                      <div className="industrial-metric__unit">%</div>
                    </div>
                  </div>
                </>
              )}

              {/* ========== BOTTLENECK ANALYSIS ========== */}
              {simulationResult.advanced?.bottlenecks && simulationResult.advanced.bottlenecks.length > 0 && (
                <>
                  <h3 style={{ 
                    marginTop: '2rem', 
                    marginBottom: '1rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1rem',
                    color: 'var(--color-text-primary)',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '0.5rem'
                  }}>
                    🔴 BOTTLENECK ANALYSIS
                  </h3>
                  
                  {simulationResult.advanced.bottlenecks.map((bottleneck: any, idx: number) => (
                    <div key={idx} className="industrial-card" style={{ marginBottom: '1rem', padding: '1rem', borderLeft: `4px solid ${bottleneck.severity > 70 ? '#ef4444' : bottleneck.severity > 40 ? '#f59e0b' : '#22c55e'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                          {bottleneck.resourceName}
                        </h4>
                        <span className="industrial-badge" style={{ 
                          backgroundColor: bottleneck.severity > 70 ? '#ef4444' : bottleneck.severity > 40 ? '#f59e0b' : '#22c55e'
                        }}>
                          SEVERITY: {bottleneck.severity.toFixed(0)}%
                        </span>
                      </div>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0.5rem 0' }}>
                        {bottleneck.impact}
                      </p>
                      {bottleneck.recommendations && bottleneck.recommendations.length > 0 && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <strong style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>RECOMMENDATIONS:</strong>
                          <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            {bottleneck.recommendations.map((rec: string, i: number) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* ========== IMPROVEMENT OPPORTUNITIES ========== */}
              {simulationResult.advanced?.improvementPotential && simulationResult.advanced.improvementPotential.length > 0 && (
                <>
                  <h3 style={{ 
                    marginTop: '2rem', 
                    marginBottom: '1rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1rem',
                    color: 'var(--color-text-primary)',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '0.5rem'
                  }}>
                    💡 IMPROVEMENT OPPORTUNITIES
                  </h3>
                  
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {simulationResult.advanced.improvementPotential.slice(0, 3).map((opp: any, idx: number) => (
                      <div key={idx} className="industrial-card" style={{ padding: '1rem', borderLeft: '4px solid var(--color-primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                              {opp.area}
                            </h4>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                              {opp.description}
                            </p>
                          </div>
                          <div style={{ marginLeft: '1rem', textAlign: 'right' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                              +{opp.estimatedImpact.toFixed(1)}%
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                              {opp.difficulty} difficulty
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ========== ACTIONS ========== */}
              <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  className="industrial-button industrial-button--secondary"
                  onClick={() => {
                    console.log('Exporting report...', simulationResult);
                    alert('Report export functionality coming in Phase 2!');
                  }}
                >
                  📄 EXPORT REPORT
                </button>
                <button 
                  className="industrial-button industrial-button--primary"
                  onClick={() => setShowResults(false)}
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
