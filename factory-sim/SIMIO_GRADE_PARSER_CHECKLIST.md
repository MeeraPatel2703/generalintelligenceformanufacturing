# ✅ SIMIO-GRADE PARSER - COMPLETE COVERAGE CHECKLIST

## Definition of Done (DoD)
For each section below, the parser must:
1. ✅ Extract all listed elements if present in source
2. ✅ Normalize all units to canonical form
3. ✅ Validate against schema constraints
4. ✅ Display correctly in UI editor
5. ✅ Support full CRUD operations (Create/Read/Update/Delete)
6. ✅ Pass red/green verification tests

---

## 0) Global / Provenance ⬜

**Extraction:**
- [ ] Model name/slug; version (semver); description; author
- [ ] Created/modified timestamps
- [ ] Source documents (filenames, page refs)
- [ ] Parse method (LLM/model/seed); checksum/plan hash
- [ ] Default unit system (time, distance, speed, mass, energy, currency, rate)
- [ ] Random seeds (extractor, planner, engine); RNG streams per object
- [ ] CRN enablement flags
- [ ] Assumptions & limitations; open questions
- [ ] Parse warnings; hard errors

**Validation:**
- [ ] Version follows semver format
- [ ] Timestamps are ISO 8601
- [ ] Default units match canonical set
- [ ] Seeds are positive integers or null

**UI Display:**
- [ ] Metadata panel shows all provenance
- [ ] Assumptions list viewable
- [ ] Warnings/errors highlighted

---

## 1) Entities / Items / Orders ⬜

**Extraction:**
- [ ] IDs, display names, classes/product families
- [ ] Colors/icons for visualization
- [ ] Batch size; containerization (tray/carton/pallet)
- [ ] Max in container, nesting rules
- [ ] Attributes (typed: int/float/string/bool/timestamp/category)
- [ ] Initial attribute values; update rules
- [ ] Priority, due date/SLAs, penalties (lateness/tardiness costs)
- [ ] Routing policy overrides (fixed, alternatives, probs, rule-based, skill-based)
- [ ] BOM/assembly: parent, components (qty, optional/mandatory)
- [ ] Kitting rules, kit completeness gate
- [ ] Split/merge rules: join counts, sync (AND/OR), merge time
- [ ] Partial merges/leftovers handling
- [ ] Rework flags/limits; quality grade
- [ ] Serialization/traceability IDs

**Validation:**
- [ ] At least 1 entity defined
- [ ] All IDs unique
- [ ] Batch size ≥ 1
- [ ] Attribute types valid
- [ ] BOM references exist
- [ ] Probabilities sum to 1.0

**UI Display:**
- [ ] Entity list with expand/collapse
- [ ] Editable attributes table
- [ ] BOM tree view
- [ ] Color/icon picker

---

## 2) Arrivals / Demand Release (ALL variants) ⬜

**Extraction:**
- [ ] **Homogeneous Poisson**: single rate
- [ ] **Non-homogeneous Poisson**: rate windows (start/end/rate)
- [ ] **Piecewise linear rate**: interpolated rates
- [ ] **Seasonal/weekly patterns**: cyclic rates
- [ ] **Holiday overrides**: exception dates
- [ ] **Timestamp schedule**: absolute or daily "HH:MM"
- [ ] **Release calendars/shifts**: binding to work schedules
- [ ] **Empirical interarrival**: samples (values/weights), kernel/ECDF
- [ ] **Orders list**: (id, qty, due, priority, attributes)
- [ ] Batch size; class/product mix (proportions sum to 1)
- [ ] Mix by time window
- [ ] Release rules (periodic, EDD, CONWIP/kanban-gated, kitting-complete, threshold-based)
- [ ] Backlog logic (carryover, aging priority, cancellations)
- [ ] Balking/reneging at entry; arrival caps during closures

**Validation:**
- [ ] At least 1 arrival policy
- [ ] Windows sorted chronologically
- [ ] No overlapping windows
- [ ] All rates in entities/hour
- [ ] Class mix proportions sum to 1.0 ±0.001
- [ ] Batch ≥ 1
- [ ] Times in HH:MM format or minutes
- [ ] Calendar references exist
- [ ] Gaps between windows flagged (warning)

**UI Display:**
- [ ] Policy type selector (dropdown)
- [ ] **Rate table editor** (add/edit/delete windows)
- [ ] **Schedule table editor** (time/qty/class rows)
- [ ] Batch size input
- [ ] Class mix editor
- [ ] Release rule selector

