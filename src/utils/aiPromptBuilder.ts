import { ClientDataContainer, NeuroplasticityJourney } from '@/types/neuroplasticityJourney';

/**
 * Bygger personaliserade AI-promptar baserat på klientens fullständiga datacontainer
 * Följer neuroplasticitets-principer och evidensbaserade metoder
 */
export class AIPromptBuilder {
  /**
   * Bygger en komplett prompt för coaching-rådgivning
   */
  static buildCoachingPrompt(
    clientContainer: ClientDataContainer,
    specificContext: string,
    coachingGoal: 'assessment_analysis' | 'action_planning' | 'progress_review' | 'obstacle_resolution'
  ): string {
    const basePrompt = this.buildBaseClientProfile(clientContainer);
    const contextualGuidance = this.buildContextualGuidance(coachingGoal);
    const neuroplasticityFramework = this.buildNeuroplasticityFramework(clientContainer);
    
    return `${basePrompt}

${neuroplasticityFramework}

${contextualGuidance}

SPECIFIK KONTEXT FÖR DETTA SAMTAL:
${specificContext}

INSTRUKTIONER:
1. Analysera klientens data holistiskt med fokus på Wheel of Life-balans
2. Identifiera neuroplastiska utvecklingsmöjligheter
3. Föreslå evidensbaserade interventioner anpassade till klientens resurser
4. Strukturera råd enligt klientens lärande- och kommunikationsstil
5. Inkludera konkreta actionables med neuroplastisk progressionsplan
6. Referera till klientens tidigare framgångar och styrkor`;
  }

  /**
   * Bygger basprofil av klienten för AI-förståelse
   */
  public static buildBaseClientProfile(container: ClientDataContainer): string {
    const personality = container.personality_profile;
    const context = container.life_context;
    const resources = container.resource_inventory;
    
    return `KLIENTPROFIL NEUROPLASTISK COACHING SYSTEM:

PERSONLIGHET & LÄRANDE:
- Lärstil: ${personality.learning_style}
- Motivationsdrivare: ${personality.motivation_drivers.join(', ')}
- Stressresponsmönster: ${personality.stress_response_patterns.join(', ')}
- Kommunikationspreferens: ${personality.communication_preferences.join(', ')}
- Beslutsfattarstil: ${personality.decision_making_style}

LIVSSITUATION:
- Livsfas: ${context.life_phase}
- Aktuella utmaningar: ${context.current_challenges.join(', ')}
- Stödsystemstyrka: ${context.support_system_strength}/10
- Tidsresurser: ${context.time_availability}
- Energimönster: ${context.energy_patterns.join(', ')}

RESURSINVENTERING:
- Finansiella resurser: ${resources.financial_resources}
- Tidsresurser: ${resources.time_resources}
- Sociala resurser: ${resources.social_resources.join(', ')}
- Kunskapsområden: ${resources.knowledge_resources.join(', ')}
- Praktiska resurser: ${resources.practical_resources.join(', ')}
- Emotionella resurser: ${resources.emotional_resources.join(', ')}

AKTUELLA WHEEL OF LIFE SCORES:
${Object.entries(container.wheel_of_life_scores)
  .map(([area, score]) => `- ${area}: ${score}/10`)
  .join('\n')}`;
  }

  /**
   * Lägger till neuroplasticitets-ramverk för AI:n
   */
  private static buildNeuroplasticityFramework(container: ClientDataContainer): string {
    const activeJourney = container.journey_history
      .find(j => !j.completed_at) || container.journey_history[0];
    
    let neuroplasticityContext = '';
    if (activeJourney) {
      neuroplasticityContext = `
AKTIV NEUROPLASTISK RESA:
- Typ: ${activeJourney.journey_type}
- Intensitet: ${activeJourney.intensity}
- Varaktighet: ${activeJourney.duration_days} dagar
- Aktuell fas: ${activeJourney.neuroplasticity_phase}
- Vanebildningsdata: Streak ${activeJourney.habit_formation_data.streak_count} dagar, 
  Konsistens ${Math.round(activeJourney.habit_formation_data.consistency_rate * 100)}%
- Neural pathway styrka: ${activeJourney.habit_formation_data.neural_pathway_strength}/10`;
    }

    return `NEUROPLASTICITETS-RAMVERK:

VETENSKAPLIG GRUND:
- 66-dagars regel för djup vanebildning (Lally et al.)
- Progressiv överbelastning för neural adaptation
- Kontextuell inlärning för generaliseringsförmåga
- Spaced repetition för långtidsminne-konsolidering

${neuroplasticityContext}

ADAPTIVA PRINCIPER:
1. Start med micro-habits (2-min regel)
2. Gradvis komplexitetshöjning var 7:e dag
3. Kontextuell variation för robust vanebildning
4. Mindful practice för medveten neural formning
5. Celebration och belöning för dopamin-driven förstärkning`;
  }

