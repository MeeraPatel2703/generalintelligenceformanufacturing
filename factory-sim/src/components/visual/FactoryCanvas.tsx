/**
 * Factory Canvas - Drop Target & Main Workspace
 *
 * Grid-based canvas where users build their factory.
 * Handles drops, renders machines and connections.
 */

import React, { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { MachineNode } from './MachineNode';
import { ConnectionEditor } from './ConnectionEditor';
import { useFactoryStore } from '../../store/factoryStore';

export function FactoryCanvas() {
  const { setNodeRef } = useDroppable({ id: 'factory-canvas' });

  const machines = useFactoryStore(state => state.machines);
  const connections = useFactoryStore(state => state.connections);
  const entities = useFactoryStore(state => state.entities);
  const selectMachine = useFactoryStore(state => state.selectMachine);
  const cancelConnection = useFactoryStore(state => state.cancelConnection);
  const connectingMode = useFactoryStore(state => state.connectingMode);
  const updateEntity = useFactoryStore(state => state.updateEntity);
  const removeEntity = useFactoryStore(state => state.removeEntity);

  const [editingConnection, setEditingConnection] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Track mouse position for connection preview line
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (connectingMode.step === 'selecting-target' && connectingMode.sourceId) {
      const rect = e.currentTarget.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Animate entities along connections
  useEffect(() => {
    const interval = setInterval(() => {
      entities.forEach(entity => {
        const newProgress = entity.progress + 0.01; // Move forward

        if (newProgress >= 1) {
          // Entity reached destination
          removeEntity(entity.id);
        } else {
          updateEntity(entity.id, { progress: newProgress });
        }
      });
    }, 50); // Update every 50ms

    return () => clearInterval(interval);
  }, [entities, updateEntity, removeEntity]);

  // Helper function to calculate point along connection path
  const getPointOnPath = (fromMachine: any, toMachine: any, progress: number) => {
    const x1 = fromMachine.position.x + fromMachine.size.width;
    const y1 = fromMachine.position.y + fromMachine.size.height / 2;
    const x2 = toMachine.position.x;
    const y2 = toMachine.position.y + toMachine.size.height / 2;

    const midX = (x1 + x2) / 2;

    // Bezier curve calculation
    const t = progress;
    const x = Math.pow(1-t, 2) * x1 + 2 * (1-t) * t * midX + Math.pow(t, 2) * x2;
    const y = Math.pow(1-t, 2) * y1 + 2 * (1-t) * t * y1 + Math.pow(t, 2) * y2;

    return { x, y };
  };

  const handleCanvasClick = () => {
    selectMachine(null);
    if (connectingMode.active) {
      cancelConnection();
    }
  };

  const handleConnectionClick = (connectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConnection(connectionId);
  };

  return (
    <div
      id="factory-canvas"
      ref={setNodeRef}
      className="factory-canvas"
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
    >
        {/* Grid background */}
        <svg className="grid-background" width="100%" height="100%">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Connection lines */}
        <svg className="connections-layer" width="100%" height="100%">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#3B82F6" />
            </marker>
            <marker
              id="arrowhead-preview"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#10B981" />
            </marker>
          </defs>

          {/* Preview line when connecting */}
          {connectingMode.step === 'selecting-target' && connectingMode.sourceId && (() => {
            const fromMachine = machines.find(m => m.id === connectingMode.sourceId);
            if (!fromMachine) return null;

            const x1 = fromMachine.position.x + fromMachine.size.width;
            const y1 = fromMachine.position.y + fromMachine.size.height / 2;
            const x2 = mousePos.x;
            const y2 = mousePos.y;

            const midX = (x1 + x2) / 2;
            const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

            return (
              <g className="preview-connection">
                <path
                  d={path}
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeDasharray="10 5"
                  fill="none"
                  markerEnd="url(#arrowhead-preview)"
                  opacity="0.7"
                />
                <circle
                  cx={x2}
                  cy={y2}
                  r="6"
                  fill="#10B981"
                  opacity="0.7"
                />
              </g>
            );
          })()}

          {connections.map(conn => {
            const fromMachine = machines.find(m => m.id === conn.from);
            const toMachine = machines.find(m => m.id === conn.to);

            if (!fromMachine || !toMachine) return null;

            const x1 = fromMachine.position.x + fromMachine.size.width;
            const y1 = fromMachine.position.y + fromMachine.size.height / 2;
            const x2 = toMachine.position.x;
            const y2 = toMachine.position.y + toMachine.size.height / 2;

            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

            // Calculate entities on this connection
            const connEntities = entities.filter(e => e.connectionId === conn.id);

            return (
              <g key={conn.id}>
                {/* Clickable invisible path for easier interaction */}
                <path
                  d={path}
                  stroke="transparent"
                  strokeWidth="20"
                  fill="none"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => handleConnectionClick(conn.id, e)}
                />
                
                {/* Visible connection line */}
                <path
                  d={path}
                  stroke={conn.isActive ? "#10B981" : "#3B82F6"}
                  strokeWidth="3"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  style={{ pointerEvents: 'none' }}
                />

                {/* Lag time label */}
                <g onClick={(e) => handleConnectionClick(conn.id, e)} style={{ cursor: 'pointer' }}>
                  <rect
                    x={midX - 25}
                    y={midY - 15}
                    width="50"
                    height="30"
                    fill="white"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    rx="4"
                  />
                  <text
                    x={midX}
                    y={midY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#3B82F6"
                    fontSize="12"
                    fontWeight="600"
                  >
                    {conn.lagTime}min
                  </text>
                  <text
                    x={midX}
                    y={midY + 10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#666"
                    fontSize="9"
                  >
                    {connEntities.length}/{conn.capacity}
                  </text>
                </g>

                {/* Render entities on this connection */}
                {connEntities.map(entity => {
                  const point = getPointOnPath(fromMachine, toMachine, entity.progress);
                  return (
                    <g key={entity.id}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="8"
                        fill={entity.color}
                        stroke="white"
                        strokeWidth="2"
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Machines */}
        {machines.map(machine => (
          <MachineNode key={machine.id} machine={machine} />
        ))}

        {/* Empty state hint */}
        {machines.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🏭</div>
            <h3>Drag machines from the library to build your factory</h3>
            <p>Start by dragging a CNC machine or any other station onto this canvas</p>
          </div>
        )}

        {/* Connection Editor Modal */}
        {editingConnection && (
          <ConnectionEditor
            connection={connections.find(c => c.id === editingConnection)!}
            onClose={() => setEditingConnection(null)}
          />
        )}

        <style>{`
          .factory-canvas {
            flex: 1;
            background: #f0f0f0;
            position: relative;
            overflow: hidden;
            height: 100vh;
          }

          .grid-background,
          .connections-layer {
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
          }

          .connections-layer {
            z-index: 1;
          }

          .empty-state {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: #9CA3AF;
            pointer-events: none;
          }

          .empty-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }

          .empty-state h3 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            color: #6B7280;
          }

          .empty-state p {
            font-size: 1rem;
          }
        `}</style>
    </div>
  );
}
