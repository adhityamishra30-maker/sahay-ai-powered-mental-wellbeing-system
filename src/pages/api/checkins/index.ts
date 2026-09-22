import type { APIRoute } from 'astro';
import { addCheckinAndAlert } from '../../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const victimAlias = typeof body.victimAlias === 'string' && body.victimAlias.trim()
      ? body.victimAlias.trim()
      : 'Anonymous Survivor';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const mood = typeof body.mood === 'string' ? body.mood : 'Not specified';
    const moodScore = Number.isFinite(body.moodScore) ? Number(body.moodScore) : 0;
    const predictedRiskScore = Number.isFinite(body.predictedRiskScore) ? Number(body.predictedRiskScore) : 35;
    const riskLevel = typeof body.riskLevel === 'string' ? body.riskLevel : 'Low';
    const isAtrocityRelated = Boolean(body.isAtrocityRelated);

    const neuroStress = typeof body.neuroStress === 'string' ? body.neuroStress : undefined;
    const trustWithdrawal = typeof body.trustWithdrawal === 'string' ? body.trustWithdrawal : undefined;
    const existentialTrauma = typeof body.existentialTrauma === 'string' ? body.existentialTrauma : undefined;
    const locationLabel = typeof body.locationLabel === 'string' ? body.locationLabel : undefined;
    const currentLocationShared = Boolean(body.currentLocationShared);
    const trustedContactName = typeof body.trustedContactName === 'string' ? body.trustedContactName : undefined;
    const trustedContactPhone = typeof body.trustedContactPhone === 'string' ? body.trustedContactPhone : undefined;
    const locationCoords = body.locationCoords && typeof body.locationCoords === 'object' ? body.locationCoords : undefined;

    const result = addCheckinAndAlert({
      victimAlias,
      message,
      mood,
      moodScore,
      predictedRiskScore,
      riskLevel,
      isAtrocityRelated,
      neuroStress,
      trustWithdrawal,
      existentialTrauma,
      locationLabel,
      currentLocationShared,
      trustedContactName,
      trustedContactPhone,
      locationCoords
    });

    return new Response(JSON.stringify({
      success: true,
      ...result
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Check-in processing error: ' + (err?.message || 'Unknown') }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
