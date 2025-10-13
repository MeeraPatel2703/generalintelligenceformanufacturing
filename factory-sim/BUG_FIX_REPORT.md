# Bug Fix Report: OPENAI_API_KEY Not Configured Error

## Bug Description
Error message appeared when trying to extract DES system from document:
```
Error: OPENAI_API_KEY not configured in .env file
```

Despite the `.env` file existing with a valid `OPENAI_API_KEY`, the Electron application could not find it.

---

## Root Cause Analysis

The issue was in `electron/main.ts` where `dotenv.config()` was called without specifying a path. In packaged Electron applications, the working directory and `__dirname` can be different from the project root, causing dotenv to look in the wrong location.

**Original Code** (Line 14):
```typescript
dotenv.config()
```

This only checked one location and silently failed if `.env` wasn't found there.

---

## The Fix

**File**: `electron/main.ts`
**Lines**: 13-50

### New Implementation:

```typescript
// Load environment variables from .env file
// Try multiple locations for .env file (development vs packaged)
const envPaths = [
  path.join(process.cwd(), '.env'),           // Current working directory
  path.join(__dirname, '.env'),                // Same dir as main.js
  path.join(__dirname, '../../.env'),          // Project root from dist-electron
  path.join(app.getAppPath(), '.env'),         // Electron app path
  path.join(app.getAppPath(), '../../.env')    // Parent of app path
]

let envLoaded = false
for (const envPath of envPaths) {
  try {
    const result = dotenv.config({ path: envPath })
    if (result.parsed && Object.keys(result.parsed).length > 0) {
      console.log('[Main] ✓ Loaded .env from:', envPath)
      console.log('[Main] ✓ Environment variables loaded:', Object.keys(result.parsed).join(', '))
      envLoaded = true
      break
    }
  } catch (err) {
    // Continue to next path
  }
}

if (!envLoaded) {
  console.warn('[Main] ⚠️  Could not find .env file in any of these locations:')
  envPaths.forEach(p => console.warn('[Main]   -', p))
  console.warn('[Main] ⚠️  Trying environment variables from system...')
}

// Verify API key is available
if (process.env.OPENAI_API_KEY) {
  console.log('[Main] ✓ OPENAI_API_KEY is available (length:', process.env.OPENAI_API_KEY.length, ')')
} else {
  console.error('[Main] ✗ OPENAI_API_KEY is NOT available!')
  console.error('[Main] ✗ Please set OPENAI_API_KEY in .env file or system environment')
}
```

### What This Does:

1. **Tries Multiple Paths**: Checks 5 different locations where `.env` might be
2. **Logs Success**: Shows which path worked when loading succeeds
3. **Logs Failure**: Shows all attempted paths if loading fails
4. **Validates API Key**: Confirms the key is available after loading
5. **Helpful Error Messages**: Provides clear feedback in console

---

## Verification

### Pre-Flight Check:
```bash
node test-extraction.js
```

Should output:
```
=== ENVIRONMENT CHECK ===
✓ Node version: v24.2.0
✓ Working directory: /path/to/factory-sim
✓ OPENAI_API_KEY present: true
✓ OPENAI_API_KEY length: 164
✓ .env file found at: /path/to/.env
✓ Test document found: /path/to/test-snow-tubing.txt
✓ Document length: 1670 chars
✓ Compiled main.js found at: dist-electron/electron/main.js
✓ Fixed dotenv loading code present in main.js
✓ Extractor service compiled

=== ALL PRE-FLIGHT CHECKS PASSED ===
```

### When Running Application:

**Expected Console Output on Startup:**
```
[Main] ✓ Loaded .env from: /Users/meerapatel/simiodestroyer/factory-sim/.env
[Main] ✓ Environment variables loaded: ANTHROPIC_API_KEY, OPENAI_API_KEY
[Main] ✓ OPENAI_API_KEY is available (length: 164)
```

**If .env NOT Found:**
```
[Main] ⚠️  Could not find .env file in any of these locations:
[Main]   - /path1/.env
[Main]   - /path2/.env
[Main]   - /path3/.env
[Main]   - /path4/.env
[Main]   - /path5/.env
[Main] ⚠️  Trying environment variables from system...
[Main] ✗ OPENAI_API_KEY is NOT available!
[Main] ✗ Please set OPENAI_API_KEY in .env file or system environment
```

---

## Testing Instructions

### 1. Build the Application:
```bash
npm run build:all
```

### 2. Run Pre-Flight Check:
```bash
node test-extraction.js
```

### 3. Start Application:
```bash
npm start
```

### 4. Follow Testing Checklist:
See `TESTING_CHECKLIST.md` for complete end-to-end testing steps.

### 5. Test Document Extraction:
1. Click "Upload Document"
2. Select `test-snow-tubing.txt`
3. Click "Extract DES Model"
4. **Expected**: No error, system extracts successfully
5. **Console**: Should show OpenAI API calls and successful extraction

---

## Files Modified

| File | Lines Modified | Description |
|------|---------------|-------------|
| `electron/main.ts` | 13-50 | Added multi-path .env loading with validation |

---

## Files Created

| File | Purpose |
|------|---------|
| `test-extraction.js` | Pre-flight verification script |
| `TESTING_CHECKLIST.md` | Complete testing guide |
| `BUG_FIX_REPORT.md` | This document |
| `test-snow-tubing.txt` | Test document for extraction |

---

## Success Criteria

✅ **Bug is FIXED when:**

1. Application starts without .env errors
2. Console shows: `[Main] ✓ Loaded .env from: <path>`
3. Console shows: `[Main] ✓ OPENAI_API_KEY is available (length: 164)`
4. Document extraction works without "OPENAI_API_KEY not configured" error
5. AI extraction completes successfully
6. System extracts entities, resources, and processes from test document

---

## Fallback Solutions

### If .env Still Not Found:

**Option 1: Set Environment Variable Globally**
```bash
export OPENAI_API_KEY="your-key-here"
npm start
```

**Option 2: Inline Environment Variable**
```bash
OPENAI_API_KEY="your-key-here" npm start
```

**Option 3: Create .env in Multiple Locations**
```bash
cp .env dist-electron/.env
cp .env dist-electron/electron/.env
```

---

## Prevention

To prevent this issue in future:

1. ✅ Always check multiple paths for config files in Electron apps
2. ✅ Add verbose logging for environment loading
3. ✅ Validate required environment variables on startup
4. ✅ Provide clear error messages with actionable steps
5. ✅ Include pre-flight check scripts

---

## Status

- [x] Bug identified
- [x] Root cause analyzed
- [x] Fix implemented
- [x] Code compiled successfully
- [x] Pre-flight checks pass
- [x] Ready for end-to-end testing

**Next Step**: User should run `npm start` and test document extraction to confirm the error is resolved.
