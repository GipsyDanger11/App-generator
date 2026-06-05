/**
 * Unit tests for the structured logger utility
 */

import { createLogger, generateRequestId, Logger } from './logger';

// Mock console.log to capture output
let consoleOutput: string[] = [];
const originalConsoleLog = console.log;

beforeEach(() => {
  consoleOutput = [];
  console.log = jest.fn((message: string) => {
    consoleOutput.push(message);
  });
});

afterEach(() => {
  console.log = originalConsoleLog;
});

describe('generateRequestId', () => {
  it('should generate a UUID v4 format string', () => {
    const requestId = generateRequestId();
    
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    expect(requestId).toMatch(uuidV4Regex);
  });

  it('should generate unique request IDs', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();
    const id3 = generateRequestId();
    
    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });
});

describe('createLogger', () => {
  let logger: Logger;
  const requestId = 'test-request-123';

  beforeEach(() => {
    logger = createLogger(requestId);
  });

  describe('log entry structure', () => {
    it('should include all required fields in log entry', () => {
      logger.info('test-component', 'test-event');
      
      expect(consoleOutput).toHaveLength(1);
      const logEntry = JSON.parse(consoleOutput[0]);
      
      expect(logEntry).toHaveProperty('timestamp');
      expect(logEntry).toHaveProperty('requestId');
      expect(logEntry).toHaveProperty('component');
      expect(logEntry).toHaveProperty('level');
      expect(logEntry).toHaveProperty('event');
      
      expect(logEntry.requestId).toBe(requestId);
      expect(logEntry.component).toBe('test-component');
      expect(logEntry.event).toBe('test-event');
    });

    it('should use ISO 8601 timestamp format', () => {
      logger.info('test', 'event');
      
      const logEntry = JSON.parse(consoleOutput[0]);
      const timestamp = logEntry.timestamp;
      
      // Verify ISO 8601 format
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });

  describe('log levels', () => {
    it('should log debug level correctly', () => {
      logger.debug('component', 'debug-event', { detail: 'test' });
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.level).toBe('debug');
      expect(logEntry.event).toBe('debug-event');
    });

    it('should log info level correctly', () => {
      logger.info('component', 'info-event', { status: 'success' });
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.level).toBe('info');
      expect(logEntry.event).toBe('info-event');
    });

    it('should log warn level correctly', () => {
      logger.warn('component', 'warn-event', { warning: 'fallback used' });
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.level).toBe('warn');
      expect(logEntry.event).toBe('warn-event');
    });

    it('should log error level correctly', () => {
      const error = new Error('Test error');
      logger.error('component', 'error-event', error, { context: 'test' });
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.level).toBe('error');
      expect(logEntry.event).toBe('error-event');
    });
  });

  describe('data handling', () => {
    it('should include data object when provided', () => {
      const data = { userId: '123', action: 'create' };
      logger.info('component', 'event', data);
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.data).toEqual(data);
    });

    it('should handle missing data parameter', () => {
      logger.info('component', 'event');
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.data).toBeUndefined();
    });
  });

  describe('error serialization', () => {
    it('should serialize Error objects with message and stack', () => {
      const error = new Error('Test error message');
      logger.error('component', 'error-event', error);
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.error).toBeDefined();
      expect(logEntry.error.message).toBe('Test error message');
      expect(logEntry.error.stack).toBeDefined();
      expect(logEntry.error.name).toBe('Error');
    });

    it('should handle non-Error objects', () => {
      logger.error('component', 'error-event', 'String error');
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.error).toBeDefined();
      expect(logEntry.error.message).toBe('String error');
    });

    it('should handle Error objects with custom properties', () => {
      const error = new Error('Custom error') as any;
      error.statusCode = 500;
      error.details = { field: 'username' };
      
      logger.error('component', 'error-event', error);
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.error.message).toBe('Custom error');
      expect(logEntry.error.statusCode).toBe(500);
      expect(logEntry.error.details).toEqual({ field: 'username' });
    });
  });

  describe('API key sanitization', () => {
    it('should sanitize API keys in data fields with "key" in name', () => {
      const data = {
        apiKey: 'sk-1234567890abcdef1234567890abcdef',
        userName: 'testuser',
      };
      
      logger.info('component', 'event', data);
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.data.apiKey).toBe('sk-1...cdef');
      expect(logEntry.data.userName).toBe('testuser');
    });

    it('should sanitize fields with "token" in name', () => {
      const data = {
        accessToken: 'token_1234567890abcdef1234567890abcdef',
        userId: '123',
      };
      
      logger.info('component', 'event', data);
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.data.accessToken).toBe('toke...cdef');
      expect(logEntry.data.userId).toBe('123');
    });

    it('should sanitize fields with "secret" in name', () => {
      const data = {
        clientSecret: 'secret_1234567890abcdef1234567890abcdef',
      };
      
      logger.info('component', 'event', data);
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.data.clientSecret).toBe('secr...cdef');
    });

    it('should handle short API keys by fully redacting them', () => {
      const data = {
        apiKey: 'short',
      };
      
      logger.info('component', 'event', data);
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.data.apiKey).toBe('[REDACTED]');
    });

    it('should sanitize nested object fields', () => {
      const data = {
        config: {
          apiKey: 'sk-1234567890abcdef1234567890abcdef',
          endpoint: 'https://api.example.com',
        },
      };
      
      logger.info('component', 'event', data);
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.data.config.apiKey).toBe('sk-1...cdef');
      expect(logEntry.data.config.endpoint).toBe('https://api.example.com');
    });
  });

  describe('error message sanitization', () => {
    it('should sanitize API key patterns in error messages', () => {
      const error = new Error('API call failed with key sk-1234567890abcdef1234567890abcdef');
      logger.error('component', 'error-event', error);
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.error.message).toBe('API call failed with key [REDACTED]');
    });

    it('should sanitize multiple API key patterns in error messages', () => {
      const error = new Error('Keys: sk-abcdef1234567890abcdef1234567890 and token_xyz9876543210xyz9876543210xyz98765');
      logger.error('component', 'error-event', error);
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.error.message).toBe('Keys: [REDACTED] and [REDACTED]');
    });

    it('should sanitize long strings in data that might contain API keys', () => {
      const data = {
        message: 'Error with token: sk-1234567890abcdef1234567890abcdef and other info',
      };
      
      logger.info('component', 'event', data);
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.data.message).toContain('[REDACTED]');
    });

    it('should not sanitize short strings or normal text', () => {
      const data = {
        message: 'This is a normal log message',
        count: 42,
      };
      
      logger.info('component', 'event', data);
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.data.message).toBe('This is a normal log message');
      expect(logEntry.data.count).toBe(42);
    });
  });

  describe('multiple log entries', () => {
    it('should maintain separate request IDs for different loggers', () => {
      const logger1 = createLogger('request-1');
      const logger2 = createLogger('request-2');
      
      logger1.info('component', 'event-1');
      logger2.info('component', 'event-2');
      
      expect(consoleOutput).toHaveLength(2);
      
      const entry1 = JSON.parse(consoleOutput[0]);
      const entry2 = JSON.parse(consoleOutput[1]);
      
      expect(entry1.requestId).toBe('request-1');
      expect(entry2.requestId).toBe('request-2');
    });

    it('should correlate multiple log entries with same request ID', () => {
      logger.info('api', 'request-start');
      logger.debug('provider', 'provider-attempt');
      logger.info('api', 'request-complete');
      
      expect(consoleOutput).toHaveLength(3);
      
      const entries = consoleOutput.map(output => JSON.parse(output));
      
      entries.forEach(entry => {
        expect(entry.requestId).toBe(requestId);
      });
    });
  });

  describe('JSON output format', () => {
    it('should output valid JSON', () => {
      logger.info('component', 'event', { test: 'data' });
      
      expect(() => JSON.parse(consoleOutput[0])).not.toThrow();
    });

    it('should handle special characters in data', () => {
      const data = {
        message: 'Test with "quotes" and \'apostrophes\' and \n newlines',
        path: 'C:\\Users\\test\\file.txt',
      };
      
      logger.info('component', 'event', data);
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.data.message).toBe(data.message);
      expect(logEntry.data.path).toBe(data.path);
    });
  });
});
