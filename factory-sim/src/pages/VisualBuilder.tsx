/**
 * Visual Builder Page
 *
 * Main Simio-like interface with:
 * - Machine library (left)
 * - Factory canvas (center)
 * - Toolbar (top)
 */

import React, { useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { MachineLibrary } from '../components/visual/MachineLibrary';
import { FactoryCanvas } from '../components/visual/FactoryCanvas';
import { useFactoryStore, VisualMachine } from '../store/factoryStore';
import { SimulationResults } from '../types/simulation';
import SimulationResultsComponent from '../components/SimulationResults';

export function VisualBuilder() {
  const machines = useFactoryStore(state => state.machines);
  const connections = useFactoryStore(state => state.connections);
  const connectingMode = useFactoryStore(state => state.connectingMode);
  const startConnection = useFactoryStore(state => state.startConnection);
  const cancelConnection = useFactoryStore(state => state.cancelConnection);
  const clearAll = useFactoryStore(state => state.clearAll);
  const addMachine = useFactoryStore(state => state.addMachine);
  const updateMachine = useFactoryStore(state => state.updateMachine);
  const spawnEntity = useFactoryStore(state => state.spawnEntity);

  const [simResults, setSimResults] = useState<SimulationResults | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Handle ESC key to cancel connection mode
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && connectingMode.active) {
        cancelConnection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [connectingMode.active, cancelConnection]);

  // Spawn entities on all connections for testing
  const handleSpawnEntities = () => {
    if (connections.length === 0) {
      alert('Create connections first!');
      return;
    }
    connections.forEach(conn => {
      spawnEntity(conn.id);
    });
  };

  // Handle drag and drop for adding/moving machines
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const data = active.data.current;

    if (!data) return;

    if (data.type === 'MACHINE_TEMPLATE') {
      // Dropping new machine from library
      const template = data.template;
      const canvasRect = document.getElementById('factory-canvas')?.getBoundingClientRect();

      if (!canvasRect) return;

      const newMachine: VisualMachine = {
        id: '', // Will be auto-generated
        type: template.type,
        processTime: template.processTime,
        capacity: template.capacity,
        position: {
          x: active.rect.current.translated!.left - canvasRect.left,
          y: active.rect.current.translated!.top - canvasRect.top
        },
        size: template.size,
        color: template.color,
        icon: template.icon
      };

      addMachine(newMachine);
    } else if (data.type === 'MACHINE') {
      // Moving existing machine
      const machine = data.machine as VisualMachine;
      updateMachine(machine.id, {
        position: {
          x: machine.position.x + delta.x,
          y: machine.position.y + delta.y
        }
      });
    }
  };

  const handleConnect = () => {
    if (connectingMode.active) {
      // Cancel connection mode
      cancelConnection();
    } else {
      // Enter connection mode (source will be selected by clicking a machine)
      startConnection(null as any); // Will be set when user clicks a machine
    }
  };

  const handleRunSimulation = async () => {
    if (machines.length === 0) {
      alert('Add some machines first!');
      return;
    }

    if (connections.length === 0) {
      alert('Connect your machines first!');
      return;
    }

    setIsSimulating(true);

    // Convert visual factory to simulation config
    const analysis = {
      machines: machines.map(m => ({
        id: m.id,
        name: m.id,
        type: m.type,
        cycle_time: {
          mean: m.processTime.mean || 10,
          std_dev: m.processTime.stdDev || 2,
          unit: 'min' as const,
          distribution_type: m.processTime.distribution
        },
        utilization: { avg: 80, max: 95, is_bottleneck: false },
        queue_pattern: { avg_length: m.capacity / 2, is_growing: false },
        plc_tag_prefix: `${m.id}_`
      })),
      flow_sequence: extractFlowSequence(),
      bottleneck: {
        machine_id: machines[0]?.id || '',
        reason: 'To be determined by simulation',
        utilization_pct: 0,
        queue_length: 0,
        severity: 'low' as const
      },
      data_quality: {
        total_rows: 1000,
        time_span_hours: 24,
        missing_data_pct: 0
      }
    };

    try {
      const result = await window.electron.runSimulation(analysis, 100);

      if (result.success && result.results) {
        setSimResults(result.results);
      } else {
        alert(`Simulation failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const extractFlowSequence = (): string[] => {
    // Build flow sequence from connections (topological sort)
    const sequence: string[] = [];
    const visited = new Set<string>();
    const inDegree = new Map<string, number>();

    // Count incoming connections for each machine
    machines.forEach(m => inDegree.set(m.id, 0));
    connections.forEach(c => {
      inDegree.set(c.to, (inDegree.get(c.to) || 0) + 1);
    });

    // Start with machines that have no incoming connections
    const queue = machines.filter(m => inDegree.get(m.id) === 0).map(m => m.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;

      sequence.push(current);
      visited.add(current);

      // Add downstream machines to queue
      connections
        .filter(c => c.from === current)
        .forEach(c => {
          inDegree.set(c.to, (inDegree.get(c.to) || 0) - 1);
          if (inDegree.get(c.to) === 0) {
            queue.push(c.to);
          }
        });
    }

    // Add any remaining machines (disconnected)
    machines.forEach(m => {
      if (!visited.has(m.id)) {
        sequence.push(m.id);
      }
    });

    return sequence;
  };

  return (
    <div className="visual-builder">
      {/* Toolbar */}
      <div className="toolbar">
        <h1>🏭 Factory Visual Builder</h1>

        {connectingMode.active && (
          <div className="connection-status">
            {connectingMode.step === 'selecting-source' ? (
              <>
                <span className="status-icon">📍</span>
                <span className="status-text">
                  <strong>Step 1:</strong> Click any machine to set as SOURCE • Press <kbd>ESC</kbd> to cancel
                </span>
              </>
            ) : connectingMode.step === 'selecting-target' ? (
              <>
                <span className="status-icon">🎯</span>
                <span className="status-text">
                  <strong>Step 2:</strong> Click target machine to complete connection • Press <kbd>ESC</kbd> to cancel
                </span>
              </>
            ) : null}
          </div>
        )}

        <div className="toolbar-actions">
          <button
            onClick={handleConnect}
            className={connectingMode.active ? 'btn-active' : ''}
          >
            {connectingMode.active ? '✕ Cancel' : '🔗 Connect Machines'}
          </button>

          <button 
            onClick={handleSpawnEntities} 
            disabled={connections.length === 0}
            className="btn-spawn"
          >
            🚀 Spawn Parts
          </button>

          <button onClick={handleRunSimulation} disabled={isSimulating || machines.length === 0}>
            {isSimulating ? '⏳ Running...' : '▶️ Run Simulation'}
          </button>

          <button onClick={clearAll} className="btn-danger">
            🗑️ Clear All
          </button>

          <div className="stats">
            <span>Machines: {machines.length}</span>
            <span>Connections: {connections.length}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <DndContext onDragEnd={handleDragEnd}>
        <div className="content">
          <MachineLibrary />
          <FactoryCanvas />
        </div>
      </DndContext>

      {/* Simulation results modal */}
      {simResults && (
        <div className="results-modal">
          <div className="results-content">
            <button
              className="close-btn"
              onClick={() => setSimResults(null)}
            >
              ✕
            </button>
            <SimulationResultsComponent results={simResults} />
          </div>
        </div>
      )}

      <style>{`
        .visual-builder {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #f0f0f0;
        }

        .toolbar {
          background: white;
          border-bottom: 2px solid #e0e0e0;
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          position: relative;
        }

        .toolbar h1 {
          margin: 0;
          font-size: 1.5rem;
          color: #333;
        }

        .connection-status {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          padding: 0.75rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          animation: slideDown 0.3s ease-out;
          z-index: 100;
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .connection-status .status-icon {
          font-size: 1.5rem;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        .connection-status .status-text {
          font-size: 0.95rem;
          font-weight: 600;
        }

        .connection-status kbd {
          background: rgba(255, 255, 255, 0.3);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.85rem;
          font-weight: 700;
          border: 1px solid rgba(255, 255, 255, 0.4);
        }

        .toolbar-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .toolbar button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #3B82F6;
          color: white;
        }

        .toolbar button:hover:not(:disabled) {
          background: #2563EB;
          transform: translateY(-1px);
        }

        .toolbar button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .toolbar button.btn-active {
          background: #10B981;
        }

        .toolbar button.btn-spawn {
          background: #8B5CF6;
        }

        .toolbar button.btn-spawn:hover:not(:disabled) {
          background: #7C3AED;
        }

        .toolbar button.btn-danger {
          background: #EF4444;
        }

        .toolbar button.btn-danger:hover {
          background: #DC2626;
        }

        .stats {
          display: flex;
          gap: 1.5rem;
          font-size: 0.875rem;
          color: #666;
          font-weight: 600;
        }

        .content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .results-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .results-content {
          background: white;
          border-radius: 12px;
          max-width: 1200px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          margin: 2rem;
        }

        .close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: #EF4444;
          color: white;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.25rem;
          z-index: 10;
        }

        .close-btn:hover {
          background: #DC2626;
        }
      `}</style>
    </div>
  );
}
