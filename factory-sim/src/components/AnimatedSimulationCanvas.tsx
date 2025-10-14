/**
 * Animated Simulation Canvas
 * 
 * Real-time visualization of entities flowing through resources
 * Shows queues, processing, and smooth animations
 */

import { useEffect, useRef, useState } from 'react';
import { IndustrialSimulationAdapter, VisualEntity, VisualResource } from '../des-core/IndustrialSimulationAdapter';

interface Props {
  simulator: IndustrialSimulationAdapter;
  isRunning: boolean;
}

// Colors for visual appeal
const COLORS = {
  background: '#1a1a2e',
  entity: {
    created: '#4ade80',      // Green - just created
    waiting: '#fbbf24',      // Yellow - in queue
    processing: '#60a5fa',   // Blue - being processed
    traveling: '#a78bfa',    // Purple - moving between resources
  },
  resource: {
    idle: '#374151',         // Gray - idle
    busy: '#ef4444',         // Red - busy
    outline: '#6b7280',      // Border
  },
  queue: '#f59e0b',          // Orange
  text: '#f3f4f6',           // Light gray
  grid: '#2d3748',           // Dark grid lines
};

export function AnimatedSimulationCanvas({ simulator, isRunning: _isRunning }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [resources, setResources] = useState<VisualResource[]>([]);
  const [entities, setEntities] = useState<VisualEntity[]>([]);
  
  // Animation state
  const animationFrameRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(Date.now());
  
  // Camera controls (zoom and pan)
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update entities and resources from simulator
  useEffect(() => {
    const updateInterval = setInterval(() => {
      try {
        const visualEntities = simulator.getVisualEntities();
        const visualResources = simulator.getVisualResources();
        
        setEntities(visualEntities);
        setResources(visualResources);
      } catch (error) {
        console.error('[AnimatedCanvas] Error updating visuals:', error);
      }
    }, 50); // Update 20 times per second

    return () => clearInterval(updateInterval);
  }, [simulator]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = Math.max(600, parent.clientHeight);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Animation loop
    const animate = () => {
      const now = Date.now();
      lastUpdateTimeRef.current = now;

      // Clear canvas
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Apply camera transforms (zoom and pan)
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Draw grid (optional, for reference)
      drawGrid(ctx, canvas.width / zoom, canvas.height / zoom);

      // Draw entrance and exit markers
      drawEntranceExit(ctx, resources);

      // Draw connections between resources (flow lines)
      drawResourceConnections(ctx, resources);

      // Draw resources (stations/machines)
      resources.forEach(resource => {
        drawResource(ctx, resource);
      });

      // Draw entities (customers/parts)
      entities.forEach(entity => {
        drawEntity(ctx, entity);
      });

      // Restore canvas state
      ctx.restore();

      // Draw legend (not affected by zoom/pan)
      drawLegend(ctx, canvas.width, canvas.height);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', resize);
    };
  }, [resources, entities, zoom, pan]);

  // Mouse event handlers for pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  /**
   * Handle mouse wheel zoom
   * Note: preventDefault removed to avoid passive event listener warning
   */
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * zoomFactor)));
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Zoom controls overlay */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '10px',
        borderRadius: '8px'
      }}>
        <button
          onClick={() => setZoom(prev => Math.min(5, prev * 1.2))}
          style={{
            padding: '5px 10px',
            backgroundColor: '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          +
        </button>
        <div style={{ 
          color: 'white', 
          fontSize: '12px', 
          textAlign: 'center',
          fontFamily: 'monospace'
        }}>
          {(zoom * 100).toFixed(0)}%
        </div>
        <button
          onClick={() => setZoom(prev => Math.max(0.1, prev / 1.2))}
          style={{
            padding: '5px 10px',
            backgroundColor: '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          −
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          style={{
            padding: '5px 10px',
            backgroundColor: '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '10px',
            marginTop: '5px'
          }}
        >
          Reset
        </button>
      </div>

      {/* Instructions overlay */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '8px 12px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '11px',
        fontFamily: 'monospace'
      }}>
        🖱️ Drag to pan | 🔍 Scroll to zoom
      </div>

      <div style={{ 
        width: '100%', 
        height: '600px', 
        backgroundColor: COLORS.background,
        borderRadius: '12px',
        overflow: 'hidden',
        border: `2px solid ${COLORS.resource.outline}`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}>
        <canvas 
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ 
            display: 'block',
            width: '100%',
            height: '100%'
          }}
        />
      </div>
    </div>
  );
}

/**
 * Draw a subtle grid for spatial reference
 */
