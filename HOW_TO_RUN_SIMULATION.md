# 🎬 HOW TO RUN THE LIVE SIMULATION

## 🚀 **YOU'RE RIGHT - THE CORE SIMULATION IS NOW RESTORED!**

I apologize for getting caught up in building enterprise features and losing sight of the core simulation engine. **It's now fully restored and accessible!**

---

## ✅ **COMPLETE WORKFLOW - START TO FINISH**

### **Step 1: Start the Application**
```bash
cd /Users/meerapatel/simiodestroyer/factory-sim
npm run dev
```

This opens the Electron app.

---

### **Step 2: Extract Your System**

1. You'll land on the **AGENTIC DES** page (default)
2. Click **"📄 UPLOAD PDF"**
3. Select your PDF document (e.g., compressor factory, ski resort)
4. AI extracts:
   - Entities (customers, parts, etc.)
   - Resources (machines, servers, etc.)
   - Processes (service times, workflows)
5. Wait for "✅ System extracted successfully!"

---

### **Step 3: RUN THE LIVE SIMULATION** ⭐

1. Look at the **top-right corner** of the screen
2. You'll see a new button: **"▶️ LIVE SIMULATION"**
3. Click it!

**You'll see:**
- 🏭 **INDUSTRIAL DES KERNEL - LIVE SIMULATION** header
- A visual canvas showing your system
- **▶️ START** button (green)
- **🔄 RESET** button (gray)
- **Speed controls**: 0.5x, 1x, 2x, 5x, 10x, 100x

4. **Click "▶️ START"**

