import React, { useEffect, useState } from 'react';
import { Shield, Cpu, CheckCircle2, Server, AlertTriangle, Trash2 } from 'lucide-react';

interface PrivacyAuditViewProps {
  isStaff: boolean;
  isRegisteredVictim: boolean;
  onAccountDeleted: () => void;
}

interface ServerAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  target_case: string;
  details: string;
  severity: string;
}

const dataCollected = [
  { item: 'Check-in message and selected feeling', required: 'Required for a check-in', seenBy: 'Assigned counsellor (if the check-in raises an alert); AI provider, after phone numbers and emails are removed' },
  { item: 'Trauma screening answers (stress, trust, distress levels)', required: 'Optional; only for atrocity-related check-ins', seenBy: 'Assigned counsellor and escalation authority (as alert factors); AI provider' },
  { item: 'Name or alias and age', required: 'Optional; skippable', seenBy: 'Assigned counsellor and escalation authority (if the check-in raises an alert)' },
  { item: 'District, state, urban/rural', required: 'Optional; skippable', seenBy: 'Assigned counsellor and escalation authority (if the check-in raises an alert)' },
  { item: 'Trusted contact name and phone', required: 'Optional; skippable', seenBy: 'Assigned counsellor only (if the check-in raises an alert). Never sent to authorities or the AI provider.' },
  { item: 'Exact GPS location (latitude, longitude, accuracy)', required: 'Optional; only after you press “Share current location” and allow it', seenBy: 'Assigned counsellor and escalation authority (if the check-in raises an alert)' },
  { item: 'Voice input', required: 'Optional', seenBy: 'Converted to text by your browser’s speech service (in Chrome this is processed by Google). SAHAY receives only the text.' }
];

const privacyCommitments = [
  {
    title: 'You Choose What to Share',
    desc: 'Only the check-in message and feeling are needed. Name, age, district, trusted contact and GPS location can all be skipped. Location is requested only when you press the button and grant browser permission.'
  },
  {
    title: 'What the AI Provider Receives',
    desc: 'The server sends your message, selected feeling and any screening answers to Google Gemini (or OpenAI, if the deployment is configured with an OpenAI key instead). Phone numbers and emails are removed first, but names or addresses typed into the message cannot be reliably detected. Your name, age, district, contact and location are never sent. On Google’s free Gemini API tier, Google may use inputs to improve its products; a real deployment should use a paid tier.'
  },
  {
    title: 'Encryption and Access',
    desc: 'Messages, names, locations and contacts are encrypted in the database with AES-256-GCM. Passwords are hashed with PBKDF2-SHA512. Staff data is only available through signed-in, role-checked server sessions. Traffic is protected by HTTPS where the host provides it.'
  },
  {
    title: 'Retention and Deletion',
    desc: 'Check-ins and alerts are deleted automatically after 180 days (audit records after 365 days). Guests can delete a check-in right after sending it. Registered users can delete their account and every check-in below.'
  },
  {
    title: 'Human-in-the-Loop Escalation',
    desc: 'The risk score is a support triage estimate, not a diagnosis or legal decision. Every check-in is assigned to a counsellor. At a score of 50 or more (or a positive atrocity screening) an alert is created and escalated: 50–74 to the District authority, 75–89 to the State authority, 90+ to the National authority.'
  },
  {
    title: 'When the AI Is Unavailable',
    desc: 'If the AI service fails or is not configured, SAHAY uses a simple rule-based estimate from your selected feeling and screening answers, and tells you so. It does not assign a default high-risk score.'
  }
];

const limitations = [
  'This is a prototype. It has not been independently audited or certified under the DPDP Act 2023 or any other law.',
  'There is no named grievance officer or formal consent-withdrawal process yet beyond the delete controls on this page.',
  'Check-ins below the alert threshold are stored (encrypted) but not yet shown in any staff dashboard.',
  'Audit records are append-only through the app, but a person with direct server access could still change the database.',
  'Rate limiting is per server instance and based on the client IP reported by the hosting proxy.'
];

