import type { APIRoute } from 'astro';
import { getUserByUsername, addAuditLogEntry, getStaffDisplayName, recordLogin } from '../../../lib/db';
import { verifyPassword } from '../../../lib/auth';
import { createSession } from '../../../lib/session';
import { clearRateLimit, getClientIp, hashIp, isBlocked, isRateLimited, jsonResponse } from '../../../lib/security';

const MAX_FAILURES = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const INVALID_CREDENTIALS = 'Invalid username or password.';

// Which account types each sign-in form may unlock.
const PORTAL_ACCOUNT_TYPES: Record<string, string> = {
  victim: 'registered_victim',
  counsellor: 'counsellor',
  authority: 'authority'
};

export const POST: APIRoute = async (context) => {
  const { request, cookies } = context;
  const ipHash = hashIp(getClientIp(context));

  try {
    const body = await request.json();
    const username = typeof body.username === 'string' ? body.username.trim().slice(0, 64) : '';
    const password = typeof body.password === 'string' ? body.password.slice(0, 256) : '';
    const portal = typeof body.portal === 'string' ? body.portal : '';
    const expectedAccountType = PORTAL_ACCOUNT_TYPES[portal];

    if (!username || !password || !expectedAccountType) {
      return jsonResponse({ error: 'Username and password are required.' }, 400);
    }

    const userKey = `login-user:${username.toLowerCase()}`;
    const ipKey = `login-ip:${ipHash ?? 'unknown'}`;
    if (isBlocked(userKey, MAX_FAILURES) || isBlocked(ipKey, MAX_FAILURES * 4)) {
      return jsonResponse({ error: 'Too many failed attempts. Please wait 15 minutes and try again.' }, 429);
    }

    const user = getUserByUsername(username);
    const passwordOk = user ? verifyPassword(password, user.password_hash, user.salt) : false;

    if (!user || !passwordOk || user.account_type !== expectedAccountType) {
      isRateLimited(userKey, MAX_FAILURES, FAILURE_WINDOW_MS);
      isRateLimited(ipKey, MAX_FAILURES * 4, FAILURE_WINDOW_MS);
      addAuditLogEntry({
        // Unknown usernames are not recorded: people sometimes type a password into the username field.
        actor: user ? user.username : 'Unknown account',
        role: user ? user.role : 'Unknown',
        action: 'LOGIN_FAILED',
        targetCase: 'AUTH',
        details: `Failed sign-in on the ${portal} portal.`,
        severity: 'warning',
        ipHash
      });
      return jsonResponse({ error: INVALID_CREDENTIALS }, 401);
    }

    clearRateLimit(userKey);
    recordLogin(user.id);

    const displayName = getStaffDisplayName(user.id, user.account_type) || user.username;
    createSession(cookies, {
      userId: user.id,
      accountType: user.account_type,
      displayName,
      role: user.role
    });

    addAuditLogEntry({
      actor: user.account_type === 'registered_victim' ? 'Registered victim' : displayName,
      role: user.role,
      action: 'LOGIN_SUCCESS',
      targetCase: user.account_type === 'registered_victim' ? user.id : 'AUTH',
      details: `Signed in on the ${portal} portal.`,
      severity: 'info',
      ipHash
    });

    return jsonResponse({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: displayName,
        role: user.role,
        accountType: user.account_type
      }
    });
  } catch (err) {
    console.error('[SAHAY] Login error:', err);
    return jsonResponse({ error: 'Sign-in is temporarily unavailable. Please try again.' }, 500);
  }
};
