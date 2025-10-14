#!/bin/bash

# Fix all unused variable errors in electron directory

# electron/simulation/DESEngine.ts line 70
sed -i '' 's/const mean =/const _mean =/g' electron/simulation/DESEngine.ts

# electron/simulation/distributions.ts line 125
sed -i '' 's/function.*rng.*{/function triangular(_rng: any, min: number, mode: number, max: number): number {/g' electron/simulation/distributions.ts

# electron/simulation/engine.ts lines 157, 290
sed -i '' 's/(event,/(\_event,/g' electron/simulation/engine.ts

# electron/simulation/simpleSim.ts line 94
sed -i '' 's/idx)/_idx)/g' electron/simulation/simpleSim.ts

# electron/simulation/SnowTubingSimulation.ts line 7
sed -i '' 's/, Resource//g' electron/simulation/SnowTubingSimulation.ts

# electron/simulation/SystemToDESMapper.ts line 6
sed -i '' 's/, ResourceDef//g' electron/simulation/SystemToDESMapper.ts

# electron/simulation/SystemToDESMapper.ts line 13
sed -i '' 's/const entityId =/const _entityId =/g' electron/simulation/SystemToDESMapper.ts

# electron/simulation/SystemToDESMapper.ts line 206  
sed -i '' 's/(process,/(\_process,/g' electron/simulation/SystemToDESMapper.ts

echo "Fixed all electron errors"
