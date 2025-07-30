import { PillarModuleConfig, PillarKey } from '@/types/fivePillarsModular';

// Define questions and scoring logic for each pillar module
export const PILLAR_MODULES: Record<PillarKey, PillarModuleConfig> = {
  self_care: {
    key: 'self_care',
    name: 'Self Care',
    description: 'Fysisk och mental hälsa, vila och återhämtning',
    icon: '💆‍♀️',
    color: '#10B981',
    questions: [
      {
        key: 'sleep_quality',
        text: 'Hur väl sover du nattetid?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.2
      },
      {
        key: 'stress_level',
        text: 'Hur stressad känner du dig i vardagen?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.3
      },
      {
        key: 'exercise_frequency',
        text: 'Hur ofta motionerar du per vecka?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.0
      },
      {
        key: 'nutrition_quality',
        text: 'Hur nöjd är du med dina matvanor?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.0
      },
      {
        key: 'work_life_balance',
        text: 'Hur balanserat känns ditt liv mellan arbete och vila?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.5
      }
    ],
    scoreCalculation: (answers) => {
      const weights = {
        sleep_quality: 1.2,
        stress_level: 1.3, // Inverted score (high stress = low score)
        exercise_frequency: 1.0,
        nutrition_quality: 1.0,
        work_life_balance: 1.5
      };

      let totalScore = 0;
      let totalWeight = 0;

      Object.entries(weights).forEach(([key, weight]) => {
        if (answers[key] !== undefined) {
          let score = answers[key];
          // Invert stress level (high stress = low wellness)
          if (key === 'stress_level') {
            score = 11 - score;
          }
          totalScore += score * weight;
          totalWeight += weight;
        }
      });

      return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) / 100 : 0;
    },
    insightGeneration: (answers, score) => ({
      critical_areas: Object.entries(answers).filter(([_, value]) => value <= 3).map(([key]) => key),
      strong_areas: Object.entries(answers).filter(([_, value]) => value >= 8).map(([key]) => key),
      overall_wellness: score >= 7 ? 'strong' : score >= 5 ? 'moderate' : 'needs_attention'
    })
  },

  skills: {
    key: 'skills',
    name: 'Skills',
    description: 'Färdigheter och kompetenser för karriärutveckling',
    icon: '🎯',
    color: '#3B82F6',
    questions: [
      {
        key: 'technical_skills',
        text: 'Hur nöjd är du med dina tekniska färdigheter?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.2
      },
      {
        key: 'communication',
        text: 'Hur bra är du på att kommunicera med olika målgrupper?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.5
      },
      {
        key: 'leadership',
        text: 'Hur utvecklade är dina ledarskapsförmågor?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.3
      },
      {
        key: 'creativity',
        text: 'Hur kreativ känner du dig i ditt arbete?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.0
      },
      {
        key: 'learning_ability',
        text: 'Hur snabbt lär du dig nya saker?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.1
      }
    ],
    scoreCalculation: (answers) => {
      const weights = {
        technical_skills: 1.2,
        communication: 1.5,
        leadership: 1.3,
        creativity: 1.0,
        learning_ability: 1.1
      };

      let totalScore = 0;
      let totalWeight = 0;

      Object.entries(weights).forEach(([key, weight]) => {
        if (answers[key] !== undefined) {
          totalScore += answers[key] * weight;
          totalWeight += weight;
        }
      });

      return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) / 100 : 0;
    },
    insightGeneration: (answers, score) => ({
      development_priorities: Object.entries(answers).filter(([_, value]) => value <= 4).map(([key]) => key),
      expertise_areas: Object.entries(answers).filter(([_, value]) => value >= 8).map(([key]) => key),
      skill_level: score >= 8 ? 'expert' : score >= 6 ? 'proficient' : score >= 4 ? 'developing' : 'beginner'
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
        key: 'unique_strengths',
        text: 'Hur väl känner du dina unika styrkor?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.5
      },
      {
        key: 'passion_alignment',
        text: 'Hur väl matchar ditt arbete dina passioner?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.4
      },
      {
        key: 'natural_abilities',
        text: 'Hur väl utnyttjar du dina naturliga talanger?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.3
      },
      {
        key: 'flow_state',
        text: 'Hur ofta hamnar du i flow när du arbetar?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.2
      },
      {
        key: 'talent_recognition',
        text: 'Hur väl erkänns dina talanger av andra?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.0
      }
    ],
    scoreCalculation: (answers) => {
      const weights = {
        unique_strengths: 1.5,
        passion_alignment: 1.4,
        natural_abilities: 1.3,
        flow_state: 1.2,
        talent_recognition: 1.0
      };

      let totalScore = 0;
      let totalWeight = 0;

      Object.entries(weights).forEach(([key, weight]) => {
        if (answers[key] !== undefined) {
          totalScore += answers[key] * weight;
          totalWeight += weight;
        }
      });

      return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) / 100 : 0;
    },
    insightGeneration: (answers, score) => ({
      untapped_potential: Object.entries(answers).filter(([_, value]) => value <= 5).map(([key]) => key),
      talent_utilization: score >= 7 ? 'high' : score >= 5 ? 'moderate' : 'low',
      alignment_score: answers.passion_alignment || 0
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
        text: 'Hur tydligt är ditt personliga varumärke?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.5
      },
      {
        key: 'online_presence',
        text: 'Hur nöjd är du med din online-närvaro?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.3
      },
      {
        key: 'content_creation',
        text: 'Hur konsekvent skapar du innehåll?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.2
      },
      {
        key: 'audience_engagement',
        text: 'Hur väl engagerar du din målgrupp?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.4
      },
      {
        key: 'brand_consistency',
        text: 'Hur konsekvent är ditt varumärke över alla kanaler?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.1
      }
    ],
    scoreCalculation: (answers) => {
      const weights = {
        brand_clarity: 1.5,
        online_presence: 1.3,
        content_creation: 1.2,
        audience_engagement: 1.4,
        brand_consistency: 1.1
      };

      let totalScore = 0;
      let totalWeight = 0;

      Object.entries(weights).forEach(([key, weight]) => {
        if (answers[key] !== undefined) {
          totalScore += answers[key] * weight;
          totalWeight += weight;
        }
      });

      return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) / 100 : 0;
    },
    insightGeneration: (answers, score) => ({
      brand_strength: score >= 7 ? 'strong' : score >= 5 ? 'developing' : 'weak',
      focus_areas: Object.entries(answers).filter(([_, value]) => value <= 4).map(([key]) => key),
      visibility_score: (answers.online_presence + answers.content_creation) / 2
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
        key: 'income_satisfaction',
        text: 'Hur nöjd är du med din nuvarande inkomst?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.3
      },
      {
        key: 'financial_planning',
        text: 'Hur väl planerar du din ekonomi?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.4
      },
      {
        key: 'investment_knowledge',
        text: 'Hur bra är din kunskap om investeringar?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.1
      },
      {
        key: 'income_diversification',
        text: 'Hur diversifierade är dina inkomstkällor?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.2
      },
      {
        key: 'financial_security',
        text: 'Hur säker känner du dig ekonomiskt?',
        type: 'scale',
        min: 1,
        max: 10,
        weight: 1.5
      }
    ],
    scoreCalculation: (answers) => {
      const weights = {
        income_satisfaction: 1.3,
        financial_planning: 1.4,
        investment_knowledge: 1.1,
        income_diversification: 1.2,
        financial_security: 1.5
      };

      let totalScore = 0;
      let totalWeight = 0;

      Object.entries(weights).forEach(([key, weight]) => {
        if (answers[key] !== undefined) {
          totalScore += answers[key] * weight;
          totalWeight += weight;
        }
      });

      return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) / 100 : 0;
    },
    insightGeneration: (answers, score) => ({
      financial_health: score >= 7 ? 'strong' : score >= 5 ? 'stable' : 'vulnerable',
      priority_areas: Object.entries(answers).filter(([_, value]) => value <= 4).map(([key]) => key),
      security_level: answers.financial_security || 0
    })
  }
};