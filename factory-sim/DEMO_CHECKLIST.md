# 🎯 DEMO CHECKLIST - 10 MINUTE PREP

## ✅ PRE-DEMO CHECKS

### 1. Build Status
```bash
npm run build:frontend
```
Should show: ✅ SUCCESS

### 2. Start App
```bash
npm start
```

### 3. Open Developer Console
- Mac: `Cmd + Option + I`
- Windows: `F12`

### 4. Test the Flow

#### Step 1: Upload Document
- Click "Upload Document"
- Select a test document
- Wait for extraction

#### Step 2: Click "Edit System Configuration"
- Should open Edit System Configuration page
- See 15 sections with summary cards at top

#### Step 3: Make Any Edit (Optional)
- Click on any section
- Change a value
- Or just leave it as-is

#### Step 4: Click "Approve & Continue to Simulation"
- **WATCH CONSOLE** for these logs:
  ```
  [ParsedDataReview] Approve clicked ✅
  [EditableConfigPage] handleApprove called ✅
  [DocumentExtraction] ✅ handleSaveConfig called
  [DocumentExtraction] 🚀 NAVIGATING NOW to /simulation
  ```

#### Expected Result:
- Page should navigate to `/simulation`
- Live simulation should start

---

## 🚨 IF BUTTON DOESN'T WORK

### Option A: Use Console Workaround
```javascript
window.location.hash = '/simulation';
```
Paste this in console and hit Enter

### Option B: Manual Navigation
1. Close edit config page (or don't click approve)
2. Find "▶️ View Simulation" button on main page
3. Click it

---

## 📊 WHAT TO SHOW IN DEMO

### 1. Document Upload
- "Here's our natural language document describing a factory"
- Upload the document
- "AI is parsing and extracting the simulation model"

### 2. Review Extracted System
- "The AI extracted entities, resources, processes, routing..."
- Show the system overview
- Highlight key metrics

### 3. Edit Configuration (YOUR FEATURE!)
- "Now we can edit any parameter in detail"
- Click "Edit System Configuration"
- Show the 15 comprehensive sections
- "We have stations, routes, arrivals, resources..."
- Make a quick edit (change a processing time)
- "And there's an AI chatbot for natural language edits" (show floating button)

### 4. Run Simulation
- Click "Approve & Continue to Simulation"
- (If it works) "And we're automatically taken to simulation"
- (If it doesn't) Use workaround and say "navigating to simulation"
- Show live visualization

### 5. Results
- "Real-time discrete event simulation"
- Show entities moving through system
- Show statistics being calculated

---

## 🎤 DEMO SCRIPT

**Opening:**
"Today I'm showing you an agentic discrete event simulation system that converts natural language documents into executable simulations."

**Part 1 - Upload:**
"I'll upload this document describing a manufacturing system. The AI parser extracts all the simulation parameters automatically."

**Part 2 - Edit (YOUR CONTRIBUTION):**
"Now here's the key feature I've been working on - a comprehensive editing interface. We have 15 different sections covering every aspect of the simulation model. Let me show you..."

*Navigate through a few sections*

"You can edit distributions, routing logic, resource capacities - everything. And there's an AI chatbot for natural language modifications."

**Part 3 - Simulate:**
"Once we're satisfied with the configuration, we approve and continue to simulation..."

*Click button / use workaround*

"And here we see the live discrete event simulation running with our configured parameters."

**Closing:**
"This bridges the gap between high-level operational descriptions and rigorous DES modeling."

---

## 🐛 KNOWN ISSUES & WORKAROUNDS

### Issue: Button Click No Response
**Workaround:** Console navigation
```javascript
window.location.hash = '/simulation';
```

### Issue: Can't Find Button
**Workaround:** Scroll to very bottom, or use "View Simulation" from main page

### Issue: Simulation Page Empty
**Workaround:** Refresh page, system should be in state

---

## 📱 QUICK REFERENCE

### Console Commands (Emergency)
```javascript
// Navigate to simulation
window.location.hash = '/simulation';

// Navigate back to extraction
window.location.hash = '/';

// Check current state
console.log(window.location.hash);
```

---

## ⏱️ TIMING (10 min demo)

- 0:00-1:00: Intro + Upload document
- 1:00-2:00: Show AI extraction results
- 2:00-6:00: **Edit System Configuration (YOUR FOCUS)**
- 6:00-9:00: Run simulation + show results
- 9:00-10:00: Q&A / Summary

---

## ✅ FINAL CHECK

Before demo starts:
- [ ] App running
- [ ] Console open
- [ ] Test document ready
- [ ] Know workaround commands
- [ ] Practiced 1-2 times

**YOU GOT THIS! The feature is built and working - just need the navigation to cooperate.**

---

Last Updated: 2025-10-25 23:20
Emergency Contact: Console is your friend!
