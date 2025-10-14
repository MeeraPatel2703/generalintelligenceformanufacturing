# 📐 DES EDITOR GUIDE

## ✅ COMPLETE IMPLEMENTATION

All electron errors fixed ✓  
EditableDES UI updated to industrial theme ✓  
Generate Model button fully functional ✓  
All specifications visible, clickable, and editable ✓

---

## 🎯 HOW TO USE THE DES EDITOR

### **Step 1: Navigate to DES Editor**

1. Start the application: `cd factory-sim && npm run dev`
2. Click **"DES EDITOR"** button in the navigation bar
3. OR go to AGENTIC DES first to extract/upload a system

### **Step 2: View & Edit Specifications**

The **SPECIFICATION** tab shows three expandable sections:

#### **ENTITIES** (Clickable & Editable)
- Click on entity name to edit
- Change entity type (Customer, Part, Vehicle, Order, Custom)
- Edit arrival patterns:
  - Poisson (with rate and unit)
  - Non-homogeneous
  - Scheduled
  - Batch
  - Deterministic
- Click **"+ Add Entity"** to create new entities
- Click 🗑️ to remove entities

#### **RESOURCES** (Clickable & Editable)
- Edit resource name inline
- Change resource type (Server, Machine, Worker, etc.)
- Adjust capacity (number of units)
- Set processing times and distributions
- Click **"+ Add Resource"** to create new resources
- Click 🗑️ to remove resources

#### **PROCESSES** (Clickable & Editable)
- Edit process name
- Define process sequences
- Set routing logic (Sequential, Parallel, etc.)
- Configure dependencies
- Click **"+ Add Process"** to create new processes
- Click 🗑️ to remove processes

### **Step 3: Generate DES Model**

Once you're satisfied with your specifications:

1. Click **"▶ GENERATE MODEL"** button (bottom right)
2. The system will:
   - Create a DES simulation from your specifications
   - Run the simulation for 100 time units
   - Calculate comprehensive statistics
   - Display results in a modal

### **Step 4: View Simulation Results**

The results modal shows:

#### **Summary Metrics**
- **Simulation Time**: Total time units simulated
- **Entities Created**: How many entities entered the system
- **Events Processed**: Total simulation events
- **Entities Completed**: How many entities finished

#### **Resource Utilization Table**
For each resource:
- **Resource Name**
- **Utilization**: Visual progress bar + percentage
- **Entities Served**: Total throughput
- **Average Queue Length**: Congestion metric

Click **"CLOSE"** to return to editing.

### **Step 5: Iterate & Refine**

1. Close the results modal
2. Edit any specification values
3. Click **"▶ GENERATE MODEL"** again to see updated results
4. Compare different configurations
5. Click **"✓ APPROVE ALL"** when done

---

## 🔧 TECHNICAL IMPLEMENTATION

### **Architecture**

```
User Input (EditableDES)
    ↓
SpecificationEditor (displays all data)
    ↓
handleGenerateModel()
    ↓
IndustrialSimulationAdapter (creates DES kernel)
    ↓
IndustrialDESKernel (runs simulation)
    ↓
Statistics Collection
    ↓
Results Modal (displays metrics)
```

### **Key Components**

- **EditableDES.tsx**: Main page, tab navigation, industrial theme
- **SpecificationEditor.tsx**: All editing + Generate Model button
- **IndustrialSimulationAdapter.ts**: Converts specs → simulation
- **IndustrialDESKernel.ts**: Core DES engine
- **industrial-theme.css**: Unified styling system

### **Data Flow**

1. **User edits** any specification field (entity, resource, process)
2. Changes saved to `useDESModelStore` (Zustand store)
3. **Generate Model** button triggers:
   ```typescript
   const simulator = new IndustrialSimulationAdapter(extractedSystem);
   simulator.run(100);
   const stats = simulator.getStatistics();
   ```
4. Results displayed in modal with industrial theme

---

## 📊 WHAT'S EDITABLE

### **Everything!**

- ✅ Entity names, types, arrival patterns, attributes
- ✅ Resource names, types, capacities, processing times
- ✅ Process names, sequences, routing logic
- ✅ All numeric values (rates, times, capacities)
- ✅ All dropdowns and selections
- ✅ Add/remove any component

### **No Bloat**

- Uses existing `IndustrialSimulationAdapter`
- Uses existing `IndustrialDESKernel`
- Uses existing `useDESModelStore`
- Uses existing industrial theme CSS
- Clean, minimal implementation

---

## 🎨 UI FEATURES

### **Industrial Theme**
- Matches AGENTIC DES aesthetic
- Dark blueprint background
- Monospace fonts for technical feel
- Status indicators (processing, success, error)
- Progress bars for utilization
- Professional tables with borders

### **Interactive Elements**
- Click any field to edit inline
- Hover effects on buttons
- Loading states with spinners
- Modal overlay with backdrop blur
- Smooth animations (fadeIn, slideUp)

### **Responsive Design**
- Modal max-width: 900px
- Scrollable content area
- Flexible layout grid
- Mobile-friendly spacing

---

## 🚀 USAGE EXAMPLES

### **Example 1: Adjust Arrival Rate**

1. Go to DES Editor → Specification tab
2. Expand ENTITIES section
3. Click on "Customer Groups"
4. Change **Rate** from 200 to 300
5. Change **Rate Unit** from "per hour" to "per day"
6. Click **"▶ GENERATE MODEL"**
7. Compare results

### **Example 2: Add Resource Capacity**

1. Expand RESOURCES section
2. Find "Check-in Station"
3. Change **Capacity** from 1 to 3
4. Click **"▶ GENERATE MODEL"**
5. See reduced queue lengths!

### **Example 3: Test Different Configurations**

1. Make multiple edits
2. Click **"▶ GENERATE MODEL"**
3. Note the utilization %
4. Click **"CLOSE"**
5. Make different edits
6. Click **"▶ GENERATE MODEL"** again
7. Compare configurations

---

## 💡 BEST PRACTICES

1. **Start Small**: Edit one parameter at a time
2. **Observe Impact**: Generate model after each change
3. **Use Real Data**: Base parameters on actual observations
4. **Check Utilization**: Aim for 70-85% for optimal throughput
5. **Iterate**: Multiple runs help find optimal configuration

---

## 🔥 POWER FEATURES

### **Undo/Redo**
- Click **"↶ UNDO"** to revert changes
- Click **"↷ REDO"** to restore
- Keyboard shortcuts: Ctrl+Z, Ctrl+Y

### **Sync All**
- Click **"SYNC ALL"** to ensure consistency
- Useful when switching between tabs

### **Dirty Indicators**
- Orange dot on tabs with unsaved changes
- "UNSAVED CHANGES" badge in header

### **Multiple Tabs**
- **SPECIFICATION**: Data editing (current tab)
- **VISUAL FLOW**: Flow diagram (coming soon)
- **CODE**: JSON editor (coming soon)
- **EXPERIMENTS**: Parameter sweeps (coming soon)

---

## 🎯 DEFINITION OF DONE

✅ All specifications visible  
✅ All specifications clickable  
✅ All specifications editable  
✅ Generate Model button creates simulation  
✅ Generate Model button runs simulation  
✅ Results displayed in modal  
✅ Modal shows comprehensive stats  
✅ Industrial theme throughout  
✅ No bloat - uses existing tech stack  
✅ Zero build errors  
✅ Professional appearance

---

**You now have a fully functional DES editor!** 🎊

