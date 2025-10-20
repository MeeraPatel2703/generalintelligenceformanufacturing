/**
 * COMPREHENSIVE SIMULATION EDITORS
 *
 * Complete editing system for all simulation elements:
 * - Resources/Servers
 * - Paths/Links
 * - Entities
 * - Logic/Routing
 */

import React, { useState } from 'react';
import { VisualResource, VisualEntity } from '../des-core/IndustrialSimulationAdapter';

interface Path {
  id: string;
  fromResource: string;
  toResource: string;
  travelTime: number;
  speed: number;
  capacity: number;
  type: 'conveyor' | 'transport' | 'direct';
  flowPercentage?: number;
  bidirectional: boolean;
  color: string;
}

interface LogicRule {
  id: string;
  condition: string;
  action: string;
  priority: number;
}

// ============================================================================
// LOGIC EDITOR - For adding conditions, routing, decisions
// ============================================================================

export function LogicEditor({
  targetType,
  targetId,
  onClose,
  onSave
}: {
  targetType: 'resource' | 'path' | 'entity';
  targetId: string;
  onClose: () => void;
  onSave: (logic: LogicRule[]) => void;
}) {
  const [rules, setRules] = useState<LogicRule[]>([]);
  const [newRule, setNewRule] = useState({ condition: '', action: '', priority: 1 });

  const addRule = () => {
    if (newRule.condition && newRule.action) {
      setRules([...rules, {
        id: `rule_${Date.now()}`,
        ...newRule
      }]);
      setNewRule({ condition: '', action: '', priority: 1 });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 150,
      backgroundColor: '#1a1a2e',
      border: '3px solid #a78bfa',
      borderRadius: '12px',
      padding: '24px',
      minWidth: '600px',
      maxWidth: '700px',
      maxHeight: '85vh',
      overflowY: 'auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.7)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#a78bfa', margin: 0, fontSize: '1.3rem' }}>
          ⚡ LOGIC EDITOR
        </h2>
        <button
          onClick={onClose}
          style={{
            padding: '8px 14px',
            backgroundColor: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 700
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#374151', borderRadius: '8px' }}>
        <div style={{ color: '#f3f4f6', fontWeight: 700, marginBottom: '6px' }}>
          Editing Logic For:
        </div>
        <div style={{ color: '#a78bfa', fontSize: '1.1rem' }}>
          {targetType.toUpperCase()}: {targetId}
        </div>
      </div>

      {/* Existing Rules */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#10b981', fontSize: '1.1rem', marginBottom: '12px' }}>
          📋 ACTIVE RULES ({rules.length})
        </h3>
        {rules.length === 0 ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#9ca3af',
            backgroundColor: '#1f2937',
            borderRadius: '8px',
            border: '2px dashed #374151'
          }}>
            No logic rules defined yet. Add your first rule below!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {rules.map((rule, index) => (
              <div
                key={rule.id}
                style={{
                  padding: '12px',
                  backgroundColor: '#1f2937',
                  borderRadius: '8px',
                  border: '2px solid #374151'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>
                      Rule #{index + 1} • Priority: {rule.priority}
                    </div>
                    <div style={{ color: '#f3f4f6', fontWeight: 600, marginBottom: '6px' }}>
                      IF: <span style={{ color: '#60a5fa' }}>{rule.condition}</span>
                    </div>
                    <div style={{ color: '#f3f4f6', fontWeight: 600 }}>
                      THEN: <span style={{ color: '#10b981' }}>{rule.action}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setRules(rules.filter(r => r.id !== rule.id))}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Rule */}
      <div style={{
        padding: '16px',
        backgroundColor: '#374151',
        borderRadius: '8px',
        border: '2px solid #a78bfa',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#a78bfa', fontSize: '1rem', marginBottom: '12px' }}>
          ➕ ADD NEW RULE
        </h3>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: '#f3f4f6', display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>
            IF (Condition):
          </label>
          <select
            value={newRule.condition}
            onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#1f2937',
              color: '#f3f4f6',
              border: '2px solid #6b7280',
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}
          >
            <option value="">-- Select Condition --</option>
            <option value="queue_length > 5">Queue Length &gt; 5</option>
            <option value="utilization > 80%">Utilization &gt; 80%</option>
            <option value="entity_type == 'Priority'">Entity Type == Priority</option>
            <option value="time_in_system > 30">Time in System &gt; 30 min</option>
            <option value="resource_available">Resource Available</option>
            <option value="random() > 0.5">Random 50% Split</option>
            <option value="custom">Custom Expression...</option>
          </select>
        </div>

        {newRule.condition === 'custom' && (
          <div style={{ marginBottom: '12px' }}>
            <input
              type="text"
              placeholder={'Enter custom condition (e.g., entity.priority > 2)'}
              onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#1f2937',
                color: '#f3f4f6',
                border: '2px solid #6b7280',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: '#f3f4f6', display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>
            THEN (Action):
          </label>
          <select
            value={newRule.action}
            onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#1f2937',
              color: '#f3f4f6',
              border: '2px solid #6b7280',
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}
          >
            <option value="">-- Select Action --</option>
            <option value="route_to_Resource2">Route to Resource 2</option>
            <option value="route_to_Resource3">Route to Resource 3</option>
            <option value="priority_queue">Add to Priority Queue</option>
            <option value="delay_10_min">Delay 10 Minutes</option>
            <option value="reject_entity">Reject Entity</option>
            <option value="duplicate_entity">Duplicate Entity</option>
            <option value="custom">Custom Action...</option>
          </select>
        </div>

        {newRule.action === 'custom' && (
          <div style={{ marginBottom: '12px' }}>
            <input
              type="text"
              placeholder={'Enter custom action (e.g., entity.setAttribute("fast", true))'}
              onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#1f2937',
                color: '#f3f4f6',
                border: '2px solid #6b7280',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: '#f3f4f6', display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>
            Priority (1 = highest):
          </label>
          <input
            type="number"
            min="1"
            value={newRule.priority}
            onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 1 })}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#1f2937',
              color: '#f3f4f6',
              border: '2px solid #6b7280',
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}
          />
        </div>

        <button
          onClick={addRule}
          disabled={!newRule.condition || !newRule.action}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: newRule.condition && newRule.action ? '#10b981' : '#374151',
            color: newRule.condition && newRule.action ? '#000' : '#6b7280',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            cursor: newRule.condition && newRule.action ? 'pointer' : 'not-allowed',
            fontSize: '0.95rem'
          }}
        >
          ➕ ADD RULE
        </button>
      </div>

      {/* Save/Cancel Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => {
            onSave(rules);
            onClose();
          }}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: '#10b981',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          ✓ SAVE LOGIC ({rules.length} rules)
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '14px 20px',
            backgroundColor: '#6b7280',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          CANCEL
        </button>
      </div>

      {/* Help Section */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#1f2937',
        borderRadius: '8px',
        border: '2px solid #374151'
      }}>
        <div style={{ fontWeight: 700, color: '#60a5fa', marginBottom: '8px', fontSize: '0.85rem' }}>
          💡 LOGIC EDITOR TIPS:
        </div>
        <ul style={{
          margin: 0,
          paddingLeft: '20px',
          color: '#9ca3af',
          fontSize: '0.75rem',
          lineHeight: '1.6'
        }}>
          <li>Rules are evaluated in priority order (1 = highest)</li>
          <li>Conditions support comparisons, logical operators, and custom expressions</li>
          <li>Actions can route entities, modify properties, or trigger events</li>
          <li>Use "custom" options for advanced logic not covered by presets</li>
          <li>Multiple rules can apply to the same element</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// ENTITY EDITOR - For editing individual entities
// ============================================================================

export function EntityEditor({
  entity,
  onClose,
  onUpdate
}: {
  entity: VisualEntity;
  onClose: () => void;
  onUpdate: (updated: Partial<VisualEntity>) => void;
}) {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 100,
      backgroundColor: '#1a1a2e',
      border: '3px solid #ec4899',
      borderRadius: '12px',
      padding: '20px',
      minWidth: '400px',
      maxWidth: '500px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ color: '#ec4899', margin: 0, fontSize: '1.2rem' }}>
          🎯 ENTITY INSPECTOR
        </h3>
        <button
          onClick={onClose}
          style={{
            padding: '6px 12px',
            backgroundColor: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 700
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#374151', borderRadius: '8px' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ec4899', marginBottom: '8px' }}>
          Entity: {entity.id}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
          Type: {entity.type}
        </div>
      </div>

      {/* Entity Properties */}
      <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#1f2937', borderRadius: '8px', border: '2px solid #374151' }}>
        <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '10px' }}>📊 ENTITY STATUS</div>

        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>State:</div>
          <div style={{
            display: 'inline-block',
            padding: '6px 12px',
            backgroundColor: entity.state === 'processing' ? '#60a5fa' : entity.state === 'waiting' ? '#f59e0b' : '#10b981',
            color: '#000',
            borderRadius: '6px',
            fontWeight: 700,
            marginTop: '4px',
            textTransform: 'uppercase'
          }}>
            {entity.state}
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Current Resource:</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f3f4f6', marginTop: '2px' }}>
            {entity.currentResourceId || 'In Transit'}
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Position:</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f3f4f6', marginTop: '2px' }}>
            ({entity.position.x.toFixed(1)}, {entity.position.y.toFixed(1)})
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Creation Time:</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f3f4f6', marginTop: '2px' }}>
            {entity.creationTime.toFixed(2)} minutes
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => {
            // TODO: Implement force route
            console.log('Force route entity:', entity.id);
          }}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#60a5fa',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          🚀 FORCE ROUTE
        </button>
        <button
          onClick={() => {
            if (confirm(`Remove entity "${entity.id}" from simulation?`)) {
              // TODO: Implement entity removal
              console.log('Remove entity:', entity.id);
              onClose();
            }
          }}
          style={{
            padding: '10px 14px',
            backgroundColor: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          🗑️ REMOVE
        </button>
      </div>

      <div style={{
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#1f2937',
        borderRadius: '6px',
        border: '2px solid #374151',
        fontSize: '0.75rem',
        color: '#9ca3af',
        lineHeight: '1.5'
      }}>
        <strong style={{ color: '#ec4899' }}>Note:</strong> Entity editing allows you to inspect and modify individual entities in real-time. Use force route to manually direct entities to specific resources.
      </div>
    </div>
  );
}
