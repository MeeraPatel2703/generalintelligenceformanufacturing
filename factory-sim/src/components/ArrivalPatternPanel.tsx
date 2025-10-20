/**
 * ARRIVAL PATTERN PANEL
 *
 * Displays current arrival pattern configuration and allows editing
 * Shows: Arrival Mode, Parameters, Entity Types, Distribution Details
 */

import { useState } from 'react';
import { ExtractedSystem, ArrivalPattern } from '../types/extraction';

interface Props {
  system: ExtractedSystem;
  onSystemUpdate: (system: ExtractedSystem) => void;
}

export function ArrivalPatternPanel({ system, onSystemUpdate }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingEntityIndex, setEditingEntityIndex] = useState<number | null>(null);

  // Get arrival mode description
  const getArrivalModeDescription = (pattern: ArrivalPattern): string => {
    switch (pattern.type) {
      case 'poisson':
        return `Poisson Process (Random) - Exponential interarrival times with rate ${pattern.rate || 'N/A'} ${pattern.rateUnit || 'per hour'}`;
      case 'deterministic':
        return `Deterministic (Fixed Intervals) - Regular arrivals every ${pattern.interarrivalTime?.parameters?.mean || 'N/A'} ${pattern.interarrivalTime?.unit || 'minutes'}`;
      case 'scheduled':
        return `Scheduled Arrivals - ${pattern.schedule?.length || 0} time periods with varying rates`;
      case 'nonhomogeneous':
        return `Time-Varying Rate (Rate Table) - Arrival rate changes over ${pattern.schedule?.length || 0} periods`;
      case 'batch':
        return `Batch Arrivals - Groups of ${pattern.batchSize?.parameters?.mean || 'N/A'} entities arriving together`;
      default:
        return 'Unknown arrival pattern';
    }
  };

  // Get distribution details
  const getDistributionDetails = (pattern: ArrivalPattern): string => {
    if (pattern.interarrivalTime) {
      const dist = pattern.interarrivalTime;
      switch (dist.type) {
        case 'exponential':
          return `Exponential(mean=${dist.parameters.mean})`;
        case 'normal':
          return `Normal(μ=${dist.parameters.mean}, σ=${dist.parameters.stdDev})`;
        case 'uniform':
          return `Uniform(min=${dist.parameters.min}, max=${dist.parameters.max})`;
        case 'triangular':
          return `Triangular(min=${dist.parameters.min}, mode=${dist.parameters.mode}, max=${dist.parameters.max})`;
        case 'constant':
          return `Constant(${dist.parameters.value})`;
        default:
          return dist.type;
      }
    }
    return 'N/A';
  };

  // Handle arrival rate change
  const handleRateChange = (entityIndex: number, newRate: number) => {
    const updatedSystem = { ...system };
    updatedSystem.entities[entityIndex].arrivalPattern.rate = newRate;
    onSystemUpdate(updatedSystem);
  };

  // Handle interarrival time change
  const handleInterarrivalChange = (entityIndex: number, newMean: number) => {
    const updatedSystem = { ...system };
    if (updatedSystem.entities[entityIndex].arrivalPattern.interarrivalTime) {
      updatedSystem.entities[entityIndex].arrivalPattern.interarrivalTime!.parameters.mean = newMean;
    }
    onSystemUpdate(updatedSystem);
  };

  return (
    <div className="industrial-card" style={{ marginBottom: '20px', padding: '20px', backgroundColor: 'var(--color-bg-secondary)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '2px solid var(--color-primary)',
        paddingBottom: '10px'
      }}>
        <div>
          <h2 style={{
            color: 'var(--color-primary)',
            fontSize: '1.2rem',
            margin: 0,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            📊 ARRIVAL PATTERN CONFIGURATION
          </h2>
          <p style={{
            color: 'var(--color-text-secondary)',
            fontSize: '0.75rem',
            margin: '5px 0 0 0',
            fontFamily: 'var(--font-mono)'
          }}>
            Entity arrival modes and parameters
          </p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="industrial-button industrial-button--secondary"
          style={{ fontSize: '0.875rem' }}
        >
          {isEditing ? '✓ DONE EDITING' : '✎ EDIT ARRIVALS'}
        </button>
      </div>

      {/* Entity Arrival Patterns */}
      {system.entities && system.entities.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {system.entities.map((entity, index) => (
            <div
              key={index}
              style={{
                padding: '15px',
                backgroundColor: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px'
              }}
            >
              {/* Entity Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <h3 style={{
                  color: 'var(--color-text-primary)',
                  fontSize: '1rem',
                  margin: 0,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600
                }}>
                  🔷 {entity.name} ({entity.type})
                </h3>
                {isEditing && (
                  <button
                    onClick={() => setEditingEntityIndex(editingEntityIndex === index ? null : index)}
                    className="industrial-button"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                  >
                    {editingEntityIndex === index ? '▼ COLLAPSE' : '▶ EXPAND'}
                  </button>
                )}
              </div>

              {/* Arrival Pattern Summary */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '5px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <strong style={{ color: 'var(--color-primary)' }}>Mode:</strong> {entity.arrivalPattern.type.toUpperCase()}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  lineHeight: '1.4'
                }}>
                  {getArrivalModeDescription(entity.arrivalPattern)}
                </div>
              </div>

              {/* Key Parameters */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '10px',
                marginTop: '10px'
              }}>
                {/* Arrival Rate (for Poisson) */}
                {entity.arrivalPattern.rate !== undefined && (
                  <div className="industrial-metric" style={{ padding: '10px' }}>
                    <div className="industrial-metric__label" style={{ fontSize: '0.7rem' }}>ARRIVAL RATE</div>
                    {isEditing && editingEntityIndex === index ? (
                      <input
                        type="number"
                        value={entity.arrivalPattern.rate}
                        onChange={(e) => handleRateChange(index, parseFloat(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '4px 8px',
                          backgroundColor: 'var(--color-bg-primary)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                          fontSize: '0.875rem',
                          fontFamily: 'var(--font-mono)'
                        }}
                      />
                    ) : (
                      <div className="industrial-metric__value" style={{ fontSize: '1.2rem' }}>
                        {entity.arrivalPattern.rate}
                      </div>
                    )}
                    <div className="industrial-metric__unit" style={{ fontSize: '0.7rem' }}>
                      {entity.arrivalPattern.rateUnit || 'per hour'}
                    </div>
                  </div>
                )}

                {/* Interarrival Time */}
                {entity.arrivalPattern.interarrivalTime && (
                  <div className="industrial-metric" style={{ padding: '10px' }}>
                    <div className="industrial-metric__label" style={{ fontSize: '0.7rem' }}>INTERARRIVAL TIME</div>
                    {isEditing && editingEntityIndex === index ? (
                      <input
                        type="number"
                        value={entity.arrivalPattern.interarrivalTime.parameters.mean || 0}
                        onChange={(e) => handleInterarrivalChange(index, parseFloat(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '4px 8px',
                          backgroundColor: 'var(--color-bg-primary)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                          fontSize: '0.875rem',
                          fontFamily: 'var(--font-mono)'
                        }}
                      />
                    ) : (
                      <div className="industrial-metric__value" style={{ fontSize: '1.2rem' }}>
                        {entity.arrivalPattern.interarrivalTime.parameters.mean || 'N/A'}
                      </div>
                    )}
                    <div className="industrial-metric__unit" style={{ fontSize: '0.7rem' }}>
                      {entity.arrivalPattern.interarrivalTime.unit}
                    </div>
                  </div>
                )}

                {/* Distribution Type */}
                <div className="industrial-metric" style={{ padding: '10px' }}>
                  <div className="industrial-metric__label" style={{ fontSize: '0.7rem' }}>DISTRIBUTION</div>
                  <div className="industrial-metric__value" style={{ fontSize: '1rem', wordBreak: 'break-word' }}>
                    {getDistributionDetails(entity.arrivalPattern)}
                  </div>
                </div>

                {/* Batch Size (if applicable) */}
                {entity.arrivalPattern.batchSize && (
                  <div className="industrial-metric" style={{ padding: '10px' }}>
                    <div className="industrial-metric__label" style={{ fontSize: '0.7rem' }}>BATCH SIZE</div>
                    <div className="industrial-metric__value" style={{ fontSize: '1.2rem' }}>
                      {entity.arrivalPattern.batchSize.parameters.mean ||
                       entity.arrivalPattern.batchSize.parameters.value || 'N/A'}
                    </div>
                    <div className="industrial-metric__unit" style={{ fontSize: '0.7rem' }}>
                      entities per arrival
                    </div>
                  </div>
                )}

                {/* Schedule Periods (if applicable) */}
                {entity.arrivalPattern.schedule && (
                  <div className="industrial-metric" style={{ padding: '10px' }}>
                    <div className="industrial-metric__label" style={{ fontSize: '0.7rem' }}>SCHEDULE PERIODS</div>
                    <div className="industrial-metric__value" style={{ fontSize: '1.2rem' }}>
                      {entity.arrivalPattern.schedule.length}
                    </div>
                    <div className="industrial-metric__unit" style={{ fontSize: '0.7rem' }}>
                      time periods
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {isEditing && editingEntityIndex === index && (
                <details open style={{ marginTop: '15px', fontSize: '0.875rem' }}>
                  <summary style={{
                    cursor: 'pointer',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                    marginBottom: '10px'
                  }}>
                    Advanced Settings
                  </summary>
                  <div style={{
                    padding: '10px',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-secondary)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Priority:</strong> {entity.priority ? `${entity.priority.attributeName} (${entity.priority.higherIsBetter ? 'higher is better' : 'lower is better'})` : 'FIFO (default)'}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Max in System:</strong> {entity.maxInSystem ? `${entity.maxInSystem} (balking enabled)` : 'Unlimited'}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Attributes:</strong> {entity.attributes.length} custom attributes defined
                    </div>
                    {entity.description && (
                      <div style={{ marginTop: '10px', fontStyle: 'italic' }}>
                        {entity.description}
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Schedule Details (if scheduled/nonhomogeneous) */}
              {entity.arrivalPattern.schedule && entity.arrivalPattern.schedule.length > 0 && (
                <details style={{ marginTop: '15px', fontSize: '0.875rem' }}>
                  <summary style={{
                    cursor: 'pointer',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                    marginBottom: '10px'
                  }}>
                    📅 Schedule Details ({entity.arrivalPattern.schedule.length} periods)
                  </summary>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <th style={{ padding: '8px', textAlign: 'left', color: 'var(--color-primary)' }}>Period</th>
                          <th style={{ padding: '8px', textAlign: 'left', color: 'var(--color-primary)' }}>Days</th>
                          <th style={{ padding: '8px', textAlign: 'left', color: 'var(--color-primary)' }}>Time</th>
                          <th style={{ padding: '8px', textAlign: 'left', color: 'var(--color-primary)' }}>Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entity.arrivalPattern.schedule.map((sched, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>{i + 1}</td>
                            <td style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>
                              {sched.dayOfWeek?.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ') || 'All'}
                            </td>
                            <td style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>
                              {sched.timeOfDay ? `${sched.timeOfDay.start} - ${sched.timeOfDay.end}` : 'All day'}
                            </td>
                            <td style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>
                              {sched.rate} {sched.rateUnit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          fontSize: '0.875rem'
        }}>
          No entity arrival patterns defined
        </div>
      )}

      {/* Help Text */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid #3b82f6',
        borderRadius: '4px',
        fontSize: '0.75rem',
        color: 'var(--color-text-secondary)'
      }}>
        <strong style={{ color: '#3b82f6' }}>ℹ️ Arrival Pattern Info:</strong>
        <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
          <li><strong>Poisson:</strong> Random arrivals, most common for walk-ins/calls</li>
          <li><strong>Deterministic:</strong> Fixed intervals, used for scheduled operations</li>
          <li><strong>Scheduled:</strong> Different rates for different time periods</li>
          <li><strong>Batch:</strong> Multiple entities arrive together (e.g., bus loads)</li>
          <li><strong>Nonhomogeneous:</strong> Time-varying rates (e.g., rush hours)</li>
        </ul>
      </div>
    </div>
  );
}
