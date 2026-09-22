export interface CaseData {
  id: string;
  alias: string;
  district: string;
  state: string;
  category: string;
  currentScore: number;
  previousScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  trend: 'Improving' | 'Stable' | 'Escalating';
  lastCheckIn: string;
  assignedCounsellor: string;
  status: 'Stable' | 'Requires Human Review' | 'Intervention Active' | 'Resolved';
  longitudinalData: { day: string; score: number; label?: string; note?: string }[];
  aiSignals: {
    sentiment: string;
    sentimentScore: number;
    engagement: string;
    engagementIndex: string;
    voiceStress: string;
    voiceStressScore: number;
    emotionalState: string[];
  };
  explainableFactors: {
    factor: string;
    contribution: number;
    description: string;
    type: 'negative' | 'positive';
  }[];
  interventions: {
    id: string;
    title: string;
    reason: string;
    priority: 'High' | 'Medium' | 'Low';
    department: string;
    assignedTo?: string;
    nextFollowUp?: string;
    status: 'Pending Review' | 'Assigned' | 'Scheduled' | 'Completed';
  }[];
  timeline: {
    id: string;
    date: string;
    time: string;
    title: string;
    description: string;
    type: 'system' | 'checkin' | 'alert' | 'action';
  }[];
}

export interface AlertItem {
  id: string;
  caseId: string;
  victimAlias: string;
  district: string;
  riskScore: number;
  previousScore: number;
  change: number;
  severity: 'Critical' | 'High' | 'Moderate';
  detectedFactors: string[];
  time: string;
  assignedOfficer: string;
  status: 'Open' | 'Acknowledged' | 'Assigned' | 'Resolved';
  authorityRecipient?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export function getAuthorityRecipient(riskScore: number): string {
  if (riskScore >= 90) return 'National Policymaker (MoSJE Delhi)';
  if (riskScore >= 75) return 'State Authority Officer';
  return 'District Authority (MoSJE Officer)';
}

export interface CounsellorAvailability {
  name: string;
  available: boolean;
  activeCases: number;
}

export const COUNSELLOR_AVAILABILITY: CounsellorAvailability[] = [
  { name: 'Dr. Sunita Sharma (Sr. Trauma Specialist)', available: true, activeCases: 3 },
  { name: 'Dr. Anita Roy (Senior Counsellor)', available: true, activeCases: 2 },
  { name: 'Dr. Meera N. (District Counsellor)', available: true, activeCases: 4 },
  { name: 'Counsellor Rajesh K. (Case Manager)', available: false, activeCases: 6 }
];

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  targetCase: string;
  details: string;
}

export interface CheckinRecord {
  id: string;
  message: string;
  mood: string;
  riskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  timestamp: string;
  locationLabel?: string;
  currentLocationShared: boolean;
}

export interface SensitiveSupportRecord {
  id: string;
  nameAge: string;
  district: string;
  state: string;
  areaType: 'Urban' | 'Rural';
  trustedContact: string;
  trustedPhone: string;
  timestamp: string;
}

/**
 * Standardized Risk Category Scale:
 * 0 - 24   => Low Risk
 * 25 - 49  => Moderate Risk
 * 50 - 74  => High Risk
 * 75 - 100 => Critical Risk
 */
export function getRiskCategory(score: number): 'Low' | 'Moderate' | 'High' | 'Critical' {
  if (score >= 75) return 'Critical';
  if (score >= 50) return 'High';
  if (score >= 25) return 'Moderate';
  return 'Low';
}

