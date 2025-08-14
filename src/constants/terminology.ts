/**
 * 🏛️ OFFICIAL TERMINOLOGY STANDARDIZATION
 * SCRUM-TEAM Approved Translation Dictionary
 * 
 * RULE: Database keys remain in English, UI shows Swedish
 */

export const OFFICIAL_TERMINOLOGY = {
  // Core Pillar Names
  PILLARS: {
    self_care: 'Självomvårdnad',
    skills: 'Kompetenser', 
    talent: 'Talang',
    brand: 'Varumärke',
    economy: 'Ekonomi',
    open_track: 'Öppna Spåret'
  },

  // Assessment Related
  ASSESSMENT: {
    assessment: 'Självskattning',
    assessments: 'Självskattningar',
    score: 'Poäng',
    analysis: 'Analys',
    recommendation: 'Rekommendation',
    completed: 'Slutförd',
    pending: 'Väntande',
    in_progress: 'Pågående'
  },

  // Development Related  
  DEVELOPMENT: {
    development: 'Utveckling',
    progress: 'Framsteg',
    journey: 'Resa',
    milestone: 'Milstolpe',
    goal: 'Mål',
    action_item: 'Handlingsplan',
    task: 'Uppgift',
    activity: 'Aktivitet'
  },

  // System Actions
  ACTIONS: {
    start: 'Starta',
    continue: 'Fortsätt',
    complete: 'Slutför',
    retake: 'Gör om',
    reset: 'Återställ',
    cancel: 'Avbryt',
    save: 'Spara',
    delete: 'Radera'
  },

  // Time Related
  TIME: {
    today: 'Idag',
    tomorrow: 'Imorgon',
    this_week: 'Denna vecka',
    next_week: 'Nästa vecka',
    upcoming: 'Kommande',
    overdue: 'Försenad'
  },

  // Status Messages
  STATUS: {
    loading: 'Laddar...',
    error: 'Ett fel uppstod',
    success: 'Lyckades!',
    no_data: 'Ingen data tillgänglig',
    unauthorized: 'Ej behörig'
  }
} as const;

// Helper function to get pillar name in Swedish
export const getPillarDisplayName = (pillarKey: string): string => {
  return OFFICIAL_TERMINOLOGY.PILLARS[pillarKey as keyof typeof OFFICIAL_TERMINOLOGY.PILLARS] || pillarKey;
};

// Helper function to get assessment status in Swedish  
export const getAssessmentStatusDisplay = (status: string): string => {
  return OFFICIAL_TERMINOLOGY.ASSESSMENT[status as keyof typeof OFFICIAL_TERMINOLOGY.ASSESSMENT] || status;
};

// Helper function to get development term in Swedish
export const getDevelopmentTermDisplay = (term: string): string => {
  return OFFICIAL_TERMINOLOGY.DEVELOPMENT[term as keyof typeof OFFICIAL_TERMINOLOGY.DEVELOPMENT] || term;
};

// Predefined common UI texts for consistency
export const UI_TEXTS = {
  welcome: 'Välkommen',
  dashboard: 'Dashboard',
  my_assessments: 'Mina självskattningar',
  my_analyses: 'Mina analyser', 
  my_program: 'Mitt program',
  calendar: 'Kalender',
  tasks: 'Uppgifter',
  profile: 'Profil',
  settings: 'Inställningar',
  logout: 'Logga ut',
  
  // Assessment flow
  start_assessment: 'Starta självskattning',
  continue_assessment: 'Fortsätt självskattning',
  view_analysis: 'Visa analys',
  retake_assessment: 'Gör om självskattning',
  
  // Progress tracking
  progress_overview: 'Framstegsöversikt',
  pillar_journey: 'Pillar-utvecklingsresa',
  development_plan: 'Utvecklingsplan',
  
  // Common actions
  view_details: 'Visa detaljer',
  edit: 'Redigera',
  delete: 'Radera',
  cancel: 'Avbryt',
  save: 'Spara',
  close: 'Stäng'
} as const;