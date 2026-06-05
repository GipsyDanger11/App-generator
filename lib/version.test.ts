/**
 * Unit tests for version identification utility
 * 
 * Tests the three fallback strategies:
 * 1. Environment variable (APP_VERSION)
 * 2. Git commit hash
 * 3. Package.json version + timestamp
 */

import { getVersion } from './version';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

// Mock child_process and fs
jest.mock('child_process');
jest.mock('fs');

const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;
const mockedReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;

describe('getVersion', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment and mocks before each test
    jest.resetAllMocks();
    process.env = { ...originalEnv };
    delete process.env.APP_VERSION;
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Strategy 1: Environment variable override', () => {
    it('should return APP_VERSION environment variable when set', () => {
      process.env.APP_VERSION = 'custom-version-1.0.0';

      const version = getVersion();

      expect(version).toBe('custom-version-1.0.0');
      // Should not attempt git or file operations
      expect(mockedExecSync).not.toHaveBeenCalled();
      expect(mockedReadFileSync).not.toHaveBeenCalled();
    });

    it('should prefer environment variable over git hash', () => {
      process.env.APP_VERSION = 'env-override';
      mockedExecSync.mockReturnValue('abc1234\n');

      const version = getVersion();

      expect(version).toBe('env-override');
      expect(mockedExecSync).not.toHaveBeenCalled();
    });
  });

  describe('Strategy 2: Git commit hash', () => {
    it('should return git commit hash when git is available', () => {
      mockedExecSync.mockReturnValue('abc1234\n');

      const version = getVersion();

      expect(version).toBe('abc1234');
      expect(mockedExecSync).toHaveBeenCalledWith(
        'git rev-parse --short HEAD',
        expect.objectContaining({
          encoding: 'utf8',
          timeout: 1000,
        })
      );
    });

    it('should trim whitespace from git hash', () => {
      mockedExecSync.mockReturnValue('  def5678  \n');

      const version = getVersion();

      expect(version).toBe('def5678');
    });

    it('should fall back to package.json when git command fails', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('git command not found');
      });

      const packageJson = JSON.stringify({ version: '0.1.0' });
      mockedReadFileSync.mockReturnValue(packageJson);

      const version = getVersion();

      expect(version).toMatch(/^0\.1\.0-\d+$/);
      expect(mockedReadFileSync).toHaveBeenCalled();
    });

    it('should fall back when git returns empty string', () => {
      mockedExecSync.mockReturnValue('');

      const packageJson = JSON.stringify({ version: '0.2.0' });
      mockedReadFileSync.mockReturnValue(packageJson);

      const version = getVersion();

      expect(version).toMatch(/^0\.2\.0-\d+$/);
    });
  });

  describe('Strategy 3: Package.json version + timestamp', () => {
    beforeEach(() => {
      // Ensure git fails to fall through to package.json
      mockedExecSync.mockImplementation(() => {
        throw new Error('git not available');
      });
    });

    it('should return package.json version with timestamp when git unavailable', () => {
      const packageJson = JSON.stringify({ version: '1.2.3' });
      mockedReadFileSync.mockReturnValue(packageJson);

      const version = getVersion();

      expect(version).toMatch(/^1\.2\.3-\d+$/);
      
      // Extract timestamp and verify it's recent (within last second)
      const timestamp = parseInt(version.split('-')[1]);
      const now = Date.now();
      expect(timestamp).toBeGreaterThan(now - 1000);
      expect(timestamp).toBeLessThanOrEqual(now);
    });

    it('should use 0.0.0 when package.json has no version field', () => {
      const packageJson = JSON.stringify({ name: 'test-app' });
      mockedReadFileSync.mockReturnValue(packageJson);

      const version = getVersion();

      expect(version).toMatch(/^0\.0\.0-\d+$/);
    });

    it('should return unknown-timestamp when package.json read fails', () => {
      mockedReadFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const version = getVersion();

      expect(version).toMatch(/^unknown-\d+$/);
      
      // Verify timestamp is recent
      const timestamp = parseInt(version.split('-')[1]);
      const now = Date.now();
      expect(timestamp).toBeGreaterThan(now - 1000);
      expect(timestamp).toBeLessThanOrEqual(now);
    });

    it('should handle invalid JSON in package.json', () => {
      mockedReadFileSync.mockReturnValue('invalid json{');

      const version = getVersion();

      expect(version).toMatch(/^unknown-\d+$/);
    });
  });

  describe('Edge cases', () => {
    it('should handle git timeout gracefully', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Command timed out');
      });

      const packageJson = JSON.stringify({ version: '0.5.0' });
      mockedReadFileSync.mockReturnValue(packageJson);

      const version = getVersion();

      expect(version).toMatch(/^0\.5\.0-\d+$/);
    });

    it('should suppress stderr from git command', () => {
      // Verify stdio configuration suppresses stderr
      mockedExecSync.mockReturnValue('abc1234\n');

      getVersion();

      expect(mockedExecSync).toHaveBeenCalledWith(
        'git rev-parse --short HEAD',
        expect.objectContaining({
          stdio: ['ignore', 'pipe', 'ignore'],
        })
      );
    });

    it('should have reasonable timeout for git command', () => {
      mockedExecSync.mockReturnValue('abc1234\n');

      getVersion();

      expect(mockedExecSync).toHaveBeenCalledWith(
        'git rev-parse --short HEAD',
        expect.objectContaining({
          timeout: 1000,
        })
      );
    });
  });

  describe('Multiple calls', () => {
    it('should return consistent results when using environment variable', () => {
      process.env.APP_VERSION = 'consistent-version';

      const version1 = getVersion();
      const version2 = getVersion();

      expect(version1).toBe(version2);
      expect(version1).toBe('consistent-version');
    });

    it('should return consistent git hash across calls', () => {
      mockedExecSync.mockReturnValue('stable123\n');

      const version1 = getVersion();
      const version2 = getVersion();

      expect(version1).toBe(version2);
      expect(version1).toBe('stable123');
    });

    it('should generate timestamp-based versions when using fallback', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('git not available');
      });
      mockedReadFileSync.mockImplementation(() => {
        throw new Error('package.json not found');
      });

      const version = getVersion();

      expect(version).toMatch(/^unknown-\d+$/);
      
      // Verify timestamp is recent (within last second)
      const timestamp = parseInt(version.split('-')[1]);
      const now = Date.now();
      expect(timestamp).toBeGreaterThan(now - 1000);
      expect(timestamp).toBeLessThanOrEqual(now);
    });
  });
});
