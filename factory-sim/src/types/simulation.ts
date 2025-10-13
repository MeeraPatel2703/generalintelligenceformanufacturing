// Simulation type definitions for Discrete Event Simulation

export type MachineType = 'CNC' | 'Assembly' | 'QualityControl' | 'Storage';
export type MachineState = 'idle' | 'busy' | 'blocked' | 'down';
export type EventType = 'ARRIVAL' | 'START_PROCESSING' | 'END_PROCESSING' | 'BREAKDOWN' | 'REPAIR' | 'END_SIMULATION';
export type DistributionType = 'normal' | 'exponential' | 'triangular' | 'constant';

export interface ProcessTimeConfig {
  distribution: DistributionType;
  mean: number;
  stdDev?: number;
  min?: number;
  max?: number;
  mode?: number;
}

export interface MachineConfig {
  id: string;
  type: MachineType;
  processTime: ProcessTimeConfig;
  setupTime?: ProcessTimeConfig;
  capacity: number;
  mtbf?: number; // mean time between failures
  mttr?: number; // mean time to repair
}

export interface SimulationConfig {
  machines: MachineConfig[];
  flowSequence: string[];
  arrivalRate: number; // parts per minute
  simulationTime: number; // minutes
  warmupTime: number; // minutes
  numReplications: number;
  baseSeed: number;
}

export interface SimulationEvent {
  time: number;
  type: EventType;
  machineId?: string;
  partId?: string;
  data?: any;
}

export interface Part {
  id: string;
  arrivalTime: number;
  startTimes: Map<string, number>;
  endTimes: Map<string, number>;
}

export interface StatisticResult {
  mean: number;
  stdDev: number;
  confidenceInterval: number;
  min: number;
  max: number;
}

export interface MachineResults {
  id: string;
  utilization: StatisticResult;
  partsProcessed: StatisticResult;
  averageQueue: StatisticResult;
  blockedTimePercent: StatisticResult;
  idleTimePercent: StatisticResult;
}

export interface BottleneckAnalysis {
  machineId: string;
  utilization: number;
  averageQueue: number;
  blockedTimePercent: number;
  lostThroughput: number;
  severity: 'low' | 'medium' | 'high';
  reason: string;
}

export interface QueueDataPoint {
  time: number;
  machineId: string;
  queueLength: number;
}

export interface SimulationResults {
  throughput: StatisticResult;
  cycleTime: StatisticResult;
  valueAddTime: StatisticResult;
  waitTime: StatisticResult;
  wipLevel: StatisticResult;
  bottleneck: BottleneckAnalysis;
  machines: MachineResults[];
  queueHistory?: QueueDataPoint[];
  completionTime: number;
  replicationsCompleted: number;
}

export interface ReplicationResult {
  replicationNumber: number;
  throughput: number;
  cycleTime: number;
  valueAddTime: number;
  waitTime: number;
  wipLevel: number;
  machineUtilization: Record<string, number>;
  machineQueues: Record<string, number>;
  machineBlocked: Record<string, number>;
  machinePartsProcessed: Record<string, number>;
}

export interface SimulationProgress {
  currentReplication: number;
  totalReplications: number;
  percentComplete: number;
  estimatedTimeRemaining: number;
  message: string;
}