const PROTOTYPE_CASES: CaseData[] = [
  {
    id: "SAHAY-1042",
    alias: "Complainant #1042 (PoA Case)",
    district: "South Delhi District",
    state: "Delhi NCR",
    category: "PoA Act Legal & Rehabilitation Support",
    currentScore: 82,
    previousScore: 68,
    riskLevel: "Critical",
    trend: "Escalating",
    lastCheckIn: "10 mins ago (Web App Chatbot)",
    assignedCounsellor: "Dr. Sunita Sharma (Sr. Trauma Specialist)",
    status: "Requires Human Review",
    longitudinalData: [
      { day: "Day 1", score: 32, label: "Baseline", note: "Initial check-in after complaint registration. Stable tone." },
      { day: "Day 4", score: 35, label: "Follow-up 1", note: "Routine response. Mild sleep difficulty reported." },
      { day: "Day 7", score: 41, label: "Pre-Trial", note: "Court summons received. Anxious phrasing detected." },
      { day: "Day 10", score: 48, label: "Follow-up 2", note: "Negative sentiment rising. Latency between replies." },
      { day: "Day 13", score: 61, label: "Voice Check", note: "Elevated voice-stress index 0.78 (spectral jitter)." },
      { day: "Day 16", score: 74, label: "Missed Session", note: "Unfulfilled scheduled follow-up. Reduced engagement." },
      { day: "Day 18", score: 82, label: "Acute Alert", note: "Recent text: 'I am terrified about testifying tomorrow, I can't sleep or focus.' SHAP threshold breached." }
    ],
    aiSignals: {
      sentiment: "Negative (-0.84)",
      sentimentScore: -0.84,
      engagement: "Decreasing (-42%)",
      engagementIndex: "0.38 / 1.0",
      voiceStress: "Elevated (0.78 Hz Jitter)",
      voiceStressScore: 0.78,
      emotionalState: ["Acute Anxiety", "Intrusive Fear", "Sleep Disturbance"]
    },
    explainableFactors: [
      { factor: "Negative Sentiment Trend", contribution: 18, description: "NLP Transformer detected acute negative emotion trajectory over 3 check-ins.", type: "negative" },
      { factor: "Reduced Engagement Latency", contribution: 12, description: "Response latency increased by 3.2 days; missed 1 scheduled check-in.", type: "negative" },
      { factor: "Anxiety & Fear Language", contribution: 9, description: "High frequency of panic keywords ('terrified', 'can't sleep', 'court fear').", type: "negative" },
      { factor: "Elevated Voice-Stress Indicator", contribution: 7, description: "Acoustic audio analysis showed high micro-tremors and spectral jitter.", type: "negative" },
      { factor: "Upcoming Legal Milestones", contribution: 5, description: "Cross-referenced scheduled court testimony in 24 hours.", type: "negative" }
    ],
    interventions: [
      {
        id: "INT-1042-1",
        title: "Trauma-Informed Crisis Counselling",
        reason: "Persistent negative sentiment + escalating distress trajectory prior to court hearing.",
        priority: "High",
        department: "Clinical Psychology & Trauma Support Cell",
        assignedTo: "Unassigned",
        status: "Pending Review"
      },
      {
        id: "INT-1042-2",
        title: "Witness Protection & Court Escort Assistance",
        reason: "Victim expressed extreme fear regarding court appearance and safety.",
        priority: "High",
        department: "District Legal Services Authority (DLSA)",
        assignedTo: "Unassigned",
        status: "Pending Review"
      },
      {
        id: "INT-1042-3",
        title: "Psychiatric Evaluation & Sleep Health Referral",
        reason: "Self-reported severe sleep deprivation and somatic panic symptoms.",
        priority: "Medium",
        department: "District Hospital Mental Health Department",
        assignedTo: "Unassigned",
        status: "Pending Review"
      },
      {
        id: "INT-1042-4",
        title: "Victim Relief Compensation Acceleration",
        reason: "Financial hardship contributing to secondary distress during trial phase.",
        priority: "Medium",
        department: "MoSJE District Rehabilitation Officer",
        assignedTo: "District Rehab Officer V. K. Singh",
        nextFollowUp: "18 September 2026",
        status: "Assigned"
      }
    ],
    timeline: [
      { id: "TL-1", date: "2026-08-25", time: "09:30 AM", title: "Complaint Registered & Onboarded", description: "Case onboarded into SAHAY monitoring protocol under MoSJE directives.", type: "system" },
      { id: "TL-2", date: "2026-08-25", time: "04:15 PM", title: "Initial Baseline Check-in", description: "Victim completed inaugural web check-in. Baseline distress score set to 32 (Low).", type: "checkin" },
      { id: "TL-3", date: "2026-09-01", time: "11:00 AM", title: "Pre-Trial Notice Acknowledged", description: "System sent automated preparation check-in. Distress score rose slightly to 41.", type: "system" },
      { id: "TL-4", date: "2026-09-07", time: "02:20 PM", title: "Voice Stress Check-in Recorded", description: "IVRS voice check-in recorded. Voice stress analysis flagged spectral jitter (0.78).", type: "checkin" },
      { id: "TL-5", date: "2026-09-10", time: "06:00 PM", title: "Follow-up Engagement Missed", description: "Scheduled IVRS callback unanswered. Engagement metric decayed.", type: "alert" },
      { id: "TL-6", date: "2026-09-12", time: "09:15 AM", title: "Critical Risk Threshold Breached (Score 82)", description: "NLP & SHAP Explainability engine triggered Critical Alert. Counsellor review required.", type: "alert" }
    ]
  },
  {
    id: "SAHAY-1028",
    alias: "Complainant #1028",
    district: "Jaipur District",
    state: "Rajasthan",
    category: "SC/ST Prevention of Atrocities Act",
    currentScore: 91,
    previousScore: 84,
    riskLevel: "Critical",
    trend: "Escalating",
    lastCheckIn: "2 hours ago (IVRS Voice Call)",
    assignedCounsellor: "Dr. Anita Roy",
    status: "Requires Human Review",
    longitudinalData: [
      { day: "Day 1", score: 45 }, { day: "Day 5", score: 58 }, { day: "Day 10", score: 72 }, { day: "Day 15", score: 84 }, { day: "Day 18", score: 91 }
    ],
    aiSignals: {
      sentiment: "Severe Negative (-0.92)",
      sentimentScore: -0.92,
      engagement: "Critical Drop (-65%)",
      engagementIndex: "0.15 / 1.0",
      voiceStress: "Critical (0.91 Hz Jitter)",
      voiceStressScore: 0.91,
      emotionalState: ["Acute Trauma Response", "Severe Despair", "High Crisis Risk"]
    },
    explainableFactors: [
      { factor: "High Crisis Phrasing", contribution: 26, description: "Keyword markers associated with severe distress.", type: "negative" },
      { factor: "Acoustic Tremor Peak", contribution: 22, description: "Voice stress analysis detected frequency volatility.", type: "negative" },
      { factor: "Isolation Indicators", contribution: 18, description: "No peer or family contact reported.", type: "negative" }
    ],
    interventions: [
      { id: "INT-1028-1", title: "Emergency Rapid Response Team Dispatch", reason: "Immediate distress score > 90.", priority: "High", department: "District Crisis Intervention Team", status: "Assigned" }
    ],
    timeline: [
      { id: "TL-1028-1", date: "2026-09-12", time: "07:30 AM", title: "Critical Alert Issued", description: "Voice check-in analysis triggered maximum priority alert.", type: "alert" }
    ]
  },
  {
    id: "SAHAY-1064",
    alias: "Complainant #1064",
    district: "Bhopal District",
    state: "Madhya Pradesh",
    category: "Victim Compensation Protocol",
    currentScore: 88,
    previousScore: 76,
    riskLevel: "Critical",
    trend: "Escalating",
    lastCheckIn: "45 mins ago (SMS Gateway)",
    assignedCounsellor: "Dr. Meera N.",
    status: "Requires Human Review",
    longitudinalData: [
      { day: "Day 1", score: 38 }, { day: "Day 6", score: 50 }, { day: "Day 12", score: 68 }, { day: "Day 18", score: 88 }
    ],
    aiSignals: {
      sentiment: "Negative (-0.79)",
      sentimentScore: -0.79,
      engagement: "Low (-50%)",
      engagementIndex: "0.30 / 1.0",
      voiceStress: "Elevated (0.81)",
      voiceStressScore: 0.81,
      emotionalState: ["Helplessness", "Intense Anxiety"]
    },
    explainableFactors: [
      { factor: "Repeated Helplessness Sentiments", contribution: 21, description: "Multiple SMS check-ins expressing loss of agency.", type: "negative" }
    ],
    interventions: [
      { id: "INT-1064-1", title: "Urgent Tele-Counselling Outreach", reason: "Escalation to Critical threshold.", priority: "High", department: "State Tele-MANAS Cell", status: "Pending Review" }
    ],
    timeline: [
      { id: "TL-1064-1", date: "2026-09-12", time: "08:45 AM", title: "Critical Risk Escalation", description: "SMS analysis updated score to 88.", type: "alert" }
    ]
  },
  {
    id: "SAHAY-1049",
    alias: "Complainant #1049",
    district: "Ahmedabad District",
    state: "Gujarat",
    category: "Rehabilitation & Protection",
    currentScore: 76,
    previousScore: 65,
    riskLevel: "Critical",
    trend: "Escalating",
    lastCheckIn: "3 hours ago (Mobile App)",
    assignedCounsellor: "Dr. Sunita Sharma",
    status: "Requires Human Review",
    longitudinalData: [
      { day: "Day 1", score: 30 }, { day: "Day 6", score: 42 }, { day: "Day 12", score: 59 }, { day: "Day 18", score: 76 }
    ],
    aiSignals: {
      sentiment: "Negative (-0.71)",
      sentimentScore: -0.71,
      engagement: "Moderate (-25%)",
      engagementIndex: "0.55 / 1.0",
      voiceStress: "Moderate (0.62)",
      voiceStressScore: 0.62,
      emotionalState: ["Somatic Distress", "Apprehension"]
    },
    explainableFactors: [
      { factor: "Negative Sentiment Shift", contribution: 16, description: "Sentiment dropped significantly post-investigation interview.", type: "negative" }
    ],
    interventions: [
      { id: "INT-1049-1", title: "Legal Aid Officer Consultation", reason: "Uncertainty regarding witness protection.", priority: "High", department: "DLSA Ahmedabad", status: "Pending Review" }
    ],
    timeline: [
      { id: "TL-1049-1", date: "2026-09-11", time: "05:10 PM", title: "Risk Level Raised to Critical", description: "Check-in analysis pushed score past 75.", type: "alert" }
    ]
  },
  {
    id: "SAHAY-1085",
    alias: "Complainant #1085",
    district: "Hyderabad District",
    state: "Telangana",
    category: "PoA Act Protection & Support",
    currentScore: 71,
    previousScore: 62,
    riskLevel: "High",
    trend: "Escalating",
    lastCheckIn: "5 hours ago (Web Portal)",
    assignedCounsellor: "Dr. K. Rao",
    status: "Intervention Active",
    longitudinalData: [
      { day: "Day 1", score: 35 }, { day: "Day 7", score: 48 }, { day: "Day 14", score: 62 }, { day: "Day 18", score: 71 }
    ],
    aiSignals: {
      sentiment: "Negative (-0.68)",
      sentimentScore: -0.68,
      engagement: "Stable (0.65)",
      engagementIndex: "0.65 / 1.0",
      voiceStress: "Elevated (0.70)",
      voiceStressScore: 0.70,
      emotionalState: ["Anxiety", "Sleep Disturbance"]
    },
    explainableFactors: [
      { factor: "Anxiety Trajectory", contribution: 14, description: "Gradual rise over 3 consecutive check-ins.", type: "negative" }
    ],
    interventions: [
      { id: "INT-1085-1", title: "Trauma Counselling Session", reason: "High risk classification.", priority: "High", department: "District Counselling Center", status: "Assigned" }
    ],
    timeline: [
      { id: "TL-1085-1", date: "2026-09-11", time: "02:00 PM", title: "Counsellor Assigned", description: "Dr. K. Rao scheduled initial trauma review.", type: "action" }
    ]
  },
  {
    id: "SAHAY-1052",
    alias: "Complainant #1052",
    district: "Kolkata South",
    state: "West Bengal",
    category: "Rehabilitation Support",
    currentScore: 52,
    previousScore: 50,
    riskLevel: "High",
    trend: "Stable",
    lastCheckIn: "18 hours ago (Chatbot)",
    assignedCounsellor: "Counsellor Rajesh K.",
    status: "Stable",
    longitudinalData: [
      { day: "Day 1", score: 48 }, { day: "Day 7", score: 51 }, { day: "Day 14", score: 50 }, { day: "Day 18", score: 52 }
    ],
    aiSignals: {
      sentiment: "Neutral (-0.22)",
      sentimentScore: -0.22,
      engagement: "Good (0.75)",
      engagementIndex: "0.75 / 1.0",
      voiceStress: "Moderate (0.48)",
      voiceStressScore: 0.48,
      emotionalState: ["Moderate Worry"]
    },
    explainableFactors: [
      { factor: "Stable Trend", contribution: 8, description: "No sharp variance in sentiment or voice metrics.", type: "positive" }
    ],
    interventions: [],
    timeline: []
  },
  {
    id: "SAHAY-1092",
    alias: "Complainant #1092",
    district: "Chandigarh District",
    state: "Punjab & Haryana",
    category: "Legal Aid Tracking",
    currentScore: 49,
    previousScore: 44,
    riskLevel: "Moderate",
    trend: "Escalating",
    lastCheckIn: "6 hours ago (Mobile App)",
    assignedCounsellor: "Counsellor N. Kaur",
    status: "Requires Human Review",
    longitudinalData: [
      { day: "Day 1", score: 32 }, { day: "Day 7", score: 38 }, { day: "Day 14", score: 44 }, { day: "Day 18", score: 49 }
    ],
    aiSignals: {
      sentiment: "Slight Negative (-0.38)",
      sentimentScore: -0.38,
      engagement: "Moderate (0.60)",
      engagementIndex: "0.60 / 1.0",
      voiceStress: "Moderate (0.50)",
      voiceStressScore: 0.50,
      emotionalState: ["Pre-trial Strain"]
    },
    explainableFactors: [
      { factor: "Pre-trial Stress Trend", contribution: 11, description: "Gradual rise as court date approaches.", type: "negative" }
    ],
    interventions: [],
    timeline: []
  },
  {
    id: "SAHAY-1015",
    alias: "Complainant #1015",
    district: "Bengaluru Urban",
    state: "Karnataka",
    category: "Compensation Monitoring",
    currentScore: 45,
    previousScore: 42,
    riskLevel: "Moderate",
    trend: "Stable",
    lastCheckIn: "1 day ago (IVRS)",
    assignedCounsellor: "Counsellor Priya M.",
    status: "Stable",
    longitudinalData: [
      { day: "Day 1", score: 40 }, { day: "Day 7", score: 42 }, { day: "Day 14", score: 44 }, { day: "Day 18", score: 45 }
    ],
    aiSignals: {
      sentiment: "Neutral (-0.15)",
      sentimentScore: -0.15,
      engagement: "High (0.85)",
      engagementIndex: "0.85 / 1.0",
      voiceStress: "Low (0.35)",
      voiceStressScore: 0.35,
      emotionalState: ["Mild Concern", "Adaptive Coping"]
    },
    explainableFactors: [
      { factor: "Consistent Engagement", contribution: 10, description: "Regular daily check-ins maintaining stability.", type: "positive" }
    ],
    interventions: [
      { id: "INT-1015-1", title: "Routine Weekly Check-in", reason: "Standard monitoring protocol.", priority: "Low", department: "MoSJE District Helpline", status: "Scheduled" }
    ],
    timeline: []
  },
  {
    id: "SAHAY-1077",
    alias: "Complainant #1077",
    district: "Patna District",
    state: "Bihar",
    category: "PoA Protection",
    currentScore: 29,
    previousScore: 31,
    riskLevel: "Moderate",
    trend: "Stable",
    lastCheckIn: "1 day ago (IVRS)",
    assignedCounsellor: "Counsellor V. Singh",
    status: "Stable",
    longitudinalData: [
      { day: "Day 1", score: 35 }, { day: "Day 7", score: 32 }, { day: "Day 14", score: 31 }, { day: "Day 18", score: 29 }
    ],
    aiSignals: {
      sentiment: "Neutral (+0.10)",
      sentimentScore: 0.10,
      engagement: "High (0.80)",
      engagementIndex: "0.80 / 1.0",
      voiceStress: "Low (0.28)",
      voiceStressScore: 0.28,
      emotionalState: ["Stable"]
    },
    explainableFactors: [],
    interventions: [],
    timeline: []
  },
  {
    id: "SAHAY-1001",
    alias: "Complainant #1001",
    district: "Pune District",
    state: "Maharashtra",
    category: "PoA Compensation",
    currentScore: 24,
    previousScore: 28,
    riskLevel: "Low",
    trend: "Improving",
    lastCheckIn: "2 days ago (Web Chat)",
    assignedCounsellor: "Dr. R. K. Varma",
    status: "Stable",
    longitudinalData: [
      { day: "Day 1", score: 45 }, { day: "Day 7", score: 36 }, { day: "Day 14", score: 28 }, { day: "Day 18", score: 24 }
    ],
    aiSignals: {
      sentiment: "Positive (+0.42)",
      sentimentScore: 0.42,
      engagement: "High (0.90)",
      engagementIndex: "0.90 / 1.0",
      voiceStress: "Low (0.22)",
      voiceStressScore: 0.22,
      emotionalState: ["Reassurance", "Progressive Recovery"]
    },
    explainableFactors: [
      { factor: "Positive Counselling Response", contribution: 15, description: "Victim reported high satisfaction with assigned legal aid.", type: "positive" }
    ],
    interventions: [
      { id: "INT-1001-1", title: "Rehabilitation Milestones Check", reason: "Distress score < 30. Preparing case closure.", priority: "Low", department: "District Rehab Cell", status: "Completed" }
    ],
    timeline: []
  },
  {
    id: "SAHAY-1104",
    alias: "Complainant #1104",
    district: "Ranchi District",
    state: "Jharkhand",
    category: "Trial Support",
    currentScore: 22,
    previousScore: 25,
    riskLevel: "Low",
    trend: "Improving",
    lastCheckIn: "4 days ago (App)",
    assignedCounsellor: "Dr. S. Bannerjee",
    status: "Stable",
    longitudinalData: [
      { day: "Day 1", score: 40 }, { day: "Day 7", score: 30 }, { day: "Day 14", score: 25 }, { day: "Day 18", score: 22 }
    ],
    aiSignals: {
      sentiment: "Positive (+0.35)",
      sentimentScore: 0.35,
      engagement: "Good (0.82)",
      engagementIndex: "0.82 / 1.0",
      voiceStress: "Low (0.20)",
      voiceStressScore: 0.20,
      emotionalState: ["Reassured"]
    },
    explainableFactors: [],
    interventions: [],
    timeline: []
  },
  {
    id: "SAHAY-1033",
    alias: "Complainant #1033",
    district: "Lucknow District",
    state: "Uttar Pradesh",
    category: "Rehabilitation & Housing",
    currentScore: 18,
    previousScore: 22,
    riskLevel: "Low",
    trend: "Improving",
    lastCheckIn: "3 days ago (SMS)",
    assignedCounsellor: "Counsellor Amit P.",
    status: "Stable",
    longitudinalData: [
      { day: "Day 1", score: 52 }, { day: "Day 7", score: 38 }, { day: "Day 14", score: 22 }, { day: "Day 18", score: 18 }
    ],
    aiSignals: {
      sentiment: "Positive (+0.58)",
      sentimentScore: 0.58,
      engagement: "High (0.95)",
      engagementIndex: "0.95 / 1.0",
      voiceStress: "Low (0.18)",
      voiceStressScore: 0.18,
      emotionalState: ["Calm", "Supported"]
    },
    explainableFactors: [
      { factor: "Successful Financial Relief Disbursement", contribution: 20, description: "Compensation credited; distress declined rapidly.", type: "positive" }
    ],
    interventions: [],
    timeline: []
  }
];

