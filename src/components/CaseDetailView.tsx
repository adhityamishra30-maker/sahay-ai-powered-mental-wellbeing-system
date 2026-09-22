import React, { useState } from 'react';
import type { CaseData, AuditLogItem } from '../data/mockData';
import { getRiskCategory } from '../data/mockData';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  Mic, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  ArrowLeft,
  Calendar,
  X,
  UserCheck,
  Building,
  Info
} from 'lucide-react';

interface CaseDetailViewProps {
  caseData: CaseData;
  onBackToDashboard: () => void;
  onUpdateIntervention: (caseId: string, interventionId: string, newStatus: string, assignedTo?: string, nextFollowUp?: string) => void;
  onAddAuditLog: (log: AuditLogItem) => void;
  onAddTimelineEvent?: (caseId: string, event: { id: string; date: string; time: string; title: string; description: string; type: 'system' | 'checkin' | 'alert' | 'action' }) => void;
}

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({
  caseData,
  onBackToDashboard,
  onUpdateIntervention,
  onAddAuditLog,
  onAddTimelineEvent
}) => {
  const [selectedDataPoint, setSelectedDataPoint] = useState<number>(caseData.longitudinalData.length - 1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Intervention modal state
  const [activeModalIntervention, setActiveModalIntervention] = useState<any | null>(null);
  const [modalAssignedOfficer, setModalAssignedOfficer] = useState<string>('Dr. Sunita Sharma (Sr. Trauma Specialist)');
  const [modalFollowUpDate, setModalFollowUpDate] = useState<string>('18 September 2026');

  const activePoint = caseData.longitudinalData[selectedDataPoint] || caseData.longitudinalData[caseData.longitudinalData.length - 1];
  const riskCategory = getRiskCategory(caseData.currentScore);

  const openActionModal = (intervention: any) => {
    setActiveModalIntervention(intervention);
  };

  const handleConfirmIntervention = () => {
    if (!activeModalIntervention) return;

    const interventionId = activeModalIntervention.id;
    const title = activeModalIntervention.title;
    const newStatus = 'Assigned';

    // 1. Update state in parent
    onUpdateIntervention(caseData.id, interventionId, newStatus, modalAssignedOfficer, modalFollowUpDate);

    // 2. Add Timeline event
    if (onAddTimelineEvent) {
      onAddTimelineEvent(caseData.id, {
        id: `TL-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: `Intervention Assigned: ${title}`,
        description: `Official intervention assigned to ${modalAssignedOfficer}. Scheduled follow-up: ${modalFollowUpDate}.`,
        type: 'action'
      });
    }

    // 3. Add Audit log entry
    onAddAuditLog({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: "Dr. Sunita Sharma",
      role: "Senior Counsellor",
      action: "ASSIGN_INTERVENTION",
      targetCase: caseData.id,
      details: `Assigned '${title}' to ${modalAssignedOfficer}. Scheduled review: ${modalFollowUpDate}.`
    });

    // 4. Trigger Toast
    setToastMessage(`Action Confirmed: ${title} assigned to ${modalAssignedOfficer}. Timeline & Audit log updated.`);
    setActiveModalIntervention(null);

    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#171717] text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-3 text-xs font-mono animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between pt-4 border-b border-[#ebebeb] pb-4">
        <button
          onClick={onBackToDashboard}
          aria-label="Back to Counsellor Dashboard"
          title="Back to Counsellor Dashboard"
          className="group inline-flex items-center space-x-2 text-xs font-medium text-[#4d4d4d] hover:text-[#171717] transition bg-white border border-[#ebebeb] px-3.5 py-2 rounded-xl shadow-2xs hover:bg-[#fafafa] hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0070f3] min-h-[40px]"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#4d4d4d] group-hover:text-[#0070f3] group-hover:-translate-x-1 transition-transform" />
          <span>← Back to Counsellor Dashboard</span>
        </button>

        <div className="flex items-center space-x-2 text-xs text-[#8f8f8f] font-mono">
          <span>MoSJE Protocol</span>
          <span>•</span>
          <span>Restricted case record · access is audited</span>
        </div>
      </div>

      {/* CASE HEADER BANNER */}
      <div className="bg-white border border-[#ebebeb] p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-[#171717] tracking-tight">
                Case ID: {caseData.id}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${
                riskCategory === 'Critical'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {riskCategory} RISK
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-50 text-[#0070f3] border border-blue-200">
                {caseData.status}
              </span>
            </div>
            <p className="text-xs text-[#4d4d4d] font-medium">
              {caseData.alias} • {caseData.district}, {caseData.state}
            </p>
            <p className="text-[11px] text-[#8f8f8f] font-mono">
              Category: {caseData.category} | Assigned Officer: {caseData.assignedCounsellor}
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-[#fafafa] border border-[#ebebeb] p-4 rounded-xl">
            <div className="text-right space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-[#8f8f8f] block">Dynamic Distress Score</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-bold text-[#ee0000]">{caseData.currentScore}</span>
                <span className="text-xs text-slate-500 font-mono">/ 100</span>
              </div>
              <span className="text-[11px] font-mono text-red-600 font-semibold">
                +{caseData.currentScore - caseData.previousScore} pts change (Previous: {caseData.previousScore})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK SUMMARY CARD: WHO? RISK? TREND? WHY? WHAT TO DO? */}
      <div className="bg-[#fafafa] border border-[#ebebeb] p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
        <div>
          <span className="text-[10px] font-mono text-[#8f8f8f] uppercase block font-semibold">WHO IS COMPLAINANT?</span>
          <p className="font-semibold text-[#171717] mt-0.5">{caseData.alias}</p>
          <p className="text-[11px] text-[#8f8f8f]">{caseData.district}</p>
        </div>
        <div>
          <span className="text-[10px] font-mono text-[#8f8f8f] uppercase block font-semibold">CURRENT RISK TIER</span>
          <p className="font-bold text-[#ee0000] mt-0.5">{caseData.currentScore} / 100 ({riskCategory.toUpperCase()})</p>
          <p className="text-[11px] text-slate-500">Threshold: 75–100 Critical</p>
        </div>
        <div>
          <span className="text-[10px] font-mono text-[#8f8f8f] uppercase block font-semibold">TRAJECTORY TREND</span>
          <p className="font-bold text-red-600 mt-0.5">{caseData.trend} ↑</p>
          <p className="text-[11px] text-[#8f8f8f]">Over 18 days monitoring</p>
        </div>
        <div>
          <span className="text-[10px] font-mono text-[#8f8f8f] uppercase block font-semibold">PRIMARY WHY SIGNAL</span>
          <p className="font-semibold text-[#171717] mt-0.5">+18 Sentiment Trend</p>
          <p className="text-[11px] text-[#8f8f8f]">Court hearing anxiety</p>
        </div>
        <div>
          <span className="text-[10px] font-mono text-[#8f8f8f] uppercase block font-semibold">ACTION REQUIRED</span>
          <p className="font-bold text-[#0070f3] mt-0.5">Assign Intervention</p>
          <p className="text-[11px] text-slate-500">Human decision in loop</p>
        </div>
      </div>

      {/* TOP ROW: DISTRESS SCORE & LONGITUDINAL TREND CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* A. DYNAMIC DISTRESS SCORE CARD */}
        <div className="bg-white border border-[#ebebeb] p-6 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-[#8f8f8f] uppercase">
              <span>Dynamic Risk Engine</span>
              <Sparkles className="w-4 h-4 text-[#0070f3]" />
            </div>
            <h3 className="text-base font-bold text-[#171717] mt-1">Current Risk Assessment</h3>
          </div>

          <div className="text-center py-4 space-y-2 bg-gradient-to-b from-red-50/50 to-white border border-red-100 rounded-xl">
            <div className="inline-flex items-baseline justify-center space-x-1">
              <span className="text-5xl font-extrabold text-[#ee0000] tracking-tight">{caseData.currentScore}</span>
              <span className="text-sm font-mono text-slate-500">/ 100</span>
            </div>
            <div className="text-xs font-mono font-bold text-red-700 uppercase tracking-wider">
              {riskCategory} RISK TIER
            </div>
            <p className="text-[11px] text-slate-600 px-4">
              Baseline: {caseData.longitudinalData[0].score} (Day 1) → Current: {caseData.currentScore} (Day 18)
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#f2f2f2] text-slate-600">
              <span>Trajectory Status:</span>
              <span className="font-mono font-bold text-red-600">{caseData.trend} ↑</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#f2f2f2] text-slate-600">
              <span>Last Check-in Ingested:</span>
              <span className="font-mono text-[#171717]">{caseData.lastCheckIn}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-600">
              <span>Action Priority:</span>
              <span className="font-mono font-bold text-[#ee0000]">HUMAN REVIEW REQUIRED</span>
            </div>
          </div>
        </div>

        {/* B. LONGITUDINAL TREND INTERACTIVE CHART */}
        <div className="lg:col-span-2 bg-white border border-[#ebebeb] p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#171717]">Longitudinal Risk Trend (18-Day Progression)</h3>
              <p className="text-xs text-[#8f8f8f]">
                Click check-in nodes to inspect historic signal logs.
              </p>
            </div>
            <span className="text-xs font-mono bg-blue-50 text-[#0070f3] px-2.5 py-1 rounded border border-blue-100">
              Selected: {activePoint.day} ({activePoint.score}/100)
            </span>
          </div>

          <div className="h-52 w-full pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160">
              <line x1="40" y1="35" x2="480" y2="35" stroke="#ee0000" strokeDasharray="4 4" strokeWidth="1.5" />
              <text x="475" y="28" textAnchor="end" className="text-[9px] font-mono fill-red-600 font-bold">Critical Alert Threshold (75)</text>

              <line x1="40" y1="75" x2="480" y2="75" stroke="#f2f2f2" />
              <line x1="40" y1="115" x2="480" y2="115" stroke="#f2f2f2" />

              <path
                d="M 60 115 L 130 110 L 200 101 L 270 91 L 340 71 L 410 52 L 470 40"
                fill="none"
                stroke="#0070f3"
                strokeWidth="3"
              />

              {caseData.longitudinalData.map((pt, i) => {
                const x = 60 + i * 68;
                const y = 145 - (pt.score * 1.3);
                const isSelected = selectedDataPoint === i;
                return (
                  <g 
                    key={i} 
                    onClick={() => setSelectedDataPoint(i)}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? "8" : "5"}
                      fill={isSelected ? "#ee0000" : (pt.score >= 75 ? "#ee0000" : "#0070f3")}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />
                    <text x={x} y="155" textAnchor="middle" className={`text-[10px] font-mono ${isSelected ? 'fill-slate-900 font-bold' : 'fill-slate-400'}`}>
                      {pt.day}
                    </text>
                    <text x={x} y={y - 12} textAnchor="middle" className={`text-[10px] font-mono ${isSelected ? 'fill-red-600 font-bold' : 'fill-slate-700'}`}>
                      {pt.score}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="bg-[#fafafa] border border-[#ebebeb] p-3 rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between font-mono text-[11px] text-[#0070f3]">
              <span>CHECK-IN LOG: {activePoint.day} ({activePoint.label || 'Regular Protocol'})</span>
              <span>SCORE: {activePoint.score} / 100</span>
            </div>
            <p className="text-[#4d4d4d]">
              {activePoint.note || "Standard victim well-being check-in processed."}
            </p>
          </div>
        </div>
      </div>

      {/* C. AI SIGNALS CARDS */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-[#0070f3]" />
          <h2 className="text-base font-bold text-[#171717]">Multimodal AI Signals Analysis</h2>
          <span className="text-[10px] font-mono text-[#8f8f8f] uppercase">(Live Processing Vector)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#ebebeb] p-5 rounded-2xl shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-mono uppercase">
              <span>Sentiment Trend</span>
              <FileText className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-lg font-bold text-red-600">{caseData.aiSignals.sentiment}</div>
            <p className="text-[11px] text-[#8f8f8f]">
              NLP Transformer analysis detected acute negative sentiment trajectory.
            </p>
          </div>

          <div className="bg-white border border-[#ebebeb] p-5 rounded-2xl shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-mono uppercase">
              <span>Engagement Index</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-lg font-bold text-amber-700">{caseData.aiSignals.engagement}</div>
            <p className="text-[11px] text-[#8f8f8f]">
              Response latency increased by 3.2 days; missed 1 scheduled check-in.
            </p>
          </div>

          <div className="bg-white border border-[#ebebeb] p-5 rounded-2xl shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-mono uppercase">
              <span>Voice Stress</span>
              <Mic className="w-4 h-4 text-[#7928ca]" />
            </div>
            <div className="text-lg font-bold text-[#7928ca]">{caseData.aiSignals.voiceStress}</div>
            <p className="text-[11px] text-[#8f8f8f]">
              Acoustic micro-tremor & spectral jitter above 0.70 threshold.
            </p>
          </div>

          <div className="bg-white border border-[#ebebeb] p-5 rounded-2xl shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-mono uppercase">
              <span>Emotional Clusters</span>
              <Shield className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex flex-wrap gap-1">
              {caseData.aiSignals.emotionalState.map((e, idx) => (
                <span key={idx} className="bg-red-50 text-red-700 text-[10px] font-medium px-2 py-0.5 rounded border border-red-100">
                  {e}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-[#8f8f8f]">
              Intrusive panic and court hearing anxiety patterns detected.
            </p>
          </div>
        </div>
      </div>

      {/* D. EXPLAINABLE AI PANEL ("WHY DID THE RISK SCORE INCREASE?") */}
      <div className="bg-white border border-[#ebebeb] p-6 rounded-2xl shadow-xs space-y-6">
        <div className="border-b border-[#ebebeb] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0070f3]" />
              <h2 className="text-lg font-bold text-[#171717] tracking-tight">
                Why Did the Risk Score Increase? (Explainable Risk Factors)
              </h2>
            </div>
            <p className="text-xs text-[#8f8f8f] mt-0.5">
              SHAP feature attributions giving human counsellors transparent rationale for score change.
            </p>
          </div>
          <span className="bg-blue-50 text-[#0070f3] text-xs font-mono font-medium px-3 py-1 rounded-full border border-blue-200">
            XAI SHAP Feature Attributions
          </span>
        </div>

        {/* Horizontal Contribution Visualization */}
        <div className="space-y-4">
          {caseData.explainableFactors.map((factor, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-[#171717]">
                <span className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-red-600">+{factor.contribution} pts</span>
                  <span className="font-semibold">{factor.factor}</span>
                </span>
                <span className="text-[#8f8f8f] text-[11px]">{factor.description}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-red-600 rounded-full transition-all duration-500"
                  style={{ width: `${(factor.contribution / 30) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Plain English Primary Contributing Signals Summary */}
        <div className="bg-[#fafafa] border border-[#ebebeb] p-4 rounded-xl space-y-2">
          <h4 className="text-xs font-bold text-[#171717] uppercase font-mono">Primary Contributing Signals Summary</h4>
          <ol className="text-xs text-[#4d4d4d] space-y-1 list-decimal list-inside leading-relaxed">
            <li>Negative sentiment increased significantly across recent check-in messages.</li>
            <li>Engagement response interval decreased compared with the baseline period.</li>
            <li>Anxiety-related language regarding upcoming court testimony became more frequent.</li>
            <li>Voice-stress indicators (spectral jitter) showed acoustic micro-tremors.</li>
          </ol>
        </div>

        {/* Mandatory Safety Disclaimer */}
        <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl flex items-start space-x-3 text-xs text-amber-900">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">Safety & Ethical Governance Disclaimer</p>
            <p className="leading-relaxed">
              SAHAY is an explainable decision-support prototype. Risk indicators are reviewed by authorized human professionals and do not constitute an autonomous clinical or legal decision.
            </p>
          </div>
        </div>
      </div>

      {/* E. RECOMMENDED INTERVENTIONS PANEL */}
      <div className="bg-white border border-[#ebebeb] p-6 rounded-2xl shadow-xs space-y-6">
        <div className="border-b border-[#ebebeb] pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#171717]">Recommended Interventions Panel</h2>
            <p className="text-xs text-[#8f8f8f]">
              Targeted support workflows generated from explainable distress factors.
            </p>
          </div>
          <span className="text-xs font-mono text-[#0070f3] font-semibold">
            {caseData.interventions.length} Actionable Recommendations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {caseData.interventions.map((item) => {
            const isAssigned = item.status === 'Assigned' || item.status === 'Completed' || item.status === 'Scheduled';
            return (
              <div 
                key={item.id}
                className={`p-5 rounded-2xl border transition space-y-3 flex flex-col justify-between ${
                  isAssigned
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-[#ebebeb] bg-[#fafafa] hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#171717]">{item.title}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      item.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.priority} Priority
                    </span>
                  </div>

                  <p className="text-xs text-[#4d4d4d] leading-relaxed">
                    <strong className="text-[#171717]">Reason:</strong> {item.reason}
                  </p>

                  <div className="text-[11px] text-[#8f8f8f] font-mono space-y-0.5">
                    <div>Dept: {item.department}</div>
                    {item.assignedTo && (
                      <div className="text-emerald-700 font-medium">Assigned To: {item.assignedTo}</div>
                    )}
                    {item.nextFollowUp && (
                      <div className="text-slate-600">Next Follow-up: {item.nextFollowUp}</div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#ebebeb] flex items-center justify-between">
                  <span className={`text-[11px] font-mono font-semibold ${
                    isAssigned ? 'text-emerald-700' : 'text-slate-500'
                  }`}>
                    Status: {item.status}
                  </span>

                  <div className="flex items-center space-x-2">
                    {!isAssigned ? (
                      <button
                        onClick={() => openActionModal(item)}
                        className="px-3.5 py-1.5 rounded-md bg-[#171717] text-white text-xs font-medium hover:bg-black transition shadow-xs flex items-center space-x-1"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-[#0070f3]" />
                        <span>Assign Counsellor</span>
                      </button>
                    ) : (
                      <span className="flex items-center text-xs text-emerald-700 font-semibold font-mono">
                        <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                        Action Recorded
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* F. CASE TIMELINE */}
      <div className="bg-white border border-[#ebebeb] p-6 rounded-2xl shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[#171717]">Chronological Case Timeline</h2>
          <p className="text-xs text-[#8f8f8f]">
            Complete auditable history of check-ins, AI analysis triggers, and counsellor actions.
          </p>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#ebebeb]">
          {caseData.timeline.map((event) => (
            <div key={event.id} className="relative group">
              <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white ${
                event.type === 'alert' 
                  ? 'border-red-500 bg-red-500' 
                  : event.type === 'action' 
                  ? 'border-emerald-500 bg-emerald-500' 
                  : 'border-[#0070f3]'
              }`} />

              <div className="bg-[#fafafa] border border-[#ebebeb] p-4 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#171717]">{event.title}</span>
                  <span className="font-mono text-[#8f8f8f] text-[11px]">{event.date} at {event.time}</span>
                </div>
                <p className="text-xs text-[#4d4d4d] leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INTERVENTION ASSIGNMENT MODAL */}
      {activeModalIntervention && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#ebebeb] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-[#ebebeb] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#0070f3] uppercase font-bold">OPERATIONAL ASSIGNMENT</span>
                <h3 className="text-base font-bold text-[#171717] mt-0.5">
                  Confirm Intervention Assignment
                </h3>
              </div>
              <button 
                onClick={() => setActiveModalIntervention(null)}
                className="text-[#8f8f8f] hover:text-[#171717]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#fafafa] border border-[#ebebeb] p-4 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-[#171717]">{activeModalIntervention.title}</div>
              <p className="text-[#4d4d4d]">{activeModalIntervention.reason}</p>
              <div className="text-[11px] font-mono text-[#8f8f8f]">
                Dept: {activeModalIntervention.department}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#171717] mb-1">Assign Designated Specialist:</label>
                <select
                  value={modalAssignedOfficer}
                  onChange={(e) => setModalAssignedOfficer(e.target.value)}
                  className="w-full bg-[#fafafa] border border-[#ebebeb] rounded-lg p-2 text-xs text-[#171717]"
                >
                  <option value="Dr. Sunita Sharma (Sr. Trauma Specialist)">Dr. Sunita Sharma (Sr. Trauma Specialist)</option>
                  <option value="District Legal Services Officer (DLSA)">District Legal Services Officer (DLSA)</option>
                  <option value="Dr. Anita Roy (Crisis Unit)">Dr. Anita Roy (Crisis Unit)</option>
                  <option value="MoSJE District Rehabilitation Officer">MoSJE District Rehabilitation Officer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#171717] mb-1">Scheduled Follow-up Date:</label>
                <input
                  type="text"
                  value={modalFollowUpDate}
                  onChange={(e) => setModalFollowUpDate(e.target.value)}
                  className="w-full bg-[#fafafa] border border-[#ebebeb] rounded-lg p-2 text-xs text-[#171717]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#ebebeb] flex items-center justify-end space-x-3">
              <button
                onClick={() => setActiveModalIntervention(null)}
                className="px-4 py-2 rounded-md bg-white border border-[#ebebeb] text-xs font-medium text-[#4d4d4d] hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmIntervention}
                className="px-5 py-2 rounded-md bg-[#171717] hover:bg-black text-white text-xs font-semibold shadow-xs flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Confirm Assignment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
