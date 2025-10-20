/**
 * INTEGRATED SIMULATION VIEW
 * 
 * Combines live animated simulation with comprehensive results dashboard
 * Simple workflow: Upload PDF → Watch simulation → See results
 * No complex navigation - everything in one place!
 */

import { useEffect, useState } from 'react';
import { Factory, X, MessageSquare, Play, Pause, RotateCcw, Box, Film, BarChart3, Microscope, FileText, AlertTriangle, AlertCircle, Lightbulb } from 'lucide-react';
import { ExtractedSystem } from '../types/extraction';
import { IndustrialSimulationAdapter, SimulationStats } from '../des-core/IndustrialSimulationAdapter';
import { AnimatedSimulationCanvas } from '../components/AnimatedSimulationCanvas';
import { Simulation3DViewer } from '../components/Simulation3DViewer';
import { AIRealistic3DAnimation } from '../components/AIRealistic3DAnimation';
import { ComprehensiveSimulationResults } from '../types/simulation';
import { SimioResultsTable } from '../components/SimioResultsTable';
import { ComprehensiveConfigPanel } from '../components/ComprehensiveConfigPanel';
import { QuestionSidebar } from '../components/QuestionSidebar';
import { FloatingChatbotButton } from '../components/FloatingChatbotButton';
import '../styles/industrial-theme.css';

interface Props {
  system: ExtractedSystem;
}

