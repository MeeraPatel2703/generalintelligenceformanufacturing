# 🟢🔴 RED/GREEN VERIFIER REPORT

## Parser Validation & Completeness Check

**Model:** `{{model_id}}`
**Version:** `{{version}}`
**Parsed:** `{{timestamp}}`
**Parser:** `{{parser_version}}`

---

## ✅ DEFINITION OF DONE CHECKLIST

### Critical (Must Pass) ⬜

- [ ] **0.1** Model metadata complete (name, version, timestamps)
- [ ] **1.1** At least 1 entity defined with valid attributes
- [ ] **2.1** At least 1 arrival policy defined
- [ ] **2.2** All arrival rate windows sorted and non-overlapping
- [ ] **2.3** Class mix proportions sum to 1.0 (±0.001)
- [ ] **4.1** Every processing station has `processTime` distribution
- [ ] **4.2** All station counts and capacities ≥ 1
- [ ] **4.3** All distributions have valid parameters
- [ ] **9.1** All route references (from/to) exist in stations
- [ ] **9.2** Route probabilities per station sum to 1.0 (±0.001)
- [ ] **15.1** `runLength_min > 0`
- [ ] **15.2** `warmup_min < runLength_min`
- [ ] **15.3** `replications ≥ 1`
- [ ] **15.4** `confidence ∈ {80, 90, 95, 99}`
- [ ] **20.1** All units normalized (min/ft/ft·s⁻¹/entities·h⁻¹)
- [ ] **20.2** No null/NaN values in required fields

### High Priority (Should Pass) ⬜

- [ ] **2.4** Batch size ≥ 1 for all arrivals
- [ ] **3.1** Calendar shifts non-overlapping
- [ ] **5.1** Setup times have valid distributions
- [ ] **6.1** Rework targets exist in station list
- [ ] **6.2** Scrap/yield probabilities in [0, 1]
- [ ] **7.1** MTBF/MTTR positive when defined
- [ ] **8.1** Resource pool counts ≥ 1
- [ ] **8.2** All resource references resolve
- [ ] **14.1** At least 1 KPI defined
- [ ] **16.1** At least 1 experiment (baseline)

### Medium Priority (Recommended) ⬜

- [ ] **1.2** Entity attributes properly typed
- [ ] **3.2** Break offsets < shift duration
- [ ] **4.4** Queue disciplines valid
- [ ] **7.2** No overlapping maintenance windows
- [ ] **9.3** Network connectivity (source → sink)
- [ ] **10.1** Positive speeds/distances for transport
- [ ] **16.2** Experiment patch paths exist

### Low Priority (Nice to Have) ⬜

- [ ] **0.2** Assumptions documented
- [ ] **1.3** BOM relationships complete
- [ ] **4.5** Layout positions defined
- [ ] **8.3** Skills/qualifications defined
- [ ] **17.1** Cost parameters specified
- [ ] **18.1** Energy models defined
- [ ] **19.1** Visualization config complete

---

## 🎯 COVERAGE SCORES

### Section Completeness

| Section | Weight | Score | Status |
|---------|--------|-------|--------|
| 0. Global/Provenance | 2% | {{score_0}}% | {{status_0}} |
| 1. Entities | 5% | {{score_1}}% | {{status_1}} |
| 2. Arrivals | 10% | {{score_2}}% | {{status_2}} |
| 3. Calendars | 3% | {{score_3}}% | {{status_3}} |
| 4. Stations | 15% | {{score_4}}% | {{status_4}} |
| 5. Setups | 5% | {{score_5}}% | {{status_5}} |
| 6. Quality | 5% | {{score_6}}% | {{status_6}} |
| 7. Failures | 5% | {{score_7}}% | {{status_7}} |
| 8. Resources | 8% | {{score_8}}% | {{status_8}} |
| 9. Routing | 12% | {{score_9}}% | {{status_9}} |
| 10. Transport | 5% | {{score_10}}% | {{status_10}} |
| 11. Buffers | 2% | {{score_11}}% | {{status_11}} |
| 12. WIP Control | 3% | {{score_12}}% | {{status_12}} |
| 13. Control Logic | 2% | {{score_13}}% | {{status_13}} |
| 14. KPIs | 5% | {{score_14}}% | {{status_14}} |
| 15. Run Config | 8% | {{score_15}}% | {{status_15}} |
| 16. Experiments | 3% | {{score_16}}% | {{status_16}} |
| 17. Costing | 1% | {{score_17}}% | {{status_17}} |
| 18. Energy | 1% | {{score_18}}% | {{status_18}} |
| 19. Visualization | 2% | {{score_19}}% | {{status_19}} |
| 20. Validation | 2% | {{score_20}}% | {{status_20}} |
| **TOTAL** | **100%** | **{{total_score}}%** | **{{total_status}}** |

### Status Legend
- 🟢 **PASS** (≥80%): Section complete and validated
- 🟡 **WARN** (50-79%): Partial, may need review
- 🔴 **FAIL** (<50%): Incomplete or invalid
- ⚪ **N/A**: Not applicable to this model

---

