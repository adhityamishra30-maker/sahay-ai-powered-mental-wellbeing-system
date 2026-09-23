import type { APIRoute } from 'astro';
import { geminiTriageConfig } from '../../lib/geminiTriageConfig';
import { cleanText, getClientIp, hashIp, isRateLimited, jsonResponse, readEnv } from '../../lib/security';

const SYSTEM_PROMPT = `You are SAHAY, a trauma-informed emotional support and triage assistant for a victim well-being monitoring system.
Your style is inspired by peer-reviewed trauma research: empathetic, calm, non-judgmental, and focused strictly on triage routing and early support.

${geminiTriageConfig.systemPromptAddition}

Strict Tone & Privacy Mandate:
- ${geminiTriageConfig.toneMandate}
- Never diagnose, prescribe, or mimic clinical medical/psychiatric therapy.
- Zero PII: Never expose or request real names, phone numbers, exact addresses, or case numbers.
- When the person needs help, state that SAHAY can guide them to their assigned counsellor and government support.
- If immediate danger, violence, or self-harm is detected, clearly guide them to local emergency services (112) or the MoSJE Tele-MANAS helpline at 14416.

Return only valid JSON with this exact shape:
{
  "title": "Support summary",
  "message": "short empathetic supportive response",
  "steps": ["three practical gentle next steps"],
  "riskScore": 0,
  "riskLevel": "Low|Moderate|High|Critical",
  "rationale": "brief non-diagnostic triage rationale based on trauma dimensions"
}
Risk scale: Low 0-24, Moderate 25-49, High 50-74, Critical 75-100.
If atrocity-related trauma indicators (severe neurobiological hyperarousal, broken trust, or systemic existential despair) are marked, reflect appropriate triage priority (High or Critical).`;

type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

function riskLevelFor(score: number): RiskLevel {
  return score >= 75 ? 'Critical' : score >= 50 ? 'High' : score >= 25 ? 'Moderate' : 'Low';
}

/**
 * Best-effort redaction before text leaves the server. Catches Indian mobile
 * numbers (with or without +91 / spaces / dashes), other long digit runs,
 * emails and Aadhaar-style 12-digit numbers. It cannot detect names or addresses.
 */
function redactPii(text: string): string {
  return text
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[EMAIL REDACTED]')
    .replace(/(?:\+?91[\s-]?)?(?:\d[\s-]?){9,11}\d/g, '[NUMBER REDACTED]');
}

/**
 * Local triage used when no AI provider is configured or the provider fails.
 * It never invents a higher score than the person's own answers support.
 */
function localTriage(input: { moodScore: number; isAtrocityRelated: boolean; neuroStress?: string; existentialTrauma?: string }) {
  let score = input.moodScore;
  if (input.isAtrocityRelated) score = Math.max(score, 70);
  if (input.neuroStress === 'Severe' || input.existentialTrauma === 'Severe') score = Math.max(score, 85);
  return { riskScore: score, riskLevel: riskLevelFor(score) };
}

// Overload / rate-limit / server errors are worth retrying or trying another model.
const TRANSIENT_STATUS = new Set([429, 500, 502, 503, 504]);

/**
 * Tries GEMINI_MODEL, then each model in GEMINI_FALLBACK_MODELS, retrying each
 * once after a short pause on transient errors (e.g. 503 "high demand").
 */
async function callGeminiWithFallback(apiKey: string, userContent: string): Promise<string | undefined> {
  const primary = readEnv('GEMINI_MODEL') || 'gemini-3.6-flash';
  const fallbacks = (readEnv('GEMINI_FALLBACK_MODELS') || 'gemini-3.5-flash,gemini-2.5-flash')
    .split(',').map(m => m.trim()).filter(Boolean);
  const models = [primary, ...fallbacks.filter(m => m !== primary)];
  let lastError: Error | undefined;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Key in a header, not the URL, so it never lands in proxy or access logs.
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: userContent }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
        }),
        signal: AbortSignal.timeout(20000)
      });

      if (response.ok) {
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
      }

      // Google's error body explains the cause (bad key, quota, model name) and contains no user content.
      const detail = (await response.text()).slice(0, 300);
      lastError = new Error(`Gemini API error ${response.status} (model "${model}"): ${detail}`);
      if (!TRANSIENT_STATUS.has(response.status)) throw lastError;
      console.warn(`[SAHAY] Gemini ${response.status} on "${model}" (attempt ${attempt}); retrying/falling back.`);
      if (attempt === 1) await new Promise(resolve => setTimeout(resolve, 800));
    }
  }
  throw lastError;
}

