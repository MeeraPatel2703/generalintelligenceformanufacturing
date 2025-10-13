/**
 * DEBUG LOGGING SYSTEM
 *
 * Centralized logging with levels and toggles for demo troubleshooting
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export class DebugLogger {
  private static instance: DebugLogger;
  private level: LogLevel = LogLevel.INFO;
  private enabledModules: Set<string> = new Set(['*']); // '*' means all modules
  private logBuffer: Array<{ timestamp: number; level: LogLevel; module: string; message: string; data?: any }> = [];
  private maxBufferSize: number = 1000;

  private constructor() {
    // Singleton
  }

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  /**
   * Set global log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Enable specific modules
   * Example: enableModules(['kernel', 'adapter', 'arrivals'])
   */
  enableModules(modules: string[]): void {
    this.enabledModules.clear();
    modules.forEach(m => this.enabledModules.add(m.toLowerCase()));
  }

  /**
   * Enable all modules
   */
  enableAll(): void {
    this.enabledModules.clear();
    this.enabledModules.add('*');
  }

  /**
   * Check if module should log
   */
  private shouldLog(module: string, level: LogLevel): boolean {
    if (level > this.level) return false;
    if (this.enabledModules.has('*')) return true;
    return this.enabledModules.has(module.toLowerCase());
  }

  /**
   * Add log entry to buffer
   */
  private addToBuffer(level: LogLevel, module: string, message: string, data?: any): void {
    this.logBuffer.push({
      timestamp: Date.now(),
      level,
      module,
      message,
      data
    });

    // Trim buffer if too large
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }
  }

  /**
   * Format log message
   */
  private format(level: LogLevel, module: string, message: string): string {
    const levelStr = LogLevel[level];
    const timestamp = new Date().toISOString().substr(11, 12);
    return `[${timestamp}] [${levelStr}] [${module}] ${message}`;
  }

  /**
   * Error logging (always shown)
   */
  error(module: string, message: string, data?: any): void {
    if (!this.shouldLog(module, LogLevel.ERROR)) return;

    const formatted = this.format(LogLevel.ERROR, module, message);
    console.error(formatted, data || '');
    this.addToBuffer(LogLevel.ERROR, module, message, data);
  }

  /**
   * Warning logging
   */
  warn(module: string, message: string, data?: any): void {
    if (!this.shouldLog(module, LogLevel.WARN)) return;

    const formatted = this.format(LogLevel.WARN, module, message);
    console.warn(formatted, data || '');
    this.addToBuffer(LogLevel.WARN, module, message, data);
  }

  /**
   * Info logging (default level)
   */
  info(module: string, message: string, data?: any): void {
    if (!this.shouldLog(module, LogLevel.INFO)) return;

    const formatted = this.format(LogLevel.INFO, module, message);
    console.log(formatted, data || '');
    this.addToBuffer(LogLevel.INFO, module, message, data);
  }

  /**
   * Debug logging
   */
  debug(module: string, message: string, data?: any): void {
    if (!this.shouldLog(module, LogLevel.DEBUG)) return;

    const formatted = this.format(LogLevel.DEBUG, module, message);
    console.log(formatted, data || '');
    this.addToBuffer(LogLevel.DEBUG, module, message, data);
  }

  /**
   * Trace logging (most verbose)
   */
  trace(module: string, message: string, data?: any): void {
    if (!this.shouldLog(module, LogLevel.TRACE)) return;

    const formatted = this.format(LogLevel.TRACE, module, message);
    console.log(formatted, data || '');
    this.addToBuffer(LogLevel.TRACE, module, message, data);
  }

  /**
   * Get buffered logs
   */
  getBuffer(): typeof this.logBuffer {
    return [...this.logBuffer];
  }

  /**
   * Clear buffer
   */
  clearBuffer(): void {
    this.logBuffer = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }

  /**
   * Get logs filtered by module
   */
  getLogsByModule(module: string): typeof this.logBuffer {
    return this.logBuffer.filter(log => log.module === module);
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): typeof this.logBuffer {
    return this.logBuffer.filter(log => log.level === level);
  }
}

/**
 * Convenience function to get logger instance
 */
export function getLogger(): DebugLogger {
  return DebugLogger.getInstance();
}

/**
 * Demo-specific logging presets
 */
export const DemoLogPresets = {
  /**
   * Minimal logging for clean demo
   */
  DEMO_CLEAN: () => {
    const logger = getLogger();
    logger.setLevel(LogLevel.WARN);
    logger.enableModules(['adapter', 'kernel']);
  },

  /**
   * Full debug logging for troubleshooting
   */
  DEMO_DEBUG: () => {
    const logger = getLogger();
    logger.setLevel(LogLevel.DEBUG);
    logger.enableAll();
  },

  /**
   * Only arrival debugging
   */
  DEBUG_ARRIVALS: () => {
    const logger = getLogger();
    logger.setLevel(LogLevel.DEBUG);
    logger.enableModules(['arrivals', 'adapter']);
  },

  /**
   * Only statistics debugging
   */
  DEBUG_STATS: () => {
    const logger = getLogger();
    logger.setLevel(LogLevel.DEBUG);
    logger.enableModules(['stats', 'kernel']);
  },

  /**
   * Silence all logs
   */
  SILENT: () => {
    const logger = getLogger();
    logger.setLevel(LogLevel.ERROR);
    logger.enableModules([]);
  }
};

/**
 * Example usage:
 *
 * import { getLogger, LogLevel, DemoLogPresets } from './utils/DebugLogger';
 *
 * // Set preset for demo
 * DemoLogPresets.DEMO_CLEAN();
 *
 * // Or customize
 * const logger = getLogger();
 * logger.setLevel(LogLevel.DEBUG);
 * logger.enableModules(['kernel', 'arrivals']);
 *
 * // Use in code
 * logger.info('MyModule', 'Entity created', { id: 'entity_0' });
 * logger.debug('MyModule', 'Processing step', { step: 'seize' });
 * logger.error('MyModule', 'Failed to process', { error });
 */
