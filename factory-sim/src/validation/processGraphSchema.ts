// Comprehensive Zod validation schema for ProcessGraph
// Enforces all DES rules, normalization, and validation from the Master Parser spec

import { z } from 'zod';

// ============================================================================
// DISTRIBUTIONS
// ============================================================================

const DistributionUnits = z.enum(['minutes', 'feet', 'entities/hour']);

const ConstantDistributionSchema = z.object({
  type: z.literal('constant'),
  params: z.object({
    value: z.number()
  }),
  units: DistributionUnits
});

const NormalDistributionSchema = z.object({
  type: z.literal('normal'),
  params: z.object({
    mean: z.number(),
    stdev: z.number().positive('stdev must be > 0')
  }),
  units: DistributionUnits
});

const LognormalDistributionSchema = z.object({
  type: z.literal('lognormal'),
  params: z.object({
    mu: z.number(),
    sigma: z.number().positive('sigma must be > 0')
  }),
  units: DistributionUnits
});

const ExponentialDistributionSchema = z.object({
  type: z.literal('exponential'),
  params: z.object({
    mean: z.number().positive('mean must be > 0')
  }),
  units: DistributionUnits
});

const GammaDistributionSchema = z.object({
  type: z.literal('gamma'),
  params: z.object({
    shape: z.number().positive('shape must be > 0'),
    scale: z.number().positive('scale must be > 0')
  }),
  units: DistributionUnits
});

const WeibullDistributionSchema = z.object({
  type: z.literal('weibull'),
  params: z.object({
    shape: z.number().positive('shape must be > 0'),
    scale: z.number().positive('scale must be > 0')
  }),
  units: DistributionUnits
});

const UniformDistributionSchema = z.object({
  type: z.literal('uniform'),
  params: z.object({
    min: z.number(),
    max: z.number()
  }).refine(data => data.min <= data.max, {
    message: 'min must be <= max'
  }),
  units: DistributionUnits
});

const TriangularDistributionSchema = z.object({
  type: z.literal('triangular'),
  params: z.object({
    min: z.number(),
    mode: z.number(),
    max: z.number()
  }).refine(data => data.min <= data.mode && data.mode <= data.max, {
    message: 'must satisfy: min <= mode <= max'
  }),
  units: DistributionUnits
});

const ErlangDistributionSchema = z.object({
  type: z.literal('erlang'),
  params: z.object({
    k: z.number().int().min(1, 'k must be >= 1'),
    rate: z.number().positive('rate must be > 0')
  }),
  units: DistributionUnits
});

const EmpiricalDistributionSchema = z.object({
  type: z.literal('empirical'),
  params: z.object({
    values: z.array(z.number()).min(1, 'must have at least one value'),
    weights: z.array(z.number().nonnegative()).optional()
  }).refine(data => {
    if (!data.weights) return true;
    return data.weights.length === data.values.length;
  }, {
    message: 'weights array must match values array length'
  }),
  units: DistributionUnits
});

export const DistributionSchema = z.discriminatedUnion('type', [
  ConstantDistributionSchema,
  NormalDistributionSchema,
  LognormalDistributionSchema,
  ExponentialDistributionSchema,
  GammaDistributionSchema,
  WeibullDistributionSchema,
  UniformDistributionSchema,
  TriangularDistributionSchema,
  ErlangDistributionSchema,
  EmpiricalDistributionSchema
]);

// ============================================================================
// ENTITIES
// ============================================================================

const EntityAttributeSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean']),
  defaultValue: z.any().optional()
});

const EntitySchema = z.object({
  id: z.string().min(1),
  batchSize: z.number().int().positive(),
  class: z.string().min(1),
  attributes: z.array(EntityAttributeSchema),
  priority: z.number().int().nonnegative()
});

// ============================================================================
// ARRIVALS
// ============================================================================

const TimePattern = z.string().regex(/^\d{2}:\d{2}$/, 'must be HH:MM format');

const ArrivalWindowSchema = z.object({
  start: TimePattern,
  end: TimePattern,
  rate: z.number().positive(),
  units: z.literal('entities/hour')
}).refine(data => data.start < data.end, {
  message: 'start time must be before end time'
});

const ClassMixSchema = z.object({
  class: z.string().min(1),
  proportion: z.number().min(0).max(1)
});

const PoissonArrivalSchema = z.object({
  policy: z.literal('poisson'),
  windows: z.array(ArrivalWindowSchema).min(1),
  batch: z.number().int().positive(),
  class_mix: z.array(ClassMixSchema).optional(),
  calendar_id: z.string().optional()
}).refine(data => {
  if (!data.class_mix) return true;
  const sum = data.class_mix.reduce((acc, c) => acc + c.proportion, 0);
  return Math.abs(sum - 1.0) < 1e-6;
}, {
  message: 'class_mix proportions must sum to 1.0'
});

const ScheduleTableEntrySchema = z.object({
  time: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  class: z.string().optional()
});

const ScheduleTableArrivalSchema = z.object({
  policy: z.literal('schedule_table'),
  entries: z.array(ScheduleTableEntrySchema).min(1)
});

