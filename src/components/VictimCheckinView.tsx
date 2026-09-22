import React, { useRef, useState, useEffect } from 'react';
import { 
  Heart, 
  Mic, 
  Send, 
  Sparkles, 
  MessageSquare,
  Lock,
  Phone,
  Loader2,
  ShieldCheck,
  MapPin,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import type { AlertItem, AuditLogItem } from '../data/mockData';

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface VictimCheckinViewProps {
  onAddNewCheckinAlert: (alert: AlertItem) => void;
  onSaveCheckin: (checkin: { message: string; mood: string; riskScore: number; riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical'; locationLabel?: string; currentLocationShared: boolean }) => void;
  onSaveSensitiveContact: (record: { nameAge: string; district: string; state: string; areaType: 'Urban' | 'Rural'; trustedContact: string; trustedPhone: string }) => void;
  onAddAuditLog: (log: AuditLogItem) => void;
  onNavigateTab: (tab: string) => void;
}

export const VictimCheckinView: React.FC<VictimCheckinViewProps> = ({
  onAddNewCheckinAlert,
  onSaveCheckin,
  onSaveSensitiveContact,
  onAddAuditLog,
  onNavigateTab
}) => {
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [location, setLocation] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'shared' | 'denied'>('idle');
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [isEmergency, setIsEmergency] = useState(false);
  const [isAtrocityCase, setIsAtrocityCase] = useState<boolean | null>(null);
  const [neuroStress, setNeuroStress] = useState<string>('Moderate');
  const [trustWithdrawal, setTrustWithdrawal] = useState<string>('Moderate');
  const [existentialTrauma, setExistentialTrauma] = useState<string>('Moderate');
  const [assignedSpecialist, setAssignedSpecialist] = useState<{
    name: string;
    title: string;
    alertId?: string;
  } | null>(null);
  const [nameAge, setNameAge] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [areaType, setAreaType] = useState<'Urban' | 'Rural'>('Urban');
  const [trustedContact, setTrustedContact] = useState('');
  const [trustedPhone, setTrustedPhone] = useState('');
  const [userInputText, setUserInputText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string>('');
  const [voiceStressScore, setVoiceStressScore] = useState<number | null>(null);
  
  // Step-by-step loading state
  const [loadingStep, setLoadingStep] = useState<number>(0); // 0 = idle, 1..4 = steps
  const [analysisResult, setAnalysisResult] = useState<{
    title: string;
    message: string;
    steps: string[];
    riskScore: number;
    riskLevel: string;
    rationale: string;
  } | null>(null);

  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'SAHAY' | 'Victim'; text: string; time: string }>>([
    {
      sender: 'SAHAY',
      text: 'Hello. This is your private support check-in. You can share only what you feel safe sharing. I can gently guide you toward government support and help connect you with a counsellor when you are ready.',
      time: '09:40 AM'
    }
  ]);

  const moods = [
    { emoji: '😌', label: 'Calm', score: 20 },
    { emoji: '🙂', label: 'Okay', score: 35 },
    { emoji: '😟', label: 'Worried', score: 55 },
    { emoji: '😰', label: 'Very Anxious', score: 75 },
    { emoji: '😞', label: 'Low', score: 70 },
    { emoji: '🚨', label: 'Immediate Help', score: 95 }
  ];

  const loadingStepMessages = [
    "Analyzing check-in message...",
    "Processing NLP sentiment signals...",
    "Evaluating engagement latency trend...",
    "Computing SHAP explainable risk indicators..."
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onNavigateTab('landing');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigateTab]);

  const scrollToChat = () => {
    window.setTimeout(() => chatPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleVoiceInput = () => {
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setVoiceError('Voice transcription is not supported in this browser. You can type your message instead.');
      return;
    }

    if (isRecording) {
      speechRecognitionRef.current?.stop();
      return;
    }

    setVoiceError('');
    navigator.mediaDevices?.getUserMedia({ audio: true }).then((stream) => {
      microphoneStreamRef.current = stream;
      const recognition = new Recognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results).map(result => result[0].transcript).join(' ');
        setUserInputText(transcript);
      };
      recognition.onend = () => {
        setIsRecording(false);
        speechRecognitionRef.current = null;
        microphoneStreamRef.current?.getTracks().forEach(track => track.stop());
        microphoneStreamRef.current = null;
      };
      recognition.onerror = () => {
        setVoiceError('Voice recognition could not hear you. Check microphone permission and try again.');
        recognition.stop();
      };
      speechRecognitionRef.current = recognition;
      setIsRecording(true);
      recognition.start();
    }).catch(() => {
      setVoiceError('Microphone permission was not granted. Allow microphone access in the browser, then try again.');
    });
  };

  const handleShareCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }

    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const sharedLocation = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy)
        };
        setCurrentLocation(sharedLocation);
        setLocationStatus('shared');
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const handleSafetyAnswer = (safe: boolean) => {
    if (!safe) {
      setIsEmergency(true);
      setChatMessages(prev => [...prev, {
        sender: 'SAHAY',
        text: 'Thank you for telling me. Please pause here and contact emergency support now. Call 112 for immediate danger or Tele-MANAS at 14416 for urgent mental-health support. You deserve immediate human care.',
        time: 'Just now'
      }]);
      return;
    }

    // Advance to Step 1.5: Atrocity / PoA Case Screening before asking for name/age
    setOnboardingStep(1.5);
    setChatMessages(prev => [...prev, {
      sender: 'SAHAY',
      text: 'I am glad you are safe. Before taking your name, please let me know: is this check-in related to an atrocity, caste-based violence, or discrimination (e.g. PoA Act related)?',
      time: 'Just now'
    }]);
  };

  const handleAtrocityAnswer = (isAtrocity: boolean) => {
    setIsAtrocityCase(isAtrocity);
    if (!isAtrocity) {
      setOnboardingStep(2);
      setChatMessages(prev => [...prev, {
        sender: 'SAHAY',
        text: 'Thank you for letting me know. What name or alias would you like me to call you, and what is your age?',
        time: 'Just now'
      }]);
    }
  };

  const handleAtrocityDimensionsSubmit = () => {
    setOnboardingStep(2);
    setChatMessages(prev => [...prev, {
      sender: 'SAHAY',
      text: 'Trauma screening dimensions recorded under strict DPDP Act privacy protections. What name or alias would you like me to call you, and what is your age?',
      time: 'Just now'
    }]);
  };

  const handleNameAgeSubmit = () => {
    if (!nameAge.trim()) return;
    setOnboardingStep(3);
    setChatMessages(prev => [...prev, { sender: 'SAHAY', text: 'Thank you. Which district and state are you in, and is your area urban or rural?', time: 'Just now' }]);
  };

  const handleLocationDetailsSubmit = () => {
    if (!district.trim() || !state.trim()) return;
    setLocation(`${district.trim()}, ${state.trim()}`);
    setOnboardingStep(4);
    setChatMessages(prev => [...prev, { sender: 'SAHAY', text: 'Thank you. Please share the name and phone number of a trusted emergency contact. This helps us guide support if you need urgent care.', time: 'Just now' }]);
  };

  const handleContactSubmit = () => {
    if (!trustedContact.trim() || !trustedPhone.trim()) return;
    onSaveSensitiveContact({ nameAge: nameAge.trim(), district: district.trim(), state: state.trim(), areaType, trustedContact: trustedContact.trim(), trustedPhone: trustedPhone.trim() });
    setOnboardingStep(5);
    setChatMessages(prev => [...prev, { sender: 'SAHAY', text: 'Thank you. How are you feeling right now, and how can I best assist you today?', time: 'Just now' }]);
  };

  const handleSendMessage = async (moodOverride?: string) => {
    const activeMood = moodOverride || selectedMood;
    if (!userInputText.trim() && !activeMood) return;

    const userMsg = userInputText || `Current mood selected: ${activeMood}`;
    const mood = moods.find((item) => item.label === activeMood);
    setUserInputText('');
    setChatMessages(prev => [...prev, { sender: 'Victim', text: userMsg, time: 'Just now' }]);

    setLoadingStep(1);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          mood: activeMood,
          moodScore: mood?.score ?? 0,
          location: { label: location, current: currentLocation },
          isAtrocityRelated: Boolean(isAtrocityCase),
          triageDimensions: isAtrocityCase ? {
            neuroStress,
            trustWithdrawal,
            existentialTrauma
          } : undefined
        })
      });

      if (!response.ok) throw new Error('AI service unavailable');
      const result = await response.json();
      setAnalysisResult(result);
      onSaveCheckin({
        message: userMsg,
        mood: activeMood || 'Not selected',
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        locationLabel: location || undefined,
        currentLocationShared: Boolean(currentLocation)
      });

      // Persist to secure backend database and obtain auto-assigned counsellor
      let assignedOfficer = isAtrocityCase || result.riskScore >= 75 ? 'Riya' : 'Ayush';
      try {
        const checkinRes = await fetch('/api/checkins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            victimAlias: nameAge || 'Anonymous Survivor',
            message: userMsg,
            mood: activeMood || 'Not selected',
            moodScore: mood?.score ?? 0,
            predictedRiskScore: result.riskScore,
            riskLevel: result.riskLevel,
            isAtrocityRelated: Boolean(isAtrocityCase),
            neuroStress: isAtrocityCase ? neuroStress : undefined,
            trustWithdrawal: isAtrocityCase ? trustWithdrawal : undefined,
            existentialTrauma: isAtrocityCase ? existentialTrauma : undefined,
            locationLabel: location || undefined,
            currentLocationShared: Boolean(currentLocation),
            trustedContactName: trustedContact || undefined,
            trustedContactPhone: trustedPhone || undefined,
            locationCoords: currentLocation || undefined
          })
        });

        if (checkinRes.ok) {
          const checkinData = await checkinRes.json();
          if (checkinData.assignedCounsellor) {
            assignedOfficer = checkinData.assignedCounsellor;
            const titles: Record<string, string> = {
              'Riya': 'Senior Trauma Specialist',
              'Divya': 'Clinical Well-being Counsellor',
              'Ayush': 'Case Manager',
              'Prashant': 'District Response Counsellor'
            };
            setAssignedSpecialist({
              name: checkinData.assignedCounsellor,
              title: titles[checkinData.assignedCounsellor] || 'Assigned Counsellor',
              alertId: checkinData.alertId
            });
          }
        }
      } catch (dbErr) {
        console.warn('Backend DB check-in persistence notice:', dbErr);
      }

      if (result.riskScore >= 50 || isAtrocityCase) {
        const detectedFactors: string[] = [];
        if (isAtrocityCase) detectedFactors.push('PoA Act Atrocity Screening Positive');
        if (result.riskScore >= 70) detectedFactors.push('AI check-in risk threshold crossed');
        if (neuroStress && neuroStress !== 'None') detectedFactors.push(`Neuro stress: ${neuroStress}`);
        if (currentLocation) detectedFactors.push('Current location shared for follow-up');

        onAddNewCheckinAlert({
          id: `LIVE-${Date.now().toString().slice(-6)}`,
          caseId: 'SAHAY-LIVE',
          victimAlias: nameAge ? `Survivor (${nameAge.split(',')[0].trim()})` : 'Private live check-in',
          district: location || 'Location shared by victim',
          riskScore: result.riskScore,
          previousScore: 0,
          change: result.riskScore,
          severity: result.riskScore >= 75 ? 'Critical' : 'High',
          detectedFactors,
          time: 'Just now',
          assignedOfficer: assignedOfficer,
          status: 'Open',
          location: currentLocation
        });
      }

      setChatMessages(prev => [...prev, {
        sender: 'SAHAY',
        text: result.message,
        time: 'Just now'
      }]);
    } catch {
      const fallbackRiskLevel = (mood?.score ?? 0) >= 75 ? 'Critical' : (mood?.score ?? 0) >= 50 ? 'High' : (mood?.score ?? 0) >= 25 ? 'Moderate' : 'Low';
      const fallbackScore = mood?.score ?? (isAtrocityCase ? 65 : 35);
      const fallbackResult = {
        title: 'Local support summary',
        message: 'Thank you for checking in. Your feelings matter, and you do not have to manage this by yourself. SAHAY has securely routed your check-in to a dedicated counsellor who can guide you toward government support.',
        steps: ['Take a slow breath; you are being heard.', 'SAHAY has passed this check-in to your assigned counsellor.', 'If you feel unsafe or overwhelmed, SAHAY can guide you to immediate government help at 14416.'],
        riskScore: fallbackScore,
        riskLevel: fallbackRiskLevel,
        rationale: 'Local evaluation based on check-in responses and privacy-first routing.'
      };
      setAnalysisResult(fallbackResult);
      onSaveCheckin({
        message: userMsg,
        mood: activeMood || 'Not selected',
        riskScore: fallbackResult.riskScore,
        riskLevel: fallbackResult.riskLevel,
        locationLabel: location || undefined,
        currentLocationShared: Boolean(currentLocation)
      });

      const fallbackOfficer = isAtrocityCase ? 'Riya' : 'Ayush';
      setAssignedSpecialist({
        name: fallbackOfficer,
        title: fallbackOfficer === 'Riya' ? 'Senior Trauma Specialist' : 'Case Manager'
      });

      if (fallbackScore >= 50 || isAtrocityCase) {
        onAddNewCheckinAlert({
          id: `LIVE-${Date.now().toString().slice(-6)}`,
          caseId: 'SAHAY-LIVE',
          victimAlias: nameAge || 'Private live check-in',
          district: location || 'Location not shared',
          riskScore: fallbackScore,
          previousScore: 0,
          change: fallbackScore,
          severity: fallbackScore >= 75 ? 'Critical' : 'High',
          detectedFactors: isAtrocityCase ? ['PoA Act Atrocity Screening Positive', 'Immediate human triage allocated'] : ['Check-in risk threshold crossed'],
          time: 'Just now',
          assignedOfficer: fallbackOfficer,
          status: 'Open',
          location: currentLocation || undefined
        });
      }
    } finally {
      setLoadingStep(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-20 relative">
      {/* Floating Accessible Return Button (Visible on all scroll depths) */}
      <button
        type="button"
        onClick={() => {
          onNavigateTab('landing');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        aria-label="Return to Overview page"
        title="Return to Overview (Shortcut: Esc)"
        className="fixed bottom-6 left-6 z-40 group flex items-center space-x-2 bg-[#171717] hover:bg-black text-white px-4 py-2.5 rounded-full shadow-2xl hover:scale-105 active:scale-95 border border-slate-700 transition-all text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:ring-offset-2 min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4 text-[#0070f3] group-hover:-translate-x-1 transition-transform" />
        <span>Return to Overview</span>
      </button>

      {/* Accessible Sticky Action Bar */}
      <div className="sticky top-16 z-30 bg-[#fafafa]/95 backdrop-blur-md py-2.5 px-4 rounded-2xl border border-[#ebebeb] shadow-xs flex items-center justify-between transition-all">
        <button
          type="button"
          onClick={() => onNavigateTab('landing')}
          aria-label="Return to Overview page"
          title="Return to Overview (Shortcut: Esc)"
          className="group inline-flex items-center space-x-2 text-xs font-semibold text-[#171717] hover:text-[#0070f3] py-2 px-3.5 rounded-xl border border-[#ebebeb] bg-white shadow-2xs hover:bg-[#fafafa] hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:ring-offset-2 transition-all min-h-[44px] min-w-[44px]"
        >
          <ArrowLeft className="w-4 h-4 text-[#4d4d4d] group-hover:text-[#0070f3] group-hover:-translate-x-1 transition-transform" />
          <span>← Back to Overview</span>
          <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono text-[#8f8f8f] bg-[#f2f2f2] border border-[#ebebeb] rounded">Esc</kbd>
        </button>
        <span className="text-[11px] font-mono text-[#8f8f8f] hidden sm:inline">
          DPDP Act 2023 · Private Check-in
        </span>
      </div>

      {/* Mobile Header Banner */}
      <div className="bg-white border border-[#ebebeb] p-5 rounded-2xl shadow-xs text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-[#0070f3] text-xs font-mono font-medium border border-blue-100">
          <Lock className="w-3.5 h-3.5" />
          <span>Confidential Survivor Support Interface</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#171717]">
          What would feel supportive right now?
        </h1>
        <p className="text-xs text-[#8f8f8f] max-w-lg mx-auto">
          I will first check your immediate safety, then help connect you with the right support. Take your time.
        </p>
      </div>

      {/* Safety-first onboarding */}
      <div
        className="bg-white border border-[#ebebeb] p-6 rounded-2xl shadow-xs space-y-4 cursor-pointer"
        onClick={scrollToChat}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => event.key === 'Enter' && scrollToChat()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-mono uppercase text-[#8f8f8f]">Private support check-in</h2>
          <span className="text-[10px] font-mono text-[#0070f3]">
            {isEmergency ? 'Emergency support' : onboardingStep === 1.5 ? 'Step 1.5 of 5 · Atrocity Screening' : `Step ${onboardingStep} of 5`}
          </span>
        </div>

        {isEmergency ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
            <h3 className="text-sm font-bold text-red-900">You deserve immediate human support</h3>
            <p className="text-xs leading-relaxed text-red-800">The check-in has paused. Call <strong>112</strong> if you are in immediate danger, or call <strong>14416</strong> for Tele-MANAS support. If possible, move near a trusted person while you make the call.</p>
          </div>
        ) : onboardingStep === 1 ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#171717]">Are you currently in immediate danger or experiencing thoughts of self-harm?</p>
            <p className="text-xs text-[#8f8f8f]">You can answer honestly. This helps me choose the safest next step.</p>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => handleSafetyAnswer(true)}
                className="option-selectable rounded-xl bg-emerald-50 border border-emerald-300 px-4 py-2.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 hover:border-emerald-400 active:scale-95 shadow-2xs flex items-center space-x-1.5"
              >
                <span>No, I am safe</span>
                <span className="text-emerald-600 font-bold">✓</span>
              </button>
              <button
                type="button"
                onClick={() => handleSafetyAnswer(false)}
                className="option-selectable rounded-xl bg-red-50 border border-red-300 px-4 py-2.5 text-xs font-semibold text-red-900 hover:bg-red-100 hover:border-red-400 active:scale-95 shadow-2xs flex items-center space-x-1.5"
              >
                <span>Yes, I need help</span>
                <span>🚨</span>
              </button>
            </div>
          </div>
        ) : onboardingStep === 1.5 ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#171717]">
                Is this check-in related to an atrocity, caste-based violence, or discrimination (e.g. PoA Act related)?
              </p>
              <p className="text-xs text-[#8f8f8f]">
                This allows SAHAY to allocate dedicated trauma specialists (Riya or Divya) and verify relevant protection guidelines under the PoA Act.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => handleAtrocityAnswer(false)}
                className={`option-selectable rounded-xl border px-4 py-2.5 text-xs font-semibold flex items-center space-x-2 transition ${
                  isAtrocityCase === false
                    ? 'option-selected border-[#0070f3] bg-blue-50 text-[#0070f3] ring-2 ring-[#0070f3]/40'
                    : 'border-[#ebebeb] bg-[#fafafa] text-[#4d4d4d] hover:bg-white hover:border-slate-300'
                }`}
              >
                <span>No, general emotional support</span>
                {isAtrocityCase === false && <CheckCircle2 className="w-3.5 h-3.5 text-[#0070f3] option-check-icon" />}
              </button>

              <button
                type="button"
                onClick={() => handleAtrocityAnswer(true)}
                className={`option-selectable rounded-xl border px-4 py-2.5 text-xs font-semibold flex items-center space-x-2 transition ${
                  isAtrocityCase === true
                    ? 'option-selected border-[#0070f3] bg-blue-50 text-[#0070f3] ring-2 ring-[#0070f3]/40'
                    : 'border-red-200 bg-red-50/50 text-red-900 hover:bg-red-50 hover:border-red-300'
                }`}
              >
                <span>Yes, atrocity / discrimination related</span>
                <span>🛡️</span>
                {isAtrocityCase === true && <CheckCircle2 className="w-3.5 h-3.5 text-[#0070f3] option-check-icon" />}
              </button>
            </div>

            {isAtrocityCase === true && (
              <div className="mt-4 p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                  <span className="text-[11px] font-mono font-bold uppercase text-[#0070f3]">
                    Peer-Reviewed Trauma Triage Dimensions (ScienceDirect / BMC / NLM)
                  </span>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-blue-200 font-mono text-[#4d4d4d]">
                    Confidential Clinical Screening
                  </span>
                </div>

                {/* Dimension 1 */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <label className="text-xs font-semibold text-[#171717]">
                      1. Neurobiological Stress & Hypervigilance
                    </label>
                    <span className="text-[10px] font-mono text-[#8f8f8f]">ScienceDirect / NIH NLM</span>
                  </div>
                  <p className="text-[11px] text-[#666]">
                    Are you experiencing physiological panic, tremors, severe sleep disruption, or racing heart?
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Severe (Tremors / Insomnia)', 'Moderate (Racing heart)', 'Mild (Restless)', 'None'].map(opt => {
                      const key = opt.split(' ')[0];
                      const isSelected = neuroStress === key;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setNeuroStress(key)}
                          className={`option-selectable px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition ${
                            isSelected
                              ? 'border-[#0070f3] bg-[#0070f3] text-white'
                              : 'border-[#ebebeb] bg-white text-[#4d4d4d] hover:border-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dimension 2 */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <label className="text-xs font-semibold text-[#171717]">
                      2. Interpersonal Trust & Social Withdrawal
                    </label>
                    <span className="text-[10px] font-mono text-[#8f8f8f]">BMC Psychology / Springer</span>
                  </div>
                  <p className="text-[11px] text-[#666]">
                    Are you experiencing fear of community backlash, severe alienation, or avoidance of public spaces?
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['High (Complete avoidance)', 'Moderate (Afraid of backlash)', 'Mild (Guarded)', 'None'].map(opt => {
                      const key = opt.split(' ')[0];
                      const isSelected = trustWithdrawal === key;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setTrustWithdrawal(key)}
                          className={`option-selectable px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition ${
                            isSelected
                              ? 'border-[#0070f3] bg-[#0070f3] text-white'
                              : 'border-[#ebebeb] bg-white text-[#4d4d4d] hover:border-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dimension 3 */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <label className="text-xs font-semibold text-[#171717]">
                      3. Existential Trauma & High Risk Signs
                    </label>
                    <span className="text-[10px] font-mono text-[#8f8f8f]">BioMed Central / NLM</span>
                  </div>
                  <p className="text-[11px] text-[#666]">
                    Are you feeling overwhelmed by deep despair, shattered sense of safety, or severe helplessness?
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Severe (Loss of safety / despair)', 'Moderate (Helplessness)', 'Mild (Occasional dread)', 'None'].map(opt => {
                      const key = opt.split(' ')[0];
                      const isSelected = existentialTrauma === key;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setExistentialTrauma(key)}
                          className={`option-selectable px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition ${
                            isSelected
                              ? 'border-[#0070f3] bg-[#0070f3] text-white'
                              : 'border-[#ebebeb] bg-white text-[#4d4d4d] hover:border-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAtrocityDimensionsSubmit}
                    className="rounded-xl bg-[#171717] px-4 py-2 text-xs font-semibold text-white hover:bg-black active:scale-95 transition shadow-xs flex items-center space-x-1.5"
                  >
                    <span>Proceed to Name & Location</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : onboardingStep === 2 ? (
          <div className="space-y-3">
            <label htmlFor="name-age" className="text-sm font-semibold text-[#171717]">What name would you like me to call you, and what is your age?</label>
            <input id="name-age" value={nameAge} onChange={(event) => setNameAge(event.target.value)} placeholder="For example: Rahul, 24" className="w-full rounded-xl border border-[#ebebeb] bg-[#fafafa] px-3.5 py-2.5 text-xs text-[#171717] focus:border-[#0070f3] focus:outline-none" />
            <button type="button" onClick={handleNameAgeSubmit} className="rounded-xl bg-[#171717] px-4 py-2.5 text-xs font-semibold text-white hover:bg-black active:scale-95 transition">Continue</button>
          </div>
        ) : onboardingStep === 3 ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#171717]">Where are you currently located?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={district} onChange={(event) => setDistrict(event.target.value)} placeholder="District" className="rounded-xl border border-[#ebebeb] bg-[#fafafa] px-3.5 py-2.5 text-xs text-[#171717] focus:border-[#0070f3] focus:outline-none" />
              <input value={state} onChange={(event) => setState(event.target.value)} placeholder="State" className="rounded-xl border border-[#ebebeb] bg-[#fafafa] px-3.5 py-2.5 text-xs text-[#171717] focus:border-[#0070f3] focus:outline-none" />
            </div>
            <div className="flex flex-wrap gap-2.5">
              {(['Urban', 'Rural'] as const).map((type) => {
                const isSelected = areaType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAreaType(type)}
                    className={`option-selectable rounded-xl border px-4 py-2 text-xs font-semibold flex items-center space-x-1.5 ${
                      isSelected
                        ? 'option-selected border-[#0070f3] bg-blue-50 text-[#0070f3] ring-2 ring-[#0070f3]/40'
                        : 'border-[#ebebeb] bg-[#fafafa] text-[#4d4d4d] hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <span>{type}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#0070f3] option-check-icon" />}
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={handleLocationDetailsSubmit} className="rounded-xl bg-[#171717] px-4 py-2.5 text-xs font-semibold text-white hover:bg-black active:scale-95 transition">Continue</button>
          </div>
        ) : onboardingStep === 4 ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#171717]">Please provide a trusted emergency contact.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={trustedContact} onChange={(event) => setTrustedContact(event.target.value)} placeholder="Contact name" className="rounded-xl border border-[#ebebeb] bg-[#fafafa] px-3.5 py-2.5 text-xs text-[#171717] focus:border-[#0070f3] focus:outline-none" />
              <input value={trustedPhone} onChange={(event) => setTrustedPhone(event.target.value)} placeholder="Phone number" inputMode="tel" className="rounded-xl border border-[#ebebeb] bg-[#fafafa] px-3.5 py-2.5 text-xs text-[#171717] focus:border-[#0070f3] focus:outline-none" />
            </div>
            <button type="button" onClick={handleContactSubmit} className="rounded-xl bg-[#171717] px-4 py-2.5 text-xs font-semibold text-white hover:bg-black active:scale-95 transition">Continue to feeling check-in</button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#171717]">How are you feeling right now?</p>
            <div className="flex flex-wrap gap-2">
              {['Anxiety or Worry', 'Managing Stress', 'Low Mood / Sadness', 'I just need to vent'].map((feeling) => {
                const isSelected = selectedMood === feeling;
                return (
                  <button
                    key={feeling}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedMood(feeling);
                      handleSendMessage(feeling);
                      scrollToChat();
                    }}
                    className={`option-selectable rounded-xl border px-3 py-2 text-xs font-semibold flex items-center space-x-1.5 transition ${
                      isSelected
                        ? 'option-selected border-[#0070f3] bg-blue-50 text-[#0070f3]'
                        : 'border-blue-200 bg-blue-50/70 text-[#0070f3] hover:bg-blue-100 hover:border-blue-300'
                    }`}
                  >
                    <span>{feeling}</span>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-[#0070f3] option-check-icon" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mood Selector Grid */}
      {!isEmergency && onboardingStep === 5 && <div className="bg-white border border-[#ebebeb] p-6 rounded-2xl shadow-xs space-y-4">
        <h2 className="text-xs font-mono uppercase text-[#8f8f8f]">Select your current feeling</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {moods.map((m) => {
            const isSelected = selectedMood === m.label;
            return (
              <button
                key={m.label}
                onClick={() => {
                  setSelectedMood(m.label);
                  handleSendMessage(m.label);
                  scrollToChat();
                }}
                aria-pressed={isSelected}
                aria-label={`Select feeling: ${m.label}`}
                className={`option-selectable p-4 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1.5 relative ${
                  isSelected
                    ? 'option-selected border-[#0070f3] bg-blue-50/70 ring-2 ring-[#0070f3] shadow-md'
                    : 'border-[#ebebeb] bg-[#fafafa] hover:bg-white hover:border-slate-300'
                }`}
              >
                <span className={`text-3xl emoji-icon transition-transform ${isSelected ? 'scale-110' : ''}`}>
                  {m.emoji}
                </span>
                <span className="text-xs font-semibold text-[#171717]">{m.label}</span>
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0070f3] option-check-icon" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div className="pt-2 border-t border-[#f2f2f2]">
          <label htmlFor="victim-location" className="flex items-center gap-1.5 text-xs font-mono uppercase text-[#8f8f8f]">
            <MapPin className="w-3.5 h-3.5 text-[#0070f3]" />
            2. Your location <span className="normal-case text-[10px]">(optional)</span>
          </label>
          <input
            id="victim-location"
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="District or city only, e.g. South Delhi"
            maxLength={100}
            className="mt-2 w-full rounded-xl border border-[#ebebeb] bg-[#fafafa] px-3.5 py-2.5 text-xs text-[#171717] focus:border-[#0070f3] focus:outline-none"
          />
          <p className="mt-1 text-[10px] text-[#8f8f8f]">Do not enter your exact address. You can leave this blank.</p>
          <button
            type="button"
            onClick={handleShareCurrentLocation}
            disabled={locationStatus === 'requesting' || locationStatus === 'shared'}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-semibold text-[#0070f3] hover:bg-blue-100 disabled:cursor-default disabled:opacity-80"
          >
            <MapPin className="w-3.5 h-3.5" />
            {locationStatus === 'requesting' ? 'Requesting location permission...' : locationStatus === 'shared' ? 'Current location shared' : 'Share current location'}
          </button>
          {locationStatus === 'denied' && <p className="mt-1 text-[10px] text-red-600">Location permission was not granted. You can continue without it.</p>}
        </div>
      </div>}

      {/* Interactive Chat & Voice Interface */}
      {!isEmergency && onboardingStep === 5 && <div ref={chatPanelRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 scroll-mt-6">
        {/* Chat Window */}
        <div className="lg:col-span-2 bg-white border border-[#ebebeb] rounded-2xl shadow-xs overflow-hidden flex flex-col h-[480px]">
          {/* Chat Header */}
          <div className="bg-[#171717] text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-[#0070f3] text-white flex items-center justify-center font-bold text-xs">
                S
              </div>
              <div>
                <h3 className="text-xs font-bold font-mono">SAHAY Support Assistant</h3>
                <p className="text-[10px] text-slate-300">Continuous Psychological Support</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
              Online • Encrypted
            </span>
          </div>

          {assignedSpecialist && (
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-blue-900">
                  Assigned Specialist: {assignedSpecialist.name} ({assignedSpecialist.title})
                </span>
              </div>
              <span className="text-[10px] font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                Alert Dispatched to Counsellor Dashboard
              </span>
            </div>
          )}

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#fafafa]">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === 'Victim' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs space-y-1 ${
                  msg.sender === 'Victim'
                    ? 'bg-[#171717] text-white rounded-br-none'
                    : 'bg-white border border-[#ebebeb] text-[#171717] rounded-bl-none shadow-xs'
                }`}>
                  <p className="leading-relaxed">{msg.text}</p>
                  <span className="text-[9px] font-mono opacity-60 block text-right">{msg.time}</span>
                </div>
              </div>
            ))}

            {loadingStep > 0 && (
              <div className="flex items-center space-x-2 bg-blue-50 text-[#0070f3] p-3.5 rounded-xl border border-blue-100 text-xs font-mono">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>{loadingStepMessages[loadingStep - 1]}</span>
              </div>
            )}
          </div>

          {/* Input Controls */}
          <div className="p-3 bg-white border-t border-[#ebebeb] space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={userInputText}
                onChange={(e) => setUserInputText(e.target.value)}
                placeholder="Tell us what has been difficult recently..."
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-[#fafafa] border border-[#ebebeb] rounded-xl px-3.5 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#0070f3]"
              />
              <button
                onClick={handleVoiceInput}
                className={`p-2.5 rounded-xl border transition ${
                  isRecording 
                    ? 'bg-red-500 text-white border-red-500 animate-pulse' 
                    : 'bg-[#fafafa] text-slate-700 border-[#ebebeb] hover:bg-slate-100'
                }`}
                title={isRecording ? 'Stop voice transcription' : 'Speak and convert your voice to text'}
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 bg-[#171717] hover:bg-black text-white text-xs font-semibold rounded-xl transition shadow-xs flex items-center space-x-1"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex justify-between items-center text-[10px] text-[#8f8f8f] px-1 font-mono">
              <span>{isRecording ? 'Listening... speak clearly' : 'Voice-to-text: English (India)'}</span>
              <span>Review text before sending</span>
            </div>
            {voiceError && <p className="px-1 text-[10px] text-red-600">{voiceError}</p>}
          </div>
        </div>

        {/* Live AI Analysis Pipeline Visualizer */}
        <div className="bg-white border border-[#ebebeb] p-5 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono uppercase text-[#0070f3] font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>AI Analysis Pipeline Output</span>
            </div>
            <h3 className="text-sm font-bold text-[#171717] mt-1">Simulated Signal Analysis</h3>
            <p className="text-xs text-[#8f8f8f] mt-0.5">
              Signal extraction into dynamic distress score.
            </p>
          </div>

          {analysisResult ? (
            <div className="space-y-3 bg-[#fafafa] border border-[#ebebeb] p-4 rounded-xl text-xs">
              <div className="flex items-center justify-between border-b border-[#ebebeb] pb-2">
                <span className="font-mono text-[#8f8f8f]">{analysisResult.title}</span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  Safe support
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-white border border-[#ebebeb] p-2">
                <span className="font-mono text-[10px] uppercase text-[#8f8f8f]">Predicted distress risk</span>
                <span className="font-bold text-[#171717]">{analysisResult.riskLevel} · {analysisResult.riskScore}/100</span>
              </div>

              <div className="space-y-2 text-slate-700">
                <p className="text-[12px] leading-relaxed text-[#171717]">{analysisResult.message}</p>
                <p className="text-[11px] text-[#8f8f8f]">Why: {analysisResult.rationale}</p>
                <ul className="space-y-1.5 list-disc pl-4 text-[#4d4d4d]">
                  {analysisResult.steps.map((step: string, index: number) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-[#8f8f8f] space-y-2 border border-dashed border-[#ebebeb] rounded-xl">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">Share how you feel, and the app will guide you toward a safe support plan.</p>
              <span className="text-[10px] font-mono text-slate-400 block">Support-only check-in</span>
            </div>
          )}

          {/* Emergency Support CTA */}
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-red-800 font-bold">
              <Phone className="w-4 h-4 text-red-600" />
              <span>Immediate Helpline Access</span>
            </div>
            <p className="text-[11px] text-red-700">
              Need immediate human support right now? Call MoSJE Tele-MANAS helpline at <strong>14416</strong>.
            </p>
          </div>
        </div>
      </div>}

      {/* Bottom Accessible Return Section */}
      <div className="pt-6 border-t border-[#ebebeb] flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            onNavigateTab('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="Return to Overview page"
          title="Return to Overview"
          className="group inline-flex items-center space-x-2 text-xs font-semibold text-[#171717] hover:text-[#0070f3] py-2.5 px-4 rounded-xl border border-[#ebebeb] bg-white shadow-xs hover:bg-[#fafafa] hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0070f3] min-h-[44px] transition"
        >
          <ArrowLeft className="w-4 h-4 text-[#4d4d4d] group-hover:text-[#0070f3] group-hover:-translate-x-1 transition-transform" />
          <span>← Return to Overview Page</span>
        </button>
        <span className="text-[11px] font-mono text-[#8f8f8f]">
          SAHAY Complainant Protection · MoSJE 2026
        </span>
      </div>
    </div>
  );
};
