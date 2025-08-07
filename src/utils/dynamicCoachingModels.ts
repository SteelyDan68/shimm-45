/**
 * 🧠 DYNAMISK COACHMODELL-SELEKTOR
 * Väljer lämplig coachmodell baserat på användarens input och kontext
 */

export type CoachingModel = 
  | 'neuroplastic'
  | 'wheel_of_life' 
  | 'cognitive_behavioral'
  | 'solution_focused'
  | 'strengths_based'
  | 'mindfulness'
  | 'adaptive_ai';

export interface CoachingModelDefinition {
  id: CoachingModel;
  name: string;
  description: string;
  triggers: string[];
  approach: string;
  focusAreas: string[];
  methodologies: string[];
  expectedOutcomes: string[];
}

/**
 * 📊 COACHING MODEL DEFINITIONS
 */
export const COACHING_MODELS: Record<CoachingModel, CoachingModelDefinition> = {
  neuroplastic: {
    id: 'neuroplastic',
    name: 'Neuroplastisk Metod',
    description: 'Fokuserar på hjärnans förmåga att förändras genom repetition och nya vanor',
    triggers: [
      'vana', 'habit', 'sluta', 'quit', 'beroende', 'addiction', 'routine', 'rutin',
      'snusa', 'röka', 'dricka', 'träna', 'motion', 'sova', 'äta', 'diet'
    ],
    approach: 'Gradvis förändring genom små, konsistenta steg som bygger nya neurala banor',
    focusAreas: ['Vanor', 'Beteendeförändring', 'Repetition', 'Konsistens'],
    methodologies: ['21-dagars regel', 'Micro-habits', 'Habit stacking', 'Environmental design'],
    expectedOutcomes: ['Bestående beteendeförändring', 'Automatiska nya mönster', 'Ökad självkontroll']
  },

  wheel_of_life: {
    id: 'wheel_of_life',
    name: 'Livets Hjul',
    description: 'Holistisk approach för att skapa balans mellan olika livsområden',
    triggers: [
      'balans', 'balance', 'liv', 'life', 'områden', 'helhetsvy', 'holistic',
      'work-life', 'välmående', 'wellbeing', 'harmoni', 'jämvikt'
    ],
    approach: 'Kartlägger och balanserar alla viktiga livsområden för optimal livstillfredsställelse',
    focusAreas: ['Karriär', 'Hälsa', 'Relationer', 'Personlig utveckling', 'Ekonomi', 'Rekreation'],
    methodologies: ['Livsområdesanalys', 'Prioritetsmatris', 'Balansplanering', 'Helhetsperspektiv'],
    expectedOutcomes: ['Ökad livstillfredsställelse', 'Bättre prioritering', 'Harmoniskt liv']
  },

  cognitive_behavioral: {
    id: 'cognitive_behavioral',
    name: 'Kognitiv Beteendeterapi (KBT)',
    description: 'Fokuserar på sambandet mellan tankar, känslor och beteenden',
    triggers: [
      'tankar', 'thoughts', 'känslor', 'emotions', 'oro', 'anxiety', 'stress',
      'negativ', 'negative', 'självkritik', 'perfectionism', 'kbt'
    ],
    approach: 'Identifierar och förändrar dysfunktionella tankemönster och beteenden',
    focusAreas: ['Tankemönster', 'Känsloreglering', 'Problemlösning', 'Coping-strategier'],
    methodologies: ['Tankeregistrering', 'Omstrukturering', 'Exponering', 'Mindfulness'],
    expectedOutcomes: ['Förbättrad känsloreglering', 'Mindre oro och stress', 'Ökad självkännedom']
  },

  solution_focused: {
    id: 'solution_focused',
    name: 'Lösningsfokuserad Coaching',
    description: 'Fokuserar på lösningar och resurser snarare än problem',
    triggers: [
      'lösning', 'solution', 'framtid', 'future', 'mål', 'goal', 'vision',
      'möjligheter', 'opportunities', 'potential', 'framgång'
    ],
    approach: 'Bygger på klientens styrkor och tidigare framgångar för att skapa önskad förändring',
    focusAreas: ['Målsättning', 'Resursmobilisering', 'Framtidsfokus', 'Styrkebaserat'],
    methodologies: ['Miracle question', 'Scaling questions', 'Exception finding', 'Goal setting'],
    expectedOutcomes: ['Tydliga mål', 'Ökat självförtroende', 'Snabbare resultat']
  },

  strengths_based: {
    id: 'strengths_based',
    name: 'Styrkebaserad Coaching',
    description: 'Bygger på och utvecklar naturliga talanger och styrkor',
    triggers: [
      'styrkor', 'strengths', 'talang', 'talent', 'begåvning', 'potential',
      'naturlig', 'bra på', 'excellent', 'kompetens', 'skicklighet'
    ],
    approach: 'Identifierar och maximerar användning av personliga styrkor och talanger',
    focusAreas: ['Talangidentifiering', 'Styrkeutveckling', 'Prestationsoptimering', 'Självkännedom'],
    methodologies: ['Styrkeanalys', 'StrengthsFinder', 'Talangutveckling', 'Performance coaching'],
    expectedOutcomes: ['Maximerad potential', 'Ökad prestation', 'Större arbetsglädje']
  },

  mindfulness: {
    id: 'mindfulness',
    name: 'Mindfulness-baserad Coaching',
    description: 'Fokuserar på närvarande medvetenhet och acceptans',
    triggers: [
      'mindfulness', 'meditation', 'närvarande', 'present', 'medvetenhet',
      'awareness', 'acceptans', 'acceptance', 'stillhet', 'lugn', 'stress'
    ],
    approach: 'Utvecklar närvarande medvetenhet och acceptans för att hantera utmaningar',
    focusAreas: ['Medvetenhet', 'Acceptans', 'Stresshantering', 'Emotionell intelligens'],
    methodologies: ['Mindfulness-meditation', 'Body scanning', 'Breathing exercises', 'Present moment awareness'],
    expectedOutcomes: ['Minskad stress', 'Ökad emotionell stabilitet', 'Bättre fokus']
  },

  adaptive_ai: {
    id: 'adaptive_ai',
    name: 'Adaptiv AI-coaching',
    description: 'AI väljer bästa approach baserat på kontext och behov',
    triggers: [
      'osäker', 'uncertain', 'komplex', 'complex', 'olika', 'multiple',
      'blandad', 'mixed', 'allmän', 'general', 'bred', 'wide'
    ],
    approach: 'Kombinerar flera coachingmetoder baserat på specifik situation och behov',
    focusAreas: ['Kontextanpassning', 'Metodintegration', 'Personalisering', 'Flexibilitet'],
    methodologies: ['AI-analys', 'Multi-modal coaching', 'Adaptive techniques', 'Personalized approach'],
    expectedOutcomes: ['Optimal anpassning', 'Flexibel coaching', 'Personlig utveckling']
  }
};

