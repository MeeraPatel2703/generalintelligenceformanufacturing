import { app, BrowserWindow, ipcMain, dialog, session } from 'electron'
import * as path from 'path'
import * as fs from 'fs/promises'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { analyzeFactoryData } from './aiService.js'
// import { cacheService } from './cache.js' // DISABLED - better-sqlite3 causing issues
import { runSimpleMonteCarlo } from './simulation/simpleSim.js'
import { runDESSimulation, runComprehensiveSimulation } from './simulation/desRunner.js'
import { parseDocument, validateDocumentFile, getDocumentInfo } from './documentParser.js'
import { extractSystemFromDocument } from './entityExtractor.js'
import { runDESFromExtractedSystem } from './simulation/SystemToDESMapper.js'
import { runExtractedSystemWithComprehensiveAnalysis } from './simulation/ExtractedSystemToAnalysisAdapter.js'
import { initializeChatbot, handleChatbotMessage } from './chatbotService.js'
import { safeLog, safeError, safeWarn } from './safeConsole.js'

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env file
// Try multiple locations for .env file (development vs packaged)
// Don't use app.getAppPath() here as app is not ready yet
const envPaths = [
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '.env'),
  path.join(__dirname, '../../.env')
]

let envLoaded = false
for (const envPath of envPaths) {
  try {
    const result = dotenv.config({ path: envPath })
    if (result.parsed && Object.keys(result.parsed).length > 0) {
      safeLog('[Main] Loaded .env from:', envPath)
      safeLog('[Main] Environment variables loaded:', Object.keys(result.parsed).join(', '))
      envLoaded = true
      break
    }
  } catch (err) {
    // Continue to next path
  }
}

if (!envLoaded) {
  safeWarn('[Main] Could not find .env file in any of these locations:')
  envPaths.forEach(p => safeWarn('[Main]   -', p))
  safeWarn('[Main] Trying environment variables from system...')
}

// Verify API key is available
if (process.env.OPENAI_API_KEY) {
  safeLog('[Main] OPENAI_API_KEY is available (length:', process.env.OPENAI_API_KEY.length, ')')
} else {
  safeError('[Main] OPENAI_API_KEY is NOT available!')
  safeError('[Main] Please set OPENAI_API_KEY in .env file or system environment')
}

// No special command line switches needed for unpackaged mode

// Mock cache service since better-sqlite3 is disabled
const cacheService = {
  get: (_key: string): null | { analysis: string; timestamp: number } => null,
  set: (_key: string, _value: any) => {},
  clear: () => {},
  hashCSV: (_content: string) => 'mock-hash',
  clearOld: (_days: number) => {},
  close: () => {}
}

// __dirname is available in CommonJS automatically

let mainWindow: BrowserWindow | null = null