function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.3;

  const gridSize = 50;

  // Vertical lines
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

/**
 * Draw entrance and exit markers
 */
function drawEntranceExit(ctx: CanvasRenderingContext2D, resources: VisualResource[]): void {
  if (resources.length === 0) return;

  const firstResource = resources[0];
  const lastResource = resources[resources.length - 1];

  // Draw ENTRANCE
  const entranceX = firstResource.position.x - 200;
  const entranceY = firstResource.position.y;

  ctx.fillStyle = '#10b981';
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.8;

  // Entrance arrow
  ctx.beginPath();
  ctx.moveTo(entranceX - 30, entranceY);
  ctx.lineTo(entranceX, entranceY - 20);
  ctx.lineTo(entranceX, entranceY - 10);
  ctx.lineTo(entranceX + 40, entranceY - 10);
  ctx.lineTo(entranceX + 40, entranceY + 10);
  ctx.lineTo(entranceX, entranceY + 10);
  ctx.lineTo(entranceX, entranceY + 20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('ENTRANCE', entranceX + 5, entranceY);
  ctx.font = 'bold 12px Arial';
  ctx.fillText('→', entranceX + 60, entranceY);

  // Draw EXIT
  const exitX = lastResource.position.x + 200;
  const exitY = lastResource.position.y;

  ctx.fillStyle = '#ef4444';
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.8;

  // Exit arrow
  ctx.beginPath();
  ctx.moveTo(exitX + 30, exitY);
  ctx.lineTo(exitX, exitY - 20);
  ctx.lineTo(exitX, exitY - 10);
  ctx.lineTo(exitX - 40, exitY - 10);
  ctx.lineTo(exitX - 40, exitY + 10);
  ctx.lineTo(exitX, exitY + 10);
  ctx.lineTo(exitX, exitY + 20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', exitX - 5, exitY);
  ctx.font = 'bold 12px Arial';
  ctx.fillText('→', exitX - 60, exitY);
}

/**
 * Draw flow lines between resources
 */
function drawResourceConnections(ctx: CanvasRenderingContext2D, resources: VisualResource[]): void {
  if (resources.length < 2) return;

  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.4;
  ctx.setLineDash([5, 5]);

  // Connect resources in sequence
  for (let i = 0; i < resources.length - 1; i++) {
    const from = resources[i];
    const to = resources[i + 1];

    ctx.beginPath();
    ctx.moveTo(from.position.x + 60, from.position.y);
    ctx.lineTo(to.position.x - 60, to.position.y);
    ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

/**
 * Draw a resource (station/machine/server)
 * Simio-style: utilization-driven heat, activity animations
 */
function drawResource(ctx: CanvasRenderingContext2D, resource: VisualResource): void {
  const { x, y } = resource.position;
  const width = 120;
  const height = 80;

  // Utilization-driven color (heat map style)
  const utilizationPercent = resource.utilization;
  const isBusy = resource.currentLoad > 0;
  
  // Heat map: green (low) -> yellow (medium) -> red (high)
  let fillColor;
  if (utilizationPercent < 30) {
    fillColor = COLORS.resource.idle; // Gray - idle/low
  } else if (utilizationPercent < 70) {
    fillColor = '#f59e0b'; // Orange - medium utilization
  } else if (utilizationPercent < 90) {
    fillColor = '#ef4444'; // Red - high utilization  
  } else {
    fillColor = '#dc2626'; // Dark red - critical utilization
  }
  
  // Add pulsing glow when busy
  if (isBusy) {
    const glowIntensity = 10 + Math.sin(Date.now() / 500) * 5;
    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = fillColor;
  }

  // Draw main box
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = COLORS.resource.outline;
  ctx.lineWidth = 3;

  // Box with rounded corners
  const cornerRadius = 8;
  ctx.beginPath();
  ctx.moveTo(x - width/2 + cornerRadius, y - height/2);
  ctx.lineTo(x + width/2 - cornerRadius, y - height/2);
  ctx.quadraticCurveTo(x + width/2, y - height/2, x + width/2, y - height/2 + cornerRadius);
  ctx.lineTo(x + width/2, y + height/2 - cornerRadius);
  ctx.quadraticCurveTo(x + width/2, y + height/2, x + width/2 - cornerRadius, y + height/2);
  ctx.lineTo(x - width/2 + cornerRadius, y + height/2);
  ctx.quadraticCurveTo(x - width/2, y + height/2, x - width/2, y + height/2 - cornerRadius);
  ctx.lineTo(x - width/2, y - height/2 + cornerRadius);
  ctx.quadraticCurveTo(x - width/2, y - height/2, x - width/2 + cornerRadius, y - height/2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw utilization bar at bottom
  if (utilizationPercent > 0) {
    const barWidth = (width - 20) * (utilizationPercent / 100);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(x - width/2 + 10, y + height/2 - 15, barWidth, 8);
  }

  // Draw resource name
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(resource.name, x, y - 15);

  // Draw capacity info
  ctx.font = '12px Arial';
  ctx.fillText(`${resource.currentLoad}/${resource.capacity}`, x, y + 5);

  // Draw queue length if any
  if (resource.queueLength > 0) {
    ctx.fillStyle = COLORS.queue;
    ctx.font = 'bold 11px Arial';
    ctx.fillText(`Queue: ${resource.queueLength}`, x, y + 20);
  }

  // Draw utilization percentage
  ctx.fillStyle = COLORS.text;
  ctx.globalAlpha = 0.7;
  ctx.font = '10px Arial';
  ctx.fillText(`${utilizationPercent.toFixed(1)}% util`, x, y + height/2 - 25);
  ctx.globalAlpha = 1;
}

/**
 * Draw an entity (customer/part/item)
 * Simio-style: clear visual identity with state labels, bigger and more visible
 */
function drawEntity(ctx: CanvasRenderingContext2D, entity: VisualEntity): void {
  const { x, y } = entity.position;
  const radius = 16; // BIGGER for better visibility!

  // Determine color based on state
  let color = COLORS.entity.created;
  let stateName = 'Created';
  switch (entity.state) {
    case 'waiting':
      color = COLORS.entity.waiting;
      stateName = 'Queue';
      break;
    case 'processing':
      color = COLORS.entity.processing;
      stateName = 'Processing';
      break;
    case 'traveling':
      color = COLORS.entity.traveling;
      stateName = 'Moving';
      break;
    case 'created':
      stateName = 'Arrived';
      break;
  }

  // Draw entity as a circle with STRONG glow
  ctx.shadowBlur = 15;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.strokeStyle = COLORS.text;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0; // Reset shadow

  // Add a rotating pulse effect for ALL entities (more visible)
  const time = Date.now() / 1000;
  const pulseRadius = radius + 6 + Math.sin(time * 4) * 4;
  ctx.globalAlpha = 0.5 + Math.sin(time * 4) * 0.3;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Draw entity label with state - BIGGER
  // Extract entity number from ID (e.g., "entity_0_42" -> "E42")
  const entityNum = entity.id.split('_').pop() || '?';
  const label = `E${entityNum}`;

  // Background for label
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.font = 'bold 14px monospace';
  const labelWidth = ctx.measureText(label).width + 8;
  ctx.fillRect(x - labelWidth/2, y - radius - 24, labelWidth, 18);

  // Label text - BIGGER
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y - radius - 15);

  // State indicator below entity - BIGGER AND ALWAYS VISIBLE
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.font = 'bold 11px monospace';
  const stateWidth = ctx.measureText(stateName).width + 6;
  ctx.fillRect(x - stateWidth/2, y + radius + 6, stateWidth, 16);

  ctx.fillStyle = COLORS.text;
  ctx.fillText(stateName, x, y + radius + 14);
}

/**
 * Draw legend explaining colors
 */
function drawLegend(ctx: CanvasRenderingContext2D, width: number, _height: number): void {
  const legendX = width - 180;
  const legendY = 20;
  const lineHeight = 20;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(legendX - 10, legendY - 10, 170, 140);

  ctx.font = 'bold 12px Arial';
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'left';
  
  ctx.fillText('Legend', legendX, legendY);

  const items = [
    { color: COLORS.entity.created, label: 'Created' },
    { color: COLORS.entity.waiting, label: 'Waiting' },
    { color: COLORS.entity.processing, label: 'Processing' },
    { color: COLORS.entity.traveling, label: 'Traveling' },
    { color: COLORS.resource.busy, label: 'Resource Busy' },
    { color: COLORS.resource.idle, label: 'Resource Idle' },
  ];

  items.forEach((item, index) => {
    const y = legendY + (index + 1) * lineHeight;
    
    // Draw color swatch
    ctx.fillStyle = item.color;
    ctx.fillRect(legendX, y - 8, 15, 15);
    ctx.strokeStyle = COLORS.text;
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, y - 8, 15, 15);

    // Draw label
    ctx.fillStyle = COLORS.text;
    ctx.font = '11px Arial';
    ctx.fillText(item.label, legendX + 20, y);
  });
}