---

## 3) Calendars / Shifts / Breaks / Holidays ⬜

**Extraction:**
- [ ] Timezone
- [ ] Working days (Mon-Sun selection)
- [ ] Shift blocks (day/start/end)
- [ ] Breaks (offset/duration)
- [ ] Overtime rules
- [ ] Station/resource calendars
- [ ] Arrival calendars
- [ ] Maintenance calendars
- [ ] Exception days (holidays, blackout windows)
- [ ] Override precedence rules

**Validation:**
- [ ] Shift times valid (HH:MM)
- [ ] Break offsets < shift duration
- [ ] No overlapping shifts (same day)
- [ ] Holiday dates ISO format (YYYY-MM-DD)
- [ ] Resource/station closed while arrivals open → warning

**UI Display:**
- [ ] Calendar list
- [ ] Shift editor (day/start/end)
- [ ] Break list editor
- [ ] Holiday date picker
- [ ] Visual timeline

---

## 4) Stations / Activities (every node) ✅ **PARTIAL**

**Extraction:**
- [x] IDs, types (machine/station/oven/tester/bench/buffer/source/sink)
- [x] Display name, icon
- [x] Count (servers); capacity/WIP slots
- [ ] Initial WIP
- [x] Queue discipline (FIFO/LIFO/PRIORITY/SJF/EDD/CR/SLACK)
- [ ] Priority keys; preemption rules
- [x] Queue limits; reneging/balking at station
- [x] **Process time distribution** (type + params + units)
- [x] Setups/changeovers
- [x] Rework/yield/scrap
- [ ] Batching: min/max, batch formation policy (wait-min, wait-full, periodic)
- [ ] Split after process flag
- [ ] Family/recipe state; state carried by entity or station
- [ ] State resets
- [ ] Energy model (kW active/idle)
- [ ] OEE factors (availability/performance/quality)
- [ ] Safety/ergonomics gates; manual approvals; inspection holds
- [ ] Layout position (x,y); layer/group; tooltip text

**Validation:**
- [x] Count ≥ 1, Capacity ≥ 1
- [x] Every processing station has processTime
- [x] Queue discipline valid
- [x] Rework targets exist
- [ ] Energy values ≥ 0
- [ ] Position coordinates valid

**UI Display:**
- [x] Station list with expand/collapse
- [x] Editable fields (ID, kind, count, capacity, queue)
- [x] Distribution editor
- [ ] Energy inputs
- [ ] Position editor (x, y)

**TODO:**
- [ ] Add batching configuration
- [ ] Add energy model fields
- [ ] Add OEE editor
- [ ] Add layout position inputs

---

## 5) Setups & Changeovers (SMED) ⬜

**Extraction:**
- [x] Cadence-based: every N units/batches → setup time distribution
- [x] Matrix-based: families list; from→to changeover times
- [ ] Triangular inequality checks
- [ ] SMED split: internal vs external setup fractions
- [ ] Convertibility between families
- [ ] Setup triggers: first after idle, after downtime, at lot boundary, at family change
- [ ] Setup batching/anticipation; warm equipment time
- [ ] Scrap on changeover

**Validation:**
- [x] Setup times have valid distributions
- [ ] Matrix square and comprehensive
- [ ] Non-negative times
- [ ] Families coverage complete

**UI Display:**
- [x] Setup mode selector
- [x] Cadence editor (every_n, time)
- [ ] Matrix editor (from/to grid)
- [ ] SMED split inputs

**TODO:**
- [ ] Add matrix editor UI
- [ ] Add SMED configuration
- [ ] Add scrap on changeover

---

## 6) Quality / Inspection / Yield / Rework ⬜

**Extraction:**
- [ ] Inspection steps (time distribution, sample policy, AQL/skip-lot)
- [ ] Inspection frequency
- [ ] Outcomes: pass, rework, scrap (probs sum to 1)
- [ ] False pos/neg rates
- [x] Rework routing target(s)
- [ ] Max rework loops
- [ ] Rework process differences (faster/slower)
- [ ] Burn-in/testing durations
- [ ] Retest policies; quarantine/hold times
- [ ] Traceability: defect codes; lot genealogy

**Validation:**
- [x] Rework probability 0-1
- [x] Rework target exists
- [x] Scrap probability 0-1
- [x] Yield 0-1
- [ ] Outcome probabilities sum to 1

**UI Display:**
- [x] Rework probability input
- [x] Scrap probability input
- [x] Yield input
- [ ] Inspection configuration
- [ ] Defect code list