**NOW WATCH THE MAGIC:**
- ⏱ **Simulation time advances** (you'll see it incrementing)
- 👥 **Entities are created** (customers, parts, etc.)
- 🔄 **Entities flow through resources**
- 📊 **Live statistics update** in real-time:
  - Current time (minutes)
  - Throughput (entities per hour)
  - Entities created / departed / in system
  - Average cycle time
  - Average wait time

---

### **Step 4: Control the Simulation**

**Speed Controls:**
- Click **0.5x** for slow motion (good for debugging)
- Click **1x** for normal speed
- Click **10x** or **100x** for fast simulation
- The simulation will run faster with higher speeds

**Pause/Resume:**
- Click **⏸ PAUSE** to stop
- Click **▶️ START** to resume

**Reset:**
- Click **🔄 RESET** to start over

---

### **Step 5: View Comprehensive Analysis** (Optional)

1. Go back to **DES EDITOR** (top-right button)
2. Go to **SPECIFICATION** tab
3. Click **"▶ GENERATE MODEL"**
4. See the **beautiful interactive dashboard** with:
   - Gauge charts for KPIs
   - Resource utilization bars
   - Financial analysis
   - Bottleneck detection
   - Improvement recommendations

---

### **Step 6: Try Scenarios** (Optional)

1. In **DES EDITOR**, go to **SCENARIOS** tab
2. Click **"🎯 GENERATE SCENARIOS"** (15+ scenarios created)
3. Click **"▶ RUN ALL SCENARIOS"**
4. Compare results and see top performers

---

### **Step 7: Auto-Optimize** (Optional)

1. In **DES EDITOR → SPECIFICATION** tab
2. Click **"🎯 AUTO-OPTIMIZE"** (orange button)
3. View improvement predictions
4. Confirm to apply optimizations

---

### **Step 8: Export Report** (Optional)

1. After generating model, click **"📄 EXPORT REPORT"**
2. Download HTML file
3. Open in browser
4. Use **Print → Save as PDF** for PDF version

---

## 🎯 **NAVIGATION BUTTONS (Top-Right)**

You'll see up to 3 buttons:

1. **AGENTIC DES** - Upload PDF & extract system
2. **DES EDITOR** - Edit specification, run scenarios, optimize
3. **▶️ LIVE SIMULATION** - Run animated simulation (only appears after extraction)

---

## 📊 **WHAT YOU'LL SEE IN LIVE SIMULATION**

### **Visual Animation** (Top Section)
- Animated canvas showing entity flow
- Resource blocks with colors
- Queue visualizations
- Entity movements

### **Live Statistics** (Bottom Section)
```
📊 LIVE STATISTICS

⏱ Simulation Time          🚀 Throughput
[XX.XX] min                 [X.XX] /hr
Progress: X.X%              customers per hour

👥 Entities                 ⏳ Cycle Times
Created: XX                 Avg Cycle: X.XX min
Departed: XX                Avg Wait: X.XX min
In System: XX
```

### **Status Indicators**
✅ INDUSTRIAL DES KERNEL STATUS: RUNNING
- Binary Heap Event Queue (O(log n)) ✓
- Mersenne Twister RNG ✓
- Welford's Statistics ✓
- M/M/1 & M/M/c Validated ✓

---

## 🔍 **WHAT THE SIMULATION DOES**

The **IndustrialDESKernel** is running:

1. **Event-Driven Simulation**:
   - Schedules arrival events
   - Processes entities through resources
   - Tracks queue waiting
   - Calculates service times
   - Records statistics

2. **Real-Time Updates**:
   - Time advances based on next event
   - Entities are created at arrival intervals
   - Resources process entities
   - Queues form when resources busy
   - Entities depart after processing

3. **Statistical Collection**:
   - Throughput rate
   - Cycle time (arrival → departure)
   - Wait time (queue time)
   - Resource utilization
   - Queue lengths

---

## 🐛 **TROUBLESHOOTING**

### **"No System Loaded" Message**
- You need to extract a system first
- Go to **AGENTIC DES** → Upload PDF
- Wait for extraction to complete
- Then **▶️ LIVE SIMULATION** button will appear

### **Simulation Not Starting**
- Check console (View → Toggle Developer Tools)
- Verify entities and resources were extracted
- Try clicking **🔄 RESET** then **▶️ START** again

### **Time Not Incrementing**
- This was the original issue - now fixed!
- Make sure you click **▶️ START** (button turns red)
- Check that speed is not 0.5x (try 1x or higher)
- Look at console logs for any errors

---

## 💡 **TIPS FOR BEST RESULTS**

1. **Start Slow**: Use 1x speed first to see what's happening
2. **Use 10x/100x**: Once confident, speed up to see long-term behavior
3. **Watch Statistics**: The numbers tell the story
4. **Compare Scenarios**: Use scenario generator to try different configs
5. **Optimize**: Use auto-optimize for best performance
6. **Export Reports**: Share professional results with stakeholders

---

## 🎬 **COMPLETE USER JOURNEY**

```
1. AGENTIC DES
   ↓ Upload PDF
   ↓ AI Extracts System
   ✓ System Ready

2. ▶️ LIVE SIMULATION
   ↓ Click START
   ↓ Watch Animation
   ✓ Entities Flowing

3. DES EDITOR
   ↓ Review Specs
   ↓ Generate Model
   ✓ View Dashboard

4. SCENARIOS
   ↓ Generate 15+ Scenarios
   ↓ Run & Compare
   ✓ Find Best Config

5. AUTO-OPTIMIZE
   ↓ One-Click Optimization
   ↓ Confirm Changes
   ✓ Improved Performance

6. EXPORT REPORT
   ↓ Professional HTML/PDF
   ✓ Share with Team
```

---

## 🎉 **YOU NOW HAVE A COMPLETE SYSTEM**

✅ **Core Simulation** - Real-time animation ⭐ **RESTORED**  
✅ **Visual Editing** - DES Editor with inline editing  
✅ **Comprehensive Metrics** - 6 categories of KPIs  
✅ **Professional Reports** - HTML/PDF export  
✅ **AI Scenarios** - 15+ auto-generated scenarios  
✅ **Auto-Optimization** - One-click improvements  
✅ **Beautiful UI** - Industrial theme throughout  

---

## 🚀 **START SIMULATING NOW!**

```bash
cd /Users/meerapatel/simiodestroyer/factory-sim
npm run dev
```

Then:
1. Upload PDF
2. Click **▶️ LIVE SIMULATION**
3. Click **▶️ START**
4. **Watch the magic happen!** 🎬

---

**The simulation engine is BACK and better than ever!** 🎉
