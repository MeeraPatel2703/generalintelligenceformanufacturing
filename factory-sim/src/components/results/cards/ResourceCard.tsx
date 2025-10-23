/**
 * RESOURCE CARD COMPONENT
 * Displays individual resource performance metrics
 */

import React from 'react';
import './ResourceCard.css';

interface ResourceCardProps {
  resource: {
    resourceName: string;
    resourceType: string;
    utilization: {
      average: number;
    };
    capacity: number;
    numberOfSeizures: number;
    averageSeizureTime: number;
    contentAverage: number;
    oee?: number;
  };
  isBottleneck?: boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, isBottleneck }) => {
  const utilizationPercent = resource.utilization.average * 100;

  const getUtilizationStatus = (util: number) => {
    if (util >= 95) return 'critical';
    if (util >= 85) return 'high';
    if (util >= 70) return 'good';
    return 'low';
  };

  const status = getUtilizationStatus(utilizationPercent);

  return (
    <div className={`resource-card ${isBottleneck ? 'is-bottleneck' : ''} status-${status}`}>
      {isBottleneck && (
        <div className="resource-card__bottleneck-badge">
          🎯 Bottleneck
        </div>
      )}

      <div className="resource-card__header">
        <div className="resource-card__title">
          <h3 className="resource-name">{resource.resourceName}</h3>
          <span className="resource-type">{resource.resourceType}</span>
        </div>
        <div className={`resource-card__status-icon status-${status}`}>
          {status === 'critical' && '🔴'}
          {status === 'high' && '🟠'}
          {status === 'good' && '🟢'}
          {status === 'low' && '🔵'}
        </div>
      </div>

      {/* Utilization Gauge */}
      <div className="resource-card__gauge">
        <svg viewBox="0 0 200 120" className="gauge-svg">
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={`var(--status-color-${status})`}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(utilizationPercent / 100) * 251.2} 251.2`}
            className="gauge-progress"
          />
          {/* Center text */}
          <text
            x="100"
            y="85"
            textAnchor="middle"
            className="gauge-value"
            fill="#1f2937"
            fontSize="32"
            fontWeight="700"
          >
            {utilizationPercent.toFixed(0)}%
          </text>
          <text
            x="100"
            y="105"
            textAnchor="middle"
            className="gauge-label"
            fill="#6b7280"
            fontSize="12"
            fontWeight="500"
          >
            Utilization
          </text>
        </svg>
      </div>

      {/* Metrics Grid */}
      <div className="resource-card__metrics">
        <div className="metric-item">
          <span className="metric-icon">⚡</span>
          <div className="metric-content">
            <span className="metric-label">Capacity</span>
            <span className="metric-value">{resource.capacity}</span>
          </div>
        </div>

        <div className="metric-item">
          <span className="metric-icon">🔄</span>
          <div className="metric-content">
            <span className="metric-label">Seizures</span>
            <span className="metric-value">{resource.numberOfSeizures}</span>
          </div>
        </div>

        <div className="metric-item">
          <span className="metric-icon">⏱️</span>
          <div className="metric-content">
            <span className="metric-label">Avg Time</span>
            <span className="metric-value">
              {resource.averageSeizureTime.toFixed(1)}h
            </span>
          </div>
        </div>

        {resource.oee !== undefined && (
          <div className="metric-item">
            <span className="metric-icon">📊</span>
            <div className="metric-content">
              <span className="metric-label">OEE</span>
              <span className="metric-value">
                {(resource.oee * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Performance Bar */}
      <div className="resource-card__performance">
        <div className="performance-label">
          <span>Performance</span>
          <span className={`performance-rating rating-${status}`}>
            {status.toUpperCase()}
          </span>
        </div>
        <div className="performance-bar">
          <div
            className={`performance-fill fill-${status}`}
            style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
