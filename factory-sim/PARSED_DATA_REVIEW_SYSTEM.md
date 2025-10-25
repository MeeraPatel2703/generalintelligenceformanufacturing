# Parsed Data Review System

## Overview

A comprehensive **Parse → Review → Simulate** workflow that gives you full control over extracted simulation parameters before running simulations.

## System Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐      ┌────────────────┐
│   Input     │ ───> │   DES Parser     │ ───> │  Review & Edit  │ ───> │   Simulation   │
│ (Text/PDF)  │      │  (LLM-powered)   │      │   Interface     │      │    Runner      │
└─────────────┘      └──────────────────┘      └─────────────────┘      └────────────────┘
                              │                          │
                              │                          │
                              v                          v
                     ┌──────────────────┐      ┌─────────────────┐
                     │  ProcessGraph    │      │  Live Validator │
                     │  JSON Schema     │      │  + Auto-Fix     │
                     └──────────────────┘      └─────────────────┘
```

## Components

### 1. **SimulationWorkflow.tsx**
Main orchestrator component that manages the 4-stage workflow:

**Stages:**
1. **Input** - Upload document or paste text
2. **Parsing** - Extract parameters using DES Parser
3. **Review** - Edit and validate extracted data
4. **Simulation** - Run DES simulation
5. **Results** - View simulation results

**Features:**
- Visual stepper showing current stage
- Error handling at each stage
- Ability to go back and re-edit
- Support for PDF, DOCX, TXT files and raw text

### 2. **ParsedDataReview.tsx**
Interactive editor for reviewing and modifying parsed simulation data.

**Editable Sections:**
- ✅ **Entities** - Entity types, classes, batch sizes, priorities
- ✅ **Arrivals** - Arrival policies (Poisson, schedule table, empirical)
- ✅ **Stations** - All station/machine parameters:
  - ID, kind (machine/buffer/source/sink/assembly/split)
  - Count (parallel servers), capacity
  - Queue discipline (FIFO/LIFO/SPT/LPT/EDD/CR/SLACK/PRIORITY)
  - Process time distributions (with editable parameters)
  - Scrap probability, yield
  - Setup configurations
  - Downtime patterns
- ✅ **Routes** - Flow routing between stations:
  - From/To station selection
  - Probability (for stochastic routing)
  - Distance, speed (for material handling)
  - Transport type (conveyor/AGV/transporter/instant)
- ✅ **Resources** - Resource pools (operators, tools, vehicles)
- ✅ **Calendars** - Shift schedules and work calendars
- ✅ **Run Config** - Simulation runtime parameters:
  - Run length (minutes)
  - Warmup period (minutes)
  - Number of replications
  - Confidence level (80%/90%/95%/99%)
- ✅ **Metadata** - Model info, assumptions, missing fields

**UI Features:**
- Expandable/collapsible cards for each item
- Add/Delete buttons for dynamic items
- Inline editing with proper input types
- Distribution parameter editors
- Summary statistics cards
- Color-coded sections

### 3. **ParsedDataValidator.tsx**
Real-time validation with auto-fix capabilities.

**Validation Checks:**

**Errors (blocking):**
- Route probabilities sum to 1.0 per station ✅ Auto-fix
- Station references exist in routes
- Triangular distribution: `min ≤ mode ≤ max` ✅ Auto-fix
- Normal distribution: `stdev > 0`
- Exponential distribution: `mean > 0`
- Uniform distribution: `min < max` ✅ Auto-fix
- Arrival policies defined (at least 1)
- Entity class references valid

**Warnings (recommended to fix):**
- Disconnected stations (no incoming/outgoing routes)
- Rework loops without escape routes
- Large number of replications (performance warning)

**Info:**
- Long run length suggestions
- Performance optimization tips

**Features:**
- Live validation (re-runs on every edit)
- Auto-fix buttons for supported issues
- Categorized by severity: Errors / Warnings / Info
- Clear suggestions for manual fixes
- Visual feedback (✓ when all clear)

### 4. **DES Parser Service** (desParser.ts)
LLM-powered parser that converts natural language/documents into `ProcessGraph` JSON.

**Features:**
- Text parsing
- Document parsing (PDF, DOCX, TXT)
- Schema validation
- Auto-repair (up to 2 attempts)
- Detailed error reporting
- Metadata tracking

**Input Types:**
```typescript
// Text
const result = await parser.parseText("We have 3 machines: CNC (12 min), Assembly (8 min), QC (5 min)...");

