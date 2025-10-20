/**
 * Chatbot Types
 * Type definitions for the AI chatbot system
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    isError?: boolean;
    category?: string;
    functionCall?: FunctionCall;
    functionResult?: any;
  };
}

export interface FunctionCall {
  name: string;
  parameters: Record<string, any>;
}

export interface QueryResult {
  metrics: string[];
  data: Record<string, any>[];
  summary?: {
    count: number;
    mean: number;
    min: number;
    max: number;
  };
}

export interface ComparisonResult {
  scenarios: ScenarioComparison[];
  winner?: {
    scenarioId: string;
    metric: string;
    value: number;
  };
}

export interface ScenarioComparison {
  id: string;
  name: string;
  metrics: Record<string, number>;
}

export interface BottleneckAnalysis {
  primaryBottleneck: string;
  bottlenecks: BottleneckDetail[];
}

export interface BottleneckDetail {
  resourceId: string;
  utilization: number;
  queueLength: number;
  impactScore: number;
  recommendations: string[];
}

export interface ChatbotState {
  isActive: boolean;
  currentSession: string;
  messageHistory: ChatMessage[];
  context: {
    system?: any;
    currentResults?: any;
    lastScenario?: any;
  };
}

export interface ChatbotResponse {
  message: string;
  functionCall?: FunctionCall;
  functionResult?: any;
  error?: string;
}

export interface QuestionTemplate {
  id: string;
  text: string;
  description: string;
  category: string;
  isAdvanced?: boolean;
}

export interface QuestionCategory {
  id: string;
  title: string;
  icon: string;
  questions: QuestionTemplate[];
}

// Function call types
export interface SimulationFunction {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

// Function argument types
export interface QuerySimulationDataArgs {
  metrics: string[];
  filters?: Record<string, any>;
}

export interface RunScenarioArgs {
  parameters: Record<string, any>;
  scenarioName?: string;
}

export interface CompareScenarioArgs {
  scenarioIds: string[];
  metrics: string[];
  showDifference?: boolean;
}

export interface GetStatisticsArgs {
  metric: string;
  timeRange?: {
    start: number;
    end: number;
  };
  statisticType?: string;
}

export interface AnalyzeBottleneckArgs {
  resourceId?: string;
  includeRecommendations?: boolean;
  threshold?: number;
}

export interface OptimizeParametersArgs {
  objective: string;
  parameters: string[];
  constraints?: Record<string, any>;
}

// Result types
export interface OptimizationResult {
  bestParameters: Record<string, number>;
  bestFitness: number;
  iterations: number;
  convergence: boolean;
  optimizedParameters?: Record<string, number>;
  projectedImprovement?: number;
  confidence?: number;
  convergenceStatus?: string;
}

// Extended result types
export interface ExtendedComparisonResult extends ComparisonResult {
  differences?: Record<string, number>;
}

export interface ExtendedBottleneckAnalysis extends BottleneckAnalysis {
  secondaryBottlenecks?: string[];
}