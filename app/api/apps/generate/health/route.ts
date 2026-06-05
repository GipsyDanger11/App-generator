/**
 * Health Check API Route
 * 
 * GET /api/apps/generate/health
 * 
 * Returns system health status including:
 * - Current code version (Git hash or package.json version)
 * - Server timestamp
 * - Configured AI providers
 * - Node.js environment info
 * 
 * Purpose: Verify which code version is running and which providers are available.
 * Helps diagnose caching issues and configuration problems.
 */

import { NextResponse } from 'next/server';
import { getVersion } from '@/lib/version';

/**
 * Health response structure
 */
interface HealthResponse {
  status: 'ok';
  version: string; // Git commit hash or package.json version
  timestamp: string;
  providers: {
    primary: string;
    configured: string[]; // Providers with API keys present
  };
  cache: {
    nodeVersion: string;
    processUptime: number;
  };
}

/**
 * Check which AI provider API keys are configured
 */
function getConfiguredProviders(): string[] {
  const providers: string[] = [];
  
  // Check each provider's API key
  if (process.env.GROQ_API_KEY) {
    providers.push('groq');
  }
  if (process.env.OPENAI_API_KEY) {
    providers.push('openai');
  }
  if (process.env.ANTHROPIC_API_KEY) {
    providers.push('anthropic');
  }
  if (process.env.MISTRAL_API_KEY) {
    providers.push('mistral');
  }
  
  return providers;
}

/**
 * Determine the primary AI provider
 */
function getPrimaryProvider(): string {
  // Check if AI_PROVIDER env var is set
  const envProvider = process.env.AI_PROVIDER?.toLowerCase();
  if (envProvider) {
    return envProvider;
  }
  
  // Default to groq as primary provider
  return 'groq';
}

/**
 * GET handler for health check
 */
export async function GET() {
  try {
    const response: HealthResponse = {
      status: 'ok',
      version: getVersion(),
      timestamp: new Date().toISOString(),
      providers: {
        primary: getPrimaryProvider(),
        configured: getConfiguredProviders(),
      },
      cache: {
        nodeVersion: process.version,
        processUptime: process.uptime(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    // If health check fails, return minimal info
    return NextResponse.json(
      {
        status: 'error',
        version: 'unknown',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