export const INITIAL_CASES: CaseData[] = PROTOTYPE_CASES.slice(0, 5);

export const INITIAL_ALERTS: AlertItem[] = [
  {
    id: "ALT-9901",
    caseId: "SAHAY-1042",
    victimAlias: "Complainant #1042",
    district: "South Delhi District",
    riskScore: 82,
    previousScore: 68,
    change: 14,
    severity: "Critical",
    detectedFactors: [
      "Increasing negative sentiment trend (-0.84)",
      "Reduced response engagement latency (+3.2 days)",
      "Elevated voice-stress acoustic jitter (0.78)",
      "Repeated acute court anxiety expressions"
    ],
    time: "10 mins ago",
    assignedOfficer: "Dr. Sunita Sharma",
    status: "Open"
  },
  {
    id: "ALT-9902",
    caseId: "SAHAY-1028",
    victimAlias: "Complainant #1028",
    district: "Jaipur District",
    riskScore: 91,
    previousScore: 84,
    change: 7,
    severity: "Critical",
    detectedFactors: [
      "Distress threshold > 90 breached",
      "Crisis language detected in IVRS transcription",
      "Acoustic tremor peak 0.91"
    ],
    time: "2 hours ago",
    assignedOfficer: "Dr. Anita Roy",
    status: "Open"
  },
  {
    id: "ALT-9903",
    caseId: "SAHAY-1064",
    victimAlias: "Complainant #1064",
    district: "Bhopal District",
    riskScore: 88,
    previousScore: 76,
    change: 12,
    severity: "Critical",
    detectedFactors: [
      "SMS check-in negative sentiment spike",
      "Expression of severe hopelessness regarding rehabilitation"
    ],
    time: "45 mins ago",
    assignedOfficer: "Dr. Meera N.",
    status: "Acknowledged"
  },
  {
    id: "ALT-9904",
    caseId: "SAHAY-1049",
    victimAlias: "Complainant #1049",
    district: "Ahmedabad District",
    riskScore: 76,
    previousScore: 65,
    change: 11,
    severity: "Critical",
    detectedFactors: [
      "Post-investigation interview distress surge",
      "Somatic anxiety reported via mobile app"
    ],
    time: "3 hours ago",
    assignedOfficer: "Dr. Sunita Sharma",
    status: "Assigned"
  },
  {
    id: "ALT-9905",
    caseId: "SAHAY-1085",
    victimAlias: "Complainant #1085",
    district: "Hyderabad District",
    riskScore: 71,
    previousScore: 62,
    change: 9,
    severity: "High",
    detectedFactors: [
      "Gradual distress score rise across 3 check-ins"
    ],
    time: "5 hours ago",
    assignedOfficer: "Dr. K. Rao",
    status: "Resolved"
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: "LOG-5001",
    timestamp: "2026-09-12 09:42:15",
    actor: "Dr. Sunita Sharma",
    role: "Senior Counsellor",
    action: "VIEW_CASE_DETAILS",
    targetCase: "SAHAY-1042",
    details: "Accessed full explainable AI breakdown and longitudinal distress profile."
  },
  {
    id: "LOG-5002",
    timestamp: "2026-09-12 09:45:30",
    actor: "Dr. Sunita Sharma",
    role: "Senior Counsellor",
    action: "ACKNOWLEDGE_ALERT",
    targetCase: "SAHAY-1042",
    details: "Acknowledged Critical Alert ALT-9901. Initialized human decision-in-the-loop review."
  },
  {
    id: "LOG-5003",
    timestamp: "2026-09-12 09:48:10",
    actor: "Dr. Sunita Sharma",
    role: "Senior Counsellor",
    action: "ASSIGN_INTERVENTION",
    targetCase: "SAHAY-1042",
    details: "Assigned Trauma-Informed Crisis Counselling to Clinical Psychology Unit."
  },
  {
    id: "LOG-5004",
    timestamp: "2026-09-12 09:50:02",
    actor: "System AI Pipeline",
    role: "Automated Engine",
    action: "DYNAMIC_RISK_CLASSIFICATION",
    targetCase: "SAHAY-1042",
    details: "SHAP Explainability vector computed: +18 Negative Sentiment, +12 Latency, +7 Voice Stress."
  },
  {
    id: "LOG-5005",
    timestamp: "2026-09-12 08:30:11",
    actor: "District Officer (South Delhi)",
    role: "District Authority",
    action: "AUDIT_REHABILITATION_STATUS",
    targetCase: "SAHAY-1042",
    details: "Verified MoSJE victim compensation grant status."
  }
];

