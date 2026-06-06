import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { generateConfigFromPrompt, TEMPLATES } from '@/lib/mistral';
import { findTemplate } from '@/lib/config/templates';
import { parseConfig, ensureCompleteApp } from '@/lib/config/parser';
import { createLogger, generateRequestId } from '@/lib/logger';

// Python AI microservice URL — configurable via env var
const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

// Track if we've logged environment details on startup
let hasLoggedEnvironment = false;

/**
 * Try the Python AI microservice first. If it's running, use it for dynamic
 * AI generation (iterative refinement, Pydantic validation, multi-turn).
 * Falls back to the TypeScript provider chain if Python is unavailable.
 */
async function generateViaPython(prompt: string, logger: ReturnType<typeof createLogger>): Promise<any | null> {
  try {
    logger.info('api', 'python_service_attempt', { url: `${PYTHON_AI_URL}/generate` });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000); // 90s timeout

    const res = await fetch(`${PYTHON_AI_URL}/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      logger.warn('api', 'python_service_error', {
        status: res.status,
        body: errText.slice(0, 300),
      });
      return null;
    }

    const data = await res.json();

    logger.info('api', 'python_service_success', {
      generationTimeMs: data.meta?.generationTimeMs,
      entityCount: data.meta?.entityCount,
      pageCount: data.meta?.pageCount,
    });

    return data.config;
  } catch (e) {
    // Python service not running or network error — fall back silently
    const errMsg = e instanceof Error ? e.message : String(e);
    logger.info('api', 'python_service_unavailable', {
      error: errMsg,
      fallback: 'Using TypeScript provider chain',
    });
    return null;
  }
}

export async function POST(req: Request) {
  // Generate request ID at entry for correlation
  const requestId = generateRequestId();
  const logger = createLogger(requestId);
  const startTime = Date.now();

  // Log environment details on first request (cache-busting version check)
  if (!hasLoggedEnvironment) {
    logger.info('api', 'environment_details', {
      nodeVersion: process.version,
      processUptime: process.uptime(),
      timestamp: new Date().toISOString(),
      pythonAiUrl: PYTHON_AI_URL,
    });
    hasLoggedEnvironment = true;
  }

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  let body: any;
  try { 
    body = await req.json(); 
  } catch { 
    logger.error('api', 'invalid_json', new Error('Failed to parse request JSON'));
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); 
  }
  
  const prompt = String(body?.prompt ?? '').trim();
  const templateId = typeof body?.templateId === 'string' ? body.templateId : null;

  // Log request start with details
  logger.info('api', 'request_start', {
    userId: user.id,
    prompt: prompt || undefined,
    templateId: templateId || undefined,
  });

  // Template path — stays in TypeScript (no AI needed)
  if (templateId) {
    const tpl = findTemplate(templateId);
    if (!tpl) {
      logger.warn('api', 'template_not_found', { templateId });
      return NextResponse.json({ error: 'Unknown template' }, { status: 404 });
    }
    logger.info('api', 'using_template', { 
      templateId, 
      templateName: tpl.name 
    });
    const config = ensureCompleteApp(parseConfig(tpl.config, logger), logger);
    
    const executionTime = Date.now() - startTime;
    logger.info('api', 'request_complete', { executionTime, success: true, source: 'template' });
    
    return NextResponse.json({ config });
  }

  if (!prompt) {
    logger.warn('api', 'missing_prompt', {});
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  // ─── AI Generation: Python first, TypeScript fallback ───
  let config: any = null;
  let source = 'unknown';

  // 1. Try Python AI microservice (dynamic, iterative refinement)
  const pythonConfig = await generateViaPython(prompt, logger);
  if (pythonConfig) {
    // Python returns a raw config dict — run it through our TS parser for safety
    config = ensureCompleteApp(parseConfig(pythonConfig, logger), logger);
    source = 'python-ai';
  }

  // 2. Fall back to TypeScript provider chain
  if (!config) {
    logger.info('api', 'fallback_to_typescript', {
      reason: 'Python service unavailable or returned null',
    });
    config = await generateConfigFromPrompt(prompt, logger);
    source = 'typescript-ai';
  }

  // Log final config summary before return
  logger.info('api', 'config_summary', {
    source,
    name: config.name,
    entityCount: config.entities.length,
    entities: config.entities.map((e: any) => ({ name: e.name, fieldCount: e.fields.length })),
    pageCount: config.pages.length,
    pages: config.pages.map((p: any) => ({ id: p.id, route: p.route, kind: p.root?.kind })),
    hasTheme: !!config.theme,
    themePrimary: config.theme?.primary,
    themeAccent: config.theme?.accent,
  });

  const executionTime = Date.now() - startTime;
  logger.info('api', 'request_complete', { executionTime, success: true, source });

  return NextResponse.json({ config });
}

export async function GET() {
  return NextResponse.json({ templates: TEMPLATES.map((t) => ({ id: t.id, name: t.name, description: t.description, emoji: t.emoji })) });
}
