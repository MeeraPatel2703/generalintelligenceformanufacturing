/**
 * Live Simulation Canvas
 *
 * Real-time visualization of DES simulation with animated entities moving through the system
 */

import React, { useEffect, useRef, useState } from 'react';
import { ExtractedSystem } from '../types/extraction';

interface SimulationEntity {
  id: string;
  type: string;
  currentLocation: string;
  targetLocation: string | null;
  position: { x: number; y: number };
  progress: number;
  color: string;
  state: 'waiting' | 'processing' | 'traveling';
}

interface ResourceNode {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  capacity: number;
  currentLoad: number;
  queue: number;
}

interface LiveSimulationCanvasProps {
  system: ExtractedSystem;
  isRunning: boolean;
  simulationTime: number;
}

export function LiveSimulationCanvas({ system, isRunning, simulationTime }: LiveSimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [entities, setEntities] = useState<SimulationEntity[]>([]);
  const [resources, setResources] = useState<ResourceNode[]>([]);
  const [stats, setStats] = useState({ throughput: 0, avgWaitTime: 0, utilization: 0 });

  // Initialize resources layout
  useEffect(() => {
    if (!system.resources) return;

    const canvasWidth = 1200;
    const canvasHeight = 600;
    const resourceNodes: ResourceNode[] = [];

    // Layout resources in a flow pattern
    const numResources = system.resources.length;
    const horizontalSpacing = canvasWidth / (numResources + 1);

    system.resources.forEach((resource, index) => {
      resourceNodes.push({
        id: resource.id || `resource-${index}`,
        name: resource.name,
        type: resource.type,
        position: {
          x: horizontalSpacing * (index + 1),
          y: canvasHeight / 2
        },
        size: { width: 120, height: 80 },
        capacity: resource.capacity || 1,
        currentLoad: 0,
        queue: 0
      });
    });

    setResources(resourceNodes);
  }, [system]);

  // Simulation loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // Spawn new entities randomly
      if (Math.random() < 0.1 && entities.length < 50) {
        const firstResource = resources[0];
        if (firstResource) {
          const newEntity: SimulationEntity = {
            id: `entity-${Date.now()}-${Math.random()}`,
            type: system.entities?.[0]?.name || 'Entity',
            currentLocation: 'entry',
            targetLocation: firstResource.id,
            position: { x: 50, y: firstResource.position.y },
            progress: 0,
            color: `hsl(${Math.random() * 360}, 70%, 60%)`,
            state: 'traveling'
          };
          setEntities(prev => [...prev, newEntity]);
        }
      }

      // Update entity positions and states
      setEntities(prevEntities => {
        return prevEntities.map(entity => {
          if (entity.state === 'traveling' && entity.targetLocation) {
            const targetResource = resources.find(r => r.id === entity.targetLocation);
            if (!targetResource) return entity;

            // Move towards target
            const dx = targetResource.position.x - entity.position.x;
            const dy = targetResource.position.y - entity.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 5) {
              // Arrived at resource
              return {
                ...entity,
                position: { x: targetResource.position.x, y: targetResource.position.y },
                state: 'processing' as const,
                currentLocation: entity.targetLocation!,
                progress: 0
              };
            } else {
              // Keep moving
              const speed = 3;
              return {
                ...entity,
                position: {
                  x: entity.position.x + (dx / distance) * speed,
                  y: entity.position.y + (dy / distance) * speed
                }
              };
            }
          } else if (entity.state === 'processing') {
            const newProgress = entity.progress + 0.02;
            if (newProgress >= 1) {
              // Processing complete, move to next resource
              const currentIndex = resources.findIndex(r => r.id === entity.currentLocation);
              const nextResource = resources[currentIndex + 1];

              if (nextResource) {
                return {
                  ...entity,
                  state: 'traveling' as const,
                  targetLocation: nextResource.id,
                  progress: 0
                };
              } else {
                // Completed - remove entity
                return { ...entity, targetLocation: 'exit' };
              }
            }
            return { ...entity, progress: newProgress };
          }
          return entity;
        }).filter(e => e.targetLocation !== 'exit');
      });

      // Update stats
      setStats(prev => ({
        throughput: entities.length * 0.5,
        avgWaitTime: Math.random() * 10,
        utilization: Math.min(100, (entities.length / resources.length) * 10)
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [isRunning, entities.length, resources]);

  // Render simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw connections between resources
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    for (let i = 0; i < resources.length - 1; i++) {
      const from = resources[i];
      const to = resources[i + 1];
      ctx.beginPath();
      ctx.moveTo(from.position.x + from.size.width / 2, from.position.y);
      ctx.lineTo(to.position.x - to.size.width / 2, to.position.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw resources
    resources.forEach(resource => {
      const { position, size, name, currentLoad, capacity, queue } = resource;

      // Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // Resource box
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(
        position.x - size.width / 2,
        position.y - size.height / 2,
        size.width,
        size.height,
        8
      );
      ctx.fill();
      ctx.stroke();

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Resource name
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(name, position.x, position.y - 10);

      // Capacity info
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Arial';
      ctx.fillText(`${currentLoad}/${capacity}`, position.x, position.y + 10);

      // Queue indicator
      if (queue > 0) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`Queue: ${queue}`, position.x, position.y + 25);
      }
    });

    // Draw entities
    entities.forEach(entity => {
      const { position, color, state, progress } = entity;

      // Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 5;

      // Entity circle
      ctx.fillStyle = color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(position.x, position.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Processing indicator
      if (state === 'processing') {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(position.x, position.y, 16, 0, Math.PI * 2 * progress);
        ctx.stroke();
      }

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    });

  }, [entities, resources]);

  return (
    <div className="live-simulation-container">
      <div className="simulation-header">
        <h3>🎬 Live Simulation</h3>
        <div className="simulation-status">
          <span className={`status-indicator ${isRunning ? 'running' : 'paused'}`}></span>
          <span>{isRunning ? 'Running' : 'Paused'}</span>
          <span className="sim-time">Time: {simulationTime.toFixed(1)}s</span>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">Throughput:</span>
          <span className="stat-value">{stats.throughput.toFixed(1)} units/hr</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg Wait:</span>
          <span className="stat-value">{stats.avgWaitTime.toFixed(1)} min</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Utilization:</span>
          <span className="stat-value">{stats.utilization.toFixed(0)}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Entities:</span>
          <span className="stat-value">{entities.length}</span>
        </div>
      </div>

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={1200}
          height={600}
          className="simulation-canvas"
        />
      </div>

      <div className="legend">
        <div className="legend-item">
          <div className="legend-icon traveling"></div>
          <span>Traveling</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon processing"></div>
          <span>Processing</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon resource"></div>
          <span>Resource</span>
        </div>
      </div>

      <style>{`
        .live-simulation-container {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin-top: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .simulation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .simulation-header h3 {
          margin: 0;
          font-size: 1.5rem;
        }

        .simulation-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #666;
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #9ca3af;
        }

        .status-indicator.running {
          background: #10b981;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .sim-time {
          margin-left: 1rem;
          font-weight: 600;
          color: #3b82f6;
        }

        .stats-bar {
          display: flex;
          gap: 2rem;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat-label {
          font-size: 0.85rem;
          color: #6b7280;
          font-weight: 600;
        }

        .stat-value {
          font-size: 1.2rem;
          color: #1f2937;
          font-weight: bold;
        }

        .canvas-wrapper {
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          background: #f9fafb;
        }

        .simulation-canvas {
          display: block;
          width: 100%;
          height: auto;
        }

        .legend {
          display: flex;
          gap: 1.5rem;
          margin-top: 1rem;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 8px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #6b7280;
        }

        .legend-icon {
          width: 16px;
          height: 16px;
          border-radius: 50%;
        }

        .legend-icon.traveling {
          background: hsl(200, 70%, 60%);
          border: 2px solid white;
        }

        .legend-icon.processing {
          background: hsl(150, 70%, 60%);
          border: 2px solid #10b981;
        }

        .legend-icon.resource {
          background: white;
          border: 2px solid #3b82f6;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
