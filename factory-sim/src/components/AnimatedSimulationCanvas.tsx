/**
 * Animated Simulation Canvas
 * 
 * Real-time visualization of entities flowing through resources
 * Shows queues, processing, and smooth animations
 */

import { useEffect, useRef, useState } from 'react';
import { IndustrialSimulationAdapter, VisualEntity, VisualResource } from '../des-core/IndustrialSimulationAdapter';
import { LogicEditor, EntityEditor } from './SimulationEditors';
import { ScratchLikeBlockEditor } from './ScratchLikeBlockEditor';

interface Props {
  simulator: IndustrialSimulationAdapter;
  isRunning: boolean;
}

// Path interface for enhanced flow visualization with Simio functionality
interface Path {
  id: string;
  fromResource: string;
  toResource: string;
  travelTime: number; // minutes
  speed: number; // units per minute (default 10)
  capacity: number; // max entities on path (default unlimited = -1)
  type: 'conveyor' | 'transport' | 'direct'; // path type
  flowPercentage?: number; // for routing (default 100%)
  bidirectional: boolean;
  color: string;
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

  // Path management state
  const [paths, setPaths] = useState<Path[]>([]);
  const [selectedPath, setSelectedPath] = useState<Path | null>(null);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [showPathEditor, setShowPathEditor] = useState(false);

  // Resource editing state
  const [selectedResource, setSelectedResource] = useState<VisualResource | null>(null);
  const [showResourceEditor, setShowResourceEditor] = useState(false);
  const [hoveredResource, setHoveredResource] = useState<string | null>(null);
  const [isDraggingResource, setIsDraggingResource] = useState(false);
  const [draggedResourceId, setDraggedResourceId] = useState<string | null>(null);

  // Entity editing state
  const [selectedEntity, setSelectedEntity] = useState<VisualEntity | null>(null);
  const [showEntityEditor, setShowEntityEditor] = useState(false);

  // Logic editor state
  const [showLogicEditor, setShowLogicEditor] = useState(false);
  const [selectedLogicTarget, setSelectedLogicTarget] = useState<{type: 'resource' | 'path' | 'entity', id: string} | null>(null);

  // Mode state
  const [editMode, setEditMode] = useState<'select' | 'add-resource' | 'add-path' | 'add-logic'>('select');

  // Initialize paths from resources - ONLY ONCE
  useEffect(() => {
    if (resources.length >= 2 && paths.length === 0) {
      const initialPaths: Path[] = [];
      for (let i = 0; i < resources.length - 1; i++) {
        initialPaths.push({
          id: `path_${i}`,
          fromResource: resources[i].name,
          toResource: resources[i + 1].name,
          travelTime: 0.5,
          speed: 10,
          capacity: -1, // unlimited
          type: 'conveyor',
          flowPercentage: 100,
          bidirectional: false,
          color: '#10b981'
        });
      }
      setPaths(initialPaths);
      console.log('[Canvas] Initialized paths:', initialPaths);
    }
  }, [resources.length]);

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

      // Draw paths with directional arrows (ENHANCED)
      paths.forEach(path => {
        drawEnhancedPath(ctx, path, resources, hoveredPath === path.id, selectedPath?.id === path.id);
      });

