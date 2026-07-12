import * as crypto from 'crypto';

export class CommonUtils {
  /**
   * Generates a unique tracing ID for request lifecycle identification.
   */
  static generateTraceId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Safe JSON parse to prevent throwing.
   */
  static safeJsonParse<T = any>(str: string, fallback: T): T {
    try {
      return JSON.parse(str) as T;
    } catch {
      return fallback;
    }
  }

  /**
   * Measures performance of a synchronous or asynchronous execution.
   */
  static async measurePerformance<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
    const start = process.hrtime();
    const result = await fn();
    const diff = process.hrtime(start);
    const durationMs = (diff[0] * 1e9 + diff[1]) / 1e6;
    return { result, durationMs };
  }
}