const EmpiricalArrivalSchema = z.object({
  policy: z.literal('empirical'),
  interarrival: DistributionSchema,
  class_mix: z.array(ClassMixSchema).optional()
});

const OrdersArrivalSchema = z.object({
  policy: z.literal('orders'),
  orders: z.array(z.object({
    time: z.number().nonnegative(),
    quantity: z.number().int().positive(),
    class: z.string().min(1)
  })).min(1)
});

const ArrivalSchema = z.discriminatedUnion('policy', [
  PoissonArrivalSchema,
  ScheduleTableArrivalSchema,
  EmpiricalArrivalSchema,
  OrdersArrivalSchema
]);

// ============================================================================
// STATIONS
// ============================================================================

const StationKindSchema = z.enum(['machine', 'buffer', 'source', 'sink', 'assembly', 'split']);
const QueueDisciplineSchema = z.enum(['FIFO', 'LIFO', 'SPT', 'LPT', 'EDD', 'CR', 'SLACK', 'PRIORITY']);

const CadenceSetupSchema = z.object({
  every_n: z.number().int().positive(),
  time: DistributionSchema
});

const ClassBasedSetupSchema = z.object({
  matrix: z.record(z.string(), z.record(z.string(), DistributionSchema))
});

const SequenceDependentSetupSchema = z.object({
  matrix: z.record(z.string(), z.record(z.string(), DistributionSchema))
});

const SetupSchema = z.object({
  mode: z.enum(['none', 'cadence', 'class_based', 'sequence_dependent']),
  cadence: CadenceSetupSchema.optional(),
  class_based: ClassBasedSetupSchema.optional(),
  sequence_dependent: SequenceDependentSetupSchema.optional()
});

const ReworkSchema = z.object({
  probability: z.number().min(0).max(1),
  to: z.string().min(1)
});

const OperatorRequirementSchema = z.object({
  pool_id: z.string().min(1),
  required: z.number().int().positive()
});

const DowntimePatternSchema = z.object({
  type: z.enum(['time_based', 'cycle_based']),
  mtbf: DistributionSchema.optional(),
  mttr: DistributionSchema.optional(),
  cycles_between_failure: z.number().int().positive().optional()
});

const StationSchema = z.object({
  id: z.string().min(1),
  kind: StationKindSchema,
  count: z.number().int().min(1),
  capacity: z.number().int().min(1),
  queue: QueueDisciplineSchema,
  processTime: DistributionSchema.optional(),
  setup: SetupSchema.optional(),
  downtime: DowntimePatternSchema.optional(),
  rework: ReworkSchema.optional(),
  scrap_probability: z.number().min(0).max(1).optional(),
  yield: z.number().min(0).max(1).optional(),
  operators: OperatorRequirementSchema.optional(),
  tools: OperatorRequirementSchema.optional(),
  blocking: z.enum(['transfer', 'production', 'none']).optional(),
  max_queue_length: z.number().int().positive().optional(),
  bom: z.array(z.object({
    entity_id: z.string().min(1),
    quantity: z.number().int().positive()
  })).optional(),
  assembly_time: DistributionSchema.optional(),
  split_ratio: z.record(z.string(), z.number().positive()).optional()
});

// ============================================================================
// ROUTES
// ============================================================================

const ConveyorSegmentSchema = z.object({
  id: z.string().min(1),
  length_ft: z.number().positive(),
  speed_ftps: z.number().positive(),
  capacity: z.number().int().positive(),
  spacing_ft: z.number().positive()
});

const ConveyorTransportSchema = z.object({
  type: z.literal('conveyor'),
  segment: ConveyorSegmentSchema,
  policy: z.enum(['accumulating', 'non_accumulating'])
});

const AGVTransportSchema = z.object({
  type: z.literal('agv'),
  vehicle_pool_id: z.string().min(1),
  path_id: z.string().min(1)
});

const TransporterTransportSchema = z.object({
  type: z.literal('transporter'),
  transporter_id: z.string().min(1)
});

const InstantTransportSchema = z.object({
  type: z.literal('instant')
});

const TransportSchema = z.discriminatedUnion('type', [
  ConveyorTransportSchema,
  AGVTransportSchema,
  TransporterTransportSchema,
  InstantTransportSchema
]);

const RouteSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  probability: z.number().min(0).max(1),
  distance_ft: z.number().nonnegative().optional(),
  speed_ftps: z.number().positive().optional(),
  transport: TransportSchema.optional()
});

// ============================================================================
// RESOURCES
// ============================================================================

const SkillSchema = z.object({
  name: z.string().min(1),
  level: z.number().int().min(1).max(5)
});

const ResourcePoolSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['operator', 'tool', 'vehicle']),
  count: z.number().int().positive(),
  skills: z.array(SkillSchema).optional(),
  home_station: z.string().optional()
});

// ============================================================================
// CALENDARS
// ============================================================================

const ShiftBlockSchema = z.object({
  day: z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
  start: TimePattern,
  end: TimePattern
});

