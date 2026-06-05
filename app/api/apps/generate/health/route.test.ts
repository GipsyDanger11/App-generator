/**
 * Unit tests for health check API endpoint
 * 
 * Tests the GET /api/apps/generate/health endpoint including:
 * - Response structure
 * - Version identification
 * - Provider detection
 * - Cache information
 */

import { GET } from './route';
import { getVersion } from '@/lib/version';

// Mock the version module
jest.mock('@/lib/version');

const mockedGetVersion = getVersion as jest.MockedFunction<typeof getVersion>;

describe('GET /api/apps/generate/health', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment and mocks before each test
    jest.resetAllMocks();
    process.env = { ...originalEnv };
    
    // Clear provider env vars
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.MISTRAL_API_KEY;
    delete process.env.AI_PROVIDER;
    
    // Mock getVersion to return a test value
    mockedGetVersion.mockReturnValue('test-version-123');
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Response structure', () => {
    it('should return 200 status with ok status field', async () => {
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.status).toBe('ok');
    });

    it('should include version field from getVersion()', async () => {
      mockedGetVersion.mockReturnValue('abc1234');

      const response = await GET();
      const json = await response.json();

      expect(json.version).toBe('abc1234');
      expect(mockedGetVersion).toHaveBeenCalled();
    });

    it('should include ISO 8601 timestamp', async () => {
      const response = await GET();
      const json = await response.json();

      expect(json.timestamp).toBeDefined();
      expect(typeof json.timestamp).toBe('string');
      
      // Verify it's a valid ISO 8601 date
      const date = new Date(json.timestamp);
      expect(date.toISOString()).toBe(json.timestamp);
      
      // Verify it's recent (within last second)
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      expect(diff).toBeGreaterThanOrEqual(0);
      expect(diff).toBeLessThan(1000);
    });

    it('should include providers object with primary and configured fields', async () => {
      const response = await GET();
      const json = await response.json();

      expect(json.providers).toBeDefined();
      expect(json.providers.primary).toBeDefined();
      expect(json.providers.configured).toBeDefined();
      expect(Array.isArray(json.providers.configured)).toBe(true);
    });

    it('should include cache object with nodeVersion and processUptime', async () => {
      const response = await GET();
      const json = await response.json();

      expect(json.cache).toBeDefined();
      expect(json.cache.nodeVersion).toBe(process.version);
      expect(typeof json.cache.processUptime).toBe('number');
      expect(json.cache.processUptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Provider detection', () => {
    it('should detect GROQ when API key is set', async () => {
      process.env.GROQ_API_KEY = 'gsk_test_key_12345';

      const response = await GET();
      const json = await response.json();

      expect(json.providers.configured).toContain('groq');
    });

    it('should detect OpenAI when API key is set', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-key-12345';

      const response = await GET();
      const json = await response.json();

      expect(json.providers.configured).toContain('openai');
    });

    it('should detect Anthropic when API key is set', async () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-12345';

      const response = await GET();
      const json = await response.json();

      expect(json.providers.configured).toContain('anthropic');
    });

    it('should detect Mistral when API key is set', async () => {
      process.env.MISTRAL_API_KEY = 'test-mistral-key-12345';

      const response = await GET();
      const json = await response.json();

      expect(json.providers.configured).toContain('mistral');
    });

    it('should detect multiple configured providers', async () => {
      process.env.GROQ_API_KEY = 'gsk_test_key_1';
      process.env.OPENAI_API_KEY = 'sk-test-key-2';
      process.env.MISTRAL_API_KEY = 'mistral-key-3';

      const response = await GET();
      const json = await response.json();

      expect(json.providers.configured).toContain('groq');
      expect(json.providers.configured).toContain('openai');
      expect(json.providers.configured).toContain('mistral');
      expect(json.providers.configured.length).toBe(3);
    });

    it('should return empty array when no providers configured', async () => {
      const response = await GET();
      const json = await response.json();

      expect(json.providers.configured).toEqual([]);
    });
  });

  describe('Primary provider detection', () => {
    it('should default to groq when AI_PROVIDER not set', async () => {
      const response = await GET();
      const json = await response.json();

      expect(json.providers.primary).toBe('groq');
    });

    it('should use AI_PROVIDER environment variable when set', async () => {
      process.env.AI_PROVIDER = 'openai';

      const response = await GET();
      const json = await response.json();

      expect(json.providers.primary).toBe('openai');
    });

    it('should handle AI_PROVIDER in uppercase', async () => {
      process.env.AI_PROVIDER = 'ANTHROPIC';

      const response = await GET();
      const json = await response.json();

      expect(json.providers.primary).toBe('anthropic');
    });

    it('should handle AI_PROVIDER in mixed case', async () => {
      process.env.AI_PROVIDER = 'MiStRaL';

      const response = await GET();
      const json = await response.json();

      expect(json.providers.primary).toBe('mistral');
    });
  });

  describe('Cache information', () => {
    it('should return current Node.js version', async () => {
      const response = await GET();
      const json = await response.json();

      expect(json.cache.nodeVersion).toBe(process.version);
      expect(json.cache.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);
    });

    it('should return positive process uptime', async () => {
      const response = await GET();
      const json = await response.json();

      expect(json.cache.processUptime).toBeGreaterThan(0);
      expect(typeof json.cache.processUptime).toBe('number');
    });

    it('should show increasing uptime on subsequent calls', async () => {
      const response1 = await GET();
      const json1 = await response1.json();
      const uptime1 = json1.cache.processUptime;

      // Wait a short time
      await new Promise(resolve => setTimeout(resolve, 100));

      const response2 = await GET();
      const json2 = await response2.json();
      const uptime2 = json2.cache.processUptime;

      expect(uptime2).toBeGreaterThanOrEqual(uptime1);
    });
  });

  describe('Error handling', () => {
    it('should return 500 status when getVersion throws error', async () => {
      mockedGetVersion.mockImplementation(() => {
        throw new Error('Version detection failed');
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.status).toBe('error');
      expect(json.version).toBe('unknown');
      expect(json.error).toBe('Version detection failed');
    });

    it('should include timestamp even when error occurs', async () => {
      mockedGetVersion.mockImplementation(() => {
        throw new Error('Test error');
      });

      const response = await GET();
      const json = await response.json();

      expect(json.timestamp).toBeDefined();
      const date = new Date(json.timestamp);
      expect(date.toISOString()).toBe(json.timestamp);
    });

    it('should handle non-Error exceptions', async () => {
      mockedGetVersion.mockImplementation(() => {
        throw 'String error';
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.status).toBe('error');
      expect(json.error).toBe('String error');
    });
  });

  describe('Integration scenarios', () => {
    it('should return complete health check for production-like setup', async () => {
      process.env.GROQ_API_KEY = 'gsk_prod_key';
      process.env.OPENAI_API_KEY = 'sk_prod_key';
      process.env.AI_PROVIDER = 'groq';
      mockedGetVersion.mockReturnValue('abc1234');

      const response = await GET();
      const json = await response.json();

      expect(json).toEqual({
        status: 'ok',
        version: 'abc1234',
        timestamp: expect.any(String),
        providers: {
          primary: 'groq',
          configured: expect.arrayContaining(['groq', 'openai']),
        },
        cache: {
          nodeVersion: process.version,
          processUptime: expect.any(Number),
        },
      });
    });

    it('should work with minimal configuration (no providers)', async () => {
      mockedGetVersion.mockReturnValue('dev-version');

      const response = await GET();
      const json = await response.json();

      expect(json).toEqual({
        status: 'ok',
        version: 'dev-version',
        timestamp: expect.any(String),
        providers: {
          primary: 'groq',
          configured: [],
        },
        cache: {
          nodeVersion: process.version,
          processUptime: expect.any(Number),
        },
      });
    });
  });

  describe('Response format validation', () => {
    it('should match HealthResponse interface structure', async () => {
      const response = await GET();
      const json = await response.json();

      // Check all required fields are present
      expect(json).toHaveProperty('status');
      expect(json).toHaveProperty('version');
      expect(json).toHaveProperty('timestamp');
      expect(json).toHaveProperty('providers');
      expect(json.providers).toHaveProperty('primary');
      expect(json.providers).toHaveProperty('configured');
      expect(json).toHaveProperty('cache');
      expect(json.cache).toHaveProperty('nodeVersion');
      expect(json.cache).toHaveProperty('processUptime');

      // Check types
      expect(typeof json.status).toBe('string');
      expect(typeof json.version).toBe('string');
      expect(typeof json.timestamp).toBe('string');
      expect(typeof json.providers).toBe('object');
      expect(typeof json.providers.primary).toBe('string');
      expect(Array.isArray(json.providers.configured)).toBe(true);
      expect(typeof json.cache).toBe('object');
      expect(typeof json.cache.nodeVersion).toBe('string');
      expect(typeof json.cache.processUptime).toBe('number');
    });
  });
});
