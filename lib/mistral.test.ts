/**
 * Unit tests for AI generation with test mode support
 */

import { generateConfigFromPrompt } from './mistral';
import { createLogger } from './logger';
import type { AppConfig } from './config/types';

describe('generateConfigFromPrompt', () => {
  describe('Test Mode', () => {
    const originalEnv = process.env.AI_TEST_MODE;

    afterEach(() => {
      // Restore original environment
      if (originalEnv !== undefined) {
        process.env.AI_TEST_MODE = originalEnv;
      } else {
        delete process.env.AI_TEST_MODE;
      }
    });

    it('should skip external API calls when AI_TEST_MODE is true', async () => {
      process.env.AI_TEST_MODE = 'true';
      const logger = createLogger('test-req-001');
      const logSpy = jest.spyOn(console, 'log');

      const result = await generateConfigFromPrompt('Build a CRM app', logger);

      // Should return a valid config
      expect(result).toBeDefined();
      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.pages.length).toBeGreaterThan(0);

      // Should log test mode activation
      const logs = logSpy.mock.calls.map(call => JSON.parse(call[0] as string));
      const testModeLog = logs.find(log => log.event === 'test_mode_active');
      expect(testModeLog).toBeDefined();
      expect(testModeLog?.data.reason).toBe('AI_TEST_MODE environment variable is true');
      expect(testModeLog?.data.action).toBe('Skipping external API calls');

      // Should NOT log provider attempts
      const providerAttempts = logs.filter(log => log.event === 'provider_attempt');
      expect(providerAttempts.length).toBe(0);

      logSpy.mockRestore();
    });

    it('should log detailed config structure in test mode', async () => {
      process.env.AI_TEST_MODE = 'true';
      const logger = createLogger('test-req-002');
      const logSpy = jest.spyOn(console, 'log');

      await generateConfigFromPrompt('Build a task manager', logger);

      const logs = logSpy.mock.calls.map(call => JSON.parse(call[0] as string));
      
      // Should log test mode config details
      const configLog = logs.find(log => log.event === 'test_mode_config');
      expect(configLog).toBeDefined();
      expect(configLog?.data.rawTemplate).toBeDefined();
      expect(configLog?.data.rawTemplate.entityCount).toBeGreaterThan(0);
      expect(configLog?.data.rawTemplate.pageCount).toBeGreaterThan(0);
      expect(Array.isArray(configLog?.data.rawTemplate.entities)).toBe(true);
      expect(Array.isArray(configLog?.data.rawTemplate.pages)).toBe(true);

      // Should log final structure
      const completeLog = logs.find(log => log.event === 'generation_complete');
      expect(completeLog).toBeDefined();
      expect(completeLog?.data.testMode).toBe(true);
      expect(completeLog?.data.finalStructure).toBeDefined();
      expect(Array.isArray(completeLog?.data.finalStructure.entities)).toBe(true);
      expect(Array.isArray(completeLog?.data.finalStructure.pageRoutes)).toBe(true);
      expect(Array.isArray(completeLog?.data.finalStructure.pageKinds)).toBe(true);

      logSpy.mockRestore();
    });

    it('should use template fallback immediately in test mode', async () => {
      process.env.AI_TEST_MODE = 'true';
      const logger = createLogger('test-req-003');
      const logSpy = jest.spyOn(console, 'log');

      const result = await generateConfigFromPrompt('Build a habit tracker', logger);

      const logs = logSpy.mock.calls.map(call => JSON.parse(call[0] as string));
      
      // Should log template fallback
      const testModeLog = logs.find(log => log.event === 'test_mode_active');
      expect(testModeLog?.data.templateId).toBeDefined();

      // Verify result is complete
      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.pages.some(p => p.root?.kind === 'table')).toBe(true);
      expect(result.pages.some(p => p.root?.kind === 'form')).toBe(true);

      logSpy.mockRestore();
    });

    it('should return complete CRUD app config in test mode', async () => {
      process.env.AI_TEST_MODE = 'true';
      const logger = createLogger('test-req-004');

      const result = await generateConfigFromPrompt('Build an expense tracker', logger);

      // Verify complete app structure
      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.pages.length).toBeGreaterThan(0);
      
      // Should have at least one table page
      const tablePages = result.pages.filter(p => p.root?.kind === 'table');
      expect(tablePages.length).toBeGreaterThan(0);
      
      // Should have at least one form page
      const formPages = result.pages.filter(p => p.root?.kind === 'form');
      expect(formPages.length).toBeGreaterThan(0);
      
      // Should have theme
      expect(result.theme).toBeDefined();
    });

    it('should include testMode flag in generation_start log', async () => {
      process.env.AI_TEST_MODE = 'true';
      const logger = createLogger('test-req-005');
      const logSpy = jest.spyOn(console, 'log');

      await generateConfigFromPrompt('Build a book library', logger);

      const logs = logSpy.mock.calls.map(call => JSON.parse(call[0] as string));
      const startLog = logs.find(log => log.event === 'generation_start');
      
      expect(startLog).toBeDefined();
      expect(startLog?.data.testMode).toBe(true);

      logSpy.mockRestore();
    });

    it('should work normally when AI_TEST_MODE is not set', async () => {
      delete process.env.AI_TEST_MODE;
      const logger = createLogger('test-req-006');
      const logSpy = jest.spyOn(console, 'log');

      // This will try real providers (will likely fail without API keys in test env)
      // but we're just checking that test mode is not activated
      try {
        await generateConfigFromPrompt('Build a CRM', logger);
      } catch (e) {
        // Ignore errors from missing API keys
      }

      const logs = logSpy.mock.calls.map(call => JSON.parse(call[0] as string));
      
      // Should NOT log test mode activation
      const testModeLogs = logs.filter(log => log.event === 'test_mode_active');
      expect(testModeLogs.length).toBe(0);

      // Should log normal generation start without testMode flag or with testMode: false
      const startLog = logs.find(log => log.event === 'generation_start');
      expect(startLog).toBeDefined();
      expect(startLog?.data.testMode).toBeFalsy();

      logSpy.mockRestore();
    });

    it('should work normally when AI_TEST_MODE is false', async () => {
      process.env.AI_TEST_MODE = 'false';
      const logger = createLogger('test-req-007');
      const logSpy = jest.spyOn(console, 'log');

      try {
        await generateConfigFromPrompt('Build a project manager', logger);
      } catch (e) {
        // Ignore errors from missing API keys
      }

      const logs = logSpy.mock.calls.map(call => JSON.parse(call[0] as string));
      
      // Should NOT activate test mode
      const testModeLogs = logs.filter(log => log.event === 'test_mode_active');
      expect(testModeLogs.length).toBe(0);

      logSpy.mockRestore();
    });
  });

  describe('Test Mode Logging', () => {
    const originalEnv = process.env.AI_TEST_MODE;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.AI_TEST_MODE = originalEnv;
      } else {
        delete process.env.AI_TEST_MODE;
      }
    });

    it('should log prompt snippet in test mode', async () => {
      process.env.AI_TEST_MODE = 'true';
      const logger = createLogger('test-req-008');
      const logSpy = jest.spyOn(console, 'log');

      const testPrompt = 'Build a comprehensive customer relationship management system';
      await generateConfigFromPrompt(testPrompt, logger);

      const logs = logSpy.mock.calls.map(call => JSON.parse(call[0] as string));
      const testModeLog = logs.find(log => log.event === 'test_mode_active');
      
      expect(testModeLog?.data.prompt).toBeDefined();
      expect(testModeLog?.data.prompt.length).toBeLessThanOrEqual(100);
      expect(testPrompt.startsWith(testModeLog?.data.prompt)).toBe(true);

      logSpy.mockRestore();
    });

    it('should log template ID in test mode', async () => {
      process.env.AI_TEST_MODE = 'true';
      const logger = createLogger('test-req-009');
      const logSpy = jest.spyOn(console, 'log');

      await generateConfigFromPrompt('Build a CRM', logger);

      const logs = logSpy.mock.calls.map(call => JSON.parse(call[0] as string));
      const testModeLog = logs.find(log => log.event === 'test_mode_active');
      
      expect(testModeLog?.data.templateId).toBeDefined();
      expect(typeof testModeLog?.data.templateId).toBe('string');

      logSpy.mockRestore();
    });

    it('should log raw template entity details in test mode', async () => {
      process.env.AI_TEST_MODE = 'true';
      const logger = createLogger('test-req-010');
      const logSpy = jest.spyOn(console, 'log');

      await generateConfigFromPrompt('Build an inventory system', logger);

      const logs = logSpy.mock.calls.map(call => JSON.parse(call[0] as string));
      const configLog = logs.find(log => log.event === 'test_mode_config');
      
      expect(configLog?.data.rawTemplate.entities).toBeDefined();
      expect(Array.isArray(configLog?.data.rawTemplate.entities)).toBe(true);
      
      // Each entity should have name and fieldCount
      configLog?.data.rawTemplate.entities.forEach((entity: any) => {
        expect(entity.name).toBeDefined();
        expect(typeof entity.fieldCount).toBe('number');
      });

      logSpy.mockRestore();
    });

    it('should log raw template page details in test mode', async () => {
      process.env.AI_TEST_MODE = 'true';
      const logger = createLogger('test-req-011');
      const logSpy = jest.spyOn(console, 'log');

      await generateConfigFromPrompt('Build a task manager', logger);

      const logs = logSpy.mock.calls.map(call => JSON.parse(call[0] as string));
      const configLog = logs.find(log => log.event === 'test_mode_config');
      
      expect(configLog?.data.rawTemplate.pages).toBeDefined();
      expect(Array.isArray(configLog?.data.rawTemplate.pages)).toBe(true);
      
      // Each page should have id, route, and kind
      configLog?.data.rawTemplate.pages.forEach((page: any) => {
        expect(page.id).toBeDefined();
        expect(page.route).toBeDefined();
        expect(page.kind).toBeDefined();
      });

      logSpy.mockRestore();
    });
  });
});
