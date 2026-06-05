import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { generateConfigFromPrompt, TEMPLATES } from '@/lib/mistral';
import { findTemplate } from '@/lib/config/templates';
import { parseConfig, ensureCompleteApp } from '@/lib/config/parser';
import { createLogger, generateRequestId } from '@/lib/logger';

// Track if we've logged environment details on startup
let hasLoggedEnvironment = false;

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
    
    // Log final config summary
    logger.info('api', 'config_summary', {
      entityCount: config.entities.length,
      pageCount: config.pages.length,
      pageKinds: config.pages.map(p => p.root?.kind),
    });
    
    const executionTime = Date.now() - startTime;
    logger.info('api', 'request_complete', {
      executionTime,
      success: true,
    });
    
    return NextResponse.json({ config });
  }

  if (!prompt) {
    logger.warn('api', 'missing_prompt', {});
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  const config = await generateConfigFromPrompt(prompt);

  // Log final config summary before return
  logger.info('api', 'config_summary', {
    name: config.name,
    entityCount: config.entities.length,
    entities: config.entities.map(e => ({ name: e.name, fieldCount: e.fields.length })),
    pageCount: config.pages.length,
    pages: config.pages.map(p => ({ id: p.id, route: p.route, kind: p.root?.kind })),
    hasTheme: !!config.theme,
    themePrimary: config.theme?.primary,
    themeAccent: config.theme?.accent,
  });

  // Log total execution time and success status
  const executionTime = Date.now() - startTime;
  logger.info('api', 'request_complete', {
    executionTime,
    success: true,
  });

  return NextResponse.json({ config });
}

export async function GET() {
  return NextResponse.json({ templates: TEMPLATES.map((t) => ({ id: t.id, name: t.name, description: t.description, emoji: t.emoji })) });
}
