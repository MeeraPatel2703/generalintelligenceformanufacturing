# 🤖 Chatbot Sidebar - Setup & Usage Guide

## Overview

The **Chatbot Sidebar** is an NLP-powered AI assistant that allows users to interact with simulation data and run scenarios using natural language. Built with OpenAI's GPT-4 and function calling capabilities.

---

## Features

### ✅ Query Mode
Ask questions about existing simulation data:
- "What was the average throughput?"
- "Show me utilization for all resources"
- "What's the cycle time?"

### ✅ Scenario Running
Request new simulation runs with natural language:
- "Run a scenario with Machine1 capacity of 3"
- "Test with arrival rate of 50 per hour"
- "Simulate with 2x processing time for all machines"

### ✅ Comparison Mode
Compare multiple scenarios side-by-side:
- "Compare scenario 1 vs scenario 2"
- "Show throughput differences between scenarios"

### ✅ Bottleneck Analysis
Identify and analyze performance bottlenecks:
- "What's the bottleneck?"
- "Which resource has highest utilization?"
- "Analyze performance issues"

### ✅ Optimization
Get optimization recommendations:
- "Optimize for maximum throughput"
- "How can I reduce cycle time?"
- "Minimize cost while maintaining throughput"

---

## Installation & Setup

### 1. Prerequisites

**OpenAI API Key Required:**
- Sign up at https://platform.openai.com/
- Create an API key in your account settings
- You'll need access to GPT-4 models (recommended: `gpt-4-turbo-preview`)

### 2. Configuration

Create a `.env` file in the project root (`/Users/meerapatel/simiodestroyer/factory-sim/.env`):

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:**
- Replace `sk-proj-xxxxxxx...` with your actual OpenAI API key
- Never commit the `.env` file to version control
- The `.env` file is already in `.gitignore`

### 3. Verify Installation

The chatbot service initializes automatically when the app starts. Check the console logs:

```
[Main] ✓ Loaded .env from: /path/to/.env
[Main] ✓ OPENAI_API_KEY is available (length: 51)
[Main] ✓ Chatbot initialized
```

If you see `⚠️  Chatbot not initialized`, check that your `.env` file is in the correct location and contains a valid API key.

---

## Architecture

### Frontend Components

**`ChatbotSidebar.tsx`** (`/src/components/ChatbotSidebar.tsx`)
- Collapsible sidebar UI
- Message history with user/assistant roles
- Input field with keyboard shortcuts
- Loading states and typing indicators
- Formatted display of function results (tables, charts)

**`chatbot.css`** (`/src/styles/chatbot.css`)
- Industrial theme styling
- Animations (message slide-in, typing indicator)
- Responsive design for mobile
- Result table formatting

### Backend Services

**`chatbotService.ts`** (`/electron/chatbotService.ts`)
- OpenAI integration with function calling
- System prompt for simulation domain
- 6 callable functions mapped to simulation actions
- Conversation context management
- Error handling

### Integration Points

**`main.ts`** - IPC handler for chatbot messages
```typescript
ipcMain.handle('chatbot:sendMessage', async (_event, request) => {
  const response = await handleChatbotMessage(request)
  return response
})
```

**`preload.ts`** - Exposed API to renderer
```typescript
chatbot: {
  sendMessage: (request: any) => Promise<any>
}
```

---

## Function Definitions

The chatbot has access to 6 functions it can call:

### 1. `querySimulationData`
**Purpose:** Query existing simulation results with filters

**Parameters:**
```typescript
{
  filters?: {
    scenarioId?: string
    resourceId?: string
    timeRange?: { start: number; end: number }
  }
  metrics: string[] // ['throughput', 'utilization', 'cycleTime', etc.]
  aggregation?: 'mean' | 'min' | 'max' | 'sum' | 'count'
}
```

**Example:**
> "What was the average throughput and cycle time?"

### 2. `runScenario`
**Purpose:** Run a new simulation with specified parameters

