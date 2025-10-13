/**
 * Machine Library - Drag Source
 *
 * Left panel with draggable machine templates.
 * Users drag from here onto the factory canvas.
 */

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const MACHINE_TEMPLATES = {
  CNC: {
    name: 'CNC Machine',
    type: 'CNC',
    color: '#3B82F6',
    icon: '🔧',
    processTime: {
      distribution: 'normal' as const,
      mean: 12,
      stdDev: 2
    },
    capacity: 5,
    size: { width: 100, height: 80 }
  },
  ASSEMBLY: {
    name: 'Assembly Station',
    type: 'Assembly',
    color: '#10B981',
    icon: '🔩',
    processTime: {
      distribution: 'normal' as const,
      mean: 8,
      stdDev: 1.5
    },
    capacity: 3,
    size: { width: 120, height: 80 }
  },
  QC: {
    name: 'Quality Control',
    type: 'QualityControl',
    color: '#F59E0B',
    icon: '🔍',
    processTime: {
      distribution: 'normal' as const,
      mean: 5,
      stdDev: 1
    },
    capacity: 2,
    size: { width: 100, height: 80 }
  },
  STORAGE: {
    name: 'Buffer/Storage',
    type: 'Storage',
    color: '#8B5CF6',
    icon: '📦',
    processTime: {
      distribution: 'constant' as const,
      mean: 0.5
    },
    capacity: 50,
    size: { width: 80, height: 80 }
  }
};

interface DraggableMachineProps {
  machineType: string;
  template: typeof MACHINE_TEMPLATES[keyof typeof MACHINE_TEMPLATES];
}

function DraggableMachine({ machineType, template }: DraggableMachineProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `machine-template-${machineType}`,
    data: { type: 'MACHINE_TEMPLATE', machineType, template }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="machine-template"
    >
      <div className="machine-icon">{template.icon}</div>
      <div className="machine-name">{template.name}</div>
      <div className="machine-details">
        <div className="detail-row">
          <span>⏱️ {template.processTime.mean} min</span>
        </div>
        <div className="detail-row">
          <span>📦 Queue: {template.capacity}</span>
        </div>
      </div>

      <style>{`
        .machine-template {
          padding: 1rem;
          background: white;
          border: 2px solid ${template.color};
          border-radius: 8px;
          cursor: grab;
          transition: all 0.2s ease;
          user-select: none;
        }

        .machine-template:active {
          cursor: grabbing;
        }

        .machine-template:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }

        .machine-icon {
          font-size: 2.5rem;
          text-align: center;
          margin-bottom: 0.5rem;
        }

        .machine-name {
          font-size: 0.875rem;
          font-weight: 600;
          text-align: center;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .machine-details {
          font-size: 0.75rem;
          color: #666;
        }

        .detail-row {
          margin: 0.25rem 0;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

export function MachineLibrary() {
  return (
    <div className="machine-library">
      <h2>🏭 Machine Library</h2>
      <p className="library-subtitle">Drag machines onto the canvas</p>

      <div className="machine-grid">
        {Object.entries(MACHINE_TEMPLATES).map(([key, template]) => (
          <DraggableMachine
            key={key}
            machineType={key}
            template={template}
          />
        ))}
      </div>

      <div className="instructions">
        <h3>📝 Instructions</h3>
        <ol>
          <li>Drag machines onto canvas</li>
          <li>Click "Connect" mode</li>
          <li>Click source → Click target</li>
          <li>Click connection to set lag time</li>
          <li>Click "Spawn Parts" to test flow</li>
          <li>Watch entities flow between machines</li>
          <li>Click "Run Simulation"</li>
        </ol>
      </div>

      <style>{`
        .machine-library {
          width: 280px;
          background: #f8f9fa;
          border-right: 2px solid #e0e0e0;
          padding: 1.5rem;
          overflow-y: auto;
          height: 100vh;
        }

        .machine-library h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          color: #333;
        }

        .library-subtitle {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 1.5rem;
        }

        .machine-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .instructions {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 2px solid #e0e0e0;
        }

        .instructions h3 {
          font-size: 1rem;
          color: #333;
          margin-bottom: 0.75rem;
        }

        .instructions ol {
          font-size: 0.875rem;
          color: #666;
          padding-left: 1.25rem;
          margin: 0;
        }

        .instructions li {
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  );
}
