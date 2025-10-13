// TypeScript interfaces for factory AI analysis

export interface MachineAnalysis {
  id: string;
  name: string;
  type: 'CNC' | 'Assembly' | 'QualityControl' | 'Storage';
  plc_tag_prefix: string;
  cycle_time: {
    mean: number;
    std_dev: number;
    unit: 'min';
    distribution_type: 'normal' | 'exponential';
  };
  utilization: {
    avg: number;
    max: number;
    is_bottleneck: boolean;
  };
  queue_pattern: {
    avg_length: number;
    is_growing: boolean;
  };
}

export interface BottleneckInfo {
  machine_id: string;
  reason: string;
  utilization_pct: number;
  queue_length: number;
  severity: 'low' | 'medium' | 'high';
}

export interface DataQuality {
  total_rows: number;
  time_span_hours: number;
  missing_data_pct: number;
}

export interface FactoryAnalysis {
  machines: MachineAnalysis[];
  flow_sequence: string[];
  bottleneck: BottleneckInfo;
  data_quality: DataQuality;
}

export interface CachedAnalysis {
  csv_hash: string;
  analysis: FactoryAnalysis;
  timestamp: number;
}

export interface AnalysisResult {
  success: boolean;
  analysis?: FactoryAnalysis;
  error?: string;
  cached?: boolean;
  cache_timestamp?: number;
  cache_age_minutes?: number;
}
