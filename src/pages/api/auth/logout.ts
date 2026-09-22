import type { APIRoute } from 'astro';
import { destroySession } from '../../../lib/session';
import { jsonResponse } from '../../../lib/security';

export const POST: APIRoute = async ({ cookies }) => {
  destroySession(cookies);
  return jsonResponse({ success: true });
};
