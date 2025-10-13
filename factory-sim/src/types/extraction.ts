// TypeScript interfaces for Natural Language to DES extraction system

// ============================================================================
// STATISTICAL DISTRIBUTIONS
// ============================================================================

export type DistributionType =
  | 'constant'
  | 'normal'
  | 'exponential'
  | 'uniform'
  | 'triangular'
  | 'lognormal'
  | 'gamma'
  | 'weibull'
  | 'empirical';

export interface Distribution {
  type: DistributionType;
  parameters: {
    // Constant
    value?: number;

    // Normal
    mean?: number;
    stdDev?: number;

    // Exponential
    rate?: number;

    // Uniform
    min?: number;
    max?: number;

    // Triangular
    mode?: number;

    // Lognormal
    mu?: number;
    sigma?: number;

    // Gamma
    shape?: number;
    scale?: number;

    // Weibull
    alpha?: number;
    beta?: number;

    // Empirical
    values?: number[];
    probabilities?: number[];
  };
  unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'items' | 'dimensionless';
}

// ============================================================================
// ENTITY DEFINITIONS
// ============================================================================

export type EntityType =
  | 'customer'
  | 'part'
  | 'vehicle'
  | 'order'
  | 'document'
  | 'call'
  | 'patient'
  | 'custom';

export interface ArrivalSchedule {
  dayOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  timeOfDay?: {
    start: string; // HH:MM format
    end: string;
  };
  rate: number;
  rateUnit: 'per_hour' | 'per_day' | 'per_week';
}

export interface ArrivalPattern {
  type: 'poisson' | 'nonhomogeneous' | 'scheduled' | 'batch' | 'deterministic';
  rate?: number; // For Poisson (arrivals per unit time)
  rateUnit?: 'per_hour' | 'per_day' | 'per_week';
  schedule?: ArrivalSchedule[]; // For non-homogeneous/scheduled
  batchSize?: Distribution; // For batch arrivals
  interarrivalTime?: Distribution; // For deterministic
}

export interface EntityAttribute {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'category';
  defaultValue?: any;
  distribution?: Distribution; // For numeric attributes
  categories?: {
    value: string;
    probability: number;
  }[]; // For categorical attributes
  description?: string;
}

export interface Entity {
  name: string;
  type: EntityType;
  arrivalPattern: ArrivalPattern;
  attributes: EntityAttribute[];
  priority?: {
    attributeName: string; // Which attribute determines priority
    higherIsBetter: boolean;
  };
  maxInSystem?: number; // Balking threshold
  description?: string;
}

// ============================================================================
// RESOURCE DEFINITIONS
// ============================================================================

export type ResourceType =
  | 'server'
  | 'machine'
  | 'worker'
  | 'conveyor'
  | 'path'
  | 'storage'
  | 'vehicle'
  | 'room'
  | 'custom';

export interface FailurePattern {
  type: 'time_based' | 'cycle_based' | 'probability_based';
  mtbf?: Distribution; // Mean time between failures
  mttr?: Distribution; // Mean time to repair
  failureProbability?: number; // Per operation
  cyclesBetweenFailure?: Distribution;
}

export interface WorkSchedule {
  type: 'continuous' | 'shifts' | 'custom';
  shifts?: {
    name: string;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    daysOfWeek: number[]; // 0-6
  }[];
  breaks?: {
    startTime: string;
    duration: number; // minutes
  }[];
  customAvailability?: {
    dayOfWeek: number;
    timeRanges: { start: string; end: string }[];
  }[];
}

export interface Resource {
  name: string;
  type: ResourceType;
  capacity: number;
  processingTime?: Distribution;
  setupTime?: Distribution;
  failures?: FailurePattern;
  schedule?: WorkSchedule;
  speed?: number; // For conveyors, paths (units/time)
  storageCapacity?: number; // For storage resources
  costPerHour?: number; // For economic analysis
  description?: string;
}

// ============================================================================
// PROCESS FLOW DEFINITIONS
// ============================================================================

export type RoutingLogicType =
  | 'sequential' // One path forward
  | 'conditional' // If-then branching
  | 'probabilistic' // Random choice with probabilities
  | 'parallel' // Multiple simultaneous paths
  | 'cyclic'; // Loop back

export interface RoutingCondition {
  type: 'attribute' | 'resource_state' | 'time' | 'queue_length';
  attributeName?: string;
  operator?: '==' | '!=' | '<' | '>' | '<=' | '>=';
  value?: any;
  resourceName?: string;
  resourceState?: 'available' | 'busy' | 'failed';
}

export interface ProcessStep {
  id: string;
  type: 'process' | 'delay' | 'decision' | 'batch' | 'separate' | 'seize' | 'release';
  resourceName?: string; // Which resource performs this step
  duration?: Distribution;
  delayType?: 'fixed' | 'variable';
  batchSize?: number | Distribution;

  // For decision points
  conditions?: {
    condition?: RoutingCondition;
    nextStepId: string;
    probability?: number; // For probabilistic routing
  }[];

  // For attribute changes
  attributeChanges?: {
    attributeName: string;
    operation: 'set' | 'increment' | 'decrement' | 'multiply';
    value: any;
  }[];

