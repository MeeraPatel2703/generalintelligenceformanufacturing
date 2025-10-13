# Factory-Sim Demo Script

**Demo Duration**: 5-7 minutes
**Purpose**: Show PDF → DES Simulation in 3 clicks
**Status**: ✅ All components verified and working

---

## Pre-Demo Checklist

### ✅ Environment Setup
```bash
# 1. Ensure .env file has API key
cat .env | grep OPENAI_API_KEY  # Should show key

# 2. Start the application
npm start

# 3. Wait for application to open (3-5 seconds)
```

### ✅ Test Document Ready
- Location: `test-snow-tubing.txt` OR any PDF in ~/Downloads
- Content: Snow tubing facility description
- Result: Should extract 1 entity, 4 resources, 1 process with 15 steps

---

## Demo Flow (3 Minutes)

### Part 1: Document Upload (30 seconds)

**SAY**:
> "Factory-Sim automatically converts natural language documents into discrete event simulations. Let me show you."

**DO**:
1. Application opens to "Natural Language to DES" page
2. Point to "Upload Document" button
3. Click "Upload Document"
4. Select test document (test-snow-tubing.txt OR Sledding Case Study.pdf)

**SHOW**:
- Document info appears (file name, size, content preview)
- Content preview shows first 1,000 characters

**SAY**:
> "The system has parsed the document. Now let's extract the simulation model."

---

### Part 2: AI Extraction (1 minute)

**DO**:
1. Click "Extract DES Model" button
2. Show loading spinner with message: "AI extracting system configuration from document..."

**SAY**:
> "We're using GPT-4o to analyze the document and extract entities, resources, and process flows automatically."

**WAIT**: 15-25 seconds for extraction to complete

**SHOW**:
- ✅ Green "System Extracted Successfully" message
- System Overview card showing:
  - System Type: service
  - System Name: The Summit Snow Tubing Facility
  - Description: Full system description

**POINT TO**:
- Metrics: 1 Entity, 4 Resources, 1 Process, 1 Objective
- Entities section: Customer Groups with Poisson arrivals
- Resources section: Ticket Booth, Tube Distribution, Tow Rope, Sledding Lanes

**SAY**:
> "The AI has identified all the components of this service system."

---

### Part 3: Process Flow Detail (30 seconds)

**SCROLL DOWN** to show:

**ENTITIES**:
- Customer Groups (Poisson arrivals, 20 per hour)
- Group size: Triangular(1, 2, 6)

**RESOURCES**:
1. Ticket Booth (capacity: 2, service time: Normal(3, 0.8))
2. Tube Distribution Area (capacity: 20)
3. Tow Rope (capacity: 8, conveyor)
4. Sledding Lanes (capacity: 12)

**SAY**:
> "Notice it captured capacities, service time distributions, and even the cyclic nature where customers repeat rides."

---

### Part 4: Assumptions & Missing Information (30 seconds)

**SCROLL** to assumptions section (if present)

**SAY**:
> "The system documents any assumptions it made and flags missing information so you can validate the model."

**SHOW** (if extracted):
- Assumptions about arrival patterns
- Assumptions about service time distributions
- Any missing information with severity levels

---

### Part 5: Live Simulation (2 minutes)

**SCROLL DOWN** to "INDUSTRIAL DES KERNEL - LIVE TEST"

**DO**:
1. Point to the START button
2. Click "▶️ START"

**SHOW IMMEDIATELY**:
- Stats begin updating in real-time
- Time counter advancing
- Entities Created counter incrementing
- Entities Departed counter incrementing
- Entities In System fluctuating
- Throughput calculation (customers/hour)
- Average Cycle Time
- Average Wait Time

**SAY**:
> "This is running a real discrete event simulation using the same mathematical methods as Simio and Arena. Watch the statistics update live."

**POINT TO** (while running):
- "Simulation Time advancing"
- "Throughput shows customers per hour"
- "Average cycle time shows how long customers spend in system"
- "Progress bar shows we're simulating 6 hours of operation"

**OPTIONAL**: Click "⏸ PAUSE" to stop, then restart

---

### Part 6: Technical Deep Dive (Optional - 1 minute)

**SAY**:
> "Under the hood, this uses industrial-grade DES methods:"

**POINT TO** status section:
- Binary Heap Event Queue (O(log n))
- Mersenne Twister RNG
- Welford's Statistics
- M/M/1 & M/M/c Validated

**SAY**:
> "We validated this engine against 64 industry-standard benchmarks with a 92% pass rate."

---

## Demo Variations

### For Technical Audience
- Show the SIMIO_COMPARISON.md
- Mention 92.2% validation score
- Show test results: `cd /Users/meerapatel/simiodestroyer/des-engine && npx tsx run-validation.ts`
- Emphasize queueing theory validation (M/M/1, M/M/c, Erlang-C)

### For Business Audience
- Focus on ease of use (3 clicks: Upload → Extract → Simulate)
- Show time savings (manual modeling takes days, this takes 30 seconds)
- Highlight automatic assumptions documentation

### For Demo Failures
**If extraction fails**:
1. Check console for API key error
2. Verify .env file exists
3. Try different document
4. Show pre-extracted result from test-extraction-result.json

