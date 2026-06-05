/**
 * Structured logging utility with request correlation and sanitization.
 * 
 * Provides JSON-formatted logging with:
 * - Request ID correlation for tracing
 * - Multiple log levels (debug, info, warn, error)
 * - API key sanitization for security
 * - Error message sanitization
 */

/**
 * Log entry structure output to console
 */
interface LogEntry {
  timestamp: string;
  requestId: string;
  component: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  event: string;
  data?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
    [key: string]: unknown;
  };
}

/**
 * Logger interface for structured logging
 */
export interface Logger {
  debug(component: string, event: string, data?: Record<string, unknown>): void;
  info(component: string, event: string, data?: Record<string, unknown>): void;
  warn(component: string, event: string, data?: Record<string, unknown>): void;
  error(component: string, event: string, error: unknown, data?: Record<string, unknown>): void;
}

/**
 * Generate a unique request ID (UUID v4 format)
 */
export function generateRequestId(): string {
  // Simple UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Sanitize API keys to show only first 4 and last 4 characters
 */
function sanitizeApiKey(key: string): string {
  if (!key || key.length < 12) {
    return '[REDACTED]';
  }
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

/**
 * Sanitize error messages by replacing potential API keys with [REDACTED]
 */
function sanitizeErrorMessage(message: string): string {
  // Replace patterns that look like API keys (32+ alphanumeric/underscore/dash characters)
  return message.replace(/[a-zA-Z0-9_-]{32,}/g, '[REDACTED]');
}

/**
 * Recursively sanitize data object to protect API keys
 */
function sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Check if key name suggests it contains an API key
    const keyLower = key.toLowerCase();
    if (keyLower.includes('key') || keyLower.includes('token') || keyLower.includes('secret')) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeApiKey(value);
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else if (typeof value === 'string' && value.length > 32) {
      // Sanitize long strings that might contain API keys
      sanitized[key] = sanitizeErrorMessage(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Serialize error object for logging
 */
function serializeError(error: unknown): LogEntry['error'] {
  if (error instanceof Error) {
    return {
      message: sanitizeErrorMessage(error.message),
      stack: error.stack,
      name: error.name,
      // Include any additional properties on the error object
      ...Object.getOwnPropertyNames(error).reduce((acc, key) => {
        if (key !== 'message' && key !== 'stack' && key !== 'name') {
          acc[key] = (error as any)[key];
        }
        return acc;
      }, {} as Record<string, unknown>),
    };
  }
  
  // Handle non-Error objects
  return {
    message: sanitizeErrorMessage(String(error)),
  };
}

/**
 * Create a logger instance bound to a specific request ID
 */
export function createLogger(requestId: string): Logger {
  /**
   * Internal method to output log entry
   */
  function log(
    level: LogEntry['level'],
    component: string,
    event: string,
    data?: Record<string, unknown>,
    error?: unknown
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      requestId,
      component,
      level,
      event,
    };

    // Add sanitized data if provided
    if (data) {
      entry.data = sanitizeData(data);
    }

    // Add serialized error if provided
    if (error !== undefined) {
      entry.error = serializeError(error);
    }

    // Output as JSON to console
    console.log(JSON.stringify(entry));
  }

  return {
    debug(component: string, event: string, data?: Record<string, unknown>): void {
      log('debug', component, event, data);
    },

    info(component: string, event: string, data?: Record<string, unknown>): void {
      log('info', component, event, data);
    },

    warn(component: string, event: string, data?: Record<string, unknown>): void {
      log('warn', component, event, data);
    },

    error(component: string, event: string, error: unknown, data?: Record<string, unknown>): void {
      log('error', component, event, data, error);
    },
  };
}
