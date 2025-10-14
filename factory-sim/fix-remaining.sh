#!/bin/bash

# Fix distributions.ts - just remove the rng parameter from function signature
sed -i '' '125s/function triangular(_rng: any, min: number, mode: number, max: number)/function triangular(min: number, mode: number, max: number)/' electron/simulation/distributions.ts

# Fix engine.ts - prefix unused event params
sed -i '' '157s/forEach((event/forEach((_event/' electron/simulation/engine.ts  
sed -i '' '290s/forEach((event/forEach((_event/' electron/simulation/engine.ts

# Fix SnowTubingSimulation.ts - prefix event params in methods
sed -i '' '421s/handleArrival(event/handleArrival(_event/' electron/simulation/SnowTubingSimulation.ts
sed -i '' '520s/handleSessionStart(event/handleSessionStart(_event/' electron/simulation/SnowTubingSimulation.ts
sed -i '' '524s/handleSessionEnd(event/handleSessionEnd(_event/' electron/simulation/SnowTubingSimulation.ts
sed -i '' '528s/handleTubingStart(event/handleTubingStart(_event/' electron/simulation/SnowTubingSimulation.ts

# Fix SystemToDESMapper.ts - remove ResourceDef import and fix process param
sed -i '' '6s/ResourceDef,//' electron/simulation/SystemToDESMapper.ts
sed -i '' '13s/const entityId =/const _entityId =/' electron/simulation/SystemToDESMapper.ts
sed -i '' '206s/forEach((process/forEach((_process/' electron/simulation/SystemToDESMapper.ts

echo "Fixed remaining errors"
