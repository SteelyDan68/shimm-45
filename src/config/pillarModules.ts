import { PillarModuleConfig, PillarKey } from '@/types/fivePillarsModular';

// Prioriteringsordning för pillars (Self Care först för att visa självskattning direkt)
export const PILLAR_PRIORITY_ORDER: PillarKey[] = [
  'self_care',
  'skills',
  'talent', 
  'brand',
  'economy'
];

// Define questions and scoring logic for each pillar module
export const PILLAR_MODULES: Record<PillarKey, PillarModuleConfig> = {
  self_care: {
    key: 'self_care',
    name: 'Självskattning med AI-analys',
    description: 'Bedöm dina hinder inom 13 områden och få personlig AI-coaching baserat på dina svar. Inkluderar hinder, funktionstillgång, möjligheter och relationsstöd.',
    icon: '🧠',
    color: '#10B981',
    questions: [
      // Hinder (slider 1-10)
      { key: 'mediestress', text: 'Mediestress', type: 'slider', min: 1, max: 10, weight: 1 },
      { key: 'social_media_press', text: 'Sociala medier-press', type: 'slider', min: 1, max: 10, weight: 1 },
      { key: 'kritik_hat', text: 'Kritik och hat', type: 'slider', min: 1, max: 10, weight: 1 },
      { key: 'prestationsangest', text: 'Prestationsångest', type: 'slider', min: 1, max: 10, weight: 1 },
      { key: 'tidsbrist', text: 'Tidsbrist', type: 'slider', min: 1, max: 10, weight: 1 },
      { key: 'balans_arbete_privatliv', text: 'Balans arbete/privatliv', type: 'slider', min: 1, max: 10, weight: 1 },
      { key: 'ekonomisk_oro', text: 'Ekonomisk oro', type: 'slider', min: 1, max: 10, weight: 1 },
      { key: 'relationsproblem', text: 'Relationsproblem', type: 'slider', min: 1, max: 10, weight: 1 },
      { key: 'halsoproblem', text: 'Hälsoproblem', type: 'slider', min: 1, max: 10, weight: 1 },
      { key: 'sjalvkansla', text: 'Självkänsla', type: 'slider', min: 1, max: 10, weight: 1 },
      { key: 'perfektionism', text: 'Perfektionism', type: 'slider', min: 1, max: 10, weight: 1 },
      { key: 'kontrollbehov', text: 'Kontrollbehov', type: 'slider', min: 1, max: 10, weight: 1 },
      { key: 'ensamhet', text: 'Ensamhet', type: 'slider', min: 1, max: 10, weight: 1 },
      
      // Funktionell tillgång (multiple_choice: ja/nej/ibland)
      { key: 'mat_access', text: 'Kan du laga eller äta bra mat?', type: 'multiple_choice', options: ['ja', 'nej', 'ibland'], weight: 0.75 },
      { key: 'sovplats_access', text: 'Har du en trygg plats att sova?', type: 'multiple_choice', options: ['ja', 'nej', 'ibland'], weight: 0.75 },
      { key: 'hygien_access', text: 'Har du tillgång till dusch eller bad?', type: 'multiple_choice', options: ['ja', 'nej', 'ibland'], weight: 0.75 },
      { key: 'kommunikation_access', text: 'Har du tillgång till internet och telefon?', type: 'multiple_choice', options: ['ja', 'nej', 'ibland'], weight: 0.75 },
      
      // Subjektiva möjligheter (slider 1-5)
      { key: 'be_om_hjalp', text: 'Hur lätt är det för dig att be om hjälp?', type: 'slider', min: 1, max: 5, weight: 0.5 },
      { key: 'traning_rorelse', text: 'Hur ofta kan du träna eller röra på dig?', type: 'slider', min: 1, max: 5, weight: 0.5 },
      { key: 'energi_meddelanden', text: 'Hur ofta har du energi att svara på meddelanden eller mejl?', type: 'slider', min: 1, max: 5, weight: 0.5 },
      { key: 'lasa_information', text: 'Hur ofta har du möjlighet att läsa eller ta in längre information?', type: 'slider', min: 1, max: 5, weight: 0.5 },
      
      // Relationer (multiple_choice: ja/nej)
      { key: 'prata_regelbundet', text: 'Har du någon du kan prata med regelbundet?', type: 'multiple_choice', options: ['ja', 'nej'], weight: 0.25 },
      { key: 'familj_vanner', text: 'Har du kontakt med någon familjemedlem eller nära vän?', type: 'multiple_choice', options: ['ja', 'nej'], weight: 0.25 },
      
      // Kommentarer
      { key: 'comments', text: 'Kommentarer (valfritt)', type: 'text', weight: 0 }
    ],
    scoreCalculation: (answers) => {
      let totalScore = 0;
      let totalWeight = 0;

      // Hinder score (lägre är bättre, så vi inverterar)
      const hinderKeys = ['mediestress', 'social_media_press', 'kritik_hat', 'prestationsangest', 'tidsbrist', 'balans_arbete_privatliv', 'ekonomisk_oro', 'relationsproblem', 'halsoproblem', 'sjalvkansla', 'perfektionism', 'kontrollbehov', 'ensamhet'];
      const hinderScores = hinderKeys.map(key => typeof answers[key] === 'number' ? answers[key] : 5);
      if (hinderScores.length > 0) {
        const avgHinder = hinderScores.reduce((a, b) => a + b, 0) / hinderScores.length;
        const hinderScore = (10 - avgHinder) / 10;
        totalScore += hinderScore * 0.4;
        totalWeight += 0.4;
      }

      // Functional access score
      const functionalKeys = ['mat_access', 'sovplats_access', 'hygien_access', 'kommunikation_access'];
      const functionalValues = functionalKeys.map(key => answers[key] || 'ja');
      const yesCount = functionalValues.filter(v => v === 'ja').length;
      const functionalScore = yesCount / functionalValues.length;
      totalScore += functionalScore * 0.3;
      totalWeight += 0.3;

      // Opportunities score
      const oppKeys = ['be_om_hjalp', 'traning_rorelse', 'energi_meddelanden', 'lasa_information'];
      const oppValues = oppKeys.map(key => typeof answers[key] === 'number' ? answers[key] : 3);
      if (oppValues.length > 0) {
        const avgOpp = oppValues.reduce((a, b) => a + b, 0) / oppValues.length;
        const oppScore = avgOpp / 5;
        totalScore += oppScore * 0.2;
        totalWeight += 0.2;
      }

      // Relationship support score
      const relKeys = ['prata_regelbundet', 'familj_vanner'];
      const relValues = relKeys.map(key => answers[key] || 'ja');
      const relYesCount = relValues.filter(v => v === 'ja').length;
      const relScore = relYesCount / relValues.length;
      totalScore += relScore * 0.1;
      totalWeight += 0.1;

      return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 10) : 5;
    },
    insightGeneration: (answers, score) => {
      const criticalAreas = [];
      const strongAreas = [];
      
      // Analysera hinder
      const hinderKeys = ['mediestress', 'social_media_press', 'kritik_hat', 'prestationsangest', 'tidsbrist', 'balans_arbete_privatliv', 'ekonomisk_oro', 'relationsproblem', 'halsoproblem', 'sjalvkansla', 'perfektionism', 'kontrollbehov', 'ensamhet'];
      hinderKeys.forEach(key => {
        const value = answers[key];
        if (typeof value === 'number') {
          if (value >= 8) criticalAreas.push(key);
          if (value <= 3) strongAreas.push(key);
        }
      });
      
      return {
        criticalAreas,
        strongAreas,
        overallStatus: score >= 7 ? 'strong' : score >= 5 ? 'moderate' : 'needs_attention'
      };
    }
  },

  skills: {
    key: 'skills',
    name: 'Skills',
    description: 'Färdigheter och kompetenser för karriärutveckling',
    icon: '🎯',
    color: '#3B82F6',
    questions: [
      {
        key: 'skill_training_regularity',
        text: 'Jag tränar regelbundet på min färdighet.',
        type: 'slider',
        min: 0,
        max: 100,
        weight: 1.2
      },
      {
        key: 'feedback_quality',
        text: 'Jag får rätt feedback från andra.',
        type: 'slider',
        min: 0,
        max: 100,
        weight: 1.3
      },
      {
        key: 'technical_improvement_time',
        text: 'Jag använder tid på att förbättra mina tekniska färdigheter.',
        type: 'slider',
        min: 0,
        max: 100,
        weight: 1.4
      },
      {
        key: 'development_feeling',
        text: 'Jag känner att jag utvecklas.',
        type: 'slider',
        min: 0,
        max: 100,
        weight: 1.5
      },
      {
        key: 'skill_improvement_needs',
        text: 'Vad skulle hjälpa dig förbättra dina färdigheter just nu?',
        type: 'text',
        weight: 1.0
      }
    ],
    scoreCalculation: (answers) => {
      const weights = {
        skill_training_regularity: 1.2,
        feedback_quality: 1.3,
        technical_improvement_time: 1.4,
        development_feeling: 1.5
      };

      let totalScore = 0;
      let totalWeight = 0;

      Object.entries(weights).forEach(([key, weight]) => {
        if (answers[key] !== undefined && typeof answers[key] === 'number') {
          // Convert 0-100 slider to 1-10 scale
          const scaledScore = (answers[key] / 100) * 10;
          totalScore += scaledScore * weight;
          totalWeight += weight;
        }
      });

      return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) / 100 : 0;
    },
    insightGeneration: (answers, score) => ({
      development_priorities: Object.entries(answers)
        .filter(([key, value]) => typeof value === 'number' && value <= 40)
        .map(([key]) => key),
      strong_areas: Object.entries(answers)
        .filter(([key, value]) => typeof value === 'number' && value >= 80)
        .map(([key]) => key),
      skill_level: score >= 8 ? 'expert' : score >= 6 ? 'proficient' : score >= 4 ? 'developing' : 'beginner',
      improvement_text: answers.skill_improvement_needs || ''
    })
  },

  talent: {
    key: 'talent',
    name: 'Talent',
    description: 'Naturliga begåvningar och unika styrkor',
    icon: '⭐',
    color: '#8B5CF6',
    questions: [
      {
        key: 'drive_and_focus',
        text: 'Jag har stark drivkraft och fokus.',
        type: 'slider',
        min: 0,
        max: 100,
        weight: 1.4
      },
      {
        key: 'creativity_ideas',
        text: 'Jag är kreativ och kommer på nya idéer.',
        type: 'slider',
        min: 0,
        max: 100,
        weight: 1.5
      },
      {
        key: 'idea_to_action',
        text: 'Jag kan snabbt omsätta idéer i handling.',
        type: 'slider',
        min: 0,
        max: 100,
        weight: 1.3
      },
      {
        key: 'unique_voice',
        text: 'Jag har en unik röst eller stil.',
        type: 'slider',
        min: 0,
        max: 100,
        weight: 1.2
      },
      {
        key: 'creativity_usage',
        text: 'Hur använder du din kreativitet idag?',
        type: 'text',
        weight: 1.0
      }
    ],
    scoreCalculation: (answers) => {
      const weights = {
        drive_and_focus: 1.4,
        creativity_ideas: 1.5,
        idea_to_action: 1.3,
        unique_voice: 1.2
      };

      let totalScore = 0;
      let totalWeight = 0;

      Object.entries(weights).forEach(([key, weight]) => {
        if (answers[key] !== undefined && typeof answers[key] === 'number') {
          // Convert 0-100 slider to 1-10 scale
          const scaledScore = (answers[key] / 100) * 10;
          totalScore += scaledScore * weight;
          totalWeight += weight;
        }
      });

      return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) / 100 : 0;
    },
    insightGeneration: (answers, score) => ({
      talent_strengths: Object.entries(answers)
        .filter(([key, value]) => typeof value === 'number' && value >= 80)
        .map(([key]) => key),
      development_areas: Object.entries(answers)
        .filter(([key, value]) => typeof value === 'number' && value <= 50)
        .map(([key]) => key),
      talent_utilization: score >= 7 ? 'high' : score >= 5 ? 'moderate' : 'low',
      creativity_application: answers.creativity_usage || '',
      overall_talent_level: score >= 8 ? 'exceptional' : score >= 6 ? 'strong' : score >= 4 ? 'developing' : 'emerging'
    })
  },

  brand: {
    key: 'brand',
    name: 'Brand',
    description: 'Personligt varumärke och synlighet',
    icon: '🎨',
    color: '#F59E0B',
    questions: [
      {
        key: 'brand_clarity',
        text: 'Mitt varumärke känns tydligt och igenkännbart.',
        type: 'slider',
        min: 0,
        max: 100,
        weight: 1.5
      },
      {
        key: 'platform_messaging',
        text: 'Jag signalerar rätt saker på mina plattformar.',
        type: 'slider',
        min: 0,
        max: 100,
        weight: 1.4
      },
      {
        key: 'message_reach',
        text: 'Jag når fram med det jag vill säga.',
        type: 'slider',
        min: 0,
        max: 100,
        weight: 1.3
      },
      {
        key: 'credibility',
        text: 'Jag uppfattas som trovärdig.',
        type: 'slider',
        min: 0,
        max: 100,
        weight: 1.2
      },
      {
        key: 'brand_aspiration',
        text: 'Hur vill du att ditt varumärke ska uppfattas?',
        type: 'text',
        weight: 1.0
      }
    ],
    scoreCalculation: (answers) => {
      const weights = {
        brand_clarity: 1.5,
        platform_messaging: 1.4,
        message_reach: 1.3,
        credibility: 1.2
      };

      let totalScore = 0;
      let totalWeight = 0;

      Object.entries(weights).forEach(([key, weight]) => {
        if (answers[key] !== undefined && typeof answers[key] === 'number') {
          // Convert 0-100 slider to 1-10 scale
          const scaledScore = (answers[key] / 100) * 10;
          totalScore += scaledScore * weight;
          totalWeight += weight;
        }
      });

      return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) / 100 : 0;
    },
    insightGeneration: (answers, score) => ({
      brand_strength: score >= 7 ? 'strong' : score >= 5 ? 'developing' : 'needs_attention',
      strong_areas: Object.entries(answers)
        .filter(([key, value]) => typeof value === 'number' && value >= 80)
        .map(([key]) => key),
      improvement_areas: Object.entries(answers)
        .filter(([key, value]) => typeof value === 'number' && value <= 50)
        .map(([key]) => key),
      brand_vision: answers.brand_aspiration || '',
      overall_brand_maturity: score >= 8 ? 'mature' : score >= 6 ? 'growing' : score >= 4 ? 'emerging' : 'undefined'
    })
  },

  economy: {
    key: 'economy',
    name: 'Economy',
    description: 'Ekonomisk stabilitet och tillväxt',
    icon: '💰',
    color: '#EF4444',
    questions: [
      {
        key: 'financial_security',
        text: 'Jag känner mig ekonomiskt trygg i min nuvarande situation.',
        type: 'slider',
        min: 0,
        max: 100,
        weight: 1.5
      },
      {
        key: 'clear_income_sources',
        text: 'Jag har tydliga intäktskällor kopplade till mitt arbete.',
        type: 'slider',
        min: 0,
        max: 100,
        weight: 1.4
      },
      {
        key: 'new_income_opportunities',
        text: 'Jag ser nya möjligheter att tjäna pengar på mitt varumärke.',
        type: 'slider',
        min: 0,
        max: 100,
        weight: 1.3
      },
      {
        key: 'cost_control',
        text: 'Jag har kontroll över mina kostnader.',
        type: 'slider',
        min: 0,
        max: 100,
        weight: 1.2
      },
      {
        key: 'economic_improvement_ideas',
        text: 'Vad skulle öka din ekonomiska trygghet och intäkter?',
        type: 'text',
        weight: 1.0
      }
    ],
    scoreCalculation: (answers) => {
      const weights = {
        financial_security: 1.5,
        clear_income_sources: 1.4,
        new_income_opportunities: 1.3,
        cost_control: 1.2
      };

      let totalScore = 0;
      let totalWeight = 0;

      Object.entries(weights).forEach(([key, weight]) => {
        if (answers[key] !== undefined && typeof answers[key] === 'number') {
          // Convert 0-100 slider to 1-10 scale
          const scaledScore = (answers[key] / 100) * 10;
          totalScore += scaledScore * weight;
          totalWeight += weight;
        }
      });

      return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) / 100 : 0;
    },
    insightGeneration: (answers, score) => ({
      financial_health: score >= 7 ? 'strong' : score >= 5 ? 'stable' : 'vulnerable',
      strong_areas: Object.entries(answers)
        .filter(([key, value]) => typeof value === 'number' && value >= 80)
        .map(([key]) => key),
      priority_areas: Object.entries(answers)
        .filter(([key, value]) => typeof value === 'number' && value <= 50)
        .map(([key]) => key),
      improvement_ideas: answers.economic_improvement_ideas || '',
      financial_stability: score >= 8 ? 'very_stable' : score >= 6 ? 'stable' : score >= 4 ? 'developing' : 'unstable'
    })
  }
};