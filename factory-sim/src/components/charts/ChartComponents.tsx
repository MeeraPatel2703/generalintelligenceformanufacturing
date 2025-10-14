/**
 * PROFESSIONAL CHART COMPONENTS
 * 
 * Pure CSS/Canvas-based charts without external dependencies:
 * - Gauge charts for KPIs
 * - Bar charts for comparisons
 * - Sparklines for trends
 * - Progress indicators
 * - Heatmaps for utilization
 */

import React, { useEffect, useRef } from 'react';

// ============================================================================
// GAUGE CHART (for KPIs like utilization, efficiency)
// ============================================================================

interface GaugeChartProps {
  value: number; // 0-100
  label: string;
  unit?: string;
  size?: number;
  thresholds?: {
    good: number;
    warning: number;
  };
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  label,
  unit = '%',
  size = 120,
  thresholds = { good: 70, warning: 85 }
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;
    const lineWidth = 15;
    
    // Background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, 0.25 * Math.PI);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = '#e5e7eb';
    ctx.stroke();
    
    // Value arc (colored based on thresholds)
    const normalizedValue = Math.min(100, Math.max(0, value));
    const endAngle = 0.75 * Math.PI + (normalizedValue / 100) * 1.5 * Math.PI;
    
    let color = '#10b981'; // green
    if (normalizedValue >= thresholds.warning) {
      color = '#ef4444'; // red
    } else if (normalizedValue >= thresholds.good) {
      color = '#f59e0b'; // orange
    }
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, endAngle);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.stroke();
    
  }, [value, size, thresholds]);
  
  return (
    <div style={{ textAlign: 'center' }}>
      <canvas 
        ref={canvasRef} 
        width={size} 
        height={size}
        style={{ display: 'block', margin: '0 auto' }}
      />
      <div style={{ marginTop: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
        {value.toFixed(1)}{unit}
      </div>
      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
        {label}
      </div>
    </div>
  );
};

// ============================================================================
// BAR CHART (for resource comparisons)
// ============================================================================

interface BarChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  height?: number;
  maxValue?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 200,
  maxValue
}) => {
  const max = maxValue || Math.max(...data.map(d => d.value));
  
  return (
    <div style={{ height, display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
      {data.map((item, idx) => {
        const barHeight = (item.value / max) * (height - 30);
        const color = item.color || 'var(--color-primary)';
        
        return (
          <div 
            key={idx}
            style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              {item.value.toFixed(1)}
            </div>
            <div
              style={{
                width: '100%',
                height: barHeight,
                backgroundColor: color,
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.5s ease',
                position: 'relative'
              }}
              title={`${item.label}: ${item.value.toFixed(2)}`}
            />
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--color-text-secondary)',
              textAlign: 'center',
              wordBreak: 'break-word',
              maxWidth: '100%'
            }}>
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// SPARKLINE (for trends)
// ============================================================================

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 30,
  color = 'var(--color-primary)',
  showDots = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, width, height);
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const xStep = width / (data.length - 1);
    
    // Draw line
    ctx.beginPath();
    data.forEach((value, idx) => {
      const x = idx * xStep;
      const y = height - ((value - min) / range) * height;
      
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw dots
    if (showDots) {
      data.forEach((value, idx) => {
        const x = idx * xStep;
        const y = height - ((value - min) / range) * height;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      });
    }
    
  }, [data, width, height, color, showDots]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height}
      style={{ display: 'block' }}
    />
  );
};

// ============================================================================
// HEATMAP (for resource utilization over time)
// ============================================================================

interface HeatmapProps {
  data: number[][]; // 2D array of values 0-1
  labels?: {
    rows: string[];
    cols: string[];
  };
  width?: number;
  height?: number;
}

export const Heatmap: React.FC<HeatmapProps> = ({
  data,
  labels,
  width = 400,
  height = 200
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, width, height);
    
    const rows = data.length;
    const cols = data[0].length;
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    
    data.forEach((row, i) => {
      row.forEach((value, j) => {
        const normalizedValue = Math.min(1, Math.max(0, value));
        
        // Color interpolation: green -> yellow -> red
        let r, g, b;
        if (normalizedValue < 0.5) {
          // Green to yellow
          r = Math.floor(normalizedValue * 2 * 255);
          g = 255;
          b = 0;
        } else {
          // Yellow to red
          r = 255;
          g = Math.floor((1 - normalizedValue) * 2 * 255);
          b = 0;
        }
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
        
        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
      });
    });
    
  }, [data, width, height]);
  
  return (
    <div>
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        style={{ display: 'block', borderRadius: '4px' }}
      />
      {labels && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem' }}>
          <span>{labels.cols[0]}</span>
          <span>{labels.cols[labels.cols.length - 1]}</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MINI METRIC CARD (with sparkline)
// ============================================================================

interface MiniMetricCardProps {
  label: string;
  value: number | string;
  unit?: string;
  trend?: number[]; // For sparkline
  change?: number; // % change
  status?: 'good' | 'neutral' | 'bad';
}

export const MiniMetricCard: React.FC<MiniMetricCardProps> = ({
  label,
  value,
  unit,
  trend,
  change,
  status = 'neutral'
}) => {
  const statusColors = {
    good: '#10b981',
    neutral: '#3b82f6',
    bad: '#ef4444'
  };
  
  return (
    <div style={{
      background: 'var(--color-bg-secondary)',
      border: `1px solid var(--color-border)`,
      borderLeft: `4px solid ${statusColors[status]}`,
      borderRadius: '4px',
      padding: '1rem',
      minWidth: '180px'
    }}>
      <div style={{ 
        fontSize: '0.75rem', 
        color: 'var(--color-text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '0.5rem'
      }}>
        {label}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
          {typeof value === 'number' ? value.toFixed(1) : value}
        </div>
        {unit && (
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            {unit}
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {change !== undefined && (
          <div style={{ 
            fontSize: '0.75rem',
            color: change > 0 ? '#10b981' : change < 0 ? '#ef4444' : 'var(--color-text-secondary)',
            fontWeight: 600
          }}>
            {change > 0 ? '↑' : change < 0 ? '↓' : '→'} {Math.abs(change).toFixed(1)}%
          </div>
        )}
        
        {trend && trend.length > 1 && (
          <Sparkline 
            data={trend} 
            width={60} 
            height={20} 
            color={statusColors[status]}
          />
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPARISON BAR (for before/after)
// ============================================================================

interface ComparisonBarProps {
  label: string;
  baseline: number;
  current: number;
  unit?: string;
  higherIsBetter?: boolean;
}

export const ComparisonBar: React.FC<ComparisonBarProps> = ({
  label,
  baseline,
  current,
  unit = '',
  higherIsBetter = true
}) => {
  const maxValue = Math.max(baseline, current) * 1.1;
  const baselineWidth = (baseline / maxValue) * 100;
  const currentWidth = (current / maxValue) * 100;
  
  const improvement = ((current - baseline) / baseline) * 100;
  const isImproved = higherIsBetter ? improvement > 0 : improvement < 0;
  
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '0.5rem',
        fontSize: '0.875rem'
      }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ 
          color: isImproved ? '#10b981' : improvement === 0 ? 'var(--color-text-secondary)' : '#ef4444',
          fontWeight: 600
        }}>
          {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
        </span>
      </div>
      
      <div style={{ marginBottom: '0.25rem' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
          Baseline: {baseline.toFixed(1)}{unit}
        </div>
        <div style={{ 
          width: `${baselineWidth}%`, 
          height: '8px', 
          backgroundColor: '#9ca3af',
          borderRadius: '4px'
        }} />
      </div>
      
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
          Current: {current.toFixed(1)}{unit}
        </div>
        <div style={{ 
          width: `${currentWidth}%`, 
          height: '8px', 
          backgroundColor: isImproved ? '#10b981' : improvement === 0 ? '#3b82f6' : '#ef4444',
          borderRadius: '4px'
        }} />
      </div>
    </div>
  );
};

