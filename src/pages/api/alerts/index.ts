import type { APIRoute } from 'astro';
import { getAlertsForCounsellor, getAllAlerts } from '../../../lib/db';
import { requireSession, STAFF_ACCOUNT_TYPES } from '../../../lib/session';
import { jsonResponse } from '../../../lib/security';

/**
 * Staff-only. Counsellors receive only the alerts assigned to them (scoped by
 * their session, not a query parameter); authorities receive all escalations.
 */
export const GET: APIRoute = async ({ cookies }) => {
  const auth = requireSession(cookies, STAFF_ACCOUNT_TYPES);
  if (auth.response) return auth.response;

  try {
    const alerts = auth.session.accountType === 'counsellor'
      ? getAlertsForCounsellor(auth.session.displayName)
      : getAllAlerts();

    return jsonResponse({ success: true, alerts });
  } catch (err) {
    console.error('[SAHAY] Alerts retrieval error:', err);
    return jsonResponse({ error: 'Alerts are temporarily unavailable.' }, 500);
  }
};
