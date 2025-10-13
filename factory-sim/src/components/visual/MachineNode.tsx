/**
 * Machine Node - Visual Machine on Canvas
 *
 * Draggable, clickable machine representation.
 * Shows state, queue, utilization during simulation.
 */

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { VisualMachine, useFactoryStore } from '../../store/factoryStore';

interface MachineNodeProps {
  machine: VisualMachine;
}

export function MachineNode({ machine }: MachineNodeProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: machine.id,
    data: { type: 'MACHINE', machine }
  });

  const selectMachine = useFactoryStore(state => state.selectMachine);
  const completeConnection = useFactoryStore(state => state.completeConnection);
  const connectingMode = useFactoryStore(state => state.connectingMode);
  const selectedMachineId = useFactoryStore(state => state.selectedMachineId);
  const connections = useFactoryStore(state => state.connections);

  const [isHovering, setIsHovering] = React.useState(false);

  const style = {
    transform: CSS.Translate.toString(transform),
    left: machine.position.x,
    top: machine.position.y,
    width: machine.size.width,
    height: machine.size.height,
    borderColor: machine.color,
    backgroundColor: getStateColor(machine.runtimeState)
  };

  const isSelected = selectedMachineId === machine.id;
  
  // Connection mode states
  const isConnectingSource = connectingMode.step === 'selecting-target' && connectingMode.sourceId === machine.id;
  const isSelectingSource = connectingMode.step === 'selecting-source';
  const isSelectingTarget = connectingMode.step === 'selecting-target';
  
  const isValidTarget = isSelectingTarget && 
                        connectingMode.sourceId !== null && 
                        connectingMode.sourceId !== machine.id &&
                        !connections.some(c => 
                          c.from === connectingMode.sourceId && c.to === machine.id
                        );
  
  const isInvalidTarget = isSelectingTarget && 
                          (connectingMode.sourceId === machine.id ||
                           connections.some(c => 
                             c.from === connectingMode.sourceId && c.to === machine.id
                           ));

  function getStateColor(state?: string): string {
    switch (state) {
      case 'busy': return '#3B82F6';
      case 'idle': return '#10B981';
      case 'blocked': return '#EF4444';
      case 'down': return '#6B7280';
      default: return '#FFFFFF';
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (connectingMode.active) {
      // In connection mode - let completeConnection handle the logic
      completeConnection(machine.id);
    } else {
      // Normal mode - select the machine
      selectMachine(machine.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectMachine(machine.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`machine-node 
        ${isSelected ? 'selected' : ''} 
        ${machine.isBottleneck ? 'bottleneck' : ''}
        ${isConnectingSource ? 'connecting-source' : ''}
        ${isSelectingSource ? 'selectable-source' : ''}
        ${isValidTarget && isHovering ? 'valid-target-hover' : ''}
        ${isValidTarget && !isHovering ? 'valid-target' : ''}
        ${isInvalidTarget ? 'invalid-target' : ''}
      `}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Machine icon */}
      <div className="machine-icon">{machine.icon}</div>

      {/* Machine name */}
      <div className="machine-name">{machine.id}</div>

      {/* Queue indicator */}
      {(machine.currentQueue !== undefined && machine.currentQueue > 0) && (
        <div className="queue-badge">{machine.currentQueue}</div>
      )}

      {/* Utilization bar */}
      {machine.currentUtilization !== undefined && (
        <div className="utilization-bar">
          <div
            className="utilization-fill"
            style={{ width: `${machine.currentUtilization * 100}%` }}
          />
        </div>
      )}

      {/* Connection points */}
      <div className="connection-point left" />
      <div className="connection-point right" />

      {/* Connection mode indicator */}
      {isConnectingSource && (
        <div className="source-indicator">
          <div className="pulse-ring" />
          <div className="source-label">🟢 Source</div>
        </div>
      )}

      {isSelectingSource && isHovering && (
        <div className="source-hint">Click to set as source</div>
      )}

      {isValidTarget && (
        <div className="target-hint">🎯 Click to connect</div>
      )}

      {isInvalidTarget && connectingMode.sourceId !== machine.id && (
        <div className="invalid-hint">❌ Already connected</div>
      )}

      <style>{`
        .machine-node {
          position: absolute;
          border: 3px solid;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          cursor: move;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          user-select: none;
        }

        .machine-node:hover {
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
          transform: translateY(-2px);
        }

        .machine-node.selected {
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          border-width: 4px;
        }

        .machine-node.bottleneck {
          animation: pulse-red 2s infinite;
        }

        /* Connection mode styles */
        .machine-node.selectable-source {
          cursor: pointer !important;
          animation: pulse-blue 1.5s infinite;
        }

        .machine-node.connecting-source {
          border-color: #10B981 !important;
          border-width: 4px;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.3), 
                      0 0 20px rgba(16, 185, 129, 0.5);
          animation: pulse-green 1.5s infinite;
        }

        .machine-node.valid-target {
          border-color: #3B82F6 !important;
          border-width: 4px;
          cursor: pointer !important;
          animation: pulse-blue 1.5s infinite;
        }

        .machine-node.valid-target-hover {
          border-color: #10B981 !important;
          border-width: 5px;
          box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.4),
                      0 8px 30px rgba(16, 185, 129, 0.6);
          transform: translateY(-4px) scale(1.05);
          cursor: pointer !important;
        }

        .machine-node.invalid-target {
          opacity: 0.4;
          cursor: not-allowed !important;
        }

        @keyframes pulse-red {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
        }

        @keyframes pulse-green {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.3);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.3),
                        0 0 30px rgba(16, 185, 129, 0.6);
          }
        }

        @keyframes pulse-blue {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
          }
        }

        .machine-icon {
          font-size: 2rem;
          margin-bottom: 0.25rem;
        }

        .machine-name {
          font-size: 0.75rem;
          font-weight: 600;
          color: #333;
          text-align: center;
        }

        .queue-badge {
          position: absolute;
          top: -10px;
          right: -10px;
          background: #F59E0B;
          color: white;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .utilization-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: #E5E7EB;
          border-bottom-left-radius: 7px;
          border-bottom-right-radius: 7px;
          overflow: hidden;
        }

        .utilization-fill {
          height: 100%;
          background: linear-gradient(90deg, #10B981, #F59E0B, #EF4444);
          transition: width 0.5s ease;
        }

        .connection-point {
          position: absolute;
          width: 12px;
          height: 12px;
          background: #3B82F6;
          border: 2px solid white;
          border-radius: 50%;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          cursor: pointer;
        }

        .connection-point.left {
          left: -6px;
        }

        .connection-point.right {
          right: -6px;
        }

        .connection-point:hover {
          width: 16px;
          height: 16px;
          left: -8px;
        }

        .connection-point.right:hover {
          right: -8px;
        }

        /* Connection mode indicators */
        .source-indicator {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
        }

        .pulse-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          border: 3px solid #10B981;
          border-radius: 50%;
          animation: pulse-ring 1.5s ease-out infinite;
        }

        @keyframes pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }

        .source-label {
          background: #10B981;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
        }

        .source-hint {
          position: absolute;
          bottom: -35px;
          left: 50%;
          transform: translateX(-50%);
          background: #3B82F6;
          color: white;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
          pointer-events: none;
          animation: bounce 1s ease-in-out infinite;
        }

        .source-hint::before {
          content: '';
          position: absolute;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 6px solid #3B82F6;
        }

        .target-hint {
          position: absolute;
          bottom: -35px;
          left: 50%;
          transform: translateX(-50%);
          background: #3B82F6;
          color: white;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
          pointer-events: none;
          animation: bounce 1s ease-in-out infinite;
        }

        .target-hint::before {
          content: '';
          position: absolute;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 6px solid #3B82F6;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          50% {
            transform: translateX(-50%) translateY(-4px);
          }
        }

        .invalid-hint {
          position: absolute;
          bottom: -35px;
          left: 50%;
          transform: translateX(-50%);
          background: #EF4444;
          color: white;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
