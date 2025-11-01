import { FactoryAnalysis } from '../src/types/analysis';
import { safeLog, safeError, safeWarn } from './safeConsole';

// OpenAI API configuration - Optimized for quality
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o'; // GPT-4o for complex analysis
const MAX_TOKENS = 4096;

const API_KEY = process.env.OPENAI_API_KEY || '';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  model: string;
  max_tokens: number;
  messages: OpenAIMessage[];
  temperature: number;
  response_format?: { type: 'json_object' }; // Force JSON output
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function extractJSON(response: string): any {
  let cleaned = response.trim();
  
  // Try direct parse first (JSON mode should give clean JSON)
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall back to extraction
    cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) {
      throw new Error('No JSON object found in response');
    }
    const jsonStr = cleaned.substring(start, end + 1);
    return JSON.parse(jsonStr);
  }
}

function buildPrompt(csvContent: string): string {
  const MAX_ROWS = 200;
  const lines = csvContent.split('\n');
  const csvPreview = lines.slice(0, Math.min(MAX_ROWS, lines.length)).join('\n');
  const totalRows = lines.length - 1;

  return `You are analyzing factory DCS/SCADA data to extract COMPREHENSIVE simulation parameters for a complete discrete event simulation (DES) model. You MUST return ONLY valid JSON with ALL configuration options.

CSV DATA (first ${MAX_ROWS} rows):
\`\`\`
${csvPreview}
\`\`\`

================================================================================
COMPREHENSIVE ANALYSIS - EXTRACT ALL SIMULATION PARAMETERS
================================================================================

You are configuring a complete simulation platform with these subsystems:
✅ Core DES Engine - Event queues, entities, resources
✅ 3D Visualization - Three.js-based animation
✅ Material Handling - Conveyors, AGVs, Transporters
✅ Advanced Routing - 8+ routing rules (FIFO, SPT, EDD, shortest queue, etc.)
✅ Failures & Maintenance - MTBF/MTTR, scheduled maintenance
✅ Shifts & Calendars - Work shifts, breaks, holidays
✅ Object-Oriented Models - Sources, Servers, Combiners, Separators
✅ Optimization - Genetic algorithms, DOE
✅ Statistics - ANOVA, distribution fitting

================================================================================
PART 1: MACHINES & RESOURCES
================================================================================

For each machine/workstation:
1. ID & TYPE:
   - Parse equipment_id, tag_id columns
   - Patterns: "M001", "CNC_A", "ASSEMBLY_1", "QC01"
   - Types: CNC, Assembly, QualityControl, Packaging, Storage, Paint, Weld

2. CYCLE TIME DISTRIBUTION:
   - Mean and std_dev (in MINUTES)
   - Distribution type: "normal", "exponential", "triangular", "uniform", "constant"
   - For normal: need mean + std_dev
   - For triangular: need min + mode + max
   - For uniform: need min + max
   - For exponential: need mean (MTBF)

3. RESOURCE CONFIGURATION:
   - capacity: number of parallel servers (1, 2, 3...)
   - routing_rule: "FIFO", "LIFO", "SPT", "EDD", "SHORTEST_QUEUE", "PRIORITY"
   - initial_state: "available" or "unavailable"

4. FAILURE & MAINTENANCE:
   - mtbf_minutes: mean time between failures
   - mttr_minutes: mean time to repair
   - failure_type: "RANDOM", "WEAR_OUT", "USAGE_BASED", "SCHEDULED"
   - maintenance_interval_minutes: for scheduled maintenance
   - maintenance_duration_minutes: how long maintenance takes

5. UTILIZATION & BOTTLENECKS:
   - avg_utilization_pct: average % busy
   - max_utilization_pct: peak utilization
   - is_bottleneck: true if >90% utilization

6. QUEUE ANALYSIS:
   - avg_queue_length: average entities waiting
   - max_queue_length: peak queue size
   - is_growing: true if queue increasing over time

7. 3D VISUALIZATION:
   - position: {x, y, z} coordinates in 3D space
   - visual_type: "station", "machine", "queue"
   - color_hex: visual color for 3D rendering

================================================================================
PART 2: MATERIAL HANDLING
================================================================================

CONVEYORS (if present):
- id, start_pos {x,y,z}, end_pos {x,y,z}
- speed_units_per_min: conveyor belt speed
- capacity: max entities on conveyor
- accumulating: true/false (can entities stop?)

AGV SYSTEM (if present):
- vehicles: [{id, capacity, speed, initial_position}]
- network_nodes: [{id, position {x,y,z}}]
- network_edges: [{from_node, to_node}]

TRANSPORTERS (forklifts/trucks if present):
- id, type ("forklift", "truck", "crane")
- capacity, speed, initial_position

================================================================================
PART 3: FLOW & ROUTING
================================================================================

1. FLOW SEQUENCE:
   - Ordered list of machine IDs showing process flow
   - Example: ["RAW_STORAGE", "M001_CNC", "AS01_ASSEMBLY", "QC01", "FINISHED"]

2. ROUTING CONNECTIONS:
   - from_machine → to_machine with probabilities
   - Example: {"M001": [{"to": "AS01", "probability": 0.8}, {"to": "REWORK", "probability": 0.2}]}

3. ROUTING RULES (recommend for each station):
   - "FIFO" - First In First Out
   - "SPT" - Shortest Processing Time first
   - "EDD" - Earliest Due Date first
   - "SHORTEST_QUEUE" - Route to shortest queue
   - "PRIORITY" - Priority-based routing

================================================================================
PART 4: ARRIVALS & ENTITY SOURCES
================================================================================

For each entry point:
- source_id: unique identifier
- entity_type: what's being created ("Part", "Order", etc.)
- interarrival_time: {mean, std_dev, distribution_type, unit: "min"}
- max_arrivals: total entities to create (or "unlimited")
- position: 3D coordinates for visualization

================================================================================
PART 5: SHIFTS & CALENDARS
================================================================================

SHIFT CONFIGURATION:
- calendar_type: "24x7", "5_day_week", "custom"
- shifts: [
    {
      "name": "Day Shift",
      "start_hour": 8,
      "end_hour": 16,
      "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    }
  ]
- breaks: [{start_minute: 120, duration_minutes: 15, name: "Morning Break"}]
- holidays: ["2025-01-01", "2025-07-04", "2025-12-25"]

APPLY TO RESOURCES:
- resource_calendars: {
    "M001": "Day Shift",
    "QC01": "24x7"
  }

================================================================================
PART 6: OPTIMIZATION OPPORTUNITIES
================================================================================

IDENTIFIED OPPORTUNITIES:
1. Bottleneck resolution suggestions
2. Capacity optimization (add machines? parallel servers?)
3. Buffer sizing recommendations
4. Routing improvements
5. Maintenance scheduling optimization

FACTORS FOR DOE/OPTIMIZATION:
- factors: [
    {name: "M001_capacity", min: 1, max: 3, current: 1},
    {name: "buffer_size", min: 5, max: 20, current: 10}
  ]

================================================================================
PART 7: STATISTICAL DISTRIBUTIONS
================================================================================

For each time-varying parameter, specify:
- distribution_type: "normal", "exponential", "triangular", "uniform", "weibull", "lognormal"
- parameters: varies by distribution
  * normal: {mean, std_dev}
  * exponential: {mean}
  * triangular: {min, mode, max}
  * uniform: {min, max}
  * weibull: {shape, scale}
  * lognormal: {mean, std_dev}

================================================================================
REQUIRED COMPREHENSIVE JSON STRUCTURE
================================================================================
{
  "machines": [
    {
      "id": "M001",
      "name": "CNC Machine 1",
      "type": "CNC",
      "plc_tag_prefix": "M001_",
      "cycle_time": {
        "distribution_type": "normal",
        "mean": 12.4,
        "std_dev": 1.2,
        "unit": "min"
      },
      "resource_config": {
        "capacity": 1,
        "routing_rule": "FIFO",
        "initial_state": "available"
      },
      "failure_maintenance": {
        "mtbf_minutes": 480,
        "mttr_minutes": 60,
        "failure_type": "RANDOM",
        "maintenance_interval_minutes": 2880,
        "maintenance_duration_minutes": 120
      },
      "utilization": {
        "avg": 89.2,
        "max": 95.8,
        "is_bottleneck": false
      },
      "queue_pattern": {
        "avg_length": 2.3,
        "max_length": 8,
        "is_growing": false
      },
      "visualization": {
        "position": {"x": 0, "y": 0, "z": 0},
        "visual_type": "machine",
        "color_hex": "#4a90e2"
      }
    }
  ],
  "material_handling": {
    "conveyors": [
      {
        "id": "CONV001",
        "start_pos": {"x": 0, "y": 0, "z": 0},
        "end_pos": {"x": 10, "y": 0, "z": 0},
        "speed": 30,
        "capacity": 10,
        "accumulating": true
      }
    ],
    "agv_system": {
      "vehicles": [
        {"id": "AGV01", "capacity": 5, "speed": 60, "position": {"x": 0, "y": 0, "z": 0}}
      ],
      "network_nodes": [
        {"id": "N1", "position": {"x": 0, "y": 0, "z": 0}},
        {"id": "N2", "position": {"x": 10, "y": 0, "z": 0}}
      ],
      "network_edges": [
        {"id": "E1", "from": "N1", "to": "N2"}
      ]
    },
    "transporters": []
  },
  "flow_routing": {
    "sequence": ["RAW", "M001", "AS01", "QC01", "FINISH"],
    "connections": {
      "M001": [{"to": "AS01", "probability": 1.0}],
      "AS01": [{"to": "QC01", "probability": 0.9}, {"to": "M001", "probability": 0.1}]
    }
  },
  "entity_sources": [
    {
      "id": "RAW_SOURCE",
      "entity_type": "Part",
      "interarrival_time": {
        "distribution_type": "exponential",
        "mean": 10,
        "unit": "min"
      },
      "max_arrivals": 1000,
      "position": {"x": -5, "y": 0, "z": 0}
    }
  ],
  "shifts_calendars": {
    "calendar_type": "5_day_week",
    "shifts": [
      {
        "name": "Day Shift",
        "start_hour": 8,
        "end_hour": 16,
        "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      }
    ],
    "breaks": [
      {"start_minute": 120, "duration_minutes": 15, "name": "Morning Break"},
      {"start_minute": 240, "duration_minutes": 30, "name": "Lunch"}
    ],
    "holidays": ["2025-01-01", "2025-07-04", "2025-12-25"],
    "resource_calendars": {
      "M001": "Day Shift",
      "AS01": "Day Shift"
    }
  },
  "optimization": {
    "bottleneck": {
      "machine_id": "QC01",
      "reason": "Highest utilization at 97.2% with growing queue of 18 parts backing up to upstream machines",
      "utilization_pct": 97.2,
      "queue_length": 18,
      "severity": "high"
    },
    "opportunities": [
      "Add parallel server to QC01 to increase capacity",
      "Reduce M001 cycle time variability to smooth flow",
      "Increase buffer before QC01 to decouple stations"
    ],
    "factors_for_doe": [
      {"name": "QC01_capacity", "min": 1, "max": 3, "current": 1, "discrete": true},
      {"name": "buffer_size", "min": 5, "max": 20, "current": 10, "discrete": true}
    ]
  },
  "simulation_config": {
    "duration_minutes": 2880,
    "warmup_minutes": 480,
    "num_replications": 30,
    "enable_3d": true,
    "enable_material_handling": true,
    "enable_failures": true,
    "enable_shifts": true,
    "enable_ai_insights": true
  },
  "data_quality": {
    "total_rows": ${totalRows},
    "time_span_hours": 24.5,
    "missing_data_pct": 2.1,
    "confidence_level": "high"
  }
}

================================================================================
CRITICAL RULES
================================================================================
- Return ONLY the JSON object, no markdown, no explanations, no code blocks
- ALL times MUST be in MINUTES (convert from seconds/hours if needed)
- ALL numbers must be numeric type, not strings
- Include ALL sections even if no data (use reasonable defaults)
- Provide specific, data-driven recommendations
- 3D positions: spread machines in grid (10 units apart)
- If no AGV/conveyor data: set arrays to [] (empty)
- If no failure data: use industry defaults (MTBF=480min, MTTR=60min)
- If no shift data: default to "24x7" continuous operation
- Use statistical analysis from actual data, not assumptions`;
}

