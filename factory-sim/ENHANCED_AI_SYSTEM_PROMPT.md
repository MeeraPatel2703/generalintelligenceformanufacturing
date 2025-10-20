# Enhanced AI System Prompt - Comprehensive Simulation Configuration

## Overview

The AI system prompt has been **completely rebuilt** to leverage ALL existing simulation functions from the SimioDestroyerPlatform and make **EVERYTHING customizable** after CSV/PDF parsing.

## What Changed

### Before (Old System Prompt)
- ❌ Only extracted basic machine data (cycle times, utilization)
- ❌ Limited to 4 fields per machine
- ❌ No material handling configuration
- ❌ No shift/calendar setup
- ❌ No optimization recommendations
- ❌ No 3D visualization coordinates
- ❌ No routing or flow configuration
- ❌ Simple JSON with minimal structure

### After (New System Prompt)
- ✅ **Comprehensive extraction** of ALL simulation parameters
- ✅ **7 major configuration sections** with full details
- ✅ **Material handling**: Conveyors, AGVs, transporters
- ✅ **Shifts & calendars**: Work schedules, breaks, holidays
- ✅ **Optimization**: Bottleneck analysis + DOE factors
- ✅ **3D visualization**: Position coordinates for every object
- ✅ **Advanced routing**: Flow sequences with probabilities
- ✅ **Distribution types**: 7 distribution options (normal, exponential, triangular, uniform, weibull, lognormal, constant)
- ✅ **Failure models**: MTBF/MTTR with 5 failure types
- ✅ **Simulation config**: Duration, replications, feature toggles

## New JSON Structure

The AI now returns a **comprehensive configuration** with these sections:

### 1. Machines (Enhanced)
```json
{
  "id": "M001",
  "name": "CNC Machine 1",
  "type": "CNC",
  "cycle_time": {
    "distribution_type": "normal",
    "mean": 12.4,
    "std_dev": 1.2,
    "unit": "min"
  },
  "resource_config": {
    "capacity": 1,
    "routing_rule": "FIFO",
    "initial_state": "available"
  },
  "failure_maintenance": {
    "mtbf_minutes": 480,
    "mttr_minutes": 60,
    "failure_type": "RANDOM",
    "maintenance_interval_minutes": 2880,
    "maintenance_duration_minutes": 120
  },
  "visualization": {
    "position": {"x": 0, "y": 0, "z": 0},
    "visual_type": "machine",
    "color_hex": "#4a90e2"
  }
}
```

### 2. Material Handling (NEW)
```json
{
  "conveyors": [{
    "id": "CONV001",
    "start_pos": {"x": 0, "y": 0, "z": 0},
    "end_pos": {"x": 10, "y": 0, "z": 0},
    "speed": 30,
    "capacity": 10,
    "accumulating": true
  }],
  "agv_system": {
    "vehicles": [{"id": "AGV01", "capacity": 5, "speed": 60}],
    "network_nodes": [{"id": "N1", "position": {"x": 0, "y": 0, "z": 0}}],
    "network_edges": [{"id": "E1", "from": "N1", "to": "N2"}]
  },
  "transporters": []
}
```

### 3. Flow & Routing (NEW)
```json
{
  "sequence": ["RAW", "M001", "AS01", "QC01", "FINISH"],
  "connections": {
    "M001": [{"to": "AS01", "probability": 1.0}],
    "AS01": [
      {"to": "QC01", "probability": 0.9},
      {"to": "M001", "probability": 0.1}
    ]
  }
}
```

### 4. Entity Sources (NEW)
```json
{
  "id": "RAW_SOURCE",
  "entity_type": "Part",
  "interarrival_time": {
    "distribution_type": "exponential",
    "mean": 10,
    "unit": "min"
  },
  "max_arrivals": 1000,
  "position": {"x": -5, "y": 0, "z": 0}
}
```

### 5. Shifts & Calendars (NEW)
```json
{
  "calendar_type": "5_day_week",
  "shifts": [{
    "name": "Day Shift",
    "start_hour": 8,
    "end_hour": 16,
    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  }],
  "breaks": [
    {"start_minute": 120, "duration_minutes": 15, "name": "Morning Break"},
    {"start_minute": 240, "duration_minutes": 30, "name": "Lunch"}
  ],
  "holidays": ["2025-01-01", "2025-07-04", "2025-12-25"],
  "resource_calendars": {
    "M001": "Day Shift",
    "AS01": "Day Shift"
  }
}
```

