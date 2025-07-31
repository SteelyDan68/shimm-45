import { WheelOfLifeArea, AdaptiveQuestion } from '@/types/welcomeAssessment';

export const WHEEL_OF_LIFE_AREAS: WheelOfLifeArea[] = [
  {
    key: 'health',
    name: 'Hälsa & Välmående',
    description: 'Din fysiska och mentala hälsa',
    score: 0
  },
  {
    key: 'career',
    name: 'Karriär & Arbete', 
    description: 'Din yrkesmässiga utveckling och tillfredsställelse',
    score: 0
  },
  {
    key: 'finances',
    name: 'Ekonomi',
    description: 'Din ekonomiska situation och säkerhet',
    score: 0
  },
  {
    key: 'relationships',
    name: 'Relationer & Kärlek',
    description: 'Dina romantiska och nära relationer',
    score: 0
  },
  {
    key: 'personal_growth',
    name: 'Personlig Utveckling',
    description: 'Din självutveckling och lärande',
    score: 0
  },
  {
    key: 'fun_recreation',
    name: 'Nöje & Rekreation',
    description: 'Din fritid och avkoppling',
    score: 0
  },
  {
    key: 'environment',
    name: 'Miljö & Hem',
    description: 'Din fysiska miljö och boendesituation',
    score: 0
  },
  {
    key: 'family_friends',
    name: 'Familj & Vänner',
    description: 'Dina sociala nätverk och stödsystem',
    score: 0
  }
];

export const ADAPTIVE_QUESTIONS: Record<string, AdaptiveQuestion[]> = {
  health: [
    {
      key: 'sleep_quality',
      text: 'Hur skulle du beskriva din sömnkvalitet?',
      type: 'scale',
      dependsOn: 'health',
      min: 1,
      max: 10
    },
    {
      key: 'stress_level',
      text: 'Hur hanterar du stress i vardagen?',
      type: 'scale',
      dependsOn: 'health',
      min: 1,
      max: 10
    },
    {
      key: 'exercise_frequency',
      text: 'Hur ofta rör du på dig eller tränar?',
      type: 'multiple_choice',
      dependsOn: 'health',
      options: ['Aldrig', 'Sällan', 'Ibland', 'Regelbundet', 'Dagligen']
    }
  ],
  career: [
    {
      key: 'job_satisfaction',
      text: 'Hur nöjd är du med ditt nuvarande arbete?',
      type: 'scale',
      dependsOn: 'career',
      min: 1,
      max: 10
    },
    {
      key: 'career_direction',
      text: 'Känner du att din karriär går i rätt riktning?',
      type: 'scale',
      dependsOn: 'career',
      min: 1,
      max: 10
    },
    {
      key: 'skill_development',
      text: 'Utvecklar du kontinuerligt dina yrkeskunskaper?',
      type: 'boolean',
      dependsOn: 'career'
    }
  ],
  finances: [
    {
      key: 'financial_stress',
      text: 'Hur ofta oroar du dig för ekonomin?',
      type: 'multiple_choice',
      dependsOn: 'finances',
      options: ['Aldrig', 'Sällan', 'Ibland', 'Ofta', 'Dagligen']
    },
    {
      key: 'savings_satisfaction',
      text: 'Är du nöjd med dina sparrutiner?',
      type: 'scale',
      dependsOn: 'finances',
      min: 1,
      max: 10
    }
  ],
  relationships: [
    {
      key: 'relationship_satisfaction',
      text: 'Hur nöjd är du med dina nära relationer?',
      type: 'scale',
      dependsOn: 'relationships',
      min: 1,
      max: 10
    },
    {
      key: 'social_support',
      text: 'Känner du att du har tillräckligt med socialt stöd?',
      type: 'boolean',
      dependsOn: 'relationships'
    }
  ],
  personal_growth: [
    {
      key: 'learning_motivation',
      text: 'Hur motiverad är du att lära dig nya saker?',
      type: 'scale',
      dependsOn: 'personal_growth',
      min: 1,
      max: 10
    },
    {
      key: 'goal_clarity',
      text: 'Har du tydliga mål för din personliga utveckling?',
      type: 'boolean',
      dependsOn: 'personal_growth'
    }
  ],
  fun_recreation: [
    {
      key: 'leisure_satisfaction',
      text: 'Är du nöjd med hur du spenderar din fritid?',
      type: 'scale',
      dependsOn: 'fun_recreation',
      min: 1,
      max: 10
    },
    {
      key: 'hobby_engagement',
      text: 'Har du hobbies som ger dig energi?',
      type: 'boolean',
      dependsOn: 'fun_recreation'
    }
  ],
  environment: [
    {
      key: 'home_satisfaction',
      text: 'Trivs du i ditt hem?',
      type: 'scale',
      dependsOn: 'environment',
      min: 1,
      max: 10
    },
    {
      key: 'workspace_comfort',
      text: 'Är din arbetsmiljö tillfredställande?',
      type: 'scale',
      dependsOn: 'environment',
      min: 1,
      max: 10
    }
  ],
  family_friends: [
    {
      key: 'family_connection',
      text: 'Känner du dig nära din familj?',
      type: 'scale',
      dependsOn: 'family_friends',
      min: 1,
      max: 10
    },
    {
      key: 'friendship_quality',
      text: 'Har du djupa och meningsfulla vänskaper?',
      type: 'boolean',
      dependsOn: 'family_friends'
    }
  ]
};

