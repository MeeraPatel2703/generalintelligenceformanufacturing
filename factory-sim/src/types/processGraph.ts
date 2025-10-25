// Complete DES Process Graph types matching the Master Parser specification
// This schema captures EVERYTHING: entities, arrivals, stations, routes,
// resources, experiments, distributions, calendars, etc.

// ============================================================================
// DISTRIBUTIONS
// ============================================================================

export type DistributionType =
  | 'constant'
  | 'normal'
  | 'lognormal'
  | 'exponential'
  | 'gamma'
  | 'weibull'
  | 'uniform'
  | 'triangular'
  | 'erlang'
  | 'empirical';

export interface ConstantDistribution {
  type: 'constant';
  params: { value: number };
  units: 'minutes' | 'feet' | 'entities/hour';
}

export interface NormalDistribution {
  type: 'normal';
  params: { mean: number; stdev: number };
  units: 'minutes' | 'feet' | 'entities/hour';
}

export interface LognormalDistribution {
  type: 'lognormal';
  params: { mu: number; sigma: number };
  units: 'minutes' | 'feet' | 'entities/hour';
}

export interface ExponentialDistribution {
  type: 'exponential';
  params: { mean: number };
  units: 'minutes' | 'feet' | 'entities/hour';
}

export interface GammaDistribution {
  type: 'gamma';
  params: { shape: number; scale: number };
  units: 'minutes' | 'feet' | 'entities/hour';
}

export interface WeibullDistribution {
  type: 'weibull';
  params: { shape: number; scale: number };
  units: 'minutes' | 'feet' | 'entities/hour';
}

export interface UniformDistribution {
  type: 'uniform';
  params: { min: number; max: number };
  units: 'minutes' | 'feet' | 'entities/hour';
}

export interface TriangularDistribution {
  type: 'triangular';
  params: { min: number; mode: number; max: number };
  units: 'minutes' | 'feet' | 'entities/hour';
}

export interface ErlangDistribution {
  type: 'erlang';
  params: { k: number; rate: number };
  units: 'minutes' | 'feet' | 'entities/hour';
}

export interface EmpiricalDistribution {
  type: 'empirical';
  params: { values: number[]; weights?: number[] };
  units: 'minutes' | 'feet' | 'entities/hour';
}

export type Distribution =
  | ConstantDistribution
  | NormalDistribution
  | LognormalDistribution
  | ExponentialDistribution
  | GammaDistribution
  | WeibullDistribution
  | UniformDistribution
  | TriangularDistribution
  | ErlangDistribution
  | EmpiricalDistribution;

// ============================================================================
// ENTITIES
// ============================================================================

export interface EntityAttribute {
  name: string;
  type: 'string' | 'number' | 'boolean';
  defaultValue?: any;
}

export interface Entity {
  id: string;
  batchSize: number;
  class: string;
  attributes: EntityAttribute[];
  priority: number;
}

// ============================================================================
// ARRIVALS
// ============================================================================

export type ArrivalPolicy = 'poisson' | 'schedule_table' | 'empirical' | 'orders';

export interface ArrivalWindow {
  start: string; // HH:MM format
  end: string;   // HH:MM format
  rate: number;
  units: 'entities/hour';
}

export interface ClassMix {
  class: string;
  proportion: number; // 0-1, must sum to 1
}

export interface PoissonArrival {
  policy: 'poisson';
  windows: ArrivalWindow[];
  batch: number;
  class_mix?: ClassMix[];
  calendar_id?: string;
}

export interface ScheduleTableEntry {
  time: number; // minutes from start
  quantity: number;
  class?: string;
}

export interface ScheduleTableArrival {
  policy: 'schedule_table';
  entries: ScheduleTableEntry[];
}

export interface EmpiricalArrival {
  policy: 'empirical';
  interarrival: Distribution;
  class_mix?: ClassMix[];
}

export interface OrdersArrival {
  policy: 'orders';
  orders: Array<{
    time: number;
    quantity: number;
    class: string;
  }>;
}

export type Arrival = PoissonArrival | ScheduleTableArrival | EmpiricalArrival | OrdersArrival;

// ============================================================================
// STATIONS / MACHINES
// ============================================================================

export type StationKind = 'machine' | 'buffer' | 'source' | 'sink' | 'assembly' | 'split';

export type QueueDiscipline = 'FIFO' | 'LIFO' | 'SPT' | 'LPT' | 'EDD' | 'CR' | 'SLACK' | 'PRIORITY';

export type SetupMode = 'none' | 'cadence' | 'class_based' | 'sequence_dependent';

export interface CadenceSetup {
  every_n: number;
  time: Distribution;
}

export interface ClassBasedSetup {
  matrix: Record<string, Record<string, Distribution>>;
}

export interface SequenceDependentSetup {
  matrix: Record<string, Record<string, Distribution>>;
}