**Parameters:**
```typescript
{
  scenarioName?: string
  parameters: {
    resourceCapacities?: { "Machine1": 2, "Machine2": 3 }
    arrivalRate?: number
    processingTimes?: { "Machine1": 10.5 }
    duration?: number
    replications?: number
  }
  description?: string
}
```

**Example:**
> "Run a scenario with Machine1 capacity of 3 and 100 replications"

### 3. `compareScenarios`
**Purpose:** Compare multiple scenarios side-by-side

**Parameters:**
```typescript
{
  scenarioIds: string[]
  metrics: string[]
  showDifference?: boolean
}
```

**Example:**
> "Compare throughput and cycle time for the last two scenarios"

### 4. `getStatistics`
**Purpose:** Get detailed statistics for a metric

**Parameters:**
```typescript
{
  metric: string
  groupBy?: 'resource' | 'entityType' | 'timeInterval'
  statisticType?: 'mean' | 'median' | 'stddev' | 'percentile' | 'histogram'
  percentile?: number
}
```

**Example:**
> "Show me the 95th percentile cycle time by resource"

### 5. `analyzeBottleneck`
**Purpose:** Identify and analyze bottlenecks

**Parameters:**
```typescript
{
  scenarioId?: string
  threshold?: number // Default 0.85 (85% utilization)
}
```

**Example:**
> "What's the primary bottleneck?"

### 6. `optimizeParameters`
**Purpose:** Optimize parameters for an objective

**Parameters:**
```typescript
{
  objective: 'maximize_throughput' | 'minimize_cycle_time' | 'minimize_cost' | 'maximize_utilization'
  constraints?: {
    maxResourceCapacity?: { "Machine1": 5 }
    maxCost?: number
    minThroughput?: number
  }
  parameters: string[]
}
```

**Example:**
> "Optimize for maximum throughput with max capacity of 5 per machine"

---

## Usage Examples

### Basic Query
```
User: "What was the average throughput?"
Bot: "Based on the simulation results, the average throughput was **45.2 parts per hour** with a 95% confidence interval of [43.8, 46.6]."
```

### Run New Scenario
```
User: "Run a scenario with Machine1 capacity increased to 3"
Bot: "Running simulation with modified parameters...
✅ Scenario completed successfully!
- Throughput: 52.3 parts/hr (+15.7% improvement)
- Cycle Time: 18.5 minutes (-12.3%)
- Replications: 30"
```

### Compare Scenarios
```
User: "Compare the baseline vs the last scenario"
Bot: "Here's the comparison:

| Metric      | Baseline | Scenario 1 | Difference |
|-------------|----------|------------|------------|
| Throughput  | 45.2/hr  | 52.3/hr    | +15.7%     |
| Cycle Time  | 21.2 min | 18.5 min   | -12.7%     |
| Utilization | 85.3%    | 92.1%      | +6.8pp     |

🏆 Winner: Scenario 1 (Throughput: 52.3/hr)"
```

### Bottleneck Analysis
```
User: "What's the bottleneck?"
Bot: "🚨 Primary Bottleneck: Machine2

Details:
- Utilization: 94.7%
- Queue Length: 8.3 entities
- Impact Score: 95/100

Recommendations:
• Add parallel capacity to Machine2
• Reduce processing time variance
• Implement buffer before Machine2"
```

### Optimization
```
User: "Optimize for maximum throughput"
Bot: "Running optimization with genetic algorithm...

Optimal Parameters:
- Machine1 capacity: 2
- Machine2 capacity: 3
- Processing times optimized

Projected Improvement:
- Throughput: +18.5% (to 53.6/hr)
- Confidence: 85%
- Iterations: 50
- Status: Converged"
```

---

## UI Features

### Collapsible Sidebar
- **Toggle Button:** Fixed floating button (💬) in bottom-right corner
- **Slide Animation:** Smooth 300ms transition
- **Width:** 400px on desktop, 100vw on mobile
- **Position:** Fixed overlay, doesn't push main content

