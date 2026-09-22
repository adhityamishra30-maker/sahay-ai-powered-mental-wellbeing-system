import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto';

/**
 * Reads a server-side environment variable at runtime.
 * process.env is checked first so values set on the host (Railway, Docker)
 * are picked up without rebuilding; import.meta.env covers local .env files in dev.
 */
export function readEnv(name: string): string | undefined {
  const runtimeValue = process.env[name];
  if (runtimeValue) return runtimeValue;
  const buildValue = (import.meta.env as Record<string, string | undefined>)[name];
  return buildValue || undefined;
}

export const IS_PRODUCTION = import.meta.env.PROD;

// ----------------------------------------------------------------------------
// Field-level encryption at rest (AES-256-GCM)
// ----------------------------------------------------------------------------

const ENCRYPTED_PREFIX = 'enc:v1:';
const DEV_FALLBACK_SECRET = 'sahay-local-development-only-key';
let cachedKey: Buffer | null = null;

function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey;

  const configured = readEnv('DATA_ENCRYPTION_KEY');
  if (!configured) {
    if (IS_PRODUCTION) {
      throw new Error(
        'DATA_ENCRYPTION_KEY is not set. Generate one with `node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"` and add it to the server environment.'
      );
    }
    console.warn('[SAHAY] DATA_ENCRYPTION_KEY not set; using a development-only key. Do not use this database in production.');
  }

  const secret = configured || DEV_FALLBACK_SECRET;
  cachedKey = /^[0-9a-f]{64}$/i.test(secret)
    ? Buffer.from(secret, 'hex')
    : createHash('sha256').update(secret).digest();
  return cachedKey;
}

/** Encrypts a sensitive value before it is written to SQLite. */
export function encryptField(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENCRYPTED_PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}

/** Decrypts a value read from SQLite. Rows written before encryption was enabled are returned as-is. */
export function decryptField(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (!value.startsWith(ENCRYPTED_PREFIX)) return value;
  try {
    const [ivB64, tagB64, dataB64] = value.slice(ENCRYPTED_PREFIX.length).split(':');
    const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    return '[unreadable: encryption key mismatch]';
  }
}

// ----------------------------------------------------------------------------
// Hashing helpers
// ----------------------------------------------------------------------------

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Keyed hash of the client IP so audit entries can be correlated without storing raw IPs. */
export function hashIp(ip: string | undefined): string | undefined {
  if (!ip) return undefined;
  return createHmac('sha256', getEncryptionKey()).update(ip).digest('hex').slice(0, 16);
}

export function randomId(prefix: string): string {
  return `${prefix}-${randomBytes(5).toString('hex').toUpperCase()}`;
}

export function randomToken(): string {
  return randomBytes(32).toString('base64url');
}

// ----------------------------------------------------------------------------
// Request helpers
// ----------------------------------------------------------------------------

/** Best-effort client IP. Behind Railway/Caddy the proxy sets X-Forwarded-For / X-Real-IP. */
export function getClientIp(context: { request: Request; clientAddress?: string }): string | undefined {
  const realIp = context.request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const forwarded = context.request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  try {
    // Astro's clientAddress getter throws when the adapter cannot determine it.
    return context.clientAddress;
  } catch {
    return undefined;
  }
}

export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers }
  });
}

/** Trims and caps free-text input so oversized payloads never reach storage or the AI provider. */
export function cleanText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

// ----------------------------------------------------------------------------
// In-memory fixed-window rate limiter (single instance deployments)
// ----------------------------------------------------------------------------

const buckets = new Map<string, { count: number; resetAt: number }>();

/** Returns true when the key has exceeded `limit` hits within `windowMs`. Each call counts as one hit. */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10000) pruneBuckets(now);
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

/** Checks a key without counting a hit (used to block logins after repeated failures). */
export function isBlocked(key: string, limit: number): boolean {
  const bucket = buckets.get(key);
  return Boolean(bucket && bucket.resetAt > Date.now() && bucket.count >= limit);
}

export function clearRateLimit(key: string): void {
  buckets.delete(key);
}

function pruneBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
