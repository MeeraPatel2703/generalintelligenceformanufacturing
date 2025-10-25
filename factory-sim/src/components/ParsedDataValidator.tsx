import React from 'react';
import { ProcessGraph } from '../types/processGraph';

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  category: 'routing' | 'distribution' | 'reference' | 'logic' | 'performance';
  path: string;
  message: string;
  suggestion?: string;
  autoFix?: () => ProcessGraph;
}

interface ParsedDataValidatorProps {
  graph: ProcessGraph;
  onAutoFix?: (fixedGraph: ProcessGraph) => void;
}

export const validateProcessGraphLive = (graph: ProcessGraph): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  // Validate route probabilities sum to 1.0 for each station
  const routesByStation = new Map<string, typeof graph.routes>();
  graph.routes.forEach((route) => {
    if (!routesByStation.has(route.from)) {
      routesByStation.set(route.from, []);
    }
    routesByStation.get(route.from)!.push(route);
  });

  routesByStation.forEach((routes, stationId) => {
    const sum = routes.reduce((acc, r) => acc + r.probability, 0);
    if (Math.abs(sum - 1.0) > 0.001) {
      issues.push({
        severity: 'error',
        category: 'routing',
        path: `routes[from=${stationId}]`,
        message: `Route probabilities from ${stationId} sum to ${sum.toFixed(3)}, must equal 1.0`,
        suggestion: `Normalize probabilities to sum to 1.0`,
        autoFix: () => {
          const newGraph = JSON.parse(JSON.stringify(graph));
          newGraph.routes.forEach((route: typeof graph.routes[0]) => {
            if (route.from === stationId) {
              route.probability = route.probability / sum;
            }
          });
          return newGraph;
        }
      });
    }
  });

  // Validate station references in routes
  const stationIds = new Set(graph.stations.map((s) => s.id));
  graph.routes.forEach((route, idx) => {
    if (!stationIds.has(route.from)) {
      issues.push({
        severity: 'error',
        category: 'reference',
        path: `routes[${idx}].from`,
        message: `Route references non-existent station: ${route.from}`,
        suggestion: `Correct station ID or remove route`
      });
    }
    if (!stationIds.has(route.to)) {
      issues.push({
        severity: 'error',
        category: 'reference',
        path: `routes[${idx}].to`,
        message: `Route references non-existent station: ${route.to}`,
        suggestion: `Correct station ID or remove route`
      });
    }
  });

  // Validate triangular distribution constraints: min <= mode <= max
  graph.stations.forEach((station, idx) => {
    if (station.processTime?.type === 'triangular') {
      const { min, mode, max } = station.processTime.params as {
        min: number;
        mode: number;
        max: number;
      };
      if (!(min <= mode && mode <= max)) {
        issues.push({
          severity: 'error',
          category: 'distribution',
          path: `stations[${idx}].processTime`,
          message: `Triangular distribution invalid: min=${min}, mode=${mode}, max=${max}. Must satisfy min ≤ mode ≤ max`,
          suggestion: `Adjust parameters to satisfy min ≤ mode ≤ max`,
          autoFix: () => {
            const newGraph = JSON.parse(JSON.stringify(graph));
            const sorted = [min, mode, max].sort((a, b) => a - b);
            newGraph.stations[idx].processTime.params = {
              min: sorted[0],
              mode: sorted[1],
              max: sorted[2]
            };
            return newGraph;
          }
        });
      }
    }
  });

  // Validate normal distribution (stdev must be positive)
  graph.stations.forEach((station, idx) => {
    if (station.processTime?.type === 'normal') {
      const { stdev } = station.processTime.params as { mean: number; stdev: number };
      if (stdev <= 0) {
        issues.push({
          severity: 'error',
          category: 'distribution',
          path: `stations[${idx}].processTime.params.stdev`,
          message: `Normal distribution standard deviation must be positive (got ${stdev})`,
          suggestion: `Set stdev to a positive value (e.g., mean * 0.1)`
        });
      }
    }
  });

  // Validate exponential distribution (mean must be positive)
  graph.stations.forEach((station, idx) => {
    if (station.processTime?.type === 'exponential') {
      const { mean } = station.processTime.params as { mean: number };
      if (mean <= 0) {
        issues.push({
          severity: 'error',
          category: 'distribution',
          path: `stations[${idx}].processTime.params.mean`,
          message: `Exponential distribution mean must be positive (got ${mean})`,
          suggestion: `Set mean to a positive value`
        });
      }
    }
  });

  // Validate uniform distribution (min < max)
  graph.stations.forEach((station, idx) => {
    if (station.processTime?.type === 'uniform') {
      const { min, max } = station.processTime.params as { min: number; max: number };
      if (min >= max) {
        issues.push({
          severity: 'error',
          category: 'distribution',
          path: `stations[${idx}].processTime`,
          message: `Uniform distribution invalid: min=${min}, max=${max}. Must satisfy min < max`,
          suggestion: `Ensure min < max`,
          autoFix: () => {
            const newGraph = JSON.parse(JSON.stringify(graph));
            newGraph.stations[idx].processTime.params = { min: Math.min(min, max), max: Math.max(min, max) };
            return newGraph;
          }
        });
      }
    }
  });

  // Check for disconnected stations (no incoming or outgoing routes)
  graph.stations.forEach((station) => {
    if (station.kind === 'source' || station.kind === 'sink') return; // Sources/sinks can be disconnected

    const hasIncoming = graph.routes.some((r) => r.to === station.id);
    const hasOutgoing = graph.routes.some((r) => r.from === station.id);

    if (!hasIncoming && !hasOutgoing) {
      issues.push({
        severity: 'warning',
        category: 'routing',
        path: `stations[id=${station.id}]`,
        message: `Station ${station.id} has no incoming or outgoing routes (isolated)`,
        suggestion: `Add routes connecting this station to the flow`
      });
    } else if (!hasIncoming) {
      issues.push({
        severity: 'warning',
        category: 'routing',
        path: `stations[id=${station.id}]`,
        message: `Station ${station.id} has no incoming routes`,
        suggestion: `Add route(s) leading to this station`
      });
    } else if (!hasOutgoing) {
      issues.push({
        severity: 'warning',
        category: 'routing',
        path: `stations[id=${station.id}]`,
        message: `Station ${station.id} has no outgoing routes`,
        suggestion: `Add route(s) leaving this station`
      });
    }
  });

  // Check for rework loops without escape
  graph.stations.forEach((station) => {
    if (station.rework) {
      const reworkTarget = station.rework.to;
      const hasEscape = graph.routes.some(
        (r) => r.from === reworkTarget && r.to !== station.id && r.probability > 0
      );
      if (!hasEscape) {
        issues.push({
          severity: 'warning',
          category: 'logic',
          path: `stations[id=${station.id}].rework`,
          message: `Station ${station.id} reworks to ${reworkTarget}, but ${reworkTarget} has no escape route (infinite loop possible)`,
          suggestion: `Ensure ${reworkTarget} has routes to other stations`
        });
      }
    }
  });

  // Performance warnings
  if (graph.runConfig.replications > 1000) {
    issues.push({
      severity: 'warning',
      category: 'performance',
      path: 'runConfig.replications',
      message: `${graph.runConfig.replications} replications may take a long time to execute`,
      suggestion: `Consider starting with 100-500 replications for faster results`
    });
  }

  if (graph.runConfig.runLength_min > 10000) {
    issues.push({
      severity: 'info',
      category: 'performance',
      path: 'runConfig.runLength_min',
      message: `Run length of ${graph.runConfig.runLength_min} minutes is very long`,
      suggestion: `Consider shorter run length for initial validation`
    });
  }

  // Check for arrival policy
  if (graph.arrivals.length === 0) {
    issues.push({
      severity: 'error',
      category: 'logic',
      path: 'arrivals',
      message: `No arrival policies defined - simulation will have no entities`,
      suggestion: `Add at least one arrival policy (Poisson, schedule table, etc.)`
    });
  }

  // Check entity references
  const entityIds = new Set(graph.entities.map((e) => e.id));
  graph.arrivals.forEach((arrival, idx) => {
    if (arrival.policy === 'poisson' && arrival.class_mix) {
      arrival.class_mix.forEach((mix, mixIdx) => {
        if (!entityIds.has(mix.class)) {
          issues.push({
            severity: 'error',
            category: 'reference',
            path: `arrivals[${idx}].class_mix[${mixIdx}]`,
            message: `Arrival references non-existent entity class: ${mix.class}`,
            suggestion: `Correct class name or add entity definition`
          });
        }
      });
    }
  });

  return issues;
};

