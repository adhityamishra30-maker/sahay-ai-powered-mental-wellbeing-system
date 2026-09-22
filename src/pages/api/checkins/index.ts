import type { APIRoute } from 'astro';
import { addAuditLogEntry, addCheckinAndAlert, deleteCheckin } from '../../../lib/db';
import { getSession } from '../../../lib/session';
import { cleanText, getClientIp, hashIp, isRateLimited, jsonResponse } from '../../../lib/security';

const RISK_LEVELS = ['Low', 'Moderate', 'High', 'Critical'];

function clampScore(value: unknown, fallback: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(Number(value)))) : fallback;
}

function parseCoords(value: unknown): { latitude: number; longitude: number; accuracy: number } | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const { latitude, longitude, accuracy } = value as Record<string, unknown>;
  if (![latitude, longitude, accuracy].every(Number.isFinite)) return undefined;
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return undefined;
  return { latitude: lat, longitude: lng, accuracy: Math.max(0, Math.round(Number(accuracy))) };
}

/** Public: guests may submit check-ins. Registered victims are linked by their session. */
export const POST: APIRoute = async (context) => {
  const { request, cookies } = context;
  const ipHash = hashIp(getClientIp(context));

  try {
    if (isRateLimited(`checkin:${ipHash ?? 'unknown'}`, 20, 10 * 60 * 1000)) {
      return jsonResponse({ error: 'Too many check-ins in a short time. If you need urgent help, call 112 or 14416.' }, 429);
    }

    const body = await request.json();
    const session = getSession(cookies);
    const userId = session?.accountType === 'registered_victim' ? session.userId : undefined;

    const riskLevelInput = typeof body.riskLevel === 'string' ? body.riskLevel : 'Low';
    const locationCoords = parseCoords(body.locationCoords);

    const result = addCheckinAndAlert({
      victimAlias: cleanText(body.victimAlias, 80) ?? 'Anonymous Survivor',
      userId,
      message: cleanText(body.message, 4000) ?? '',
      mood: cleanText(body.mood, 60) ?? 'Not specified',
      moodScore: clampScore(body.moodScore, 0),
      predictedRiskScore: clampScore(body.predictedRiskScore, 35),
      riskLevel: RISK_LEVELS.includes(riskLevelInput) ? riskLevelInput : 'Low',
      isAtrocityRelated: Boolean(body.isAtrocityRelated),
      neuroStress: cleanText(body.neuroStress, 30),
      trustWithdrawal: cleanText(body.trustWithdrawal, 30),
      existentialTrauma: cleanText(body.existentialTrauma, 30),
      locationLabel: cleanText(body.locationLabel, 120),
      currentLocationShared: Boolean(locationCoords),
      trustedContactName: cleanText(body.trustedContactName, 80),
      trustedContactPhone: cleanText(body.trustedContactPhone, 20),
      locationCoords,
      ipHash
    });

    return jsonResponse({ success: true, ...result }, 201);
  } catch (err) {
    console.error('[SAHAY] Check-in processing error:', err);
    return jsonResponse({ error: 'Your check-in could not be saved. If you need urgent help, call 112 or 14416.' }, 500);
  }
};

/**
 * Deletes a check-in and its alert. Guests prove ownership with the one-time
 * deleteToken returned at submission; registered victims by their session.
 */
export const DELETE: APIRoute = async (context) => {
  const { request, cookies } = context;

  try {
    const body = await request.json();
    const checkinId = cleanText(body.checkinId, 40);
    const deleteToken = cleanText(body.deleteToken, 100);
    const session = getSession(cookies);
    const userId = session?.accountType === 'registered_victim' ? session.userId : undefined;

    if (!checkinId || (!deleteToken && !userId)) {
      return jsonResponse({ error: 'Check-in ID and deletion code are required.' }, 400);
    }

    if (!deleteCheckin(checkinId, { deleteToken, userId })) {
      return jsonResponse({ error: 'Check-in not found or already deleted.' }, 404);
    }

    addAuditLogEntry({
      actor: userId ? 'Registered victim' : 'Guest victim',
      role: 'Victim / Complainant',
      action: 'VICTIM_CHECKIN_DELETED',
      targetCase: checkinId,
      details: 'Victim deleted a check-in and its linked alert.',
      severity: 'info',
      ipHash: hashIp(getClientIp(context))
    });

    return jsonResponse({ success: true });
  } catch (err) {
    console.error('[SAHAY] Check-in deletion error:', err);
    return jsonResponse({ error: 'Could not delete the check-in right now. Please try again.' }, 500);
  }
};
