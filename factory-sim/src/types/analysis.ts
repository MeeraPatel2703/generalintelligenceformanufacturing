// TypeScript interfaces for comprehensive factory AI analysis

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface CycleTimeDistribution {
  distribution_type: 'normal' | 'exponential' | 'triangular' | 'uniform' | 'constant' | 'weibull' | 'lognormal';
  mean: number;
  std_dev?: number;
  min?: number;
  max?: number;
  mode?: number;
  shape?: number;
  scale?: number;
  unit: 'min';
}

export interface ResourceConfig {
  capacity: number;
  routing_rule: 'FIFO' | 'LIFO' | 'SPT' | 'LPT' | 'EDD' | 'SHORTEST_QUEUE' | 'PRIORITY' | 'RANDOM';
  initial_state: 'available' | 'unavailable';
}

export interface FailureMaintenanceConfig {
  mtbf_minutes: number;
  mttr_minutes: number;
  failure_type: 'RANDOM' | 'WEAR_OUT' | 'USAGE_BASED' | 'SCHEDULED' | 'CONDITION_BASED';
  maintenance_interval_minutes?: number;
  maintenance_duration_minutes?: number;
}

export interface Utilization {
  avg: number;
  max: number;
  is_bottleneck: boolean;
}

export interface QueuePattern {
  avg_length: number;
  max_length: number;
  is_growing: boolean;
}

export interface Visualization {
  position: Position3D;
  visual_type: 'station' | 'machine' | 'queue';
  color_hex: string;
}

export interface MachineAnalysis {
  id: string;
  name: string;
  type: 'CNC' | 'Assembly' | 'QualityControl' | 'Storage' | 'Packaging' | 'Paint' | 'Weld' | 'Inspection' | 'Transport';
  plc_tag_prefix: string;
  cycle_time: CycleTimeDistribution;
  resource_config: ResourceConfig;
  failure_maintenance: FailureMaintenanceConfig;
  utilization: Utilization;
  queue_pattern: QueuePattern;
  visualization: Visualization;
}

export interface ConveyorConfig {
  id: string;
  start_pos: Position3D;
  end_pos: Position3D;
  speed: number;
  capacity: number;
  accumulating: boolean;
}

export interface AGVConfig {
  id: string;
  capacity: number;
  speed: number;
  position: Position3D;
}

export interface AGVNode {
  id: string;
  position: Position3D;
}

export interface AGVEdge {
  id: string;
  from: string;
  to: string;
}

export interface AGVSystem {
  vehicles: AGVConfig[];
  network_nodes: AGVNode[];
  network_edges: AGVEdge[];
}

export interface TransporterConfig {
  id: string;
  type: 'forklift' | 'truck' | 'crane';
  capacity: number;
  speed: number;
  position: Position3D;
}

export interface MaterialHandling {
  conveyors: ConveyorConfig[];
  agv_system: AGVSystem;
  transporters: TransporterConfig[];
}

export interface RoutingConnection {
  to: string;
  probability: number;
}

export interface FlowRouting {
  sequence: string[];
  connections: Record<string, RoutingConnection[]>;
}

export interface InterarrivalTime {
  distribution_type: 'exponential' | 'normal' | 'uniform' | 'constant';
  mean: number;
  std_dev?: number;
  min?: number;
  max?: number;
  unit: 'min';
}

export interface EntitySource {
  id: string;
  entity_type: string;
  interarrival_time: InterarrivalTime;
  max_arrivals: number | 'unlimited';
  position: Position3D;
}

export interface ShiftDefinition {
  name: string;
  start_hour: number;
  end_hour: number;
  days: string[];
}

export interface BreakDefinition {
  start_minute: number;
  duration_minutes: number;
  name: string;
}

export interface ShiftsCalendars {
  calendar_type: '24x7' | '5_day_week' | 'custom';
  shifts: ShiftDefinition[];
  breaks: BreakDefinition[];
  holidays: string[];
  resource_calendars: Record<string, string>;
}

export interface BottleneckInfo {
  machine_id: string;
  reason: string;
  utilization_pct: number;
  queue_length: number;
  severity: 'low' | 'medium' | 'high';
}

export interface OptimizationFactor {
  name: string;
  min: number;
  max: number;
  current: number;
  discrete: boolean;
}

export interface OptimizationConfig {
  bottleneck: BottleneckInfo;
  opportunities: string[];
  factors_for_doe: OptimizationFactor[];
}

export interface SimulationConfig {
  duration_minutes: number;
  warmup_minutes: number;
  num_replications: number;
  enable_3d: boolean;
  enable_material_handling: boolean;
  enable_failures: boolean;
  enable_shifts: boolean;
  enable_ai_insights: boolean;
}

export interface DataQuality {
  total_rows: number;
  time_span_hours: number;
  missing_data_pct: number;
  confidence_level: 'low' | 'medium' | 'high';
}

export interface FactoryAnalysis {
  machines: MachineAnalysis[];
  material_handling: MaterialHandling;
  flow_routing: FlowRouting;
  entity_sources: EntitySource[];
  shifts_calendars: ShiftsCalendars;
  optimization: OptimizationConfig;
  simulation_config: SimulationConfig;
  data_quality: DataQuality;
  // Legacy fields for backward compatibility
  flow_sequence?: string[];
  bottleneck?: BottleneckInfo;
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
