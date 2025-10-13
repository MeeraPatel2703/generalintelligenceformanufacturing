import { ExtractedSystem, ExtractionResult } from '../src/types/extraction';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o'; // GPT-4o for complex extraction
const MAX_TOKENS = 16000;

// DO NOT read API_KEY at module load time - read it when needed
// This allows main.ts to load .env file first
function getAPIKey(): string {
  return process.env.OPENAI_API_KEY || '';
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  model: string;
  max_tokens: number;
  messages: OpenAIMessage[];
  temperature: number;
  response_format?: { type: 'json_object' };
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
  try {
    return JSON.parse(response.trim());
  } catch {
    let cleaned = response.trim();
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

function buildExtractionPrompt(documentContent: string, documentType: string): string {
  const contentPreview = documentContent.substring(0, 80000); // More content for better analysis
  
  return `You are extracting a COMPLETE discrete event simulation (DES) system from a ${documentType} document.

DOCUMENT CONTENT:
${contentPreview}

CRITICAL MISSION: Extract a SOPHISTICATED, COMPLETE simulation model with:
✅ Proper arrival patterns
✅ Complete process sequences with ALL steps
✅ Delays between steps (travel time, waiting, etc.)
✅ Clear exit/departure points
✅ Realistic time distributions
✅ Proper routing logic (sequential, probabilistic, or conditional)

DEFINITIONS:

1. ENTITIES (Items flowing through system):
   - What moves through: customers, parts, orders, vehicles
   - MUST have arrival pattern with proper distribution
   - Examples: "Customers arrive every 3±1 minutes", "Parts batches of 50 every hour"

2. RESOURCES (What processes entities):
   - Servers, machines, staff, equipment
   - MUST have capacity and schedule
   - Examples: "2 cashiers", "5 tow ropes", "1 CNC machine"

3. PROCESSES - THIS IS THE MOST IMPORTANT SECTION:
   ⚠️ YOU MUST CREATE A COMPLETE STEP-BY-STEP FLOW WITH:

   a) SEIZE steps (grab a resource)
   b) DELAY steps (processing time, travel time, waiting)
   c) RELEASE steps (free the resource)
   d) DECISION steps (routing choices)
   e) EXIT/DEPARTURE steps (entities leave the system)

   Example of a COMPLETE process sequence:
   [
     {
       "id": "step_1",
       "type": "seize",
       "resourceName": "Cashier",
       "description": "Customer approaches cashier"
     },
     {
       "id": "step_2",
       "type": "delay",
       "duration": {"mean": 3.0, "stdDev": 0.8, "unit": "minutes", "distribution": "normal"},
       "description": "Check-in and payment processing"
     },
     {
       "id": "step_3",
       "type": "release",
       "resourceName": "Cashier",
       "description": "Cashier becomes available"
     },
     {
       "id": "step_4",
       "type": "delay",
       "duration": {"mean": 1.0, "stdDev": 0.2, "unit": "minutes", "distribution": "normal"},
       "description": "Walk to tube station (50 feet)"
       },
     {
       "id": "step_5",
       "type": "seize",
       "resourceName": "Tube",
       "description": "Pick up tube"
     },
     ... continue until EXIT
   ]

4. ROUTING LOGIC:
   - Sequential: One path, everyone follows same steps
   - Probabilistic: Random choice (e.g., 70% use conveyor, 30% walk)
   - Conditional: Based on attributes (e.g., if queue > 10, use alternate path)
   - Cyclic: Loop back to earlier step (e.g., repeat ride)

5. TIME DELAYS - EVERY STEP NEEDS TIME:
   - Processing time (seize → delay → release)
   - Travel time (delay between locations)
   - Queue waiting (automatic from resource capacity)
   - Setup time (delay before processing)

6. EXIT STRATEGY - ENTITIES MUST LEAVE:
   - Add EXIT step at the end of every process
   - For cyclic systems, add probability to exit after N cycles
   - Examples: "Leave facility", "Part shipped", "Service complete"

REQUIRED OUTPUT STRUCTURE (FOLLOW EXACTLY):

EXAMPLE OUTPUT - SOPHISTICATED COMPLETE MODEL:
{
  "systemName": "The Summit Snow Tubing Facility",
  "systemType": "service",
  "description": "A recreational snow tubing facility where customers check in, ride tow rope to top, sled down, and optionally repeat or exit",

  "entities": [
    {
      "name": "Customer Groups",
      "type": "customer",
      "arrivalPattern": {
        "type": "poisson",
        "rate": 20,
        "rateUnit": "per_hour"
      },
      "attributes": [
        {
          "name": "groupSize",
          "type": "number",
          "distribution": {"type": "triangular", "parameters": {"min": 1, "mode": 2, "max": 6}, "unit": "dimensionless"}
        }
      ]
    }
  ],

  "resources": [
    {
      "name": "Ticket Booth",
      "type": "server",
      "capacity": 2,
      "processingTime": {"type": "normal", "parameters": {"mean": 3.0, "stdDev": 0.8}, "unit": "minutes"}
    },
    {
      "name": "Tow Rope",
      "type": "conveyor",
      "capacity": 8,
      "speed": 200
    },
    {
      "name": "Sledding Lanes",
      "type": "path",
      "capacity": 12
    }
  ],

  "processes": [
    {
      "name": "Complete Customer Journey",
      "entityType": "Customer Groups",
      "routingLogic": "cyclic",
      "sequence": [
        {
          "id": "arrive",
          "type": "seize",
          "resourceName": "Ticket Booth",
          "description": "Queue for ticket booth"
        },
        {
          "id": "checkin",
          "type": "delay",
          "duration": {"type": "normal", "parameters": {"mean": 3.0, "stdDev": 0.8}, "unit": "minutes"},
          "description": "Check-in and payment"
        },
        {
          "id": "release_booth",
          "type": "release",
          "resourceName": "Ticket Booth"
        },
        {
          "id": "walk_to_rope",
          "type": "delay",
          "duration": {"type": "uniform", "parameters": {"min": 0.5, "max": 1.5}, "unit": "minutes"},
          "description": "Walk 100 feet to tow rope"
        },
        {
          "id": "seize_rope",
          "type": "seize",
          "resourceName": "Tow Rope"
        },
        {
          "id": "ride_up",
          "type": "delay",
          "duration": {"type": "constant", "parameters": {"value": 4.5}, "unit": "minutes"},
          "description": "Ride tow rope to top of hill"
        },
        {
          "id": "release_rope",
          "type": "release",
          "resourceName": "Tow Rope"
        },
        {
          "id": "seize_lane",
          "type": "seize",
          "resourceName": "Sledding Lanes"
        },
        {
          "id": "sled_down",
          "type": "delay",
          "duration": {"type": "uniform", "parameters": {"min": 2.0, "max": 3.5}, "unit": "minutes"},
          "description": "Sled down 500 feet at varying speeds"
        },
        {
          "id": "release_lane",
          "type": "release",
          "resourceName": "Sledding Lanes"
        },
        {
          "id": "decide_repeat",
          "type": "decision",
          "conditions": [
            {
              "nextStepId": "walk_to_rope",
              "probability": 0.75,
              "description": "Go again (75%)"
            },
            {
              "nextStepId": "exit_facility",
              "probability": 0.25,
              "description": "Leave facility (25%)"
            }
          ]
        },
        {
          "id": "exit_facility",
          "type": "process",
          "description": "Customer exits the facility"
        }
      ]
    }
  ],

  "objectives": [
    {
      "name": "Minimize Wait Time",
      "metric": "wait_time",
      "targetType": "minimize",
      "targetValue": 5,
      "description": "Keep average wait time under 5 minutes"
    }
  ],

  "experiments": [],

  "missingInformation": [
    {
      "category": "capacity",
      "description": "Exact number of staff at ticket booth unclear",
      "severity": "minor",
      "suggestedDefault": 2,
      "impact": "May affect queue wait times by ±20%"
    }
  ],

  "assumptions": [
    {
      "category": "arrival_pattern",
      "description": "Assumed Poisson arrival process with rate of 20 customers/hour",
      "rationale": "Document states 'steady stream of customers throughout the day' which indicates random independent arrivals typical of service systems",
      "confidence": "high"
    },
    {
      "category": "processing_time",
      "description": "Assumed normal distribution for check-in time (3±0.8 min)",
      "rationale": "Document mentions 'typically 3 minutes' suggesting variation around a central value, appropriate for human-performed tasks",
      "confidence": "medium"
    }
  ]
}

🎯 SIMULATION ENGINE COMPATIBILITY REQUIREMENTS (CRITICAL!):

Your extracted JSON will be directly fed into a discrete event simulation engine. To ensure it works without errors:

✅ ARRIVAL PATTERNS - MANDATORY FIELDS:
   Every entity MUST have an arrivalPattern with these EXACT fields:
   {
     "type": "poisson",        // Required: "poisson", "scheduled", "batch"
     "rate": 60,               // Required: MUST be a number (20-120 recommended)
     "rateUnit": "per_hour"    // Required: MUST be "per_hour" or "per_minute"
   }

   ❌ INVALID: {"arrivalPattern": {"type": "poisson"}}  // Missing rate field!
   ✅ VALID: {"arrivalPattern": {"type": "poisson", "rate": 60, "rateUnit": "per_hour"}}

   If document doesn't specify arrival rate, use these defaults:
   - Service systems (customers): 30-60 per hour
   - Manufacturing (parts): 10-20 per hour
   - High-volume systems: 60-120 per hour

✅ TIME DISTRIBUTIONS - USE PARAMETERS OBJECT:
   All durations MUST use this exact structure:
   {
     "type": "normal",                          // Required
     "parameters": {"mean": 5.0, "stdDev": 1.2}, // Required: parameters object
     "unit": "minutes"                          // Required: ALWAYS "minutes"
   }

   Available distribution types:
   - "normal": {"mean": X, "stdDev": Y}
   - "uniform": {"min": X, "max": Y}
   - "exponential": {"mean": X}
   - "triangular": {"min": X, "mode": Y, "max": Z}
   - "constant": {"value": X}

   ❌ INVALID: {"duration": {"mean": 5, "stdDev": 1}}  // Missing type, parameters wrapper, unit!
   ✅ VALID: {"duration": {"type": "normal", "parameters": {"mean": 5.0, "stdDev": 1.0}, "unit": "minutes"}}

✅ ALL TIMES IN MINUTES:
   Convert everything to minutes:
   - Seconds → divide by 60
   - Hours → multiply by 60
   - Days → multiply by 1440

   Examples:
   - "30 seconds" → {"type": "constant", "parameters": {"value": 0.5}, "unit": "minutes"}
   - "2 hours" → {"type": "constant", "parameters": {"value": 120}, "unit": "minutes"}

✅ SENSIBLE DEFAULTS WHEN DOCUMENT IS UNCLEAR:
   If document says "quick", "fast", "brief" → 2-3 minutes
   If document says "typical", "normal" → 5-10 minutes
   If document says "slow", "lengthy" → 15-30 minutes
   If document says "several" resources → 3-5
   If document says "many" resources → 8-15

   ALWAYS document these defaults in missingInformation section!

✅ USER WILL EDIT YOUR OUTPUT:
   - Your extraction will be reviewed and edited before simulation
   - Mark uncertain values in missingInformation with severity levels
   - Provide multiple reasonable options when unsure
   - Be conservative with defaults (better to underestimate than crash simulation)

CRITICAL RULES FOR YOUR OUTPUT:

1. ✅ Every process MUST have complete sequence with seize, delay, release, and exit
2. ✅ Include travel time delays between resources
3. ✅ Add decision steps for branching/looping
4. ✅ Always end with an EXIT or departure step
5. ✅ Use proper distribution types (normal, uniform, exponential, etc.)
6. ✅ All times in MINUTES
7. ✅ Make the simulation COMPLETE and SOPHISTICATED
8. ✅ arrivalPattern MUST have "rate" and "rateUnit" fields
9. ✅ All durations MUST have "type", "parameters", and "unit" fields

10. ⚠️ ASSUMPTIONS AND MISSING INFORMATION - BE THOROUGH:

   **missingInformation**: Document ANY information that was:
   - Not explicitly stated in the document
   - Ambiguous or unclear
   - Estimated from partial data

   Each missing info item MUST have:
   - category: "capacity", "timing", "routing", "arrival_pattern", "resource_count"
   - description: What specific information is missing
   - severity: "critical", "important", or "minor"
   - suggestedDefault: The value you used as a default
   - impact: How this uncertainty affects simulation results

   Examples:
   - "Document says 'several workers' - used 3 as default"
   - "Processing time described as 'quick' - estimated 2 minutes"
   - "Queue priority not specified - assumed FIFO"

   **assumptions**: Document ANY logical reasoning or industry standards you applied:

   Each assumption MUST have:
   - category: Type of assumption (arrival_pattern, processing_time, capacity, routing, etc.)
   - description: What you assumed
   - rationale: WHY you made this assumption (cite document quotes or standard practices)
   - confidence: "high", "medium", or "low"

   Examples:
   - "Assumed Poisson arrivals because document says 'random customer arrival'"
   - "Assumed normal distribution for service time because 'typically 5 minutes' suggests variance"
   - "Assumed FIFO queue discipline (standard for service systems)"
   - "Assumed 8-hour operating day (industry standard)"

   BE COMPREHENSIVE - List 3-10 assumptions and 0-5 missing information items.
   This helps users understand simulation confidence and what to validate.

RETURN ONLY THE JSON OBJECT matching the example structure above.`;
}

export async function extractSystemFromDocument(
  documentContent: string,
  documentType: 'pdf' | 'word' | 'text'
): Promise<ExtractionResult> {
  const API_KEY = getAPIKey(); // Read API key at runtime

  if (!API_KEY) {
    console.error('[Extractor] OPENAI_API_KEY is not set in process.env');
    console.error('[Extractor] Available env vars:', Object.keys(process.env).filter(k => k.includes('API')));
    throw new Error('OPENAI_API_KEY not configured in .env file');
  }

  console.log('[Extractor] Starting extraction with GPT-4-Turbo...');
  console.log('[Extractor] API key available:', API_KEY.length, 'chars');
  console.log('[Extractor] Content length:', documentContent.length);
  console.log('[Extractor] Document type:', documentType);

  const request: OpenAIRequest = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an expert in discrete event simulation (DES) and industrial engineering. You extract complete system models from documents for simulation software like Simio, Arena, or AnyLogic.

You are meticulous about:
- Identifying ALL entities (customers, parts, products)
- Identifying ALL resources (machines, staff, equipment)
- Identifying ALL processes (steps, activities, operations)
- Determining process sequences and flow logic
- Extracting timing data and converting to minutes
- Identifying system objectives and performance goals

You ALWAYS extract comprehensive data and return valid JSON matching the exact structure requested.`
      },
      {
        role: 'user',
        content: buildExtractionPrompt(documentContent, documentType)
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
      console.error('[Extractor] OpenAI error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as OpenAIResponse;
    console.log('[Extractor] Response received');
    console.log('[Extractor] Tokens used:', data.usage.total_tokens);

    const responseText = data.choices[0]?.message?.content || '';
    const extracted = extractJSON(responseText);

    console.log('[Extractor] Extracted:', 
      extracted.entities?.length || 0, 'entities,',
      extracted.resources?.length || 0, 'resources,',
      extracted.processes?.length || 0, 'processes'
    );

    // Validate we got something
    if (!extracted.entities || extracted.entities.length === 0) {
      console.warn('[Extractor] Warning: No entities extracted');
    }
    if (!extracted.resources || extracted.resources.length === 0) {
      console.warn('[Extractor] Warning: No resources extracted');
    }
    if (!extracted.processes || extracted.processes.length === 0) {
      console.warn('[Extractor] Warning: No processes extracted');
    }

    return {
      success: true,
      system: extracted as ExtractedSystem,
      warnings: [],
      tokensUsed: {
        input: data.usage.prompt_tokens,
        output: data.usage.completion_tokens
      }
    };
  } catch (error) {
    console.error('[Extractor] Extraction failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      warnings: ['Failed to extract system from document']
    };
  }
}