/**
 * 🎯 DYNAMISK MODELLVAL
 */
export class CoachingModelSelector {
  /**
   * Välj lämplig coachingmodell baserat på input
   */
  static selectModel(
    input: string,
    context?: {
      pillarType?: string;
      userHistory?: string[];
      assessmentData?: Record<string, any>;
      userPreferences?: Record<string, any>;
    }
  ): {
    primary: CoachingModel;
    secondary?: CoachingModel;
    confidence: number;
    reasoning: string;
  } {
    const normalizedInput = input.toLowerCase().trim();
    const modelScores: Record<CoachingModel, number> = {
      neuroplastic: 0,
      wheel_of_life: 0,
      cognitive_behavioral: 0,
      solution_focused: 0,
      strengths_based: 0,
      mindfulness: 0,
      adaptive_ai: 0
    };

    // Analysera input mot triggers
    Object.entries(COACHING_MODELS).forEach(([modelId, model]) => {
      const triggers = model.triggers;
      triggers.forEach(trigger => {
        if (normalizedInput.includes(trigger.toLowerCase())) {
          modelScores[modelId as CoachingModel] += 1;
        }
      });
    });

    // Kontextuell viktning baserat på pillarType
    if (context?.pillarType) {
      switch (context.pillarType) {
        case 'self_care':
          modelScores.neuroplastic += 0.5;
          modelScores.mindfulness += 0.5;
          break;
        case 'skills':
          modelScores.strengths_based += 0.5;
          modelScores.solution_focused += 0.3;
          break;
        case 'talent':
          modelScores.strengths_based += 0.8;
          break;
        case 'brand':
          modelScores.solution_focused += 0.5;
          modelScores.strengths_based += 0.3;
          break;
        case 'economy':
          modelScores.solution_focused += 0.5;
          modelScores.cognitive_behavioral += 0.3;
          break;
        case 'open_track':
          modelScores.wheel_of_life += 0.5;
          modelScores.adaptive_ai += 0.3;
          break;
      }
    }

    // Hitta högsta poäng
    const sortedModels = Object.entries(modelScores)
      .sort(([,a], [,b]) => b - a);

    const [primaryModelId, primaryScore] = sortedModels[0];
    const [secondaryModelId, secondaryScore] = sortedModels[1];

    // Om inget tydligt val, använd adaptive AI
    if (primaryScore < 0.5) {
      return {
        primary: 'adaptive_ai',
        confidence: 0.7,
        reasoning: 'Ingen tydlig matchning med specifik modell. Använder adaptiv AI-approach för personaliserad coaching.'
      };
    }

    const confidence = Math.min(primaryScore / 3, 1); // Normalisera confidence

    return {
      primary: primaryModelId as CoachingModel,
      secondary: secondaryScore > 0.3 ? secondaryModelId as CoachingModel : undefined,
      confidence,
      reasoning: this.generateReasoning(
        primaryModelId as CoachingModel,
        secondaryModelId as CoachingModel,
        normalizedInput,
        context
      )
    };
  }

