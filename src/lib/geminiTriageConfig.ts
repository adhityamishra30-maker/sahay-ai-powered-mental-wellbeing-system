/**
 * ============================================================================
 * GEMINI API TRIAGE ALGORITHM METADATA & ACADEMIC GROUNDING
 * ============================================================================
 * 
 * The screening prompt, scoring dimensions, and criticality classification
 * metrics utilized in this API configuration are derived and synthesized from 
 * the following peer-reviewed medical and psychiatric literature:
 * 
 * 1. DIMENSION: Neurobiological Stress & Hypervigilance
 *    - Study: Lifelong impact of extreme stress on the human brain (ScienceDirect)
 *    - Link: https://sciencedirect.com
 *    - NLM Resource: https://nih.gov
 *    - Application: Grounds evaluation of physiological panic and sleep disruption
 *      linked to permanent grey-matter reduction in the prefrontal cortex.
 * 
 * 2. DIMENSION: Interpersonal Trust & Social Withdrawal
 *    - Study: “After torture, everything changed”: the unpacking of trauma... (BMC Psychology)
 *    - Link: https://springer.com
 *    - NLM Resource: https://nih.gov
 *    - Application: Governs the structural criteria for isolating behaviors based
 *      on the academic qualitative themes of "Broken trust" and "The unsafe body."
 * 
 * 3. CRITICALITY CRITERIA: Existential Trauma & High Risk Signs
 *    - Document: Full Text Participant Transcripts & Narrative Data (PDF)
 *    - Link: https://biomedcentral.com
 *    - Application: Provides linguistic indicators for high-criticality triage 
 *      (e.g., loss of individual agency, systemic hopelessness, foreshortened future).
 * 
 * Tone Mandate for LLM: Purely routing/triage. Empathic, objective, brief. 
 * Under no circumstances should the model mimic clinical medical/psychiatric therapy.
 * ============================================================================
 */

export interface AtrocityTraumaDimensions {
  neurobiologicalStress: 'Low' | 'Moderate' | 'High' | 'Severe';
  interpersonalTrust: 'Intact' | 'Cautious' | 'Broken' | 'Severe Isolation';
  existentialTrauma: 'Resilient' | 'Struggling' | 'Helpless' | 'Despair';
}

export const geminiTriageConfig = {
  version: '2026.1-academic-triage',
  framework: 'PoA Act Victim Psychosocial Triage & Academic Grounding',
  dimensions: {
    neurobiologicalStress: {
      name: 'Neurobiological Stress & Hypervigilance',
      grounding: 'ScienceDirect / NLM - Extreme stress and prefrontal cortex hyperarousal',
      indicators: ['Intense panic episodes', 'Insomnia / severe sleep fragmentation', 'Tremors / physical startle reflex', 'Continuous feeling of impending threat']
    },
    interpersonalTrust: {
      name: 'Interpersonal Trust & Social Withdrawal',
      grounding: 'BMC Psychology / Springer / NLM - Qualitative trauma unpacked: broken trust & unsafe body',
      indicators: ['Deep fear of community retribution', 'Inability to feel safe in personal living space', 'Complete social withdrawal', 'Distrust of standard institutions']
    },
    existentialTrauma: {
      name: 'Existential Trauma & High Risk Signs',
      grounding: 'BioMed Central - Narrative transcripts on systemic hopelessness and loss of personal agency',
      indicators: ['Loss of individual agency', 'Pervasive hopelessness regarding justice or survival', 'Foreshortened sense of future', 'Extreme existential helplessness']
    }
  },
  toneMandate: 'Purely routing and triage. Empathic, objective, brief. Under no circumstances should the model mimic clinical medical or psychiatric therapy.',
  systemPromptAddition: `
Screening Assessment Context:
Evaluate the check-in for indicators across the three academic dimensions:
1. Neurobiological Stress (physiological panic and somatic hyperarousal)
2. Interpersonal Trust (social withdrawal and community fear)
3. Existential Trauma (loss of personal agency and systemic hopelessness)

Tone mandate:
- Maintain an empathetic, calm, non-judgmental tone.
- Act purely as an early psychosocial triage and support routing assistant.
- Do NOT provide medical diagnoses or mimic psychiatric clinical therapy.
- Guide the user toward assigned human counsellor support and government relief helplines.
- Never mention or store personal identifying information.`
};
