import type { APIRoute } from 'astro';
import { getUserByUsername, createVictimAccount, addAuditLogEntry } from '../../../lib/db';
import { generateSalt, hashPassword } from '../../../lib/auth';
import { createSession } from '../../../lib/session';
import { getClientIp, hashIp, isRateLimited, jsonResponse } from '../../../lib/security';

export const POST: APIRoute = async (context) => {
  const { request, cookies } = context;
  const ipHash = hashIp(getClientIp(context));

  try {
    if (isRateLimited(`signup:${ipHash ?? 'unknown'}`, 5, 60 * 60 * 1000)) {
      return jsonResponse({ error: 'Too many accounts created from this network. Please try again later.' }, 429);
    }

    const body = await request.json();
    const rawAlias = typeof body.alias === 'string' ? body.alias : typeof body.username === 'string' ? body.username : '';
    const alias = rawAlias.trim();
    const password = typeof body.password === 'string' ? body.password : '';

    if (alias.length < 3 || alias.length > 32 || !/^[\p{L}\p{N}_.-]+$/u.test(alias)) {
      return jsonResponse({ error: 'Alias must be 3–32 letters, numbers, dots, dashes or underscores.' }, 400);
    }

    if (password.length < 8 || password.length > 256) {
      return jsonResponse({ error: 'Password must be at least 8 characters long.' }, 400);
    }

    const existing = getUserByUsername(alias);
    if (existing) {
      return jsonResponse({ error: 'This alias is already taken. Please choose another private alias.' }, 409);
    }

    const salt = generateSalt();
    const hash = hashPassword(password, salt);
    const newUser = createVictimAccount(alias, hash, salt);

    createSession(cookies, {
      userId: newUser.id,
      accountType: newUser.accountType,
      displayName: newUser.username,
      role: newUser.role
    });

    addAuditLogEntry({
      actor: 'Registered victim',
      role: 'Victim / Complainant',
      action: 'VICTIM_ACCOUNT_REGISTERED',
      targetCase: newUser.id,
      details: 'New alias-based victim account created. No name, email or phone collected.',
      severity: 'info',
      ipHash
    });

    return jsonResponse({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.username,
        role: newUser.role,
        accountType: newUser.accountType
      }
    }, 201);
  } catch (err) {
    console.error('[SAHAY] Signup error:', err);
    return jsonResponse({ error: 'Registration is temporarily unavailable. Please try again.' }, 500);
  }
};