const ParsedDataValidator: React.FC<ParsedDataValidatorProps> = ({ graph, onAutoFix }) => {
  const issues = validateProcessGraphLive(graph);

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const infos = issues.filter((i) => i.severity === 'info');

  const handleAutoFix = (issue: ValidationIssue) => {
    if (issue.autoFix && onAutoFix) {
      const fixedGraph = issue.autoFix();
      onAutoFix(fixedGraph);
    }
  };

  return (
    <div className="parsed-data-validator">
      <h3>Live Validation Results</h3>

      {issues.length === 0 ? (
        <div className="no-issues">
          <span className="check-icon">✓</span>
          <p>No validation issues found. Graph is ready for simulation!</p>
        </div>
      ) : (
        <>
          {errors.length > 0 && (
            <div className="issues-section errors">
              <h4>Errors ({errors.length})</h4>
              <p className="section-description">These must be fixed before simulation</p>
              {errors.map((issue, idx) => (
                <div key={idx} className="issue-card error-card">
                  <div className="issue-header">
                    <span className="issue-icon">⚠</span>
                    <span className="issue-path">{issue.path}</span>
                  </div>
                  <div className="issue-message">{issue.message}</div>
                  {issue.suggestion && (
                    <div className="issue-suggestion">💡 {issue.suggestion}</div>
                  )}
                  {issue.autoFix && (
                    <button className="auto-fix-button" onClick={() => handleAutoFix(issue)}>
                      Auto-Fix
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="issues-section warnings">
              <h4>Warnings ({warnings.length})</h4>
              <p className="section-description">Recommended to address, but not blocking</p>
              {warnings.map((issue, idx) => (
                <div key={idx} className="issue-card warning-card">
                  <div className="issue-header">
                    <span className="issue-icon">⚡</span>
                    <span className="issue-path">{issue.path}</span>
                  </div>
                  <div className="issue-message">{issue.message}</div>
                  {issue.suggestion && (
                    <div className="issue-suggestion">💡 {issue.suggestion}</div>
                  )}
                  {issue.autoFix && (
                    <button className="auto-fix-button" onClick={() => handleAutoFix(issue)}>
                      Auto-Fix
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {infos.length > 0 && (
            <div className="issues-section infos">
              <h4>Info ({infos.length})</h4>
              <p className="section-description">Informational messages</p>
              {infos.map((issue, idx) => (
                <div key={idx} className="issue-card info-card">
                  <div className="issue-header">
                    <span className="issue-icon">ℹ</span>
                    <span className="issue-path">{issue.path}</span>
                  </div>
                  <div className="issue-message">{issue.message}</div>
                  {issue.suggestion && (
                    <div className="issue-suggestion">💡 {issue.suggestion}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <style>{`
        .parsed-data-validator {
          background: rgba(0, 0, 0, 0.2);
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .parsed-data-validator h3 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          font-size: 1.3rem;
        }

        .no-issues {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: rgba(72, 187, 120, 0.1);
          border: 2px solid #48bb78;
          border-radius: 6px;
        }

        .check-icon {
          font-size: 2rem;
          color: #48bb78;
        }

        .no-issues p {
          margin: 0;
          font-size: 1.1rem;
          color: #48bb78;
        }

        .issues-section {
          margin-bottom: 1.5rem;
        }

        .issues-section h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
        }

        .section-description {
          margin: 0 0 1rem 0;
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .issue-card {
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 0.75rem;
          border-left: 4px solid;
        }

        .error-card {
          background: rgba(245, 101, 101, 0.1);
          border-left-color: #f56565;
        }

        .warning-card {
          background: rgba(246, 173, 85, 0.1);
          border-left-color: #f6ad55;
        }

        .info-card {
          background: rgba(66, 153, 225, 0.1);
          border-left-color: #4299e1;
        }

        .issue-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .issue-icon {
          font-size: 1.2rem;
        }

        .issue-path {
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          color: #f6ad55;
          font-weight: 600;
        }

        .issue-message {
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }

        .issue-suggestion {
          font-size: 0.9rem;
          opacity: 0.9;
          font-style: italic;
          margin-top: 0.5rem;
        }

        .auto-fix-button {
          margin-top: 0.75rem;
          background: #667eea;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .auto-fix-button:hover {
          background: #5a67d8;
        }
      `}</style>
    </div>
  );
};

export default ParsedDataValidator;
