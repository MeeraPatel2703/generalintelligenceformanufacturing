import { contextBridge, ipcRenderer } from 'electron'
import { AnalysisResult } from '../src/types/analysis'
import { SimulationResults } from '../src/types/simulation'
import { ExtractedSystem, DocumentParseResult } from '../src/types/extraction'

// Log that preload script is executing
console.log('[Preload] Preload script is executing')

export interface FileDialogResult {
  canceled: boolean
  filePath?: string
}

export interface FileReadResult {
  success: boolean
  content?: string
  name?: string
  size?: number
  path?: string
  error?: string
}

export interface SimulationResult {
  success: boolean
  results?: SimulationResults
  error?: string
}

export interface DocumentInfo {
  success: boolean
  name?: string
  extension?: string
  size?: number
  supported?: boolean
  error?: string
}

export interface SystemExtractionResult {
  success: boolean
  system?: ExtractedSystem
  warnings?: string[]
  tokensUsed?: {
    input: number
    output: number
  }
  error?: string
}

export interface ComprehensiveSimulationResult {
  success: boolean
  results?: any // ComprehensiveSimulationResults
  error?: string
}

export interface ParserResult {
  success: boolean
  processGraph?: any
  validation?: any
  error?: string
  repairAttempts?: number
  warnings?: string[]
  metadata?: any
}

export interface ElectronAPI {
  openFileDialog: () => Promise<FileDialogResult>
  openDocumentDialog: () => Promise<FileDialogResult>
  readFile: (filePath: string) => Promise<FileReadResult>
  analyzeFactoryData: (csvContent: string) => Promise<AnalysisResult>
  getCachedAnalysis: (csvContent: string) => Promise<AnalysisResult>
  clearCache: () => Promise<{ success: boolean; error?: string }>
  runSimulation: (analysis: any, numReplications?: number) => Promise<SimulationResult>
  onSimulationProgress: (callback: (progress: number) => void) => void

  // Document extraction APIs
  parseDocument: (filePath: string) => Promise<DocumentParseResult & { success: boolean }>
  extractSystem: (documentContent: string, documentType: 'pdf' | 'word' | 'text') => Promise<SystemExtractionResult>
  getDocumentInfo: (filePath: string) => Promise<DocumentInfo>

  // DES Parser APIs (new)
  parseText: (text: string) => Promise<ParserResult>
  parseDocumentToDES: (filePath: string) => Promise<ParserResult>

  // Comprehensive simulation with advanced analysis
  runComprehensiveSimulation: (extractedSystemOrAnalysis: any, numReplications?: number) => Promise<ComprehensiveSimulationResult>

  // Chatbot API
  chatbot: {
    sendMessage: (request: any) => Promise<any>
  }
}

// Create the API object
const electronAPI = {
  openFileDialog: (): Promise<FileDialogResult> => {
    return ipcRenderer.invoke('dialog:openFile')
  },
  openDocumentDialog: (): Promise<FileDialogResult> => {
    return ipcRenderer.invoke('dialog:openDocument')
  },
  readFile: (filePath: string): Promise<FileReadResult> => {
    return ipcRenderer.invoke('file:read', filePath)
  },
  analyzeFactoryData: (csvContent: string): Promise<AnalysisResult> => {
    return ipcRenderer.invoke('analyze-factory-data', csvContent)
  },
  getCachedAnalysis: (csvContent: string): Promise<AnalysisResult> => {
    return ipcRenderer.invoke('get-cached-analysis', csvContent)
  },
  clearCache: (): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('clear-cache')
  },
  runSimulation: (analysis: any, numReplications: number = 1000): Promise<SimulationResult> => {
    return ipcRenderer.invoke('run-simulation', analysis, numReplications)
  },
  onSimulationProgress: (callback: (progress: number) => void): void => {
    ipcRenderer.on('simulation-progress', (_event, progress) => callback(progress))
  },

  // Document extraction APIs
  parseDocument: (filePath: string): Promise<DocumentParseResult & { success: boolean }> => {
    return ipcRenderer.invoke('document:parse', filePath)
  },
  extractSystem: (documentContent: string, documentType: 'pdf' | 'word' | 'text'): Promise<SystemExtractionResult> => {
    return ipcRenderer.invoke('extract-system', documentContent, documentType)
  },
  getDocumentInfo: (filePath: string): Promise<DocumentInfo> => {
    return ipcRenderer.invoke('document:info', filePath)
  },

  // DES Parser APIs
  parseText: (text: string): Promise<ParserResult> => {
    return ipcRenderer.invoke('des-parser:parse-text', text)
  },
  parseDocumentToDES: (filePath: string): Promise<ParserResult> => {
    return ipcRenderer.invoke('des-parser:parse-document', filePath)
  },

  // Comprehensive simulation with advanced analysis
  runComprehensiveSimulation: (extractedSystemOrAnalysis: any, numReplications: number = 100): Promise<ComprehensiveSimulationResult> => {
    return ipcRenderer.invoke('run-comprehensive-simulation', extractedSystemOrAnalysis, numReplications)
  },

  // Chatbot API
  chatbot: {
    sendMessage: (request: any): Promise<any> => {
      return ipcRenderer.invoke('chatbot:sendMessage', request)
    }
  }
} as ElectronAPI

// Expose to main world
contextBridge.exposeInMainWorld('electron', electronAPI)

// Log that exposure is complete
console.log('[Preload] window.electron API exposed:', electronAPI)
