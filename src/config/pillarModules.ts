import { PillarModuleConfig, PillarKey } from '@/types/fivePillarsModular';

// Prioriteringsordning för pillars (Self Care först för att visa självskattning direkt)
export const PILLAR_PRIORITY_ORDER: PillarKey[] = [
  'self_care',
  'skills',
  'talent', 
  'brand',
  'economy',
  'open_track'
];

// Define questions and scoring logic for each pillar module
export const PILLAR_MODULES: Record<PillarKey, PillarModuleConfig> = {
  self_care: {
    key: 'self_care',
    name: 'Self Care',
    description: 'Utvärdera din grundläggande välbefinnande och livskvalitet. Detta pillar fokuserar på de fundamentala behoven som måste vara tillgodosedda för att du ska kunna fungera optimalt.',
    icon: '💚',
    color: '#10B981',
    questions: [
      // Stress och emotionell hälsa (fokuserade på påverkbara faktorer)
      { key: 'stress_hantering', text: 'Hur väl hanterar du stress i vardagen?', type: 'slider', min: 1, max: 10, weight: 1.2 },
      { key: 'energiniva', text: 'Hur är din energinivå under en normal dag?', type: 'slider', min: 1, max: 10, weight: 1.2 },
      { key: 'sovkvalitet', text: 'Hur nöjd är du med din sömn?', type: 'slider', min: 1, max: 10, weight: 1.1 },
      { key: 'emotionell_balans', text: 'Känner du dig emotionellt balanserad?', type: 'slider', min: 1, max: 10, weight: 1.1 },
      { key: 'tid_for_vila', text: 'Har du tid för vila och återhämtning?', type: 'slider', min: 1, max: 10, weight: 1.0 },
      
      // Fysisk hälsa och välbefinnande
      { key: 'fysisk_aktivitet', text: 'Hur nöjd är du med din fysiska aktivitetsnivå?', type: 'slider', min: 1, max: 10, weight: 1.0 },
      { key: 'kostvanor', text: 'Hur nöjd är du med dina matvanor?', type: 'slider', min: 1, max: 10, weight: 0.9 },
      { key: 'halsorutiner', text: 'Följer du hälsosamma rutiner regelbundet?', type: 'slider', min: 1, max: 10, weight: 0.9 },
      
      // Socialt stöd och relationer
      { key: 'socialt_stod', text: 'Känner du dig stöttad av människor omkring dig?', type: 'slider', min: 1, max: 10, weight: 1.0 },
      { key: 'tid_med_nara', text: 'Får du tillräckligt med kvalitetstid med nära personer?', type: 'slider', min: 1, max: 10, weight: 0.9 },
      
      // Work-life balance och gränser
      { key: 'arbete_vila_balans', text: 'Hur bra är balansen mellan arbete och vila?', type: 'slider', min: 1, max: 10, weight: 1.1 },
      { key: 'personliga_granser', text: 'Är du bra på att sätta och hålla personliga gränser?', type: 'slider', min: 1, max: 10, weight: 1.0 },
      
      // Självreflektion och personlig utveckling
      { key: 'sjalvkansla', text: 'Hur är din självkänsla och självförtroende?', type: 'slider', min: 1, max: 10, weight: 1.0 },
      { key: 'meningsfullhet', text: 'Känner du att ditt liv har mening och syfte?', type: 'slider', min: 1, max: 10, weight: 0.9 },
      
      // Öppna frågor för djupare insikt
      { key: 'stress_triggers', text: 'Vad är dina största stressutlösare och hur påverkar de dig?', type: 'text', weight: 0.5 },
      { key: 'energy_patterns', text: 'När på dagen har du mest/minst energi och vad påverkar detta?', type: 'text', weight: 0.5 },
      { key: 'self_care_activities', text: 'Vilka aktiviteter får dig att känna dig mest avslappnad och återställd?', type: 'text', weight: 0.5 },
      { key: 'improvement_areas', text: 'Vilket område inom self care skulle du mest vilja förbättra?', type: 'text', weight: 0.5 }
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
    description: 'Utvärdera och utveckla dina professionella kompetenser strategiskt. Fokuserar på målinriktad kompetensutveckling och praktisk tillämpning.',
    icon: '🎯',
    color: '#3B82F6',
    questions: [
      // Nuvarande kompetensnivå och självförtroende
      { key: 'core_competence', text: 'Hur kompetent känner du dig inom ditt huvudområde?', type: 'slider', weight: 1.3, min: 1, max: 10 },
      { key: 'skill_application', text: 'Hur väl kan du tillämpa dina färdigheter i praktiken?', type: 'slider', weight: 1.2, min: 1, max: 10 },
      { key: 'learning_efficiency', text: 'Hur effektivt lär du dig nya saker?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      
      // Utvecklingsprocess och metoder
      { key: 'structured_learning', text: 'Har du en strukturerad plan för din kompetensutveckling?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'feedback_integration', text: 'Hur bra är du på att ta emot och använda feedback?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'practice_consistency', text: 'Övar du dina färdigheter regelbundet och konsekvent?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      
      // Problemlösning och kreativitet
      { key: 'complex_problem_solving', text: 'Känner du dig trygg när du möter komplexa utmaningar?', type: 'slider', weight: 1.2, min: 1, max: 10 },
      { key: 'innovative_thinking', text: 'Kommer du ofta på nya sätt att lösa problem?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'adaptability', text: 'Anpassar du dig lätt till nya verktyg och metoder?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      
      // Kunskapsdelning och samarbete
      { key: 'knowledge_sharing', text: 'Delar du gärna din kunskap med andra?', type: 'slider', weight: 0.9, min: 1, max: 10 },
      { key: 'collaborative_learning', text: 'Lär du dig effektivt tillsammans med andra?', type: 'slider', weight: 0.9, min: 1, max: 10 },
      
      // Självstyrning och målsättning
      { key: 'goal_clarity', text: 'Har du tydliga mål för din kompetensutveckling?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'progress_tracking', text: 'Följer du upp din utveckling systematiskt?', type: 'slider', weight: 0.9, min: 1, max: 10 },
      
      // Djupgående reflektion
      { key: 'core_expertise', text: 'Vad är du absolut bäst på och vad gör dig unik inom ditt område?', type: 'text', weight: 0.6 },
      { key: 'skill_gaps', text: 'Vilka specifika färdigheter behöver du utveckla för att nå nästa nivå?', type: 'text', weight: 0.6 },
      { key: 'learning_preferences', text: 'Hur lär du dig bäst? Ge konkreta exempel på framgångsrika inlärningssituationer.', type: 'text', weight: 0.5 },
      { key: 'growth_challenges', text: 'Vad hindrar dig mest från att utvecklas snabbare?', type: 'text', weight: 0.5 },
      { key: 'expertise_vision', text: 'Hur ser du dig själv som expert om 2-3 år? Vad vill du vara känd för?', type: 'text', weight: 0.5 }
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
    description: 'Identifiera och maximera dina naturliga begåvningar. Fokuserar på att förstå och utveckla det som gör dig unik och framstående.',
    icon: '⭐',
    color: '#F59E0B',
    questions: [
      // Talangidentifiering och medvetenhet
      { key: 'natural_gifts', text: 'Känner du tydligt till vad du är naturligt begåvad för?', type: 'slider', weight: 1.3, min: 1, max: 10 },
      { key: 'effortless_excellence', text: 'Finns det saker som känns lätta för dig men svåra för andra?', type: 'slider', weight: 1.2, min: 1, max: 10 },
      { key: 'talent_recognition', text: 'Uppmärksammar andra regelbundet dina specifika styrkor?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      
      // Flow och optimal prestanda
      { key: 'flow_frequency', text: 'Hur ofta hamnar du i ett "flow-tillstånd" där tiden flyger?', type: 'slider', weight: 1.2, min: 1, max: 10 },
      { key: 'energy_from_talents', text: 'Ger dina talanger dig energi snarare än att tära på den?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'natural_learning', text: 'Lär du dig vissa saker märkbart snabbare än andra?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      
      // Talantutnyttjande och utveckling
      { key: 'talent_utilization', text: 'Använder du dina största talanger dagligen i ditt arbete?', type: 'slider', weight: 1.3, min: 1, max: 10 },
      { key: 'strength_investment', text: 'Investerar du tid i att utveckla dina starkaste områden?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'talent_stretching', text: 'Utmanar du dina talanger med allt svårare uppgifter?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      
      // Autenticitet och passion
      { key: 'authentic_self', text: 'Känner du dig som din äkta själv när du använder dina talanger?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'intrinsic_motivation', text: 'Motiveras du inifrån av att använda dina talanger?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'talent_joy', text: 'Känner du glädje och tillfredsställelse i dina talangsområden?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      
      // Impact och värdeskapande
      { key: 'unique_contribution', text: 'Bidrar dina talanger med något unikt som andra inte kan ge?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'talent_impact', text: 'Skapar dina talanger tydligt värde för andra?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      
      // Djupgående talanganalys
      { key: 'signature_talents', text: 'Vilka är dina 3 starkaste talanger som gör dig unik? Beskriv dem i detalj.', type: 'text', weight: 0.7 },
      { key: 'effortless_achievements', text: 'Vad har du åstadkommit som kändes naturligt och lätt för dig?', type: 'text', weight: 0.6 },
      { key: 'childhood_patterns', text: 'Vad var du naturligt bra på redan som barn? Vilka mönster ser du?', type: 'text', weight: 0.5 },
      { key: 'energy_givers', text: 'Vilka aktiviteter ger dig mest energi och får dig att känna dig levande?', type: 'text', weight: 0.6 },
      { key: 'talent_potential', text: 'Hur skulle du kunna utveckla dina talanger till nästa nivå?', type: 'text', weight: 0.5 }
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
    description: 'Bygg ett starkt och autentiskt personligt varumärke. Fokuserar på att skapa en tydlig, konsekvent identitet som resonerar med din målgrupp.',
    icon: '🎨',
    color: '#8B5CF6',
    questions: [
      // Varumärkesklarhet och autenticitet
      { key: 'brand_identity_clarity', text: 'Har du en kristallklar bild av vad ditt varumärke representerar?', type: 'slider', weight: 1.3, min: 1, max: 10 },
      { key: 'authentic_self_expression', text: 'Uttrycker ditt varumärke vem du verkligen är?', type: 'slider', weight: 1.2, min: 1, max: 10 },
      { key: 'consistent_messaging', text: 'Är ditt budskap konsekvent över alla dina kanaler?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      
      // Målgruppsförståelse och positionering
      { key: 'audience_connection', text: 'Förstår du djupt vad din målgrupp verkligen behöver?', type: 'slider', weight: 1.2, min: 1, max: 10 },
      { key: 'market_positioning', text: 'Har du en tydlig och unik position på din marknad?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'competitive_differentiation', text: 'Sticker du ut tydligt från andra inom ditt område?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      
      // Visuell identitet och kommunikation
      { key: 'visual_consistency', text: 'Har du en stark och konsekvent visuell profil?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'storytelling_power', text: 'Berättar du din historia på ett fängslande sätt?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'content_value', text: 'Tillför ditt innehåll verkligt värde för din målgrupp?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      
      // Engagemang och förtroende
      { key: 'audience_engagement', text: 'Skapar du äkta engagemang och interaktion?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'trust_building', text: 'Bygger du systematiskt förtroende med din målgrupp?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'reputation_awareness', text: 'Är du medveten om hur andra uppfattar ditt varumärke?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      
      // Utveckling och anpassning
      { key: 'brand_evolution', text: 'Utvecklar du ditt varumärke strategiskt över tid?', type: 'slider', weight: 0.9, min: 1, max: 10 },
      { key: 'feedback_integration', text: 'Lyssnar du på och anpassar dig efter feedback?', type: 'slider', weight: 0.9, min: 1, max: 10 },
      
      // Strategisk reflektion
      { key: 'brand_essence', text: 'Beskriv kärnan i ditt varumärke - vad representerar du i en mening?', type: 'text', weight: 0.7 },
      { key: 'ideal_perception', text: 'Hur vill du att din drömpublik ska beskriva dig till andra?', type: 'text', weight: 0.6 },
      { key: 'value_proposition', text: 'Vad är din unika värdeerbjudande? Varför ska människor välja just dig?', type: 'text', weight: 0.6 },
      { key: 'brand_gaps', text: 'Vad är skillnaden mellan hur du vill uppfattas och hur du faktiskt uppfattas?', type: 'text', weight: 0.6 },
      { key: 'brand_evolution_vision', text: 'Hur ser du ditt varumärke om 2-3 år? Vad vill du vara känd för?', type: 'text', weight: 0.5 }
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
    name: 'Ekonomi & Hållbarhet',
    description: 'Bygg finansiell stabilitet och hållbar ekonomisk tillväxt. Fokuserar på intäktsoptimering, kostnadseffektivitet och långsiktig ekonomisk planering.',
    icon: '💰',
    color: '#059669',
    questions: [
      // Intäkter och värdeskapande
      { key: 'revenue_predictability', text: 'Hur förutsägbara är dina inkomster månad till månad?', type: 'slider', weight: 1.3, min: 1, max: 10 },
      { key: 'income_diversification', text: 'Har du flera olika inkomstströmmar?', type: 'slider', weight: 1.2, min: 1, max: 10 },
      { key: 'pricing_confidence', text: 'Känner du dig trygg med att ta betalt för ditt värde?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'value_monetization', text: 'Förvandlar du effektivt ditt värde till intäkter?', type: 'slider', weight: 1.2, min: 1, max: 10 },
      
      // Kostnadshantering och effektivitet
      { key: 'cost_awareness', text: 'Har du full kontroll över dina affärsutgifter?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'investment_roi', text: 'Mäter du avkastningen på dina investeringar?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'operational_efficiency', text: 'Arbetar du kostnadseffektivt och smart?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      
      // Finansiell planering och säkerhet
      { key: 'emergency_buffer', text: 'Har du ekonomisk buffert för oväntade situationer?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'financial_goals', text: 'Har du tydliga finansiella mål och planer?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      { key: 'cash_flow_management', text: 'Hanterar du kassaflödet proaktivt?', type: 'slider', weight: 1.1, min: 1, max: 10 },
      
      // Tillväxt och skalning
      { key: 'growth_investment', text: 'Investerar du strategiskt för framtida tillväxt?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'scalability_focus', text: 'Bygger du affärsmodeller som kan skala?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'market_opportunity', text: 'Ser du och agerar på ekonomiska möjligheter?', type: 'slider', weight: 0.9, min: 1, max: 10 },
      
      // Ekonomisk kunskap och kompetens
      { key: 'financial_literacy', text: 'Förstår du ekonomiska nyckeltal och principer?', type: 'slider', weight: 1.0, min: 1, max: 10 },
      { key: 'tax_optimization', text: 'Optimerar du din skattesituation lagligt?', type: 'slider', weight: 0.9, min: 1, max: 10 },
      
      // Strategisk ekonomisk reflektion
      { key: 'revenue_strategy', text: 'Beskriv din huvudsakliga intäktsstrategi. Hur tjänar du pengar och hur ska det utvecklas?', type: 'text', weight: 0.7 },
      { key: 'pricing_philosophy', text: 'Hur sätter du priser? Vad baserar du din prissättning på?', type: 'text', weight: 0.6 },
      { key: 'growth_investments', text: 'Vad investerar du i för att växa ekonomiskt? Vad ger bäst avkastning?', type: 'text', weight: 0.6 },
      { key: 'financial_obstacles', text: 'Vad är dina största ekonomiska utmaningar och hur planerar du att lösa dem?', type: 'text', weight: 0.6 },
      { key: 'economic_vision', text: 'Hur ser din ekonomiska vision ut om 3 år? Vad är målet?', type: 'text', weight: 0.5 }
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
  },

  open_track: {
    key: 'open_track',
    name: 'Öppet Spår',
    description: 'Din personliga utvecklingsresa med fritt valbara mål och förändringar',
    icon: '🛤️',
    color: '#EC4899',
    questions: [
      // Huvudmål och vision
      { key: 'change_goal', text: 'Vad vill du specifikt förändra eller utveckla?', type: 'text', weight: 2.0 },
      { key: 'goal_importance', text: 'Varför är denna förändring viktig för dig?', type: 'text', weight: 1.8 },
      { key: 'success_vision', text: 'Hur ser framgång ut för dig inom detta område? Beskriv så detaljerat som möjligt.', type: 'text', weight: 1.8 },
      
      // Nuläge och utmaningar
      { key: 'current_situation', text: 'Hur ser din situation ut idag inom detta område?', type: 'text', weight: 1.5 },
      { key: 'main_challenges', text: 'Vilka är dina största utmaningar eller hinder?', type: 'text', weight: 1.6 },
      { key: 'previous_attempts', text: 'Vad har du redan provat för att förändra detta?', type: 'text', weight: 1.3 },
      { key: 'challenge_background', text: 'Beskriv bakgrunden till denna utmaning - hur länge har den funnits?', type: 'text', weight: 1.2 },
      
      // Kapacitet och tidsplanering
      { key: 'daily_time_commitment', text: 'Hur mycket tid per dag kan du realistiskt avsätta för detta?', type: 'multiple_choice', options: ['5-10 minuter', '15-30 minuter', '30-60 minuter', '1-2 timmar', 'Mer än 2 timmar'], weight: 1.8 },
      { key: 'weekly_schedule', text: 'Vilka dagar i veckan passar bäst för dig att arbeta med detta?', type: 'multiple_choice', options: ['Varje dag', 'Vardagar', 'Helger', 'Specifika dagar (beskriv i kommentar)', 'Oregelbundet när jag har tid'], weight: 1.5 },
      { key: 'total_timeframe', text: 'Hur lång tid föreställer du dig att denna förändring behöver ta?', type: 'multiple_choice', options: ['1-4 veckor', '1-3 månader', '3-6 månader', '6-12 månader', 'Mer än ett år', 'Det spelar ingen roll'], weight: 1.6 },
      { key: 'urgency_level', text: 'Hur akut känns denna förändring för dig?', type: 'slider', min: 1, max: 10, weight: 1.4 },
      
      // Resurser och stöd
      { key: 'available_resources', text: 'Vilka resurser, verktyg eller hjälp har du tillgång till?', type: 'text', weight: 1.3 },
      { key: 'support_system', text: 'Vem i din omgivning kan stötta dig i denna förändring?', type: 'text', weight: 1.2 },
      { key: 'motivation_level', text: 'Hur motiverad känner du dig just nu (1-10)?', type: 'slider', min: 1, max: 10, weight: 1.5 },
      { key: 'confidence_level', text: 'Hur säker är du på att du kan lyckas med denna förändring (1-10)?', type: 'slider', min: 1, max: 10, weight: 1.4 },
      
      // Djupare förståelse
      { key: 'emotional_connection', text: 'Vilka känslor väcker denna förändring hos dig?', type: 'text', weight: 1.1 },
      { key: 'past_successes', text: 'Berätta om en liknande förändring du lyckats med tidigare', type: 'text', weight: 1.2 },
      { key: 'biggest_fear', text: 'Vad är du mest rädd för när det gäller denna förändring?', type: 'text', weight: 1.1 },
      { key: 'milestone_preferences', text: 'Föredrar du små dagliga framsteg eller större veckovisa mål?', type: 'multiple_choice', options: ['Små dagliga steg', 'Större veckovisa mål', 'En blandning av båda', 'Låt coachen bestämma'], weight: 1.3 },
      
      // Kommentarer och tillägg
      { key: 'additional_context', text: 'Finns det något annat viktigt att veta om din situation eller detta mål?', type: 'text', weight: 1.0 },
      { key: 'preferred_approach', text: 'Vilken typ av stöd eller approach tror du skulle fungera bäst för dig?', type: 'text', weight: 1.1 }
    ],
    scoreCalculation: (answers: Record<string, any>) => {
      // För "Öppet spår" är scoring mer kvalitativ och baserad på flera faktorer
      let totalScore = 0;
      let components = 0;
      
      // Målklarhet (30% av total score)
      const goalClarity = (answers.change_goal?.length > 10 ? 7 : 3) + 
                         (answers.goal_importance?.length > 20 ? 7 : 3) + 
                         (answers.success_vision?.length > 30 ? 8 : 4);
      totalScore += (goalClarity / 22) * 3;
      components++;
      
      // Motivation och självförtroende (25% av total score)
      const motivationScore = ((answers.motivation_level || 5) + (answers.confidence_level || 5)) / 2;
      totalScore += (motivationScore / 10) * 2.5;
      components++;
      
      // Kapacitet och realism (25% av total score)
      const hasRealisticTimeframe = answers.total_timeframe && answers.daily_time_commitment;
      const urgencyBalance = answers.urgency_level >= 3 && answers.urgency_level <= 8; // Lagom urgency
      const capacityScore = (hasRealisticTimeframe ? 6 : 3) + (urgencyBalance ? 4 : 2);
      totalScore += (capacityScore / 10) * 2.5;
      components++;
      
      // Förberedelse och insikt (20% av total score)
      const preparationScore = (answers.current_situation?.length > 15 ? 5 : 2) + 
                              (answers.main_challenges?.length > 15 ? 5 : 2);
      totalScore += (preparationScore / 10) * 2;
      components++;
      
      return components > 0 ? Math.round((totalScore / components) * 10) / 10 : 5;
    },
    insightGeneration: (answers: Record<string, any>, score: number) => {
      const insights: Record<string, any> = {
        overallScore: score,
        changeGoal: answers.change_goal || '',
        timeCommitment: answers.daily_time_commitment || '',
        timeframe: answers.total_timeframe || '',
        motivationLevel: answers.motivation_level || 5,
        confidenceLevel: answers.confidence_level || 5,
        urgencyLevel: answers.urgency_level || 5,
        mainChallenges: answers.main_challenges || '',
        supportSystem: answers.support_system || '',
        readinessLevel: 'moderate',
        recommendedApproach: '',
        keyFocusAreas: []
      };
      
      // Bedöm beredskap baserat på score och svar
      if (score >= 7.5 && insights.motivationLevel >= 7 && insights.confidenceLevel >= 6) {
        insights.readinessLevel = 'high';
        insights.recommendedApproach = 'intensiv';
      } else if (score >= 5.5 && insights.motivationLevel >= 5) {
        insights.readinessLevel = 'moderate';
        insights.recommendedApproach = 'gradual';
      } else {
        insights.readinessLevel = 'preparation_needed';
        insights.recommendedApproach = 'foundational';
      }
      
      // Identifiera nyckelområden baserat på svar
      if (insights.motivationLevel >= 8) insights.keyFocusAreas.push('high_motivation');
      if (insights.confidenceLevel <= 4) insights.keyFocusAreas.push('confidence_building');
      if (insights.urgencyLevel >= 8) insights.keyFocusAreas.push('urgent_action');
      if (answers.previous_attempts?.length > 20) insights.keyFocusAreas.push('learning_from_past');
      if (answers.support_system?.length > 10) insights.keyFocusAreas.push('strong_support');
      
      return insights;
    }
  }
};