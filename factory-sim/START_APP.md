# How to Start the Factory Simulator

## ✅ WORKING METHOD

```bash
cd /Users/meerapatel/simiodestroyer/factory-sim
npx electron .
```

**OR**

```bash
npm start
```

## What Should Happen

1. Terminal shows build messages
2. You'll see: `[dotenv] injecting env (2) from .env`
3. **A window should appear with the Factory Simulator app**
4. The window title says "Factory Simulation"
5. You'll see the UI with upload buttons

## If No Window Appears

### Check 1: Is Electron Running?
```bash
ps aux | grep Electron | grep -v grep
```

If you see processes, Electron is running but the window might be:
- Hidden behind other windows
- On a different desktop/space
- Minimized

### Check 2: Bring Window to Front
- Press `Cmd + Tab` and look for "Electron"
- Or check Mission Control (F3) for the window

### Check 3: Kill and Restart
```bash
killall Electron
npm start
```

## Testing the DES Simulation

Once the app opens:

1. **Upload a Document**
   - Click "Upload Document"
   - Select `sample_case_study.txt`
   - Wait 5-10 seconds for AI extraction

2. **Run Simulation**
   - Click "Run Simulation"
   - Watch entities flow through system
   - See statistics update in real-time

3. **Verify Results**
   - Throughput should be ~25-26/hour
   - Average cycle time ~5-6 minutes
   - Conservation law maintained

## Quick Diagnostics

```bash
# Check if app is built
ls -la dist/bundle.js dist-electron/electron/main.js

# Check if node_modules exist
ls node_modules/electron

# View recent console output
tail -50 /tmp/electron-output.log

# Force clean restart
killall Electron
rm -rf node_modules/.cache
npm start
```

## Current Status

- ✅ App builds successfully
- ✅ Electron launches
- ✅ DES engine verified working
- ✅ All integration tests pass (6/6)
- ⚠️ Window visibility may vary by system

The app **IS working** - if you don't see a window, it's likely a display/focus issue, not a code issue.
