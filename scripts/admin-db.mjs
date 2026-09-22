#!/usr/bin/env node
/**
 * SAHAY Developer-Only Database Administration Tool
 * 
 * Run this command from your terminal:
 *   npm run db:admin
 * 
 * Provides direct terminal inspection for:
 * 1. Counsellors (Riya, Divya, Ayush, Prashant)
 * 2. Victim Checkins & Emergency Contacts
 * 3. Escalated Alerts
 * 4. Security Audit Logs (DPDP Act)
 * 5. Registered User Credentials
 */

import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}
const dbPath = join(dataDir, 'sahay.db');

const db = new DatabaseSync(dbPath);

console.log('\n======================================================');
console.log('\x1b[36m🛡️  SAHAY SECURE DATABASE — DEVELOPER ADMIN TERMINAL\x1b[0m');
console.log('======================================================\n');

// 1. Counsellors
console.log('\x1b[32m--- 1. ACTIVE COUNSELLORS & LOAD STATUS ---\x1b[0m');
try {
  const counsellors = db.prepare('SELECT official_id, name, specialization, active_cases, available FROM counsellors').all();
  console.table(counsellors);
} catch (e) {
  console.log('No counsellors table yet.');
}

// 2. Alerts
console.log('\n\x1b[32m--- 2. ACTIVE ALERTS & ASSIGNED VICTIMS ---\x1b[0m');
try {
  const alerts = db.prepare('SELECT id, case_id, victim_alias, risk_score, severity, assigned_counsellor, authority_recipient, status, time FROM alerts ORDER BY id DESC LIMIT 10').all();
  console.table(alerts);
} catch (e) {
  console.log('No alerts table yet.');
}

// 3. Victim Check-ins
console.log('\n\x1b[32m--- 3. RECENT VICTIM CHECK-INS (SECURE VAULT) ---\x1b[0m');
try {
  const checkins = db.prepare('SELECT id, victim_alias, mood, predicted_risk_score, is_atrocity_related, neuro_stress, assigned_counsellor, timestamp FROM victim_checkins ORDER BY id DESC LIMIT 10').all();
  console.table(checkins);
} catch (e) {
  console.log('No checkins table yet.');
}

// 4. Security Audit Logs
console.log('\n\x1b[32m--- 4. IMMUTABLE SECURITY AUDIT LOGS (DPDP ACT 2023) ---\x1b[0m');
try {
  const logs = db.prepare('SELECT id, timestamp, actor, action, target_case, severity FROM audit_logs ORDER BY id DESC LIMIT 8').all();
  console.table(logs);
} catch (e) {
  console.log('No audit logs table yet.');
}

// 5. Official Login Credentials Summary
console.log('\n\x1b[35m--- 5. OFFICIAL DEMO CREDENTIALS REFERENCE ---\x1b[0m');
console.log(`
  Counsellors:
    • Riya:      ID: riya       | Default Password: Riya@2026
    • Divya:     ID: divya      | Default Password: Divya@2026
    • Ayush:     ID: ayush      | Default Password: Ayush@2026
    • Prashant:  ID: prashant   | Default Password: Prashant@2026

  Authorities:
    • District:  ID: district_officer  | Default Password: District@2026
    • State:     ID: state_officer     | Default Password: State@2026
    • National:  ID: national_officer  | Default Password: National@2026

  Victim Mode:
    • Guest:     Instant 1-Click (No credentials required)
    • Signup:    Optional private alias + password
`);
console.log('======================================================\n');
