/**
 * INTEGRATED SIMULATION VIEW
 * 
 * Combines live animated simulation with comprehensive results dashboard
 * Simple workflow: Upload PDF → Watch simulation → See results
 * No complex navigation - everything in one place!
 */

import { useEffect, useState, useRef } from 'react';
import { ExtractedSystem } from '../types/extraction';
import { IndustrialSimulationAdapter, SimulationStats } from '../des-core/IndustrialSimulationAdapter';
import { AnimatedSimulationCanvas } from '../components/AnimatedSimulationCanvas';
import { ResultsDashboard } from '../components/dashboards/ResultsDashboard';
import { ReportGenerator } from '../core/reports/ReportGenerator';
import { HTMLExporter } from '../core/reports/HTMLExporter';
import { ComprehensiveMetrics } from '../core/metrics/MetricsCollector';
import '../styles/industrial-theme.css';

interface Props {
  system: ExtractedSystem;
}

export function IntegratedSimulation({ system }: Props) {
  const [simulator, setSimulator] = useState<IndustrialSimulationAdapter | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<SimulationStats | null>(null);
  const [speed, setSpeed] = useState<number>(1);
  const [showResults, setShowResults] = useState(false);
  const [comprehensiveMetrics, setComprehensiveMetrics] = useState<ComprehensiveMetrics | null>(null);
  const [isGeneratingMetrics, setIsGeneratingMetrics] = useState(false);
  
  const animationRef = useRef<number | null>(null);

  // Initialize simulator
  useEffect(() => {
    console.log('[IntegratedSim] Creating simulator for:', system.systemName);
    
    if (!system.entities || system.entities.length === 0) {
      console.error('[IntegratedSim] No entities defined');
      return;
    }
    
    if (!system.resources || system.resources.length === 0) {
      console.error('[IntegratedSim] No resources defined');
      return;
    }
    
    try {
      const sim = new IndustrialSimulationAdapter(system);
      setSimulator(sim);
      const initialStats = sim.getStats();
      setStats(initialStats);
      console.log('[IntegratedSim] ✓ Simulator ready');
    } catch (error) {
      console.error('[IntegratedSim] Failed to create simulator:', error);
    }
  }, [system]);

  // Animation loop
  useEffect(() => {
    if (!simulator || !isRunning) return;

    const stepsPerInterval = Math.max(1, Math.floor(10 * speed));
    
    const interval = setInterval(() => {
      try {
        if (!simulator.isComplete()) {
          for (let i = 0; i < stepsPerInterval; i++) {
            if (!simulator.isComplete()) {
              simulator.step();
            }
          }
          
          const currentStats = simulator.getStats();
          setStats(currentStats);
        } else {
          setIsRunning(false);
          console.log('[IntegratedSim] Simulation complete!');
        }
      } catch (error) {
        console.error('[IntegratedSim] Error in animation loop:', error);
        setIsRunning(false);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [simulator, isRunning, speed]);

  const handleGenerateResults = async () => {
    if (!simulator) return;
    
    setIsGeneratingMetrics(true);
    try {
      console.log('[IntegratedSim] Generating comprehensive metrics...');
      
      // Run simulation to completion if not already complete
      if (!simulator.isComplete()) {
        simulator.run(100); // Run for 100 time units
      }
      
      const metrics = simulator.getComprehensiveMetrics();
      setComprehensiveMetrics(metrics);
      setShowResults(true);
      
      console.log('[IntegratedSim] ✓ Metrics generated');
    } catch (error) {
      console.error('[IntegratedSim] Failed to generate metrics:', error);
      alert('Failed to generate results: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsGeneratingMetrics(false);
    }
  };

  const handleExportReport = async () => {
    if (!comprehensiveMetrics) return;
    
    try {
      console.log('[IntegratedSim] Exporting report...');
      
      const reportGenerator = new ReportGenerator();
      const report = await reportGenerator.generateReport(comprehensiveMetrics, 'executive');
      
      const htmlExporter = new HTMLExporter();
      const htmlContent = htmlExporter.exportToHTML(report);
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${system.systemName || 'simulation'}_report_${Date.now()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('[IntegratedSim] ✓ Report exported');
      alert('✅ Report downloaded! Open it in your browser and use Print → Save as PDF for a PDF version.');
    } catch (error) {
      console.error('[IntegratedSim] Report export failed:', error);
      alert('Failed to export report: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'var(--font-mono)', 
      backgroundColor: 'var(--color-bg-primary)', 
      minHeight: '100vh' 
    }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ 
          color: 'var(--color-primary)', 
          marginBottom: '10px',
          fontFamily: 'var(--font-mono)',
          fontSize: '2rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}>
          🏭 {system.systemName}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Live Discrete Event Simulation
        </p>
      </div>

      {/* Animation Section */}
      {simulator && (
        <div className="industrial-card" style={{ marginBottom: '30px', padding: '20px' }}>
          <h2 style={{ 
            color: 'var(--color-text-primary)', 
            marginBottom: '20px',
            fontSize: '1.2rem',
            fontFamily: 'var(--font-mono)'
          }}>
            🎬 LIVE ANIMATION
          </h2>
          
          <AnimatedSimulationCanvas 
            simulator={simulator}
            isRunning={isRunning}
          />

          {/* Controls */}
          <div style={{ 
            marginTop: '20px', 
            display: 'flex', 
            gap: '10px', 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="industrial-button industrial-button--primary"
              style={{
                backgroundColor: isRunning ? '#ef4444' : '#10b981',
                borderColor: isRunning ? '#ef4444' : '#10b981'
              }}
            >
              {isRunning ? '⏸ PAUSE' : '▶️ START'}
            </button>

            <button
              onClick={() => {
                simulator.reset();
                setStats(null);
                setIsRunning(false);
                setShowResults(false);
                setComprehensiveMetrics(null);
              }}
              className="industrial-button industrial-button--secondary"
            >
              🔄 RESET
            </button>

            {/* Speed Control */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              marginLeft: '20px',
              flexWrap: 'wrap'
            }}>
              <label style={{ 
                color: 'var(--color-text-primary)', 
                fontSize: '0.875rem', 
                fontWeight: 600 
              }}>
                SPEED:
              </label>
              {[0.5, 1, 2, 5, 10, 100].map(speedOption => (
                <button
                  key={speedOption}
                  onClick={() => setSpeed(speedOption)}
                  className="industrial-button"
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    backgroundColor: speed === speedOption ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                    borderColor: speed === speedOption ? 'var(--color-primary)' : 'var(--color-border)',
                    color: speed === speedOption ? '#000' : 'var(--color-text-primary)'
                  }}
                >
                  {speedOption}x
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerateResults}
              disabled={isGeneratingMetrics}
              className="industrial-button industrial-button--accent"
              style={{
                marginLeft: 'auto',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                borderColor: '#3b82f6'
              }}
            >
              {isGeneratingMetrics ? '⟳ ANALYZING...' : '📊 GENERATE RESULTS'}
            </button>
          </div>

          {/* Live Stats */}
          {stats && (
            <div style={{
              marginTop: '20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              <div className="industrial-metric">
                <div className="industrial-metric__label">SIMULATION TIME</div>
                <div className="industrial-metric__value">{stats.currentTime.toFixed(2)}</div>
                <div className="industrial-metric__unit">minutes</div>
              </div>

              <div className="industrial-metric">
                <div className="industrial-metric__label">THROUGHPUT</div>
                <div className="industrial-metric__value">{stats.throughput.toFixed(2)}</div>
                <div className="industrial-metric__unit">per hour</div>
              </div>

              <div className="industrial-metric">
                <div className="industrial-metric__label">ENTITIES CREATED</div>
                <div className="industrial-metric__value">{stats.entitiesCreated}</div>
                <div className="industrial-metric__unit">total</div>
              </div>

              <div className="industrial-metric">
                <div className="industrial-metric__label">ENTITIES DEPARTED</div>
                <div className="industrial-metric__value">{stats.entitiesDeparted}</div>
                <div className="industrial-metric__unit">completed</div>
              </div>

              <div className="industrial-metric">
                <div className="industrial-metric__label">IN SYSTEM</div>
                <div className="industrial-metric__value">{stats.entitiesInSystem}</div>
                <div className="industrial-metric__unit">current</div>
              </div>

              <div className="industrial-metric">
                <div className="industrial-metric__label">AVG CYCLE TIME</div>
                <div className="industrial-metric__value">{stats.avgCycleTime.toFixed(2)}</div>
                <div className="industrial-metric__unit">minutes</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Dashboard */}
      {showResults && comprehensiveMetrics && (
        <div style={{ marginTop: '30px' }}>
          <ResultsDashboard
            metrics={comprehensiveMetrics}
            onClose={() => setShowResults(false)}
            onExportReport={handleExportReport}
          />
        </div>
      )}

      {/* Initial State */}
      {!stats && !isRunning && (
        <div className="industrial-card" style={{ 
          padding: '60px', 
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏭</div>
          <h3 style={{ 
            color: 'var(--color-text-primary)', 
            marginBottom: '15px',
            fontSize: '1.5rem'
          }}>
            Ready to Simulate
          </h3>
          <p style={{ 
            color: 'var(--color-text-secondary)', 
            marginBottom: '30px',
            fontSize: '1rem'
          }}>
            Click <strong style={{ color: 'var(--color-primary)' }}>▶️ START</strong> to run the discrete event simulation
          </p>
          <div style={{ 
            fontSize: '0.875rem', 
            color: 'var(--color-text-secondary)' 
          }}>
            System: {system.entities.length} entity types, {system.resources.length} resources, {system.processes.length} processes
          </div>
        </div>
      )}
    </div>
  );
}

