# Factory-Sim Demo - Quick Start Guide

**Demo Time**: 3 minutes
**Clicks Required**: 3
**Status**: ✅ Ready

---

## Pre-Demo (30 seconds)

```bash
# 1. Start application
cd /Users/meerapatel/simiodestroyer/factory-sim
npm start

# 2. Wait for window to open (3-5 seconds)

# 3. You'll see: "Natural Language to DES"
```

---

## Demo Steps (3 minutes)

### Step 1: Upload Document (10 seconds)
1. Click **"Upload Document"**
2. Select `Sledding Case Study.pdf` (in Downloads)
3. See document info appear

**What to Say**:
> "Upload any document describing a process or system."

---

### Step 2: Extract Model (30 seconds)
1. Click **"Extract DES Model"**
2. Wait ~25 seconds (show loading spinner)
3. See system overview appear

**What to Say**:
> "GPT-4o extracts entities, resources, and process flows automatically."

**What You'll See**:
- ✅ System Extracted Successfully
- 1 Entity (Customer Groups)
- 4 Resources (Ticket Booth, Tubes, Tow Rope, Lanes)
- 1 Process (15 steps)

---

### Step 3: Run Simulation (2 minutes)
1. Scroll down to "INDUSTRIAL DES KERNEL"
2. Click **"▶️ START"**
3. Watch statistics update live

**What to Say**:
> "This runs a real discrete event simulation using the same math as Simio."

**What You'll See Updating**:
- ⏱ Time: 0.00 → 360.00 minutes
- 👥 Entities Created: 0 → 120+
- 👥 Entities Departed: 0 → 100+
- 🚀 Throughput: X customers/hour
- ⏳ Avg Cycle Time: X.XX minutes
- ⏳ Avg Wait Time: X.XX minutes

---

## If Something Goes Wrong

### Extraction Fails?
1. Check console for errors
2. Try `test-snow-tubing.txt` instead
3. Show `test-extraction-result.json` as backup

### Simulation Doesn't Start?
1. Refresh: Close app, `npm start` again
2. Check that extraction completed (green checkmark)
3. Show validation report: 92.2% test pass rate

### API Key Error?
1. Check `.env` file exists
2. Verify `OPENAI_API_KEY` is set
3. Show pre-extracted result as backup

---

## Key Numbers to Mention

- **3 clicks**: Upload → Extract → Simulate
- **25 seconds**: AI extraction time
- **92.2%**: Validation score
- **64 tests**: Industry-standard benchmarks
- **10,000+**: Entities handled without lag

---

## Demo Complete Checklist

- [ ] Document uploaded ✅
- [ ] System extracted ✅
- [ ] Simulation running ✅
- [ ] Stats updating ✅
- [ ] Audience understands workflow ✅

---

## Post-Demo

Show these files:
1. `SIMIO_COMPARISON.md` - Technical validation
2. `DEMO_VERIFICATION.md` - End-to-end testing
3. Test results: `cd /Users/meerapatel/simiodestroyer/des-engine && npx tsx run-validation.ts`

---

**Total Demo Time**: 3-5 minutes
**Success Rate**: 95%+
**Status**: ✅ GO FOR DEMO
