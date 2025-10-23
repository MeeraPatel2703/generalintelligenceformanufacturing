/**
 * PERFORMANCE CHART COMPONENT
 * Simple line chart for time series data
 */

import React from 'react';
import './PerformanceChart.css';

interface PerformanceChartProps {
  data: {
    timePoints: number[];
    utilization?: number[];
    throughput?: number[];
    queueLength?: number[];
  };
  type: 'utilization' | 'throughput' | 'queue';
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ data, type }) => {
  const getChartData = () => {
    switch (type) {
      case 'utilization':
        return data.utilization || [];
      case 'throughput':
        return data.throughput || [];
      case 'queue':
        return data.queueLength || [];
      default:
        return [];
    }
  };

  const chartData = getChartData();
  const maxValue = Math.max(...chartData, 1);
  const points = chartData.length;

  const getLabel = () => {
    switch (type) {
      case 'utilization':
        return 'Resource Utilization (%)';
      case 'throughput':
        return 'Throughput (units/hr)';
      case 'queue':
        return 'Queue Length (entities)';
      default:
        return '';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'utilization':
        return '#667eea';
      case 'throughput':
        return '#10b981';
      case 'queue':
        return '#f59e0b';
      default:
        return '#667eea';
    }
  };

  // Generate SVG path
  const generatePath = () => {
    if (chartData.length === 0) return '';

    const width = 600;
    const height = 300;
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    const pathPoints = chartData.map((value, index) => {
      const x = padding + (index / (points - 1 || 1)) * chartWidth;
      const y = height - padding - (value / maxValue) * chartHeight;
      return `${x},${y}`;
    });

    return `M ${pathPoints.join(' L ')}`;
  };

  return (
    <div className="performance-chart">
      <div className="chart-label">{getLabel()}</div>

      {chartData.length === 0 ? (
        <div className="chart-placeholder">
          <div className="placeholder-icon">📊</div>
          <div className="placeholder-text">No data available</div>
        </div>
      ) : (
        <svg
          className="chart-svg"
          viewBox="0 0 600 300"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          <g className="grid-lines">
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
              <line
                key={fraction}
                x1="40"
                y1={260 - fraction * 220}
                x2="560"
                y2={260 - fraction * 220}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}
          </g>

          {/* Y-axis labels */}
          <g className="y-labels">
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
              <text
                key={fraction}
                x="30"
                y={264 - fraction * 220}
                textAnchor="end"
                fontSize="12"
                fill="#6b7280"
              >
                {(maxValue * fraction).toFixed(1)}
              </text>
            ))}
          </g>

          {/* Area under curve */}
          <defs>
            <linearGradient id={`gradient-${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={getColor()} stopOpacity="0.3" />
              <stop offset="100%" stopColor={getColor()} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path
            d={`${generatePath()} L 560,260 L 40,260 Z`}
            fill={`url(#gradient-${type})`}
          />

          {/* Line */}
          <path
            d={generatePath()}
            fill="none"
            stroke={getColor()}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="chart-line"
          />

          {/* Data points */}
          {chartData.map((value, index) => {
            const x = 40 + (index / (points - 1 || 1)) * 520;
            const y = 260 - (value / maxValue) * 220;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill={getColor()}
                className="chart-point"
              />
            );
          })}
        </svg>
      )}
    </div>
  );
};
