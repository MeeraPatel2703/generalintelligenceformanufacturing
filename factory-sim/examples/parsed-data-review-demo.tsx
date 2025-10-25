/**
 * PARSED DATA REVIEW SYSTEM - DEMO
 *
 * This demonstrates how to use the Parse → Review → Simulate workflow
 */

import React from 'react';
import SimulationWorkflow from '../src/components/SimulationWorkflow';
import ParsedDataReview from '../src/components/ParsedDataReview';
import ParsedDataValidator from '../src/components/ParsedDataValidator';
import { ProcessGraph } from '../src/types/processGraph';
import { parseTextToProcessGraph } from '../src/services/desParser';

// ============================================================================
// EXAMPLE 1: Full Workflow (Recommended)
// ============================================================================

export function FullWorkflowExample() {
  return (
    <div>
      <h1>Parse → Review → Simulate</h1>
      <SimulationWorkflow />
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Pre-Parsed Input
// ============================================================================

export function PreParsedExample() {
  const [parserResult, setParserResult] = React.useState(null);

  React.useEffect(() => {
    const parseInput = async () => {
      const input = `
        Factory with 3 stations:
        - CNC Machine: 12 minute cycle time (normal distribution, stdev 1.5 min)
        - Assembly: 8 minute cycle time (constant)
        - Quality Check: 5 minute cycle time (exponential)

        Parts arrive every 10 minutes (exponential interarrival time).
        Flow: CNC → Assembly → QC → Finish
        10% of parts fail QC and return to CNC for rework.

        Run for 8 hours (480 minutes) with 100 replications.
      `;

      const result = await parseTextToProcessGraph(input);
      setParserResult(result);
    };

    parseInput();
  }, []);

  if (!parserResult) {
    return <div>Parsing...</div>;
  }

  return (
    <div>
      <h1>Simulation from Pre-Parsed Input</h1>
      <SimulationWorkflow initialParserResult={parserResult} />
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Review Component Only
// ============================================================================

export function ReviewOnlyExample() {
  // Sample ProcessGraph for demonstration
  const sampleGraph: ProcessGraph = {
    entities: [
      {
        id: 'Part',
        batchSize: 1,
        class: 'Standard',
        attributes: [],
        priority: 1
      }
    ],
    arrivals: [
      {
        policy: 'exponential',
        interarrival: {
          type: 'exponential',
          params: { mean: 10 },
          units: 'minutes'
        }
      }
    ],
    stations: [
      {
        id: 'CNC',
        kind: 'machine',
        count: 1,
        capacity: 1,
        queue: 'FIFO',
        processTime: {
          type: 'normal',
          params: { mean: 12, stdev: 1.5 },
          units: 'minutes'
        }
      },
      {
        id: 'Assembly',
        kind: 'machine',
        count: 1,
        capacity: 1,
        queue: 'FIFO',
        processTime: {
          type: 'constant',
          params: { value: 8 },
          units: 'minutes'
        }
      },
      {
        id: 'QC',
        kind: 'machine',
        count: 1,
        capacity: 1,
        queue: 'FIFO',
        processTime: {
          type: 'exponential',
          params: { mean: 5 },
          units: 'minutes'
        },
        rework: {
          probability: 0.1,
          to: 'CNC'
        }
      }
    ],
    routes: [
      { from: 'CNC', to: 'Assembly', probability: 1.0 },
      { from: 'Assembly', to: 'QC', probability: 1.0 },
      { from: 'QC', to: 'CNC', probability: 0.1 },
      { from: 'QC', to: 'FINISH', probability: 0.9 }
    ],
    runConfig: {
      runLength_min: 480,
      warmup_min: 60,
      replications: 100,
      confidence: 95
    },
    metadata: {
      model_id: 'demo-model-001',
      version: '1.0',
      created: new Date().toISOString(),
      description: 'Demo factory with 3 stations and rework loop',
      assumptions: [
        'Normal distribution for CNC cycle time',
        'Exponential interarrival time',
        '10% rework rate from QC to CNC'
      ]
    }
  };

  const sampleValidation = {
    valid: true,
    errors: [],
    warnings: []
  };

  const handleApprove = (editedGraph: ProcessGraph) => {
    console.log('User approved edited graph:', editedGraph);
    alert('Graph approved! Proceeding to simulation...');
    // In real app: pass to simulation runner
  };

  const handleReject = () => {
    console.log('User rejected graph');
    alert('Graph rejected. Returning to input...');
    // In real app: return to input stage
  };

  return (
    <div>
      <h1>Review Component Demo</h1>
      <ParsedDataReview
        initialGraph={sampleGraph}
        validation={sampleValidation}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Validator Component Only
// ============================================================================

export function ValidatorOnlyExample() {
  // Sample graph with validation issues
  const [graph, setGraph] = React.useState<ProcessGraph>({
    entities: [{ id: 'Part', batchSize: 1, class: 'A', attributes: [], priority: 1 }],
    arrivals: [
      {
        policy: 'exponential',
        interarrival: { type: 'exponential', params: { mean: 10 }, units: 'minutes' }
      }
    ],
    stations: [
      {
        id: 'Machine1',
        kind: 'machine',
        count: 1,
        capacity: 1,
        queue: 'FIFO',
        processTime: {
          type: 'triangular',
          params: { min: 15, mode: 10, max: 5 }, // INVALID: min > mode > max
          units: 'minutes'
        }
      },
      {
        id: 'Machine2',
        kind: 'machine',
        count: 1,
        capacity: 1,
        queue: 'FIFO',
        processTime: {
          type: 'constant',
          params: { value: 8 },
          units: 'minutes'
        }
      }
    ],
    routes: [
      { from: 'Machine1', to: 'Machine2', probability: 0.6 }, // INVALID: doesn't sum to 1.0
      { from: 'Machine1', to: 'FINISH', probability: 0.3 }
    ],
    runConfig: {
      runLength_min: 480,
      warmup_min: 60,
      replications: 100,
      confidence: 95
    },
    metadata: {
      model_id: 'invalid-model',
      version: '1.0'
    }
  });

  const handleAutoFix = (fixedGraph: ProcessGraph) => {
    console.log('Auto-fixed graph:', fixedGraph);
    setGraph(fixedGraph);
  };

  return (
    <div style={{ padding: '2rem', background: '#1a202c', minHeight: '100vh' }}>
      <h1 style={{ color: 'white' }}>Validator Demo (with Errors)</h1>
      <p style={{ color: 'white', opacity: 0.8 }}>
        This graph has intentional validation errors. Use auto-fix to correct them.
      </p>

      <ParsedDataValidator graph={graph} onAutoFix={handleAutoFix} />

      <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }}>
        <h3 style={{ color: 'white' }}>Current Graph State:</h3>
        <pre style={{ color: 'white', fontSize: '0.85rem', overflow: 'auto' }}>
          {JSON.stringify(graph, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Integration with Existing App
// ============================================================================

export function IntegratedExample() {
  const [currentView, setCurrentView] = React.useState<'input' | 'review' | 'simulation'>('input');
  const [processGraph, setProcessGraph] = React.useState<ProcessGraph | null>(null);

  const handleParseComplete = async (text: string) => {
    const result = await parseTextToProcessGraph(text);

    if (result.success && result.processGraph) {
      setProcessGraph(result.processGraph);
      setCurrentView('review');
    } else {
      alert('Parse failed: ' + result.error);
    }
  };

  const handleApprove = (editedGraph: ProcessGraph) => {
    setProcessGraph(editedGraph);
    setCurrentView('simulation');
  };

  const handleReject = () => {
    setProcessGraph(null);
    setCurrentView('input');
  };

  return (
    <div>
      {currentView === 'input' && (
        <div>
          <h1>Enter Simulation Description</h1>
          <textarea
            placeholder="Describe your factory..."
            onBlur={(e) => {
              if (e.target.value.trim()) {
                handleParseComplete(e.target.value);
              }
            }}
          />
        </div>
      )}

      {currentView === 'review' && processGraph && (
        <ParsedDataReview
          initialGraph={processGraph}
          validation={{ valid: true, errors: [], warnings: [] }}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {currentView === 'simulation' && processGraph && (
        <div>
          <h1>Running Simulation...</h1>
          <pre>{JSON.stringify(processGraph, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// USAGE IN MAIN APP
// ============================================================================

/**
 * To use in your main app, add one of these to your router:
 *
 * // Option 1: Full workflow (simplest)
 * <Route path="/simulation" component={FullWorkflowExample} />
 *
 * // Option 2: Custom integration
 * <Route path="/simulation" component={IntegratedExample} />
 *
 * // Option 3: Direct component
 * <Route path="/simulation" element={<SimulationWorkflow />} />
 */
