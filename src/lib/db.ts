import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { generateSalt, hashPassword, verifyPassword } from './auth';
import { IS_PRODUCTION, decryptField, encryptField, randomId, readEnv, sha256 } from './security';

let dbInstance: DatabaseSync | null = null;
let lastPurgeAt = 0;
const PURGE_INTERVAL_MS = 60 * 60 * 1000;

/** Check-ins and alerts older than this are deleted automatically. */
export const RETENTION_DAYS = positiveNumber(readEnv('RETENTION_DAYS'), 180);
/** Audit entries are kept longer so access can still be reviewed after case data is purged. */
export const AUDIT_RETENTION_DAYS = positiveNumber(readEnv('AUDIT_RETENTION_DAYS'), 365);

function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Where sahay.db lives. On Railway, attach a Volume and mount it at /app/data
 * (the default below), or set DATA_DIR to the mount path.
 */
function resolveDataDir(): string {
  return readEnv('DATA_DIR') || readEnv('RAILWAY_VOLUME_MOUNT_PATH') || join(process.cwd(), 'data');
}

export function getDb(): DatabaseSync {
  if (dbInstance) {
    if (Date.now() - lastPurgeAt > PURGE_INTERVAL_MS) purgeExpiredData(dbInstance);
    return dbInstance;
  }

  const dataDir = resolveDataDir();
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = join(dataDir, 'sahay.db');
  const db = new DatabaseSync(dbPath);

  // Enable WAL mode and pragmas for high reliability and speed
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  initSchema(db);
  migrateSchema(db);
  seedInitialData(db);
  syncStaffPasswordsFromEnv(db);
  encryptLegacyRows(db);
  purgeExpiredData(db);

  dbInstance = db;
  return dbInstance;
}

function initSchema(db: DatabaseSync): void {
  // 1. Users Table (Authentication)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL,
      account_type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_login TEXT
    );
  `);

  // 2. Counsellors Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS counsellors (
      id TEXT PRIMARY KEY,
      official_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      specialization TEXT NOT NULL,
      active_cases INTEGER NOT NULL DEFAULT 0,
      available INTEGER NOT NULL DEFAULT 1,
      contact_email TEXT
    );
  `);

  // 3. Authorities Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS authorities (
      id TEXT PRIMARY KEY,
      official_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      tier TEXT NOT NULL,
      jurisdiction TEXT NOT NULL,
      escalation_level INTEGER NOT NULL DEFAULT 70
    );
  `);

  // 4. Victim Checkins Table
  // victim_alias, message, location_label and trusted_contact_* are AES-256-GCM encrypted.
  db.exec(`
    CREATE TABLE IF NOT EXISTS victim_checkins (
      id TEXT PRIMARY KEY,
      victim_alias TEXT NOT NULL,
      user_id TEXT,
      timestamp TEXT NOT NULL,
      message TEXT,
      mood TEXT NOT NULL,
      mood_score INTEGER NOT NULL DEFAULT 0,
      predicted_risk_score INTEGER NOT NULL DEFAULT 0,
      risk_level TEXT NOT NULL,
      is_atrocity_related INTEGER NOT NULL DEFAULT 0,
      neuro_stress TEXT,
      trust_withdrawal TEXT,
      existential_trauma TEXT,
      location_label TEXT,
      current_location_shared INTEGER NOT NULL DEFAULT 0,
      trusted_contact_name TEXT,
      trusted_contact_phone TEXT,
      assigned_counsellor TEXT NOT NULL
    );
  `);

  // 5. Alerts Table
  // victim_alias, district and location_json are AES-256-GCM encrypted.
  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      victim_alias TEXT NOT NULL,
      district TEXT NOT NULL,
      risk_score INTEGER NOT NULL,
      previous_score INTEGER NOT NULL DEFAULT 0,
      change INTEGER NOT NULL DEFAULT 0,
      severity TEXT NOT NULL,
      detected_factors_json TEXT NOT NULL DEFAULT '[]',
      time TEXT NOT NULL,
      assigned_counsellor TEXT NOT NULL,
      authority_recipient TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Open',
      location_json TEXT
    );
  `);

  // 6. Audit Logs Table (append-only from the application; no update/delete routes)
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      actor TEXT NOT NULL,
      role TEXT NOT NULL,
      action TEXT NOT NULL,
      target_case TEXT NOT NULL,
      details TEXT NOT NULL,
      ip_hash TEXT,
      severity TEXT NOT NULL DEFAULT 'info'
    );
  `);

  // 7. Server sessions (only the SHA-256 of the cookie token is stored)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_type TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
  `);
}

