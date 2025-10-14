/**
 * SCENARIO MANAGER COMPONENT
 * 
 * Provides UI for:
 * - Auto-generating scenarios
 * - Running scenario comparisons
 * - Viewing results side-by-side
 * - Selecting best scenarios
 */

import React, { useState } from 'react';
import { useDESModelStore } from '../../store/desModelStore';
import { ScenarioGenerator, Scenario, ScenarioType } from '../../core/scenarios/ScenarioGenerator';
import { ScenarioRunner, ScenarioResult, ScenarioComparison } from '../../core/scenarios/ScenarioRunner';
import '../../styles/industrial-theme.css';

export const ScenarioManager: React.FC = () => {
  const { extractedSystem } = useDESModelStore();
  
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [comparison, setComparison] = useState<ScenarioComparison | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  
  /**
   * Generate scenarios automatically
   */
  const handleGenerateScenarios = async () => {
    if (!extractedSystem) return;
    
    setIsGenerating(true);
    try {
      console.log('[ScenarioManager] Generating scenarios...');
      
      const generator = new ScenarioGenerator();
      const generatedScenarios = await generator.generateScenarios(extractedSystem, {
        includeOptimization: true,
        includeWhatIf: true,
        includeSensitivity: true,
        includeStressTest: true,
        maxScenarios: 15,
        aggressiveness: 'moderate'
      });
      
      setScenarios(generatedScenarios);
      console.log(`[ScenarioManager] Generated ${generatedScenarios.length} scenarios`);
    } catch (error) {
      console.error('[ScenarioManager] Generation failed:', error);
      alert('Failed to generate scenarios: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };
  
  /**
   * Run all scenarios
   */
  const handleRunScenarios = async () => {
    if (scenarios.length === 0) return;
    
    setIsRunning(true);
    setResults([]);
    setComparison(null);
    
    try {
      console.log('[ScenarioManager] Running scenarios...');
      
      const runner = new ScenarioRunner();
      const scenarioResults = await runner.runScenarios(scenarios, {
        simulationTime: 100,
        parallelRuns: false, // Sequential for now
        timeout: 30000
      });
      
      setResults(scenarioResults);
      
      // Generate comparison
      const comp = runner.compareScenarios(scenarioResults);
      setComparison(comp);
      
      console.log('[ScenarioManager] Scenarios complete');
    } catch (error) {
      console.error('[ScenarioManager] Run failed:', error);
      alert('Failed to run scenarios: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRunning(false);
    }
  };
  
  /**
   * Get scenario type badge color
   */
  const getScenarioTypeBadge = (type: ScenarioType): string => {
    switch (type) {
      case ScenarioType.BASELINE:
        return 'industrial-badge' + ' ' + 'baseline-badge';
      case ScenarioType.OPTIMIZATION:
        return 'industrial-badge' + ' ' + 'optimization-badge';
      case ScenarioType.WHAT_IF:
        return 'industrial-badge' + ' ' + 'whatif-badge';
      case ScenarioType.SENSITIVITY:
        return 'industrial-badge' + ' ' + 'sensitivity-badge';
      case ScenarioType.STRESS_TEST:
        return 'industrial-badge' + ' ' + 'stress-badge';
      default:
        return 'industrial-badge';
    }
  };
  
  if (!extractedSystem) {
    return (
      <div className="industrial-panel">
        <div className="industrial-status industrial-status--warning">
          <span className="industrial-status__indicator"></span>
          NO SYSTEM LOADED - Please extract a system first
        </div>
      </div>
    );
  }
  
  return (
    <div className="industrial-panel" style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '1.25rem', 
          color: 'var(--color-text-primary)',
          marginBottom: '0.5rem'
        }}>
          AI-POWERED SCENARIO GENERATOR
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Automatically generate and compare multiple what-if scenarios to find optimal configurations.
        </p>
      </div>
      
      {/* ACTIONS */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className="industrial-button industrial-button--primary"
          onClick={handleGenerateScenarios}
          disabled={isGenerating}
        >
          {isGenerating ? '⟳ GENERATING...' : '🎯 GENERATE SCENARIOS'}
        </button>
        
        {scenarios.length > 0 && (
          <button
            className="industrial-button industrial-button--primary"
            onClick={handleRunScenarios}
            disabled={isRunning}
          >
            {isRunning ? '⟳ RUNNING...' : `▶ RUN ALL ${scenarios.length} SCENARIOS`}
          </button>
        )}
      </div>
      
      {/* SCENARIOS LIST */}
      {scenarios.length > 0 && !comparison && (
        <div>
          <h3 style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '1rem', 
            marginBottom: '1rem',
            color: 'var(--color-text-primary)'
          }}>
            GENERATED SCENARIOS ({scenarios.length})
          </h3>
          
          <div className="industrial-table-container">
            <table className="industrial-table">
              <thead>
                <tr>
                  <th>SCENARIO</th>
                  <th>TYPE</th>
                  <th>CHANGES</th>
                  <th>EXPECTED IMPACT</th>
                  <th>PRIORITY</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((scenario) => (
                  <tr 
                    key={scenario.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedScenario(selectedScenario === scenario.id ? null : scenario.id)}
                  >
                    <td>
                      <strong>{scenario.name}</strong>
                      {selectedScenario === scenario.id && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                          {scenario.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={getScenarioTypeBadge(scenario.type)}>
                        {scenario.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>{scenario.changes.length}</td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>
                        <div>Throughput: {scenario.expectedImpact.throughputChange > 0 ? '+' : ''}{scenario.expectedImpact.throughputChange.toFixed(0)}%</div>
                        <div>Cycle Time: {scenario.expectedImpact.cycleTimeChange > 0 ? '+' : ''}{scenario.expectedImpact.cycleTimeChange.toFixed(0)}%</div>
                      </div>
                    </td>
                    <td>
                      <div className="industrial-progress">
                        <div 
                          className="industrial-progress__bar" 
                          style={{ width: `${scenario.priority}%` }}
                        ></div>
                      </div>
                      <span style={{ fontSize: '0.875rem' }}>{scenario.priority}/100</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* COMPARISON RESULTS */}
      {comparison && (
        <div>
          <h3 style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '1rem', 
            marginBottom: '1rem',
            color: 'var(--color-text-primary)',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '0.5rem'
          }}>
            📊 SCENARIO COMPARISON RESULTS
          </h3>
          
          {/* BEST SCENARIOS */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
              TOP PERFORMERS
            </h4>
            <div className="industrial-metrics-grid">
              <div className="industrial-metric">
                <div className="industrial-metric__label">BEST THROUGHPUT</div>
                <div className="industrial-metric__value" style={{ fontSize: '1rem' }}>
                  {comparison.bestScenarios.throughput.scenario.name}
                </div>
                <div className="industrial-metric__unit">
                  {comparison.bestScenarios.throughput.metrics.throughput.entitiesPerHour.toFixed(1)} per hour
                </div>
              </div>
              
              <div className="industrial-metric">
                <div className="industrial-metric__label">LOWEST COST</div>
                <div className="industrial-metric__value" style={{ fontSize: '1rem' }}>
                  {comparison.bestScenarios.cost.scenario.name}
                </div>
                <div className="industrial-metric__unit">
                  ${comparison.bestScenarios.cost.metrics.financial?.totalOperatingCost.toFixed(2) || '0'}
                </div>
              </div>
              
              <div className="industrial-metric">
                <div className="industrial-metric__label">BEST CYCLE TIME</div>
                <div className="industrial-metric__value" style={{ fontSize: '1rem' }}>
                  {comparison.bestScenarios.cycleTime.scenario.name}
                </div>
                <div className="industrial-metric__unit">
                  {comparison.bestScenarios.cycleTime.metrics.throughput.averageCycleTime.toFixed(2)} min
                </div>
              </div>
              
              <div className="industrial-metric" style={{ gridColumn: 'span 1' }}>
                <div className="industrial-metric__label">BEST OVERALL</div>
                <div className="industrial-metric__value" style={{ fontSize: '1rem' }}>
                  {comparison.bestScenarios.overall.scenario.name}
                </div>
                <div className="industrial-metric__unit">Balanced performance</div>
              </div>
            </div>
          </div>
          
          {/* RECOMMENDATIONS */}
          {comparison.recommendations.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                💡 RECOMMENDATIONS
              </h4>
              {comparison.recommendations.map((rec, idx) => (
                <div key={idx} className="industrial-card" style={{ 
                  marginBottom: '1rem', 
                  padding: '1rem',
                  borderLeft: '4px solid var(--color-primary)'
                }}>
                  <h5 style={{ margin: 0, fontSize: '1rem', marginBottom: '0.5rem' }}>
                    {rec.title}
                  </h5>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '0.5rem 0' }}>
                    {rec.description}
                  </p>
                  <div style={{ fontSize: '0.875rem', marginTop: '0.75rem' }}>
                    <strong>Recommended:</strong> {rec.recommendedScenario}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <strong>Reason:</strong> {rec.reason}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* DETAILED COMPARISON TABLE */}
          <div>
            <h4 style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
              DETAILED COMPARISON
            </h4>
            <div className="industrial-table-container">
              <table className="industrial-table">
                <thead>
                  <tr>
                    <th>SCENARIO</th>
                    <th>THROUGHPUT</th>
                    <th>CYCLE TIME</th>
                    <th>COST</th>
                    <th>UTILIZATION</th>
                    <th>OVERALL RANK</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.rankings.map((ranking) => {
                    const result = comparison.scenarios.find(r => r.scenario.id === ranking.scenarioId);
                    if (!result) return null;
                    
                    return (
                      <tr key={ranking.scenarioId}>
                        <td><strong>{ranking.scenarioName}</strong></td>
                        <td>
                          {result.metrics.throughput.entitiesPerHour.toFixed(1)}
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            Rank #{ranking.ranks.throughput}
                          </div>
                        </td>
                        <td>
                          {result.metrics.throughput.averageCycleTime.toFixed(2)} min
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            Rank #{ranking.ranks.cycleTime}
                          </div>
                        </td>
                        <td>
                          ${result.metrics.financial?.totalOperatingCost.toFixed(2) || '0'}
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            Rank #{ranking.ranks.cost}
                          </div>
                        </td>
                        <td>
                          {(result.metrics.resources.reduce((sum, r) => sum + r.utilization, 0) / result.metrics.resources.length * 100).toFixed(1)}%
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            Rank #{ranking.ranks.utilization}
                          </div>
                        </td>
                        <td>
                          <div style={{ 
                            fontSize: '1.5rem', 
                            fontWeight: 700, 
                            color: ranking.ranks.overall === 1 ? 'var(--color-success)' : 'var(--color-text-primary)'
                          }}>
                            #{ranking.ranks.overall}
                          </div>
                          <div className="industrial-progress">
                            <div 
                              className="industrial-progress__bar" 
                              style={{ width: `${ranking.scores.overall}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Additional CSS for scenario-specific badges
const style = document.createElement('style');
style.textContent = `
  .baseline-badge { background-color: #6b7280; color: white; }
  .optimization-badge { background-color: #10b981; color: white; }
  .whatif-badge { background-color: #3b82f6; color: white; }
  .sensitivity-badge { background-color: #f59e0b; color: white; }
  .stress-badge { background-color: #ef4444; color: white; }
`;
document.head.appendChild(style);

