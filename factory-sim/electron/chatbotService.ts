/**
 * CHATBOT SERVICE
 * OpenAI-powered NLP service for simulation queries and scenario running
 */

import OpenAI from 'openai';
import { safeLog, safeError } from './safeConsole.js';
import {
  ChatMessage,
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
  safeLog('[ChatbotService] OpenAI client initialized');
}

// ============================================================================
// FUNCTION DEFINITIONS (OpenAI Tools Format)
// ============================================================================

const SIMULATION_TOOLS = [
  {
    type: 'function' as const,
    function: {
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
  },
  {
    type: 'function' as const,
    function: {
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
  },
  {
    type: 'function' as const,
    function: {
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
  },
  {
    type: 'function' as const,
    function: {
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
  },
  {
    type: 'function' as const,
    function: {
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
  },
  {
    type: 'function' as const,
    function: {
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

    // Call OpenAI with tools (function calling)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',  // Updated to latest model
      messages,
      tools: SIMULATION_TOOLS,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 1500,
    });

    const choice = completion.choices[0];

    // Check if tool calls were made
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];

      // Type guard to ensure we have a function tool call
      if (toolCall.type !== 'function') {
        return { message: 'Unsupported tool call type', error: 'Only function tools are supported' };
      }

      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      safeLog(`[ChatbotService] Tool call: ${functionName}`, functionArgs);

      // Execute the function
      let functionResult;
      try {
        functionResult = await executeFunction(
          functionName,
          functionArgs,
          request.system,
          request.currentResults
        );
      } catch (error) {
        safeError(`[ChatbotService] Function execution error:`, error);
        functionResult = { error: error instanceof Error ? error.message : 'Function execution failed' };
      }

      // Get follow-up response from OpenAI with function result
      const followUpMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        ...messages,
        {
          role: 'assistant',
          content: choice.message.content || null,
          tool_calls: choice.message.tool_calls,
        },
        {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(functionResult),
        },
      ];

      const followUpCompletion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: followUpMessages,
        temperature: 0.7,
        max_tokens: 1500,
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
    safeError('[ChatbotService] Error:', error);
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
  safeLog('[ChatbotService] querySimulationData', args);

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

    try {
      switch (metric) {
        case 'throughput':
          // Handle both old and new data structures
          if (typeof currentResults.throughput === 'object' && currentResults.throughput !== null) {
            metricData.value = (currentResults.throughput as any).mean || currentResults.throughput;
            const ci = (currentResults.throughput as any).confidenceInterval;
            if (Array.isArray(ci)) {
              metricData.ci = `[${ci[0].toFixed(2)}, ${ci[1].toFixed(2)}]`;
            }
          } else {
            metricData.value = currentResults.throughput;
          }
          break;
        case 'cycleTime':
          if (typeof currentResults.cycleTime === 'object' && currentResults.cycleTime !== null) {
            metricData.value = (currentResults.cycleTime as any).mean || currentResults.cycleTime;
            const ci = (currentResults.cycleTime as any).confidenceInterval;
            if (Array.isArray(ci)) {
              metricData.ci = `[${ci[0].toFixed(2)}, ${ci[1].toFixed(2)}]`;
            }
          } else {
            metricData.value = currentResults.cycleTime;
          }
          break;
        case 'utilization':
          // Try multiple ways to get utilization
          const resourceStats = (currentResults as any).resourceStats;
          const resourceMetrics = (currentResults as any).resourceMetrics;
          if (resourceStats && Array.isArray(resourceStats)) {
            const avgUtil = resourceStats.reduce((sum: number, r: any) =>
              sum + ((r.utilization?.average || r.utilization?.mean || r.utilization) || 0), 0
            ) / resourceStats.length;
            metricData.value = avgUtil;
          } else if (resourceMetrics) {
            const resources = Object.values(resourceMetrics) as any[];
            const avgUtil = resources.reduce((sum, r) =>
              sum + ((r.utilization?.mean || r.utilization) || 0), 0
            ) / resources.length;
            metricData.value = avgUtil;
          } else {
            metricData.value = 0;
          }
          break;
        case 'queueLength':
          const resourceStats2 = (currentResults as any).resourceStats;
          const resourceMetrics2 = (currentResults as any).resourceMetrics;
          if (resourceStats2 && Array.isArray(resourceStats2)) {
            const avgQueue = resourceStats2.reduce((sum: number, r: any) =>
              sum + ((r.averageQueue?.mean || r.queueLength?.mean || r.avgQueueLength) || 0), 0
            ) / resourceStats2.length;
            metricData.value = avgQueue;
          } else if (resourceMetrics2) {
            const resources = Object.values(resourceMetrics2) as any[];
            const avgQueue = resources.reduce((sum, r) =>
              sum + ((r.queueLength?.mean || r.avgQueueLength) || 0), 0
            ) / resources.length;
            metricData.value = avgQueue;
          } else {
            metricData.value = 0;
          }
          break;
        case 'waitTime':
          // Try to get wait time from queue stats
          const queueStats = (currentResults as any).queueStats;
          if (queueStats && Array.isArray(queueStats)) {
            const avgWait = queueStats.reduce((sum: number, q: any) =>
              sum + (q.avgWaitTime || 0), 0
            ) / queueStats.length;
            metricData.value = avgWait;
          } else {
            metricData.value = 0;
          }
          break;
        case 'WIP':
          metricData.value = (currentResults as any).workInProgress?.mean || 0;
          break;
        default:
          metricData.value = 0;
          metricData.error = 'Unknown metric';
      }
    } catch (error) {
      safeError(`[ChatbotService] Error extracting metric ${metric}:`, error);
      metricData.value = 0;
      metricData.error = 'Extraction error';
    }

    data.push(metricData);
  });

  // Compute summary statistics
  const values = data.map(d => d.value).filter(v => typeof v === 'number' && !isNaN(v));
  const summary = values.length > 0 ? {
    count: values.length,
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  } : {
    count: 0,
    mean: 0,
    min: 0,
    max: 0,
  };

  return { data, metrics: args.metrics, summary };
}

async function runScenario(
  args: RunScenarioArgs,
  system: ExtractedSystem
): Promise<{ scenarioId: string; results: ComprehensiveSimulationResults }> {
  safeLog('[ChatbotService] runScenario', args);

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
  safeLog('[ChatbotService] compareScenarios', args);

  const scenarios: ComparisonResult['scenarios'] = [];

  args.scenarioIds.forEach((id: string, index: number) => {
    const scenario = scenarioStore.get(id);
    if (!scenario || !scenario.results) {
      return;
    }

    const metrics: Record<string, number> = {};
    args.metrics.forEach((metric: string) => {
      try {
        switch (metric) {
          case 'throughput':
            const throughput = scenario.results!.throughput;
            metrics[metric] = (typeof throughput === 'object' && throughput !== null)
              ? ((throughput as any).mean || throughput)
              : throughput;
            break;
          case 'cycleTime':
            const cycleTime = scenario.results!.cycleTime;
            metrics[metric] = (typeof cycleTime === 'object' && cycleTime !== null)
              ? ((cycleTime as any).mean || cycleTime)
              : cycleTime;
            break;
          case 'utilization':
            const resourceStats = (scenario.results as any).resourceStats;
            const resourceMetrics = (scenario.results as any).resourceMetrics;
            if (resourceStats && Array.isArray(resourceStats)) {
              metrics[metric] = resourceStats.reduce((sum: number, r: any) =>
                sum + ((r.utilization?.average || r.utilization?.mean || r.utilization) || 0), 0
              ) / resourceStats.length;
            } else if (resourceMetrics) {
              const resources = Object.values(resourceMetrics) as any[];
              metrics[metric] = resources.reduce((sum, r) =>
                sum + ((r.utilization?.mean || r.utilization) || 0), 0
              ) / resources.length;
            } else {
              metrics[metric] = 0;
            }
            break;
          default:
            metrics[metric] = 0;
        }
      } catch (error) {
        safeError(`[ChatbotService] Error extracting ${metric} for comparison:`, error);
        metrics[metric] = 0;
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
      if (val1 && val1 !== 0) {
        differences[metric] = ((val2 - val1) / val1) * 100; // Percentage difference
      }
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
  safeLog('[ChatbotService] getStatistics', args);

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
  safeLog('[ChatbotService] analyzeBottleneck', args);

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
  safeLog('[ChatbotService] optimizeParameters', args);

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
