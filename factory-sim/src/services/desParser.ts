// DES Parser Service with Self-Repair and Validation
// Converts natural language/documents into validated ProcessGraph JSON

import { ProcessGraph } from '../types/processGraph';
import { validateProcessGraph, ValidationResult } from '../validation/processGraphSchema';
import { readFile } from 'fs/promises';
import { parseDocument } from '../../electron/documentParser';

// ============================================================================
// PARSER CONFIGURATION
// ============================================================================

export interface ParserConfig {
  maxRepairAttempts: number;
  enableLogging: boolean;
  strictMode: boolean; // If true, fail on warnings
}

const DEFAULT_CONFIG: ParserConfig = {
  maxRepairAttempts: 2,
  enableLogging: true,
  strictMode: false
};

// ============================================================================
// PARSER RESULT
// ============================================================================

export interface ParserResult {
  success: boolean;
  processGraph?: ProcessGraph;
  validation?: ValidationResult;
  error?: string;
  repairAttempts?: number;
  warnings?: string[];
  metadata?: {
    inputType: 'text' | 'pdf' | 'docx' | 'file';
    inputSize: number;
    parseTime: number;
    tokensUsed?: number;
  };
}

// ============================================================================
// PARSER SERVICE
// ============================================================================

export class DESParser {
  private config: ParserConfig;
  private systemPrompt: string | null = null;

