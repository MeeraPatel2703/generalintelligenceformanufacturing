/**
 * Real DES Simulation Canvas
 *
 * ACTUALLY CONNECTED TO THE DES ENGINE - NOT FAKE!
 * Beautiful, smooth, accurate visualization
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ExtractedSystem } from '../types/extraction';
import { SophisticatedDESEngine, SimEntity, SimResource } from '../simulation/SophisticatedDESEngine';

interface VisualEntity {
  id: string;
  type: string;
  position: { x: number; y: number };
  targetPosition: { x: number; y: number };
  state: 'arriving' | 'waiting' | 'processing' | 'traveling' | 'departed';
  color: string;
  currentResource?: string;
  arrivalTime: number;
}

interface ResourceNode {
  id: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  capacity: number;
  inUse: number;
  queueLength: number;
  color: string;
}

interface Stats {
  currentTime: number;
  entitiesCreated: number;
  entitiesDeparted: number;
  entitiesInSystem: number;
  avgCycleTime: number;
  throughput: number;
}

interface RealDESSimulationCanvasProps {
  system: ExtractedSystem;
  onStatsUpdate?: (stats: Stats) => void;
}

export function RealDESSimulationCanvas({ system, onStatsUpdate }: RealDESSimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SophisticatedDESEngine | null>(null);
  const animationFrameRef = useRef<number>();

  const [isRunning, setIsRunning] = useState(false);
  const [visualEntities, setVisualEntities] = useState<VisualEntity[]>([]);
  const [resourceNodes, setResourceNodes] = useState<ResourceNode[]>([]);
  const [stats, setStats] = useState<Stats>({
    currentTime: 0,
    entitiesCreated: 0,
    entitiesDeparted: 0,
    entitiesInSystem: 0,
    avgCycleTime: 0,
    throughput: 0
  });

  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  // Initialize DES engine
  useEffect(() => {
    console.log('[RealDESCanvas] Initializing engine with system:', system);
    engineRef.current = new SophisticatedDESEngine(system);

    // Setup resource layout
    const canvasWidth = 1400;
    const canvasHeight = 700;
    const resources = system.resources || [];

    const nodes: ResourceNode[] = [];

    if (resources.length === 0) {
      console.warn('[RealDESCanvas] No resources in system!');
      return;
    }

    // Smart layout - flow from left to right
    const margin = 100;
    const spacing = (canvasWidth - 2 * margin) / Math.max(1, resources.length - 1);

    resources.forEach((resource, idx) => {
      const y = canvasHeight / 2 + (idx % 2 === 0 ? -80 : 80) * (Math.floor(idx / 4));

      nodes.push({
        id: resource.name,
        name: resource.name,
        position: {
          x: margin + (idx * spacing),
          y: y
        },
        size: { width: 140, height: 90 },
        capacity: resource.capacity || 1,
        inUse: 0,
        queueLength: 0,
        color: colors[idx % colors.length]
      });
    });

    setResourceNodes(nodes);
    console.log('[RealDESCanvas] Resource nodes created:', nodes.length);
  }, [system]);

  // Calculate entity visual position
  const getEntityVisualPosition = useCallback((entity: SimEntity): { x: number; y: number } => {
    if (entity.state === 'departed') {
      return { x: 1350, y: 350 }; // Exit position
    }

    // If at a resource
    if (entity.seizedResources.length > 0) {
      const resourceName = entity.seizedResources[0];
      const node = resourceNodes.find(r => r.id === resourceName);
      if (node) {
        // Position at resource with small offset
        const offset = (entity.id.charCodeAt(entity.id.length - 1) % 5) * 12 - 24;
        return { x: node.position.x, y: node.position.y - 50 + offset };
      }
    }

    // If waiting in queue
    const engine = engineRef.current;
    if (engine) {
      const simResources = engine.getResources();
      for (const resource of simResources) {
        const queueIndex = resource.queue.findIndex(e => e.id === entity.id);
        if (queueIndex !== -1) {
          const node = resourceNodes.find(r => r.id === resource.name);
          if (node) {
            return {
              x: node.position.x - 70 - (queueIndex * 20),
              y: node.position.y
            };
          }
        }
      }
    }

    // Default: entry position
    return { x: 50, y: 350 };
  }, [resourceNodes]);

  // Main simulation step
  const simulationStep = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    // Run 10 steps per frame for speed
    for (let i = 0; i < 10; i++) {
      const hasMore = engine.step();
      if (!hasMore) {
        console.log('[RealDESCanvas] Simulation complete!');
        setIsRunning(false);
        return;
      }
    }

    // Get current state from engine
    const simEntities = engine.getEntities();
    const simResources = engine.getResources();
    const simStats = engine.getStats();

    // Update stats
    setStats(simStats);
    if (onStatsUpdate) {
      onStatsUpdate(simStats);
    }

    // Update resource nodes
    setResourceNodes(prev => prev.map(node => {
      const simResource = simResources.find(r => r.name === node.id);
      if (simResource) {
        return {
          ...node,
          inUse: simResource.inUse,
          queueLength: simResource.queue.length
        };
      }
      return node;
    }));

    // Update visual entities
    const newVisualEntities: VisualEntity[] = simEntities.map(entity => {
      const pos = getEntityVisualPosition(entity);
      const existing = visualEntities.find(v => v.id === entity.id);

      return {
        id: entity.id,
        type: entity.type,
        position: existing?.position || pos,
        targetPosition: pos,
        state: entity.state,
        color: existing?.color || colors[parseInt(entity.id.split('-')[1] || '0') % colors.length],
        currentResource: entity.seizedResources[0],
        arrivalTime: entity.arrivalTime
      };
    });

    setVisualEntities(newVisualEntities);

    // Schedule next step
    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(simulationStep);
    }
  }, [isRunning, visualEntities, getEntityVisualPosition, onStatsUpdate]);

  // Start/stop simulation
  useEffect(() => {
    if (isRunning) {
      console.log('[RealDESCanvas] Starting simulation');
      simulationStep();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, simulationStep]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Smooth entity movement
    const updatedEntities = visualEntities.map(entity => {
      const dx = entity.targetPosition.x - entity.position.x;
      const dy = entity.targetPosition.y - entity.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 2) {
        const speed = Math.min(8, distance * 0.2);
        return {
          ...entity,
          position: {
            x: entity.position.x + (dx / distance) * speed,
            y: entity.position.y + (dy / distance) * speed
          }
        };
      }
      return entity;
    });

    setVisualEntities(updatedEntities);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.3)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw connections between resources
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    for (let i = 0; i < resourceNodes.length - 1; i++) {
      const from = resourceNodes[i];
      const to = resourceNodes[i + 1];
      ctx.beginPath();
      ctx.moveTo(from.position.x + 70, from.position.y);
      ctx.lineTo(to.position.x - 70, to.position.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw entry marker
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('↓ ENTRY', 50, 320);

    // Draw exit marker
    ctx.fillStyle = '#ef4444';
    ctx.fillText('EXIT ↑', 1350, 320);

    // Draw resources
    resourceNodes.forEach((node, idx) => {
      const { position, size, name, inUse, capacity, queueLength, color } = node;

      // Glow effect if active
      if (inUse > 0) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
      }

      // Resource box with gradient
      const boxGradient = ctx.createLinearGradient(
        position.x - size.width / 2,
        position.y - size.height / 2,
        position.x - size.width / 2,
        position.y + size.height / 2
      );
      boxGradient.addColorStop(0, '#ffffff');
      boxGradient.addColorStop(1, '#f8fafc');

      ctx.fillStyle = boxGradient;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.roundRect(
        position.x - size.width / 2,
        position.y - size.height / 2,
        size.width,
        size.height,
        12
      );
      ctx.fill();
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Resource icon
      ctx.fillStyle = color;
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⚙️', position.x, position.y - 15);

      // Resource name
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 14px Inter, Arial';
      ctx.fillText(name, position.x, position.y + 5);

      // Capacity bar
      const barWidth = 80;
      const barHeight = 8;
      const utilization = capacity > 0 ? inUse / capacity : 0;

      ctx.fillStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.roundRect(position.x - barWidth / 2, position.y + 15, barWidth, barHeight, 4);
      ctx.fill();

      ctx.fillStyle = utilization > 0.8 ? '#ef4444' : '#10b981';
      ctx.beginPath();
      ctx.roundRect(position.x - barWidth / 2, position.y + 15, barWidth * utilization, barHeight, 4);
      ctx.fill();

      // Capacity text
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px Inter, Arial';
      ctx.fillText(`${inUse}/${capacity}`, position.x, position.y + 32);

      // Queue indicator
      if (queueLength > 0) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(position.x + size.width / 2 - 10, position.y - size.height / 2 + 10, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(queueLength.toString(), position.x + size.width / 2 - 10, position.y - size.height / 2 + 15);
      }
    });

    // Draw entities with smooth animation
    updatedEntities.forEach(entity => {
      const { position, color, state } = entity;

      // Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;

      // Entity circle
      ctx.fillStyle = color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(position.x, position.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // State indicator
      if (state === 'processing') {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(position.x, position.y, 20, 0, Math.PI * 2);
        ctx.stroke();
      } else if (state === 'waiting') {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(position.x, position.y - 22, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    });

  }, [visualEntities, resourceNodes]);

  return (
    <div className="real-des-simulation">
      <div className="simulation-controls">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`control-btn ${isRunning ? 'running' : 'paused'}`}
        >
          {isRunning ? '⏸ Pause' : '▶️ Start'}
        </button>

        <button
          onClick={() => {
            setIsRunning(false);
            if (engineRef.current) {
              engineRef.current = new SophisticatedDESEngine(system);
              setVisualEntities([]);
              setStats({
                currentTime: 0,
                entitiesCreated: 0,
                entitiesDeparted: 0,
                entitiesInSystem: 0,
                avgCycleTime: 0,
                throughput: 0
              });
            }
          }}
          className="control-btn reset"
        >
          🔄 Reset
        </button>

        <div className="stats-display">
          <div className="stat">
            <span className="label">Time:</span>
            <span className="value">{stats.currentTime.toFixed(1)} min</span>
          </div>
          <div className="stat">
            <span className="label">Created:</span>
            <span className="value">{stats.entitiesCreated}</span>
          </div>
          <div className="stat">
            <span className="label">Departed:</span>
            <span className="value">{stats.entitiesDeparted}</span>
          </div>
          <div className="stat">
            <span className="label">In System:</span>
            <span className="value">{stats.entitiesInSystem}</span>
          </div>
          <div className="stat">
            <span className="label">Throughput:</span>
            <span className="value">{stats.throughput.toFixed(1)}/hr</span>
          </div>
          <div className="stat">
            <span className="label">Avg Cycle:</span>
            <span className="value">{stats.avgCycleTime.toFixed(2)} min</span>
          </div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={1400}
        height={700}
        className="simulation-canvas"
      />

      <style>{`
        .real-des-simulation {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .simulation-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .control-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
          font-family: Inter, Arial, sans-serif;
        }

        .control-btn.running {
          background: #10b981;
          color: white;
        }

        .control-btn.paused {
          background: #3b82f6;
          color: white;
        }

        .control-btn.reset {
          background: #6b7280;
          color: white;
        }

        .control-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .control-btn:active {
          transform: translateY(0);
        }

        .stats-display {
          display: flex;
          gap: 1.5rem;
          flex: 1;
          flex-wrap: wrap;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat .label {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat .value {
          font-size: 1.25rem;
          color: #1f2937;
          font-weight: 700;
        }

        .simulation-canvas {
          display: block;
          width: 100%;
          border-radius: 12px;
          box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  );
}
