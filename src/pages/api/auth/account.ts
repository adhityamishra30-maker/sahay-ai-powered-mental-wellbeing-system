import type { APIRoute } from 'astro';
import { addAuditLogEntry, deleteVictimData } from '../../../lib/db';
import { destroySession, requireSession } from '../../../lib/session';
import { getClientIp, hashIp, jsonResponse } from '../../../lib/security';

/** Lets a registered victim erase all of their check-ins and their account. */
export const DELETE: APIRoute = async (context) => {
  const { cookies } = context;
  const auth = requireSession(cookies, ['registered_victim']);
  if (auth.response) return auth.response;

  try {
    const deletedCheckins = deleteVictimData(auth.session.userId, true);
    destroySession(cookies);

    addAuditLogEntry({
      actor: 'Registered victim',
      role: 'Victim / Complainant',
      action: 'VICTIM_ACCOUNT_ERASED',
      targetCase: auth.session.userId,
      details: `Victim erased their account and ${deletedCheckins} check-in(s).`,
      severity: 'info',
      ipHash: hashIp(getClientIp(context))
    });

    return jsonResponse({ success: true, deletedCheckins });
  } catch (err) {
    console.error('[SAHAY] Account erasure error:', err);
    return jsonResponse({ error: 'Could not delete your account right now. Please try again.' }, 500);
  }
};
