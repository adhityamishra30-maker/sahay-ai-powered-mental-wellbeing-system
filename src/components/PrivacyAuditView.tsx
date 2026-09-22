import React from 'react';
import type { AuditLogItem } from '../data/mockData';
import { Shield, Lock, Cpu, FileText, CheckCircle2, Server, Eye, Database, Activity, Scale } from 'lucide-react';

interface PrivacyAuditViewProps {
  auditLogs: AuditLogItem[];
}

export const PrivacyAuditView: React.FC<PrivacyAuditViewProps> = ({ auditLogs }) => {
  const privacyCommitments = [
    {
      title: 'Consent-Based Location Sharing',
      desc: 'Current location is never requested automatically. The victim must grant browser permission, and the check-in can continue without sharing it.'
    },
    {
      title: 'Data Minimisation',
      desc: 'The AI request uses the check-in message, selected feeling, risk signal, and optional district or location-sharing status. Name and trusted-contact details stay out of the Gemini prompt.'
    },
    {
      title: 'Server-Side AI Credentials',
      desc: 'The Gemini API key is used by the server endpoint and is not placed in React client code. Production deployment still requires HTTPS, secret management, and access controls.'
    },
    {
      title: 'Role-Based Prototype Access',
      desc: 'Victims are restricted to support check-in and privacy views. Counsellor and authority dashboards are separated in the interface; production authentication is still required.'
    },
    {
      title: 'Human-in-the-Loop Safeguard',
      desc: 'The risk score is support triage, not a medical diagnosis or legal decision. High-risk check-ins are routed to a counsellor and the appropriate authority in the prototype flow.'
    },
    {
      title: 'Prototype Audit Trail',
      desc: 'Role changes, case reviews, alert actions, and automatic assignments are recorded in the current session. The log is not yet immutable or backed by a production database.'
    }
  ];

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-b border-[#ebebeb] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#171717]">
              Privacy, Security & System Architecture
            </h1>
            <span className="bg-amber-50 text-amber-800 text-xs font-mono font-medium px-2.5 py-0.5 rounded border border-amber-200 uppercase">
              PRIVACY PROTOTYPE REVIEW
            </span>
          </div>
          <p className="text-xs text-[#8f8f8f] mt-1">
            Current privacy controls, prototype limitations, ethical AI safeguards, audit events, and deployment requirements.
          </p>
        </div>
      </div>

      {/* AI SYSTEM ARCHITECTURE DIAGRAM */}
      <div className="bg-[#0f172a] text-white p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase text-[#0070f3] font-bold">TECHNICAL ARCHITECTURE</span>
            <h2 className="text-xl font-bold text-white tracking-tight">SAHAY Core AI & Processing Pipeline</h2>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded border border-slate-700">
            System Architecture
          </span>
        </div>

        {/* Visual Pipeline Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* User Channels */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-[#0070f3]">
              <span>TIER 1: SURVIVOR INPUT</span>
              <Server className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Multi-Channel Ingestion</h3>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Web check-in interface</li>
              <li>Safety-first onboarding</li>
              <li>Feeling and support messages</li>
              <li>Optional location permission</li>
            </ul>
          </div>

          {/* Core AI Engine */}
          <div className="bg-slate-900 border border-blue-500/50 p-5 rounded-2xl space-y-3 ring-1 ring-[#0070f3]">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
              <span>TIER 2: SERVER AI SERVICE</span>
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Gemini Support & Risk Response</h3>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Gemini API via server endpoint</li>
              <li>Structured JSON response</li>
              <li>Risk score (0-100)</li>
              <li>Support rationale and next steps</li>
            </ul>
          </div>

          {/* Action & Intervention */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
              <span>TIER 3: HUMAN ESCALATION</span>
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Human Decision Support</h3>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Automatic counsellor assignment at 70+</li>
              <li>Authority escalation by risk band</li>
              <li>Location and accuracy shown to counsellors</li>
              <li>Session audit events</li>
            </ul>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800 pt-3 flex justify-between">
          <span>Tech Stack: Astro • React • TypeScript • Tailwind • Node adapter • Gemini API</span>
          <span>Prototype: in-memory session data</span>
        </div>
      </div>

      {/* PRIVACY COMMITMENTS GRID */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#171717]">Ethical AI & Data Privacy Commitments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {privacyCommitments.map((item, idx) => (
            <div key={idx} className="bg-white border border-[#ebebeb] p-5 rounded-2xl shadow-xs space-y-2">
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

      {/* LIVE AUDIT LOG TRAIL TABLE */}
      <div className="bg-white border border-[#ebebeb] rounded-2xl shadow-xs overflow-hidden space-y-4">
        <div className="p-5 border-b border-[#ebebeb] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#171717]">Current Session Audit Trail</h2>
            <p className="text-xs text-[#8f8f8f]">
              In-memory event log for role changes, case reviews, alert actions, and intervention assignments during this session.
            </p>
          </div>
          <span className="font-mono text-xs text-[#0070f3] bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
            {auditLogs.length} Events Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#ebebeb] font-mono text-[11px] text-[#8f8f8f] uppercase">
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Case</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-[#171717]">{log.id}</td>
                  <td className="py-3 px-4 font-mono text-[#8f8f8f] text-[11px]">{log.timestamp}</td>
                  <td className="py-3 px-4 font-semibold text-[#171717]">{log.actor}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{log.role}</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#0070f3]">{log.action}</td>
                  <td className="py-3 px-4 font-mono font-bold text-red-600">{log.targetCase}</td>
                  <td className="py-3 px-4 text-[#4d4d4d]">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
