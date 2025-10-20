/**
 * CHATBOT SERVICE
 * OpenAI-powered NLP service for simulation queries and scenario running
 */

import OpenAI from 'openai';
import {
  ChatMessage,
  SimulationFunction,
  QuerySimulationDataArgs,
  RunScenarioArgs,
  CompareScenarioArgs,
  GetStatisticsArgs,
  AnalyzeBottleneckArgs,
  OptimizeParametersArgs,
  QueryResult,
  ComparisonResult,
  BottleneckAnalysis,
  OptimizationResult,
  ExtendedComparisonResult,
  ExtendedBottleneckAnalysis,
} from '../src/types/chatbot';
import { ExtractedSystem } from '../src/types/extraction';
import { ComprehensiveSimulationResults } from '../src/types/simulation';

// ============================================================================
// OPENAI CLIENT
// ============================================================================

let openai: OpenAI | null = null;

export function initializeChatbot(apiKey: string) {
  openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: false, // We're in Node.js (Electron main process)
  });
  console.log('[ChatbotService] OpenAI client initialized');
}

// ============================================================================
// FUNCTION DEFINITIONS
// ============================================================================

const SIMULATION_FUNCTIONS: SimulationFunction[] = [
  {
    name: 'querySimulationData',
    description: 'Query simulation data with filters and aggregations. Use this to answer questions about existing simulation results.',
    parameters: {
      type: 'object',
      properties: {
        filters: {
          type: 'object',
          properties: {
            scenarioId: { type: 'string', description: 'Scenario ID to filter by' },
            resourceId: { type: 'string', description: 'Resource ID to filter by' },
            timeRange: {
              type: 'object',
              properties: {
                start: { type: 'number', description: 'Start time in minutes' },
                end: { type: 'number', description: 'End time in minutes' },
              },
            },
          },
        },
        metrics: {
          type: 'array',
          items: { type: 'string' },
          description: 'Metrics to query: throughput, utilization, cycleTime, queueLength, waitTime',
        },
        aggregation: {
          type: 'string',
          enum: ['mean', 'min', 'max', 'sum', 'count'],
          description: 'Aggregation function',
        },
      },
      required: ['metrics'],
    },
  },
  {
    name: 'runScenario',
    description: 'Run a new simulation scenario with specified parameters. Use this when user wants to test changes.',
    parameters: {
      type: 'object',
      properties: {
        scenarioName: { type: 'string', description: 'Name for this scenario' },
        parameters: {
          type: 'object',
          properties: {
            resourceCapacities: {
              type: 'object',
              description: 'Resource capacities as key-value pairs, e.g., {"Machine1": 2, "Machine2": 3}',
            },
            arrivalRate: { type: 'number', description: 'Arrival rate (entities per hour)' },
            processingTimes: {
              type: 'object',
              description: 'Processing times for resources (minutes)',
            },
            duration: { type: 'number', description: 'Simulation duration in minutes (default 2880)' },
            replications: { type: 'number', description: 'Number of replications (default 30)' },
          },
        },
        description: { type: 'string', description: 'Description of what this scenario tests' },
      },
      required: ['parameters'],
    },
  },
  {
    name: 'compareScenarios',
    description: 'Compare multiple scenarios side-by-side. Use when user wants to compare results.',
    parameters: {
      type: 'object',
      properties: {
        scenarioIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs of scenarios to compare',
        },
        metrics: {
          type: 'array',
          items: { type: 'string' },
          description: 'Metrics to compare',
        },
        showDifference: { type: 'boolean', description: 'Show percentage differences' },
      },
      required: ['scenarioIds', 'metrics'],
    },
  },
  {
    name: 'getStatistics',
    description: 'Get detailed statistics for a specific metric. Use for statistical analysis requests.',
    parameters: {
      type: 'object',
      properties: {
        metric: { type: 'string', description: 'Metric to analyze' },
        groupBy: {
          type: 'string',
          enum: ['resource', 'entityType', 'timeInterval'],
          description: 'How to group the statistics',
        },
        timeInterval: { type: 'number', description: 'Time interval for grouping (minutes)' },
        statisticType: {
          type: 'string',
          enum: ['mean', 'median', 'stddev', 'percentile', 'histogram'],
          description: 'Type of statistic to compute',
        },
        percentile: { type: 'number', description: 'Percentile value (0-100) if statisticType is percentile' },
      },
      required: ['metric'],
    },
  },
  {
    name: 'analyzeBottleneck',
    description: 'Analyze bottlenecks in the simulation. Use when user asks about bottlenecks or performance issues.',
    parameters: {
      type: 'object',
      properties: {
        scenarioId: { type: 'string', description: 'Scenario to analyze (optional, defaults to current)' },
        threshold: { type: 'number', description: 'Utilization threshold for bottleneck detection (default 0.85)' },
      },
      required: [],
    },
  },
  {
    name: 'optimizeParameters',
    description: 'Optimize simulation parameters to achieve an objective. Use when user wants optimization.',
    parameters: {
      type: 'object',
      properties: {
        objective: {
          type: 'string',
          enum: ['maximize_throughput', 'minimize_cycle_time', 'minimize_cost', 'maximize_utilization'],
          description: 'Optimization objective',
        },
        constraints: {
          type: 'object',
          properties: {
            maxResourceCapacity: { type: 'object', description: 'Max capacity per resource' },
            maxCost: { type: 'number', description: 'Maximum cost constraint' },
            minThroughput: { type: 'number', description: 'Minimum throughput requirement' },
          },
        },
        parameters: {
          type: 'array',
          items: { type: 'string' },
          description: 'Parameters to optimize',
        },
      },
      required: ['objective', 'parameters'],
    },
  },
];

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are an expert simulation analyst assistant for a Discrete Event Simulation (DES) platform.

