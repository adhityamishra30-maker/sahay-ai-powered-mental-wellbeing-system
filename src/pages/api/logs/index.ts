import type { APIRoute } from 'astro';
import { getAllAuditLogs, addAuditLogEntry } from '../../../lib/db';

export const GET: APIRoute = async () => {
  try {
    const logs = getAllAuditLogs();
    return new Response(JSON.stringify({
      success: true,
      logs
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Audit logs error: ' + (err?.message || 'Unknown') }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const actor = typeof body.actor === 'string' ? body.actor : 'Anonymous';
    const role = typeof body.role === 'string' ? body.role : 'Victim / Complainant';
    const action = typeof body.action === 'string' ? body.action : 'GENERAL_ACTION';
    const targetCase = typeof body.targetCase === 'string' ? body.targetCase : 'GENERAL';
    const details = typeof body.details === 'string' ? body.details : '';
    const severity = typeof body.severity === 'string' ? body.severity : 'info';

    addAuditLogEntry({ actor, role, action, targetCase, details, severity });

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Audit log insert error: ' + (err?.message || 'Unknown') }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
