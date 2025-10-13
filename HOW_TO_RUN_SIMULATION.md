# 🚀 How to Run the Simulation - Quick Start Guide

## 🎯 Starting the Application

### 1. **Launch the Electron App**
```bash
cd /Users/meerapatel/simiodestroyer/factory-sim
npm run dev
```

The app will open with the **AGENTIC DES** landing page.

---

## 📋 Running a Simulation (Step-by-Step)

### **Step 1: Upload Your Document**

1. Click the **"Upload Document"** button on the landing page
2. Select a document describing your system:
   - **Formats supported**: PDF, DOCX, TXT, Markdown
   - **What to include**: Process descriptions, machine names, cycle times, arrival rates

**Example Document Content:**
```
Our manufacturing system has 3 stations:
- Receiving: Parts arrive every 5 minutes
- Assembly: Takes 3 minutes per part
- Quality Check: Takes 2 minutes per part
- Shipping: Parts depart after quality check

The system operates 8 hours per day.
```

---

### **Step 2: AI Extraction**

Once uploaded, you'll see:
- **File specifications** (name, size, rows)
- **Content preview** (first 1000 characters)

Click **"Extract DES Model"** to let AI extract the simulation model.

The AI will:
- Identify entities (parts, customers, etc.)
- Extract resources (machines, workers, stations)
- Determine process flows and sequences
- Calculate arrival patterns and service times
- Set up the discrete event simulation

**Wait time**: ~5-15 seconds depending on document complexity

---

### **Step 3: Review Extracted Model**

After extraction, you'll see:
- ✅ **System Overview**
  - System name
  - System type (Manufacturing, Service, Logistics, etc.)
  - Number of entities and resources
  - Process flows

- 📊 **Entities** (what flows through the system)
  - Type, name, arrival pattern
  - Inter-arrival time distribution

- 🏭 **Resources** (machines, stations, workers)
  - Name, type, capacity
  - Service time distribution
  - Connected to which other resources

- 🔄 **Process Flows**
  - Step-by-step sequences
  - Entity → Resource → Next Resource

---

### **Step 4: Run the Simulation**

At this point, you have **3 options**:

#### **Option A: Run Directly (Quickest)**
The extraction results page shows the simulation automatically running in the background.

Look for:
- **"Show Simulation"** button (if available)
- **Live visualization** of entities moving through resources
- **Real-time statistics** updating

#### **Option B: Edit in DES Editor (Recommended)**
1. Click **"Edit Model in DES Editor"** button
2. Opens the **DES EDITOR** mode (top-right nav)
3. Here you can:
   - Modify entity arrival rates
   - Adjust resource service times
   - Change capacities
   - Add/remove resources
   - Customize distributions
4. Click **"Run Simulation"** when ready

#### **Option C: View Results**
After extraction completes, look for:
- **Simulation results** section showing:
  - System throughput (entities/hour)
  - Average cycle time
  - Resource utilizations
  - Queue statistics
  - Bottleneck identification

---

## 🎮 Simulation Controls

### **During Simulation:**

**Play/Pause:**
- Click **"Run"** to start
- Click **"Pause"** to freeze time
- Click **"Step"** to advance one event at a time

**Speed Control:**
- **1x** - Real-time speed
- **2x** - Double speed
- **5x** - Fast forward
- **10x** - Turbo mode

**Reset:**
- Click **"Reset"** to start over from time 0

---

## 📊 What You'll See

### **1. Animated Visualization**
- **Entities**: Moving colored dots/shapes
- **Resources**: Boxes showing busy/idle state
- **Queues**: Lines of waiting entities
- **Connections**: Paths between resources

### **2. Real-Time Statistics**
- **Current time**: 0.0 → simulation end time
- **Entities created**: Total arrivals
- **Entities in system**: Current count
- **Entities departed**: Completed
- **Resource utilization**: % busy time

### **3. Live Charts**
- Utilization over time
- Queue lengths over time
- Throughput rate
- Cycle time distribution

---

## 🔍 Understanding Results

### **Key Metrics:**

**Throughput**
- How many entities complete per hour
- Higher = more productive system

**Cycle Time**
- Total time from arrival to departure
- Lower = faster system

**Utilization**
- % of time resource is busy
- 70-85% is ideal
- >90% = bottleneck risk
- <50% = underutilized

**Queue Length**
- Average entities waiting
- Higher = congestion, need more capacity

**Bottleneck**
- Resource with highest utilization
- Limiting factor for system throughput
- Focus improvement efforts here

---

## 💡 Tips for Best Results

