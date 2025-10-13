/**
 * PROFESSIONAL LOGGING SYSTEM
 * 
 * Simio-quality structured logging with levels, filtering, and component tagging.
 * Enables efficient debugging and production monitoring.
 * 
 * Usage:
 *   const logger = new Logger('ADAPTER');
 *   logger.info('Initialized', { resources: 5 });
 *   logger.debug('Entity routed', { entityId, resourceId });
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export class Logger {
  private static globalLevel: LogLevel = LogLevel.INFO;
  private static enabledComponents: Set<string> = new Set();
  private static timestampsEnabled: boolean = true;
  
  private component: string;
  private enabled: boolean = true;

  constructor(component: string) {
    this.component = component;
  }

  /**
   * Log error message (always shown unless completely disabled)
   */
  error(message: string, data?: any): void {
    if (Logger.globalLevel >= LogLevel.ERROR && this.shouldLog()) {
      this.log('ERROR', message, data, console.error);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    if (Logger.globalLevel >= LogLevel.WARN && this.shouldLog()) {
      this.log('WARN', message, data, console.warn);
    }
  }

  /**
   * Log info message (default level)
   */
  info(message: string, data?: any): void {
    if (Logger.globalLevel >= LogLevel.INFO && this.shouldLog()) {
      this.log('INFO', message, data, console.log);
    }
  }

  /**
   * Log debug message (detailed tracing)
   */
  debug(message: string, data?: any): void {
    if (Logger.globalLevel >= LogLevel.DEBUG && this.shouldLog()) {
      this.log('DEBUG', message, data, console.log);
    }
  }

  /**
   * Log trace message (very detailed, performance-impacting)
   */
  trace(message: string, data?: any): void {
    if (Logger.globalLevel >= LogLevel.TRACE && this.shouldLog()) {
      this.log('TRACE', message, data, console.log);
    }
  }

  /**
   * Internal logging function
   */
  private log(level: string, message: string, data: any, logFn: typeof console.log): void {
    const timestamp = Logger.timestampsEnabled ? `[${this.getTimestamp()}] ` : '';
    const prefix = `${timestamp}[${this.component}:${level}]`;
    
    if (data !== undefined) {
      logFn(prefix, message, data);
    } else {
      logFn(prefix, message);
    }
  }

  /**
   * Get formatted timestamp
   */
  private getTimestamp(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ms = now.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
  }

  /**
   * Check if this logger should output
   */
  private shouldLog(): boolean {
    if (!this.enabled) return false;
    if (Logger.enabledComponents.size === 0) return true;
    return Logger.enabledComponents.has(this.component);
  }

  /**
   * Set global log level
   */
  static setLevel(level: LogLevel): void {
    Logger.globalLevel = level;
  }

  /**
   * Get current log level
   */
  static getLevel(): LogLevel {
    return Logger.globalLevel;
  }

  /**
   * Enable only specific components (empty = enable all)
   */
  static setEnabledComponents(...components: string[]): void {
    Logger.enabledComponents.clear();
    components.forEach(c => Logger.enabledComponents.add(c));
  }

  /**
   * Enable/disable timestamps
   */
  static setTimestampsEnabled(enabled: boolean): void {
    Logger.timestampsEnabled = enabled;
  }

  /**
   * Enable/disable this logger instance
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Quick setup for development
   */
  static devMode(): void {
    Logger.setLevel(LogLevel.DEBUG);
    Logger.setTimestampsEnabled(true);
  }

  /**
   * Quick setup for production
   */
  static prodMode(): void {
    Logger.setLevel(LogLevel.INFO);
    Logger.setTimestampsEnabled(false);
  }
}