  /**
   * Skapar kontextuell vägledning baserat på coaching-mål
   */
  private static buildContextualGuidance(goal: string): string {
    const guidanceMap = {
      assessment_analysis: `
ASSESSMENT-ANALYSGUIDE:
- Fokusera på mönster mellan olika livsområden
- Identifiera underliggande systemiska faktorer
- Koppla styrkor till utvecklingsområden
- Föreslå både symptom- och rotorsak-interventioner
- Prioritera enligt neuroplastisk potential`,

      action_planning: `
HANDLINGSPLANERINGSGUIDE:
- Skapa SMART + neuroplastiska mål
- Sekvensera aktiviteter enligt svårighetsgrad
- Inkludera environmental design-element
- Planera för setbacks och recovery-strategier
- Koppla till klientens befintliga rutiner`,

      progress_review: `
FRAMSTEGSGRANSKNINGSGUIDE:
- Analysera kvantitativ data från habit tracking
- Utvärdera subjektiv upplevelse av förändring
- Identifiera framgångsfaktorer att förstärka
- Justera interventioner baserat på respons
- Fira neuroplastisk utveckling`,

      obstacle_resolution: `
HINDER-LÖSNINGSGUIDE:
- Kategorisera hinder (strukturella vs. mentala)
- Använd klientens tidigare framgångsstrategier
- Föreslå alternativa neurala pathways
- Aktivera support system-resurser
- Implementera gentle persistence-protokoll`
    };

    return guidanceMap[goal as keyof typeof guidanceMap] || '';
  }

  /**
   * Bygger LLM-optimerad prompt för externa AI-tjänster
   */
  static buildExternalLLMPrompt(
    clientContainer: ClientDataContainer,
    query: string,
    model: 'openai' | 'gemini' = 'openai'
  ): {
    systemPrompt: string;
    userPrompt: string;
    parameters: Record<string, any>;
  } {
    const personalization = clientContainer.prompt_personalization_data;
    
    const systemPrompt = `Du är en världsledande neuroplasticitets-coach med specialisering i evidensbaserad beteendeförändring. 

KOMMUNIKATIONSSTIL:
- Ton: ${personalization.preferred_communication_tone}
- Språkkomplexitet: ${personalization.language_complexity_preference}
- Svarsvolym: ${personalization.response_length_preference}
- Actionable-granularitet: ${personalization.actionable_granularity}
- Motivationsspråk: ${personalization.effective_motivation_language.join(', ')}

VERKTYG DU ANVÄNDER:
- Wheel of Life-analys för holistisk balans
- 66-dagars neuroplasticitets-modellen
- Micro-habits och progressive overload
- Environmental design principles
- Strength-based coaching approach

ALLTID INKLUDERA:
1. Kopplingen till klientens befintliga styrkor
2. Konkreta nästa steg
3. Neuroplastisk grundmotivering
4. Anpassning till klientens livssituation`;

    const userPrompt = `${this.buildBaseClientProfile(clientContainer)}

FRÅGA/SITUATION:
${query}

Ge en personaliserad, evidensbaserad coaching-respons.`;

    const parameters = {
      temperature: personalization.feedback_sensitivity > 7 ? 0.3 : 0.7,
      max_tokens: personalization.response_length_preference === 'brief' ? 500 : 
                 personalization.response_length_preference === 'detailed' ? 1000 : 1500,
      top_p: 0.9
    };

    return { systemPrompt, userPrompt, parameters };
  }
}

/**
 * Hjälpfunktion för att bygga Lovable AI-template med nya data
 */
export function buildLovableAIPrompt(
  clientContainer: ClientDataContainer,
  assessmentData: Record<string, any>
): string {
  const baseTemplate = `Klienten du analyserar har följande neuroplastiska profil:

GRUNDDATA:
${AIPromptBuilder.buildBaseClientProfile(clientContainer).replace('KLIENTPROFIL NEUROPLASTISK COACHING SYSTEM:', '')}

AKTUELL ASSESSMENT-DATA:
${JSON.stringify(assessmentData, null, 2)}

NEUROPLASTISK KONTEXT:
${clientContainer.journey_history.length > 0 ? 
  `Har genomfört ${clientContainer.journey_history.length} tidigare resor. ` +
  `Starkaste vanebildningsområde: ${clientContainer.behavioral_patterns
    .filter(p => p.effectiveness >= 8)
    .map(p => p.description)
    .join(', ') || 'Inga starka vanor identifierade än'}.` 
  : 'Första gången i systemet - fokusera på grundläggande vanebildning.'}

Utifrån detta ska du:
1. Analysera data genom neuroplasticitets-lins
2. Identifiera både hinder OCH utvecklingsmöjligheter  
3. Föreslå evidensbaserade micro-interventioner
4. Koppla till klientens befintliga styrkor och resurser
5. Skapa actionables som passar klientens livssituation
6. Använd en ${clientContainer.prompt_personalization_data.preferred_communication_tone} ton`;

  return baseTemplate;
}