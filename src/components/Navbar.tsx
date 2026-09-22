import React from 'react';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  MessageSquare, 
  BarChart3, 
  Lock, 
  UserCheck, 
  Layers, 
  ChevronRight,
  Moon,
  Sun,
  Home
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeRole: string;
  openRoleModal: () => void;
  unreadAlertsCount: number;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  activeRole,
  openRoleModal,
  unreadAlertsCount,
  isDarkMode,
  toggleDarkMode
}) => {
  const isVictimRole = activeRole === 'Victim / Complainant';

  const navItems = isVictimRole ? [
    { id: 'landing', label: 'Overview', icon: Shield },
    { id: 'checkin', label: 'Support Check-in', icon: MessageSquare },
    { id: 'privacy', label: 'Privacy & Security', icon: Lock },
  ] : [
    { id: 'landing', label: 'Overview', icon: Shield },
    { id: 'counsellor', label: 'Cases', icon: Activity },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: unreadAlertsCount },
    { id: 'checkin', label: 'Victim Check-in', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'privacy', label: 'Privacy & Security', icon: Lock },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#ebebeb] bg-[#fafafa]/90 backdrop-blur-md">
      <div className="bg-[#0f172a] text-white px-4 py-1.5 text-xs flex flex-wrap justify-between items-center border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="text-slate-300 font-medium text-xs hidden md:inline">
            Ministry of Social Justice & Empowerment (MoSJE)
          </span>
          <span className="text-slate-500 hidden lg:inline">|</span>
          <span className="text-slate-400 text-xs hidden lg:inline">
            Software / MedTech Category
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] text-slate-300">
          <span className="flex items-center text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
            Dynamic Decision Support Active
          </span>
          <span className="text-slate-600">|</span>
          <button 
            onClick={openRoleModal}
            className="flex items-center space-x-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 px-2.5 py-0.5 rounded border border-slate-700 transition"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#0070f3]" />
            <span>Role: <strong className="text-white">{activeRole}</strong></span>
          </button>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Project Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('landing')}>
              <div className="w-10 h-10 rounded-lg bg-[#0f172a] text-white flex items-center justify-center shadow-sm border border-slate-800">
                <span className="font-bold font-mono text-lg tracking-wider text-[#0070f3]">S</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xl tracking-tight text-[#171717]">SAHAY</span>
                </div>
                <p className="text-[11px] text-[#8f8f8f] hidden sm:block">
                  AI Victim Well-being & Distress Monitoring System
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setCurrentTab('landing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-label="Go to home overview"
              title="Home overview"
              className="p-2 rounded-md border border-[#ebebeb] bg-white text-[#4d4d4d] hover:text-[#0070f3] hover:bg-[#f2f2f2] transition"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  aria-pressed={isActive}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 active:scale-95 cursor-pointer ${
                    isActive
                      ? 'bg-[#171717] text-white shadow-sm ring-1 ring-black/10 scale-[1.02]'
                      : 'text-[#4d4d4d] hover:text-[#171717] hover:bg-[#ebebeb]/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-[#0070f3] scale-110' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono transition-transform ${
                      isActive ? 'bg-[#ee0000] text-white scale-105' : 'bg-[#ee0000]/10 text-[#ee0000]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-md border border-[#ebebeb] bg-white text-[#4d4d4d] hover:text-[#171717] hover:bg-[#f2f2f2] transition"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <select
              value={currentTab}
              onChange={(e) => setCurrentTab(e.target.value)}
              className="lg:hidden text-xs bg-white border border-[#ebebeb] rounded-md px-2.5 py-1.5 text-[#171717] font-medium"
            >
              {navItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label} {item.badge ? `(${item.badge})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