export const DISTRICT_ANALYTICS_DATA = [
  { district: "South Delhi", state: "Delhi NCR", total: 42, low: 18, moderate: 14, high: 7, critical: 3, highRiskCount: 10 },
  { district: "Jaipur", state: "Rajasthan", total: 38, low: 15, moderate: 13, high: 6, critical: 4, highRiskCount: 10 },
  { district: "Bhopal", state: "Madhya Pradesh", total: 31, low: 14, moderate: 10, high: 5, critical: 2, highRiskCount: 7 },
  { district: "Ahmedabad", state: "Gujarat", total: 29, low: 12, moderate: 11, high: 5, critical: 1, highRiskCount: 6 },
  { district: "Hyderabad", state: "Telangana", total: 35, low: 19, moderate: 10, high: 5, critical: 1, highRiskCount: 6 },
  { district: "Pune", state: "Maharashtra", total: 27, low: 17, moderate: 7, high: 3, critical: 0, highRiskCount: 3 },
  { district: "Bengaluru Urban", state: "Karnataka", total: 33, low: 20, moderate: 9, high: 3, critical: 1, highRiskCount: 4 },
  { district: "Lucknow", state: "Uttar Pradesh", total: 40, low: 22, moderate: 12, high: 5, critical: 1, highRiskCount: 6 }
];
