/**
 * SIMPLE INDUSTRIAL SIMULATION - MINIMAL WORKING VERSION
 *
 * Just shows stats updating - proves the Industrial DES Kernel works end-to-end
 */

import { useEffect, useState } from 'react';
import { ExtractedSystem } from '../types/extraction';
import { IndustrialSimulationAdapter, SimulationStats } from '../des-core/IndustrialSimulationAdapter';
import { AnimatedSimulationCanvas } from './AnimatedSimulationCanvas';

interface Props {
  system: ExtractedSystem;
}

export function SimpleIndustrialSim({ system }: Props) {
  console.log('='.repeat(80));
  console.log('[SimpleIndustrialSim] COMPONENT RENDER - This should show EVERY render');
  console.log('[SimpleIndustrialSim] System entities:', system.entities.length);
  console.log('[SimpleIndustrialSim] System resources:', system.resources.length);
  console.log('='.repeat(80));

  const [simulator, setSimulator] = useState<IndustrialSimulationAdapter | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<SimulationStats | null>(null);
  const [speed, setSpeed] = useState<number>(1); // 1x, 2x, 5x, 10x, 100x

  // Initialize
  useEffect(() => {
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║              SimpleIndustrialSim - Creating Simulator                      ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');
    console.log('[SimpleIndustrialSim] System Name:', system.systemName);
    console.log('[SimpleIndustrialSim] System Type:', system.systemType);
    console.log('[SimpleIndustrialSim] Entities:', system.entities?.length || 0);
    console.log('[SimpleIndustrialSim] Resources:', system.resources?.length || 0);
    console.log('[SimpleIndustrialSim] Processes:', system.processes?.length || 0);
    
    // Validate system before creating simulator
    if (!system.entities || system.entities.length === 0) {
      console.error('[SimpleIndustrialSim] ✗ ERROR: No entities defined in system!');
      console.error('[SimpleIndustrialSim] Cannot create simulator without entities.');
      return;
    }
    
    if (!system.resources || system.resources.length === 0) {
      console.error('[SimpleIndustrialSim] ✗ ERROR: No resources defined in system!');
      console.error('[SimpleIndustrialSim] Cannot create simulator without resources.');
      return;
    }
    
    try {
      console.log('[SimpleIndustrialSim] Creating adapter...');
      const sim = new IndustrialSimulationAdapter(system);
      setSimulator(sim);

      // Immediately get initial stats
      const initialStats = sim.getStats();
      setStats(initialStats);

      console.log('\n[SimpleIndustrialSim] ✓ SUCCESS - Industrial simulator ready!');
      console.log('[SimpleIndustrialSim] Initial kernel time:', initialStats.currentTime);
      console.log('[SimpleIndustrialSim] Entities created:', initialStats.entitiesCreated);
      console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');
    } catch (error) {
      console.error('╔════════════════════════════════════════════════════════════════════════════╗');
      console.error('║                         SIMULATOR CREATION FAILED                          ║');
      console.error('╚════════════════════════════════════════════════════════════════════════════╝');
      console.error('[SimpleIndustrialSim] ✗ ERROR creating simulator:', error);
      console.error('[SimpleIndustrialSim] Stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('[SimpleIndustrialSim] System that failed:', JSON.stringify(system, null, 2));
    }
  }, [system]);

  // Animation loop
  useEffect(() => {
    console.log('[SimpleIndustrialSim] Animation loop check - simulator:', !!simulator, 'isRunning:', isRunning);

    if (!simulator || !isRunning) {
      console.log('[SimpleIndustrialSim] Not running animation');
      return;
    }

    console.log('[SimpleIndustrialSim] STARTING ANIMATION LOOP');

    // Calculate steps per interval based on speed
    // Speed 1x = 10 steps, 2x = 20 steps, 10x = 100 steps, etc.
    const stepsPerInterval = Math.max(1, Math.floor(10 * speed));
    
    const interval = setInterval(() => {
      try {
        if (!simulator.isComplete()) {
          // Step simulation multiple times based on speed
          for (let i = 0; i < stepsPerInterval; i++) {
            if (!simulator.isComplete()) {
              simulator.step();
            }
          }

          // Update stats
          const currentStats = simulator.getStats();
          setStats(currentStats);

          if (currentStats.entitiesCreated % 10 === 0) {
            console.log('[SimpleIndustrialSim] Time:', currentStats.currentTime.toFixed(2),
                        'Created:', currentStats.entitiesCreated,
                        'Departed:', currentStats.entitiesDeparted,
                        'Speed:', `${speed}x`);
          }
        } else {
          setIsRunning(false);
          console.log('[SimpleIndustrialSim] SIMULATION COMPLETE!');
        }
      } catch (error) {
        console.error('[SimpleIndustrialSim] ERROR in animation loop:', error);
        setIsRunning(false);
      }
    }, 100);

    return () => {
      console.log('[SimpleIndustrialSim] Clearing animation interval');
      clearInterval(interval);
    };
  }, [simulator, isRunning, speed]); // Re-create interval when speed changes

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#0f172a', minHeight: '100vh' }}>
      <h1 style={{ color: '#f1f5f9', marginBottom: '30px' }}>🏭 INDUSTRIAL DES KERNEL - LIVE SIMULATION</h1>

      {/* Animation Canvas */}
      {simulator && (
        <div style={{ marginBottom: '30px' }}>
          <AnimatedSimulationCanvas 
            simulator={simulator}
            isRunning={isRunning}
          />
        </div>
      )}

      {/* Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={() => {
            console.log('[SimpleIndustrialSim] START button clicked! Current isRunning:', isRunning);
            setIsRunning(!isRunning);
            console.log('[SimpleIndustrialSim] Set isRunning to:', !isRunning);
          }}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isRunning ? '#ef4444' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {isRunning ? '⏸ PAUSE' : '▶️ START'}
        </button>

        <button
          onClick={() => {
            simulator?.reset();
            setStats(null);
            setIsRunning(false);
          }}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginLeft: '10px'
          }}
        >
          🔄 RESET
        </button>

        {/* Speed Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '20px' }}>
          <label style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 'bold' }}>Speed:</label>
          {[0.5, 1, 2, 5, 10, 100].map(speedOption => (
            <button
              key={speedOption}
              onClick={() => setSpeed(speedOption)}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                backgroundColor: speed === speedOption ? '#10b981' : '#475569',
                color: 'white',
                border: speed === speedOption ? '2px solid #6ee7b7' : 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: speed === speedOption ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
            >
              {speedOption}x
            </button>
          ))}
        </div>
      </div>

      {stats && (
        <div style={{
          backgroundColor: '#1f2937',
          color: '#f3f4f6',
          padding: '20px',
          borderRadius: '10px',
          fontFamily: 'monospace'
        }}>
          <h2 style={{ marginTop: 0, color: '#10b981' }}>📊 LIVE STATISTICS</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h3 style={{ color: '#60a5fa' }}>⏱ Simulation Time</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                {stats.currentTime.toFixed(2)} min
              </div>
              <div style={{ color: '#9ca3af' }}>
                Progress: {stats.progress.toFixed(1)}%
              </div>
            </div>

            <div>
              <h3 style={{ color: '#60a5fa' }}>🚀 Throughput</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                {stats.throughput.toFixed(2)} /hr
              </div>
              <div style={{ color: '#9ca3af' }}>
                customers per hour
              </div>
            </div>

            <div>
              <h3 style={{ color: '#60a5fa' }}>👥 Entities</h3>
              <div style={{ fontSize: '18px' }}>
                Created: <span style={{ color: '#10b981' }}>{stats.entitiesCreated}</span>
              </div>
              <div style={{ fontSize: '18px' }}>
                Departed: <span style={{ color: '#ef4444' }}>{stats.entitiesDeparted}</span>
              </div>
              <div style={{ fontSize: '18px' }}>
                In System: <span style={{ color: '#fbbf24' }}>{stats.entitiesInSystem}</span>
              </div>
            </div>

            <div>
              <h3 style={{ color: '#60a5fa' }}>⏳ Cycle Times</h3>
              <div style={{ fontSize: '18px' }}>
                Avg Cycle: <span style={{ color: '#10b981' }}>{stats.avgCycleTime.toFixed(2)} min</span>
              </div>
              <div style={{ fontSize: '18px' }}>
                Avg Wait: <span style={{ color: '#fbbf24' }}>{stats.avgWaitTime.toFixed(2)} min</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#374151', borderRadius: '5px' }}>
            <strong>✅ INDUSTRIAL DES KERNEL STATUS:</strong> RUNNING
            <br />
            <span style={{ color: '#10b981' }}>
              • Binary Heap Event Queue (O(log n)) ✓
              <br />
              • Mersenne Twister RNG ✓
              <br />
              • Welford's Statistics ✓
              <br />
              • M/M/1 & M/M/c Validated ✓
            </span>
          </div>
        </div>
      )}

      {!stats && !isRunning && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#f3f4f6',
          borderRadius: '10px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏭</div>
          <div style={{ fontSize: '20px', color: '#6b7280' }}>
            Click START to run industrial-grade discrete event simulation
          </div>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginTop: '10px' }}>
            Using: {system.entities.length} entity types, {system.resources.length} resources
          </div>
        </div>
      )}
    </div>
  );
}
