/**
 * METRIC CARD COMPONENT
 * Sleek, animated card for displaying key metrics
 */

import React from 'react';
import './MetricCard.css';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  trend = 'neutral',
  onClick
}) => {
  const trendColors = {
    up: '#10b981',
    down: '#ef4444',
    neutral: '#6b7280'
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→'
  };

  return (
    <div
      className={`metric-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{ '--trend-color': trendColors[trend] } as React.CSSProperties}
    >
      <div className="metric-card__header">
        <div className="metric-card__icon">{icon}</div>
        <div className={`metric-card__trend trend-${trend}`}>
          {trendIcons[trend]}
        </div>
      </div>

      <div className="metric-card__body">
        <h3 className="metric-card__title">{title}</h3>
        <div className="metric-card__value-container">
          <span className="metric-card__value">{value.toFixed(2)}</span>
          <span className="metric-card__unit">{unit}</span>
        </div>
      </div>

      <div className="metric-card__glow"></div>
    </div>
  );
};
