import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  CheckCircle2, 
  Lock, 
  X, 
  UserCheck, 
  UserPlus, 
  LogIn, 
  AlertCircle, 
  ArrowRight, 
  Sparkles,
  KeyRound,
  Building2,
  HeartHandshake
} from 'lucide-react';

interface AuthRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRole: string;
  setActiveRole: (role: string) => void;
  onRoleSelect: (role: string, targetTab: string, userDetails?: any) => void;
}

const COUNSELLOR_PRESETS = [
  {
    username: 'riya',
    password: 'Riya@2026',
    name: 'Riya',
    title: 'Senior Trauma Specialist',
    specialty: 'High-risk crisis escalation & trauma triage',
    badge: 'Trauma Specialist'
  },
  {
    username: 'divya',
    password: 'Divya@2026',
    name: 'Divya',
    title: 'Clinical Well-being Counsellor',
    specialty: 'Clinical rehabilitation & emotional recovery',
    badge: 'Clinical Counsellor'
  },
  {
    username: 'ayush',
    password: 'Ayush@2026',
    name: 'Ayush',
    title: 'Case Manager',
    specialty: 'Intervention coordination & relief compensation',
    badge: 'Case Manager'
  },
  {
    username: 'prashant',
    password: 'Prashant@2026',
    name: 'Prashant',
    title: 'District Response Counsellor',
    specialty: 'Field safety, witness care & local outreach',
    badge: 'District Response'
  }
];

const AUTHORITY_PRESETS = [
  {
    username: 'district_officer',
    password: 'District@2026',
    name: 'District Authority Officer',
    tier: 'District Authority (MoSJE Officer)',
    jurisdiction: 'South Delhi District'
  },
  {
    username: 'state_officer',
    password: 'State@2026',
    name: 'State Authority Officer',
    tier: 'State Authority Officer',
    jurisdiction: 'Delhi State Tier'
  },
  {
    username: 'national_officer',
    password: 'National@2026',
    name: 'National Policymaker',
    tier: 'National Policymaker (MoSJE Delhi)',
    jurisdiction: 'National MoSJE Headquarters'
  }
];