export const POST: APIRoute = async (context) => {
  const geminiKey = readEnv('GEMINI_API_KEY');
  const openAIKey = readEnv('OPENAI_API_KEY');
  const provider = geminiKey ? 'Gemini' : openAIKey ? 'OpenAI' : null;

  let triageInput = { moodScore: 0, isAtrocityRelated: false, neuroStress: undefined as string | undefined, existentialTrauma: undefined as string | undefined };

  try {
    if (isRateLimited(`chat:${hashIp(getClientIp(context)) ?? 'unknown'}`, 30, 10 * 60 * 1000)) {
      return jsonResponse({ error: 'Too many messages in a short time. If you need urgent help, call 112 or 14416.' }, 429);
    }

    const body = await context.request.json();
    const rawMessage = cleanText(body.message, 4000) ?? '';
    const mood = cleanText(body.mood, 60) ?? 'Not selected';
    const moodScore = Number.isFinite(body.moodScore) ? Math.max(0, Math.min(100, Number(body.moodScore))) : 0;
    const isAtrocityRelated = Boolean(body.isAtrocityRelated);

    // Trauma screening answers (only sent when the person completed the optional screening)
    const dims = body.triageDimensions && typeof body.triageDimensions === 'object' ? body.triageDimensions : body;
    const neuroStress = cleanText(dims.neuroStress, 30);
    const trustWithdrawal = cleanText(dims.trustWithdrawal, 30);
    const existentialTrauma = cleanText(dims.existentialTrauma, 30);
    triageInput = { moodScore, isAtrocityRelated, neuroStress, existentialTrauma };

    if (!provider) {
      const { riskScore, riskLevel } = localTriage(triageInput);
      return jsonResponse({
        title: isAtrocityRelated ? 'PoA Act Psychosocial Triage Summary' : 'Support Check-in Summary',
        message: 'Thank you for sharing how you feel. Your voice is heard, and you do not have to carry this alone. A counsellor will review your check-in.',
        steps: [
          'Take a slow, deep breath.',
          'Your check-in will be reviewed by a counsellor.',
          'If you feel in immediate distress, Tele-MANAS 14416 is available 24/7, or call 112 in an emergency.'
        ],
        riskScore,
        riskLevel,
        rationale: isAtrocityRelated
          ? `Rule-based estimate from your screening answers (no AI used): stress ${neuroStress || 'not reported'}, trust ${trustWithdrawal || 'not reported'}, existential distress ${existentialTrauma || 'not reported'}.`
          : 'Rule-based estimate from the feeling you selected (no AI used).',
        source: 'local-rules'
      });
    }

    // Only the redacted message, mood and screening answers are sent. No name, age, district, contact or location.
    const userContent = JSON.stringify({
      checkInMessage: redactPii(rawMessage) || 'Feeling check-in only',
      selectedMood: mood,
      moodScore,
      isAtrocityRelated,
      dimensions: isAtrocityRelated ? {
        neurobiologicalStress: neuroStress || 'Not reported',
        interpersonalTrust: trustWithdrawal || 'Not reported',
        existentialTrauma: existentialTrauma || 'Not reported'
      } : undefined
    });

    let content: string | undefined;

    if (provider === 'Gemini') {
      content = await callGeminiWithFallback(geminiKey!, userContent);
    } else if (provider === 'OpenAI') {
      const model = readEnv('OPENAI_MODEL') || 'gpt-4o-mini';
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAIKey}`
        },
        body: JSON.stringify({
          model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userContent }
          ],
          temperature: 0.2
        })
      });

      if (!openAIResponse.ok) {
        const detail = (await openAIResponse.text()).slice(0, 300);
        throw new Error(`OpenAI API error ${openAIResponse.status}: ${detail}`);
      }

      const data = await openAIResponse.json();
      content = data.choices?.[0]?.message?.content;
    }

    if (!content) {
      throw new Error('No content returned from AI provider.');
    }

    // Some models wrap JSON in ```json fences; strip them before parsing.
    const parsed = JSON.parse(content.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, ''));
    const riskScore = Number.isFinite(parsed.riskScore) ? Math.max(0, Math.min(100, Math.round(parsed.riskScore))) : localTriage(triageInput).riskScore;
    return jsonResponse({
      title: typeof parsed.title === 'string' ? parsed.title : 'Support summary',
      message: typeof parsed.message === 'string' ? parsed.message : 'Thank you for checking in.',
      steps: Array.isArray(parsed.steps) ? parsed.steps.filter((s: unknown) => typeof s === 'string').slice(0, 5) : [],
      riskScore,
      riskLevel: riskLevelFor(riskScore),
      rationale: typeof parsed.rationale === 'string' ? parsed.rationale : '',
      source: provider === 'Gemini' ? 'gemini' : 'openai'
    });
  } catch (err) {
    const reason = err instanceof Error
      ? `${err.name}: ${err.message || '(no message)'}${err.cause ? ` | cause: ${String((err.cause as Error).message ?? err.cause)}` : ''}`
      : String(err);
    console.error(`[SAHAY] AI triage failed (provider: ${provider ?? 'none'}); using local rules. ${reason}`);
    const { riskScore, riskLevel } = localTriage(triageInput);
    return jsonResponse({
      title: 'Support check-in summary',
      message: 'Thank you for checking in. Your feelings matter. The AI assistant is unavailable right now, so a counsellor will review your check-in directly.',
      steps: [
        'Take a quiet moment and breathe slowly.',
        'A counsellor will review your check-in notes.',
        'If you need immediate support, call Tele-MANAS at 14416, or 112 in an emergency.'
      ],
      riskScore,
      riskLevel,
      rationale: 'The AI service was unavailable, so this is a rule-based estimate from your selected feeling and screening answers.',
      source: 'local-fallback'
    });
  }
};
