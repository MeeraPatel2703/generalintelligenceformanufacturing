# Factory-Sim End-to-End Testing Checklist

## Pre-Test Setup

### ✅ 1. Verify Environment
```bash
# Check .env file exists and has OPENAI_API_KEY
cat .env | grep OPENAI_API_KEY
# Should show: OPENAI_API_KEY=sk-proj-...
```

### ✅ 2. Build Application
```bash
npm run build:all
# Should complete without errors
```

### ✅ 3. Start Application
```bash
npm start
# Application should launch without errors
# Check Developer Tools console for:
# "[Main] ✓ Loaded .env from: <path>"
# "[Main] ✓ OPENAI_API_KEY is available (length: 164)"
```

---

## Test Case 1: Document Upload & Parsing

### Test Steps:
1. Click "Upload Document" button
2. Select `test-snow-tubing.txt`
3. Verify document info displays:
   - ✅ File: test-snow-tubing.txt
   - ✅ Size: ~1.6 KB
   - ✅ Type: TEXT
   - ✅ Characters: ~1600
   - ✅ Content preview shows "The Summit Snow Tubing Facility"

### Expected Result:
- No errors
- Document information displayed correctly
- "Extract DES Model" button appears

---

## Test Case 2: AI System Extraction

### Test Steps:
1. Click "Extract DES Model" button
2. Wait for AI processing (10-30 seconds)
3. Check console for:
   ```
   [Extractor] Starting extraction with GPT-4-Turbo...
   [Extractor] Response received
   [Extractor] Extracted: X entities, X resources, X processes
   ```

### Expected Result:
- ✅ "System Extracted Successfully" message
- ✅ System Overview shows:
  - System Type: service
  - System Name: The Summit Snow Tubing Facility
  - Description: (full description)

### Verify Entities Section:
- ✅ "Customer Groups" entity
  - Type: customer
  - Arrival: poisson
  - Rate: 20 per_hour

### Verify Resources Section:
- ✅ "Ticket Booth" - capacity: 2
- ✅ "Tow Rope" - capacity: 8
- ✅ "Sledding Lanes" - capacity: 12
- Each resource should show processing time distribution

### Verify Processes Section:
- ✅ "Complete Customer Journey" or similar
- ✅ Multiple process steps (should be 10-15 steps)
- ✅ Each step should have:
  - ID (step_1, step_2, etc.)
  - Type (seize, delay, release, decision)
  - Resource names where applicable
  - Duration distributions where applicable

### Verify Decision Points:
- ✅ Should have decision step with probabilities:
  - 75% probability to repeat
  - 25% probability to exit

---

## Test Case 3: Visual Flow Editor

### Test Steps:
1. Click "Edit Model in DES Editor" button
2. Verify page navigates to editable DES view
3. Check visual flow diagram appears

### Expected Result:
- ✅ Visual flow diagram shows nodes and connections
- ✅ Nodes represent entities and resources
- ✅ Edges show flow connections
- ✅ Can interact with the diagram

---

## Test Case 4: DES Simulation Execution

### Test Steps:
1. Stay on document extraction page with extracted system
2. Simulation should run automatically in background
3. Check console for:
   ```
   [GenericDESModel] Initializing from extracted system...
   [GenericDESModel] Creating resource: Ticket Booth (capacity: 2)
   [GenericDESModel] Scheduling arrivals for: Customer Groups
   [Replication 1/100] Completed
   ```

### Expected Result:
- ✅ Live simulation canvas shows animated entities
- ✅ Statistics update in real-time
- ✅ Resources show utilization
- ✅ Entities flow through system

---

## Test Case 5: Error Handling

### Test with Missing API Key:
1. Temporarily rename .env to .env.backup
2. Rebuild and start app
3. Try to extract system

### Expected Result:
- ✅ Error message: "OPENAI_API_KEY not configured in .env file"
- ✅ Console shows: "[Main] ✗ OPENAI_API_KEY is NOT available!"
- ✅ Application doesn't crash

### Recovery:
1. Rename .env.backup back to .env
2. Restart application
3. Verify it works again

---

## Test Case 6: Different Document Types

### Test with PDF (if available):
1. Find or create a PDF document
2. Upload and extract
3. Verify extraction works

### Test with Word Doc (if available):
1. Find or create a .docx document
2. Upload and extract
3. Verify extraction works

---

## Console Verification

### On Startup, verify these logs appear:
```
[Main] ✓ Loaded .env from: /path/to/.env
[Main] ✓ Environment variables loaded: ANTHROPIC_API_KEY, OPENAI_API_KEY
[Main] ✓ OPENAI_API_KEY is available (length: 164)
```

### On Document Upload, verify:
```
[Main] Parsing document: /path/to/test-snow-tubing.txt
[Main] Document parsed successfully
```

### On System Extraction, verify:
```
[Main] Starting system extraction...
[Extractor] Starting extraction with GPT-4-Turbo...
[Extractor] Content length: XXXX
[Extractor] Response received
[Extractor] Tokens used: XXXX
[Extractor] Extracted: N entities, M resources, P processes
[Main] System extraction complete
```

### On Simulation, verify:
```
[Main] Starting DES simulation with 100 replications
[Main] Using new DES engine with extracted system
[SystemToDESMapper] Creating DES model from extracted system...
[GenericDESModel] Initializing from extracted system...
[Replication X/100] Completed
[Main] DES simulation complete
```

---

## Known Issues to Check

### ❌ If you see "OPENAI_API_KEY not configured":
- Check .env file exists in project root
- Check .env has valid OPENAI_API_KEY
- Check console shows "[Main] ✓ Loaded .env from:"
- If not, the dotenv path detection failed

### ❌ If extraction takes too long or fails:
- Check internet connection
- Check OpenAI API quota/credits
- Check console for API error messages

### ❌ If simulation doesn't run:
- Check extracted system has entities and resources
- Check console for DES engine errors
- Verify process sequences are complete

---

## Success Criteria

### ✅ All Tests Pass If:
1. Application starts without errors
2. OPENAI_API_KEY loads successfully
3. Document uploads and parses correctly
4. AI extraction completes and returns valid system
5. Extracted system has entities, resources, processes
6. Visual editor displays flow diagram
7. DES simulation runs and shows results
8. No console errors (except unused variable warnings)
9. Live canvas shows animated simulation
10. Statistics display correctly

---

## Bug Report Template

If you find bugs, report using this format:

```
**Bug Title**: [Short description]

**Steps to Reproduce**:
1.
2.
3.

**Expected Behavior**:

**Actual Behavior**:

**Console Output**:
```
[Paste relevant console logs]
```

**Screenshot** (if applicable):

**Environment**:
- OS:
- Node version:
- npm version:
```
