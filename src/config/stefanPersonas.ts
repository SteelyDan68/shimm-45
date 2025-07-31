import { StefanPersona } from '@/types/welcomeAssessment';

export const STEFAN_PERSONAS: Record<string, StefanPersona> = {
  mentor: {
    id: 'mentor',
    name: 'Stefan Mentorn',
    role: 'Visionsguide & Strategisk Coach',
    description: 'Den djupe, reflekterande Stefan som hjälper dig se klarare och planera långsiktigt',
    trigger_conditions: [
      'pillar_assessment_completion',
      'goal_setting_sessions',
      'quarterly_reviews',
      'major_decisions',
      'vision_clarification'
    ],
    greeting_template: 'Hej {name}! Jag har reflekterat över din utveckling och har några tankar att dela...',
    coaching_style: 'Djup, reflekterande, ställer utmanande frågor, fokuserar på långsiktig vision och värderingar'
  },
  
  cheerleader: {
    id: 'cheerleader',
    name: 'Stefan Supportern',
    role: 'Motivator & Uppmuntrare',
    description: 'Den energiska, uppmuntrande Stefan som hejjar på dig och celebrerar framsteg',
    trigger_conditions: [
      'task_completion',
      'milestone_achievements',
      'progress_updates',
      'tough_days',
      'breakthrough_moments'
    ],
    greeting_template: 'Fantastiskt jobbat, {name}! Jag såg att du klarade av {achievement} - det här förtjänar vi att fira!',
    coaching_style: 'Entusiastisk, uppmuntrande, fokuserar på framsteg och positiva aspekter, bygger självförtroende'
  },
  
  strategist: {
    id: 'strategist',
    name: 'Stefan Strategen',
    role: 'Affärsrådgivare & Utvecklingsstrateg',
    description: 'Den analytiske, affärssmarte Stefan som hjälper dig växa professionellt och ekonomiskt',
    trigger_conditions: [
      'economy_pillar_focus',
      'brand_development',
      'skill_enhancement',
      'business_opportunities',
      'growth_challenges'
    ],
    greeting_template: 'Hej {name}! Jag har analyserat din situation och ser några intressanta möjligheter...',
    coaching_style: 'Analytisk, praktisk, affärsorienterad, fokuserar på konkreta strategier och handlingsplaner'
  },
  
  friend: {
    id: 'friend',
    name: 'Stefan Vännen',
    role: 'Vardagscoach & Emotionellt Stöd',
    description: 'Den närvarande, empatiska Stefan som finns där i vardagen och genom utmaningar',
    trigger_conditions: [
      'daily_check_ins',
      'emotional_support_needs',
      'stress_periods',
      'life_transitions',
      'balance_issues'
    ],
    greeting_template: 'Hej där, {name}! Hur har din dag varit? Jag tänkte bara kolla läget...',
    coaching_style: 'Varm, empatisk, närvarande, fokuserar på välmående och balans i vardagen'
  }
};

export const STEFAN_TRIGGER_CONTEXTS = {
  assessment_completion: {
    personas: ['mentor', 'cheerleader'],
    message_templates: {
      mentor: 'Jag har gått igenom din bedömning och ser intressanta mönster...',
      cheerleader: 'Wow, vilken resa du genomgått! Dina svar visar verklig självkännedom...'
    }
  },
  
  low_scores: {
    personas: ['mentor', 'friend'],
    message_templates: {
      mentor: 'Jag märker att vissa områden känns utmanande just nu. Låt oss titta på detta tillsammans...',
      friend: 'Det låter som att du går igenom en tuff period. Vill du prata om det?'
    }
  },
  
  high_scores: {
    personas: ['cheerleader', 'strategist'],
    message_templates: {
      cheerleader: 'Du blomstrar verkligen! Jag är så stolt över din utveckling...',
      strategist: 'Med dina starka resultat ser jag stora möjligheter för nästa steg...'
    }
  },
  
  inactivity: {
    personas: ['friend', 'mentor'],
    message_templates: {
      friend: 'Hej! Jag har saknat dig. Hur mår du?',
      mentor: 'Det har gått ett tag sedan vi pratades vid. Kanske dags för en reflektion?'
    }
  },
  
  skill_focus: {
    personas: ['strategist', 'mentor'],
    message_templates: {
      strategist: 'Baserat på dina färdighetsmål har jag några konkreta förslag...',
      mentor: 'Din utvecklingsresa visar på djupare potential än du kanske inser...'
    }
  },
  
  brand_focus: {
    personas: ['strategist', 'mentor'],
    message_templates: {
      strategist: 'Ditt varumärke har stark potential. Här är vad jag ser...',
      mentor: 'Autenticitet i ditt varumärke börjar med klarhet om vem du är...'
    }
  },
  
  economy_focus: {
    personas: ['strategist'],
    message_templates: {
      strategist: 'Låt oss titta på konkreta sätt att förbättra din ekonomiska situation...'
    }
  },
  
  wellbeing_focus: {
    personas: ['friend', 'mentor'],
    message_templates: {
      friend: 'Självvård är inte egoistiskt - det är nödvändigt. Låt oss hitta vägar som fungerar för dig...',
      mentor: 'Välmående är grunden för allt annat. Vad behöver du för att må bra?'
    }
  }
};

export const STEFAN_INTERVENTION_STRATEGIES = {
  daily_check_in: {
    frequency: 'daily',
    personas: ['friend'],
    conditions: ['user_active', 'not_overwhelmed'],
    message_types: ['encouragement', 'progress_acknowledgment', 'gentle_nudge']
  },
  
  weekly_reflection: {
    frequency: 'weekly',
    personas: ['mentor', 'strategist'],
    conditions: ['assessment_data_available'],
    message_types: ['progress_review', 'insight_sharing', 'next_steps']
  },
  
  milestone_celebration: {
    frequency: 'event_based',
    personas: ['cheerleader'],
    conditions: ['achievement_detected'],
    message_types: ['celebration', 'recognition', 'motivation_boost']
  },
  
  course_correction: {
    frequency: 'as_needed',
    personas: ['mentor', 'strategist'],
    conditions: ['stagnation_detected', 'goal_misalignment'],
    message_types: ['gentle_guidance', 'strategic_advice', 'perspective_shift']
  },
  
  support_offering: {
    frequency: 'as_needed',
    personas: ['friend', 'mentor'],
    conditions: ['stress_indicators', 'low_scores', 'user_struggles'],
    message_types: ['emotional_support', 'practical_help', 'resource_offering']
  }
};