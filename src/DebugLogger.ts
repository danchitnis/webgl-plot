/**
 * Debug logging utility for webgl-plot
 * Provides centralized debug logging with [webglplot] prefix
 */

export class DebugLogger {
  private static debugEnabled = false;

  /**
   * Set debug mode globally
   */
  public static setDebugMode(enabled: boolean): void {
    DebugLogger.debugEnabled = enabled;
  }

  /**
   * Get current debug mode status
   */
  public static isDebugEnabled(): boolean {
    return DebugLogger.debugEnabled;
  }

  /**
   * Debug log - only shows when debug mode is enabled
   */
  public static log(message: string): void {
    if (DebugLogger.debugEnabled) {
      console.log(`[webglplot] ${message}`);
    }
  }

  /**
   * Debug warn - only shows when debug mode is enabled
   */
  public static warn(message: string): void {
    if (DebugLogger.debugEnabled) {
      console.warn(`[webglplot] ${message}`);
    }
  }

  /**
   * Error logging - always shows (not affected by debug flag)
   */
  public static error(message: string): void {
    console.error(`[webglplot] ${message}`);
  }
}