export const PrivacyAuditView: React.FC<PrivacyAuditViewProps> = ({ isStaff, isRegisteredVictim, onAccountDeleted }) => {
  const [auditLogs, setAuditLogs] = useState<ServerAuditLog[]>([]);
  const [auditError, setAuditError] = useState('');
  const [deleteState, setDeleteState] = useState<'idle' | 'confirm' | 'deleting' | 'error'>('idle');

  useEffect(() => {
    if (!isStaff) return;
    let isMounted = true;
    fetch('/api/logs')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load audit logs.');
        if (isMounted) setAuditLogs(Array.isArray(data.logs) ? data.logs : []);
      })
      .catch((err) => isMounted && setAuditError(err.message || 'Could not load audit logs.'));
    return () => { isMounted = false; };
  }, [isStaff]);

  const handleDeleteAccount = async () => {
    setDeleteState('deleting');
    try {
      const res = await fetch('/api/auth/account', { method: 'DELETE' });
      if (!res.ok) throw new Error();
      onAccountDeleted();
    } catch {
      setDeleteState('error');
    }
  };

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-b border-[#ebebeb] pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#171717]">
              Privacy, Security & Data Use
            </h1>
            <span className="bg-amber-50 text-amber-800 text-xs font-mono font-medium px-2.5 py-0.5 rounded border border-amber-200 uppercase">
              Prototype, not certified
            </span>
          </div>
          <p className="text-xs text-[#8f8f8f] mt-1">
            What SAHAY collects, who can see it, how long it is kept, and what is still missing.
          </p>
        </div>
      </div>

      {/* WHAT WE COLLECT */}
      <div className="bg-white border border-[#ebebeb] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#ebebeb]">
          <h2 className="text-base font-bold text-[#171717]">What is collected and who can see it</h2>
          <p className="text-xs text-[#8f8f8f] mt-1">SAHAY does not sell this data or use it for advertising. The AI provider’s own terms also apply to what it receives (see below).</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#ebebeb] font-mono text-[11px] text-[#8f8f8f] uppercase">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Required?</th>
                <th className="py-3 px-4">Who can see it</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb]">
              {dataCollected.map((row) => (
                <tr key={row.item}>
                  <td className="py-3 px-4 font-semibold text-[#171717]">{row.item}</td>
                  <td className="py-3 px-4 text-[#4d4d4d]">{row.required}</td>
                  <td className="py-3 px-4 text-[#4d4d4d]">{row.seenBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI SYSTEM ARCHITECTURE DIAGRAM */}
      <div className="bg-[#0f172a] text-white p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase text-[#0070f3] font-bold">TECHNICAL ARCHITECTURE</span>
            <h2 className="text-xl font-bold text-white tracking-tight">SAHAY Check-in & Escalation Pipeline</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-[#0070f3]">
              <span>STEP 1: YOUR CHECK-IN</span>
              <Server className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Web check-in</h3>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Safety question first</li>
              <li>Optional details, each skippable</li>
              <li>Feeling and message</li>
              <li>Optional GPS, only on request</li>
            </ul>
          </div>

          <div className="bg-slate-900 border border-blue-500/50 p-5 rounded-2xl space-y-3 ring-1 ring-[#0070f3]">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
              <span>STEP 2: SERVER TRIAGE</span>
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">AI or rule-based estimate</h3>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Redacted message to Gemini / OpenAI</li>
              <li>Rule-based fallback if AI unavailable</li>
              <li>Risk score 0–100 with rationale</li>
              <li>Encrypted before it is stored</li>
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
              <span>STEP 3: HUMAN REVIEW</span>
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Counsellor & authority</h3>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Every check-in gets a counsellor</li>
              <li>Alert at score 50+ or atrocity screening</li>
              <li>District 50–74 · State 75–89 · National 90+</li>
              <li>Staff access recorded in audit log</li>
            </ul>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800 pt-3 flex flex-wrap justify-between gap-2">
          <span>Astro • React • TypeScript • Tailwind • Node • SQLite</span>
          <span>AI: Google Gemini (or OpenAI if configured)</span>
        </div>
      </div>

      {/* PRIVACY COMMITMENTS GRID */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#171717]">How your data is handled</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {privacyCommitments.map((item) => (
            <div key={item.title} className="bg-white border border-[#ebebeb] p-5 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-[#171717]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{item.title}</span>
              </div>
              <p className="text-xs text-[#4d4d4d] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* KNOWN LIMITATIONS */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
          <AlertTriangle className="w-4 h-4" />
          <span>Known limitations</span>
        </div>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-amber-900 leading-relaxed">
          {limitations.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>

      {/* DELETE MY DATA */}
      <div className="bg-white border border-[#ebebeb] rounded-2xl shadow-xs p-5 space-y-3">
        <h2 className="text-base font-bold text-[#171717]">Delete my data</h2>
        {isRegisteredVictim ? (
          <>
            <p className="text-xs text-[#4d4d4d] leading-relaxed">
              This permanently deletes your alias account and every check-in and alert linked to it. It cannot be undone. A record that a deletion happened (without any of your content) stays in the audit log.
            </p>
            {deleteState === 'idle' && (
              <button
                type="button"
                onClick={() => setDeleteState('confirm')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-800 hover:bg-red-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete my account and check-ins
              </button>
            )}
            {deleteState === 'confirm' && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-red-800">Are you sure?</span>
                <button type="button" onClick={handleDeleteAccount} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700">Yes, delete everything</button>
                <button type="button" onClick={() => setDeleteState('idle')} className="rounded-xl border border-[#ebebeb] px-4 py-2 text-xs font-semibold text-[#171717] hover:bg-[#fafafa]">Cancel</button>
              </div>
            )}
            {deleteState === 'deleting' && <p className="text-xs text-[#8f8f8f]">Deleting…</p>}
            {deleteState === 'error' && <p className="text-xs text-red-600">Deletion failed. Please try again.</p>}
          </>
        ) : (
          <p className="text-xs text-[#4d4d4d] leading-relaxed">
            Guests can delete a check-in using the “Delete this check-in” button shown right after sending it. Registered users can delete their whole account here after signing in. All check-ins are deleted automatically after 180 days.
          </p>
        )}
      </div>

      {/* AUDIT LOG (STAFF ONLY) */}
      <div className="bg-white border border-[#ebebeb] rounded-2xl shadow-xs overflow-hidden space-y-4">
        <div className="p-5 border-b border-[#ebebeb] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#171717]">Audit Trail</h2>
            <p className="text-xs text-[#8f8f8f]">
              Sign-ins, check-in escalations, deletions and staff case actions, stored on the server. Visible to signed-in staff only.
            </p>
          </div>
          {isStaff && (
            <span className="font-mono text-xs text-[#0070f3] bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
              {auditLogs.length} Events
            </span>
          )}
        </div>

        {!isStaff ? (
          <p className="px-5 pb-5 text-xs text-[#8f8f8f]">Sign in as a counsellor or authority to view the audit trail.</p>
        ) : auditError ? (
          <p className="px-5 pb-5 text-xs text-red-600">{auditError}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#ebebeb] font-mono text-[11px] text-[#8f8f8f] uppercase">
                  <th className="py-3 px-4">Log ID</th>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebebeb]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#171717]">{log.id}</td>
                    <td className="py-3 px-4 font-mono text-[#8f8f8f] text-[11px] whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-3 px-4 font-semibold text-[#171717]">{log.actor}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{log.role}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#0070f3]">{log.action}</td>
                    <td className="py-3 px-4 font-mono font-bold text-red-600">{log.target_case}</td>
                    <td className="py-3 px-4 text-[#4d4d4d]">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