Your role is to help users:
1. Query simulation data and results
2. Run new scenarios with different parameters
3. Compare multiple scenarios
4. Analyze bottlenecks and performance issues
5. Optimize parameters for specific objectives
6. Provide insights and recommendations

When users ask questions:
- Be concise and direct
- Use function calls to retrieve data or run simulations
- Provide context and explanations
- Format numbers clearly (e.g., "12.45 parts/hour", "85.3% utilization")
- Highlight important findings with emphasis
- Suggest next steps or follow-up questions

When presenting results:
- Use bullet points for lists
- Bold important metrics: **Throughput: 45.2/hr**
- Explain what the numbers mean in practical terms
- Compare to targets or benchmarks when available

Available metrics:
- **throughput**: Parts/entities completed per hour
- **cycleTime**: Average time an entity spends in the system (minutes)
- **utilization**: Resource busy time / total time (0-1)
- **queueLength**: Average number of entities waiting
- **waitTime**: Average time entities spend waiting (minutes)
- **WIP**: Work-in-process, entities currently in system

Remember: You're helping engineers make data-driven decisions. Be accurate, helpful, and actionable.`;

// ============================================================================
// CHATBOT MESSAGE HANDLER
// ============================================================================

interface ChatbotRequest {
  message: string;
  system: ExtractedSystem;
  currentResults?: ComprehensiveSimulationResults;
  conversationHistory: ChatMessage[];
}

interface ChatbotResponse {
  message: string;
  functionCall?: { name: string; arguments: any };
  functionResult?: any;
  error?: string;
}

// Store for scenarios (in-memory, could be persisted to DB)
const scenarioStore = new Map<string, { parameters: any; results?: ComprehensiveSimulationResults }>();