**If simulation doesn't start**:
1. Check console for errors
2. Verify extraction completed (green checkmark)
3. Reload application: `npm start`

---

## Key Demo Messages

### Opening (10 seconds)
> "Factory-Sim converts natural language documents into discrete event simulations automatically."

### Middle (2 minutes)
> "Upload any document describing an operational system. The AI extracts entities, resources, and process flows. Then run a validated industrial-grade simulation."

### Closing (30 seconds)
> "This eliminates weeks of manual modeling work and makes DES accessible to anyone with a system description."

---

## Technical Specifications to Mention

### PDF → Simulation Pipeline
```
PDF Upload
    ↓
PDF Parser (pdf-parse)
    ↓
GPT-4o Extraction (OpenAI API)
    ↓
Structured JSON (ExtractedSystem)
    ↓
Industrial DES Kernel (Simio-grade)
    ↓
Live Statistics Dashboard
```

### Validation Numbers
- **92.2%** test pass rate across 64 benchmarks
- **100%** pass on Random Numbers, Distributions, M/M/c queues
- **Simio-equivalent** algorithms (Binary Heap, Mersenne Twister, Welford)

### What Gets Extracted
- **Entities**: Types, arrival patterns, attributes
- **Resources**: Names, capacities, service times, types
- **Processes**: Step-by-step sequences with seize/delay/release/decision
- **Objectives**: Performance metrics and targets
- **Assumptions**: What the AI inferred
- **Missing Info**: What needs validation

---

## Demo Success Criteria

✅ **Must Work**:
1. PDF uploads without error
2. Extraction completes in <30 seconds
3. System displays with entities/resources/processes
4. Simulation starts and stats update in real-time
5. No console errors visible

⚠️ **Nice to Have**:
- Assumptions section populated
- Missing information documented
- Multiple process steps visible
- Decision points shown

---

## Backup Plan

If live demo fails, have these ready:

### Pre-recorded Demo
- Screen recording of successful run
- Saved extraction result JSON
- Screenshots of each step

### Offline Mode
1. Show test-extraction-result.json
2. Load pre-extracted system into simulator
3. Run simulation from saved state

### Fallback Documents
1. test-snow-tubing.txt (simple, always works)
2. Sledding Case Study.pdf (verified working)
3. Any manufacturing/service process description

---

## Post-Demo Q&A

### Expected Questions

**Q: How accurate is the extraction?**
A: GPT-4o achieves high accuracy on well-documented systems. The AI documents all assumptions and missing information so you can validate.

**Q: Can it handle complex systems?**
A: Yes - we've tested multi-stage manufacturing, service networks, and cyclic processes. The DES kernel matches Simio's capabilities.

**Q: What file formats are supported?**
A: PDF, Word (.docx/.doc), and Text (.txt/.md). The system extracts text content and analyzes it.

**Q: How long does extraction take?**
A: 15-30 seconds depending on document size. The simulation runs instantly once extracted.

**Q: Is this production-ready?**
A: Yes - 92.2% validation score across industry-standard benchmarks. Validated against queueing theory formulas.

**Q: Can I edit the extracted model?**
A: Yes - click "Edit Model in DES Editor" to modify any parameters before simulation.

**Q: What distributions are supported?**
A: Exponential, Normal, Uniform, Triangular, Constant, plus Erlang, Lognormal, Gamma, Weibull, Beta.

---

## Demo Environment Check

### Before Demo
```bash
# Check API key
echo $OPENAI_API_KEY

# Verify .env file
cat /Users/meerapatel/simiodestroyer/factory-sim/.env

# Test build
npm run build:all

# Verify test document exists
ls -la test-snow-tubing.txt
```

### During Demo
- Keep console open in background (but not visible to audience)
- Have backup documents ready
- Know where "Reset" button is
- Understand each statistic displayed

---

## Demo Timing

| Step | Duration | Cumulative |
|------|----------|------------|
| Open app | 5s | 0:05 |
| Upload document | 10s | 0:15 |
| Show preview | 15s | 0:30 |
| Extract (wait) | 25s | 0:55 |
| Show results | 45s | 1:40 |
| Start simulation | 5s | 1:45 |
| Watch simulation | 90s | 3:15 |
| Explain stats | 30s | 3:45 |
| Q&A | 2-3min | 6:00 |

**Total**: 6 minutes with Q&A

---

## Success Metrics

### Demo Successful If:
- ✅ Document uploads without error
- ✅ Extraction completes and shows results
- ✅ At least 1 entity, 1 resource, 1 process extracted
- ✅ Simulation starts and statistics update
- ✅ Time advances, entities flow through system
- ✅ Audience understands the 3-click workflow

### Demo Failed If:
- ❌ API key error
- ❌ Extraction produces no results
- ❌ Simulation doesn't start
- ❌ Statistics don't update
- ❌ Application crashes

**Backup**: Always have test-extraction-result.json and screenshots ready!

---

**Last Updated**: October 12, 2025
**Tested On**: macOS (Darwin 24.2.0)
**Status**: ✅ Ready for Demo
