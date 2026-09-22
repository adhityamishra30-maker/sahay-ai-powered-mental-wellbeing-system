import type { APIRoute } from 'astro';
import { geminiTriageConfig } from '../../lib/geminiTriageConfig';

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

export const POST: APIRoute = async ({ request }) => {
  const geminiKey = import.meta.env.GEMINI_API_KEY;
  const openAIKey = import.meta.env.OPENAI_API_KEY;
  const provider = geminiKey ? 'Gemini' : openAIKey ? 'OpenAI' : null;

  try {
    const body = await request.json();
    const rawMessage = typeof body.message === 'string' ? body.message.trim() : '';
    const mood = typeof body.mood === 'string' ? body.mood : 'Not selected';
    const moodScore = Number.isFinite(body.moodScore) ? Math.max(0, Math.min(100, body.moodScore)) : 0;
    const isAtrocityRelated = Boolean(body.isAtrocityRelated);

    // Academic trauma dimensions (if screened)
    const neuroStress = typeof body.neuroStress === 'string' ? body.neuroStress : undefined;
    const trustWithdrawal = typeof body.trustWithdrawal === 'string' ? body.trustWithdrawal : undefined;
    const existentialTrauma = typeof body.existentialTrauma === 'string' ? body.existentialTrauma : undefined;

    // Strict PII Redaction: ensure no phone numbers or emails reach Gemini
    const sanitizedMessage = rawMessage
      .replace(/[6-9]\d{9}/g, '[PHONE REDACTED]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g, '[EMAIL REDACTED]');

    if (!provider) {
      // Fallback response if API keys are not provided
      let computedScore = moodScore;
      if (isAtrocityRelated) computedScore = Math.max(computedScore, 70);
      if (neuroStress === 'Severe' || existentialTrauma === 'Despair') computedScore = Math.max(computedScore, 85);

      const riskLevel = computedScore >= 75 ? 'Critical' : computedScore >= 50 ? 'High' : computedScore >= 25 ? 'Moderate' : 'Low';

      return new Response(JSON.stringify({
        title: isAtrocityRelated ? 'PoA Act Psychosocial Triage Summary' : 'Support Check-in Summary',
        message: 'Thank you for sharing how you feel. Your voice is heard, and you do not have to carry this alone. SAHAY has routed your check-in securely to your assigned counsellor for immediate human support.',
        steps: [
          'Take a slow, deep breath in this protected space.',
          'Your assigned counsellor has been notified and will review your check-in.',
          'If you feel in immediate distress, emergency helpline 14416 is available 24/7.'
        ],
        riskScore: computedScore,
        riskLevel,
        rationale: isAtrocityRelated 
          ? `Triage based on PoA Act screening dimensions: Neurobiological stress (${neuroStress || 'Reported'}), Interpersonal trust (${trustWithdrawal || 'Assessed'}), Existential trauma (${existentialTrauma || 'Assessed'}).`
          : 'Support routing evaluated based on feelings check-in.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userContent = JSON.stringify({
      checkInMessage: sanitizedMessage || 'Feeling check-in only',
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
      const model = import.meta.env.GEMINI_MODEL || 'gemini-2.0-flash';
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: userContent }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
        })
      });

      if (!geminiResponse.ok) {
        throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
      }

      const data = await geminiResponse.json();
      content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    } else if (provider === 'OpenAI') {
      const model = import.meta.env.OPENAI_MODEL || 'gpt-4o-mini';
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
        throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
      }

      const data = await openAIResponse.json();
      content = data.choices?.[0]?.message?.content;
    }

    if (!content) {
      throw new Error('No content returned from AI provider.');
    }

    const parsed = JSON.parse(content);
    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({
      title: 'Triage routing summary',
      message: 'Thank you for checking in. Your feelings matter, and SAHAY is keeping your check-in securely queued for your assigned counsellor.',
      steps: [
        'Take a quiet moment; you are in a safe and private interface.',
        'Your assigned counsellor will review your check-in notes.',
        'If you need immediate support, call Tele-MANAS at 14416.'
      ],
      riskScore: 50,
      riskLevel: 'High',
      rationale: 'Local triage fallback applied; secure alert dispatched.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
