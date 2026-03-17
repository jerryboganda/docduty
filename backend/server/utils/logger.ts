/**
 * Simple structured logger for DocDuty backend.
 * Wraps console methods with consistent formatting.
 * In production, this can be replaced with a proper logging library (winston, pino, etc.)
 */

export const logger = {
  info(message: string, meta?: Record<string, unknown>): void {
    console.info(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date().toISOString() }));
  },
  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(JSON.stringify({ level: 'warn', message, ...meta, timestamp: new Date().toISOString() }));
  },
  error(message: string, meta?: Record<string, unknown>): void {
    console.error(JSON.stringify({ level: 'error', message, ...meta, timestamp: new Date().toISOString() }));
  },
  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(JSON.stringify({ level: 'debug', message, ...meta, timestamp: new Date().toISOString() }));
    }
  }
};
