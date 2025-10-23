/**
 * BOTTLENECK CARD COMPONENT
 * Visual display of system bottlenecks with recommendations
 */

import React from 'react';
import './BottleneckCard.css';

interface BottleneckCardProps {
  analysis: {
    primaryBottleneck: {
      resource: string;
      utilization: number;
      impactScore: number;
    };
    secondaryBottlenecks: Array<{
      resource: string;
      utilization: number;
    }>;
    recommendations: string[];
  };
}

export const BottleneckCard: React.FC<BottleneckCardProps> = ({ analysis }) => {
  const { primaryBottleneck, secondaryBottlenecks, recommendations } = analysis;

  const getSeverityLevel = (utilization: number) => {
    if (utilization >= 0.95) return 'critical';
    if (utilization >= 0.85) return 'high';
    if (utilization >= 0.75) return 'medium';
    return 'low';
  };

  const severity = getSeverityLevel(primaryBottleneck.utilization);

  return (
    <div className={`bottleneck-card severity-${severity}`}>
      {/* Primary Bottleneck */}
      <div className="bottleneck-card__primary">
        <div className="bottleneck-card__badge">
          <span className="badge-icon">🎯</span>
          <span className="badge-text">Primary Bottleneck</span>
        </div>

        <div className="bottleneck-card__info">
          <h3 className="bottleneck-resource">{primaryBottleneck.resource}</h3>

          <div className="bottleneck-metrics">
            <div className="metric-pill">
              <span className="metric-label">Utilization</span>
              <span className="metric-value">
                {(primaryBottleneck.utilization * 100).toFixed(1)}%
              </span>
            </div>
            <div className="metric-pill">
              <span className="metric-label">Impact Score</span>
              <span className="metric-value">
                {primaryBottleneck.impactScore.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Utilization Bar */}
          <div className="utilization-bar">
            <div
              className="utilization-fill"
              style={{ width: `${primaryBottleneck.utilization * 100}%` }}
            >
              <span className="utilization-text">
                {(primaryBottleneck.utilization * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Bottlenecks */}
      {secondaryBottlenecks.length > 0 && (
        <div className="bottleneck-card__secondary">
          <h4 className="secondary-title">Secondary Bottlenecks</h4>
          <div className="secondary-list">
            {secondaryBottlenecks.map((bottleneck, index) => (
              <div key={index} className="secondary-item">
                <span className="secondary-name">{bottleneck.resource}</span>
                <div className="secondary-bar">
                  <div
                    className="secondary-fill"
                    style={{ width: `${bottleneck.utilization * 100}%` }}
                  />
                  <span className="secondary-value">
                    {(bottleneck.utilization * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bottleneck-card__recommendations">
          <h4 className="recommendations-title">
            <span className="recommendations-icon">💡</span>
            Recommendations
          </h4>
          <ul className="recommendations-list">
            {recommendations.map((rec, index) => (
              <li key={index} className="recommendation-item">
                <span className="recommendation-number">{index + 1}</span>
                <span className="recommendation-text">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
