import { FactoryAnalysis } from '../src/types/analysis';

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
  const columnNames = lines[0] || '';
  const totalRows = lines.length - 1;

  return `You are analyzing factory DCS/SCADA data to extract simulation parameters. You MUST return ONLY valid JSON.

CSV DATA (first ${MAX_ROWS} rows):
\`\`\`
${csvPreview}
\`\`\`

ANALYSIS REQUIREMENTS:

1. IDENTIFY MACHINES:
   - Parse equipment_id, tag_id, or similar columns
   - Look for patterns: "M001", "CNC_A", "ASSEMBLY_1", "QC01", "MILL_B"
   - Group all tags by machine identifier
   - Determine machine type based on naming:
     * CNC/MILL/LATHE/MACH → "CNC"
     * ASSEMBLY/ASSY/AS → "Assembly"  
     * QC/INSPECT/TEST → "QualityControl"
     * BUFFER/STORAGE/WAREHOUSE → "Storage"

2. EXTRACT CYCLE TIMES (per machine):
   - Find tags with "CYCLE", "TIME", "DURATION", "PROCESSING"
   - Calculate statistical mean and standard deviation
   - **CRITICAL**: Convert ALL times to MINUTES (not seconds/hours)
   - Use "normal" distribution type for varying times
   - Use "constant" for fixed cycle times

3. CALCULATE UTILIZATION (per machine):
   - Find tags with "UTIL", "UPTIME", "STATE", "STATUS"
   - Calculate average and maximum utilization %
   - Flag as bottleneck if avg > 90%
   - Look at time machine spends in "busy" vs "idle" state

4. ANALYZE QUEUE PATTERNS (per machine):
   - Find tags with "QUEUE", "BUFFER", "WIP", "BACKLOG", "WAITING"
   - Calculate average queue length over time
   - Detect if queue is GROWING (increasing trend)
   - Growing queues indicate downstream bottlenecks

5. DETERMINE FLOW SEQUENCE:
   - Order machines by when they process parts
   - Use timestamp correlation and queue transfers
   - Typical flow: Raw → CNC → Assembly → QC → Storage
   - Return array of machine IDs in processing order

6. IDENTIFY BOTTLENECK:
   - Find machine with highest utilization (>90%)
   - Check for growing downstream queues
   - Explain WHY this machine limits throughput
   - Provide specific numbers (utilization %, queue length)

7. DATA QUALITY ASSESSMENT:
   - Total rows: ${totalRows}
   - Calculate time span in hours (first timestamp to last)
   - Estimate % of missing/invalid data points

REQUIRED JSON STRUCTURE:
{
  "machines": [
    {
      "id": "M001",
      "name": "CNC Machine 1", 
      "type": "CNC",
      "plc_tag_prefix": "M001_",
      "cycle_time": {
        "mean": 12.4,
        "std_dev": 1.2,
        "unit": "min",
        "distribution_type": "normal"
      },
      "utilization": {
        "avg": 89.2,
        "max": 95.8,
        "is_bottleneck": false
      },
      "queue_pattern": {
        "avg_length": 2.3,
        "is_growing": false
      }
    }
  ],
  "flow_sequence": ["M001", "AS01", "QC01"],
  "bottleneck": {
    "machine_id": "QC01",
    "reason": "Highest utilization at 97.2% with growing queue of 18 parts backing up to upstream machines",
    "utilization_pct": 97.2,
    "queue_length": 18,
    "severity": "high"
  },
  "data_quality": {
    "total_rows": ${totalRows},
    "time_span_hours": 24.5,
    "missing_data_pct": 2.1
  }
}

CRITICAL RULES:
- Return ONLY the JSON object, no markdown, no explanations
- ALL cycle times MUST be in MINUTES
- ALL numbers must be numeric type, not strings
- Provide detailed bottleneck reasoning with specific data
- Ensure every machine has complete data structure
- Use statistical analysis, not guesswork`;
}

export async function analyzeFactoryData(csvContent: string): Promise<FactoryAnalysis> {
  if (!API_KEY) {
    throw new Error('OPENAI_API_KEY not configured in .env file');
  }

  console.log('[AI] Starting analysis with OpenAI GPT-4-Turbo (quality optimized)...');
  console.log('[AI] CSV size:', csvContent.length, 'characters');

  const request: OpenAIRequest = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 0.0, // Deterministic output for structured data
    response_format: { type: 'json_object' }, // Force valid JSON
    messages: [
      {
        role: 'system',
        content: `You are an expert industrial engineer and data analyst specializing in discrete event simulation and factory optimization. 

You analyze DCS/SCADA data exports to extract accurate machine parameters for simulation models. You are meticulous about:
- Correctly identifying unique machines from tag patterns
- Calculating accurate statistical distributions (mean, std dev)
- Converting all time units to minutes
- Identifying bottlenecks using utilization and queue analysis
- Providing detailed, data-driven explanations

You ALWAYS return valid JSON matching the exact structure requested. You NEVER add extra text, markdown, or explanations outside the JSON.`
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
      console.error('[AI] OpenAI error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as OpenAIResponse;
    console.log('[AI] Response received from OpenAI');
    console.log('[AI] Token usage - Prompt:', data.usage.prompt_tokens, 
                'Completion:', data.usage.completion_tokens, 
                'Total:', data.usage.total_tokens);

    const responseText = data.choices[0]?.message?.content || '';
    console.log('[AI] Response length:', responseText.length, 'characters');

    const analysis = extractJSON(responseText);
    console.log('[AI] Successfully parsed analysis');
    console.log('[AI] Found', analysis.machines?.length || 0, 'machines');

    // Validate response structure
    if (!analysis.machines || !Array.isArray(analysis.machines)) {
      throw new Error('Invalid response: missing machines array');
    }

    if (!analysis.flow_sequence || !Array.isArray(analysis.flow_sequence)) {
      throw new Error('Invalid response: missing flow_sequence array');
    }

    if (!analysis.bottleneck) {
      throw new Error('Invalid response: missing bottleneck analysis');
    }

    return analysis as FactoryAnalysis;
  } catch (error) {
    console.error('[AI] Analysis failed:', error);
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
    Array.isArray(analysis.flow_sequence) &&
    analysis.bottleneck &&
    typeof analysis.bottleneck === 'object' &&
    analysis.data_quality &&
    typeof analysis.data_quality === 'object'
  );
}