### **Document Quality:**
✅ **Good Document:**
```
Assembly line with 3 stations:
1. Station A: 2 machines, 5 min cycle time
2. Station B: 1 machine, 3 min cycle time  
3. Station C: 2 machines, 4 min cycle time

Parts arrive every 2 minutes on average.
```

❌ **Poor Document:**
```
We have some machines that do stuff.
It takes a while to make things.
```

### **What to Include:**
- ✅ Specific numbers (cycle times, arrival rates)
- ✅ Resource names and capacities
- ✅ Process sequence/order
- ✅ Time units (minutes, hours, seconds)
- ✅ Distribution types (if known)

### **What AI Extracts Automatically:**
- Resource types (manufacturing, service, quality control)
- Arrival patterns (Poisson, scheduled, constant)
- Service time distributions (exponential, normal, constant)
- Process routing and connections
- System topology

---

## 🎨 Navigation

### **Top-Right Corner:**

**AGENTIC DES** (Main Mode)
- Upload documents
- AI extraction
- View/run simulations

**DES EDITOR** (Advanced Mode)
- Edit extracted models
- Manual model creation
- Fine-tune parameters
- Export/import JSON

---

## 🐛 Troubleshooting

### **Problem: "No simulation running"**
**Solution:**
- Check if extraction completed successfully
- Look for "Extraction Complete" status
- Try clicking "Show Simulation" button

### **Problem: "Entities not moving"**
**Solution:**
- Check if simulation is paused (click "Run")
- Verify arrival rate > 0
- Check resource capacities > 0

### **Problem: "Extraction failed"**
**Solution:**
- Document too vague - add more specific numbers
- Document too long - summarize key info
- Check API key is set in `.env` file

### **Problem: "Performance slow"**
**Solution:**
- Reduce simulation time
- Decrease entity arrival rate
- Simplify visualization (turn off animations)

---

## 📈 Example Workflow

1. **Start app**: `npm run dev`
2. **Upload document**: Click "Upload Document", select file
3. **Extract model**: Click "Extract DES Model", wait ~10 seconds
4. **Review results**: Check system overview, entities, resources
5. **View simulation**: Click "Show Simulation" to see animation
6. **Analyze results**: Review throughput, cycle time, bottlenecks
7. **Edit if needed**: Click "Edit Model in DES Editor" to tweak
8. **Export**: Click "Export JSON" to save model

---

## 🎯 Quick Start Commands

```bash
# Terminal 1: Start the app
cd /Users/meerapatel/simiodestroyer/factory-sim
npm run dev

# That's it! App opens automatically.
```

---

## 🔥 Pro Tips

1. **Use Specific Numbers**: "5 minutes" not "a few minutes"
2. **Name Your Resources**: "Assembly Station 1" not "Machine"
3. **Include Arrival Rates**: "Every 3 minutes" or "10 per hour"
4. **Specify Capacities**: "2 parallel machines" not "some machines"
5. **Mention Distributions**: "Normally 5±1 minutes" if variable
6. **Keep Documents Focused**: 1-2 pages max for best results
7. **Test with Simple System First**: Start with 2-3 resources
8. **Watch Utilizations**: >85% means consider adding capacity
9. **Export Your Models**: Save successful extractions as JSON
10. **Use DES Editor**: Fine-tune after AI extraction for best accuracy

---

## 📚 What's Happening Behind the Scenes

When you run a simulation:

1. **Event Calendar**: Discrete events scheduled (arrivals, service completions)
2. **Time Advancement**: Jumps from event to event (not continuous)
3. **Entity Lifecycle**: CREATED → WAITING → PROCESSING → DEPARTED
4. **Resource Management**: Entities seize/release resources
5. **Queue Discipline**: FIFO (first-in-first-out) by default
6. **Statistics Collection**: Real-time tracking of all metrics
7. **Conservation Laws**: Entities in = entities out (always validated)
8. **Random Variability**: Uses proper distributions (exponential, normal, etc.)

This is a **true discrete event simulation** (not just animation), giving you accurate statistical results for decision-making.

---

## 🎬 You're Ready!

**To run your first simulation right now:**

1. Open terminal
2. Run: `npm run dev`
3. Click "Upload Document"
4. Select a text file describing a simple process
5. Click "Extract DES Model"
6. Watch the magic happen! 🎉

**The simulation visualizes in real-time as soon as extraction completes.**

---

**Need help?** Check `DEVELOPMENT_GUIDELINES.md` for advanced features or `UI_REDESIGN_STATUS.md` for UI component documentation.

**Happy simulating!** 🚀