  constructor(config: Partial<ParserConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Load the master parser system prompt
   */
  private async loadSystemPrompt(): Promise<string> {
    if (this.systemPrompt) {
      return this.systemPrompt;
    }

    try {
      const promptPath = require.resolve('../../prompts/MASTER_DES_PARSER_PROMPT.md');
      this.systemPrompt = await readFile(promptPath, 'utf-8');
      return this.systemPrompt;
    } catch (error) {
      throw new Error('Failed to load master parser prompt');
    }
  }

  /**
   * Parse text input into ProcessGraph
   */
  async parseText(text: string): Promise<ParserResult> {
    const startTime = Date.now();

    try {
      // Load system prompt
      const systemPrompt = await this.loadSystemPrompt();

      // Call LLM with system prompt + user text
      const response = await this.callLLM(systemPrompt, text);

      // Extract JSON from response
      const processGraph = this.extractProcessGraph(response);

      // Validate and potentially repair
      const result = await this.validateAndRepair(processGraph);

      const parseTime = Date.now() - startTime;

      return {
        ...result,
        metadata: {
          inputType: 'text',
          inputSize: text.length,
          parseTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error'
      };
    }
  }

  /**
   * Parse a document file (PDF, DOCX, TXT) into ProcessGraph
   */
  async parseDocument(filePath: string): Promise<ParserResult> {
    const startTime = Date.now();

    try {
      // Parse document to text
      const docResult = await parseDocument(filePath);

      if (!docResult.success || !docResult.content) {
        return {
          success: false,
          error: docResult.error || 'Failed to parse document'
        };
      }

      // Parse the extracted text
      const result = await this.parseText(docResult.content);

      // Update metadata
      if (result.metadata) {
        result.metadata.inputType = 'file';
        result.metadata.parseTime = Date.now() - startTime;
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown document parsing error'
      };
    }
  }

  /**
   * Validate and repair ProcessGraph
   */
  private async validateAndRepair(
    processGraph: any,
    attempt = 0
  ): Promise<ParserResult> {
    // Validate against schema
    const validation = validateProcessGraph(processGraph);

    if (validation.valid) {
      return {
        success: true,
        processGraph: processGraph as ProcessGraph,
        validation,
        repairAttempts: attempt
      };
    }

    // If validation failed and we haven't exceeded max attempts, try to repair
    if (attempt < this.config.maxRepairAttempts) {
      if (this.config.enableLogging) {
        console.log(`[DESParser] Validation failed (attempt ${attempt + 1}), attempting repair...`);
        console.log('[DESParser] Errors:', validation.errors);
      }

      // Generate repair prompt
      const repairPrompt = this.generateRepairPrompt(processGraph, validation);

      try {
        // Call LLM with repair instructions
        const systemPrompt = await this.loadSystemPrompt();
        const response = await this.callLLM(systemPrompt, repairPrompt);

        // Extract repaired graph
        const repairedGraph = this.extractProcessGraph(response);

        // Recursively validate and repair
        return this.validateAndRepair(repairedGraph, attempt + 1);
      } catch (error) {
        return {
          success: false,
          error: `Repair attempt ${attempt + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          validation,
          repairAttempts: attempt
        };
      }
    }

    // Max attempts exceeded
    return {
      success: false,
      error: `Validation failed after ${this.config.maxRepairAttempts} repair attempts`,
      validation,
      repairAttempts: attempt
    };
  }

  /**
   * Generate repair prompt from validation errors
   */
  private generateRepairPrompt(processGraph: any, validation: ValidationResult): string {
    const errors = validation.errors.map(e => `- ${e.path}: ${e.message}`).join('\n');

    return `
The following ProcessGraph JSON has validation errors. Please fix them and return the corrected JSON.

VALIDATION ERRORS:
${errors}

CURRENT JSON:
${JSON.stringify(processGraph, null, 2)}

INSTRUCTIONS:
1. Fix each validation error listed above
2. Ensure all units are normalized (minutes, feet, ft/s, entities/hour)
3. Ensure triangular distributions satisfy: min <= mode <= max
4. Ensure route probabilities sum to 1.0
5. Ensure all references exist (stations, resources, calendars)
6. Do NOT fabricate new data - only fix structural/validation issues
7. Return ONLY the corrected JSON in the emit_process_graph tool call format

Return the repaired ProcessGraph now.
`;
  }

  /**
   * Call LLM with system prompt and user message
   * This is a placeholder - integrate with your actual LLM service
   */
  private async callLLM(systemPrompt: string, userMessage: string): Promise<string> {
    // TODO: Integrate with actual LLM (OpenAI, Anthropic, etc.)
    // For now, this is a stub that would need to be replaced

    throw new Error(
      'LLM integration not implemented. Please integrate with OpenAI/Anthropic API in callLLM()'
    );

    // Example integration would look like:
    /*
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0,
      response_format: { type: 'json_object' }
    });

    return response.choices[0].message.content || '';
    */
  }

  /**
   * Extract ProcessGraph JSON from LLM response
   */
  private extractProcessGraph(response: string): any {
    try {
      // Try to parse as direct JSON first
      const parsed = JSON.parse(response);

      // Check if it's a tool call format
      if (parsed.name === 'emit_process_graph' && parsed.arguments) {
        return parsed.arguments;
      }

      // Otherwise assume it's the graph directly
      return parsed;
    } catch (error) {
      // Try to extract JSON from markdown code blocks
      const match = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) {
        const parsed = JSON.parse(match[1]);
        if (parsed.name === 'emit_process_graph' && parsed.arguments) {
          return parsed.arguments;
        }
        return parsed;
      }

      // Try to find any JSON object in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.name === 'emit_process_graph' && parsed.arguments) {
          return parsed.arguments;
        }
        return parsed;
      }

      throw new Error('Could not extract valid JSON from LLM response');
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Parse text directly with default config
 */
export async function parseTextToProcessGraph(text: string): Promise<ParserResult> {
  const parser = new DESParser();
  return parser.parseText(text);
}

/**
 * Parse document file directly with default config
 */
export async function parseDocumentToProcessGraph(filePath: string): Promise<ParserResult> {
  const parser = new DESParser();
  return parser.parseDocument(filePath);
}

/**
 * Create a parser with custom configuration
 */
export function createParser(config: Partial<ParserConfig>): DESParser {
  return new DESParser(config);
}
