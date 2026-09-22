import type { APIRoute } from 'astro';
import { getUserByUsername, addAuditLogEntry } from '../../../lib/db';
import { verifyPassword } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const requestedRole = typeof body.role === 'string' ? body.role : '';

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username and password are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = getUserByUsername(username);
    if (!user) {
      addAuditLogEntry({
        actor: username,
        role: requestedRole || 'Unknown',
        action: 'STAFF_LOGIN_FAILED',
        targetCase: 'AUTH',
        details: `Failed login attempt: username "${username}" not found.`,
        severity: 'warning'
      });

      return new Response(JSON.stringify({ error: 'Invalid credentials. User not found.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isMatch = verifyPassword(password, user.password_hash, user.salt);
    if (!isMatch) {
      addAuditLogEntry({
        actor: username,
        role: user.role,
        action: 'STAFF_LOGIN_FAILED',
        targetCase: 'AUTH',
        details: `Failed login attempt for user "${username}": incorrect password.`,
        severity: 'warning'
      });

      return new Response(JSON.stringify({ error: 'Invalid credentials. Incorrect password.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Capitalize display name for counsellors (e.g. riya -> Riya)
    const displayName = username.charAt(0).toUpperCase() + username.slice(1);

    addAuditLogEntry({
      actor: displayName,
      role: user.role,
      action: 'STAFF_LOGIN_SUCCESS',
      targetCase: 'AUTH',
      details: `Successful authenticated login for ${user.role} (${displayName}).`,
      severity: 'info'
    });

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: displayName,
        role: user.role,
        accountType: user.account_type
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Authentication internal error: ' + (err?.message || 'Unknown') }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