### Chat Interface
- **Message History:** Scrollable with auto-scroll to latest
- **User Messages:** Right-aligned, primary color background
- **Assistant Messages:** Left-aligned, tertiary background
- **Timestamps:** Shown below each message
- **Loading Indicator:** Animated typing dots (●●●)

### Input Controls
- **Text Input:** Monospace font, matches industrial theme
- **Send Button:** Arrow icon (➤), disabled when empty
- **Keyboard Shortcuts:**
  - `Enter` - Send message
  - `Shift+Enter` - New line
- **Clear History:** Trash icon (🗑️) in header

### Result Formatting
- **Tables:** Formatted with headers, borders, hover effects
- **Metrics:** Color-coded (green for good, red for bad)
- **Bottlenecks:** Red highlight boxes
- **Winners:** Green highlight with trophy icon
- **Code/Values:** Monospace inline code blocks

---

## Customization

### Modify System Prompt
Edit `SYSTEM_PROMPT` in `/electron/chatbotService.ts`:

```typescript
const SYSTEM_PROMPT = `You are an expert simulation analyst...`
```

### Add New Functions
1. Define function schema in `SIMULATION_FUNCTIONS` array
2. Implement function in `executeFunction()` switch statement
3. Add to TypeScript types in `/src/types/chatbot.ts`

Example:
```typescript
{
  name: 'predictFailure',
  description: 'Predict equipment failure probability',
  parameters: {
    type: 'object',
    properties: {
      resourceId: { type: 'string' },
      timeHorizon: { type: 'number' }
    },
    required: ['resourceId']
  }
}
```

### Styling
Edit `/src/styles/chatbot.css`:
- Change colors, fonts, spacing
- Modify animations
- Add custom result formatters

---

## Performance & Costs

### Token Usage
- **Average Query:** ~500-1000 tokens
- **With Function Call:** ~1500-2500 tokens
- **Cost per query:** $0.01-$0.03 (GPT-4 Turbo)

### Optimization Tips
1. **Limit conversation history:** Keep last 10 messages only (already implemented)
2. **Use GPT-3.5-turbo for simple queries:** Change model in service
3. **Cache responses:** Store common queries
4. **Batch operations:** Process multiple requests together

### Rate Limits
OpenAI API limits (Tier 1):
- **Requests:** 500/min
- **Tokens:** 10,000/min
- **Daily:** 200,000 tokens

For production, consider:
- Implementing request queuing
- Adding rate limit handling
- Caching frequent queries

---

## Troubleshooting

### Chatbot Not Initializing
**Symptom:** `⚠️  Chatbot not initialized` in console