// Document
const result = await parser.parseDocument("/path/to/factory-model.pdf");
```

**Output:**
```typescript
interface ParserResult {
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
```

## ProcessGraph Schema

The complete DES model structure:

```typescript
interface ProcessGraph {
  entities: Entity[];           // Entity types with attributes
  arrivals: Arrival[];          // Arrival policies (Poisson, schedule, etc.)
  stations: Station[];          // Stations/machines with process times
  routes: Route[];              // Flow routing with probabilities
  resources?: ResourcePool[];   // Operator/tool pools
  calendars?: Calendar[];       // Shift schedules
  experiments?: Experiment[];   // What-if scenarios
  runConfig: RunConfig;         // Simulation runtime config
  metadata: Metadata;           // Model metadata
}
```

**Distribution Types Supported:**
- `constant` - Fixed value
- `normal` - Normal(mean, stdev)
- `lognormal` - Lognormal(mu, sigma)
- `exponential` - Exponential(mean)
- `gamma` - Gamma(shape, scale)
- `weibull` - Weibull(shape, scale)
- `uniform` - Uniform(min, max)
- `triangular` - Triangular(min, mode, max)
- `erlang` - Erlang(k, rate)
- `empirical` - Empirical(values, weights)

## Usage Example

### Basic Workflow

```tsx
import SimulationWorkflow from './components/SimulationWorkflow';

function App() {
  return <SimulationWorkflow />;
}
```

### With Pre-Parsed Data

```tsx
import SimulationWorkflow from './components/SimulationWorkflow';
import { parseTextToProcessGraph } from './services/desParser';

async function App() {
  const parserResult = await parseTextToProcessGraph("Factory with 3 machines...");

  return <SimulationWorkflow initialParserResult={parserResult} />;
}
```

### Standalone Review Component

```tsx
import ParsedDataReview from './components/ParsedDataReview';

function ReviewOnly({ processGraph, validation }) {
  const handleApprove = (editedGraph) => {
    console.log('Approved graph:', editedGraph);
    // Proceed to simulation
  };

  const handleReject = () => {
    console.log('Rejected, re-parsing...');
    // Go back to input
  };

  return (
    <ParsedDataReview
      initialGraph={processGraph}
      validation={validation}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
}
```

### Standalone Validator

```tsx
import ParsedDataValidator from './components/ParsedDataValidator';

function ValidatorOnly({ graph }) {
  const handleAutoFix = (fixedGraph) => {
    console.log('Auto-fixed graph:', fixedGraph);
    // Update state with fixed graph
  };

  return (
    <ParsedDataValidator
      graph={graph}
      onAutoFix={handleAutoFix}
    />
  );
}
```

## User Flow

### Step 1: Input
```
User provides input:
  ├─ Upload PDF/DOCX/TXT file
  └─ OR paste text description

↓ Click "Parse Input"
```

### Step 2: Parsing
```
DES Parser processes input:
  ├─ Calls LLM with master system prompt
  ├─ Extracts ProcessGraph JSON
  ├─ Validates against schema
  ├─ Auto-repairs if needed (up to 2 attempts)
  └─ Returns ParserResult

↓ Automatic on success
```

### Step 3: Review & Edit
```
User reviews extracted data:
  ├─ See live validation results
  ├─ Click section cards (Entities, Stations, Routes, etc.)
  ├─ Expand items to edit
  ├─ Modify parameters:
  │   ├─ Change cycle times
  │   ├─ Adjust distribution parameters
  │   ├─ Fix routing probabilities
  │   ├─ Update queue disciplines
  │   └─ Set run configuration
  ├─ Use Auto-Fix for validation errors
  ├─ Add/delete items as needed
  └─ Review metadata (assumptions, missing fields)

↓ Click "Approve & Continue to Simulation"
```

### Step 4: Simulation
```
Run DES simulation:
  ├─ Review configuration summary
  ├─ Adjust replications if needed
  └─ Click "Start Simulation"

↓ Simulation runs
```

### Step 5: Results
```
View results:
  ├─ Throughput, utilization, queue lengths
  ├─ Confidence intervals
  ├─ Bottleneck analysis
  └─ Performance metrics
```

## What Makes This Unique

### 1. **Full Transparency**
- You see **everything** the parser extracted
- No hidden assumptions or black-box magic
- Complete control before simulation runs

### 2. **Live Validation**
- Instant feedback on edits
- Auto-fix for common issues
- Clear error messages with suggestions

### 3. **Flexible Editing**
- Add/remove stations, routes, entities
- Modify all distribution parameters
- Change routing logic
- Adjust simulation runtime

### 4. **Self-Healing**
- Parser auto-repairs validation errors
- Auto-fix buttons in validator
- Suggestions for manual fixes

### 5. **Professional UX**
- Visual workflow stepper
- Expandable cards for organization
- Color-coded validation results
- Inline editing (no modals)

## Integration Points

### Electron IPC (Required)

Add these handlers to `electron/main.ts`:

```typescript
// DES Parser handlers
ipcMain.handle('des-parser:parse-text', async (event, text: string) => {
  const parser = new DESParser();
  return await parser.parseText(text);
});

ipcMain.handle('des-parser:parse-document', async (event, filePath: string) => {
  const parser = new DESParser();
  return await parser.parseDocument(filePath);
});
```

### LLM Integration (Required)

Implement the `callLLM()` method in `desParser.ts`:

```typescript
private async callLLM(systemPrompt: string, userMessage: string): Promise<string> {
  // Example with OpenAI
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
}
```

## Benefits

### For Users
1. **Verify Accuracy** - Catch parsing errors before simulation
2. **Customize Models** - Tweak parameters based on domain knowledge
3. **Learn the Schema** - Understand what goes into a DES model
4. **Fix Issues** - Auto-fix or manually correct validation errors
5. **Iterate Fast** - Edit and re-run without re-parsing

### For Developers
1. **Modular Design** - Use components standalone or together
2. **Type Safety** - Full TypeScript coverage
3. **Extensible** - Easy to add new validation rules
4. **Testable** - Each component can be tested independently
5. **Documented** - Clear interfaces and examples

## Future Enhancements

### Planned Features
- [ ] Visual graph editor (drag-and-drop stations/routes)
- [ ] Template library (common factory configurations)
- [ ] Diff view (show changes from original parse)
- [ ] Export/import JSON files
- [ ] Undo/redo functionality
- [ ] Copy/paste stations and routes
- [ ] Bulk edit (select multiple items)
- [ ] Search/filter (find specific stations)
- [ ] Validation rule customization
- [ ] Custom distribution definitions
- [ ] Resource assignment wizard
- [ ] Calendar builder UI

### Integration Ideas
- [ ] Direct integration with SimioDestroyerPlatform
- [ ] 3D visualization preview
- [ ] Real-time simulation preview (partial results)
- [ ] Optimization suggestions (based on validation)
- [ ] AI-powered auto-complete (suggest parameters)

## Files Created

```
factory-sim/
├── src/
│   ├── components/
│   │   ├── SimulationWorkflow.tsx          (Main orchestrator)
│   │   ├── ParsedDataReview.tsx            (Review/edit interface)
│   │   └── ParsedDataValidator.tsx         (Live validation)
│   ├── services/
│   │   └── desParser.ts                    (Parser service)
│   └── types/
│       └── processGraph.ts                 (Complete schema)
├── electron/
│   └── preload.ts                          (Updated with parser APIs)
└── PARSED_DATA_REVIEW_SYSTEM.md            (This file)
```

## Summary

You now have a **complete Parse → Review → Simulate workflow** with:

✅ **Full visibility** into parsed data
✅ **Complete editability** of all parameters
✅ **Live validation** with auto-fix
✅ **Professional UI** with great UX
✅ **Type-safe** TypeScript implementation
✅ **Modular components** for flexibility
✅ **Clear documentation** for integration

This system bridges the gap between **LLM-powered parsing** and **precise simulation execution**, giving you the best of both worlds: automation + control.