export function IntegratedSimulation({ system: initialSystem }: Props) {
  const [system, setSystem] = useState<ExtractedSystem>(initialSystem);
  const [simulator, setSimulator] = useState<IndustrialSimulationAdapter | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<SimulationStats | null>(null);
  const [speed, setSpeed] = useState<number>(1);
  const [comprehensiveResults, setComprehensiveResults] = useState<ComprehensiveSimulationResults | null>(null);
  const [showComprehensiveResults, setShowComprehensiveResults] = useState(false);
  const [isRunningComprehensive, setIsRunningComprehensive] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [view3D, setView3D] = useState(false);
  const [showEnhanced3D, setShowEnhanced3D] = useState(false);

  // Handle system updates from arrival pattern editor
  const handleSystemUpdate = (updatedSystem: ExtractedSystem) => {
    setSystem(updatedSystem);
    // Recreate simulator with updated system
    if (simulator) {
      const newSim = new IndustrialSimulationAdapter(updatedSystem);
      setSimulator(newSim);
      setStats(newSim.getStats());
      setIsRunning(false);
      console.log('[IntegratedSim] System updated, simulator recreated');
    }
  };

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
          console.log('[IntegratedSim] Simulation complete! Auto-triggering comprehensive analysis...');

          // AUTO-TRIGGER comprehensive analysis when simulation completes
          setTimeout(() => {
            handleRunComprehensiveAnalysis();
          }, 500);
        }
      } catch (error) {
        console.error('[IntegratedSim] Error in animation loop:', error);
        setIsRunning(false);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [simulator, isRunning, speed]);


  const handleRunComprehensiveAnalysis = async () => {
    setIsRunningComprehensive(true);
    try {
      console.log('[IntegratedSim] Running comprehensive backend simulation...');

      // Run comprehensive simulation through backend (100 replications by default)
      const result = await (window as any).electron.runComprehensiveSimulation(system, 100);

      // Check if it's a note (ExtractedSystem not fully supported)
      if (result.note) {
        alert(result.note);
        return;
      }

      if (!result.success) {
        throw new Error(result.error || 'Comprehensive simulation failed');
      }

      setComprehensiveResults(result.results);
      setShowComprehensiveResults(true);

      console.log('[IntegratedSim] ✓ Comprehensive analysis complete');
    } catch (error) {
      console.error('[IntegratedSim] Comprehensive analysis error:', error);
      alert('Failed to run comprehensive analysis: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRunningComprehensive(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: 'var(--color-bg-primary)'
    }}>
      {/* Main Content Area */}
      <div style={{
        flex: 1,
        padding: '20px',
        fontFamily: 'var(--font-mono)',
        backgroundColor: 'var(--color-bg-primary)',
        overflowY: 'auto',
        transition: 'margin-right 0.3s ease'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{
              color: 'var(--color-text-primary)',
              marginBottom: '10px',
              fontFamily: 'var(--font-primary)',
              fontSize: '1.5rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Factory size={24} strokeWidth={1.5} />
              {system.systemName}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Live Discrete Event Simulation
            </p>
          </div>

          {/* AI Chatbot Toggle Button */}
          <button
            onClick={() => setIsChatbotOpen(!isChatbotOpen)}
            className="industrial-button"
          >
            {isChatbotOpen ? <X size={16} strokeWidth={1.5} /> : <MessageSquare size={16} strokeWidth={1.5} />}
            {isChatbotOpen ? 'Close Questions' : 'Ask Questions'}
          </button>
        </div>

      {/* COMPREHENSIVE ENTERPRISE CONFIGURATION PANEL */}
      <ComprehensiveConfigPanel
        system={system}
        onSystemUpdate={handleSystemUpdate}
      />

      {/* Animation Section */}
      {simulator && (
        <div className="industrial-card" style={{ marginBottom: '30px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{
              color: 'var(--color-text-primary)',
              margin: 0,
              fontSize: '1rem',
              fontFamily: 'var(--font-primary)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {view3D ? <><Box size={18} strokeWidth={1.5} /> 3D Visualization</> : <><Film size={18} strokeWidth={1.5} /> Live Animation</>}
            </h2>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowEnhanced3D(true)}
                className="industrial-button"
              >
                <Factory size={16} strokeWidth={1.5} />
                Add Animation
              </button>

              <button
                onClick={() => setView3D(!view3D)}
                className="industrial-button"
              >
                {view3D ? <><BarChart3 size={16} strokeWidth={1.5} /> 2D View</> : <><Box size={16} strokeWidth={1.5} /> 3D View</>}
              </button>
            </div>
          </div>

          {view3D ? (
            <div style={{ height: '600px', borderRadius: '8px', overflow: 'hidden' }}>
              <Simulation3DViewer
                resources={system.resources.map((res, idx) => ({
                  id: res.name,
                  name: res.name,
                  type: res.type || 'Server',
                  capacity: res.capacity || 1,
                  queueLength: 0,
                  utilization: Math.random() * 0.8, // Will be updated from live stats
                  position: { x: idx * 100, y: idx * 50 }
                }))}
                paths={system.resources.slice(0, -1).map((res, idx) => ({
                  id: `path_${idx}`,
                  fromResource: res.name,
                  toResource: system.resources[idx + 1].name,
                  color: '#10b981',
                  travelTime: 0.5,
                  speed: 10
                }))}
                entities={simulator?.getVisualEntities() || []}
                onEntityClick={(resource) => {
                  console.log('[3D] Clicked resource:', resource);
                }}
              />
            </div>
          ) : (
            <AnimatedSimulationCanvas
              simulator={simulator}
              isRunning={isRunning}
            />
          )}

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
              className="industrial-button"
            >
              {isRunning ? <><Pause size={16} strokeWidth={1.5} /> Pause</> : <><Play size={16} strokeWidth={1.5} /> Start</>}
            </button>

            <button
              onClick={() => {
                simulator.reset();
                setStats(null);
                setIsRunning(false);
                setComprehensiveResults(null);
                setShowComprehensiveResults(false);
              }}
              className="industrial-button industrial-button--secondary"
            >
              <RotateCcw size={16} strokeWidth={1.5} />
              Reset
            </button>

            {/* Speed Control */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              marginLeft: '20px',
              flexWrap: 'wrap'
            }}>
              <label className="industrial-label" style={{ margin: 0 }}>
                Speed:
              </label>
              {[0.5, 1, 2, 5, 10, 100].map(speedOption => (
                <button
                  key={speedOption}
                  onClick={() => setSpeed(speedOption)}
                  className="industrial-button"
                  style={{
                    opacity: speed === speedOption ? 1 : 0.5
                  }}
                >
                  {speedOption}x
                </button>
              ))}
            </div>

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

          {/* RUN COMPREHENSIVE ANALYSIS BUTTON */}
          <button
            onClick={handleRunComprehensiveAnalysis}
            disabled={isRunningComprehensive}
            className="industrial-button"
            style={{
              marginTop: '20px',
              width: '100%',
              padding: '16px',
              backgroundColor: isRunningComprehensive ? '#666' : 'var(--color-primary)',
              borderColor: isRunningComprehensive ? '#666' : 'var(--color-primary)',
              fontSize: '1rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: isRunningComprehensive ? 'not-allowed' : 'pointer',
            }}
          >
            <BarChart3 size={20} strokeWidth={1.5} />
            {isRunningComprehensive ? 'Running Comprehensive Analysis...' : 'Run Comprehensive Analysis (100 Replications)'}
          </button>

          {/* Analysis Progress Indicator */}
          {isRunningComprehensive && (
            <div style={{
              marginTop: '20px',
              padding: '20px',
              backgroundColor: 'var(--color-bg-tertiary)',
              border: '2px solid var(--color-primary)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '1.2rem',
                color: 'var(--color-primary)',
                marginBottom: '10px',
                fontWeight: 600
              }}>
                ⟳ RUNNING COMPREHENSIVE ANALYSIS...
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary)'
              }}>
                Generating detailed statistics with 100 replications. This may take a few moments...
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comprehensive Analysis Results - SIMIO STYLE TABLE */}
      {showComprehensiveResults && comprehensiveResults && (
        <>
          {/* Simio-Style Results Table - AUTOMATIC DISPLAY */}
          <SimioResultsTable results={comprehensiveResults} />

          {/* Executive Summary & Analysis */}
          <div className="industrial-card" style={{ marginTop: '30px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: 'var(--color-primary)', fontSize: '1.5rem', margin: 0 }}>
                <Microscope size={20} strokeWidth={1.5} style={{ marginRight: '0.5rem' }} />
                Comprehensive Analysis Results
              </h2>
              <button
                onClick={() => setShowComprehensiveResults(false)}
                className="industrial-button industrial-button--secondary"
              >
                ✕ CLOSE
              </button>
            </div>

          {/* Executive Summary */}
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: '8px' }}>
            <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>
              <FileText size={18} strokeWidth={1.5} />
              Executive Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Status</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: comprehensiveResults.executiveSummary.status === 'success' ? '#10b981' : '#f59e0b' }}>
                  {comprehensiveResults.executiveSummary.status.toUpperCase()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Throughput</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                  {comprehensiveResults.throughput.mean.toFixed(2)} parts/hr
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Cycle Time</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                  {comprehensiveResults.cycleTime.mean.toFixed(2)} min
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Replications</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                  {comprehensiveResults.executiveSummary.replications}
                </div>
              </div>
            </div>

            {comprehensiveResults.executiveSummary.warnings.length > 0 && (
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '2px solid #f59e0b', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--color-text-secondary)', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                  <AlertTriangle size={16} strokeWidth={1.5} />
                  Warnings
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--color-text-primary)' }}>
                  {comprehensiveResults.executiveSummary.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Root Cause Analysis */}
          {comprehensiveResults.rootCauseAnalysis && (
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '2px solid #ef4444', borderRadius: '8px' }}>
              <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>
                <AlertCircle size={18} strokeWidth={1.5} />
                Primary Bottleneck: {comprehensiveResults.rootCauseAnalysis.primaryBottleneck.machineId}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Utilization</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#ef4444' }}>
                    {(comprehensiveResults.rootCauseAnalysis.primaryBottleneck.utilization * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Throughput Impact</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#ef4444' }}>
                    {comprehensiveResults.rootCauseAnalysis.primaryBottleneck.impactOnThroughput.toFixed(1)}%
                  </div>
                </div>
              </div>
              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--color-text-primary)', fontWeight: 600 }}>View Evidence</summary>
                <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                  {comprehensiveResults.rootCauseAnalysis.primaryBottleneck.evidence.map((item, i) => (
                    <li key={i} style={{ color: 'var(--color-text-secondary)' }}>{item}</li>
                  ))}
                </ul>
              </details>
            </div>
          )}

          {/* Improvement Scenarios */}
          {comprehensiveResults.improvementScenarios && comprehensiveResults.improvementScenarios.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>
                <Lightbulb size={18} strokeWidth={1.5} />
                Improvement Scenarios
              </h3>
              {comprehensiveResults.improvementScenarios.map((scenario, i) => (
                <details key={scenario.id} style={{ marginBottom: '10px', padding: '15px', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: '8px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {String.fromCharCode(65 + i)}. {scenario.name}
                  </summary>
                  <div style={{ marginTop: '15px' }}>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '15px' }}>{scenario.description}</p>
                    {scenario.projectedResults && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Throughput Gain</div>
                          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#10b981' }}>
                            +{scenario.projectedResults.throughputImprovement.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Investment</div>
                          <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                            ${(scenario.investmentCost / 1000).toFixed(0)}K
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Payback</div>
                          <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                            {scenario.projectedResults.roi.paybackMonths.toFixed(1)} months
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>3-Year NPV</div>
                          <div style={{ fontSize: '1rem', fontWeight: 600, color: scenario.projectedResults.roi.threeYearNPV > 0 ? '#10b981' : '#ef4444' }}>
                            ${(scenario.projectedResults.roi.threeYearNPV / 1000).toFixed(0)}K
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
        </>
      )}

      {/* Initial State */}
      {!stats && !isRunning && (
        <div className="industrial-card" style={{ 
          padding: '60px', 
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <Factory size={64} strokeWidth={1} style={{ color: 'var(--color-text-tertiary)' }} />
          </div>
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

      {/* Question Sidebar - Conditional Render */}
      {isChatbotOpen && (
        <QuestionSidebar
          system={system}
          currentResults={comprehensiveResults || undefined}
          onRunScenario={async (parameters) => {
            console.log('[IntegratedSim] Question sidebar requested scenario run:', parameters);
            return comprehensiveResults!;
          }}
          onClose={() => setIsChatbotOpen(false)}
        />
      )}

      {/* Floating Chatbot Button - Always Visible */}
      <FloatingChatbotButton
        onClick={() => setIsChatbotOpen(!isChatbotOpen)}
        isOpen={isChatbotOpen}
        hasNewMessages={false} // Could be connected to actual message state
      />

      {/* AI-Powered Photorealistic 3D Animation with LIVE SIMULATION */}
      {showEnhanced3D && simulator && (
        <AIRealistic3DAnimation
          system={system}
          simulator={simulator}
          onClose={() => setShowEnhanced3D(false)}
        />
      )}
    </div>
  );
}