function ensureColumn(db: DatabaseSync, table: string, column: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as unknown as Array<{ name: string }>;
  if (!columns.some(col => col.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

/** Adds columns introduced after the first release so existing databases keep working. */
function migrateSchema(db: DatabaseSync): void {
  const now = new Date().toISOString();

  ensureColumn(db, 'victim_checkins', 'created_at', 'TEXT');
  ensureColumn(db, 'victim_checkins', 'delete_token_hash', 'TEXT');
  ensureColumn(db, 'victim_checkins', 'alert_id', 'TEXT');
  ensureColumn(db, 'alerts', 'created_at', 'TEXT');

  db.prepare('UPDATE victim_checkins SET created_at = ? WHERE created_at IS NULL').run(now);
  db.prepare('UPDATE alerts SET created_at = ? WHERE created_at IS NULL').run(now);

  // The shared legacy "counsellor" login had a password published in the repo.
  db.prepare("DELETE FROM users WHERE id = 'USER-LEGACY'").run();
}

// ----------------------------------------------------------------------------
// Seeding
// ----------------------------------------------------------------------------

interface StaffSeed {
  id: string;
  username: string;
  /** Used only in local development when SEED_PASSWORD_<USERNAME> is not set. */
  devPassword: string;
}

const STAFF_SEEDS: StaffSeed[] = [
  { id: 'COUNS-01', username: 'riya', devPassword: 'Riya@2026' },
  { id: 'COUNS-02', username: 'divya', devPassword: 'Divya@2026' },
  { id: 'COUNS-03', username: 'ayush', devPassword: 'Ayush@2026' },
  { id: 'COUNS-04', username: 'prashant', devPassword: 'Prashant@2026' },
  { id: 'AUTH-DIST', username: 'district_officer', devPassword: 'District@2026' },
  { id: 'AUTH-STATE', username: 'state_officer', devPassword: 'State@2026' },
  { id: 'AUTH-NAT', username: 'national_officer', devPassword: 'National@2026' }
];

function seedPasswordEnvName(username: string): string {
  return `SEED_PASSWORD_${username.toUpperCase()}`;
}

/**
 * Staff passwords come from SEED_PASSWORD_<USERNAME>. In production, a missing
 * variable produces a random password that is printed once to the server log.
 */
function resolveSeedPassword(seed: StaffSeed): string {
  const envName = seedPasswordEnvName(seed.username);
  const configured = readEnv(envName);
  if (configured) return configured;
  if (!IS_PRODUCTION) return seed.devPassword;

  const generated = randomBytes(12).toString('base64url');
  console.warn(`[SAHAY] ${envName} is not set. Generated initial password for "${seed.username}": ${generated}`);
  console.warn(`[SAHAY] Save it now, or set ${envName} and restart to choose your own.`);
  return generated;
}

/** Lets operators rotate staff passwords by changing SEED_PASSWORD_<USERNAME> and restarting. */
function syncStaffPasswordsFromEnv(db: DatabaseSync): void {
  const getUser = db.prepare('SELECT password_hash, salt FROM users WHERE id = ?');
  const updateUser = db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?');

  for (const seed of STAFF_SEEDS) {
    const configured = readEnv(seedPasswordEnvName(seed.username));
    if (!configured) continue;
    const user = getUser.get(seed.id) as { password_hash: string; salt: string } | undefined;
    if (!user || verifyPassword(configured, user.password_hash, user.salt)) continue;
    const salt = generateSalt();
    updateUser.run(hashPassword(configured, salt), salt, seed.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(seed.id);
  }
}

function seedInitialData(db: DatabaseSync): void {
  // Check if counsellors already seeded
  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM counsellors');
  const result = checkStmt.get() as { count: number };
  if (result && result.count > 0) {
    return;
  }

  const now = new Date().toISOString();
  const seedById = new Map(STAFF_SEEDS.map(seed => [seed.id, seed]));

  // 1. Seed the 4 Counsellors
  const counsellors = [
    {
      id: 'COUNS-01',
      official_id: 'riya',
      name: 'Riya',
      role: 'Senior Trauma Specialist',
      specialization: 'Senior Trauma Specialist (High-risk & crisis escalation)',
      active_cases: 2,
      available: 1,
      email: 'riya.trauma@sahay.gov.in'
    },
    {
      id: 'COUNS-02',
      official_id: 'divya',
      name: 'Divya',
      role: 'Clinical Well-being Counsellor',
      specialization: 'Clinical Well-being Counsellor (Emotional recovery)',
      active_cases: 1,
      available: 1,
      email: 'divya.counsellor@sahay.gov.in'
    },
    {
      id: 'COUNS-03',
      official_id: 'ayush',
      name: 'Ayush',
      role: 'Case Manager',
      specialization: 'Case Manager (Rehabilitation & institutional follow-up)',
      active_cases: 3,
      available: 1,
      email: 'ayush.cases@sahay.gov.in'
    },
    {
      id: 'COUNS-04',
      official_id: 'prashant',
      name: 'Prashant',
      role: 'District Response Counsellor',
      specialization: 'District Response Counsellor (Field & immediate safety)',
      active_cases: 2,
      available: 1,
      email: 'prashant.field@sahay.gov.in'
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, salt, role, account_type, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCounsellor = db.prepare(`
    INSERT INTO counsellors (id, official_id, name, specialization, active_cases, available, contact_email)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of counsellors) {
    const salt = generateSalt();
    const hash = hashPassword(resolveSeedPassword(seedById.get(c.id)!), salt);
    insertUser.run(c.id, c.official_id, hash, salt, c.role, 'counsellor', now);
    insertCounsellor.run(c.id, c.official_id, c.name, c.specialization, c.active_cases, c.available, c.email);
  }

  // 2. Seed Authorities
  const authorities = [
    {
      id: 'AUTH-DIST',
      official_id: 'district_officer',
      name: 'District Authority',
      tier: 'District Authority (MoSJE Officer)',
      jurisdiction: 'South Delhi District',
      escalation_level: 50
    },
    {
      id: 'AUTH-STATE',
      official_id: 'state_officer',
      name: 'State Authority Officer',
      tier: 'State Authority Officer',
      jurisdiction: 'Delhi State Tier',
      escalation_level: 75
    },
    {
      id: 'AUTH-NAT',
      official_id: 'national_officer',
      name: 'National Policymaker',
      tier: 'National Policymaker (MoSJE Delhi)',
      jurisdiction: 'National MoSJE Headquarters',
      escalation_level: 90
    }
  ];

  const insertAuthority = db.prepare(`
    INSERT INTO authorities (id, official_id, name, tier, jurisdiction, escalation_level)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const a of authorities) {
    const salt = generateSalt();
    const hash = hashPassword(resolveSeedPassword(seedById.get(a.id)!), salt);
    insertUser.run(a.id, a.official_id, hash, salt, a.tier, 'authority', now);
    insertAuthority.run(a.id, a.official_id, a.name, a.tier, a.jurisdiction, a.escalation_level);
  }

  // 3. Seed demo alerts (fictional) mapped to Riya, Divya, Ayush, Prashant
  const insertAlert = db.prepare(`
    INSERT INTO alerts (
      id, case_id, victim_alias, district, risk_score, previous_score, change,
      severity, detected_factors_json, time, assigned_counsellor, authority_recipient, status, location_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialAlerts = [
    {
      id: 'ALT-101',
      case_id: 'SAHAY-1042',
      victim_alias: 'Survivor Sunita',
      district: 'South Delhi',
      risk_score: 84,
      previous_score: 72,
      change: 12,
      severity: 'Critical',
      factors: ['Sleep disturbance > 3 days', 'Severe hypervigilance', 'Fear of social retaliation'],
      time: '12 min ago',
      assigned_counsellor: 'Riya',
      authority_recipient: 'State Authority Officer',
      status: 'Open',
      location: { latitude: 28.5355, longitude: 77.2410, accuracy: 15 }
    },
    {
      id: 'ALT-102',
      case_id: 'SAHAY-1088',
      victim_alias: 'Complainant Meena',
      district: 'Jaipur Rural',
      risk_score: 78,
      previous_score: 65,
      change: 13,
      severity: 'Critical',
      factors: ['Threat of eviction post-FIR', 'Acute anxiety markers'],
      time: '34 min ago',
      assigned_counsellor: 'Divya',
      authority_recipient: 'State Authority Officer',
      status: 'Open',
      location: { latitude: 26.9124, longitude: 75.7873, accuracy: 25 }
    },
    {
      id: 'ALT-103',
      case_id: 'SAHAY-1104',
      victim_alias: 'Survivor Ramesh',
      district: 'Patna Urban',
      risk_score: 68,
      previous_score: 55,
      change: 13,
      severity: 'High',
      factors: ['Compensation relief delayed > 60 days', 'Economic distress'],
      time: '1 hour ago',
      assigned_counsellor: 'Ayush',
      authority_recipient: 'District Authority (MoSJE Officer)',
      status: 'Acknowledged'
    },
    {
      id: 'ALT-104',
      case_id: 'SAHAY-1120',
      victim_alias: 'Survivor Kavita',
      district: 'Ahmedabad East',
      risk_score: 74,
      previous_score: 62,
      change: 12,
      severity: 'High',
      factors: ['Witness intimidation report', 'Somatic panic symptoms'],
      time: '2 hours ago',
      assigned_counsellor: 'Prashant',
      authority_recipient: 'District Authority (MoSJE Officer)',
      status: 'Open',
      location: { latitude: 23.0225, longitude: 72.5714, accuracy: 18 }
    }
  ];

  for (const alt of initialAlerts) {
    insertAlert.run(
      alt.id,
      alt.case_id,
      encryptField(alt.victim_alias),
      encryptField(alt.district),
      alt.risk_score,
      alt.previous_score,
      alt.change,
      alt.severity,
      JSON.stringify(alt.factors),
      alt.time,
      alt.assigned_counsellor,
      alt.authority_recipient,
      alt.status,
      alt.location ? encryptField(JSON.stringify(alt.location)) : null,
      now
    );
  }

  // 4. Seed Initial Audit Logs
  addAuditLogEntryWith(db, {
    actor: 'System Boot',
    role: 'Platform Security',
    action: 'INIT_DATABASE',
    targetCase: 'SYSTEM',
    details: 'SQLite database initialized with 4 counsellor and 3 authority accounts.'
  });
}

/** Encrypts sensitive columns in rows written before field encryption existed. */
function encryptLegacyRows(db: DatabaseSync): void {
  const plainCheckins = db.prepare(`
    SELECT id, victim_alias, message, location_label, trusted_contact_name, trusted_contact_phone
    FROM victim_checkins WHERE victim_alias NOT LIKE 'enc:v1:%'
  `).all() as any[];
  const updateCheckin = db.prepare(`
    UPDATE victim_checkins
    SET victim_alias = ?, message = ?, location_label = ?, trusted_contact_name = ?, trusted_contact_phone = ?
    WHERE id = ?
  `);
  for (const row of plainCheckins) {
    updateCheckin.run(
      encryptField(row.victim_alias) ?? '',
      encryptField(row.message),
      encryptField(row.location_label),
      encryptField(row.trusted_contact_name),
      encryptField(row.trusted_contact_phone),
      row.id
    );
  }

  const plainAlerts = db.prepare(`
    SELECT id, victim_alias, district, location_json FROM alerts WHERE victim_alias NOT LIKE 'enc:v1:%'
  `).all() as any[];
  const updateAlert = db.prepare('UPDATE alerts SET victim_alias = ?, district = ?, location_json = ? WHERE id = ?');
  for (const row of plainAlerts) {
    updateAlert.run(
      encryptField(row.victim_alias) ?? '',
      encryptField(row.district) ?? '',
      encryptField(row.location_json),
      row.id
    );
  }
}

/** Deletes data past its retention period and expired sessions. */
function purgeExpiredData(db: DatabaseSync): void {
  lastPurgeAt = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const caseCutoff = new Date(Date.now() - RETENTION_DAYS * dayMs).toISOString();
  const auditCutoff = new Date(Date.now() - AUDIT_RETENTION_DAYS * dayMs).toISOString().replace('T', ' ').slice(0, 19);

  db.prepare('DELETE FROM victim_checkins WHERE created_at < ?').run(caseCutoff);
  db.prepare('DELETE FROM alerts WHERE created_at < ?').run(caseCutoff);
  db.prepare('DELETE FROM audit_logs WHERE timestamp < ?').run(auditCutoff);
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString());
}

// ----------------------------------------------------------------------------
// Public Database Helper Functions
// ----------------------------------------------------------------------------

export interface CounsellorRecord {
  id: string;
  official_id: string;
  name: string;
  specialization: string;
  active_cases: number;
  available: number;
  contact_email: string;
}

export function getAllCounsellors(): CounsellorRecord[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM counsellors ORDER BY active_cases ASC');
  return stmt.all() as unknown as CounsellorRecord[];
}

/**
 * Automatically assigns a counsellor among Riya, Divya, Ayush, and Prashant.
 * - Atrocity cases or critical risk scores (>= 75) prioritize Riya or Divya (Trauma Specialists).
 * - General or moderate risk loads balance to Ayush or Prashant.
 */
export function autoAssignCounsellor(riskScore: number, isAtrocityRelated: boolean): string {
  const db = getDb();

  let query = 'SELECT name, active_cases FROM counsellors WHERE available = 1';
  if (riskScore >= 75 || isAtrocityRelated) {
    query += " AND name IN ('Riya', 'Divya') ORDER BY active_cases ASC LIMIT 1";
  } else {
    query += " ORDER BY active_cases ASC LIMIT 1";
  }

  let stmt = db.prepare(query);
  let selected = stmt.get() as { name: string; active_cases: number } | undefined;

  if (!selected) {
    // Fallback if priority counsellors are unavailable
    const fallbackStmt = db.prepare('SELECT name FROM counsellors WHERE available = 1 ORDER BY active_cases ASC LIMIT 1');
    selected = fallbackStmt.get() as { name: string; active_cases: number } | undefined;
  }

  const assignedName = selected ? selected.name : 'Riya';

  // Increment active case count for the assigned counsellor
  const updateStmt = db.prepare('UPDATE counsellors SET active_cases = active_cases + 1 WHERE name = ?');
  updateStmt.run(assignedName);

  return assignedName;
}

function mapAlertRow(r: any) {
  const locationJson = decryptField(r.location_json);
  let location: unknown;
  try {
    location = locationJson ? JSON.parse(locationJson) : undefined;
  } catch {
    location = undefined;
  }
  return {
    id: r.id,
    case_id: r.case_id,
    victim_alias: decryptField(r.victim_alias),
    district: decryptField(r.district),
    risk_score: r.risk_score,
    previous_score: r.previous_score,
    change: r.change,
    severity: r.severity,
    time: r.time,
    assigned_counsellor: r.assigned_counsellor,
    authority_recipient: r.authority_recipient,
    status: r.status,
    created_at: r.created_at,
    detectedFactors: JSON.parse(r.detected_factors_json || '[]'),
    location
  };
}

/**
 * Alerts for one counsellor. Only the assigned counsellor also receives the
 * check-in message and trusted contact; authorities never do (see getAllAlerts).
 */
export function getAlertsForCounsellor(counsellorName: string): any[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT a.*, c.message AS checkin_message, c.trusted_contact_name, c.trusted_contact_phone
    FROM alerts a
    LEFT JOIN victim_checkins c ON c.alert_id = a.id
    WHERE LOWER(a.assigned_counsellor) = LOWER(?) OR a.assigned_counsellor = 'On-call counsellor'
    ORDER BY a.created_at DESC
  `);
  return (stmt.all(counsellorName) as any[]).map(row => ({
    ...mapAlertRow(row),
    checkinMessage: decryptField(row.checkin_message),
    trustedContactName: decryptField(row.trusted_contact_name),
    trustedContactPhone: decryptField(row.trusted_contact_phone)
  }));
}

export function getAllAlerts(): any[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM alerts ORDER BY created_at DESC');
  return (stmt.all() as any[]).map(mapAlertRow);
}

/** Authority tier that receives an escalated alert. Alerts are created at risk >= 50 or on atrocity screening. */
export function getEscalationRecipient(riskScore: number): string {
  return riskScore >= 90
    ? 'National Policymaker (MoSJE Delhi)'
    : riskScore >= 75
    ? 'State Authority Officer'
    : 'District Authority (MoSJE Officer)';
}

export function addCheckinAndAlert(params: {
  victimAlias: string;
  userId?: string;
  message: string;
  mood: string;
  moodScore: number;
  predictedRiskScore: number;
  riskLevel: string;
  isAtrocityRelated: boolean;
  neuroStress?: string;
  trustWithdrawal?: string;
  existentialTrauma?: string;
  locationLabel?: string;
  currentLocationShared: boolean;
  trustedContactName?: string;
  trustedContactPhone?: string;
  locationCoords?: { latitude: number; longitude: number; accuracy: number };
  ipHash?: string;
}): { assignedCounsellor: string; alertId?: string; checkinId: string; deleteToken: string } {
  const db = getDb();
  const now = new Date();
  const checkinId = randomId('CHK');
  const deleteToken = randomBytes(24).toString('base64url');
  const assignedCounsellor = autoAssignCounsellor(params.predictedRiskScore, params.isAtrocityRelated);

  // 2. If risk score >= 50 or atrocity related, create alert for assigned counsellor
  let alertId: string | undefined;
  if (params.predictedRiskScore >= 50 || params.isAtrocityRelated) {
    alertId = randomId('LIVE');
    const authorityRecipient = getEscalationRecipient(params.predictedRiskScore);

    const detectedFactors = [];
    if (params.isAtrocityRelated) detectedFactors.push('PoA Act Atrocity Screening Positive');
    if (params.neuroStress && params.neuroStress !== 'None') detectedFactors.push(`Neurobiological stress: ${params.neuroStress}`);
    if (params.trustWithdrawal && params.trustWithdrawal !== 'None') detectedFactors.push(`Interpersonal trust: ${params.trustWithdrawal}`);
    if (params.existentialTrauma && params.existentialTrauma !== 'None') detectedFactors.push(`Existential trauma: ${params.existentialTrauma}`);
    if (params.predictedRiskScore >= 75) detectedFactors.push('Distress threshold crossed (Critical)');

    const insertAlert = db.prepare(`
      INSERT INTO alerts (
        id, case_id, victim_alias, district, risk_score, previous_score, change,
        severity, detected_factors_json, time, assigned_counsellor, authority_recipient, status, location_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAlert.run(
      alertId,
      `SAHAY-${checkinId}`,
      encryptField(params.victimAlias) ?? '',
      encryptField(params.locationLabel || 'Location undisclosed') ?? '',
      params.predictedRiskScore,
      0,
      params.predictedRiskScore,
      params.predictedRiskScore >= 75 ? 'Critical' : 'High',
      JSON.stringify(detectedFactors),
      'Just now',
      assignedCounsellor,
      authorityRecipient,
      'Open',
      params.locationCoords ? encryptField(JSON.stringify(params.locationCoords)) : null,
      now.toISOString()
    );

    addAuditLogEntryWith(db, {
      actor: 'SAHAY AI Triage',
      role: 'Automated Assignment',
      action: 'AUTO_ASSIGN_COUNSELLOR',
      targetCase: alertId,
      details: `Distress score ${params.predictedRiskScore}/100. Assigned to counsellor ${assignedCounsellor}. Escalated to ${authorityRecipient}.`,
      severity: params.predictedRiskScore >= 75 ? 'critical' : 'warning',
      ipHash: params.ipHash
    });
  }

  // 1. Insert into victim_checkins
  const insertCheckin = db.prepare(`
    INSERT INTO victim_checkins (
      id, victim_alias, user_id, timestamp, message, mood, mood_score,
      predicted_risk_score, risk_level, is_atrocity_related, neuro_stress,
      trust_withdrawal, existential_trauma, location_label, current_location_shared,
      trusted_contact_name, trusted_contact_phone, assigned_counsellor,
      created_at, delete_token_hash, alert_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCheckin.run(
    checkinId,
    encryptField(params.victimAlias) ?? '',
    params.userId || null,
    now.toLocaleString(),
    encryptField(params.message),
    params.mood,
    params.moodScore,
    params.predictedRiskScore,
    params.riskLevel,
    params.isAtrocityRelated ? 1 : 0,
    params.neuroStress || null,
    params.trustWithdrawal || null,
    params.existentialTrauma || null,
    encryptField(params.locationLabel),
    params.currentLocationShared ? 1 : 0,
    encryptField(params.trustedContactName),
    encryptField(params.trustedContactPhone),
    assignedCounsellor,
    now.toISOString(),
    sha256(deleteToken),
    alertId || null
  );

  return { assignedCounsellor, alertId, checkinId, deleteToken };
}

function deleteCheckinRow(db: DatabaseSync, row: { id: string; alert_id: string | null; assigned_counsellor: string }): void {
  if (row.alert_id) db.prepare('DELETE FROM alerts WHERE id = ?').run(row.alert_id);
  db.prepare('DELETE FROM victim_checkins WHERE id = ?').run(row.id);
  db.prepare('UPDATE counsellors SET active_cases = MAX(active_cases - 1, 0) WHERE name = ?').run(row.assigned_counsellor);
}

/**
 * Deletes one check-in (and its alert) when the caller proves ownership, either
 * with the one-time deletion token returned at submission or a matching user id.
 */
export function deleteCheckin(checkinId: string, proof: { deleteToken?: string; userId?: string }): boolean {
  const db = getDb();
  const row = db.prepare('SELECT id, alert_id, assigned_counsellor, delete_token_hash, user_id FROM victim_checkins WHERE id = ?')
    .get(checkinId) as any;
  if (!row) return false;

  const tokenMatches = Boolean(proof.deleteToken && row.delete_token_hash && sha256(proof.deleteToken) === row.delete_token_hash);
  const ownerMatches = Boolean(proof.userId && row.user_id && proof.userId === row.user_id);
  if (!tokenMatches && !ownerMatches) return false;

  deleteCheckinRow(db, row);
  return true;
}

/** Deletes every check-in for a registered victim, and optionally the account itself. */
export function deleteVictimData(userId: string, deleteAccount: boolean): number {
  const db = getDb();
  const rows = db.prepare('SELECT id, alert_id, assigned_counsellor FROM victim_checkins WHERE user_id = ?').all(userId) as any[];
  for (const row of rows) deleteCheckinRow(db, row);
  if (deleteAccount) {
    db.prepare("DELETE FROM users WHERE id = ? AND account_type = 'registered_victim'").run(userId);
  }
  return rows.length;
}

export function getAllAuditLogs(): any[] {
  const db = getDb();
  const stmt = db.prepare('SELECT id, timestamp, actor, role, action, target_case, details, severity FROM audit_logs ORDER BY timestamp DESC LIMIT 200');
  return stmt.all() as any[];
}

interface AuditEntry {
  actor: string;
  role: string;
  action: string;
  targetCase: string;
  details: string;
  severity?: string;
  ipHash?: string;
}

function addAuditLogEntryWith(db: DatabaseSync, entry: AuditEntry): void {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (id, timestamp, actor, role, action, target_case, details, ip_hash, severity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    randomId('LOG'),
    new Date().toISOString().replace('T', ' ').slice(0, 19),
    entry.actor,
    entry.role,
    entry.action,
    entry.targetCase,
    entry.details,
    entry.ipHash || null,
    entry.severity || 'info'
  );
}

export function addAuditLogEntry(entry: AuditEntry): void {
  addAuditLogEntryWith(getDb(), entry);
}

export function getUserByUsername(username: string): any {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE');
  return stmt.get(username);
}

export function recordLogin(userId: string): void {
  getDb().prepare('UPDATE users SET last_login = ? WHERE id = ?').run(new Date().toISOString(), userId);
}

/** Human-facing name for a staff account (e.g. "Riya"), used to scope counsellor alerts. */
export function getStaffDisplayName(userId: string, accountType: string): string | undefined {
  const db = getDb();
  if (accountType === 'counsellor') {
    return (db.prepare('SELECT name FROM counsellors WHERE id = ?').get(userId) as { name: string } | undefined)?.name;
  }
  if (accountType === 'authority') {
    return (db.prepare('SELECT name FROM authorities WHERE id = ?').get(userId) as { name: string } | undefined)?.name;
  }
  return undefined;
}

export function createVictimAccount(username: string, passwordHash: string, salt: string): any {
  const db = getDb();
  const id = randomId('VIC');
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO users (id, username, password_hash, salt, role, account_type, created_at)
    VALUES (?, ?, ?, ?, 'Victim / Complainant', 'registered_victim', ?)
  `);
  stmt.run(id, username, passwordHash, salt, now);
  return { id, username, role: 'Victim / Complainant', accountType: 'registered_victim' };
}

// ----------------------------------------------------------------------------
// Sessions
// ----------------------------------------------------------------------------

export interface SessionRecord {
  userId: string;
  accountType: string;
  displayName: string;
  role: string;
  expiresAt: string;
}

export function insertSession(tokenHash: string, session: SessionRecord): void {
  getDb().prepare(`
    INSERT INTO sessions (token_hash, user_id, account_type, display_name, role, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(tokenHash, session.userId, session.accountType, session.displayName, session.role, new Date().toISOString(), session.expiresAt);
}

export function findSession(tokenHash: string): SessionRecord | undefined {
  const row = getDb().prepare(`
    SELECT user_id, account_type, display_name, role, expires_at FROM sessions WHERE token_hash = ? AND expires_at > ?
  `).get(tokenHash, new Date().toISOString()) as any;
  if (!row) return undefined;
  return { userId: row.user_id, accountType: row.account_type, displayName: row.display_name, role: row.role, expiresAt: row.expires_at };
}

export function deleteSession(tokenHash: string): void {
  getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
}