### 6. Optimization (NEW)
```json
{
  "bottleneck": {
    "machine_id": "QC01",
    "reason": "Highest utilization at 97.2% with growing queue of 18 parts",
    "utilization_pct": 97.2,
    "queue_length": 18,
    "severity": "high"
  },
  "opportunities": [
    "Add parallel server to QC01 to increase capacity",
    "Reduce M001 cycle time variability to smooth flow",
    "Increase buffer before QC01 to decouple stations"
  ],
  "factors_for_doe": [
    {"name": "QC01_capacity", "min": 1, "max": 3, "current": 1, "discrete": true},
    {"name": "buffer_size", "min": 5, "max": 20, "current": 10, "discrete": true}
  ]
}
```

### 7. Simulation Config (NEW)
```json
{
  "duration_minutes": 2880,
  "warmup_minutes": 480,
  "num_replications": 30,
  "enable_3d": true,
  "enable_material_handling": true,
  "enable_failures": true,
  "enable_shifts": true,
  "enable_ai_insights": true
}
```

## System Prompt Enhancement

### Elite Persona
The AI is now positioned as an **ELITE industrial engineer** with:
- 20+ years experience in factory optimization
- Expert in DES (Arena, Simio, FlexSim, AnyLogic)
- Deep knowledge of queueing theory, TOC, Lean, Six Sigma
- Statistical analysis expertise (ANOVA, distribution fitting)
- Operations research background (linear programming, GA, DOE)

### Platform Awareness
The AI now understands it's configuring a platform with:
1. **Core DES Engine** - Priority event queue, Lindley recursion
2. **3D Visualization** - Three.js with real-time rendering
3. **Material Handling** - AGV pathfinding (Dijkstra), conveyor dynamics
4. **Advanced Routing** - 8+ routing rules (FIFO, LIFO, SPT, EDD, CR, SLACK)
5. **Failures & Maintenance** - MTBF/MTTR, Weibull distributions
6. **Shifts & Calendars** - Complex work schedules
7. **Optimization** - Genetic algorithms, RSM, NSGA-II
8. **Statistics** - Hypothesis testing, confidence intervals

### Analytical Rigor
The AI applies professional methodology:
- Pattern recognition for machine identification
- Goodness-of-fit tests for distributions
- Utilization curve analysis for bottleneck detection
- Little's Law validation (L = λW)
- 95% confidence intervals
- Time series analysis for shift patterns

### Customization Philosophy
**EVERYTHING is customizable post-parsing:**
- ✅ User can adjust ALL cycle times, capacities, routing rules
- ✅ User can enable/disable subsystems (3D, AGVs, failures, shifts)
- ✅ User can modify distributions and parameters
- ✅ User can set optimization objectives
- ✅ User can configure what-if scenarios

## TypeScript Types Updated

All type definitions in `src/types/analysis.ts` have been updated:

### New Interfaces
- `Position3D` - 3D coordinates for visualization
- `CycleTimeDistribution` - 7 distribution types
- `ResourceConfig` - Capacity, routing rules, initial state
- `FailureMaintenanceConfig` - MTBF/MTTR with 5 failure types
- `ConveyorConfig` - Conveyor parameters
- `AGVConfig`, `AGVSystem` - AGV vehicles and network
- `TransporterConfig` - Forklifts, trucks, cranes
- `MaterialHandling` - All material handling systems
- `FlowRouting` - Sequences and probabilistic connections
- `EntitySource` - Arrival generators
- `ShiftsCalendars` - Work schedules
- `OptimizationConfig` - Bottleneck analysis + DOE factors
- `SimulationConfig` - Runtime configuration

### Enhanced Interfaces
- `MachineAnalysis` - Now includes 7 sub-objects (cycle_time, resource_config, failure_maintenance, utilization, queue_pattern, visualization)
- `FactoryAnalysis` - Now includes 8 major sections

## Validation & Error Handling

The `validateAnalysis()` function now checks:
- ✅ All 8 major sections present
- ✅ Material handling structure (conveyors, AGVs, transporters)
- ✅ Flow routing with sequences and connections
- ✅ Entity sources array
- ✅ Shifts and calendars
- ✅ Optimization with bottleneck
- ✅ Simulation config
- ✅ Data quality metrics

**Default values** are provided if sections are missing:
- Empty arrays for material handling
- 24x7 calendar if no shifts detected
- Default simulation config (2880 min, 30 replications)

## Benefits

### For AI Analysis
1. **Comprehensive extraction** - No information left behind
2. **Expert guidance** - AI applies industrial engineering best practices
3. **Statistical rigor** - Proper distribution fitting and validation
4. **Optimization insights** - Actionable recommendations + DOE factors

### For Users
1. **Full customization** - Every parameter is editable
2. **Visual layout** - 3D coordinates auto-generated
3. **Material handling** - Can configure conveyors, AGVs if detected
4. **Work schedules** - Shifts, breaks, holidays configurable
5. **Optimization ready** - DOE factors pre-identified
6. **Feature toggles** - Enable/disable subsystems as needed