## 📊 VALIDATION RESULTS

### Errors (Blocking) 🔴

```
{{#if errors}}
{{#each errors}}
[{{severity}}] {{path}}: {{message}}
  → Suggestion: {{suggestion}}
{{/each}}
{{else}}
✅ No blocking errors
{{/if}}
```

### Warnings (Non-Blocking) 🟡

```
{{#if warnings}}
{{#each warnings}}
[WARN] {{path}}: {{message}}
  → Suggestion: {{suggestion}}
{{/each}}
{{else}}
✅ No warnings
{{/if}}
```

### Info (Informational) ℹ️

```
{{#if infos}}
{{#each infos}}
[INFO] {{path}}: {{message}}
{{/each}}
{{else}}
No informational messages
{{/if}}
```

---

## 🔍 DETAILED FINDINGS

### Arrivals Analysis
- **Total policies:** {{arrivals_count}}
- **Rate windows:** {{rate_windows_count}}
- **Schedule entries:** {{schedule_entries_count}}
- **Coverage:** {{arrivals_coverage}}
- **Issues:** {{arrivals_issues}}

### Stations Analysis
- **Total stations:** {{stations_count}}
- **With process times:** {{stations_with_process_time}}
- **With setups:** {{stations_with_setup}}
- **With failures:** {{stations_with_failures}}
- **With rework:** {{stations_with_rework}}
- **Issues:** {{stations_issues}}

### Routing Analysis
- **Total routes:** {{routes_count}}
- **Connected components:** {{connected_components}}
- **Orphaned nodes:** {{orphaned_nodes}}
- **Dead ends:** {{dead_ends}}
- **Issues:** {{routing_issues}}

### Resources Analysis
- **Total pools:** {{resources_count}}
- **Operators:** {{operators_count}}
- **Tools:** {{tools_count}}
- **Vehicles:** {{vehicles_count}}
- **Issues:** {{resources_issues}}

---

## 🎓 SIMULATION READINESS

### Can Run Simulation? {{can_simulate}}

**Requirements:**
- [{{req_entities}}] At least 1 entity
- [{{req_arrivals}}] At least 1 arrival
- [{{req_stations}}] At least 1 station with process time
- [{{req_routes}}] Connected routing network
- [{{req_runconfig}}] Valid run configuration
- [{{req_validation}}] No blocking errors

### Simulation Quality Grade: {{quality_grade}}

- **A+ (95-100%)**: Production-ready, comprehensive model
- **A (85-94%)**: Ready to run, minor gaps acceptable
- **B (70-84%)**: Functional, missing advanced features
- **C (60-69%)**: Minimal viable, significant gaps
- **F (<60%)**: Not ready, major issues

---

## 🚀 RECOMMENDATIONS

### Immediate Actions (Required)
```
{{#each immediate_actions}}
- [ ] {{this}}
{{/each}}
```

### Short-Term Improvements (Recommended)
```
{{#each short_term}}
- [ ] {{this}}
{{/each}}
```

### Long-Term Enhancements (Optional)
```
{{#each long_term}}
- [ ] {{this}}
{{/each}}
```

---

## 📈 COMPARISON TO STANDARDS

### Simio Equivalence: {{simio_equivalence}}%
- Models comparable Simio model completeness

### Arena Equivalence: {{arena_equivalence}}%
- Models comparable Arena model completeness

### FlexSim Equivalence: {{flexsim_equivalence}}%
- Models comparable FlexSim model completeness

---

## 🔄 CHANGELOG

### Parse Attempts
```
Attempt 1: {{attempt_1_status}} - {{attempt_1_issues}}
{{#if attempt_2_status}}
Attempt 2: {{attempt_2_status}} - {{attempt_2_issues}}
{{/if}}
```

### Auto-Repairs Applied
```
{{#each repairs}}
- {{description}} ({{timestamp}})
{{/each}}
```

### Manual Edits Required
```
{{#each manual_edits}}
- {{description}}
{{/each}}
```

---

## ✅ SIGN-OFF

### Parser Validation
- **Date:** {{validation_date}}
- **Validator:** {{validator_name}}
- **Signature:** {{validator_signature}}

### User Approval
- **Date:** {{approval_date}}
- **Approved By:** {{approver_name}}
- **Signature:** {{approver_signature}}

### Simulation Engineer Review
- **Date:** {{review_date}}
- **Reviewed By:** {{reviewer_name}}
- **Signature:** {{reviewer_signature}}

---

## 📝 NOTES

```
{{notes}}
```

---

**Generated by:** Simio Destroyer Parser v{{parser_version}}
**Report Template:** RED_GREEN_VERIFIER v1.0
**Generation Time:** {{generation_time}}

---

## 🔗 RELATED DOCUMENTS

- Model JSON: `{{model_json_path}}`
- Parse Log: `{{parse_log_path}}`
- Validation Report: `{{validation_report_path}}`
- Simulation Results: `{{results_path}}`

---

**VERDICT:** {{#if passed}}🟢 **APPROVED FOR SIMULATION**{{else}}🔴 **REQUIRES FIXES**{{/if}}

