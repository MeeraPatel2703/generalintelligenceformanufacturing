/**
 * SIMPLE DES DEMO - MINIMAL WORKING EXAMPLE
 *
 * This is a from-scratch implementation to prove the concept works
 * No complex AI extraction, just a hardcoded simple queue
 */

import React, { useState, useEffect, useRef } from 'react';
import { DESEngine, SimulationStats, Resource as DESResource } from '../simulation/DESEngine';
import { SimioStyleResults } from './SimioStyleResults';

interface Entity {
  id: string;
  x: number;
  y: number;
  state: 'arriving' | 'waiting' | 'processing' | 'departing';
  color: string;
}

interface VisualResource {
  id: string;
  name: string;
  x: number;
  y: number;
  capacity: number;
  queue: string[]; // entity IDs
  processing: string[]; // entity IDs
}

interface SimEvent {
  time: number;
  type: 'arrival' | 'start_service' | 'end_service';
  entityId?: string;
}

export const SimpleDESDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [entities, setEntities] = useState<Map<string, Entity>>(new Map());
  const [resources, setResources] = useState<VisualResource[]>([
    {
      id: 'server1',
      name: 'Ticket Counter',
      x: 400,
      y: 300,
      capacity: 2,
      queue: [],
      processing: []
    }
  ]);

  const [stats, setStats] = useState({
    created: 0,
    departed: 0,
    inSystem: 0
  });

  // DES Engine for proper stats tracking
  const desEngineRef = useRef<DESEngine | null>(null);
  const [finalStats, setFinalStats] = useState<SimulationStats | null>(null);
  const [finalResources, setFinalResources] = useState<DESResource[] | null>(null);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [simulationTime, setSimulationTime] = useState(0);

  // Event queue (simple priority queue)
  const eventQueue = useRef<SimEvent[]>([]);
  const entityCounter = useRef(0);

  // Initialize simulation with some arrivals
  const initSimulation = () => {
    console.log('[SimpleDESDemo] Initializing simulation...');
    eventQueue.current = [];
    entityCounter.current = 0;

    // Initialize DES Engine for proper stats
    const engine = new DESEngine();
    engine.addResource('server1', 'Ticket Counter', 2);
    engine.addProcess('process1', 'Ticket Service', 'server1', {
      distribution: 'uniform',
      params: { min: 3, max: 7 }
    }, null);
    engine.setArrivalRate(0.2); // 0.2 entities per time unit
    engine.setMaxSimTime(100);
    desEngineRef.current = engine;

    // Schedule 20 arrivals over 100 time units
    for (let i = 0; i < 20; i++) {
      const arrivalTime = i * 5 + Math.random() * 2; // Every 5 units +/- random
      eventQueue.current.push({
        time: arrivalTime,
        type: 'arrival',
        entityId: `entity_${i}`
      });
    }

    // Sort by time
    eventQueue.current.sort((a, b) => a.time - b.time);

    console.log('[SimpleDESDemo] Scheduled', eventQueue.current.length, 'arrivals');
    console.log('[SimpleDESDemo] First arrival at time:', eventQueue.current[0]?.time);

    setCurrentTime(0);
    setEntities(new Map());
    setStats({ created: 0, departed: 0, inSystem: 0 });
    setSimulationComplete(false);
    setFinalStats(null);
    setFinalResources(null);
  };

  // Process next event
  const processNextEvent = () => {
    if (eventQueue.current.length === 0) return false;

    const event = eventQueue.current.shift()!;
    setCurrentTime(event.time);

    if (event.type === 'arrival') {
      handleArrival(event);
    } else if (event.type === 'start_service') {
      handleStartService(event);
    } else if (event.type === 'end_service') {
      handleEndService(event);
    }

    return true;
  };

  const handleArrival = (event: SimEvent) => {
    const entityId = event.entityId!;
    console.log(`[Time ${event.time.toFixed(2)}] Entity ${entityId} arrives`);

    // Create entity
    const newEntity: Entity = {
      id: entityId,
      x: 50,
      y: 300,
      state: 'arriving',
      color: `hsl(${Math.random() * 360}, 70%, 60%)`
    };

    setEntities(prev => {
      const next = new Map(prev);
      next.set(entityId, newEntity);
      return next;
    });

    setStats(prev => ({
      ...prev,
      created: prev.created + 1,
      inSystem: prev.inSystem + 1
    }));

    // Try to start service
    setResources(prev => {
      const resource = prev[0];
      if (resource.processing.length < resource.capacity) {
        // Start service immediately
        console.log(`[Time ${event.time.toFixed(2)}] Entity ${entityId} starts service`);

        const serviceTime = 3 + Math.random() * 4; // 3-7 time units
        eventQueue.current.push({
          time: event.time + serviceTime,
          type: 'end_service',
          entityId
        });
        eventQueue.current.sort((a, b) => a.time - b.time);

        return [{
          ...resource,
          processing: [...resource.processing, entityId]
        }];
      } else {
        // Join queue
        console.log(`[Time ${event.time.toFixed(2)}] Entity ${entityId} joins queue`);
        return [{
          ...resource,
          queue: [...resource.queue, entityId]
        }];
      }
    });
  };

  const handleStartService = (event: SimEvent) => {
    const entityId = event.entityId!;
    console.log(`[Time ${event.time.toFixed(2)}] Entity ${entityId} starts service`);

    const serviceTime = 3 + Math.random() * 4;
    eventQueue.current.push({
      time: event.time + serviceTime,
      type: 'end_service',
      entityId
    });
    eventQueue.current.sort((a, b) => a.time - b.time);
  };

  const handleEndService = (event: SimEvent) => {
    const entityId = event.entityId!;
    console.log(`[Time ${event.time.toFixed(2)}] Entity ${entityId} ends service`);

    // Remove from processing
    setResources(prev => {
      const resource = prev[0];
      const processing = resource.processing.filter(id => id !== entityId);
      const queue = [...resource.queue];

      // If there's someone in queue, start their service
      if (queue.length > 0 && processing.length < resource.capacity) {
        const nextEntityId = queue.shift()!;
        processing.push(nextEntityId);

        const serviceTime = 3 + Math.random() * 4;
        eventQueue.current.push({
          time: event.time + serviceTime,
          type: 'end_service',
          entityId: nextEntityId
        });
        eventQueue.current.sort((a, b) => a.time - b.time);
      }

      return [{
        ...resource,
        processing,
        queue
      }];
    });

    // Move entity to departure
    setEntities(prev => {
      const next = new Map(prev);
      const entity = next.get(entityId);
      if (entity) {
        next.set(entityId, { ...entity, state: 'departing', x: 750, y: 300 });

        // Remove after animation
        setTimeout(() => {
          setEntities(current => {
            const updated = new Map(current);
            updated.delete(entityId);
            return updated;
          });
        }, 500);
      }
      return next;
    });

    setStats(prev => ({
      ...prev,
      departed: prev.departed + 1,
      inSystem: prev.inSystem - 1
    }));
  };

  // Animation loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const hasMore = processNextEvent();
      if (!hasMore) {
        setIsRunning(false);
        console.log('[SimpleDESDemo] Simulation complete!');

        // Run the DES engine to completion for accurate stats
        if (desEngineRef.current) {
          desEngineRef.current.initialize();
          desEngineRef.current.run();
          const engineStats = desEngineRef.current.getStats();
          const engineResources = desEngineRef.current.getResources();
          const engineTime = desEngineRef.current.getCurrentTime();

          setFinalStats(engineStats);
          setFinalResources(engineResources);
          setSimulationTime(engineTime);
          setSimulationComplete(true);

          console.log('[SimpleDESDemo] Final stats:', engineStats);
        }
      }
    }, 100); // Process event every 100ms

    return () => clearInterval(interval);
  }, [isRunning]);

  // Update entity positions
  useEffect(() => {
    setEntities(prev => {
      const next = new Map(prev);
      const resource = resources[0];

      // Update positions based on state
      resource.queue.forEach((entityId, index) => {
        const entity = next.get(entityId);
        if (entity) {
          next.set(entityId, {
            ...entity,
            state: 'waiting',
            x: resource.x - 100,
            y: resource.y - 50 + index * 40
          });
        }
      });

      resource.processing.forEach((entityId, index) => {
        const entity = next.get(entityId);
        if (entity) {
          next.set(entityId, {
            ...entity,
            state: 'processing',
            x: resource.x,
            y: resource.y + index * 40
          });
        }
      });

      return next;
    });
  }, [resources]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw resource
    const resource = resources[0];
    ctx.fillStyle = resource.processing.length >= resource.capacity ? '#ef4444' : '#10b981';
    ctx.fillRect(resource.x - 60, resource.y - 40, 120, 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.fillText(resource.name, resource.x - 50, resource.y - 50);
    ctx.fillText(`${resource.processing.length}/${resource.capacity}`, resource.x - 20, resource.y);

    // Draw queue indicator
    if (resource.queue.length > 0) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`Queue: ${resource.queue.length}`, resource.x - 150, resource.y - 80);
    }

    // Draw entities
    entities.forEach(entity => {
      ctx.fillStyle = entity.color;
      ctx.beginPath();
      ctx.arc(entity.x, entity.y, 15, 0, Math.PI * 2);
      ctx.fill();

      // Draw state indicator
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.fillText(entity.state.charAt(0).toUpperCase(), entity.x - 4, entity.y + 4);
    });

    // Draw entrance and exit
    ctx.fillStyle = '#60a5fa';
    ctx.fillText('→ ENTRANCE', 10, 280);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('EXIT →', 750, 280);

  }, [entities, resources]);

  const handleStart = () => {
    if (!isRunning) {
      initSimulation();
      setIsRunning(true);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    initSimulation();
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#0f0f1e', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ marginBottom: '20px' }}>🎯 SIMPLE DES DEMO - WORKING EXAMPLE</h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={handleStart}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isRunning ? '#555' : '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          START
        </button>

        <button
          onClick={handleStop}
          disabled={!isRunning}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: !isRunning ? '#555' : '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: !isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          STOP
        </button>

        <button
          onClick={handleReset}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          RESET
        </button>

        <div style={{ marginLeft: '20px', fontSize: '18px', fontFamily: 'monospace' }}>
          Time: <span style={{ color: '#10b981', fontWeight: 'bold' }}>{currentTime.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#1a1a2e', padding: '15px', borderRadius: '8px' }}>
          <div style={{ color: '#60a5fa', marginBottom: '5px' }}>Entities Created</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{stats.created}</div>
        </div>

        <div style={{ backgroundColor: '#1a1a2e', padding: '15px', borderRadius: '8px' }}>
          <div style={{ color: '#60a5fa', marginBottom: '5px' }}>In System</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fbbf24' }}>{stats.inSystem}</div>
        </div>

        <div style={{ backgroundColor: '#1a1a2e', padding: '15px', borderRadius: '8px' }}>
          <div style={{ color: '#60a5fa', marginBottom: '5px' }}>Departed</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>{stats.departed}</div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          border: '2px solid #3b82f6',
          borderRadius: '8px',
          backgroundColor: '#1a1a2e'
        }}
      />

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#9ca3af' }}>
        <p>This is a simple M/M/2 queue (2 servers) with random arrivals and service times.</p>
        <p>Events in queue: {eventQueue.current.length}</p>
        <p>Status: {isRunning ? '🟢 RUNNING' : '🔴 STOPPED'}</p>
      </div>

      {/* RESULTS PAGE - Shows after simulation completes */}
      {simulationComplete && finalStats && finalResources && (
        <SimioStyleResults
          stats={finalStats}
          resources={finalResources}
          simulationTime={simulationTime}
        />
      )}
    </div>
  );
};