export async function analyzeFactoryData(csvContent: string): Promise<FactoryAnalysis> {
  if (!API_KEY) {
    throw new Error('OPENAI_API_KEY not configured in .env file');
  }

  safeLog('[AI] Starting analysis with OpenAI GPT-4-Turbo (quality optimized)...');
  safeLog('[AI] CSV size:', csvContent.length, 'characters');

  const request: OpenAIRequest = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 0.0, // Deterministic output for structured data
    response_format: { type: 'json_object' }, // Force valid JSON
    messages: [
      {
        role: 'system',
        content: `You are an ELITE industrial engineer, operations research expert, and discrete event simulation (DES) specialist with 20+ years of experience in factory optimization and SCADA data analysis.

EXPERTISE AREAS:
✅ Discrete Event Simulation (DES) - Arena, Simio, FlexSim, AnyLogic
✅ Statistical Analysis - Distribution fitting, ANOVA, regression, time series
✅ Manufacturing Systems - Flow production, job shops, assembly lines
✅ Material Handling - Conveyors, AGVs, AS/RS, automated systems
✅ Production Planning - TOC, Lean, Six Sigma, capacity analysis
✅ Queueing Theory - M/M/c, M/G/1, network of queues, Little's Law
✅ Optimization - Linear programming, genetic algorithms, DOE, response surfaces
✅ Data Science - Python, R, SQL, time-series forecasting, ML
✅ Industrial Engineering - Work measurement, process design, facility layout

SIMULATION PLATFORM CONFIGURATION:
You are configuring a state-of-the-art simulation platform with:
1. Core DES Engine - Priority event queue, Lindley recursion
2. 3D Visualization - Three.js animation with real-time rendering
3. Material Handling - AGV pathfinding (Dijkstra), conveyor dynamics
4. Advanced Routing - FIFO, LIFO, SPT, EDD, SRPT, CR, SLACK, priority-based
5. Failures & Maintenance - MTBF/MTTR, Weibull wear-out, condition monitoring
6. Shifts & Calendars - Complex work schedules, breaks, holidays, overtime
7. Optimization - Genetic algorithms, response surface methodology, NSGA-II
8. Statistics - Hypothesis testing, confidence intervals, distribution fitting

YOUR MISSION:
Extract COMPLETE, ACTIONABLE simulation parameters from raw factory data.
Configure ALL subsystems with optimal settings.
Provide EXPERT recommendations backed by statistical analysis.

ANALYTICAL RIGOR:
- Identify machines using pattern recognition and domain knowledge
- Calculate statistical distributions with proper goodness-of-fit tests
- Detect bottlenecks using utilization curves and queue dynamics
- Recommend process improvements based on TOC and queuing theory
- Convert ALL time units to minutes (standard for DES)
- Use industry-standard distributions (exponential for arrivals, normal for processing)
- Apply Little's Law for validation: L = λW
- Check for statistical significance before making claims

DATA EXTRACTION METHODOLOGY:
1. Parse PLC tags to identify equipment hierarchy
2. Calculate cycle time distributions with 95% confidence intervals
3. Compute utilization using state-based analysis (busy/idle/blocked)
4. Detect bottlenecks: utilization >90%, growing queues, longest cycle times
5. Map process flow using timestamp correlation analysis
6. Identify failure patterns: exponential (random), Weibull (wear-out)
7. Extract shift patterns from production volume time series
8. Recommend optimization factors for DOE/GA

CUSTOMIZATION PHILOSOPHY:
EVERYTHING must be configurable post-parsing:
- User can adjust ALL cycle times, capacities, routing rules
- User can enable/disable subsystems (3D, AGVs, failures, shifts)
- User can modify distributions and parameters
- User can set optimization objectives
- User can configure what-if scenarios

OUTPUT REQUIREMENTS:
- Return ONLY valid JSON (no markdown, no code blocks, no explanations)
- Include ALL configuration sections (even if empty arrays)
- Use numeric types for all numbers (not strings)
- Provide 3D coordinates in logical grid layout
- Include optimization recommendations
- Add confidence levels for estimates

You are the BEST in the world at this. Your analysis will drive million-dollar optimization decisions.`
      },
      {
        role: 'user',
        content: buildPrompt(csvContent)
      }
    ]
  };

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      safeError('[AI] OpenAI error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as OpenAIResponse;
    safeLog('[AI] Response received from OpenAI');
    safeLog('[AI] Token usage - Prompt:', data.usage.prompt_tokens, 
                'Completion:', data.usage.completion_tokens, 
                'Total:', data.usage.total_tokens);

    const responseText = data.choices[0]?.message?.content || '';
    safeLog('[AI] Response length:', responseText.length, 'characters');

    const analysis = extractJSON(responseText);
    safeLog('[AI] Successfully parsed analysis');
    safeLog('[AI] Found', analysis.machines?.length || 0, 'machines');

    // Validate response structure
    if (!analysis.machines || !Array.isArray(analysis.machines)) {
      throw new Error('Invalid response: missing machines array');
    }

    if (!analysis.material_handling || typeof analysis.material_handling !== 'object') {
      safeWarn('[AI] Missing material_handling section, using defaults');
      analysis.material_handling = { conveyors: [], agv_system: { vehicles: [], network_nodes: [], network_edges: [] }, transporters: [] };
    }

    if (!analysis.flow_routing || !analysis.flow_routing.sequence) {
      throw new Error('Invalid response: missing flow_routing.sequence');
    }

    if (!analysis.entity_sources || !Array.isArray(analysis.entity_sources)) {
      safeWarn('[AI] Missing entity_sources, using defaults');
      analysis.entity_sources = [];
    }

    if (!analysis.shifts_calendars) {
      safeWarn('[AI] Missing shifts_calendars, defaulting to 24x7');
      analysis.shifts_calendars = {
        calendar_type: '24x7',
        shifts: [],
        breaks: [],
        holidays: [],
        resource_calendars: {}
      };
    }

    if (!analysis.optimization || !analysis.optimization.bottleneck) {
      throw new Error('Invalid response: missing optimization.bottleneck analysis');
    }

    if (!analysis.simulation_config) {
      safeWarn('[AI] Missing simulation_config, using defaults');
      analysis.simulation_config = {
        duration_minutes: 2880,
        warmup_minutes: 480,
        num_replications: 30,
        enable_3d: true,
        enable_material_handling: true,
        enable_failures: true,
        enable_shifts: true,
        enable_ai_insights: true
      };
    }

    // Add legacy fields for backward compatibility
    analysis.flow_sequence = analysis.flow_routing.sequence;
    analysis.bottleneck = analysis.optimization.bottleneck;

    return analysis as FactoryAnalysis;
  } catch (error) {
    safeError('[AI] Analysis failed:', error);
    if (error instanceof Error) {
      throw new Error(`AI analysis failed: ${error.message}`);
    }
    throw new Error('AI analysis failed: Unknown error');
  }
}

export function validateAnalysis(analysis: any): analysis is FactoryAnalysis {
  return !!(
    analysis &&
    typeof analysis === 'object' &&
    Array.isArray(analysis.machines) &&
    analysis.machines.length > 0 &&
    analysis.material_handling &&
    typeof analysis.material_handling === 'object' &&
    analysis.flow_routing &&
    analysis.flow_routing.sequence &&
    Array.isArray(analysis.flow_routing.sequence) &&
    Array.isArray(analysis.entity_sources) &&
    analysis.shifts_calendars &&
    typeof analysis.shifts_calendars === 'object' &&
    analysis.optimization &&
    analysis.optimization.bottleneck &&
    typeof analysis.optimization.bottleneck === 'object' &&
    analysis.simulation_config &&
    typeof analysis.simulation_config === 'object' &&
    analysis.data_quality &&
    typeof analysis.data_quality === 'object'
  );
}