export interface Setup {
  mode: SetupMode;
  cadence?: CadenceSetup;
  class_based?: ClassBasedSetup;
  sequence_dependent?: SequenceDependentSetup;
}

export interface Rework {
  probability: number; // 0-1
  to: string; // station id
}

export interface OperatorRequirement {
  pool_id: string;
  required: number;
}

export interface DowntimePattern {
  type: 'time_based' | 'cycle_based';
  mtbf?: Distribution;
  mttr?: Distribution;
  cycles_between_failure?: number;
}

export interface Station {
  id: string;
  kind: StationKind;
  count: number;
  capacity: number;
  queue: QueueDiscipline;
  processTime?: Distribution;
  setup?: Setup;
  downtime?: DowntimePattern;
  rework?: Rework;
  scrap_probability?: number;
  yield?: number; // 0-1
  operators?: OperatorRequirement;
  tools?: OperatorRequirement;
  blocking?: 'transfer' | 'production' | 'none';
  max_queue_length?: number;

  // BOM / Assembly
  bom?: Array<{ entity_id: string; quantity: number }>;
  assembly_time?: Distribution;

  // Split
  split_ratio?: Record<string, number>;
}

// ============================================================================
// ROUTES / TRANSPORTS
// ============================================================================

export type TransportType = 'conveyor' | 'agv' | 'transporter' | 'instant';

export interface ConveyorSegment {
  id: string;
  length_ft: number;
  speed_ftps: number;
  capacity: number;
  spacing_ft: number;
}

export interface ConveyorTransport {
  type: 'conveyor';
  segment: ConveyorSegment;
  policy: 'accumulating' | 'non_accumulating';
}

export interface AGVTransport {
  type: 'agv';
  vehicle_pool_id: string;
  path_id: string;
}

export interface TransporterTransport {
  type: 'transporter';
  transporter_id: string;
}

export interface InstantTransport {
  type: 'instant';
}

export type Transport = ConveyorTransport | AGVTransport | TransporterTransport | InstantTransport;

export interface Route {
  from: string;
  to: string;
  probability: number; // 0-1, all routes from a station must sum to 1
  distance_ft?: number;
  speed_ftps?: number;
  transport?: Transport;
}

// ============================================================================
// RESOURCES / POOLS
// ============================================================================

export type ResourceType = 'operator' | 'tool' | 'vehicle';

export interface Skill {
  name: string;
  level: number; // 1-5
}

export interface ResourcePool {
  id: string;
  type: ResourceType;
  count: number;
  skills?: Skill[];
  home_station?: string;
}

// ============================================================================
// CALENDARS / SHIFTS
// ============================================================================

export interface ShiftBlock {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  start: string; // HH:MM
  end: string;   // HH:MM
}

export interface BreakPeriod {
  offset_min: number; // minutes from shift start
  duration_min: number;
}

export interface Calendar {
  id: string;
  shifts: ShiftBlock[];
  breaks?: BreakPeriod[];
  holidays?: string[]; // YYYY-MM-DD
}

// ============================================================================
// EXPERIMENTS
// ============================================================================

export type ExperimentOperation = 'set' | 'add' | 'multiply';

export interface ExperimentChange {
  op: ExperimentOperation;
  path: string; // JSONPath-like: "stations[id=Placement].count"
  value: any;
}

export type KPI = 'throughput' | 'utilization' | 'cycle_time' | 'queue_length' | 'wip';

export interface Experiment {
  id: string;
  description?: string;
  changes: ExperimentChange[];
  kpis: KPI[];
}

// ============================================================================
// RUN CONFIG
// ============================================================================

export interface RunConfig {
  runLength_min: number;
  warmup_min: number;
  replications: number;
  confidence: 80 | 90 | 95 | 99;
  seed?: number;
}

// ============================================================================
// METADATA
// ============================================================================

export interface Metadata {
  model_id: string;
  version: string;
  created?: string; // ISO timestamp
  description?: string;
  missing?: string[]; // Fields that couldn't be extracted
  assumptions?: string[]; // Assumptions made during parsing
}

// ============================================================================
// MAIN PROCESS GRAPH
// ============================================================================

export interface ProcessGraph {
  entities: Entity[];
  arrivals: Arrival[];
  stations: Station[];
  routes: Route[];
  resources?: ResourcePool[];
  calendars?: Calendar[];
  experiments?: Experiment[];
  runConfig: RunConfig;
  metadata: Metadata;
}

// ============================================================================
// VALIDATION RESULT
// ============================================================================

export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ============================================================================
// PARSER OUTPUT
// ============================================================================

export interface ParserOutput {
  success: boolean;
  processGraph?: ProcessGraph;
  validation?: ValidationResult;
  error?: string;
  repairAttempts?: number;
}
