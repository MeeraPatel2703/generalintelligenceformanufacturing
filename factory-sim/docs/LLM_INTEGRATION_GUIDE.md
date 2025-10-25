# LLM Integration Guide

## Overview

This guide shows you how to integrate the DES Parser with your LLM provider (OpenAI, Anthropic, etc.).

---

## OpenAI Integration

### 1. Install OpenAI SDK

```bash
npm install openai
```

### 2. Update `desParser.ts`

Replace the `callLLM()` method:

```typescript
import OpenAI from 'openai';

export class DESParser {
  private openai: OpenAI;

  constructor(config: Partial<ParserConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  private async callLLM(systemPrompt: string, userMessage: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      return content;
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw error;
    }
  }
}
```

### 3. Set Environment Variable

```bash
export OPENAI_API_KEY="sk-..."
```

### 4. Use Parser

```typescript
const parser = new DESParser();
const result = await parser.parseText(description);
```

---

## Anthropic (Claude) Integration

### 1. Install Anthropic SDK

```bash
npm install @anthropic-ai/sdk
```

### 2. Update `desParser.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';

export class DESParser {
  private anthropic: Anthropic;

  constructor(config: Partial<ParserConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  private async callLLM(systemPrompt: string, userMessage: string): Promise<string> {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage }
        ],
        temperature: 0
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Expected text response from Claude');
      }

      return content.text;
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        throw new Error(`Anthropic API error: ${error.message}`);
      }
      throw error;
    }
  }
}
```

### 3. Set Environment Variable

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

---

## Using Function Calling (OpenAI)

For more structured output, use function calling:

```typescript
private async callLLM(systemPrompt: string, userMessage: string): Promise<string> {
  const tools: OpenAI.Chat.ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: 'emit_process_graph',
        description: 'Output a validated DES ProcessGraph JSON',
        parameters: {
          type: 'object',
          properties: {
            entities: {
              type: 'array',
              items: { type: 'object' }
            },
            arrivals: {
              type: 'array',
              items: { type: 'object' }
            },
            stations: {
              type: 'array',
              items: { type: 'object' }
            },
            routes: {
              type: 'array',
              items: { type: 'object' }
            },
            runConfig: {
              type: 'object'
            },
            metadata: {
              type: 'object'
            }
          },
          required: ['entities', 'arrivals', 'stations', 'routes', 'runConfig', 'metadata']
        }
      }
    }
  ];

  const response = await this.openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    tools,
    tool_choice: { type: 'function', function: { name: 'emit_process_graph' } },
    temperature: 0
  });

  const toolCall = response.choices[0].message.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== 'emit_process_graph') {
    throw new Error('Expected emit_process_graph function call');
  }

  return toolCall.function.arguments;
}
```

---

## Using Tool Calling (Anthropic Claude)

```typescript
private async callLLM(systemPrompt: string, userMessage: string): Promise<string> {
  const tools: Anthropic.Tool[] = [
    {
      name: 'emit_process_graph',
      description: 'Output a validated DES ProcessGraph JSON',
      input_schema: {
        type: 'object',
        properties: {
          entities: { type: 'array' },
          arrivals: { type: 'array' },
          stations: { type: 'array' },
          routes: { type: 'array' },
          runConfig: { type: 'object' },
          metadata: { type: 'object' }
        },
        required: ['entities', 'arrivals', 'stations', 'routes', 'runConfig', 'metadata']
      }
    }
  ];

  const response = await this.anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8192,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userMessage }
    ],
    tools,
    tool_choice: { type: 'tool', name: 'emit_process_graph' }
  });

  const toolUse = response.content.find(c => c.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use' || toolUse.name !== 'emit_process_graph') {
    throw new Error('Expected emit_process_graph tool use');
  }

  return JSON.stringify(toolUse.input);
}
```

---

## Error Handling & Retries

Add retry logic for reliability:

```typescript
private async callLLM(
  systemPrompt: string,
  userMessage: string,
  retries = 3
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await this.openai.chat.completions.create({
        // ... configuration
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      return content;

    } catch (error) {
      lastError = error as Error;

      if (error instanceof OpenAI.APIError) {
        // Rate limit - wait and retry
        if (error.status === 429) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${retries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // Other API errors - don't retry
        throw new Error(`OpenAI API error: ${error.message}`);
      }

      // Network error - retry
      if (attempt < retries - 1) {
        console.log(`Network error, retrying ${attempt + 1}/${retries}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
    }
  }

  throw new Error(`Failed after ${retries} attempts: ${lastError?.message}`);
}
```

---

## Token Usage Tracking

Track token usage for cost monitoring:

```typescript
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
    tokensUsed?: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
}

private async callLLM(systemPrompt: string, userMessage: string): Promise<{
  content: string;
  tokensUsed: { prompt: number; completion: number; total: number };
}> {
  const response = await this.openai.chat.completions.create({
    // ... configuration
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  return {
    content,
    tokensUsed: {
      prompt: response.usage?.prompt_tokens || 0,
      completion: response.usage?.completion_tokens || 0,
      total: response.usage?.total_tokens || 0
    }
  };
}
```

---

## Streaming Support (Optional)

For better UX, add streaming:

```typescript
async parseTextStreaming(
  text: string,
  onProgress?: (chunk: string) => void
): Promise<ParserResult> {
  const systemPrompt = await this.loadSystemPrompt();

  const stream = await this.openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ],
    stream: true,
    temperature: 0
  });

  let fullResponse = '';

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    fullResponse += content;
    if (onProgress) {
      onProgress(content);
    }
  }

  const processGraph = this.extractProcessGraph(fullResponse);
  return this.validateAndRepair(processGraph);
}

// Usage:
const result = await parser.parseTextStreaming(description, (chunk) => {
  console.log('Streaming:', chunk);
});
```

---

## Cost Optimization

### 1. Cache System Prompt

The master system prompt is ~2000 tokens - cache it if your provider supports prompt caching:

**Anthropic (Claude):**
```typescript
const response = await this.anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 8192,
  system: [
    {
      type: 'text',
      text: systemPrompt,
      cache_control: { type: 'ephemeral' }
    }
  ],
  messages: [{ role: 'user', content: userMessage }]
});
```

**Savings: ~90% on prompt tokens for subsequent calls**

### 2. Use Smaller Models for Repair

Use a smaller/faster model for repair attempts:

```typescript
private async callLLM(
  systemPrompt: string,
  userMessage: string,
  isRepair = false
): Promise<string> {
  const model = isRepair ? 'gpt-3.5-turbo' : 'gpt-4-turbo-preview';

  const response = await this.openai.chat.completions.create({
    model,
    // ... rest of config
  });

  // ...
}
```

### 3. Batch Processing

Process multiple documents in one call if they're small:

```typescript
async parseMultiple(descriptions: string[]): Promise<ParserResult[]> {
  const systemPrompt = await this.loadSystemPrompt();

  const batchPrompt = `
Parse the following ${descriptions.length} simulation descriptions.
Output an array of ProcessGraph objects, one for each description.

${descriptions.map((desc, i) => `
## Description ${i + 1}:
${desc}
`).join('\n')}
`;

  const response = await this.callLLM(systemPrompt, batchPrompt);
  const graphs = JSON.parse(response); // Array of ProcessGraphs

  return Promise.all(graphs.map(g => this.validateAndRepair(g)));
}
```

---

## Environment Configuration

### `.env` file:

```bash
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Parser config
PARSER_MAX_REPAIR_ATTEMPTS=2
PARSER_ENABLE_LOGGING=true
PARSER_STRICT_MODE=false
```

### Load config:

```typescript
import dotenv from 'dotenv';
dotenv.config();

const parser = new DESParser({
  maxRepairAttempts: parseInt(process.env.PARSER_MAX_REPAIR_ATTEMPTS || '2'),
  enableLogging: process.env.PARSER_ENABLE_LOGGING === 'true',
  strictMode: process.env.PARSER_STRICT_MODE === 'true'
});
```

---

## Testing with Mock LLM

For testing without API calls:

```typescript
export class MockLLMParser extends DESParser {
  private mockResponses: Map<string, string> = new Map();

  setMockResponse(input: string, output: string) {
    this.mockResponses.set(input, output);
  }

  protected async callLLM(systemPrompt: string, userMessage: string): Promise<string> {
    const response = this.mockResponses.get(userMessage);
    if (!response) {
      throw new Error('No mock response configured for input');
    }
    return response;
  }
}

// Usage in tests:
const parser = new MockLLMParser();
parser.setMockResponse('test input', JSON.stringify({
  entities: [...],
  arrivals: [...],
  // ... valid ProcessGraph
}));

const result = await parser.parseText('test input');
expect(result.success).toBe(true);
```

---

## Complete Example

```typescript
import OpenAI from 'openai';
import { DESParser, ParserConfig } from './src/services/desParser';
import { ProcessGraph } from './src/types/processGraph';

export class OpenAIDESParser extends DESParser {
  private openai: OpenAI;

  constructor(apiKey: string, config: Partial<ParserConfig> = {}) {
    super(config);
    this.openai = new OpenAI({ apiKey });
  }

  protected async callLLM(
    systemPrompt: string,
    userMessage: string,
    retries = 3
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0,
          response_format: { type: 'json_object' }
        });

        const content = response.choices[0].message.content;
        if (!content) {
          throw new Error('Empty response from OpenAI');
        }

        return content;

      } catch (error) {
        lastError = error as Error;

        if (error instanceof OpenAI.APIError && error.status === 429) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`Rate limited, waiting ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }
    }

    throw new Error(`Failed after ${retries} attempts: ${lastError?.message}`);
  }
}

// Usage:
const parser = new OpenAIDESParser(process.env.OPENAI_API_KEY!);
const result = await parser.parseText(description);
```

---

## Summary

To integrate with an LLM:

1. ✅ Install SDK (`openai` or `@anthropic-ai/sdk`)
2. ✅ Replace `callLLM()` method in `desParser.ts`
3. ✅ Add error handling & retries
4. ✅ Track token usage
5. ✅ Optimize with caching
6. ✅ Test with mock responses

**You're now ready to parse natural language into validated ProcessGraphs!** 🚀