      // Draw resources (stations/machines)
      resources.forEach(resource => {
        drawResource(ctx, resource, hoveredResource === resource.id, selectedResource?.id === resource.id);
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

  // Mouse event handlers for pan and path interaction
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    // Priority 1: Check if clicking on a resource
    const clickedResource = resources.find(resource => {
      const dx = mouseX - resource.position.x;
      const dy = mouseY - resource.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < 60; // Within 60 pixel radius
    });

    if (clickedResource && editMode === 'select') {
      if (e.shiftKey) {
        // Shift+click to edit logic
        setSelectedLogicTarget({ type: 'resource', id: clickedResource.id });
        setShowLogicEditor(true);
      } else if (e.altKey || e.metaKey) {
        // Alt/Cmd+click to drag resource
        setIsDraggingResource(true);
        setDraggedResourceId(clickedResource.id);
      } else {
        // Normal click to edit properties
        setSelectedResource(clickedResource);
        setShowResourceEditor(true);
      }
      return;
    }

    // Priority 2: Check if clicking on an entity
    const clickedEntity = entities.find(entity => {
      const dx = mouseX - entity.position.x;
      const dy = mouseY - entity.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < 20; // Within 20 pixel radius
    });

    if (clickedEntity && editMode === 'select') {
      setSelectedEntity(clickedEntity);
      setShowEntityEditor(true);
      return;
    }

    // Priority 3: Check if clicking on a path
    const clickedPath = paths.find(path => {
      const fromRes = resources.find(r => r.name === path.fromResource);
      const toRes = resources.find(r => r.name === path.toResource);
      if (!fromRes || !toRes) return false;

      return isPointNearPath(mouseX, mouseY, fromRes.position, toRes.position);
    });

    if (clickedPath && editMode === 'select') {
      if (e.shiftKey) {
        // Shift+click to edit path logic
        setSelectedLogicTarget({ type: 'path', id: clickedPath.id });
        setShowLogicEditor(true);
      } else {
        setSelectedPath(clickedPath);
        setShowPathEditor(true);
      }
      return;
    }

    // No element clicked - start panning
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    // Handle resource dragging
    if (isDraggingResource && draggedResourceId) {
      // Update resource position (would need to pass back to simulator)
      console.log(`Dragging resource ${draggedResourceId} to (${mouseX}, ${mouseY})`);
      // TODO: Implement resource position update in simulator
      return;
    }

    // Check hover on resources
    const hoveredResourceId = resources.find(resource => {
      const dx = mouseX - resource.position.x;
      const dy = mouseY - resource.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < 60;
    })?.id || null;

    setHoveredResource(hoveredResourceId);

    // Check hover on paths
    const hoveredPathId = paths.find(path => {
      const fromRes = resources.find(r => r.name === path.fromResource);
      const toRes = resources.find(r => r.name === path.toResource);
      if (!fromRes || !toRes) return false;

      return isPointNearPath(mouseX, mouseY, fromRes.position, toRes.position);
    })?.id || null;

    setHoveredPath(hoveredPathId);

    // Handle canvas panning
    if (!isDragging) return;

    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;

    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDraggingResource(false);
    setDraggedResourceId(null);
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
      {/* Edit Mode Toolbar */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '200px',
        zIndex: 20,
        display: 'flex',
        gap: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: '12px',
        borderRadius: '8px',
        border: '2px solid #10b981'
      }}>
        <button
          onClick={() => setEditMode('select')}
          style={{
            padding: '8px 16px',
            backgroundColor: editMode === 'select' ? '#10b981' : '#374151',
            color: editMode === 'select' ? '#000' : '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}
        >
          🖱️ SELECT
        </button>
        <button
          onClick={() => setEditMode('add-resource')}
          style={{
            padding: '8px 16px',
            backgroundColor: editMode === 'add-resource' ? '#10b981' : '#374151',
            color: editMode === 'add-resource' ? '#000' : '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}
        >
          ➕ ADD SERVER
        </button>
        <button
          onClick={() => setEditMode('add-path')}
          style={{
            padding: '8px 16px',
            backgroundColor: editMode === 'add-path' ? '#10b981' : '#374151',
            color: editMode === 'add-path' ? '#000' : '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}
        >
          🛤️ ADD PATH
        </button>
      </div>

      {/* Instructions for editing */}
      <div style={{
        position: 'absolute',
        top: '70px',
        right: '200px',
        zIndex: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: '10px',
        borderRadius: '6px',
        border: '2px solid #60a5fa',
        maxWidth: '250px',
        fontSize: '0.75rem',
        color: '#f3f4f6',
        lineHeight: '1.4'
      }}>
        <div style={{ fontWeight: 700, marginBottom: '6px', color: '#60a5fa' }}>💡 EDITING TIPS:</div>
        <div>• <strong>Click</strong> elements to edit</div>
        <div>• <strong>Shift+Click</strong> for logic editor</div>
        <div>• <strong>Alt/Cmd+Click</strong> to drag</div>
        <div>• <strong>Delete key</strong> to remove</div>
      </div>

      {/* Resource Editor Panel */}
      {showResourceEditor && selectedResource && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 100,
          backgroundColor: '#1a1a2e',
          border: '3px solid #60a5fa',
          borderRadius: '12px',
          padding: '20px',
          minWidth: '450px',
          maxWidth: '550px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ color: '#60a5fa', margin: 0, fontSize: '1.2rem' }}>
              ⚙️ SERVER / RESOURCE EDITOR
            </h3>
            <button
              onClick={() => {
                setShowResourceEditor(false);
                setSelectedResource(null);
              }}
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

          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#374151', borderRadius: '6px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#60a5fa', marginBottom: '8px' }}>
              {selectedResource.name}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
              Resource ID: {selectedResource.id}
            </div>
          </div>

          {/* Resource Name */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#f3f4f6', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
              Resource Name:
            </label>
            <input
              type="text"
              value={selectedResource.name}
              onChange={(e) => {
                // TODO: Update resource name in simulator
                console.log('Update resource name:', e.target.value);
              }}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#374151',
                color: '#f3f4f6',
                border: '2px solid #6b7280',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Capacity */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#f3f4f6', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
              Capacity (Servers):
            </label>
            <input
              type="number"
              min="1"
              value={selectedResource.capacity}
              onChange={(e) => {
                // TODO: Update capacity in simulator
                console.log('Update capacity:', e.target.value);
              }}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#374151',
                color: '#f3f4f6',
                border: '2px solid #6b7280',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
              Number of parallel servers at this resource
            </div>
          </div>

          {/* Current Statistics (Read-only) */}
          <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#1f2937', borderRadius: '6px', border: '2px solid #374151' }}>
            <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '10px' }}>📊 LIVE STATISTICS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Current Load:</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f3f4f6' }}>
                  {selectedResource.currentLoad} / {selectedResource.capacity}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Queue Length:</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b' }}>
                  {selectedResource.queueLength}
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Utilization:</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#60a5fa' }}>
                  {selectedResource.utilization.toFixed(1)}%
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#374151',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginTop: '4px'
                }}>
                  <div style={{
                    width: `${selectedResource.utilization}%`,
                    height: '100%',
                    backgroundColor: selectedResource.utilization > 80 ? '#ef4444' : selectedResource.utilization > 50 ? '#f59e0b' : '#10b981',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={() => {
                setSelectedLogicTarget({ type: 'resource', id: selectedResource.id });
                setShowResourceEditor(false);
                setShowLogicEditor(true);
              }}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#a78bfa',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ⚡ EDIT LOGIC
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete resource "${selectedResource.name}"?`)) {
                  // TODO: Implement deletion
                  console.log('Delete resource:', selectedResource.id);
                  setShowResourceEditor(false);
                  setSelectedResource(null);
                }
              }}
              style={{
                padding: '12px 16px',
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🗑️ DELETE
            </button>
          </div>
        </div>
      )}

      {/* Entity Editor Panel */}
      {showEntityEditor && selectedEntity && (
        <EntityEditor
          entity={selectedEntity}
          onClose={() => {
            setShowEntityEditor(false);
            setSelectedEntity(null);
          }}
          onUpdate={(updated) => {
            console.log('Update entity:', updated);
            // TODO: Implement entity updates
          }}
        />
      )}

      {/* Scratch-Like Block Editor - Full Screen */}
      {showLogicEditor && selectedLogicTarget && (
        <ScratchLikeBlockEditor
          targetType={selectedLogicTarget.type}
          targetId={selectedLogicTarget.id}
          onClose={() => {
            setShowLogicEditor(false);
            setSelectedLogicTarget(null);
          }}
        />
      )}

      {/* Path Editor Panel */}
      {showPathEditor && selectedPath && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 100,
          backgroundColor: '#1a1a2e',
          border: '3px solid #10b981',
          borderRadius: '12px',
          padding: '20px',
          minWidth: '400px',
          maxWidth: '500px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ color: '#10b981', margin: 0, fontSize: '1.2rem' }}>
              🛤️ PATH EDITOR
            </h3>
            {/* Current Color Preview */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: '#374151',
              borderRadius: '6px',
              border: `2px solid ${selectedPath.color}`
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                backgroundColor: selectedPath.color,
                borderRadius: '4px',
                boxShadow: `0 0 8px ${selectedPath.color}`
              }} />
              <span style={{ fontSize: '0.85rem', color: '#f3f4f6', fontWeight: 600 }}>
                Current
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#374151', borderRadius: '6px' }}>
            <strong style={{ color: '#f3f4f6' }}>From:</strong> <span style={{ color: '#60a5fa' }}>{selectedPath.fromResource}</span>
            <span style={{ margin: '0 8px', color: selectedPath.color, fontSize: '1.2rem' }}>→</span>
            <strong style={{ color: '#f3f4f6' }}>To:</strong> <span style={{ color: '#60a5fa' }}>{selectedPath.toResource}</span>
          </div>

          {/* Travel Time */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#f3f4f6', display: 'block', marginBottom: '5px' }}>
              Travel Time (minutes):
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={selectedPath.travelTime}
              onChange={(e) => {
                const updated = { ...selectedPath, travelTime: parseFloat(e.target.value) || 0 };
                setSelectedPath(updated);
                setPaths(paths.map(p => p.id === updated.id ? updated : p));
              }}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#374151',
                color: '#f3f4f6',
                border: '2px solid #6b7280',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Speed */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#f3f4f6', display: 'block', marginBottom: '5px' }}>
              Speed (units/min):
            </label>
            <input
              type="number"
              step="1"
              min="1"
              value={selectedPath.speed}
              onChange={(e) => {
                const updated = { ...selectedPath, speed: parseFloat(e.target.value) || 1 };
                setSelectedPath(updated);
                setPaths(paths.map(p => p.id === updated.id ? updated : p));
              }}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#374151',
                color: '#f3f4f6',
                border: '2px solid #6b7280',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Capacity */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#f3f4f6', display: 'block', marginBottom: '5px' }}>
              Capacity (entities, -1 = unlimited):
            </label>
            <input
              type="number"
              step="1"
              value={selectedPath.capacity}
              onChange={(e) => {
                const updated = { ...selectedPath, capacity: parseInt(e.target.value) || -1 };
                setSelectedPath(updated);
                setPaths(paths.map(p => p.id === updated.id ? updated : p));
              }}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#374151',
                color: '#f3f4f6',
                border: '2px solid #6b7280',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Type */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#f3f4f6', display: 'block', marginBottom: '5px' }}>
              Path Type:
            </label>
            <select
              value={selectedPath.type}
              onChange={(e) => {
                const updated = { ...selectedPath, type: e.target.value as 'conveyor' | 'transport' | 'direct' };
                setSelectedPath(updated);
                setPaths(paths.map(p => p.id === updated.id ? updated : p));
              }}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#374151',
                color: '#f3f4f6',
                border: '2px solid #6b7280',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            >
              <option value="conveyor">Conveyor</option>
              <option value="transport">Transport</option>
              <option value="direct">Direct</option>
            </select>
          </div>

          {/* Bidirectional */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                checked={selectedPath.bidirectional}
                onChange={(e) => {
                  const updated = { ...selectedPath, bidirectional: e.target.checked };
                  setSelectedPath(updated);
                  setPaths(paths.map(p => p.id === updated.id ? updated : p));
                }}
                style={{ width: '20px', height: '20px' }}
              />
              Bidirectional Flow
            </label>
          </div>

          {/* Color Picker with Labels */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#f3f4f6', display: 'block', marginBottom: '10px', fontSize: '1rem' }}>
              Path Color:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { color: '#10b981', name: 'Green' },
                { color: '#60a5fa', name: 'Blue' },
                { color: '#f59e0b', name: 'Orange' },
                { color: '#ef4444', name: 'Red' },
                { color: '#a78bfa', name: 'Purple' },
                { color: '#ec4899', name: 'Pink' },
                { color: '#14b8a6', name: 'Teal' },
                { color: '#f97316', name: 'Amber' },
                { color: '#84cc16', name: 'Lime' }
              ].map(({ color, name }) => (
                <button
                  key={color}
                  onClick={() => {
                    const updated = { ...selectedPath, color };
                    setSelectedPath(updated);
                    setPaths(paths.map(p => p.id === updated.id ? updated : p));
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px',
                    backgroundColor: selectedPath.color === color ? '#374151' : '#1f2937',
                    border: selectedPath.color === color ? '3px solid white' : '2px solid #6b7280',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedPath.color !== color) {
                      e.currentTarget.style.backgroundColor = '#374151';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedPath.color !== color) {
                      e.currentTarget.style.backgroundColor = '#1f2937';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: color,
                    borderRadius: '6px',
                    boxShadow: selectedPath.color === color ? `0 0 12px ${color}` : 'none'
                  }} />
                  <span style={{
                    fontSize: '11px',
                    color: selectedPath.color === color ? '#ffffff' : '#9ca3af',
                    fontWeight: selectedPath.color === color ? 700 : 400
                  }}>
                    {name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setShowPathEditor(false);
              setSelectedPath(null);
            }}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#10b981',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ✓ DONE
          </button>
        </div>
      )}

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
 * Helper: Check if point is near a path (for click detection)
 */
function isPointNearPath(
  px: number,
  py: number,
  from: { x: number; y: number },
  to: { x: number; y: number },
  threshold: number = 15
): boolean {
  // Calculate distance from point to line segment
  const fromX = from.x + 60;
  const fromY = from.y;
  const toX = to.x - 60;
  const toY = to.y;

  const A = px - fromX;
  const B = py - fromY;
  const C = toX - fromX;
  const D = toY - fromY;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = fromX;
    yy = fromY;
  } else if (param > 1) {
    xx = toX;
    yy = toY;
  } else {
    xx = fromX + param * C;
    yy = fromY + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < threshold;
}

/**
 * Draw enhanced path with directional arrows and Simio-style features
 */
function drawEnhancedPath(
  ctx: CanvasRenderingContext2D,
  path: Path,
  resources: VisualResource[],
  isHovered: boolean,
  isSelected: boolean
): void {
  const fromRes = resources.find(r => r.name === path.fromResource);
  const toRes = resources.find(r => r.name === path.toResource);

  if (!fromRes || !toRes) return;

  const fromX = fromRes.position.x + 60;
  const fromY = fromRes.position.y;
  const toX = toRes.position.x - 60;
  const toY = toRes.position.y;

  // Calculate angle and distance
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const distance = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);

  // Determine line style based on path type
  let lineWidth = 4;
  let lineDash: number[] = [];

  switch (path.type) {
    case 'conveyor':
      lineWidth = 6;
      lineDash = [];
      break;
    case 'transport':
      lineWidth = 5;
      lineDash = [10, 5];
      break;
    case 'direct':
      lineWidth = 3;
      lineDash = [5, 5];
      break;
  }

  // Highlight if hovered or selected
  if (isSelected) {
    lineWidth += 4;
  } else if (isHovered) {
    lineWidth += 2;
  }

  // Draw main path line
  ctx.save();
  ctx.strokeStyle = path.color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(lineDash);
  ctx.globalAlpha = isSelected ? 1 : isHovered ? 0.9 : 0.7;

  // Add glow effect for selected/hovered
  if (isSelected || isHovered) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = path.color;
  }

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // Draw animated directional arrows along the path
  const numArrows = Math.max(3, Math.floor(distance / 100));
  const time = Date.now() / 1000;
  const animationOffset = (time % 1) * (distance / numArrows);

  for (let i = 0; i < numArrows; i++) {
    const t = (i / numArrows) + (animationOffset / distance);
    if (t > 1) continue;

    const arrowX = fromX + (toX - fromX) * t;
    const arrowY = fromY + (toY - fromY) * t;

    drawArrow(ctx, arrowX, arrowY, angle, path.color, isHovered || isSelected);
  }

  // Draw bidirectional indicator if applicable
  if (path.bidirectional) {
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;

    ctx.fillStyle = path.color;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⇄', midX, midY - 20);
  }

  // Draw path info label (on hover or select)
  if (isHovered || isSelected) {
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;

    const label = `${path.type.toUpperCase()} | ${path.travelTime}min | ${path.speed} u/m`;
    const labelWidth = ctx.measureText(label).width + 20;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(midX - labelWidth / 2, midY + 10, labelWidth, 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, midX, midY + 22);
  }

  ctx.restore();
}

/**
 * Draw a directional arrow
 */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  color: string,
  isHighlighted: boolean
): void {
  const size = isHighlighted ? 14 : 10;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = color;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size / 2, -size / 2);
  ctx.lineTo(-size / 2, size / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw a resource (station/machine/server)
 * Simio-style: utilization-driven heat, activity animations
 */
function drawResource(ctx: CanvasRenderingContext2D, resource: VisualResource, isHovered: boolean = false, isSelected: boolean = false): void {
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
  
  // Add highlighting for hover/selection
  if (isSelected) {
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#60a5fa';
    ctx.lineWidth = 5;
  } else if (isHovered) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#10b981';
    ctx.lineWidth = 4;
  } else if (isBusy) {
    // Add pulsing glow when busy
    const glowIntensity = 10 + Math.sin(Date.now() / 500) * 5;
    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = fillColor;
  }

  // Draw main box
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = isSelected ? '#60a5fa' : isHovered ? '#10b981' : COLORS.resource.outline;
  ctx.lineWidth = isSelected ? 5 : isHovered ? 4 : 3;

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

