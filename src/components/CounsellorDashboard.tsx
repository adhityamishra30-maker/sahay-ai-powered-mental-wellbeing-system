import React, { useState, useEffect, useMemo } from 'react';
import type { CaseData, AlertItem, CheckinRecord, SensitiveSupportRecord } from '../data/mockData';
import { getRiskCategory } from '../data/mockData';
import { 
  Activity, 
  AlertTriangle, 
  Users, 
  Clock, 
  TrendingUp, 
  ChevronRight, 
  Search,
  Inbox,
  Sparkles,
  ShieldAlert,
  Info
} from 'lucide-react';

interface CounsellorDashboardProps {
  cases: CaseData[];
  alerts: AlertItem[];
  checkins: CheckinRecord[];
  sensitiveRecords: SensitiveSupportRecord[];
  onSelectCase: (caseId: string) => void;
  onNavigateTab: (tab: string) => void;
  activeRole?: string;
  currentUser?: { id: string; username: string; name: string; role: string; title?: string } | null;
}

export const CounsellorDashboard: React.FC<CounsellorDashboardProps> = ({
  cases,
  alerts,
  checkins,
  sensitiveRecords,
  onSelectCase,
  onNavigateTab,
  activeRole,
  currentUser
}) => {
  const [filterRisk, setFilterRisk] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [serverAlerts, setServerAlerts] = useState<any[]>([]);

  // Determine current counsellor identity (Riya, Divya, Ayush, or Prashant)
  const counsellorName = currentUser?.name || (
    activeRole?.includes('Riya') ? 'Riya' :
    activeRole?.includes('Divya') ? 'Divya' :
    activeRole?.includes('Ayush') ? 'Ayush' :
    activeRole?.includes('Prashant') ? 'Prashant' : 'Riya'
  );

  const counsellorTitle = currentUser?.title || (
    counsellorName === 'Riya' ? 'Senior Trauma Specialist' :
    counsellorName === 'Divya' ? 'Clinical Well-being Counsellor' :
    counsellorName === 'Ayush' ? 'Case Manager' : 'District Response Counsellor'
  );

  // Fetch alerts from backend SQLite database for this counsellor
  useEffect(() => {
    let isMounted = true;
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`/api/alerts?counsellor=${encodeURIComponent(counsellorName)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.alerts)) {
            setServerAlerts(data.alerts);
          }
        }
      } catch (err) {
        console.warn('Counsellor alerts fetch notice:', err);
      }
    };

    fetchAlerts();
    return () => { isMounted = false; };
  }, [counsellorName]);

  // Combine live SQLite alerts with in-memory alerts
  const allMergedAlerts = useMemo(() => {
    const combined = [...serverAlerts, ...alerts];
    const seen = new Set<string>();
    return combined.filter(item => {
      const idKey = item.id || item.case_id || item.caseId;
      if (!idKey || seen.has(idKey)) return false;
      seen.add(idKey);
      return true;
    });
  }, [serverAlerts, alerts]);

  // Filter specifically assigned alerts for this logged-in counsellor
  const myAssignedAlerts = useMemo(() => {
    return allMergedAlerts.filter(a => {
      const assigned = (a.assigned_counsellor || a.assignedOfficer || '').toLowerCase();
      const target = counsellorName.toLowerCase();
      return assigned.includes(target) || assigned === 'on-call counsellor' || assigned === '';
    });
  }, [allMergedAlerts, counsellorName]);

  // Calculate KPIs based on standard 0-24 Low, 25-49 Mod, 50-74 High, 75-100 Critical scale
  const totalActive = cases.length;
  const criticalCount = cases.filter(c => c.currentScore >= 75).length;
  const highRiskCount = cases.filter(c => c.currentScore >= 50 && c.currentScore < 75).length;
  const followupsDue = cases.filter(c => c.status === 'Requires Human Review').length;

  // Filter cases table
  const filteredCases = cases.filter(c => {
    const category = getRiskCategory(c.currentScore);
    const matchesRisk = filterRisk === 'All' || category === filterRisk || c.riskLevel === filterRisk;
    const matchesSearch = c.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.alias.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  // Longitudinal trajectory points for SAHAY-1042 overview chart
  const sahay1042 = cases.find(c => c.id === 'SAHAY-1042') || cases[0];
  const chartPoints = sahay1042.longitudinalData;

  // Primary alert for banner
  const primaryAlert = myAssignedAlerts[0] || alerts.find(a => a.caseId === 'SAHAY-1042') || alerts[0];

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4 border-b border-[#ebebeb] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#171717]">
              Counsellor & Support Operations
            </h1>
            <span className="bg-blue-50 text-[#0070f3] text-xs font-mono font-medium px-2 py-0.5 rounded border border-blue-200">
              OPERATIONAL TRIAGE
            </span>
          </div>
          <p className="text-xs text-[#8f8f8f] mt-1">
            Real-time explainable decision support monitoring victim distress trajectories under MoSJE directives.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onSelectCase('SAHAY-1042')}
            className="px-4 py-2 rounded-full bg-[#171717] text-white text-xs font-medium hover:bg-black transition flex items-center space-x-2 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0070f3]" />
            <span>Open Priority Case SAHAY-1042</span>
          </button>
        </div>
      </div>

      {/* Mandatory Safety Disclaimer Banner */}
      <div className="bg-[#fafafa] border border-[#ebebeb] p-3.5 rounded-xl text-xs flex items-center justify-between text-[#4d4d4d]">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-[#0070f3] shrink-0" />
          <span>
            <strong>Decision Support Prototype:</strong> Risk indicators are reviewed by authorized human professionals and do not constitute an autonomous clinical or legal decision.
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">Prototype AI Simulation</span>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#ebebeb] p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#8f8f8f]">
            <span className="text-xs font-mono uppercase">Total Monitored Cases</span>
            <Users className="w-4 h-4 text-[#0070f3]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-[#171717] tracking-tight">{totalActive}</span>
            <span className="text-xs text-slate-500">active</span>
          </div>
          <p className="text-[11px] text-[#8f8f8f]">Under MoSJE continuous protocol</p>
        </div>

        <div className="bg-white border border-[#ebebeb] p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#8f8f8f]">
            <span className="text-xs font-mono uppercase">Critical Triage (75–100)</span>
            <AlertTriangle className="w-4 h-4 text-[#ee0000]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-[#ee0000] tracking-tight">{criticalCount}</span>
            <span className="text-xs text-red-600 font-semibold font-mono">Urgent</span>
          </div>
          <p className="text-[11px] text-[#8f8f8f]">Requires immediate human review</p>
        </div>

        <div className="bg-white border border-[#ebebeb] p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#8f8f8f]">
            <span className="text-xs font-mono uppercase">High Risk (50–74)</span>
            <Activity className="w-4 h-4 text-[#ab570a]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-[#ab570a] tracking-tight">{highRiskCount}</span>
            <span className="text-xs text-amber-600 font-medium">Prioritised</span>
          </div>
          <p className="text-[11px] text-[#8f8f8f]">Assigned counsellor intervention</p>
        </div>

        <div className="bg-white border border-[#ebebeb] p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#8f8f8f]">
            <span className="text-xs font-mono uppercase">Follow-ups Due</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-[#171717] tracking-tight">{followupsDue}</span>
            <span className="text-xs text-[#0070f3] font-medium">Pending Review</span>
          </div>
          <p className="text-[11px] text-[#8f8f8f]">Actionable decision queue</p>
        </div>
      </div>

      {/* DEDICATED COUNSELLOR ASSIGNED ALERTS INBOX */}
      <div className="bg-white border-2 border-[#0070f3]/25 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-blue-50/90 via-white to-slate-50 border-b border-[#ebebeb] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#0070f3] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center">
                <Sparkles className="w-3 h-3 mr-1" />
                DEDICATED COUNSELLOR INBOX
              </span>
              <span className="text-xs font-mono font-bold text-[#171717]">
                Assigned: {counsellorName}
              </span>
              <span className="text-[10px] font-mono bg-blue-100 text-[#0070f3] px-2 py-0.5 rounded font-semibold">
                {counsellorTitle}
              </span>
            </div>
            <p className="text-xs text-[#8f8f8f]">
              Direct alerts routed by the automated triage algorithm and stored securely in SQLite database.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 font-bold">
              {myAssignedAlerts.length} Assigned Case{myAssignedAlerts.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {myAssignedAlerts.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8f8f8f] space-y-2">
            <Inbox className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-[#171717]">No active alerts assigned to {counsellorName}</p>
            <p className="text-[11px] text-[#8f8f8f] max-w-md mx-auto">
              When a victim checks in with high distress or atrocity indicators, the AI triage algorithm will automatically route the case to your dashboard.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#ebebeb]">
            {myAssignedAlerts.map((alt: any) => {
              const caseId = alt.case_id || alt.caseId || 'SAHAY-LIVE';
              const riskScore = alt.risk_score ?? alt.riskScore ?? 0;
              const severity = alt.severity || (riskScore >= 75 ? 'Critical' : 'High');
              const victim = alt.victim_alias || alt.victimAlias || 'Survivor';
              const district = alt.district || 'District undisclosed';
              const time = alt.time || 'Just now';
              const factors: string[] = Array.isArray(alt.detectedFactors)
                ? alt.detectedFactors
                : typeof alt.detected_factors_json === 'string'
                ? JSON.parse(alt.detected_factors_json)
                : [];
              const isPoA = factors.some((f: string) => f.toLowerCase().includes('poa') || f.toLowerCase().includes('atrocity'));

              return (
                <div key={alt.id} className="p-4 sm:p-5 hover:bg-slate-50/90 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        severity === 'Critical' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {severity} Alert
                      </span>
                      <span className="text-xs font-mono font-bold text-[#171717]">{caseId}</span>
                      <span className="text-xs text-[#8f8f8f]">• {victim}</span>
                      <span className="text-xs text-[#8f8f8f]">• {district}</span>
                      <span className="text-xs text-[#8f8f8f]">• {time}</span>
                      {isPoA && (
                        <span className="text-[10px] font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200 font-bold flex items-center space-x-1">
                          <span>🛡️</span>
                          <span>PoA Act Priority</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline space-x-3">
                      <span className="text-lg font-bold text-[#171717]">
                        Distress Score: <span className={riskScore >= 75 ? 'text-[#ee0000]' : 'text-[#ab570a]'}>{riskScore} / 100</span>
                      </span>
                    </div>

                    {factors.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {factors.map((f: string, idx: number) => (
                          <span key={idx} className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded shadow-2xs font-mono">
                            • {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectCase(caseId)}
                      className="px-4 py-2 rounded-xl bg-[#171717] hover:bg-black text-white text-xs font-semibold shadow-xs transition flex items-center space-x-1.5"
                    >
                      <span>Review Details</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#0070f3]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border border-[#ebebeb] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#ebebeb] flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#171717]">Latest Victim Check-ins</h2>
            <p className="text-xs text-[#8f8f8f]">Every completed AI check-in is saved here for counsellor review during this session.</p>
          </div>
          <span className="text-xs font-mono text-[#0070f3] bg-blue-50 px-2.5 py-1 rounded border border-blue-100">{checkins.length} Saved</span>
        </div>
        {checkins.length === 0 ? (
          <p className="p-5 text-xs text-[#8f8f8f]">No new victim check-ins have been completed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fafafa] border-b border-[#ebebeb] text-[10px] font-mono uppercase text-[#8f8f8f]">
                <tr><th className="p-3">Time</th><th className="p-3">Feeling</th><th className="p-3">Input</th><th className="p-3">Risk</th><th className="p-3">Location</th></tr>
              </thead>
              <tbody className="divide-y divide-[#ebebeb]">
                {checkins.map((checkin) => (
                  <tr key={checkin.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 whitespace-nowrap text-[#8f8f8f]">{checkin.timestamp}</td>
                    <td className="p-3 font-semibold text-[#171717]">{checkin.mood}</td>
                    <td className="p-3 min-w-[220px] text-[#4d4d4d]">{checkin.message}</td>
                    <td className="p-3 whitespace-nowrap"><span className="font-mono font-bold text-[#171717]">{checkin.riskScore}/100</span><span className="ml-1 text-[#8f8f8f]">{checkin.riskLevel}</span></td>
                    <td className="p-3 whitespace-nowrap text-[#4d4d4d]">{checkin.currentLocationShared ? `Shared${checkin.locationLabel ? ` • ${checkin.locationLabel}` : ''}` : 'Not shared'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-amber-50/60 border border-amber-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-amber-200">
          <h2 className="text-base font-bold text-[#171717]">Restricted Emergency Contacts</h2>
          <p className="text-xs text-amber-900 mt-1">Visible only to authenticated counsellors and higher authorities. Use only for approved safeguarding follow-up.</p>
        </div>
        {sensitiveRecords.length === 0 ? (
          <p className="p-5 text-xs text-[#8f8f8f]">No trusted-contact details have been submitted.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] font-mono uppercase text-amber-900 border-b border-amber-200"><tr><th className="p-3">Submitted</th><th className="p-3">Victim name / age</th><th className="p-3">Region</th><th className="p-3">Trusted contact</th><th className="p-3">Phone</th></tr></thead>
              <tbody className="divide-y divide-amber-200">{sensitiveRecords.map(record => <tr key={record.id}><td className="p-3 text-[#8f8f8f]">{record.timestamp}</td><td className="p-3 font-semibold text-[#171717]">{record.nameAge}</td><td className="p-3 text-[#4d4d4d]">{record.district}, {record.state} ({record.areaType})</td><td className="p-3 text-[#4d4d4d]">{record.trustedContact}</td><td className="p-3 font-mono text-[#171717]">{record.trustedPhone}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* CHARTS & DISTRIBUTION SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DISTRESS OVERVIEW CHART */}
        <div className="lg:col-span-2 bg-white border border-[#ebebeb] p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-[#171717]">Longitudinal Distress Trajectory</h3>
                <span className="text-[10px] font-mono bg-slate-100 text-[#4d4d4d] px-2 py-0.5 rounded">
                  CASE SAHAY-1042
                </span>
              </div>
              <p className="text-xs text-[#8f8f8f]">
                Continuous risk score monitoring over 18 days (Day 1: 32 → Day 18: 82)
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#ee0000] bg-red-50 border border-red-100 px-2.5 py-1 rounded">
              Critical Trajectory ↑
            </span>
          </div>

          {/* Interactive SVG Chart */}
          <div className="h-56 w-full pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180">
              <line x1="40" y1="20" x2="480" y2="20" stroke="#f2f2f2" strokeDasharray="3 3" />
              <line x1="40" y1="60" x2="480" y2="60" stroke="#f2f2f2" strokeDasharray="3 3" />
              <line x1="40" y1="100" x2="480" y2="100" stroke="#f2f2f2" strokeDasharray="3 3" />
              <line x1="40" y1="140" x2="480" y2="140" stroke="#f2f2f2" strokeDasharray="3 3" />

              <text x="30" y="24" textAnchor="end" className="text-[9px] font-mono fill-slate-400">75 (Critical)</text>
              <text x="30" y="64" textAnchor="end" className="text-[9px] font-mono fill-slate-400">50 (High)</text>
              <text x="30" y="104" textAnchor="end" className="text-[9px] font-mono fill-slate-400">25 (Mod)</text>
              <text x="30" y="144" textAnchor="end" className="text-[9px] font-mono fill-slate-400">0 (Low)</text>

              <rect x="40" y="20" width="440" height="30" fill="#fee2e2" opacity="0.3" />

              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ee0000" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0070f3" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              <path
                d="M 60 122 L 130 117 L 200 105 L 270 91 L 340 65 L 410 40 L 470 24 L 470 150 L 60 150 Z"
                fill="url(#chartGradient)"
              />

              <path
                d="M 60 122 L 130 117 L 200 105 L 270 91 L 340 65 L 410 40 L 470 24"
                fill="none"
                stroke="#ee0000"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {chartPoints.map((pt, i) => {
                const x = 60 + i * 68;
                const y = 150 - (pt.score * 1.5);
                const isCritical = pt.score >= 75;
                return (
                  <g key={i} className="cursor-pointer group" onClick={() => onSelectCase('SAHAY-1042')}>
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={isCritical ? "6" : "4"} 
                      fill={isCritical ? "#ee0000" : (pt.score >= 50 ? "#ab570a" : pt.score >= 25 ? "#f5a623" : "#10b981")}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text x={x} y="165" textAnchor="middle" className="text-[9px] font-mono fill-slate-500">{pt.day}</text>
                    <text x={x} y={y - 10} textAnchor="middle" className="text-[10px] font-mono font-bold fill-slate-800">{pt.score}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex justify-between items-center text-xs text-[#8f8f8f] pt-2 border-t border-[#f2f2f2]">
            <span>Baseline: Day 1 (32 - Low)</span>
            <span className="font-mono text-red-600 font-semibold">Predictive Escalation BEFORE Threshold Breach</span>
            <span>Current: Day 18 (82 - Critical)</span>
          </div>
        </div>

        {/* RISK DISTRIBUTION */}
        <div className="bg-white border border-[#ebebeb] p-6 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#171717]">Risk Level Tiers (Standard Scale)</h3>
            <p className="text-xs text-[#8f8f8f]">Distribution of monitored complainants</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/60 border border-red-100">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ee0000]" />
                <span className="text-xs font-semibold text-red-900">Critical (75–100)</span>
              </div>
              <span className="font-mono font-bold text-red-700 text-sm">{cases.filter(c => c.currentScore >= 75).length} Cases</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-100">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ab570a]" />
                <span className="text-xs font-semibold text-amber-900">High Risk (50–74)</span>
              </div>
              <span className="font-mono font-bold text-amber-700 text-sm">{cases.filter(c => c.currentScore >= 50 && c.currentScore < 75).length} Cases</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-50/60 border border-yellow-100">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f5a623]" />
                <span className="text-xs font-semibold text-yellow-900">Moderate (25–49)</span>
              </div>
              <span className="font-mono font-bold text-yellow-700 text-sm">{cases.filter(c => c.currentScore >= 25 && c.currentScore < 50).length} Cases</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-emerald-900">Low Risk (0–24)</span>
              </div>
              <span className="font-mono font-bold text-emerald-700 text-sm">{cases.filter(c => c.currentScore < 25).length} Cases</span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-[#8f8f8f] border-t border-[#f2f2f2]">
            Cases automatically escalate in triage queue as distress score crosses risk boundaries.
          </div>
        </div>
      </div>

      {/* PRIORITY CASES TABLE */}
      <div className="bg-white border border-[#ebebeb] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#ebebeb] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#171717]">Priority Cases Management Queue</h3>
            <p className="text-xs text-[#8f8f8f]">
              Pseudonymized complainant records sorted by dynamic distress score.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search case or district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#fafafa] border border-[#ebebeb] rounded-md text-xs text-[#171717] focus:outline-none focus:border-[#0070f3]"
              />
            </div>

            {/* Risk filter buttons */}
            <div className="flex items-center space-x-1 bg-[#fafafa] p-1 rounded-md border border-[#ebebeb] text-xs">
              {['All', 'Critical', 'High', 'Moderate', 'Low'].map((r) => (
                <button
                  key={r}
                  onClick={() => setFilterRisk(r)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                    filterRisk === r 
                      ? 'bg-[#171717] text-white shadow-xs' 
                      : 'text-[#4d4d4d] hover:text-[#171717]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table / Empty State */}
        {filteredCases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#ebebeb] text-[11px] font-mono text-[#8f8f8f] uppercase">
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">Victim Alias</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Current Risk</th>
                  <th className="py-3 px-4">Trend</th>
                  <th className="py-3 px-4">Last Check-in</th>
                  <th className="py-3 px-4">Assigned Counsellor</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebebeb] text-xs">
                {filteredCases.map((c) => {
                  const isHighlight = c.id === 'SAHAY-1042';
                  const cat = getRiskCategory(c.currentScore);
                  return (
                    <tr 
                      key={c.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isHighlight ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#171717] flex items-center space-x-1.5">
                        <span>{c.id}</span>
                        {isHighlight && (
                          <span className="bg-[#0070f3] text-white text-[9px] px-1.5 py-0.2 rounded font-sans">
                            Priority
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#4d4d4d] font-medium">{c.alias}</td>
                      <td className="py-3.5 px-4 text-[#8f8f8f]">{c.district}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                          cat === 'Critical'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : cat === 'High'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : cat === 'Moderate'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {c.currentScore} / 100 ({cat.toUpperCase()})
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-mono text-[11px] ${
                          c.trend === 'Escalating' ? 'text-red-600 font-semibold' : 'text-slate-600'
                        }`}>
                          {c.trend === 'Escalating' ? 'Escalating ↑' : c.trend === 'Improving' ? 'Improving ↓' : 'Stable →'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#8f8f8f] text-[11px]">{c.lastCheckIn}</td>
                      <td className="py-3.5 px-4 text-[#4d4d4d]">{c.assignedCounsellor}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onSelectCase(c.id)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition shadow-xs ${
                            isHighlight 
                              ? 'bg-[#171717] text-white hover:bg-black' 
                              : 'bg-white text-[#171717] border border-[#ebebeb] hover:bg-[#fafafa]'
                          }`}
                        >
                          Review Case
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 px-4 space-y-3">
            <Inbox className="w-8 h-8 mx-auto text-slate-300" />
            <h4 className="text-sm font-semibold text-[#171717]">No cases match your filter criteria</h4>
            <p className="text-xs text-[#8f8f8f]">Try resetting your search query or choosing a different risk tier.</p>
            <button
              onClick={() => { setFilterRisk('All'); setSearchQuery(''); }}
              className="px-4 py-1.5 bg-[#171717] text-white text-xs font-medium rounded-md hover:bg-black transition"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
