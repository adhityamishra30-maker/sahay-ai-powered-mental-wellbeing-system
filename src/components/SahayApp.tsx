import React, { useEffect, useState } from 'react';
import { 
  INITIAL_CASES, 
  INITIAL_ALERTS, 
  COUNSELLOR_AVAILABILITY,
  getAuthorityRecipient,
  getRiskCategory
} from '../data/mockData';
import type { CaseData, AlertItem, AuditLogItem, CheckinRecord, SensitiveSupportRecord } from '../data/mockData';
import { Navbar } from './Navbar';
import { LandingView } from './LandingView';
import { CounsellorDashboard } from './CounsellorDashboard';
import { CaseDetailView } from './CaseDetailView';
import { AlertsView } from './AlertsView';
import { VictimCheckinView } from './VictimCheckinView';
import { DistrictAnalyticsView } from './DistrictAnalyticsView';
import { PrivacyAuditView } from './PrivacyAuditView';
import { AuthRoleModal } from './AuthRoleModal';

export const SahayApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [activeRole, setActiveRole] = useState<string>('Victim / Complainant');
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; name: string; role: string; title?: string; accountType?: string } | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('SAHAY-1042');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const isVictimRole = activeRole === 'Victim / Complainant';
  const isStaff = currentUser?.accountType === 'counsellor' || currentUser?.accountType === 'authority';
  const victimAllowedTabs = ['landing', 'checkin', 'privacy'];
  const effectiveCurrentTab = isVictimRole && !victimAllowedTabs.includes(currentTab)
    ? 'landing'
    : currentTab;

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('sahay-theme');
    setIsDarkMode(savedTheme === 'dark');
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.body.classList.toggle('sahay-dark', isDarkMode);
    window.localStorage.setItem('sahay-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Stateful Data Collections
  const [cases, setCases] = useState<CaseData[]>(INITIAL_CASES);
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);
  const [sensitiveRecords, setSensitiveRecords] = useState<SensitiveSupportRecord[]>([]);

  // Unread open alerts count
  const unreadAlertsCount = alerts.filter(a => a.status === 'Open').length;

  const selectedCaseData = cases.find(c => c.id === selectedCaseId) || cases[0];

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentTab('casedetail');

    // Add Audit Log
    const newLog: AuditLogItem = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: activeRole,
      role: activeRole,
      action: "VIEW_CASE_DETAILS",
      targetCase: caseId,
      details: `Opened comprehensive XAI distress profile and longitudinal trajectory for ${caseId}.`
    };
    handleAddAuditLog(newLog);
  };

  const handleUpdateIntervention = (
    caseId: string, 
    interventionId: string, 
    newStatus: string, 
    assignedTo?: string, 
    nextFollowUp?: string
  ) => {
    setCases(prevCases => prevCases.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          status: 'Intervention Active',
          assignedCounsellor: assignedTo || c.assignedCounsellor,
          interventions: c.interventions.map(item => {
            if (item.id === interventionId) {
              return { 
                ...item, 
                status: newStatus as any, 
                assignedTo: assignedTo || item.assignedTo,
                nextFollowUp: nextFollowUp || item.nextFollowUp
              };
            }
            return item;
          })
        };
      }
      return c;
    }));
  };

  const handleAddTimelineEvent = (
    caseId: string, 
    event: { id: string; date: string; time: string; title: string; description: string; type: 'system' | 'checkin' | 'alert' | 'action' }
  ) => {
    setCases(prevCases => prevCases.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          timeline: [event, ...c.timeline]
        };
      }
      return c;
    }));
  };

  const handleUpdateAlertStatus = (alertId: string, status: 'Open' | 'Acknowledged' | 'Assigned' | 'Resolved') => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status } : a));
  };

  const handleAddNewCheckinAlert = (newAlert: AlertItem) => {
    const availableCounsellors = COUNSELLOR_AVAILABILITY
      .filter(counsellor => counsellor.available)
      .map(counsellor => ({
        ...counsellor,
        activeCases: counsellor.activeCases + prevCaseCount(counsellor.name)
      }))
      .sort((a, b) => a.activeCases - b.activeCases);
    const assignedCounsellor = availableCounsellors[0]?.name || 'On-call counsellor';
    const authorityRecipient = getAuthorityRecipient(newAlert.riskScore);
    const assignedAlert = {
      ...newAlert,
      assignedOfficer: assignedCounsellor,
      authorityRecipient
    };

    setAlerts(prev => [assignedAlert, ...prev]);
    setCases(prevCases => prevCases.map(caseData => {
      if (caseData.id !== 'SAHAY-1042') return caseData;
      return {
        ...caseData,
        previousScore: caseData.currentScore,
        currentScore: newAlert.riskScore,
        riskLevel: getRiskCategory(newAlert.riskScore),
        trend: newAlert.riskScore > caseData.currentScore ? 'Escalating' : newAlert.riskScore < caseData.currentScore ? 'Improving' : 'Stable',
        lastCheckIn: 'Just now (Live AI Check-in)',
        assignedCounsellor: assignedCounsellor,
        status: newAlert.riskScore >= 70 ? 'Requires Human Review' : caseData.status
      };
    }));

    function prevCaseCount(counsellorName: string) {
      return alerts.filter(alert => alert.assignedOfficer === counsellorName && alert.status !== 'Resolved').length;
    }
  };

  // Staff actions are recorded server-side; actor and role come from the signed-in session.
  // Victim check-ins are audited by the server when they are saved, so nothing is sent from here.
  const handleAddAuditLog = (log: AuditLogItem) => {
    if (!isStaff) return;
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: log.action, targetCase: log.targetCase, details: log.details })
    }).catch(() => undefined);
  };

  const handleSaveCheckin = (checkin: Omit<CheckinRecord, 'id' | 'timestamp'>) => {
    const record: CheckinRecord = {
      ...checkin,
      id: `CHECKIN-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleString()
    };
    setCheckins(prev => [record, ...prev]);
  };

  const handleSaveSensitiveContact = (record: Omit<SensitiveSupportRecord, 'id' | 'timestamp'>) => {
    const savedRecord: SensitiveSupportRecord = { ...record, id: `SAFE-${Date.now().toString().slice(-6)}`, timestamp: new Date().toLocaleString() };
    setSensitiveRecords(prev => [savedRecord, ...prev]);
  };

  const handleRoleSelect = (role: string, targetTab: string, userDetails?: any) => {
    setActiveRole(role);
    setCurrentTab(targetTab);
    if (userDetails) {
      setCurrentUser(userDetails);
    }
  };

  const enterVictimMode = () => {
    if (currentUser?.accountType) {
      fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    }
    setActiveRole('Victim / Complainant');
    setCurrentUser(null);
    setCurrentTab('landing');
  };

  return (
    <div className="sahay-care-theme min-h-screen flex flex-col bg-[#fafafa] text-[#171717] transition-colors duration-300">
      {/* Top Navbar */}
      <Navbar
        currentTab={effectiveCurrentTab}
        setCurrentTab={setCurrentTab}
        activeRole={activeRole}
        openRoleModal={() => setIsRoleModalOpen(true)}
        unreadAlertsCount={unreadAlertsCount}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(prev => !prev)}
      />

      {/* Main View Renderer */}
      <main className="flex-1 overflow-hidden">
        {effectiveCurrentTab === 'landing' && (
          <div key="landing" className="tab-panel">
            <LandingView
              onNavigate={(tab) => setCurrentTab(tab)}
              openRoleModal={() => setIsRoleModalOpen(true)}
              enterVictimMode={enterVictimMode}
              activeRole={activeRole}
            />
          </div>
        )}

        {effectiveCurrentTab === 'counsellor' && (
          <div key="counsellor" className="tab-panel">
            <CounsellorDashboard
              cases={cases}
              alerts={alerts}
              checkins={checkins}
              sensitiveRecords={sensitiveRecords}
              onSelectCase={handleSelectCase}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              activeRole={activeRole}
              currentUser={currentUser}
            />
          </div>
        )}

        {effectiveCurrentTab === 'casedetail' && (
          <div key="casedetail" className="tab-panel">
            <CaseDetailView
              caseData={selectedCaseData}
              onBackToDashboard={() => setCurrentTab('counsellor')}
              onUpdateIntervention={handleUpdateIntervention}
              onAddAuditLog={handleAddAuditLog}
              onAddTimelineEvent={handleAddTimelineEvent}
            />
          </div>
        )}

        {effectiveCurrentTab === 'alerts' && (
          <div key="alerts" className="tab-panel">
            <AlertsView
              alerts={alerts}
              onSelectCase={handleSelectCase}
              onUpdateAlertStatus={handleUpdateAlertStatus}
              onAddAuditLog={handleAddAuditLog}
            />
          </div>
        )}

        {effectiveCurrentTab === 'checkin' && (
          <div key="checkin" className="tab-panel">
            <VictimCheckinView
              onAddNewCheckinAlert={handleAddNewCheckinAlert}
              onSaveCheckin={handleSaveCheckin}
              onSaveSensitiveContact={handleSaveSensitiveContact}
              onAddAuditLog={handleAddAuditLog}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          </div>
        )}

        {effectiveCurrentTab === 'analytics' && (
          <div key="analytics" className="tab-panel">
            <DistrictAnalyticsView />
          </div>
        )}

        {effectiveCurrentTab === 'privacy' && (
          <div key="privacy" className="tab-panel">
            <PrivacyAuditView
              isStaff={isStaff}
              isRegisteredVictim={currentUser?.accountType === 'registered_victim'}
              onAccountDeleted={enterVictimMode}
            />
          </div>
        )}
      </main>

      {/* Auth Role Selection Modal */}
      <AuthRoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        onRoleSelect={handleRoleSelect}
      />

      {/* Persistent Footer */}
      <footer className="border-t border-[#ebebeb] bg-[#fafafa] py-8 text-xs text-[#8f8f8f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-[#171717]">SAHAY Platform</span> • Ministry of Social Justice & Empowerment (MoSJE)
          </div>
          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <button onClick={() => setCurrentTab('privacy')} className="hover:underline">Privacy & data use</button>
            <span>•</span>
            <button onClick={() => setCurrentTab('privacy')} className="hover:underline">System Audit</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