export async function handleChatbotMessage(request: ChatbotRequest): Promise<ChatbotResponse> {
  if (!openai) {
    return {
      message: '',
      error: 'Chatbot not initialized. Please set your OpenAI API key in settings.',
    };
  }

  try {
    // Build messages for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Add conversation history (last 10 messages)
    request.conversationHistory.slice(-10).forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    });

    // Add current user message
    messages.push({
      role: 'user',
      content: request.message,
    });

    // Call OpenAI with function calling
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      functions: SIMULATION_FUNCTIONS as any,
      function_call: 'auto',
      temperature: 0.7,
      max_tokens: 1000,
    });

    const choice = completion.choices[0];

    // Check if function call was made
    if (choice.message.function_call) {
      const functionName = choice.message.function_call.name;
      const functionArgs = JSON.parse(choice.message.function_call.arguments);

      console.log(`[ChatbotService] Function call: ${functionName}`, functionArgs);

      // Execute the function
      const functionResult = await executeFunction(
        functionName,
        functionArgs,
        request.system,
        request.currentResults
      );

      // Get follow-up response from OpenAI with function result
      const followUpMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        ...messages,
        {
          role: 'assistant',
          content: choice.message.content || null,
          function_call: choice.message.function_call as any,
        },
        {
          role: 'function',
          name: functionName,
          content: JSON.stringify(functionResult),
        },
      ];

      const followUpCompletion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: followUpMessages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      return {
        message: followUpCompletion.choices[0].message.content || 'No response',
        functionCall: { name: functionName, arguments: functionArgs },
        functionResult,
      };
    }

    // No function call, return direct response
    return {
      message: choice.message.content || 'No response',
    };

  } catch (error) {
    console.error('[ChatbotService] Error:', error);
    return {
      message: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// FUNCTION EXECUTION
// ============================================================================

async function executeFunction(
  name: string,
  args: any,
  system: ExtractedSystem,
  currentResults?: ComprehensiveSimulationResults
): Promise<any> {
  switch (name) {
    case 'querySimulationData':
      return querySimulationData(args, system, currentResults);
    case 'runScenario':
      return runScenario(args, system);
    case 'compareScenarios':
      return compareScenarios(args);
    case 'getStatistics':
      return getStatistics(args, currentResults);
    case 'analyzeBottleneck':
      return analyzeBottleneck(args, system, currentResults);
    case 'optimizeParameters':
      return optimizeParameters(args, system);
    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

// ============================================================================
// FUNCTION IMPLEMENTATIONS
// ============================================================================

function querySimulationData(
  args: QuerySimulationDataArgs,
  _system: ExtractedSystem,
  currentResults?: ComprehensiveSimulationResults
): QueryResult {
  console.log('[ChatbotService] querySimulationData', args);

  if (!currentResults) {
    return {
      data: [],
      metrics: args.metrics,
      summary: { count: 0, mean: 0, min: 0, max: 0 },
    };
  }

  // Extract requested metrics from current results
  const data: any[] = [];

  args.metrics.forEach((metric: string) => {
    const metricData: any = { metric };

    switch (metric) {
      case 'throughput':
        metricData.value = currentResults.throughput.mean;
        if (Array.isArray(currentResults.throughput.confidenceInterval)) {
          metricData.ci = `[${currentResults.throughput.confidenceInterval[0].toFixed(2)}, ${currentResults.throughput.confidenceInterval[1].toFixed(2)}]`;
        }
        break;
      case 'cycleTime':
        metricData.value = currentResults.cycleTime.mean;
        if (Array.isArray(currentResults.cycleTime.confidenceInterval)) {
          metricData.ci = `[${currentResults.cycleTime.confidenceInterval[0].toFixed(2)}, ${currentResults.cycleTime.confidenceInterval[1].toFixed(2)}]`;
        }
        break;
      case 'utilization':
        // Average utilization across all resources
        const resourceMetrics = (currentResults as any).resourceMetrics;
        if (resourceMetrics) {
          const resources = Object.values(resourceMetrics) as any[];
          const avgUtil = resources.reduce((sum, r) => sum + r.utilization.mean, 0) / resources.length;
          metricData.value = avgUtil;
        }
        break;
      case 'queueLength':
        const resourceMetrics2 = (currentResults as any).resourceMetrics;
        if (resourceMetrics2) {
          const resources = Object.values(resourceMetrics2) as any[];
          const avgQueue = resources.reduce((sum, r) => sum + r.queueLength.mean, 0) / resources.length;
          metricData.value = avgQueue;
        }
        break;
      case 'WIP':
        metricData.value = (currentResults as any).workInProgress?.mean || 0;
        break;
    }

    data.push(metricData);
  });

  // Compute summary statistics
  const values = data.map(d => d.value).filter(v => typeof v === 'number');
  const summary = {
    count: values.length,
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  };

  return { data, metrics: args.metrics, summary };
}

async function runScenario(
  args: RunScenarioArgs,
  system: ExtractedSystem
): Promise<{ scenarioId: string; results: ComprehensiveSimulationResults }> {
  console.log('[ChatbotService] runScenario', args);

  // Create modified system with new parameters
  const modifiedSystem: ExtractedSystem = JSON.parse(JSON.stringify(system));

  // Apply resource capacity changes
  if (args.parameters.resourceCapacities) {
    Object.entries(args.parameters.resourceCapacities).forEach(([resourceId, capacity]) => {
      const resource = modifiedSystem.resources.find(r => r.name === resourceId);
      if (resource) {
        resource.capacity = Number(capacity);
      }
    });
  }

  // Apply arrival rate changes
  if (args.parameters.arrivalRate !== undefined) {
    modifiedSystem.entities.forEach(entity => {
      if (entity.arrivalPattern && entity.arrivalPattern.interarrivalTime) {
        entity.arrivalPattern.interarrivalTime.parameters.mean = 60 / args.parameters.arrivalRate!; // Convert per hour to minutes
      }
    });
  }

  // Apply processing time changes
  if (args.parameters.processingTimes) {
    Object.entries(args.parameters.processingTimes).forEach(([resourceId, time]) => {
      const process = modifiedSystem.processes.find(p => (p as any).resourceRequired === resourceId);
      if (process) {
        (process as any).processingTime.mean = time;
      }
    });
  }

  // Run simulation through existing backend function
  const { runComprehensiveSimulation } = require('./simulation/desRunner');
  const result = await runComprehensiveSimulation(
    modifiedSystem,
    args.parameters.replications || 30,
    args.parameters.duration || 2880
  );

  if (!result.success) {
    throw new Error(result.error || 'Simulation failed');
  }

  // Store scenario
  const scenarioId = `scenario-${Date.now()}`;
  scenarioStore.set(scenarioId, {
    parameters: args.parameters,
    results: result.results,
  });

  return { scenarioId, results: result.results };
}

function compareScenarios(args: CompareScenarioArgs): ComparisonResult {
  console.log('[ChatbotService] compareScenarios', args);

  const scenarios: ComparisonResult['scenarios'] = [];

  args.scenarioIds.forEach((id: string, index: number) => {
    const scenario = scenarioStore.get(id);
    if (!scenario || !scenario.results) {
      return;
    }

    const metrics: Record<string, number> = {};
    args.metrics.forEach((metric: string) => {
      switch (metric) {
        case 'throughput':
          metrics[metric] = scenario.results!.throughput.mean;
          break;
        case 'cycleTime':
          metrics[metric] = scenario.results!.cycleTime.mean;
          break;
        case 'utilization':
          const resourceMetrics = (scenario.results as any).resourceMetrics;
          if (resourceMetrics) {
            const resources = Object.values(resourceMetrics) as any[];
            metrics[metric] = resources.reduce((sum, r) => sum + r.utilization.mean, 0) / resources.length;
          }
          break;
      }
    });

    scenarios.push({
      id,
      name: `Scenario ${index + 1}`,
      metrics,
    });
  });

  // Calculate differences
  const differences: Record<string, number> = {};
  if (scenarios.length === 2 && args.showDifference) {
    args.metrics.forEach((metric: string) => {
      const val1 = scenarios[0].metrics[metric];
      const val2 = scenarios[1].metrics[metric];
      differences[metric] = ((val2 - val1) / val1) * 100; // Percentage difference
    });
  }

  // Determine winner
  let winner: ComparisonResult['winner'];
  if (scenarios.length > 1) {
    const firstMetric = args.metrics[0];
    const best = scenarios.reduce((prev, curr) =>
      curr.metrics[firstMetric] > prev.metrics[firstMetric] ? curr : prev
    );
    winner = {
      scenarioId: best.id,
      metric: firstMetric,
      value: best.metrics[firstMetric],
    };
  }

  return { scenarios, winner } as ExtendedComparisonResult;
}

function getStatistics(
  args: GetStatisticsArgs,
  _currentResults?: ComprehensiveSimulationResults
): any {
  console.log('[ChatbotService] getStatistics', args);

  if (!_currentResults) {
    return { error: 'No simulation results available' };
  }

  // Implementation depends on requested statistic type
  // For now, return basic statistics
  return {
    metric: args.metric,
    statisticType: args.statisticType || 'mean',
    value: _currentResults.throughput.mean, // Placeholder
  };
}

function analyzeBottleneck(
  args: AnalyzeBottleneckArgs,
  _system: ExtractedSystem,
  currentResults?: ComprehensiveSimulationResults
): BottleneckAnalysis {
  console.log('[ChatbotService] analyzeBottleneck', args);

  if (!currentResults) {
    return {
      bottlenecks: [],
      primaryBottleneck: 'No results available',
    } as ExtendedBottleneckAnalysis;
  }

  const threshold = args.threshold || 0.85;
  const bottlenecks: BottleneckAnalysis['bottlenecks'] = [];

  const resourceMetrics = (currentResults as any).resourceMetrics;
  if (resourceMetrics) {
    Object.entries(resourceMetrics).forEach(([resourceId, metrics]: [string, any]) => {
      if (metrics.utilization.mean > threshold) {
        bottlenecks.push({
          resourceId,
          utilization: metrics.utilization.mean,
          queueLength: metrics.queueLength.mean,
          impactScore: Math.min(100, metrics.utilization.mean * 100),
          recommendations: [
            `Add parallel capacity to ${resourceId}`,
            `Reduce processing time variance`,
            `Implement buffer before ${resourceId}`,
          ],
        });
      }
    });
  }

  // Sort by utilization
  bottlenecks.sort((a, b) => b.utilization - a.utilization);

  return {
    bottlenecks,
    primaryBottleneck: bottlenecks[0]?.resourceId || 'None detected',
  } as ExtendedBottleneckAnalysis;
}

function optimizeParameters(
  args: OptimizeParametersArgs,
  _system: ExtractedSystem
): OptimizationResult {
  console.log('[ChatbotService] optimizeParameters', args);

  // Placeholder for GA optimization
  // In real implementation, this would call the GA optimizer from SimioDestroyerPlatform

  return {
    bestParameters: {
      'Machine1_capacity': 3,
      'Machine2_capacity': 2,
    },
    bestFitness: 0.85,
    iterations: 50,
    convergence: true,
    optimizedParameters: {
      'Machine1_capacity': 3,
      'Machine2_capacity': 2,
    },
    projectedImprovement: 15.5, // +15.5%
    confidence: 0.85,
    convergenceStatus: 'converged',
  };
}
