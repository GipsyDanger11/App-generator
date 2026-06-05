// Workflow executor: given a config and a record event, run matching workflows.
import type { AppConfig, WorkflowDef } from './config/types';
import { prisma } from './prisma';
import { jsonInput } from './jsonInput';

export async function runWorkflows(opts: {
  appId: string;
  appConfig: AppConfig;
  ownerId: string;
  triggerEntity: string;
  triggerEvent: 'create' | 'update' | 'delete';
  record: Record<string, unknown>;
}) {
  const wfs: WorkflowDef[] = (opts.appConfig.workflows ?? []).filter(
    (w) => w.enabled !== false && w.trigger?.entity?.toLowerCase() === opts.triggerEntity.toLowerCase() && w.trigger?.event === opts.triggerEvent,
  );
  for (const wf of wfs) {
    for (const action of wf.actions ?? []) {
      try {
        await runAction({ ...opts, action, workflowId: wf.id, workflowName: wf.name });
      } catch (e) {
        console.error('[workflow] action failed', wf.id, e);
      }
    }
  }
}

async function runAction(opts: {
  appId: string;
  ownerId: string;
  action: Record<string, unknown>;
  record: Record<string, unknown>;
  workflowId: string;
  workflowName: string;
}) {
  const { action, record, ownerId, appId, workflowName } = opts;
  if (action.type === 'notify') {
    const userId = (action.userId as string) || ownerId;
    const title = (action.title as string) || `Workflow: ${workflowName}`;
    const body = (action.body as string) || `Triggered on ${JSON.stringify(record).slice(0, 120)}`;
    await prisma.notification.create({ data: { userId, appId, title, body, type: 'info' } });
  } else if (action.type === 'webhook') {
    const url = action.url as string | undefined;
    if (!url) return;
    await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ workflow: workflowName, record }) }).catch(() => null);
  } else if (action.type === 'setField') {
    const entity = (action.entity as string) || '';
    const recordId = (record.id as string) || '';
    const field = action.field as string | undefined;
    const value = action.value;
    if (!entity || !recordId || !field) return;
    const existing = await prisma.record.findUnique({ where: { id: recordId } });
    if (!existing || existing.entityName.toLowerCase() !== entity.toLowerCase()) return;
    const data = { ...(existing.data as Record<string, unknown>), [field]: value };
    await prisma.record.update({ where: { id: recordId }, data: { data: jsonInput(data) } });
  }
}