**Solutions:**
1. Check `.env` file exists and contains `OPENAI_API_KEY`
2. Verify API key is valid (test at https://platform.openai.com/)
3. Ensure `.env` is in project root
4. Restart Electron app after changing `.env`

### No Response from Chatbot
**Symptom:** Loading forever, no error message

**Solutions:**
1. Check network connection
2. Verify API key has credits/billing enabled
3. Check OpenAI API status (https://status.openai.com/)
4. Look for errors in main process console

### Function Calls Failing
**Symptom:** Bot responds but function results show errors

**Solutions:**
1. Ensure simulation has been run (currentResults exists)
2. Check function parameters match schema
3. Verify data format matches expected types
4. Add error logging in `executeFunction()`

### Styling Issues
**Symptom:** Sidebar looks broken or misaligned

**Solutions:**
1. Clear browser cache
2. Check `chatbot.css` is imported
3. Verify CSS variables are defined in `industrial-theme.css`
4. Test on different screen sizes

---

## Security Considerations

### API Key Protection
- ✅ Never commit `.env` to version control
- ✅ Use environment variables, not hardcoded keys
- ✅ `.env` is in `.gitignore`
- ✅ API key only accessible in main process (Electron)

### User Input Validation
- ✅ Sanitize user messages before sending to OpenAI
- ✅ Validate function parameters
- ✅ Limit message length (max 1000 chars)
- ⚠️ Consider adding rate limiting per user

### Data Privacy
- ⚠️ Simulation data is sent to OpenAI for processing
- ⚠️ Consider implementing data anonymization
- ⚠️ Review OpenAI's data usage policy
- ⚠️ For sensitive data, consider self-hosted LLM

---

## Future Enhancements

### Planned Features
1. **Voice Input:** Speech-to-text for hands-free queries
2. **Multi-turn Planning:** "Let's optimize this step-by-step"
3. **Chart Generation:** Visual charts from queries
4. **Export Conversations:** Save chat history to file
5. **Suggested Prompts:** Common query templates
6. **Context Awareness:** Remember previous scenarios
7. **Real-time Collaboration:** Multi-user chat

### Integration Ideas
1. **Slack Bot:** Query simulations from Slack
2. **Email Reports:** Scheduled simulation summaries
3. **Alert System:** Notify when bottlenecks detected
4. **Custom Dashboards:** Auto-generate based on queries

---

## API Reference

### Frontend API

```typescript
// Send message to chatbot
const response = await (window as any).electron.chatbot.sendMessage({
  message: string,
  system: ExtractedSystem,
  currentResults?: ComprehensiveSimulationResults,
  conversationHistory: ChatMessage[]
})

// Response format
{
  message: string,              // Bot's text response
  functionCall?: {              // If function was called
    name: string,
    arguments: any
  },
  functionResult?: any,         // Function execution result
  error?: string                // Error message if failed
}
```

### Backend Functions

```typescript
// Initialize chatbot (called in main.ts)
initializeChatbot(apiKey: string): void

// Handle message (called by IPC handler)
handleChatbotMessage(request: ChatbotRequest): Promise<ChatbotResponse>

// Execute individual functions
querySimulationData(args, system, results): QueryResult
runScenario(args, system): Promise<ScenarioResult>
compareScenarios(args): ComparisonResult
getStatistics(args, results): StatisticsResult
analyzeBottleneck(args, system, results): BottleneckAnalysis
optimizeParameters(args, system): OptimizationResult
```

---

## Testing

### Manual Testing Checklist
- [ ] Chatbot sidebar opens/closes
- [ ] Welcome message displays
- [ ] Can send messages
- [ ] Bot responds with text
- [ ] Function calls execute correctly
- [ ] Results display formatted properly
- [ ] Error messages show when appropriate
- [ ] Clear history works
- [ ] Mobile responsive
- [ ] Keyboard shortcuts work

### Example Test Queries
```
1. "What was the throughput?"
2. "Run a scenario with 2x capacity"
3. "Compare the last 2 scenarios"
4. "What's the bottleneck?"
5. "Optimize for maximum throughput"
6. "Show me queue statistics"
7. "What if I reduce processing time by 20%?"
```

---

## Support

### Resources
- **OpenAI Docs:** https://platform.openai.com/docs
- **Function Calling Guide:** https://platform.openai.com/docs/guides/function-calling
- **GPT-4 Pricing:** https://openai.com/pricing

### Contact
For issues or questions:
1. Check console logs first (`Ctrl+Shift+I` in Electron)
2. Review this guide thoroughly
3. Test with simple queries before complex ones
4. Check OpenAI API status

---

## Summary

The Chatbot Sidebar brings NLP-powered interaction to your simulation platform:

✅ **6 powerful functions** for querying, running, and optimizing simulations
✅ **Natural language interface** - no SQL or code required
✅ **Integrated seamlessly** into IntegratedSimulation page
✅ **Production-ready** with error handling and loading states
✅ **Extensible architecture** - easy to add new functions

**Next Steps:**
1. Set up your OpenAI API key in `.env`
2. Start the app: `npm run dev`
3. Open the chatbot sidebar (💬 button)
4. Try: "What was the average throughput?"

**Happy simulating! 🚀**