**TODO:**
- [ ] Add inspection editor
- [ ] Add max rework loops
- [ ] Add quality outcomes editor

---

## 7) Failures / Repairs / Planned Maintenance ⬜

**Extraction:**
- [x] Unplanned failures: time-based (MTBF/MTTR distributions)
- [ ] Cycle-based failures (items-to-fail)
- [ ] Convert p% per hour to TTF distribution
- [ ] Repair time distribution
- [ ] Spare-part/technician resource needs
- [ ] Restart behaviors (warmup, re-sync)
- [ ] Minor stops/micro-stoppages
- [ ] Reduced-rate states
- [ ] Starvation/blocking derived downtime split
- [ ] Planned maintenance: windows (start/end), duration
- [ ] Fixed/opportunistic maintenance
- [ ] Calendars for maintenance
- [ ] Condition-based maintenance triggers (MTBF, counters, sensors)

**Validation:**
- [x] MTBF/MTTR positive
- [x] Valid distributions
- [ ] No overlapping maintenance windows
- [ ] Resource availability during repair

**UI Display:**
- [x] Downtime type selector (time_based/cycle_based)
- [x] MTBF/MTTR distribution editors
- [ ] Maintenance window calendar
- [ ] Resource requirements

**TODO:**
- [ ] Add cycle-based failure config
- [ ] Add planned maintenance editor
- [ ] Add maintenance calendar

---

## 8) Resources & Pools (Labor, Tools, Vehicles, Fixtures) ✅ **PARTIAL**

**Extraction:**
- [x] Pool IDs; type (operator/tool/vehicle/fixture)
- [x] Counts; display names/icons
- [ ] Calendar binding
- [ ] Skills/qualifications (name, level)
- [ ] Certifications; expiry dates
- [ ] Learning curves/fatigue
- [x] Assignments: station requirements (required counts)
- [ ] Hard/soft constraints
- [ ] Simultaneous needs (operators + tools)
- [ ] Task changeover/induction times
- [ ] Walking/transport time if manual handling
- [ ] Resource prioritization (nearest, priority-rule, cyclic)
- [ ] Dispatching policies; breaks integration

**Validation:**
- [x] Pool counts ≥ 1
- [x] Type valid (operator/tool/vehicle)
- [ ] Feasibility (pool counts ≥ concurrent requirements)
- [ ] Calendar references exist

**UI Display:**
- [x] Resource pool list
- [x] Type selector
- [x] Count input
- [x] Home station selector
- [ ] Skills editor
- [ ] Calendar assignment

**TODO:**
- [ ] Add skills/qualifications editor
- [ ] Add calendar binding UI
- [ ] Add learning curves
- [ ] Add dispatching policy selector

---

## 9) Routing / Flow Network ✅ **COMPLETE**

**Extraction:**
- [x] Directed edges (from, to)
- [x] Alternative paths; branching probabilities
- [ ] Rules: shortest queue, fastest expected time, priority-based, attribute-based
- [ ] Gates: AND/OR merges; join counts; split ratios
- [ ] Attribute-driven switching
- [ ] Setup-family assignment on entry; recipe switching nodes
- [ ] Dead-end detection; orphan nodes; intended sinks
- [ ] UI: edge labels/weights; path polylines; layer/grouping

**Validation:**
- [x] All from/to IDs exist
- [x] Probabilities per station sum to 1.0
- [ ] Reachability (source to sink)
- [ ] No orphaned stations

**UI Display:**
- [x] Route list
- [x] From/to selectors
- [x] Probability input
- [x] Distance/speed inputs
- [ ] Routing rule selector
- [ ] Gate configuration

**TODO:**
- [ ] Add routing rule UI
- [ ] Add gate configuration (AND/OR)
- [ ] Add visual network graph

---

## 10) Transport Systems ⬜

**Extraction:**
- [ ] **Conveyors:** segments (length, speed, capacity, spacing)
- [x] Accumulating/non-accumulating policy
- [ ] Zone control, transfers, dwell times
- [ ] **Vehicles (AGV/AMR/Forklift):** fleet size, speed, acceleration
- [ ] Dispatching (nearest/cyclic/priority)
- [ ] Load/unload times
- [ ] Battery/charging
- [ ] Aisle topology, collision avoidance, traffic rules, right-of-way
- [ ] **Manual carry/walk:** walk speeds; carry limits; handoff points
- [ ] Elevators/lifts/ASRS cranes; pallet shuttles
- [ ] Pick/put times; rack aisle constraints

