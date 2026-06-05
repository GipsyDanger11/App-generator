import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Version Identifier Utility
 * 
 * Provides version identification for the application using multiple fallback strategies:
 * 1. Environment variable (APP_VERSION) - highest priority
 * 2. Git commit hash (if .git exists and git command available)
 * 3. Package.json version + timestamp - final fallback
 * 
 * This helps verify which code version is running in the dev server.
 */

/**
 * Get the current application version identifier
 * 
 * @returns A version string identifying the running code
 */
export function getVersion(): string {
  // Strategy 1: Check for environment variable override
  if (process.env.APP_VERSION) {
    return process.env.APP_VERSION;
  }

  // Strategy 2: Try to get Git commit hash
  try {
    const gitHash = execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'], // Suppress stderr
      timeout: 1000, // 1 second timeout
    }).trim();
    
    if (gitHash && gitHash.length > 0) {
      return gitHash;
    }
  } catch (error) {
    // Git not available or not a git repository, fall through to next strategy
  }

  // Strategy 3: Fallback to package.json version + timestamp
  try {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const version = packageJson.version || '0.0.0';
    const timestamp = Date.now();
    return `${version}-${timestamp}`;
  } catch (error) {
    // If even package.json fails, return a timestamp-only version
    return `unknown-${Date.now()}`;
  }
}
