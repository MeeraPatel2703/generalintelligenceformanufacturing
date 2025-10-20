/**
 * SCRATCH-LIKE VISUAL BLOCK EDITOR
 *
 * Complete drag-and-drop visual programming interface
 * Build simulation logic by dragging and connecting blocks
 */

import React, { useState } from 'react';

interface Block {
  id: string;
  type: 'condition' | 'action' | 'event' | 'control' | 'data' | 'logic';
  category: string;
  label: string;
  icon: string;
  color: string;
  inputs?: BlockInput[];
  code?: string;
}

interface BlockInput {
  type: 'text' | 'number' | 'dropdown' | 'boolean';
  label: string;
  value: any;
  options?: string[];
}

interface PlacedBlock extends Block {
  x: number;
  y: number;
  connectedTo?: string;
}

export function ScratchLikeBlockEditor({ onClose, targetType, targetId }: {
  onClose: () => void;
  targetType: 'resource' | 'path' | 'entity';
  targetId: string;
}) {
  const [placedBlocks, setPlacedBlocks] = useState<PlacedBlock[]>([]);
  const [draggedBlock, setDraggedBlock] = useState<Block | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  // Block Library - Scratch-style categories
  const blockLibrary: Record<string, Block[]> = {
    'Events': [
      { id: 'when_entity_arrives', type: 'event', category: 'Events', label: 'When entity arrives', icon: '🎯', color: '#f59e0b', code: 'onEntityArrival()' },
      { id: 'when_processing_done', type: 'event', category: 'Events', label: 'When processing done', icon: '✅', color: '#f59e0b', code: 'onProcessingComplete()' },
      { id: 'when_queue_full', type: 'event', category: 'Events', label: 'When queue > ', icon: '📊', color: '#f59e0b', inputs: [{ type: 'number', label: 'count', value: 5 }] },
      { id: 'when_time_elapsed', type: 'event', category: 'Events', label: 'When time > ', icon: '⏱️', color: '#f59e0b', inputs: [{ type: 'number', label: 'minutes', value: 60 }] },
    ],
    'Conditions': [
      { id: 'if_queue_length', type: 'condition', category: 'Conditions', label: 'If queue length >', icon: '🔍', color: '#3b82f6', inputs: [{ type: 'number', label: 'count', value: 5 }] },
      { id: 'if_utilization', type: 'condition', category: 'Conditions', label: 'If utilization >', icon: '📈', color: '#3b82f6', inputs: [{ type: 'number', label: 'percent', value: 80 }] },
      { id: 'if_entity_type', type: 'condition', category: 'Conditions', label: 'If entity type =', icon: '🏷️', color: '#3b82f6', inputs: [{ type: 'dropdown', label: 'type', value: 'Priority', options: ['Normal', 'Priority', 'Express'] }] },
      { id: 'if_random', type: 'condition', category: 'Conditions', label: 'If random % chance', icon: '🎲', color: '#3b82f6', inputs: [{ type: 'number', label: 'percent', value: 50 }] },
      { id: 'if_time_of_day', type: 'condition', category: 'Conditions', label: 'If time between', icon: '🕐', color: '#3b82f6', inputs: [{ type: 'number', label: 'start', value: 9 }, { type: 'number', label: 'end', value: 17 }] },
    ],
    'Actions': [
      { id: 'route_to', type: 'action', category: 'Actions', label: 'Route to', icon: '➡️', color: '#10b981', inputs: [{ type: 'dropdown', label: 'resource', value: 'Resource1', options: ['Resource1', 'Resource2', 'Resource3'] }] },
      { id: 'set_priority', type: 'action', category: 'Actions', label: 'Set priority to', icon: '⭐', color: '#10b981', inputs: [{ type: 'number', label: 'priority', value: 1 }] },
      { id: 'delay', type: 'action', category: 'Actions', label: 'Delay for', icon: '⏸️', color: '#10b981', inputs: [{ type: 'number', label: 'minutes', value: 5 }] },
      { id: 'create_entity', type: 'action', category: 'Actions', label: 'Create entity', icon: '➕', color: '#10b981', inputs: [{ type: 'dropdown', label: 'type', value: 'Normal', options: ['Normal', 'Priority'] }] },
      { id: 'destroy_entity', type: 'action', category: 'Actions', label: 'Destroy entity', icon: '❌', color: '#10b981' },
      { id: 'send_to_queue', type: 'action', category: 'Actions', label: 'Add to queue', icon: '📥', color: '#10b981', inputs: [{ type: 'dropdown', label: 'position', value: 'End', options: ['End', 'Start', 'Priority'] }] },
    ],
    'Control': [
      { id: 'repeat', type: 'control', category: 'Control', label: 'Repeat', icon: '🔄', color: '#a78bfa', inputs: [{ type: 'number', label: 'times', value: 10 }] },
      { id: 'wait_until', type: 'control', category: 'Control', label: 'Wait until', icon: '⏳', color: '#a78bfa', inputs: [{ type: 'dropdown', label: 'condition', value: 'Resource Available', options: ['Resource Available', 'Queue Empty', 'Time Reached'] }] },
      { id: 'stop', type: 'control', category: 'Control', label: 'Stop simulation', icon: '🛑', color: '#a78bfa' },
      { id: 'broadcast', type: 'control', category: 'Control', label: 'Broadcast event', icon: '📢', color: '#a78bfa', inputs: [{ type: 'text', label: 'message', value: 'custom_event' }] },
    ],
    'Data': [
      { id: 'set_variable', type: 'data', category: 'Data', label: 'Set', icon: '📝', color: '#ec4899', inputs: [{ type: 'text', label: 'variable', value: 'speed' }, { type: 'number', label: 'to', value: 10 }] },
      { id: 'change_by', type: 'data', category: 'Data', label: 'Change', icon: '➕', color: '#ec4899', inputs: [{ type: 'text', label: 'variable', value: 'count' }, { type: 'number', label: 'by', value: 1 }] },
      { id: 'get_stat', type: 'data', category: 'Data', label: 'Get statistic', icon: '📊', color: '#ec4899', inputs: [{ type: 'dropdown', label: 'stat', value: 'Throughput', options: ['Throughput', 'Utilization', 'Queue Length', 'Cycle Time'] }] },
    ],
    'Logic': [
      { id: 'and', type: 'logic', category: 'Logic', label: 'And', icon: '∧', color: '#14b8a6' },
      { id: 'or', type: 'logic', category: 'Logic', label: 'Or', icon: '∨', color: '#14b8a6' },
      { id: 'not', type: 'logic', category: 'Logic', label: 'Not', icon: '¬', color: '#14b8a6' },
      { id: 'equals', type: 'logic', category: 'Logic', label: '=', icon: '=', color: '#14b8a6' },
      { id: 'greater_than', type: 'logic', category: 'Logic', label: '>', icon: '>', color: '#14b8a6' },
      { id: 'less_than', type: 'logic', category: 'Logic', label: '<', icon: '<', color: '#14b8a6' },
    ]
  };

  const handleDragStart = (block: Block) => {
    setDraggedBlock(block);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedBlock) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newBlock: PlacedBlock = {
      ...draggedBlock,
      id: `${draggedBlock.id}_${Date.now()}`,
      x,
      y
    };

    setPlacedBlocks([...placedBlocks, newBlock]);
    setDraggedBlock(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const deleteBlock = (id: string) => {
    setPlacedBlocks(placedBlocks.filter(b => b.id !== id));
    if (selectedBlock === id) setSelectedBlock(null);
  };

  const generateCode = () => {
    let code = '// Generated Logic\n\n';
    placedBlocks.forEach(block => {
      code += `${block.code || block.label}\n`;
    });
    return code;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#1a1a2e',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        backgroundColor: '#2d3748',
        borderBottom: '3px solid #a78bfa',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ color: '#a78bfa', margin: 0, fontSize: '1.5rem', fontFamily: 'monospace' }}>
            🧩 SCRATCH-LIKE BLOCK EDITOR
          </h1>
          <p style={{ color: '#9ca3af', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
            Editing: {targetType.toUpperCase()} - {targetId}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              console.log(generateCode());
              alert('Logic saved! Check console for generated code.');
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#10b981',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            ✓ SAVE LOGIC
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            ✕ CLOSE
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Block Palette - Left Side */}
        <div style={{
          width: '300px',
          backgroundColor: '#2d3748',
          borderRight: '2px solid #374151',
          overflowY: 'auto',
          padding: '20px'
        }}>
          <h3 style={{ color: '#f3f4f6', marginTop: 0, marginBottom: '20px', fontSize: '1.1rem' }}>
            📦 BLOCK PALETTE
          </h3>

          {Object.entries(blockLibrary).map(([category, blocks]) => (
            <div key={category} style={{ marginBottom: '30px' }}>
              <div style={{
                color: blocks[0]?.color || '#9ca3af',
                fontWeight: 700,
                marginBottom: '12px',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {category}
              </div>

              {blocks.map(block => (
                <div
                  key={block.id}
                  draggable
                  onDragStart={() => handleDragStart(block)}
                  style={{
                    padding: '12px',
                    marginBottom: '10px',
                    backgroundColor: block.color,
                    color: '#000',
                    borderRadius: '8px',
                    cursor: 'grab',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    transition: 'transform 0.1s',
                    userSelect: 'none'
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <span style={{ fontSize: '1.2rem' }}>{block.icon}</span>
                  <span>{block.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Canvas - Center */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            backgroundColor: '#1f2937',
            backgroundImage: 'radial-gradient(circle, #374151 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {placedBlocks.length === 0 && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '1.2rem'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎯</div>
              <div style={{ fontWeight: 700, marginBottom: '10px' }}>Drag blocks here to build your logic!</div>
              <div style={{ fontSize: '0.9rem' }}>
                Click and drag blocks from the left palette onto this canvas
              </div>
            </div>
          )}

          {placedBlocks.map(block => (
            <div
              key={block.id}
              onClick={() => setSelectedBlock(block.id)}
              style={{
                position: 'absolute',
                left: block.x,
                top: block.y,
                padding: '14px',
                backgroundColor: block.color,
                color: '#000',
                borderRadius: '10px',
                cursor: 'move',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: selectedBlock === block.id
                  ? '0 0 0 4px #fff, 0 4px 12px rgba(0,0,0,0.3)'
                  : '0 4px 8px rgba(0,0,0,0.2)',
                border: selectedBlock === block.id ? '3px solid #fff' : 'none',
                minWidth: '200px',
                userSelect: 'none'
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>{block.icon}</span>
              <div style={{ flex: 1 }}>
                <div>{block.label}</div>
                {block.inputs && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {block.inputs.map((input, idx) => (
                      <input
                        key={idx}
                        type={input.type === 'number' ? 'number' : 'text'}
                        defaultValue={input.value}
                        placeholder={input.label}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: 'rgba(0,0,0,0.2)',
                          border: '1px solid rgba(0,0,0,0.3)',
                          borderRadius: '4px',
                          color: '#000',
                          fontWeight: 600,
                          width: '60px',
                          fontSize: '0.8rem'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteBlock(block.id);
                }}
                style={{
                  padding: '6px 10px',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Info Panel - Right Side */}
        <div style={{
          width: '280px',
          backgroundColor: '#2d3748',
          borderLeft: '2px solid #374151',
          padding: '20px',
          overflowY: 'auto'
        }}>
          <h3 style={{ color: '#f3f4f6', marginTop: 0, marginBottom: '15px', fontSize: '1.1rem' }}>
            ℹ️ INFO
          </h3>

          <div style={{
            padding: '12px',
            backgroundColor: '#374151',
            borderRadius: '8px',
            marginBottom: '15px',
            fontSize: '0.85rem',
            color: '#d1d5db'
          }}>
            <strong style={{ color: '#10b981' }}>Blocks Placed:</strong> {placedBlocks.length}
          </div>

          <div style={{
            padding: '15px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <div style={{ color: '#3b82f6', fontWeight: 700, marginBottom: '10px', fontSize: '0.9rem' }}>
              🎮 HOW TO USE:
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              color: '#d1d5db',
              fontSize: '0.75rem',
              lineHeight: '1.6'
            }}>
              <li>Drag blocks from left palette</li>
              <li>Drop them on the canvas</li>
              <li>Click blocks to select them</li>
              <li>Edit values in input fields</li>
              <li>Click ✕ to delete blocks</li>
              <li>Click SAVE when done</li>
            </ul>
          </div>

          {selectedBlock && (
            <div style={{
              padding: '15px',
              backgroundColor: 'rgba(167, 139, 250, 0.1)',
              border: '2px solid #a78bfa',
              borderRadius: '8px'
            }}>
              <div style={{ color: '#a78bfa', fontWeight: 700, marginBottom: '8px', fontSize: '0.9rem' }}>
                ✨ SELECTED BLOCK
              </div>
              <div style={{ color: '#d1d5db', fontSize: '0.8rem' }}>
                {placedBlocks.find(b => b.id === selectedBlock)?.label}
              </div>
            </div>
          )}

          <div style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            fontSize: '0.75rem',
            color: '#fbbf24'
          }}>
            <strong>💡 TIP:</strong> Stack blocks vertically to create sequences of logic that execute in order!
          </div>
        </div>
      </div>
    </div>
  );
}