  /**
   * Generera förklaring för modellval
   */
  private static generateReasoning(
    primary: CoachingModel,
    secondary: CoachingModel,
    input: string,
    context?: any
  ): string {
    const primaryModel = COACHING_MODELS[primary];
    const secondaryModel = secondary ? COACHING_MODELS[secondary] : null;

    let reasoning = `Valde ${primaryModel.name} baserat på nyckelord i din input som matchar ${primaryModel.approach.toLowerCase()}.`;

    if (secondaryModel) {
      reasoning += ` Kommer också att använda element från ${secondaryModel.name} för en mer heltäckande approach.`;
    }

    if (context?.pillarType) {
      reasoning += ` Kontexten "${context.pillarType}" förstärker detta val.`;
    }

    return reasoning;
  }

  /**
   * Hämta systemdirektiv för vald modell
   */
  static getModelDirectives(model: CoachingModel): {
    systemPrompt: string;
    focusAreas: string[];
    methodologies: string[];
  } {
    const modelDef = COACHING_MODELS[model];
    
    const systemPrompt = `
Du använder ${modelDef.name}-metoden i din coaching.

APPROACH: ${modelDef.approach}

FOKUSOMRÅDEN:
${modelDef.focusAreas.map(area => `• ${area}`).join('\n')}

METODER ATT ANVÄNDA:
${modelDef.methodologies.map(method => `• ${method}`).join('\n')}

FÖRVÄNTADE RESULTAT:
${modelDef.expectedOutcomes.map(outcome => `• ${outcome}`).join('\n')}

VIKTIGT: Anpassa alltid din coaching till individens specifika situation och behov.`;

    return {
      systemPrompt,
      focusAreas: modelDef.focusAreas,
      methodologies: modelDef.methodologies
    };
  }
}