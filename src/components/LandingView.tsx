import React from 'react';
import { 
  Shield, 
  Activity, 
  Brain, 
  Sparkles, 
  PhoneCall, 
  MessageSquareText, 
  AlertOctagon, 
  UserCheck, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  Lock, 
  BarChart, 
  Cpu, 
  Mic, 
  HeartHandshake
} from 'lucide-react';

interface LandingViewProps {
  onNavigate: (tab: string) => void;
  openRoleModal: () => void;
  enterVictimMode: () => void;
  activeRole?: string;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate, openRoleModal, enterVictimMode, activeRole }) => {
  const isVictim = activeRole === 'Victim / Complainant';
  const innovationCards = [
    {
      icon: Brain,
      title: 'Emotion AI (soon)',
      desc: 'Multimodal affective computing models detecting subtle emotional stress markers during check-in dialogues.'
    },
    {
      icon: MessageSquareText,
      title: 'Sentiment Analysis (soon)',
      desc: 'NLP Transformer models tracking longitudinal sentiment shifts across chat, SMS, and helpline logs.'
    },
    {
      icon: Mic,
      title: 'Voice Stress Analytics (soon)',
      desc: 'Acoustic micro-tremor and spectral jitter extraction from IVRS and audio check-ins for physiological stress.'
    },
    {
      icon: TrendingUp,
      title: 'Predictive Risk Modelling',
      desc: 'Continuous dynamic distress classifier scoring trajectory from Low → Moderate → High → Critical.'
    },
    {
      icon: PhoneCall,
      title: 'Multilingual Conversational AI (soon)',
      desc: 'Accessible chat and voice agent supporting Hindi, English, and regional Indian languages.'
    },
    {
      icon: Cpu,
      title: 'Explainable AI (SHAP) (soon)',
      desc: 'Transparent SHAP factor attributions giving counsellors clear rationale for every risk score change.'
    },
    {
      icon: AlertOctagon,
      title: 'Automated Case Prioritisation (soon)',
      desc: 'Dynamic triage highlighting vulnerable complainants before crisis threshold escalation.'
    },
    {
      icon: HeartHandshake,
      title: 'Human-in-the-Loop Protocol',
      desc: 'Zero autonomous medical or legal decisions; empowers official counsellors with actionable decision support.'
    }
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-mesh-gradient border-b border-[#ebebeb] pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          
          {/* Eyebrow badge */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-[#ebebeb] shadow-xs text-xs font-mono text-[#4d4d4d]">
              <span className="w-2 h-2 rounded-full bg-[#0070f3] animate-pulse"></span>
              <span className="font-semibold text-[#171717]">Ministry of Social Justice & Empowerment</span>
            </div>
            {isVictim && (
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold">Victim / Complainant Active</span>
                <span className="text-slate-400">•</span>
                <span>Optional details, delete anytime</span>
              </div>
            )}
          </div>

          {/* Main Headline */}
          <h1 className="care-title text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#171717] max-w-4xl mx-auto leading-[1.1]">
            AI-Supported Survivor Well-being & <br className="hidden sm:inline" />
            <span>
              Dignity Support System
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-[#4d4d4d] max-w-3xl mx-auto font-normal leading-relaxed">
            A private, compassionate support space for survivors and complainants during reporting, recovery, rehabilitation, and access to justice.
          </p>

          {/* CTAs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                if (isVictim) {
                  onNavigate('checkin');
                } else {
                  enterVictimMode();
                }
              }}
              className="care-primary-button px-7 py-3.5 rounded-full bg-[#0070f3] text-white text-sm font-bold hover:bg-[#005dcc] transition shadow-lg shadow-blue-200 flex items-center space-x-2 group ring-2 ring-blue-100"
            >
              <MessageSquareText className="w-4 h-4" />
              <span>{isVictim ? 'Open Support Check-in' : 'Login as Victim'}</span>
              <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={openRoleModal}
              className="px-6 py-3 rounded-full bg-[#171717] text-white text-sm font-semibold hover:bg-black transition shadow-md flex items-center space-x-2 group"
            >
              <UserCheck className="w-4 h-4 text-[#0070f3]" />
              <span>{isVictim ? 'Switch Role / Staff Access' : 'Counsellor & Authority Login'}</span>
              <ArrowRight className="w-4 h-4 text-[#0070f3] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="max-w-4xl mx-auto pt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <button onClick={() => onNavigate('checkin')} className="care-support-card group rounded-2xl border border-blue-200 bg-blue-50/70 p-5 hover:bg-blue-100/70 transition text-left">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-[#0070f3] font-semibold">
                    {isVictim ? 'Active support flow' : 'Open access'}
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-[#171717]">Survivor support portal</h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#4d4d4d]">Private check-in, emotional support, and guided access to counselling and government services.</p>
                </div>
                <MessageSquareText className="w-6 h-6 text-[#0070f3] shrink-0" />
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0070f3]">
                {isVictim ? 'Start check-in now' : 'Continue safely'} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
            <button onClick={openRoleModal} className="care-protected-card group rounded-2xl border border-slate-300 bg-white/80 p-5 hover:bg-white hover:border-slate-500 transition text-left">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-slate-500 font-semibold">Protected access</p>
                  <h2 className="mt-1 text-lg font-bold text-[#171717]">Counsellor & authority workspace</h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#4d4d4d]">Counsellor, District Authority, State Authority, and National Policymaker access options.</p>
                </div>
                <UserCheck className="w-6 h-6 text-[#171717] shrink-0" />
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#171717]">Choose protected role <ArrowRight className="w-3.5 h-3.5" /></span>
            </button>
          </div>

          {/* Highlights summary */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-left max-w-4xl mx-auto">
            <div className="p-3 bg-white/80 border border-[#ebebeb] rounded-xl">
              <p className="text-[11px] font-mono text-[#8f8f8f] uppercase">Target Framework</p>
              <p className="text-xs font-semibold text-[#171717] mt-0.5">PoA Act & MoSJE Directives</p>
            </div>
            <div className="p-3 bg-white/80 border border-[#ebebeb] rounded-xl">
              <p className="text-[11px] font-mono text-[#8f8f8f] uppercase">Decision Architecture</p>
              <p className="text-xs font-semibold text-[#171717] mt-0.5">Explainable AI (XAI / SHAP)</p>
            </div>
            <div className="p-3 bg-white/80 border border-[#ebebeb] rounded-xl">
              <p className="text-[11px] font-mono text-[#8f8f8f] uppercase">Escalation Model</p>
              <p className="text-xs font-semibold text-[#171717] mt-0.5">Dynamic Risk Score (0-100)</p>
            </div>
            <div className="p-3 bg-white/80 border border-[#ebebeb] rounded-xl">
              <p className="text-[11px] font-mono text-[#8f8f8f] uppercase">Safety Guarantee</p>
              <p className="text-xs font-semibold text-[#171717] mt-0.5">Human-in-the-Loop Review</p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE PIPELINE VISUALIZATION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <p className="text-xs font-mono tracking-widest text-[#0070f3] uppercase font-semibold">
            System Workflow & Processing Pipeline
          </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171717]">
            How SAHAY Supports Complainants Continuously
          </h2>
          <p className="text-xs text-[#8f8f8f] max-w-xl mx-auto">
            From a safety-first check-in to consent-based support escalation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {/* Step 1 */}
          <div className="animated-card bg-white border border-[#ebebeb] p-5 rounded-2xl relative shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0070f3] flex items-center justify-center font-mono font-bold text-xs animated-glow">
                01
              </div>
              <h3 className="font-semibold text-sm text-[#171717]">Safety-First Check-in</h3>
              <p className="text-xs text-[#8f8f8f] leading-relaxed">
                The victim answers an immediate safety question before sharing feelings or continuing.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#f2f2f2] text-[10px] font-mono text-slate-500">
              First step: Safety screening
            </div>
          </div>

          {/* Step 2 */}
          <div className="animated-card bg-white border border-[#ebebeb] p-5 rounded-2xl relative shadow-xs flex flex-col justify-between hover:border-slate-300 transition reveal-delay-1">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-violet-50 text-[#7928ca] flex items-center justify-center font-mono font-bold text-xs animated-glow">
                02
              </div>
              <h3 className="font-semibold text-sm text-[#171717]">Gemini Support Assistant</h3>
              <p className="text-xs text-[#8f8f8f] leading-relaxed">
                Gemini gives calm, structured support responses and guides the victim toward counsellor and government help.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#f2f2f2] text-[10px] font-mono text-slate-500">
              Provider: Gemini API
            </div>
          </div>

          {/* Step 3 */}
          <div className="animated-card bg-white border border-[#ebebeb] p-5 rounded-2xl relative shadow-xs flex flex-col justify-between hover:border-slate-300 transition reveal-delay-2">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-[#00a896] flex items-center justify-center font-mono font-bold text-xs animated-glow">
                03
              </div>
              <h3 className="font-semibold text-sm text-[#171717]">Risk Prediction</h3>
              <p className="text-xs text-[#8f8f8f] leading-relaxed">
                Each completed feeling check-in receives a 0–100 support-triage score and a risk band.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#f2f2f2] text-[10px] font-mono text-slate-500">
              Bands: Low • Moderate • High • Critical
            </div>
          </div>

          {/* Step 4 */}
          <div className="animated-card bg-white border border-[#ebebeb] p-5 rounded-2xl relative shadow-xs flex flex-col justify-between hover:border-slate-300 transition reveal-delay-3">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#ab570a] flex items-center justify-center font-mono font-bold text-xs animated-glow">
                04
              </div>
              <h3 className="font-semibold text-sm text-[#171717]">Consent-Based Location</h3>
              <p className="text-xs text-[#8f8f8f] leading-relaxed">
                Exact location is shared only if the victim presses the button and grants browser permission. It is then visible to the assigned counsellor and escalation authority.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#f2f2f2] text-[10px] font-mono text-slate-500">
              Optional: Location + accuracy
            </div>
          </div>

          {/* Step 5 */}
          <div className="animated-card bg-[#171717] text-white border border-[#171717] p-5 rounded-2xl relative shadow-md flex flex-col justify-between reveal-delay-4">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-mono font-bold text-xs animated-glow">
                05
              </div>
              <h3 className="font-semibold text-sm text-white">Parallel Escalation</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Scores of 70+ assign the least-loaded available counsellor and alert the appropriate authority.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700 text-[10px] font-mono text-emerald-400">
              70+ score: Counsellor + Authority
            </div>
          </div>
        </div>
      </section>

      {/* INNOVATION AREAS GRID */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <p className="text-xs font-mono tracking-widest text-[#7928ca] uppercase font-semibold">
            Technical Innovation Highlights
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171717]">
            Core Technical Capabilities
          </h2>
          <p className="text-xs text-[#8f8f8f] max-w-xl mx-auto">
            Architected specifically for the Ministry of Social Justice & Empowerment requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {innovationCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div 
                key={idx}
                className="animated-card bg-white border border-[#ebebeb] p-5 rounded-xl space-y-3 hover:border-slate-400 hover:shadow-xs transition reveal-delay-1"
              >
                <div className="w-9 h-9 rounded-lg bg-[#fafafa] border border-[#ebebeb] flex items-center justify-center text-[#171717] animated-glow">
                  <Icon className="w-4 h-4 text-[#0070f3]" />
                </div>
                <h3 className="font-semibold text-sm text-[#171717]">{card.title}</h3>
                <p className="text-xs text-[#4d4d4d] leading-relaxed">
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>


    </div>
  );
};