/**
 * Check if running in development mode
 * Must be called after app is ready
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || !app.isPackaged
}

function createWindow() {
  // Determine the preload script path
  // Since we're in dist-electron/electron/main.js, preload.cjs is in the same directory
  const preloadPath = path.join(__dirname, 'preload.cjs')
  safeLog('[Main] __dirname:', __dirname)
  safeLog('[Main] Preload path:', preloadPath)

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // Listen for preload errors
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    safeError('[Main] Page failed to load:', errorCode, errorDescription)
  })

  mainWindow.webContents.on('preload-error', (_event, preloadPath, error) => {
    safeError('[Main] Preload script error:', preloadPath, error)
  })

  // Always load from bundled HTML (no dev server needed)
  const indexPath = path.join(__dirname, '../../dist/index.html')
  safeLog('[Main] Loading HTML from:', indexPath)

  mainWindow.loadFile(indexPath)

  // Open dev tools for debugging
  mainWindow.webContents.openDevTools()

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  // Initialize chatbot with OpenAI API key
  if (process.env.OPENAI_API_KEY) {
    initializeChatbot(process.env.OPENAI_API_KEY)
    safeLog('[Main] Chatbot initialized')
  } else {
    safeWarn('[Main] Chatbot not initialized - missing OPENAI_API_KEY')
  }

  // Set Content-Security-Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          isDevelopment()
            ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*; style-src 'self' 'unsafe-inline' http://localhost:*; img-src 'self' data: blob: http://localhost:*; connect-src 'self' http://localhost:* ws://localhost:* https://api.openai.com;"
            : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://api.openai.com; font-src 'self' data:;"
        ]
      }
    })
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers
ipcMain.handle('dialog:openFile', async () => {
  if (!mainWindow) {
    return { canceled: true }
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true }
  }

  return {
    canceled: false,
    filePath: result.filePaths[0]
  }
})

// Document file dialog (for PDFs, Word docs, etc.)
ipcMain.handle('dialog:openDocument', async () => {
  if (!mainWindow) {
    return { canceled: true }
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Documents', extensions: ['pdf', 'docx', 'doc', 'txt', 'md'] },
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'Word Documents', extensions: ['docx', 'doc'] },
      { name: 'Text Files', extensions: ['txt', 'md'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true }
  }

  return {
    canceled: false,
    filePath: result.filePaths[0]
  }
})

ipcMain.handle('file:read', async (_event, filePath: string) => {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    const stats = await fs.stat(filePath)

    return {
      success: true,
      content: data,
      name: path.basename(filePath),
      size: stats.size,
      path: filePath
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read file'
    }
  }
})

// AI Analysis Handler
ipcMain.handle('analyze-factory-data', async (_event, csvContent: string) => {
  try {
    safeLog('[Main] Starting AI analysis...')

    // Generate hash for caching
    const csvHash = cacheService.hashCSV(csvContent)
    safeLog('[Main] CSV hash:', csvHash.substring(0, 8))

    // Check cache first
    const cached = cacheService.get(csvHash)
    if (cached) {
      safeLog('[Main] Returning cached analysis')
      const cacheAge = Date.now() - cached.timestamp
      const minutesAgo = Math.floor(cacheAge / 60000)

      return {
        success: true,
        analysis: JSON.parse(cached.analysis),
        cached: true,
        cache_timestamp: cached.timestamp,
        cache_age_minutes: minutesAgo
      }
    }

    // Perform AI analysis
    safeLog('[Main] No cache found, calling OpenAI API...')
    const analysis = await analyzeFactoryData(csvContent)

    // Cache the result
    cacheService.set(csvHash, JSON.stringify(analysis))
    safeLog('[Main] Analysis complete and cached')

    return {
      success: true,
      analysis,
      cached: false
    }
  } catch (error) {
    safeError('[Main] AI analysis error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during analysis'
    }
  }
})

// Get cached analysis by CSV content
ipcMain.handle('get-cached-analysis', async (_event, csvContent: string) => {
  try {
    const csvHash = cacheService.hashCSV(csvContent)
    const cached = cacheService.get(csvHash)

    if (cached) {
      const cacheAge = Date.now() - cached.timestamp
      const minutesAgo = Math.floor(cacheAge / 60000)

      return {
        success: true,
        analysis: JSON.parse(cached.analysis),
        cached: true,
        cache_timestamp: cached.timestamp,
        cache_age_minutes: minutesAgo
      }
    }

    return {
      success: false,
      error: 'No cached analysis found'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve cache'
    }
  }
})

// Clear cache handler
ipcMain.handle('clear-cache', async () => {
  try {
    cacheService.clear()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear cache'
    }
  }
})

// DES Simulation handler
ipcMain.handle('run-simulation', async (_event, extractedSystem, numReplications: number = 100) => {
  try {
    safeLog('[Main] Starting DES simulation with', numReplications, 'replications')
    safeLog('[Main] Extracted system:', extractedSystem?.systemName)

    // Check if this is an ExtractedSystem (from document) or old analysis format
    if (extractedSystem?.systemName && extractedSystem?.entities) {
      // New path: Use proper DES engine with extracted system
      safeLog('[Main] Using new DES engine with extracted system')

      const results = runDESFromExtractedSystem(
        extractedSystem,
        480, // 8 hours default
        numReplications
      )

      safeLog('[Main] DES simulation complete')
      return {
        success: true,
        results
      }
    } else {
      // Old path: Use legacy DES runner
      safeLog('[Main] Using legacy DES runner')

      const results = runDESSimulation(extractedSystem, numReplications, (progress) => {
        // Send progress updates to renderer
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('simulation-progress', progress)
        }
      })

      safeLog('[Main] DES simulation complete')
      return {
        success: true,
        results
      }
    }
  } catch (error) {
    safeError('[Main] Simulation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Simulation failed'
    }
  }
})

// Monte Carlo simulation handler (legacy/fast)
ipcMain.handle('run-monte-carlo', async (_event, analysis, numReplications: number = 1000) => {
  try {
    safeLog('[Main] Starting Monte Carlo simulation with', numReplications, 'replications')

    const results = runSimpleMonteCarlo(analysis, numReplications, (progress) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('simulation-progress', progress)
      }
    })

    safeLog('[Main] Monte Carlo complete')
    return {
      success: true,
      results
    }
  } catch (error) {
    safeError('[Main] Simulation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Simulation failed'
    }
  }
})

// Document parsing handler
ipcMain.handle('document:parse', async (_event, filePath: string) => {
  try {
    safeLog('[Main] Parsing document:', filePath)

    // Validate file first
    const validation = await validateDocumentFile(filePath)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      }
    }

    // Parse the document
    const parseResult = await parseDocument(filePath)

    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error
      }
    }

    safeLog('[Main] Document parsed successfully')
    return {
      success: true,
      content: parseResult.content,
      metadata: parseResult.metadata
    }
  } catch (error) {
    safeError('[Main] Document parsing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during document parsing'
    }
  }
})

// System extraction handler
ipcMain.handle('extract-system', async (_event, documentContent: string, documentType: 'pdf' | 'word' | 'text') => {
  try {
    safeLog('[Main] Starting system extraction...')
    safeLog('[Main] Document type:', documentType)
    safeLog('[Main] Content length:', documentContent.length)

    const result = await extractSystemFromDocument(documentContent, documentType)

    if (!result.success) {
      return {
        success: false,
        error: result.error
      }
    }

    safeLog('[Main] System extraction complete')
    return {
      success: true,
      system: result.system,
      warnings: result.warnings,
      tokensUsed: result.tokensUsed
    }
  } catch (error) {
    safeError('[Main] System extraction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during system extraction'
    }
  }
})

// Get document info handler
ipcMain.handle('document:info', async (_event, filePath: string) => {
  try {
    const info = await getDocumentInfo(filePath)
    return {
      success: true,
      ...info
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get document info'
    }
  }
})

// Comprehensive simulation handler (formerly KeyCraft)
ipcMain.handle('run-comprehensive-simulation', async (_event, extractedSystemOrAnalysis, numReplications: number = 10) => {
  try {
    safeLog('[Main] Starting comprehensive simulation with advanced analysis')
    safeLog('[Main] Replications:', numReplications)

    // Check if this is an ExtractedSystem (from document) or FactoryAnalysis
    if (extractedSystemOrAnalysis?.systemName && extractedSystemOrAnalysis?.entities) {
      // For ExtractedSystem: Convert to FactoryAnalysis using adapter
      safeLog('[Main] ExtractedSystem detected - using adapter to convert to FactoryAnalysis')
      safeLog('[Main] System:', extractedSystemOrAnalysis.systemName)

      // Run simulation and convert to FactoryAnalysis format
      const factoryAnalysis = runExtractedSystemWithComprehensiveAnalysis(
        extractedSystemOrAnalysis,
        480, // 8 hours simulation time
        numReplications
      )

      safeLog('[Main] Adapter conversion complete, running comprehensive analysis...')

      // Now run comprehensive analysis on the converted data
      const comprehensiveResults = runComprehensiveSimulation(
        factoryAnalysis,
        numReplications,
        (progress) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('simulation-progress', progress)
          }
        }
      )

      safeLog('[Main] Comprehensive simulation complete')
      return {
        success: true,
        results: comprehensiveResults
      }
    } else {
      // For FactoryAnalysis: Use comprehensive simulation with full Simio-style stats
      safeLog('[Main] Using comprehensive simulation with FactoryAnalysis')

      const comprehensiveResults = runComprehensiveSimulation(
        extractedSystemOrAnalysis,
        numReplications,
        (progress) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('simulation-progress', progress)
          }
        }
      )

      safeLog('[Main] Comprehensive simulation complete')
      return {
        success: true,
        results: comprehensiveResults
      }
    }
  } catch (error) {
    safeError('[Main] Comprehensive simulation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Comprehensive simulation failed'
    }
  }
})

// Chatbot message handler
ipcMain.handle('chatbot:sendMessage', async (_event, request) => {
  try {
    safeLog('[Main] Chatbot message:', request.message)
    const response = await handleChatbotMessage(request)
    safeLog('[Main] Chatbot response generated')
    return response
  } catch (error) {
    safeError('[Main] Chatbot error:', error)
    return {
      message: '',
      error: error instanceof Error ? error.message : 'Chatbot error'
    }
  }
})

// Clean up cache on app quit
app.on('will-quit', () => {
  safeLog('[Main] Cleaning up before quit')
  cacheService.clearOld(7) // Clear entries older than 7 days
  cacheService.close()
})
