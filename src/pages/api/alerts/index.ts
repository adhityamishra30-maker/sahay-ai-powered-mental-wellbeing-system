import type { APIRoute } from 'astro';
import { getAlertsForCounsellor, getAllAlerts } from '../../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  try {
    const counsellor = url.searchParams.get('counsellor');
    let alerts: any[];

    if (counsellor && counsellor.trim()) {
      alerts = getAlertsForCounsellor(counsellor.trim());
    } else {
      alerts = getAllAlerts();
    }

    return new Response(JSON.stringify({
      success: true,
      alerts
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Alerts retrieval error: ' + (err?.message || 'Unknown') }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
