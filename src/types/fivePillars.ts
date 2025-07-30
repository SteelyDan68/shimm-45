export type PillarType = 'self_care' | 'skills' | 'talent' | 'brand' | 'economy';

export interface AssessmentRound {
  id: string;
  client_id: string;
  pillar_type: PillarType;
  scores: Record<string, number>;
  comments?: string;
  ai_analysis?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ClientPillarAssignment {
  id: string;
  client_id: string;
  pillar_type: PillarType;
  is_active: boolean;
  assigned_by: string;
  assigned_at: string;
  updated_at: string;
}

export interface PillarQuestion {
  id: string;
  text: string;
  type: 'scale' | 'boolean' | 'text';
  min?: number;
  max?: number;
}

export interface PillarConfig {
  name: string;
  description: string;
  questions: PillarQuestion[];
  aiPrompt: string;
}

export const PILLAR_CONFIGS: Record<PillarType, PillarConfig> = {
  self_care: {
    name: 'Self Care',
    description: 'Fysisk och mental hälsa, vila och återhämtning',
    questions: [
      { id: 'sleep_quality', text: 'Hur väl sover du?', type: 'scale', min: 1, max: 5 },
      { id: 'stress_level', text: 'Hur stressad känner du dig?', type: 'scale', min: 1, max: 5 },
      { id: 'exercise_frequency', text: 'Hur ofta motionerar du?', type: 'scale', min: 1, max: 5 },
      { id: 'nutrition', text: 'Hur nöjd är du med dina matvanor?', type: 'scale', min: 1, max: 5 },
      { id: 'work_life_balance', text: 'Hur balanserat är ditt liv?', type: 'scale', min: 1, max: 5 },
    ],
    aiPrompt: 'Analysera klientens self care-nivå baserat på sömn, stress, motion, nutrition och work-life balance. Ge konkreta råd för förbättring.'
  },
  skills: {
    name: 'Skills',
    description: 'Färdigheter och kompetenser för din karriär',
    questions: [
      { id: 'technical_skills', text: 'Hur nöjd är du med dina tekniska färdigheter?', type: 'scale', min: 1, max: 5 },
      { id: 'communication', text: 'Hur bra är du på kommunikation?', type: 'scale', min: 1, max: 5 },
      { id: 'leadership', text: 'Hur utvecklade är dina ledarskapsförmågor?', type: 'scale', min: 1, max: 5 },
      { id: 'creativity', text: 'Hur kreativ känner du dig?', type: 'scale', min: 1, max: 5 },
      { id: 'learning_ability', text: 'Hur snabbt lär du dig nya saker?', type: 'scale', min: 1, max: 5 },
    ],
    aiPrompt: 'Analysera klientens färdighetsnivå inom teknik, kommunikation, ledarskap, kreativitet och inlärning. Föreslå utvecklingsområden och konkreta steg.'
  },
  talent: {
    name: 'Talent',
    description: 'Naturliga begåvningar och unika styrkor',
    questions: [
      { id: 'unique_strengths', text: 'Hur väl känner du dina unika styrkor?', type: 'scale', min: 1, max: 5 },
      { id: 'passion_alignment', text: 'Hur väl matchar ditt arbete dina passioner?', type: 'scale', min: 1, max: 5 },
      { id: 'natural_abilities', text: 'Hur väl utnyttjar du dina naturliga talanger?', type: 'scale', min: 1, max: 5 },
      { id: 'flow_state', text: 'Hur ofta hamnar du i flow när du arbetar?', type: 'scale', min: 1, max: 5 },
      { id: 'talent_recognition', text: 'Hur väl erkänns dina talanger av andra?', type: 'scale', min: 1, max: 5 },
    ],
    aiPrompt: 'Analysera hur väl klienten känner och utnyttjar sina naturliga talanger. Hjälp dem identifiera outnyttjad potential och sätt att stärka sina unika förmågor.'
  },
  brand: {
    name: 'Brand',
    description: 'Personligt varumärke och synlighet',
    questions: [
      { id: 'brand_clarity', text: 'Hur tydligt är ditt personliga varumärke?', type: 'scale', min: 1, max: 5 },
      { id: 'online_presence', text: 'Hur nöjd är du med din online-närvaro?', type: 'scale', min: 1, max: 5 },
      { id: 'content_creation', text: 'Hur konsekvent skapar du innehåll?', type: 'scale', min: 1, max: 5 },
      { id: 'audience_engagement', text: 'Hur väl engagerar du din målgrupp?', type: 'scale', min: 1, max: 5 },
      { id: 'brand_consistency', text: 'Hur konsekvent är ditt varumärke över alla kanaler?', type: 'scale', min: 1, max: 5 },
    ],
    aiPrompt: 'Analysera klientens personliga varumärke, online-närvaro och målgruppsengagemang. Ge råd för att stärka varumärket och öka synligheten.'
  },
  economy: {
    name: 'Economy',
    description: 'Ekonomisk stabilitet och tillväxt',
    questions: [
      { id: 'income_satisfaction', text: 'Hur nöjd är du med din nuvarande inkomst?', type: 'scale', min: 1, max: 5 },
      { id: 'financial_planning', text: 'Hur väl planerar du din ekonomi?', type: 'scale', min: 1, max: 5 },
      { id: 'investment_knowledge', text: 'Hur bra är din kunskap om investeringar?', type: 'scale', min: 1, max: 5 },
      { id: 'diversification', text: 'Hur diversifierade är dina inkomstkällor?', type: 'scale', min: 1, max: 5 },
      { id: 'financial_security', text: 'Hur säker känner du dig ekonomiskt?', type: 'scale', min: 1, max: 5 },
    ],
    aiPrompt: 'Analysera klientens ekonomiska situation, planering och säkerhet. Ge råd för att förbättra ekonomisk stabilitet och tillväxt.'
  }
};