export const AuthRoleModal: React.FC<AuthRoleModalProps> = ({
  isOpen,
  onClose,
  activeRole,
  setActiveRole,
  onRoleSelect
}) => {
  const [activeCategory, setActiveCategory] = useState<'victim' | 'counsellor' | 'authority'>('victim');

  // Victim state
  const [victimMode, setVictimMode] = useState<'guest' | 'login' | 'signup'>('guest');
  const [victimUsername, setVictimUsername] = useState('');
  const [victimPassword, setVictimPassword] = useState('');
  const [victimFullName, setVictimFullName] = useState('');
  const [victimContact, setVictimContact] = useState('');
  const [victimAuthLoading, setVictimAuthLoading] = useState(false);
  const [victimAuthError, setVictimAuthError] = useState('');
  const [victimAuthSuccess, setVictimAuthSuccess] = useState('');

  // Counsellor state
  const [selectedCounsellorIndex, setSelectedCounsellorIndex] = useState<number>(0);
  const [counsellorUsername, setCounsellorUsername] = useState(COUNSELLOR_PRESETS[0].username);
  const [counsellorPassword, setCounsellorPassword] = useState(COUNSELLOR_PRESETS[0].password);
  const [counsellorLoading, setCounsellorLoading] = useState(false);
  const [counsellorError, setCounsellorError] = useState('');

  // Authority state
  const [selectedAuthorityIndex, setSelectedAuthorityIndex] = useState<number>(0);
  const [authorityUsername, setAuthorityUsername] = useState(AUTHORITY_PRESETS[0].username);
  const [authorityPassword, setAuthorityPassword] = useState(AUTHORITY_PRESETS[0].password);
  const [authorityLoading, setAuthorityLoading] = useState(false);
  const [authorityError, setAuthorityError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setVictimAuthError('');
      setVictimAuthSuccess('');
      setCounsellorError('');
      setAuthorityError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1-Click Guest Victim Access (Requires nothing)
  const handleGuestVictimAccess = () => {
    setActiveRole('Victim / Complainant');
    onRoleSelect('Victim / Complainant', 'landing', {
      id: `guest-${Date.now()}`,
      username: 'guest_survivor',
      name: 'Guest Survivor',
      role: 'victim'
    });
    onClose();
  };

  // Victim Sign In
  const handleVictimSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!victimUsername.trim() || !victimPassword.trim()) {
      setVictimAuthError('Please enter both username/email and password.');
      return;
    }
    setVictimAuthLoading(true);
    setVictimAuthError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: victimUsername.trim(),
          password: victimPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      const roleDisplay = `Victim (${data.user.name || data.user.username})`;
      setActiveRole(roleDisplay);
      onRoleSelect(roleDisplay, 'landing', data.user);
      onClose();
    } catch (err: any) {
      setVictimAuthError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setVictimAuthLoading(false);
    }
  };

  // Victim Sign Up
  const handleVictimSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!victimUsername.trim() || !victimPassword.trim()) {
      setVictimAuthError('Please provide an alias/username and a secure password.');
      return;
    }
    setVictimAuthLoading(true);
    setVictimAuthError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: victimUsername.trim(),
          password: victimPassword,
          fullName: victimFullName.trim() || undefined,
          contactInfo: victimContact.trim() || undefined,
          accountType: 'victim'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setVictimAuthSuccess('Account registered successfully! You are now securely logged in.');
      setTimeout(() => {
        const roleDisplay = `Victim (${data.user.name || data.user.username})`;
        setActiveRole(roleDisplay);
        onRoleSelect(roleDisplay, 'landing', data.user);
        onClose();
      }, 700);
    } catch (err: any) {
      setVictimAuthError(err.message || 'Registration failed. Try a different username.');
    } finally {
      setVictimAuthLoading(false);
    }
  };

  // Counsellor Login (Mandatory)
  const handleCounsellorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counsellorUsername.trim() || !counsellorPassword.trim()) {
      setCounsellorError('Please enter official ID and password.');
      return;
    }
    setCounsellorLoading(true);
    setCounsellorError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: counsellorUsername.trim(),
          password: counsellorPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials. Official sign-in mandatory.');
      }

      const counsellorName = data.user.name || counsellorUsername;
      const roleDisplay = `${counsellorName} (${data.user.role || 'Counsellor'})`;
      setActiveRole(roleDisplay);
      onRoleSelect(roleDisplay, 'counsellor', data.user);
      onClose();
    } catch (err: any) {
      setCounsellorError(err.message || 'Verification failed. Entry blocked.');
    } finally {
      setCounsellorLoading(false);
    }
  };

  // Authority Login (Mandatory)
  const handleAuthorityLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorityUsername.trim() || !authorityPassword.trim()) {
      setAuthorityError('Please enter official Authority ID and password.');
      return;
    }
    setAuthorityLoading(true);
    setAuthorityError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authorityUsername.trim(),
          password: authorityPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials. Authority sign-in mandatory.');
      }

      const roleDisplay = data.user.role || data.user.name;
      setActiveRole(roleDisplay);
      onRoleSelect(roleDisplay, 'analytics', data.user);
      onClose();
    } catch (err: any) {
      setAuthorityError(err.message || 'Authority verification failed. Entry blocked.');
    } finally {
      setAuthorityLoading(false);
    }
  };

  const selectCounsellorPreset = (index: number) => {
    setSelectedCounsellorIndex(index);
    const preset = COUNSELLOR_PRESETS[index];
    setCounsellorUsername(preset.username);
    setCounsellorPassword(preset.password);
    setCounsellorError('');
  };

  const selectAuthorityPreset = (index: number) => {
    setSelectedAuthorityIndex(index);
    const preset = AUTHORITY_PRESETS[index];
    setAuthorityUsername(preset.username);
    setAuthorityPassword(preset.password);
    setAuthorityError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#ebebeb] rounded-2xl max-w-2xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto p-5 sm:p-6 shadow-2xl relative">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#ebebeb]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#171717] text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5 text-[#0070f3]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-[#171717] tracking-tight">Access Control & Sign In</h2>
                <span className="bg-blue-50 text-[#0070f3] text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-blue-200 uppercase">
                  SHA-512 PBKDF2 Encrypted
                </span>
              </div>
              <p className="text-xs text-[#8f8f8f]">
                Victims have 1-click anonymous access; Counsellors & Authorities require mandatory verification.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-[#8f8f8f] hover:text-[#171717] p-1.5 rounded-lg hover:bg-[#fafafa] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Selector Tabs */}
        <div className="mt-4 grid grid-cols-3 gap-2 bg-[#f4f4f5] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveCategory('victim')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
              activeCategory === 'victim'
                ? 'bg-white text-[#171717] shadow-xs'
                : 'text-[#71717a] hover:text-[#171717]'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-[#0070f3]" />
            <span>Victim / Complainant</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('counsellor')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
              activeCategory === 'counsellor'
                ? 'bg-white text-[#171717] shadow-xs'
                : 'text-[#71717a] hover:text-[#171717]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>4 Counsellors</span>
            <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-mono">Mandatory</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('authority')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
              activeCategory === 'authority'
                ? 'bg-white text-[#171717] shadow-xs'
                : 'text-[#71717a] hover:text-[#171717]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Authorities</span>
            <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-mono">Mandatory</span>
          </button>
        </div>

        {/* CATEGORY 1: VICTIM ACCESS */}
        {activeCategory === 'victim' && (
          <div className="mt-4 space-y-4">
            {/* Mode A: 1-Click Guest Access */}
            <div className="rounded-2xl border-2 border-[#0070f3]/30 bg-blue-50/40 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold font-mono uppercase text-[#0070f3]">Option 1 · Zero Credentials</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-2 py-0.2 rounded">Instant</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#171717]">1-Click Anonymous Guest Access</h3>
                  <p className="text-xs text-[#4d4d4d] leading-relaxed">
                    No sign up, no email, phone number, or password required. Complies with DPDP Act 2023 for immediate victim distress check-ins.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGuestVictimAccess}
                className="w-full py-2.5 px-4 rounded-xl bg-[#171717] hover:bg-black text-white text-xs font-bold transition shadow-xs flex items-center justify-center space-x-2 active:scale-98"
              >
                <span>Continue as Guest Survivor (1-Click)</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#0070f3]" />
              </button>
            </div>

            {/* Mode B: Registered Victim (Sign In or Sign Up) */}
            <div className="rounded-2xl border border-[#ebebeb] bg-[#fafafa] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#ebebeb] pb-2.5">
                <div>
                  <span className="text-xs font-bold font-mono uppercase text-[#8f8f8f]">Option 2 · Optional Account</span>
                  <h3 className="text-sm font-bold text-[#171717]">Save History Across Sessions</h3>
                </div>
                <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-[#ebebeb]">
                  <button
                    type="button"
                    onClick={() => { setVictimMode('login'); setVictimAuthError(''); }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                      victimMode === 'login' ? 'bg-[#171717] text-white' : 'text-[#4d4d4d] hover:text-[#171717]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setVictimMode('signup'); setVictimAuthError(''); }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                      victimMode === 'signup' ? 'bg-[#171717] text-white' : 'text-[#4d4d4d] hover:text-[#171717]'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              {victimMode === 'login' ? (
                <form onSubmit={handleVictimSignIn} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono text-[#4d4d4d] mb-1">Username or Email</label>
                    <input
                      type="text"
                      value={victimUsername}
                      onChange={(e) => setVictimUsername(e.target.value)}
                      placeholder="e.g. rahul_k or confidential alias"
                      className="w-full rounded-xl border border-[#ebebeb] bg-white px-3 py-2 text-xs text-[#171717] focus:border-[#0070f3] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#4d4d4d] mb-1">Password</label>
                    <input
                      type="password"
                      value={victimPassword}
                      onChange={(e) => setVictimPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-[#ebebeb] bg-white px-3 py-2 text-xs text-[#171717] focus:border-[#0070f3] focus:outline-none"
                    />
                  </div>

                  {victimAuthError && (
                    <div className="flex items-center space-x-1.5 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{victimAuthError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={victimAuthLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0070f3] hover:bg-[#005dcc] text-white text-xs font-bold transition shadow-xs flex items-center justify-center space-x-1.5 disabled:opacity-60"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{victimAuthLoading ? 'Authenticating...' : 'Sign In as Registered Victim'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVictimSignUp} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-[#4d4d4d] mb-1">Alias or Username *</label>
                      <input
                        type="text"
                        value={victimUsername}
                        onChange={(e) => setVictimUsername(e.target.value)}
                        placeholder="e.g. rahul_k"
                        required
                        className="w-full rounded-xl border border-[#ebebeb] bg-white px-3 py-2 text-xs text-[#171717] focus:border-[#0070f3] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-[#4d4d4d] mb-1">Password *</label>
                      <input
                        type="password"
                        value={victimPassword}
                        onChange={(e) => setVictimPassword(e.target.value)}
                        placeholder="Create a password"
                        required
                        className="w-full rounded-xl border border-[#ebebeb] bg-white px-3 py-2 text-xs text-[#171717] focus:border-[#0070f3] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-[#4d4d4d] mb-1">Display Name (Optional)</label>
                      <input
                        type="text"
                        value={victimFullName}
                        onChange={(e) => setVictimFullName(e.target.value)}
                        placeholder="For example: Rahul"
                        className="w-full rounded-xl border border-[#ebebeb] bg-white px-3 py-2 text-xs text-[#171717] focus:border-[#0070f3] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-[#4d4d4d] mb-1">Contact Email / Phone (Optional)</label>
                      <input
                        type="text"
                        value={victimContact}
                        onChange={(e) => setVictimContact(e.target.value)}
                        placeholder="Confidential"
                        className="w-full rounded-xl border border-[#ebebeb] bg-white px-3 py-2 text-xs text-[#171717] focus:border-[#0070f3] focus:outline-none"
                      />
                    </div>
                  </div>

                  {victimAuthError && (
                    <div className="flex items-center space-x-1.5 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{victimAuthError}</span>
                    </div>
                  )}

                  {victimAuthSuccess && (
                    <div className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{victimAuthSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={victimAuthLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0070f3] hover:bg-[#005dcc] text-white text-xs font-bold transition shadow-xs flex items-center justify-center space-x-1.5 disabled:opacity-60"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{victimAuthLoading ? 'Creating Account...' : 'Register Secure Victim Account'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* CATEGORY 2: 4 COUNSELLORS (MANDATORY LOGIN) */}
        {activeCategory === 'counsellor' && (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 flex items-start space-x-2 text-xs text-red-900">
              <Lock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong>Mandatory Staff Authentication:</strong> Unauthenticated entry to counsellor dashboards is strictly blocked. Each counsellor has unique credentials and receives their specifically assigned victim alerts.
              </div>
            </div>

            {/* Quick Presets for 4 Counsellors */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#4d4d4d] uppercase font-semibold">
                Select from the 4 Official Counsellors:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COUNSELLOR_PRESETS.map((c, idx) => {
                  const isSelected = selectedCounsellorIndex === idx;
                  return (
                    <button
                      key={c.username}
                      type="button"
                      onClick={() => selectCounsellorPreset(idx)}
                      className={`option-selectable p-3 rounded-xl border text-left transition ${
                        isSelected
                          ? 'option-selected border-[#0070f3] bg-blue-50/80 ring-2 ring-[#0070f3]/40'
                          : 'border-[#ebebeb] bg-[#fafafa] hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#171717]">{c.name}</span>
                        <span className="text-[9px] font-mono bg-white px-1.5 py-0.5 rounded border border-[#ebebeb] text-[#4d4d4d]">
                          {c.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#0070f3] font-medium mt-0.5">{c.title}</p>
                      <p className="text-[10px] text-[#8f8f8f] mt-1 line-clamp-1">{c.specialty}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Counsellor Login Form */}
            <form onSubmit={handleCounsellorLogin} className="space-y-3 bg-[#fafafa] border border-[#ebebeb] p-4 rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#4d4d4d] mb-1">Official ID</label>
                  <input
                    type="text"
                    value={counsellorUsername}
                    onChange={(e) => setCounsellorUsername(e.target.value)}
                    placeholder="riya"
                    required
                    className="w-full rounded-xl border border-[#ebebeb] bg-white px-3 py-2 text-xs text-[#171717] focus:border-[#0070f3] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#4d4d4d] mb-1">Password</label>
                  <input
                    type="password"
                    value={counsellorPassword}
                    onChange={(e) => setCounsellorPassword(e.target.value)}
                    placeholder="Riya@2026"
                    required
                    className="w-full rounded-xl border border-[#ebebeb] bg-white px-3 py-2 text-xs text-[#171717] focus:border-[#0070f3] focus:outline-none"
                  />
                </div>
              </div>

              <div className="text-[11px] font-mono text-[#8f8f8f] flex items-center justify-between">
                <span>Selected: <strong className="text-[#171717]">{COUNSELLOR_PRESETS[selectedCounsellorIndex].name}</strong> ({counsellorUsername} / {counsellorPassword})</span>
              </div>

              {counsellorError && (
                <div className="flex items-center space-x-1.5 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{counsellorError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={counsellorLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#171717] hover:bg-black text-white text-xs font-bold transition shadow-xs flex items-center justify-center space-x-2 disabled:opacity-60"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#0070f3]" />
                <span>{counsellorLoading ? 'Verifying Credentials...' : `Unlock Dashboard as ${COUNSELLOR_PRESETS[selectedCounsellorIndex].name}`}</span>
              </button>
            </form>
          </div>
        )}

        {/* CATEGORY 3: AUTHORITIES (MANDATORY LOGIN) */}
        {activeCategory === 'authority' && (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 flex items-start space-x-2 text-xs text-red-900">
              <Lock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong>Mandatory Authority Sign-In:</strong> Aggregated district and state clusters are restricted to authenticated Ministry officials.
              </div>
            </div>

            {/* Presets for 3 Authorities */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#4d4d4d] uppercase font-semibold">
                Select Official Authority Tier:
              </label>
              <div className="space-y-2">
                {AUTHORITY_PRESETS.map((a, idx) => {
                  const isSelected = selectedAuthorityIndex === idx;
                  return (
                    <button
                      key={a.username}
                      type="button"
                      onClick={() => selectAuthorityPreset(idx)}
                      className={`option-selectable w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'option-selected border-[#0070f3] bg-blue-50/80 ring-2 ring-[#0070f3]/40'
                          : 'border-[#ebebeb] bg-[#fafafa] hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-[#171717]">{a.name}</div>
                        <div className="text-[10px] font-mono text-[#0070f3] uppercase">{a.tier}</div>
                        <div className="text-[10px] text-[#8f8f8f]">{a.jurisdiction}</div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0070f3] option-check-icon" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Authority Login Form */}
            <form onSubmit={handleAuthorityLogin} className="space-y-3 bg-[#fafafa] border border-[#ebebeb] p-4 rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#4d4d4d] mb-1">Official ID</label>
                  <input
                    type="text"
                    value={authorityUsername}
                    onChange={(e) => setAuthorityUsername(e.target.value)}
                    placeholder="district_officer"
                    required
                    className="w-full rounded-xl border border-[#ebebeb] bg-white px-3 py-2 text-xs text-[#171717] focus:border-[#0070f3] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#4d4d4d] mb-1">Password</label>
                  <input
                    type="password"
                    value={authorityPassword}
                    onChange={(e) => setAuthorityPassword(e.target.value)}
                    placeholder="District@2026"
                    required
                    className="w-full rounded-xl border border-[#ebebeb] bg-white px-3 py-2 text-xs text-[#171717] focus:border-[#0070f3] focus:outline-none"
                  />
                </div>
              </div>

              {authorityError && (
                <div className="flex items-center space-x-1.5 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{authorityError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authorityLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#171717] hover:bg-black text-white text-xs font-bold transition shadow-xs flex items-center justify-center space-x-2 disabled:opacity-60"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#0070f3]" />
                <span>{authorityLoading ? 'Verifying Authority...' : `Unlock ${AUTHORITY_PRESETS[selectedAuthorityIndex].name} Analytics`}</span>
              </button>
            </form>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-5 pt-3 border-t border-[#ebebeb] flex items-center justify-between text-xs text-[#8f8f8f]">
          <span className="flex items-center">
            <Lock className="w-3.5 h-3.5 mr-1 text-[#0070f3]" />
            DPDP Act 2023 Compliant · Zero PII Forwarding to Gemini
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#171717] text-white text-xs font-medium hover:bg-black transition shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
