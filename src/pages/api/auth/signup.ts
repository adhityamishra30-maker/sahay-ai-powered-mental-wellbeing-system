import type { APIRoute } from 'astro';
import { getUserByUsername, createVictimAccount, addAuditLogEntry } from '../../../lib/db';
import { generateSalt, hashPassword } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const alias = typeof body.alias === 'string' ? body.alias.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!alias || alias.length < 3) {
      return new Response(JSON.stringify({ error: 'Private alias must be at least 3 characters long.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!password || password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters long.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const existing = getUserByUsername(alias);
    if (existing) {
      return new Response(JSON.stringify({ error: 'This alias is already taken. Please choose another private alias.' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const salt = generateSalt();
    const hash = hashPassword(password, salt);
    const newUser = createVictimAccount(alias, hash, salt);

    addAuditLogEntry({
      actor: alias,
      role: 'Victim / Complainant',
      action: 'VICTIM_ACCOUNT_REGISTERED',
      targetCase: newUser.id,
      details: `New pseudonymized registered victim account created under DPDP Act 2023 compliance.`,
      severity: 'info'
    });

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.username,
        role: newUser.role,
        accountType: newUser.accountType
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Registration error: ' + (err?.message || 'Unknown') }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