  description?: string;
}

export interface Process {
  name: string;
  entityType: string; // Which entities follow this process
  sequence: ProcessStep[];
  routingLogic: RoutingLogicType;
  description?: string;
}

// ============================================================================
// CONSTRAINTS AND RULES
// ============================================================================

export type ConstraintType =
  | 'capacity'
  | 'time_window'
  | 'resource_sharing'
  | 'precedence'
  | 'blocking'
  | 'priority'
  | 'custom';

export interface Constraint {
  type: ConstraintType;
  name: string;

  // Capacity constraints
  maxQueueSize?: number;
  maxSystemSize?: number;
  resourceName?: string;

  // Time window constraints
  windowStart?: string;
  windowEnd?: string;

  // Resource sharing
  sharedResources?: string[];
  sharingRule?: 'exclusive' | 'shared_up_to_capacity' | 'preemptive';

  // Precedence
  beforeTask?: string;
  afterTask?: string;

  // Blocking
  blockingType?: 'transfer_blocking' | 'production_blocking';

  // Priority rules
  priorityRule?: 'FIFO' | 'LIFO' | 'SPT' | 'LPT' | 'EDD' | 'attribute_based';
  priorityAttribute?: string;

  description?: string;
}

// ============================================================================
// SPATIAL LAYOUT
// ============================================================================

export interface SpatialLocation {
  x: number;
  y: number;
  z?: number;
}

export interface SpatialLayout {
  resources: {
    resourceName: string;
    location: SpatialLocation;
  }[];

  connections: {
    from: string;
    to: string;
    distance?: number;
    distanceUnit?: 'feet' | 'meters' | 'miles';
    travelTime?: Distribution;
    bidirectional?: boolean;
  }[];

  defaultTravelSpeed?: number;
  speedUnit?: 'feet_per_second' | 'meters_per_second' | 'mph';
}

// ============================================================================
// OBJECTIVES AND METRICS
// ============================================================================

export interface Objective {
  name: string;
  metric:
    | 'throughput'
    | 'cycle_time'
    | 'wait_time'
    | 'queue_length'
    | 'utilization'
    | 'cost'
    | 'service_level'
    | 'custom';

  targetType: 'minimize' | 'maximize' | 'target_value';
  targetValue?: number;

  // Which entity/resource to measure
  entityType?: string;
  resourceName?: string;

  // For percentile-based metrics
  percentile?: number; // e.g., 95 for 95th percentile

  description?: string;
}

// ============================================================================
// EXPERIMENTS
// ============================================================================

export interface ExperimentParameter {
  name: string;
  type: 'entity_arrival_rate' | 'resource_capacity' | 'processing_time' | 'custom';
  entityName?: string;
  resourceName?: string;
  processStepId?: string;

  baselineValue: any;
  testValues: any[];

  description?: string;
}

export interface Experiment {
  name: string;
  description: string;
  scenario: 'what_if' | 'optimization' | 'sensitivity';

  parameters: ExperimentParameter[];

  // For optimization
  optimizationObjective?: string; // Reference to Objective name

  // Simulation settings
  warmupPeriod?: number;
  warmupUnit?: 'hours' | 'days' | 'weeks';
  runLength?: number;
  runLengthUnit?: 'hours' | 'days' | 'weeks';
  replications?: number;
}

// ============================================================================
// MISSING INFORMATION TRACKING
// ============================================================================

export interface MissingInformation {
  category: 'entity' | 'resource' | 'process' | 'distribution' | 'constraint' | 'objective';
  severity: 'critical' | 'important' | 'minor';
  description: string;
  suggestedDefault?: any;
  affectedElements: string[]; // Names of entities/resources affected
}

export interface Assumption {
  description: string;
  category: 'distribution' | 'routing' | 'schedule' | 'capacity' | 'other';
  rationale: string;
  affectedElements: string[];
}

// ============================================================================
// MAIN EXTRACTED SYSTEM
// ============================================================================

export interface ExtractedSystem {
  systemType: 'service' | 'manufacturing' | 'logistics' | 'healthcare' | 'custom';
  systemName: string;
  description: string;

  entities: Entity[];
  resources: Resource[];
  processes: Process[];
  constraints: Constraint[];
  spatialLayout?: SpatialLayout;
  objectives: Objective[];
  experiments: Experiment[];

  // Metadata about extraction quality
  missingInformation: MissingInformation[];
  assumptions: Assumption[];

  // Document metadata
  sourceDocument?: {
    name: string;
    type: 'pdf' | 'word' | 'text' | 'url';
    extractedAt: string; // ISO timestamp
  };

  extractionConfidence?: {
    overall: number; // 0-1
    entities: number;
    resources: number;
    processes: number;
  };
}

// ============================================================================
// DOCUMENT PARSING
// ============================================================================

export interface DocumentParseResult {
  success: boolean;
  content?: string;
  error?: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    hasImages?: boolean;
    hasTables?: boolean;
  };
}

export interface ExtractionResult {
  success: boolean;
  system?: ExtractedSystem;
  error?: string;
  warnings?: string[];

  // Token usage for cost tracking
  tokensUsed?: {
    input: number;
    output: number;
  };
}
