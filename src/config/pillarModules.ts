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
    name: 'Self Care',
    description: 'Bedöm dina hinder inom 13 områden och få personlig AI-coaching baserat på dina svar. Inkluderar hinder, funktionstillgång, möjligheter och relationsstöd.',
    icon: '💚',
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
    name: 'Färdigheter & Utveckling',
    description: 'Dina kompetenser och färdigheter inom ditt fokusområde',
    icon: '🎯',
    color: '#3B82F6',
    questions: [
      { key: 'skill_confidence', text: 'Hur säker känner du dig på dina huvudfärdigheter?', type: 'slider', weight: 1.2, min: 1, max: 10 },
      { key: 'learning_pace', text: 'Hur nöjd är du med din utvecklingstakt?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'feedback_seeking', text: 'Hur ofta söker du feedback på ditt arbete?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'skill_practice', text: 'Hur regelbundet tränar du dina färdigheter?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'technical_knowledge', text: 'Hur bra är din tekniska kunskap inom ditt område?', type: 'slider', weight: 1.2, min: 1, max: 10 },
      { key: 'problem_solving', text: 'Hur bra är du på att lösa komplexa problem?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'mentorship_access', text: 'Har du tillgång till mentorer eller erfarna kollegor?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'resource_utilization', text: 'Utnyttjar du tillgängliga verktyg och resurser effektivt?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'skill_gaps_awareness', text: 'Är du medveten om vilka färdigheter du behöver utveckla?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'continuous_improvement', text: 'Arbetar du aktivt med kontinuerlig förbättring?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'industry_trends', text: 'Följer du trender och utveckling inom ditt område?', type: 'slider', weight: 0.9, min: 1, max: 10 },
      { key: 'skill_documentation', text: 'Dokumenterar du din kunskapsutveckling?', type: 'slider', weight: 0.8, min: 1, max: 10 },
      { key: 'goal_setting', text: 'Sätter du tydliga mål för din kompetensutveckling?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'creativity_innovation', text: 'Utvecklar du kreativa lösningar och innovationer?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'collaboration_skills', text: 'Hur bra är du på att samarbeta med andra?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'main_focus_area', text: 'Beskriv ditt huvudfokusområde och vad du vill bli bättre på inom detta område', type: 'text', weight: 0.5 },
      { key: 'missing_tools_knowledge', text: 'Vilka verktyg, kunskaper eller färdigheter saknar du för att utvecklas snabbare inom ditt område?', type: 'text', weight: 0.5 },
      { key: 'breakthrough_experience', text: 'Berätta om ett genombrott eller framsteg du haft i din färdighetsutveckling', type: 'text', weight: 0.5 },
      { key: 'development_obstacles', text: 'Vad är ditt största hinder för att utvecklas inom detta område?', type: 'text', weight: 0.5 },
      { key: 'current_training_methods', text: 'Hur tränar du för närvarande och vad fungerar bäst för dig?', type: 'text', weight: 0.5 },
    ],
    scoreCalculation: (answers: Record<string, any>) => {
      let totalScore = 0;
      let totalWeight = 0;
      
      Object.entries(answers).forEach(([key, value]) => {
        const question = PILLAR_MODULES.skills.questions.find(q => q.key === key);
        if (question && question.type === 'slider' && typeof value === 'number') {
          totalScore += value * (question.weight || 1);
          totalWeight += (question.weight || 1);
        }
      });
      
      return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 10) / 10 : 0;
    },
    insightGeneration: (answers: Record<string, any>, score: number) => {
      const insights: Record<string, any> = {
        overallScore: score,
        focusArea: answers.main_focus_area || '',
        missingSkills: answers.missing_tools_knowledge || '',
        strengths: [],
        developmentAreas: [],
        recommendations: []
      };
      
      Object.entries(answers).forEach(([key, value]) => {
        if (typeof value === 'number') {
          if (value >= 8) insights.strengths.push(key);
          if (value <= 4) insights.developmentAreas.push(key);
        }
      });
      
      return insights;
    }
  },

  talent: {
    key: 'talent',
    name: 'Talang & Styrkor',
    description: 'Dina naturliga förutsättningar och styrkor',
    icon: '⭐',
    color: '#F59E0B',
    questions: [
      { key: 'natural_abilities', text: 'Känner du igen dina naturliga förmågor och talanger?', type: 'slider', weight: 1.2, min: 1, max: 10 },
      { key: 'talent_utilization', text: 'Använder du dina talanger fullt ut i ditt arbete?', type: 'slider', weight: 1.2, min: 1, max: 10 },
      { key: 'flow_experiences', text: 'Hur ofta upplever du "flow" när du arbetar?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'passion_alignment', text: 'Hur väl stämmer ditt arbete överens med dina passioner?', type: 'slider', weight: 1.2, min: 1, max: 10 },
      { key: 'creative_expression', text: 'Får du uttrycka din kreativitet i det du gör?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'talent_recognition', text: 'Får du erkännande för dina unika styrkor?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'strength_development', text: 'Arbetar du aktivt med att utveckla dina styrkor?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'unique_value', text: 'Är du medveten om ditt unika värde?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'talent_feedback', text: 'Får du feedback som hjälper dig förstå dina talanger?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'natural_motivation', text: 'Känner du dig naturligt motiverad av dina huvuduppgifter?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'talent_confidence', text: 'Har du själförtroende för dina naturliga förmågor?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'strength_refinement', text: 'Förfinar du kontinuerligt dina talanger?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'talent_discovery', text: 'Upptäcker du regelbundet nya sidor av dina talanger?', type: 'slider', weight: 0.9, min: 1, max: 10 },
      { key: 'authentic_expression', text: 'Känner du dig autentisk när du använder dina talanger?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'talent_impact', text: 'Märker du att dina talanger gör skillnad för andra?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'natural_strengths', text: 'Vad säger andra att du är naturligt bra på? Beskriv dina starkaste talanger', type: 'text', weight: 0.5 },
      { key: 'flow_experiences_detail', text: 'Beskriv ett projekt eller situation där du kände dig helt i ditt element', type: 'text', weight: 0.5 },
      { key: 'underutilized_talents', text: 'Vilka talanger har du som du inte använder fullt ut idag?', type: 'text', weight: 0.5 },
      { key: 'motivation_drivers', text: 'Vad driver dig mest och ger dig energi i ditt arbete?', type: 'text', weight: 0.5 },
      { key: 'ideal_creative_project', text: 'Hur skulle ditt ideala kreativa projekt se ut där du kan använda alla dina talanger?', type: 'text', weight: 0.5 },
    ],
    scoreCalculation: (answers: Record<string, any>) => {
      let totalScore = 0;
      let totalWeight = 0;
      
      Object.entries(answers).forEach(([key, value]) => {
        const question = PILLAR_MODULES.talent.questions.find(q => q.key === key);
        if (question && question.type === 'slider' && typeof value === 'number') {
          totalScore += value * (question.weight || 1);
          totalWeight += (question.weight || 1);
        }
      });
      
      return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 10) / 10 : 0;
    },
    insightGeneration: (answers: Record<string, any>, score: number) => {
      const insights: Record<string, any> = {
        overallScore: score,
        naturalStrengths: answers.natural_strengths || '',
        flowExperiences: answers.flow_experiences_detail || '',
        underutilizedTalents: answers.underutilized_talents || '',
        strengths: [],
        developmentAreas: [],
        recommendations: []
      };
      
      Object.entries(answers).forEach(([key, value]) => {
        if (typeof value === 'number') {
          if (value >= 8) insights.strengths.push(key);
          if (value <= 4) insights.developmentAreas.push(key);
        }
      });
      
      return insights;
    }
  },

  brand: {
    key: 'brand',
    name: 'Varumärke & Position',
    description: 'Hur du vill uppfattas och positionerar dig',
    icon: '🎨',
    color: '#8B5CF6',
    questions: [
      { key: 'brand_clarity', text: 'Hur tydlig är din varumärkesidentitet?', type: 'slider', weight: 1.2, min: 1, max: 10 },
      { key: 'message_consistency', text: 'Hur konsekvent är ditt budskap över olika kanaler?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'target_audience_understanding', text: 'Hur väl förstår du din målgrupp?', type: 'slider', weight: 1.2, min: 1, max: 10 },
      { key: 'differentiation', text: 'Hur tydligt skiljer du dig från konkurrenterna?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'brand_authenticity', text: 'Känns ditt varumärke äkta och autentiskt?', type: 'slider', weight: 1.2, min: 1, max: 10 },
      { key: 'visual_identity', text: 'Har du en stark visuell identitet?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'brand_storytelling', text: 'Berättar du din historia på ett engagerande sätt?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'reputation_management', text: 'Arbetar du aktivt med ditt rykte?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'brand_visibility', text: 'Är ditt varumärke synligt för din målgrupp?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'brand_trust', text: 'Bygger du förtroende genom ditt varumärke?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'brand_evolution', text: 'Utvecklar du ditt varumärke kontinuerligt?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'brand_measurement', text: 'Mäter du hur ditt varumärke uppfattas?', type: 'slider', weight: 0.9, min: 1, max: 10 },
      { key: 'brand_positioning', text: 'Har du en tydlig positionering på marknaden?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'brand_engagement', text: 'Engagerar ditt varumärke din målgrupp?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'brand_consistency', text: 'Är du konsekvent i hur du presenterar dig?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'desired_perception', text: 'Hur vill du att människor ska uppfatta dig och ditt varumärke? Vad ska de tänka och känna?', type: 'text', weight: 0.5 },
      { key: 'current_signaling', text: 'Vad signalerar du till andra just nu genom ditt sätt att framträda? Vad tror du andra ser?', type: 'text', weight: 0.5 },
      { key: 'target_audience_detail', text: 'Beskriv din drömpublik i detalj - vem är de och vad behöver de?', type: 'text', weight: 0.5 },
      { key: 'core_values', text: 'Vilka värderingar är absolut centrala för ditt varumärke och får inte kompromissas?', type: 'text', weight: 0.5 },
      { key: 'unique_selling_point', text: 'Vad gör dig unik jämfört med andra inom ditt område? Vad är din superkraft?', type: 'text', weight: 0.5 },
    ],
    scoreCalculation: (answers: Record<string, any>) => {
      let totalScore = 0;
      let totalWeight = 0;
      
      Object.entries(answers).forEach(([key, value]) => {
        const question = PILLAR_MODULES.brand.questions.find(q => q.key === key);
        if (question && question.type === 'slider' && typeof value === 'number') {
          totalScore += value * (question.weight || 1);
          totalWeight += (question.weight || 1);
        }
      });
      
      return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 10) / 10 : 0;
    },
    insightGeneration: (answers: Record<string, any>, score: number) => {
      const insights: Record<string, any> = {
        overallScore: score,
        desiredPerception: answers.desired_perception || '',
        currentSignaling: answers.current_signaling || '',
        targetAudience: answers.target_audience_detail || '',
        coreValues: answers.core_values || '',
        uniqueSellingPoint: answers.unique_selling_point || '',
        strengths: [],
        developmentAreas: [],
        recommendations: []
      };
      
      Object.entries(answers).forEach(([key, value]) => {
        if (typeof value === 'number') {
          if (value >= 8) insights.strengths.push(key);
          if (value <= 4) insights.developmentAreas.push(key);
        }
      });
      
      return insights;
    }
  },

  economy: {
    key: 'economy',
    name: 'Ekonomi & Tillväxt',
    description: 'Din ekonomiska utveckling och tillväxtmöjligheter',
    icon: '💰',
    color: '#EF4444',
    questions: [
      { key: 'financial_security', text: 'Hur trygg känner du dig ekonomiskt?', type: 'slider', weight: 1.2, min: 1, max: 10 },
      { key: 'income_diversification', text: 'Har du diversifierade inkomstkällor?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'savings_habits', text: 'Hur bra är dina sparrutiner?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'investment_knowledge', text: 'Hur bra är din kunskap om investeringar?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'passive_income_awareness', text: 'Känner du till möjligheter för passiva inkomster?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'financial_planning', text: 'Planerar du din ekonomi långsiktigt?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'expense_control', text: 'Har du kontroll över dina utgifter?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'business_opportunities', text: 'Ser du affärsmöjligheter inom ditt område?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'financial_education', text: 'Utvecklar du kontinuerligt din finansiella kunskap?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'income_potential', text: 'Arbetar du aktivt för att öka din inkomstpotential?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'debt_management', text: 'Hanterar du skulder och krediter på ett bra sätt?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'emergency_fund', text: 'Har du en ekonomisk buffert för oväntade utgifter?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'financial_goals', text: 'Har du tydliga ekonomiska mål?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'money_mindset', text: 'Har du en hälsosam relation till pengar?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'financial_freedom_progress', text: 'Arbetar du mot ekonomisk frihet?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'current_financial_situation', text: 'Beskriv din nuvarande ekonomiska situation och dina huvudsakliga intäktskällor', type: 'text', weight: 0.5 },
      { key: 'income_opportunities', text: 'Vilka möjligheter ser du för att öka dina inkomster inom ditt område?', type: 'text', weight: 0.5 },
      { key: 'savings_and_goals', text: 'Hur sparar du idag och vad är dina ekonomiska mål på kort och lång sikt?', type: 'text', weight: 0.5 },
      { key: 'financial_obstacles', text: 'Vad hindrar dig från att förbättra din ekonomi just nu? Vilka är dina största utmaningar?', type: 'text', weight: 0.5 },
      { key: 'alternative_income_living', text: 'Kan du tänka dig alternativa sätt att leva billigare, tjäna extra eller skapa passiva inkomster?', type: 'text', weight: 0.5 },
    ],
    scoreCalculation: (answers: Record<string, any>) => {
      let totalScore = 0;
      let totalWeight = 0;
      
      Object.entries(answers).forEach(([key, value]) => {
        const question = PILLAR_MODULES.economy.questions.find(q => q.key === key);
        if (question && question.type === 'slider' && typeof value === 'number') {
          totalScore += value * (question.weight || 1);
          totalWeight += (question.weight || 1);
        }
      });
      
      return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 10) / 10 : 0;
    },
    insightGeneration: (answers: Record<string, any>, score: number) => {
      const insights: Record<string, any> = {
        overallScore: score,
        currentSituation: answers.current_financial_situation || '',
        incomeOpportunities: answers.income_opportunities || '',
        savingsAndGoals: answers.savings_and_goals || '',
        obstacles: answers.financial_obstacles || '',
        alternativeStrategies: answers.alternative_income_living || '',
        strengths: [],
        developmentAreas: [],
        recommendations: []
      };
      
      Object.entries(answers).forEach(([key, value]) => {
        if (typeof value === 'number') {
          if (value >= 8) insights.strengths.push(key);
          if (value <= 4) insights.developmentAreas.push(key);
        }
      });
      
      return insights;
    }
  }
};