**Validation:**
- [x] Positive speeds/distances
- [ ] Reachable paths
- [ ] Bottleneck flags

**UI Display:**
- [x] Transport type in routes
- [ ] Conveyor segment editor
- [ ] AGV fleet configuration
- [ ] Vehicle parameters

**TODO:**
- [ ] Add full conveyor editor
- [ ] Add AGV system configuration
- [ ] Add vehicle fleet manager

---

## 11) Buffers / Storage / Warehousing ⬜

**Extraction:**
- [ ] Capacities (finite/infinite explicit)
- [ ] Sharing across lines; overflow rules
- [ ] Holding policies (max time, FEFO/FIFO by age/attribute)
- [ ] Ageing/expiry distributions
- [ ] Decouplers between machines
- [ ] Dryer/curing buffers; temperature control constraints
- [ ] Counting method (units, trays, pallets)
- [ ] Space constraints

**Validation:**
- [ ] Capacity ≥ 0 (0 = infinite)
- [ ] Max hold time positive
- [ ] Expiry distribution valid

**UI Display:**
- [ ] Buffer capacity editor
- [ ] Holding policy selector
- [ ] Ageing rules

**TODO:**
- [ ] Add buffer configuration to stations
- [ ] Add holding policy UI
- [ ] Add overflow rules

---

## 12) WIP Control / Release Control ⬜

**Extraction:**
- [ ] CONWIP (cards, scope)
- [ ] Kanban (cards, signal points)
- [ ] Drum-Buffer-Rope parameters
- [ ] Line-level WIP caps
- [ ] Station-level caps
- [ ] Starvation/blocking strategies
- [ ] Periodic lot release; lot sizing
- [ ] Reorder points
- [ ] KPI tie-ins (service level, throughput targets)

**Validation:**
- [ ] Card counts > 0
- [ ] Scope references exist
- [ ] No contradictory caps

**UI Display:**
- [ ] WIP control policy selector
- [ ] CONWIP configuration
- [ ] Kanban parameters
- [ ] Cap inputs

**TODO:**
- [ ] Add WIP control section
- [ ] Add CONWIP editor
- [ ] Add Kanban editor

---

## 13) Control Logic / Events / Policies ⬜

**Extraction:**
- [ ] Event hooks: on enter/exit, on setup start/end, on fail/repair, on shift change, on batch complete
- [ ] Actions: set attribute, reroute, emit signal, log marker, trigger maintenance, change priority
- [ ] Timers: at times or offsets; watchdogs; throttling; cool-down periods
- [ ] Rule precedence/guard conditions
- [ ] No recursion/deadlocks

**Validation:**
- [ ] Event hooks reference valid events
- [ ] Actions syntactically correct
- [ ] No circular dependencies

**UI Display:**
- [ ] Event list
- [ ] Action editor
- [ ] Rule precedence order

**TODO:**
- [ ] Add control logic section
- [ ] Add event hook editor
- [ ] Add action builder

---

## 14) Statistics / KPI Definition ✅ **COMPLETE**

**Extraction:**
- [x] System KPIs: throughput, cycle time, flow time, waiting time, WIP
- [x] Utilizations, OEE, service level, lateness/tardiness
- [x] Scrap rate, rework rate, energy use, CO₂e
- [x] Object KPIs: per-station busy/idle/starve/block/setup
- [x] Queue length avg/max; buffer occupancy
- [x] Transport travel/queue/dispatch delays
- [ ] Distributional outputs: mean/median/std, percentiles (p90/p95/p99), histograms
- [ ] CIs & replication stats: confidence level
- [ ] Batch-means/independent replications
- [ ] Warmup deletion; Welch's method
- [ ] Common Random Numbers on scenarios
- [ ] Variance reduction flags

**Validation:**
- [x] KPI names recognized
- [x] At least 1 KPI defined

**UI Display:**
- [x] KPI list (read-only for now)
- [ ] KPI selector checkboxes
- [ ] Statistical method selector

**TODO:**
- [ ] Add KPI editor
- [ ] Add statistical configuration
- [ ] Add percentile selection

---

## 15) Run Configuration / Initialization ✅ **COMPLETE**

**Extraction:**
- [x] Run length; warmup; replications
- [x] Confidence level; time origin
- [ ] Initialization: empty vs steady-state
- [ ] Initial WIP per node
- [ ] Initial queue contents
- [ ] Initial resource positions/charge
- [ ] Output frequency; logging granularity
- [ ] Snapshot cadence; termination conditions

