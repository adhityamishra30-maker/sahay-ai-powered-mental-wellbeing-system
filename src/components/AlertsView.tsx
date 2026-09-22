import React, { useState } from 'react';
import type { AlertItem, AuditLogItem } from '../data/mockData';
import { getRiskCategory } from '../data/mockData';
import { AlertTriangle, CheckCircle2, ChevronRight, Filter, Inbox, Info } from 'lucide-react';

interface AlertsViewProps {
  alerts: AlertItem[];
  onSelectCase: (caseId: string) => void;
  onUpdateAlertStatus: (alertId: string, status: 'Open' | 'Acknowledged' | 'Assigned' | 'Resolved') => void;
  onAddAuditLog: (log: AuditLogItem) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onSelectCase,
  onUpdateAlertStatus,
  onAddAuditLog
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredAlerts = alerts.filter(a => {
    const category = getRiskCategory(a.riskScore);
    const matchesSev = filterSeverity === 'All' || a.severity === filterSeverity || category === filterSeverity;
    const matchesStat = filterStatus === 'All' || a.status === filterStatus;
    return matchesSev && matchesStat;
  });

  const handleStatusChange = (alert: AlertItem, newStatus: 'Open' | 'Acknowledged' | 'Assigned' | 'Resolved') => {
    onUpdateAlertStatus(alert.id, newStatus);
    onAddAuditLog({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: "Dr. Sunita Sharma",
      role: "Senior Counsellor",
      action: `ALERT_${newStatus.toUpperCase()}`,
      targetCase: alert.caseId,
      details: `Alert ${alert.id} status updated to ${newStatus}. Decision recorded in audit log.`
    });

    setToastMessage(`Alert ${alert.id} status updated to '${newStatus}'. Recorded in system audit.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#171717] text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-3 text-xs font-mono animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-b border-[#ebebeb] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#171717]">
              Real-Time Risk Alerts & Triage
            </h1>
            <span className="bg-red-50 text-red-700 text-xs font-mono font-medium px-2.5 py-0.5 rounded border border-red-200 uppercase">
              HIGH PRIORITY QUEUE
            </span>
          </div>
          <p className="text-xs text-[#8f8f8f] mt-1">
            Automated notifications generated when victim distress score crosses dynamic risk thresholds.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#ebebeb] p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-[#171717]">Filter Severity:</span>
          {['All', 'Critical', 'High', 'Moderate'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                filterSeverity === sev 
                  ? 'bg-[#171717] text-white shadow-xs' 
                  : 'bg-[#fafafa] text-[#4d4d4d] border border-[#ebebeb] hover:bg-slate-100'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-[#171717]">Filter Status:</span>
          {['All', 'Open', 'Acknowledged', 'Assigned', 'Resolved'].map((stat) => (
            <button
              key={stat}
              onClick={() => setFilterStatus(stat)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                filterStatus === stat 
                  ? 'bg-[#0070f3] text-white shadow-xs' 
                  : 'bg-[#fafafa] text-[#4d4d4d] border border-[#ebebeb] hover:bg-slate-100'
              }`}
            >
              {stat}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Grid List or Empty State */}
      {filteredAlerts.length > 0 ? (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const isCritical = alert.riskScore >= 75;
            const category = getRiskCategory(alert.riskScore);
            return (
              <div 
                key={alert.id}
                className={`bg-white border p-6 rounded-2xl shadow-xs transition space-y-4 ${
                  isCritical ? 'border-red-200 bg-red-50/20' : 'border-[#ebebeb] hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f2f2f2] pb-3">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${
                      category === 'Critical'
                        ? 'bg-[#ee0000] text-white' 
                        : category === 'High' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {category.toUpperCase()} SEVERITY
                    </span>
                    <span className="font-mono font-bold text-sm text-[#171717]">Alert ID: {alert.id}</span>
                    <span className="text-xs text-[#8f8f8f]">• Case {alert.caseId} ({alert.victimAlias})</span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-[#8f8f8f] font-mono">
                    <span>Timestamp: {alert.time}</span>
                    <span>|</span>
                    <span>Assigned: {alert.assignedOfficer}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono uppercase text-[#8f8f8f]">Risk Score Increase</span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-[#ee0000]">{alert.riskScore} / 100</span>
                      <span className="text-xs font-mono font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                        +{alert.change} pts change
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">District: {alert.district}</p>
                    {alert.location && (
                      <p className="text-[11px] text-blue-700">
                        Current location shared: {alert.location.latitude}, {alert.location.longitude} (accuracy +/- {alert.location.accuracy}m)
                      </p>
                    )}
                    {alert.riskScore >= 70 && (
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-semibold text-emerald-700">Auto-assigned from available counsellor queue</p>
                        <p className="text-[11px] font-semibold text-amber-700">Authority alerted: {alert.authorityRecipient || 'District Authority (MoSJE Officer)'}</p>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2 space-y-2">
                    <span className="text-[11px] font-mono uppercase text-[#8f8f8f]">Detected Risk Signals (SHAP Vector)</span>
                    <div className="flex flex-wrap gap-1.5">
                      {alert.detectedFactors.map((factor, idx) => (
                        <span key={idx} className="bg-[#fafafa] border border-[#ebebeb] text-slate-700 text-xs px-2.5 py-1 rounded">
                          • {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#f2f2f2] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-[#171717]">Current Status:</span>
                    <span className="text-xs font-mono font-bold text-[#0070f3] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                      {alert.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {alert.status !== 'Acknowledged' && alert.status !== 'Resolved' && (
                      <button
                        onClick={() => handleStatusChange(alert, 'Acknowledged')}
                        className="px-3.5 py-1.5 rounded-md bg-white border border-[#ebebeb] text-xs font-medium text-[#171717] hover:bg-slate-50 transition"
                      >
                        Acknowledge
                      </button>
                    )}
                    {alert.status !== 'Resolved' && (
                      <button
                        onClick={() => handleStatusChange(alert, 'Resolved')}
                        className="px-3.5 py-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium hover:bg-emerald-100 transition"
                      >
                        Mark Resolved
                      </button>
                    )}
                    <button
                      onClick={() => onSelectCase(alert.caseId)}
                      className="px-4 py-1.5 rounded-md bg-[#171717] text-white text-xs font-medium hover:bg-black transition flex items-center space-x-1 shadow-xs"
                    >
                      <span>Review Case</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-[#ebebeb] rounded-2xl p-12 text-center space-y-3">
          <Inbox className="w-8 h-8 mx-auto text-slate-300" />
          <h3 className="text-base font-semibold text-[#171717]">No alerts match your filter selection</h3>
          <p className="text-xs text-[#8f8f8f]">All high priority alerts for this filter criteria have been addressed.</p>
          <button
            onClick={() => { setFilterSeverity('All'); setFilterStatus('All'); }}
            className="px-4 py-2 bg-[#171717] text-white text-xs font-medium rounded-md hover:bg-black transition"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