### For Developers
1. **Type safety** - Full TypeScript coverage
2. **Validation** - Comprehensive error checking
3. **Backward compatibility** - Legacy fields preserved
4. **Extensibility** - Easy to add new sections
5. **Default fallbacks** - Graceful degradation

## Using the New System

### After CSV/PDF Parse

The AI will return a **complete simulation configuration**. Users can then:

1. **Review & Edit** machine parameters
   - Adjust cycle times, capacities
   - Change routing rules (FIFO → SPT → EDD)
   - Modify failure rates (MTBF/MTTR)

2. **Configure Material Handling**
   - Add/remove conveyors
   - Define AGV network
   - Set transporter parameters

3. **Setup Work Schedules**
   - Define shifts (day/night/swing)
   - Add breaks and lunches
   - Mark holidays

4. **Customize 3D Layout**
   - Adjust machine positions
   - Change colors and visual types

5. **Run Optimization**
   - Use pre-identified DOE factors
   - Run genetic algorithm
   - Generate scenarios

## Example Usage

```typescript
// Parse CSV with enhanced AI
const analysis = await analyzeFactoryData(csvContent);

// Access comprehensive configuration
console.log('Machines:', analysis.machines.length);
console.log('AGVs:', analysis.material_handling.agv_system.vehicles.length);
console.log('Shifts:', analysis.shifts_calendars.shifts.length);
console.log('Optimization factors:', analysis.optimization.factors_for_doe.length);

// Customize
analysis.machines[0].resource_config.capacity = 2; // Add parallel server
analysis.shifts_calendars.calendar_type = '24x7'; // Change to 24/7
analysis.simulation_config.enable_failures = false; // Disable failures

// Run with SimioDestroyerPlatform
const platform = new SimioDestroyerPlatform({
  enable3D: analysis.simulation_config.enable_3d,
  enableMaterialHandling: analysis.simulation_config.enable_material_handling,
  enableFailures: analysis.simulation_config.enable_failures,
  enableShifts: analysis.simulation_config.enable_shifts,
  enableAI: analysis.simulation_config.enable_ai_insights
});

// Configure from analysis
analysis.machines.forEach(machine => {
  platform.getEngine().addResource(machine.id, machine.resource_config.capacity);

  if (machine.failure_maintenance.mtbf_minutes > 0) {
    platform.getFailureMaintenanceSystem()?.addFailureProfile(machine.id, {
      type: machine.failure_maintenance.failure_type,
      mtbf: machine.failure_maintenance.mtbf_minutes,
      mttr: machine.failure_maintenance.mttr_minutes
    });
  }
});

// Setup AGVs if present
if (analysis.material_handling.agv_system.vehicles.length > 0) {
  const agvSystem = platform.getAGVSystem()!;

  analysis.material_handling.agv_system.vehicles.forEach(vehicle => {
    agvSystem.addVehicle(vehicle.id, vehicle.position, vehicle.speed, vehicle.capacity);
  });

  analysis.material_handling.agv_system.network_nodes.forEach(node => {
    agvSystem.addNode(node.id, node.position);
  });

  analysis.material_handling.agv_system.network_edges.forEach(edge => {
    agvSystem.addEdge(edge.id, edge.from, edge.to);
  });
}

// Run simulation
const results = platform.runSimulation(
  analysis.simulation_config.duration_minutes,
  analysis.simulation_config.num_replications,
  analysis.simulation_config.warmup_minutes
);

// Run optimization if factors identified
if (analysis.optimization.factors_for_doe.length > 0) {
  const factors = analysis.optimization.factors_for_doe.map(f => ({
    name: f.name,
    minValue: f.min,
    maxValue: f.max,
    levels: 3,
    isDiscrete: f.discrete
  }));

  const optimal = platform.optimizeWithGA(factors, 'throughput', true, 50);
  console.log('Optimal parameters:', optimal.bestParameters);
}
```

## Summary

The enhanced AI system prompt transforms CSV/PDF parsing from a **simple parameter extraction** to a **comprehensive simulation configuration** that:

1. ✅ Leverages ALL SimioDestroyerPlatform capabilities
2. ✅ Makes EVERYTHING customizable
3. ✅ Provides expert industrial engineering analysis
4. ✅ Generates actionable optimization recommendations
5. ✅ Configures all subsystems (3D, material handling, shifts, failures)
6. ✅ Includes 3D coordinates, routing, and work schedules
7. ✅ Applies statistical rigor and validation
8. ✅ Enables immediate simulation + optimization

**Result**: A production-ready, fully-configured simulation model from raw factory data.