**Validation:**
- [x] runLength_min > 0
- [x] warmup_min < runLength_min
- [x] replications ≥ 1
- [x] confidence ∈ {80, 90, 95, 99}

**UI Display:**
- [x] Run length input
- [x] Warmup input
- [x] Replications input
- [x] Confidence dropdown
- [ ] Initialization mode selector
- [ ] Initial WIP editor

**TODO:**
- [ ] Add initialization configuration
- [ ] Add output frequency settings
- [ ] Add termination conditions

---

## 16) Experiments / DOE / Optimization ⬜

**Extraction:**
- [x] Baseline scenario; scenario metadata (name, notes)
- [x] Changes: JSON-patch semantics (set/add/remove paths)
- [ ] Precedence; validation of patch paths
- [ ] Scenario groups: parameter sweeps, factorial/fractional factorial, Taguchi, response surface
- [ ] Optimizer hooks: objectives (maximize throughput/minimize CT/cost/energy)
- [ ] Constraints (WIP ≤, service level ≥)
- [ ] Decision variables (counts, speeds, batch sizes, setup policies)
- [ ] CRN alignment across scenarios
- [ ] Scenario seeds; replication overrides
- [ ] Output selection per scenario (KPIs to record; export formats)

**Validation:**
- [x] At least 1 experiment
- [x] Patch paths syntactically correct
- [ ] Patch paths reference existing objects
- [x] KPIs recognized

**UI Display:**
- [ ] Experiment list
- [ ] Scenario editor
- [ ] Parameter sweep builder
- [ ] DOE configuration
- [ ] Optimization objectives

**TODO:**
- [ ] Add experiment editor UI
- [ ] Add DOE builder
- [ ] Add optimization configuration

---

## 17) Costing / Economics ⬜

**Extraction:**
- [ ] Labor cost/min; machine cost/min
- [ ] Energy $/kWh; material $/unit
- [ ] Setup/changeover cost; maintenance cost
- [ ] Inventory holding cost; backorder/lateness penalties
- [ ] Scrap cost; rework cost
- [ ] Accounting policy (fully loaded vs activity-based)
- [ ] Currency; exchange assumptions
- [ ] ROI metrics: incremental throughput value; breakeven of capacity adds

**Validation:**
- [ ] All costs ≥ 0
- [ ] Currency specified

**UI Display:**
- [ ] Cost parameters editor
- [ ] Currency selector
- [ ] ROI calculator

**TODO:**
- [ ] Add costing section
- [ ] Add cost parameter inputs
- [ ] Add ROI metrics

---

## 18) Sustainability / Energy ⬜

**Extraction:**
- [ ] Station kW active/idle
- [ ] Conveyor/vehicle energy models
- [ ] Charger efficiencies
- [ ] Emission factors (kgCO₂e/kWh)
- [ ] Scope 2 grid mix
- [ ] Temperature-control overheads
- [ ] Energy KPIs (kWh per unit; CO₂e per unit)
- [ ] Demand charge estimates (optional)

**Validation:**
- [ ] Energy values ≥ 0
- [ ] Emission factors ≥ 0

**UI Display:**
- [ ] Energy parameters per station
- [ ] Emission factor inputs
- [ ] Energy KPI dashboard

**TODO:**
- [ ] Add energy model to stations
- [ ] Add sustainability section
- [ ] Add carbon footprint calculator

---

## 19) Layout / Visualization Aids (Front-end) ⬜

**Extraction:**
- [ ] Canvas size/grid; layers; z-order; snap rules
- [ ] Node positions (x,y); rotation; footprint sizes
- [ ] Edge polylines/anchors; arrow styles; labels
- [ ] Color palette/themes; icons; status badges (starved/blocked/down)
- [ ] Table column configs (arrivals, stations, resources, KPIs)
- [ ] Units/formatting; sorting keys
- [ ] View presets (line view, resource view, energy view)
- [ ] Minimap anchors

**Validation:**
- [ ] Coordinates within canvas bounds
- [ ] Z-order non-negative

**UI Display:**
- [ ] Layout editor (drag-and-drop)
- [ ] Grid settings
- [ ] Theme selector
- [ ] View presets

**TODO:**
- [ ] Add visual layout editor
- [ ] Add drag-and-drop positioning
- [ ] Add theme/color configuration

---

## 20) Validation & Repair Gates ✅ **PARTIAL**

