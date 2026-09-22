import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { generateSalt, hashPassword } from './auth';

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = join(dataDir, 'sahay.db');
  const db = new DatabaseSync(dbPath);

  // Enable WAL mode and pragmas for high reliability and speed
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  initSchema(db);
  seedInitialData(db);

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

  // 6. Audit Logs Table (DPDP Act 2023 Compliant)
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
}

function seedInitialData(db: DatabaseSync): void {
  // Check if counsellors already seeded
  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM counsellors');
  const result = checkStmt.get() as { count: number };
  if (result && result.count > 0) {
    return;
  }

  const now = new Date().toISOString();

  // 1. Seed the 4 Counsellors
  const counsellors = [
    {
      id: 'COUNS-01',
      official_id: 'riya',
      name: 'Riya',
      password: 'Riya@2026',
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
      password: 'Divya@2026',
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
      password: 'Ayush@2026',
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
      password: 'Prashant@2026',
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
    const hash = hashPassword(c.password, salt);
    insertUser.run(c.id, c.official_id, hash, salt, c.role, 'counsellor', now);
    insertCounsellor.run(c.id, c.official_id, c.name, c.specialization, c.active_cases, c.available, c.email);
  }

  // Legacy demo alias for backwards compatibility
  const legacySalt = generateSalt();
  const legacyHash = hashPassword('SAHAY@2026', legacySalt);
  insertUser.run('USER-LEGACY', 'counsellor', legacyHash, legacySalt, 'Senior Counsellor', 'counsellor', now);

  // 2. Seed Authorities
  const authorities = [
    {
      id: 'AUTH-DIST',
      official_id: 'district_officer',
      name: 'District Authority',
      password: 'District@2026',
      tier: 'District Authority (MoSJE Officer)',
      jurisdiction: 'South Delhi District',
      escalation_level: 70
    },
    {
      id: 'AUTH-STATE',
      official_id: 'state_officer',
      name: 'State Authority Officer',
      password: 'State@2026',
      tier: 'State Authority Officer',
      jurisdiction: 'Delhi State Tier',
      escalation_level: 75
    },
    {
      id: 'AUTH-NAT',
      official_id: 'national_officer',
      name: 'National Policymaker',
      password: 'National@2026',
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
    const hash = hashPassword(a.password, salt);
    insertUser.run(a.id, a.official_id, hash, salt, a.tier, 'authority', now);
    insertAuthority.run(a.id, a.official_id, a.name, a.tier, a.jurisdiction, a.escalation_level);
  }

  // 3. Seed Initial Alerts mapped to Riya, Divya, Ayush, Prashant
  const insertAlert = db.prepare(`
    INSERT INTO alerts (
      id, case_id, victim_alias, district, risk_score, previous_score, change,
      severity, detected_factors_json, time, assigned_counsellor, authority_recipient, status, location_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      alt.victim_alias,
      alt.district,
      alt.risk_score,
      alt.previous_score,
      alt.change,
      alt.severity,
      JSON.stringify(alt.factors),
      alt.time,
      alt.assigned_counsellor,
      alt.authority_recipient,
      alt.status,
      alt.location ? JSON.stringify(alt.location) : null
    );
  }

  // 4. Seed Initial Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, timestamp, actor, role, action, target_case, details, severity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run(
    'LOG-1001',
    now.replace('T', ' ').slice(0, 19),
    'System Boot',
    'Platform Security',
    'INIT_SECURE_DATABASE',
    'SYSTEM',
    'SQLite secure database initialized with 4 counsellor profiles (Riya, Divya, Ayush, Prashant).',
    'info'
  );
  insertAudit.run(
    'LOG-1002',
    now.replace('T', ' ').slice(0, 19),
    'SAHAY AI Triage Engine',
    'Automated Decision Support',
    'AUTO_ASSIGN_COUNSELLOR',
    'SAHAY-1042',
    'Critical distress score 84/100 crossed threshold. Auto-assigned to Riya (Senior Trauma Specialist).',
    'warning'
  );
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

export function getAlertsForCounsellor(counsellorName: string): any[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM alerts 
    WHERE LOWER(assigned_counsellor) = LOWER(?) OR assigned_counsellor = 'On-call counsellor'
    ORDER BY id DESC
  `);
  const rows = stmt.all(counsellorName) as any[];
  return rows.map(r => ({
    ...r,
    detectedFactors: JSON.parse(r.detected_factors_json || '[]'),
    location: r.location_json ? JSON.parse(r.location_json) : undefined
  }));
}

export function getAllAlerts(): any[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM alerts ORDER BY id DESC');
  const rows = stmt.all() as any[];
  return rows.map(r => ({
    ...r,
    detectedFactors: JSON.parse(r.detected_factors_json || '[]'),
    location: r.location_json ? JSON.parse(r.location_json) : undefined
  }));
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
}): { assignedCounsellor: string; alertId?: string; checkinId: string } {
  const db = getDb();
  const now = new Date();
  const checkinId = `CHK-${Date.now().toString().slice(-6)}`;
  const assignedCounsellor = autoAssignCounsellor(params.predictedRiskScore, params.isAtrocityRelated);

  // 1. Insert into victim_checkins
  const insertCheckin = db.prepare(`
    INSERT INTO victim_checkins (
      id, victim_alias, user_id, timestamp, message, mood, mood_score,
      predicted_risk_score, risk_level, is_atrocity_related, neuro_stress,
      trust_withdrawal, existential_trauma, location_label, current_location_shared,
      trusted_contact_name, trusted_contact_phone, assigned_counsellor
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCheckin.run(
    checkinId,
    params.victimAlias,
    params.userId || null,
    now.toLocaleString(),
    params.message,
    params.mood,
    params.moodScore,
    params.predictedRiskScore,
    params.riskLevel,
    params.isAtrocityRelated ? 1 : 0,
    params.neuroStress || null,
    params.trustWithdrawal || null,
    params.existentialTrauma || null,
    params.locationLabel || null,
    params.currentLocationShared ? 1 : 0,
    params.trustedContactName || null,
    params.trustedContactPhone || null,
    assignedCounsellor
  );

  // 2. If risk score >= 50 or atrocity related, create alert for assigned counsellor
  let alertId: string | undefined;
  if (params.predictedRiskScore >= 50 || params.isAtrocityRelated) {
    alertId = `LIVE-${Date.now().toString().slice(-5)}`;
    const authorityRecipient = params.predictedRiskScore >= 90
      ? 'National Policymaker (MoSJE Delhi)'
      : params.predictedRiskScore >= 75
      ? 'State Authority Officer'
      : 'District Authority (MoSJE Officer)';

    const detectedFactors = [];
    if (params.isAtrocityRelated) detectedFactors.push('PoA Act Atrocity Screening Positive');
    if (params.neuroStress && params.neuroStress !== 'Low') detectedFactors.push(`Neurobiological stress: ${params.neuroStress}`);
    if (params.trustWithdrawal && params.trustWithdrawal !== 'Intact') detectedFactors.push(`Interpersonal trust: ${params.trustWithdrawal}`);
    if (params.existentialTrauma && params.existentialTrauma !== 'Resilient') detectedFactors.push(`Existential trauma: ${params.existentialTrauma}`);
    if (params.predictedRiskScore >= 75) detectedFactors.push('Distress threshold crossed (Critical)');

    const insertAlert = db.prepare(`
      INSERT INTO alerts (
        id, case_id, victim_alias, district, risk_score, previous_score, change,
        severity, detected_factors_json, time, assigned_counsellor, authority_recipient, status, location_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAlert.run(
      alertId,
      `SAHAY-LIVE-${checkinId.slice(-4)}`,
      params.victimAlias,
      params.locationLabel || 'Location undisclosed',
      params.predictedRiskScore,
      0,
      params.predictedRiskScore,
      params.predictedRiskScore >= 75 ? 'Critical' : 'High',
      JSON.stringify(detectedFactors),
      'Just now',
      assignedCounsellor,
      authorityRecipient,
      'Open',
      params.locationCoords ? JSON.stringify(params.locationCoords) : null
    );

    // Add Audit Log
    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (id, timestamp, actor, role, action, target_case, details, severity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAudit.run(
      `LOG-${Date.now().toString().slice(-4)}`,
      now.toISOString().replace('T', ' ').slice(0, 19),
      'SAHAY AI Triage',
      'Automated Assignment',
      'AUTO_ASSIGN_COUNSELLOR',
      alertId,
      `Victim distress score ${params.predictedRiskScore}/100. Assigned to counsellor ${assignedCounsellor}. Escalated to ${authorityRecipient}.`,
      params.predictedRiskScore >= 75 ? 'critical' : 'warning'
    );
  }

  return { assignedCounsellor, alertId, checkinId };
}

export function getAllAuditLogs(): any[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100');
  return stmt.all() as any[];
}

export function addAuditLogEntry(entry: {
  actor: string;
  role: string;
  action: string;
  targetCase: string;
  details: string;
  severity?: string;
  ipHash?: string;
}): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO audit_logs (id, timestamp, actor, role, action, target_case, details, ip_hash, severity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    `LOG-${Date.now().toString().slice(-5)}`,
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

export function getUserByUsername(username: string): any {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE');
  return stmt.get(username);
}

export function createVictimAccount(username: string, passwordHash: string, salt: string): any {
  const db = getDb();
  const id = `VIC-${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO users (id, username, password_hash, salt, role, account_type, created_at)
    VALUES (?, ?, ?, ?, 'Victim / Complainant', 'registered_victim', ?)
  `);
  stmt.run(id, username, passwordHash, salt, now);
  return { id, username, role: 'Victim / Complainant', accountType: 'registered_victim' };
}