export const FREE_TEXT_QUESTIONS = [
  {
    key: 'life_vision',
    text: 'Hur ser ditt ideala liv ut om 5 år? Beskriv det i detalj.',
    category: 'vision'
  },
  {
    key: 'biggest_challenge',
    text: 'Vad är din största utmaning just nu i livet?',
    category: 'challenges'
  },
  {
    key: 'core_values',
    text: 'Vilka värderingar är viktigast för dig? Vad får aldrig kompromissas?',
    category: 'values'
  },
  {
    key: 'recent_achievement',
    text: 'Berätta om något du är stolt över att ha åstadkommit nyligen.',
    category: 'achievements'
  },
  {
    key: 'energy_drains',
    text: 'Vad tar mest energi från dig just nu? Vad skulle du vilja förändra?',
    category: 'energy'
  },
  {
    key: 'support_needs',
    text: 'Vilken typ av stöd eller hjälp skulle du behöva för att må bättre?',
    category: 'support'
  },
  {
    key: 'life_patterns',
    text: 'Vilka mönster ser du i ditt liv som du vill förändra eller förstärka?',
    category: 'patterns'
  },
  {
    key: 'motivation_sources',
    text: 'Vad motiverar dig mest? Vad får dig att känna dig levande?',
    category: 'motivation'
  },
  {
    key: 'growth_areas',
    text: 'Inom vilka områden vill du utvecklas mest under kommande året?',
    category: 'growth'
  },
  {
    key: 'legacy_vision',
    text: 'Vad vill du att människor ska komma ihåg dig för? Vad är ditt bidrag?',
    category: 'legacy'
  }
];

export const QUICK_WINS_QUESTIONS = [
  {
    key: 'morning_routine',
    text: 'Har du en morgonrutin som ger dig energi?',
    type: 'boolean',
    category: 'habits'
  },
  {
    key: 'gratitude_practice',
    text: 'Reflekterar du regelbundet över vad du är tacksam för?',
    type: 'boolean',
    category: 'mindset'
  },
  {
    key: 'learning_habit',
    text: 'Lär du dig något nytt varje dag?',
    type: 'boolean',
    category: 'growth'
  },
  {
    key: 'social_connection',
    text: 'Träffar du vänner eller familj regelbundet?',
    type: 'boolean',
    category: 'relationships'
  },
  {
    key: 'creative_outlet',
    text: 'Har du ett kreativt uttryck som ger dig glädje?',
    type: 'boolean',
    category: 'creativity'
  },
  {
    key: 'nature_connection',
    text: 'Spenderar du tid i naturen regelbundet?',
    type: 'boolean',
    category: 'wellbeing'
  },
  {
    key: 'progress_tracking',
    text: 'Följer du upp dina mål och framsteg?',
    type: 'boolean',
    category: 'productivity'
  }
];