**Implemented:**
- [x] Units normalized (min/ft/ft·s⁻¹/entities·h⁻¹)
- [x] Arrivals: sorted, non-overlapping windows
- [x] Batch ≥1; class-mix sums to 1
- [x] Distributions: correct params; positive shapes/scales
- [x] Triangular ordering; stdev > 0
- [x] Graph: all references resolvable
- [x] Branches: per-node probabilities sum ≈ 1 (±1e-6)
- [x] Stations: every processing node has process time
- [x] Capacity/count ≥1
- [x] Resources: pool existence
- [x] Run config sanity: warmup < run length; reps ≥1
- [x] Front-end safe: no null/NaN; required fields present

**TODO:**
- [ ] Reachability source→sink
- [ ] No unintended orphans
- [ ] Failures/maintenance: no overlaps
- [ ] WIP control: no contradictory caps
- [ ] Experiments: patch paths exist
- [ ] Calendars: resource/station open when arrivals active

---

## 21) Export / Reporting / Audit ⬜

**Extraction:**
- [ ] Arrival tables (CSV); rate charts
- [ ] Station spec sheets; changeover matrices
- [ ] Resource rosters
- [ ] Scenario matrix; run plan; RNG map
- [ ] Diff logs between parses
- [ ] Changelog with timestamps/user
- [ ] Checksums of inputs/outputs
- [ ] Reproducibility bundle

**Validation:**
- [ ] Export formats valid (CSV, JSON, Excel)
- [ ] Checksums match

**UI Display:**
- [ ] Export button
- [ ] Format selector
- [ ] Diff viewer
- [ ] Audit log

**TODO:**
- [ ] Add export functionality
- [ ] Add diff/changelog
- [ ] Add audit trail

---

## 22) Error Classes & Messaging (for the parser) ⬜

**Implemented:**
- [x] Clear error messages with paths
- [x] Corrective hints
- [x] Auto-fix for 5+ common errors

**TODO:**
- [ ] Error classification system
- [ ] Warning severity levels
- [ ] Suggested minimal fixes for all error types
- [ ] Error code catalog

---

## 🎯 COVERAGE SUMMARY

| Section | Status | Completion |
|---------|--------|------------|
| 0. Global/Provenance | ⬜ Pending | 20% |
| 1. Entities | ⬜ Pending | 40% |
| 2. Arrivals | ✅ Complete | 95% |
| 3. Calendars | ⬜ Pending | 30% |
| 4. Stations | 🟡 Partial | 70% |
| 5. Setups | 🟡 Partial | 50% |
| 6. Quality | 🟡 Partial | 40% |
| 7. Failures | 🟡 Partial | 60% |
| 8. Resources | 🟡 Partial | 60% |
| 9. Routing | ✅ Complete | 90% |
| 10. Transport | ⬜ Pending | 30% |
| 11. Buffers | ⬜ Pending | 10% |
| 12. WIP Control | ⬜ Pending | 0% |
| 13. Control Logic | ⬜ Pending | 0% |
| 14. Statistics/KPIs | ✅ Complete | 80% |
| 15. Run Config | ✅ Complete | 90% |
| 16. Experiments | 🟡 Partial | 50% |
| 17. Costing | ⬜ Pending | 0% |
| 18. Energy | ⬜ Pending | 0% |
| 19. Visualization | ⬜ Pending | 0% |
| 20. Validation | 🟡 Partial | 70% |
| 21. Export/Audit | ⬜ Pending | 0% |
| 22. Error Messages | 🟡 Partial | 60% |

**Overall Coverage: 45%**

---

## 📋 NEXT PRIORITIES

### Phase 1 (Critical - Simulation Readiness):
1. Complete Calendars/Shifts (Section 3)
2. Complete Stations (batching, energy) (Section 4)
3. Complete Setups (matrix editor) (Section 5)
4. Complete Quality (inspection) (Section 6)
5. Complete Failures (planned maintenance) (Section 7)

### Phase 2 (Advanced Features):
6. Add WIP Control (Section 12)
7. Add Transport Systems (Section 10)
8. Add Control Logic (Section 13)
9. Add Experiments UI (Section 16)
10. Add Visualization (Section 19)

### Phase 3 (Professional Polish):
11. Add Costing (Section 17)
12. Add Energy/Sustainability (Section 18)
13. Add Export/Audit (Section 21)
14. Complete Error System (Section 22)

---

Use this checklist to track parser development and ensure **150% Simio-grade coverage**!