const BreakPeriodSchema = z.object({
  offset_min: z.number().int().nonnegative(),
  duration_min: z.number().int().positive()
});

const CalendarSchema = z.object({
  id: z.string().min(1),
  shifts: z.array(ShiftBlockSchema).min(1),
  breaks: z.array(BreakPeriodSchema).optional(),
  holidays: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')).optional()
});

// ============================================================================
// EXPERIMENTS
// ============================================================================

const ExperimentChangeSchema = z.object({
  op: z.enum(['set', 'add', 'multiply']),
  path: z.string().min(1),
  value: z.any()
});

const KPISchema = z.enum(['throughput', 'utilization', 'cycle_time', 'queue_length', 'wip']);

const ExperimentSchema = z.object({
  id: z.string().min(1),
  description: z.string().optional(),
  changes: z.array(ExperimentChangeSchema).min(1),
  kpis: z.array(KPISchema).min(1)
});

// ============================================================================
// RUN CONFIG
// ============================================================================

const RunConfigSchema = z.object({
  runLength_min: z.number().positive(),
  warmup_min: z.number().nonnegative(),
  replications: z.number().int().min(1),
  confidence: z.enum([80, 90, 95, 99]),
  seed: z.number().int().optional()
}).refine(data => data.warmup_min < data.runLength_min, {
  message: 'warmup_min must be < runLength_min'
});

// ============================================================================
// METADATA
// ============================================================================

const MetadataSchema = z.object({
  model_id: z.string().min(1),
  version: z.string().min(1),
  created: z.string().optional(),
  description: z.string().optional(),
  missing: z.array(z.string()).optional(),
  assumptions: z.array(z.string()).optional()
});

// ============================================================================
// MAIN PROCESS GRAPH
// ============================================================================

export const ProcessGraphSchema = z.object({
  entities: z.array(EntitySchema),
  arrivals: z.array(ArrivalSchema),
  stations: z.array(StationSchema).min(1),
  routes: z.array(RouteSchema),
  resources: z.array(ResourcePoolSchema).optional(),
  calendars: z.array(CalendarSchema).optional(),
  experiments: z.array(ExperimentSchema).optional(),
  runConfig: RunConfigSchema,
  metadata: MetadataSchema
}).superRefine((data, ctx) => {
  // Validate route connectivity
  const stationIds = new Set(data.stations.map(s => s.id));

  for (const route of data.routes) {
    if (!stationIds.has(route.from)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Route 'from' station '${route.from}' does not exist`,
        path: ['routes']
      });
    }
    if (!stationIds.has(route.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Route 'to' station '${route.to}' does not exist`,
        path: ['routes']
      });
    }
  }

  // Validate branch probabilities sum to ~1.0
  const routesByFrom = new Map<string, number>();
  for (const route of data.routes) {
    const current = routesByFrom.get(route.from) || 0;
    routesByFrom.set(route.from, current + route.probability);
  }

  for (const [from, totalProb] of routesByFrom.entries()) {
    if (Math.abs(totalProb - 1.0) > 1e-6 && totalProb !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Routes from '${from}' have probabilities summing to ${totalProb}, expected 1.0`,
        path: ['routes']
      });
    }
  }

  // Validate rework targets exist
  for (const station of data.stations) {
    if (station.rework && !stationIds.has(station.rework.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Rework target '${station.rework.to}' for station '${station.id}' does not exist`,
        path: ['stations']
      });
    }
  }

  // Validate resource pool references
  const poolIds = new Set((data.resources || []).map(r => r.id));

  for (const station of data.stations) {
    if (station.operators && !poolIds.has(station.operators.pool_id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Operator pool '${station.operators.pool_id}' for station '${station.id}' does not exist`,
        path: ['stations']
      });
    }
    if (station.tools && !poolIds.has(station.tools.pool_id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Tool pool '${station.tools.pool_id}' for station '${station.id}' does not exist`,
        path: ['stations']
      });
    }
  }

  // Validate calendar references
  const calendarIds = new Set((data.calendars || []).map(c => c.id));

  for (const arrival of data.arrivals) {
    if (arrival.policy === 'poisson' && arrival.calendar_id && !calendarIds.has(arrival.calendar_id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Calendar '${arrival.calendar_id}' referenced in arrival does not exist`,
        path: ['arrivals']
      });
    }
  }
});

// ============================================================================
// VALIDATION HELPERS
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

export function validateProcessGraph(graph: unknown): ValidationResult {
  const result = ProcessGraphSchema.safeParse(graph);

  if (result.success) {
    return {
      valid: true,
      errors: [],
      warnings: []
    };
  }

  const errors: ValidationError[] = result.error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message,
    severity: 'error' as const
  }));

  return {
    valid: false,
    errors,
    warnings: []
  };
}

export function parseProcessGraph(data: unknown) {
  return ProcessGraphSchema.parse(data);
}

export function safeParseProcessGraph(data: unknown) {
  return ProcessGraphSchema.safeParse(data);
}
