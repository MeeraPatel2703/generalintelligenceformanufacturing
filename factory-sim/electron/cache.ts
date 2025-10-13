import * as path from 'path';
import * as crypto from 'crypto';
import { app } from 'electron';

// Use require for better-sqlite3 to avoid ESM/CommonJS issues
const Database = require('better-sqlite3');

type DatabaseInstance = any;

export interface CacheEntry {
  csv_hash: string;
  analysis: string;
  timestamp: number;
}

class CacheService {
  private db: DatabaseInstance | null = null;
  private dbPath: string | null = null;
  private initialized: boolean = false;

  constructor() {
    // Don't initialize immediately - wait for ensureInitialized()
  }

  /**
   * Lazy initialization - only initialize when app is ready
   */
  private ensureInitialized(): void {
    if (this.initialized) return;

    try {
      // Store database in user data directory
      const userDataPath = app.getPath('userData');
      this.dbPath = path.join(userDataPath, 'factory_cache.db');
      this.initDatabase();
      this.initialized = true;
    } catch (error) {
      console.error('[Cache] Failed to initialize (app may not be ready):', error);
      // Don't throw - just log and continue without cache
    }
  }

  private initDatabase(): void {
    if (!this.dbPath) return;

    try {
      this.db = new Database(this.dbPath);

      // Create cache table if it doesn't exist
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS cache (
          csv_hash TEXT PRIMARY KEY,
          analysis TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_timestamp ON cache(timestamp);
      `);

      console.log('[Cache] Database initialized at:', this.dbPath);
    } catch (error) {
      console.error('[Cache] Failed to initialize database:', error);
      // Don't throw - just continue without cache
    }
  }

  /**
   * Generate SHA256 hash of CSV content
   */
  public hashCSV(csvContent: string): string {
    return crypto.createHash('sha256').update(csvContent).digest('hex');
  }

  /**
   * Get cached analysis by CSV hash
   */
  public get(csvHash: string): CacheEntry | null {
    this.ensureInitialized();
    
    if (!this.db) {
      console.error('[Cache] Database not initialized');
      return null;
    }

    try {
      const stmt = this.db.prepare('SELECT * FROM cache WHERE csv_hash = ?');
      const result = stmt.get(csvHash) as CacheEntry | undefined;

      if (result) {
        console.log('[Cache] Cache hit for hash:', csvHash.substring(0, 8));
        return result;
      }

      console.log('[Cache] Cache miss for hash:', csvHash.substring(0, 8));
      return null;
    } catch (error) {
      console.error('[Cache] Error retrieving cache:', error);
      return null;
    }
  }

  /**
   * Store analysis in cache
   */
  public set(csvHash: string, analysis: string): boolean {
    this.ensureInitialized();
    
    if (!this.db) {
      console.error('[Cache] Database not initialized');
      return false;
    }

    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO cache (csv_hash, analysis, timestamp)
        VALUES (?, ?, ?)
      `);

      const timestamp = Date.now();
      stmt.run(csvHash, analysis, timestamp);

      console.log('[Cache] Cached analysis for hash:', csvHash.substring(0, 8));
      return true;
    } catch (error) {
      console.error('[Cache] Error storing cache:', error);
      return false;
    }
  }

  /**
   * Clear all cached entries
   */
  public clear(): boolean {
    this.ensureInitialized();
    
    if (!this.db) {
      console.error('[Cache] Database not initialized');
      return false;
    }

    try {
      this.db.exec('DELETE FROM cache');
      console.log('[Cache] All cache entries cleared');
      return true;
    } catch (error) {
      console.error('[Cache] Error clearing cache:', error);
      return false;
    }
  }

  /**
   * Clear old cache entries (older than specified days)
   */
  public clearOld(daysOld: number = 7): boolean {
    this.ensureInitialized();
    
    if (!this.db) {
      console.error('[Cache] Database not initialized');
      return false;
    }

    try {
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      const stmt = this.db.prepare('DELETE FROM cache WHERE timestamp < ?');
      const result = stmt.run(cutoffTime);

      console.log(`[Cache] Cleared ${result.changes} old entries (>${daysOld} days)`);
      return true;
    } catch (error) {
      console.error('[Cache] Error clearing old cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): { total: number; oldest?: number; newest?: number } {
    this.ensureInitialized();
    
    if (!this.db) {
      return { total: 0 };
    }

    try {
      const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM cache');
      const countResult = countStmt.get() as { count: number };

      const timeStmt = this.db.prepare('SELECT MIN(timestamp) as oldest, MAX(timestamp) as newest FROM cache');
      const timeResult = timeStmt.get() as { oldest?: number; newest?: number };

      return {
        total: countResult.count,
        oldest: timeResult.oldest,
        newest: timeResult.newest
      };
    } catch (error) {
      console.error('[Cache] Error getting stats:', error);
      return { total: 0 };
    }
  }

  /**
   * Close database connection
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      console.log('[Cache] Database closed');
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
