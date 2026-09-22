import type { APIRoute } from 'astro';
import { getAllAuditLogs, addAuditLogEntry } from '../../../lib/db';
import { requireSession, STAFF_ACCOUNT_TYPES } from '../../../lib/session';
import { cleanText, getClientIp, hashIp, jsonResponse } from '../../../lib/security';

export const GET: APIRoute = async ({ cookies }) => {
  const auth = requireSession(cookies, STAFF_ACCOUNT_TYPES);
  if (auth.response) return auth.response;

  try {
    return jsonResponse({ success: true, logs: getAllAuditLogs() });
  } catch (err) {
    console.error('[SAHAY] Audit log retrieval error:', err);
    return jsonResponse({ error: 'Audit logs are temporarily unavailable.' }, 500);
  }
};

/**
 * Records a staff action (case view, alert acknowledgement, intervention).
 * Actor and role always come from the signed-in session, never the request body.
 */
export const POST: APIRoute = async (context) => {
  const auth = requireSession(context.cookies, STAFF_ACCOUNT_TYPES);
  if (auth.response) return auth.response;

  try {
    const body = await context.request.json();
    const action = cleanText(body.action, 64)?.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const targetCase = cleanText(body.targetCase, 64) ?? 'GENERAL';
    const details = cleanText(body.details, 500) ?? '';

    if (!action) {
      return jsonResponse({ error: 'An action name is required.' }, 400);
    }

    addAuditLogEntry({
      actor: auth.session.displayName,
      role: auth.session.role,
      action,
      targetCase,
      details,
      severity: 'info',
      ipHash: hashIp(getClientIp(context))
    });

    return jsonResponse({ success: true }, 201);
  } catch (err) {
    console.error('[SAHAY] Audit log insert error:', err);
    return jsonResponse({ error: 'Could not record the audit entry.' }, 500);
  }
};
