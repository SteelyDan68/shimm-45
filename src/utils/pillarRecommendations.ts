/**
 * 🎯 PILLAR RECOMMENDATION ENGINE
 * Intelligent pillar recommendations based on client intentions
 */

import type { OnboardingData } from '@/types/onboarding';

export interface PillarRecommendation {
  pillar: 'self-care' | 'skills' | 'talent' | 'brand' | 'economy';
  priority: 'high' | 'medium' | 'low';
  reason: string;
  specificFocus: string[];
}

export interface RecommendationResult {
  recommendations: PillarRecommendation[];
  primaryFocus: string[];
  rationale: string;
  estimatedTimeframe: string;
}

const PILLAR_MAPPINGS = {
  'health_lifestyle': {
    primary: ['self-care'],
    secondary: ['skills'],
    focus: ['nutrition', 'exercise', 'sleep', 'stress management', 'mental health']
  },
  'career_skills': {
    primary: ['skills'],
    secondary: ['brand', 'economy'],
    focus: ['professional development', 'technical skills', 'leadership', 'communication']
  },
  'creative_talents': {
    primary: ['talent'],
    secondary: ['brand', 'skills'],
    focus: ['artistic expression', 'creative skills', 'portfolio development', 'creative process']
  },
  'personal_brand': {
    primary: ['brand'],
    secondary: ['skills', 'talent'],
    focus: ['online presence', 'networking', 'content creation', 'visibility', 'reputation']
  },
  'business_economy': {
    primary: ['economy'],
    secondary: ['skills', 'brand'],
    focus: ['financial planning', 'business development', 'revenue streams', 'investments']
  },
  'relationships': {
    primary: ['self-care'],
    secondary: ['skills', 'brand'],
    focus: ['communication', 'emotional intelligence', 'networking', 'social skills']
  },
  'life_balance': {
    primary: ['self-care'],
    secondary: ['skills'],
    focus: ['time management', 'work-life balance', 'stress reduction', 'priorities']
  },
  'performance': {
    primary: ['skills', 'self-care'],
    secondary: ['talent'],
    focus: ['productivity', 'efficiency', 'goal achievement', 'optimization']
  }
};

const ROLE_MODIFIERS = {
  'Influencer': { emphasize: ['brand', 'talent'], focus: ['social media', 'audience building'] },
  'Content Creator': { emphasize: ['brand', 'talent'], focus: ['content strategy', 'creativity'] },
  'Youtuber': { emphasize: ['brand', 'talent'], focus: ['video production', 'audience engagement'] },
  'Podcaster': { emphasize: ['brand', 'skills'], focus: ['audio production', 'interviewing'] },
  'Blogger': { emphasize: ['brand', 'skills'], focus: ['writing', 'SEO', 'content planning'] },
  'Musiker': { emphasize: ['talent', 'brand'], focus: ['musical performance', 'music marketing'] },
  'Skådespelare': { emphasize: ['talent', 'brand'], focus: ['acting skills', 'industry networking'] },
  'Entreprenör': { emphasize: ['economy', 'skills'], focus: ['business strategy', 'leadership'] },
  'Coach/Rådgivare': { emphasize: ['skills', 'brand'], focus: ['coaching techniques', 'client acquisition'] },
  'Expert/Specialist': { emphasize: ['skills', 'brand'], focus: ['expertise development', 'thought leadership'] },
  'Författare': { emphasize: ['talent', 'brand'], focus: ['writing craft', 'publishing'] },
  'Konstnär': { emphasize: ['talent', 'brand'], focus: ['artistic development', 'art marketing'] }
};

export function generatePillarRecommendations(data: OnboardingData): RecommendationResult {
  const intention = data.intention;
  const role = data.publicRole.primaryRole;
  
  if (!intention?.primaryIntention) {
    // Fallback: recommend all pillars with medium priority
    return {
      recommendations: [
        { pillar: 'self-care', priority: 'medium', reason: 'Grundläggande för all utveckling', specificFocus: ['grundläggande välmående'] },
        { pillar: 'skills', priority: 'medium', reason: 'Viktigt för personlig tillväxt', specificFocus: ['allmän kompetensutveckling'] },
        { pillar: 'talent', priority: 'medium', reason: 'Utveckla dina naturliga förmågor', specificFocus: ['talangidentifiering'] },
        { pillar: 'brand', priority: 'medium', reason: 'Bygg din personliga identitet', specificFocus: ['grundläggande varumärkesbygge'] },
        { pillar: 'economy', priority: 'medium', reason: 'Skapa ekonomisk stabilitet', specificFocus: ['grundläggande ekonomi'] }
      ],
      primaryFocus: ['Allmän utveckling'],
      rationale: 'Utan specifik intention rekommenderar vi en bred approach för att identifiera dina utvecklingsområden.',
      estimatedTimeframe: '6-12 månader'
    };
  }

  const mapping = PILLAR_MAPPINGS[intention.primaryIntention as keyof typeof PILLAR_MAPPINGS];
  const roleModifier = ROLE_MODIFIERS[role as keyof typeof ROLE_MODIFIERS];
  
  const recommendations: PillarRecommendation[] = [];
  const allPillars: Array<'self-care' | 'skills' | 'talent' | 'brand' | 'economy'> = 
    ['self-care', 'skills', 'talent', 'brand', 'economy'];

  // Primary pillars (high priority)
  mapping.primary.forEach(pillar => {
    const pillarKey = pillar as 'self-care' | 'skills' | 'talent' | 'brand' | 'economy';
    recommendations.push({
      pillar: pillarKey,
      priority: 'high',
      reason: `Centralt för "${intention.primaryIntention}" utveckling`,
      specificFocus: mapping.focus.slice(0, 3)
    });
  });

  // Secondary pillars (medium priority)
  mapping.secondary.forEach(pillar => {
    const pillarKey = pillar as 'self-care' | 'skills' | 'talent' | 'brand' | 'economy';
    if (!recommendations.find(r => r.pillar === pillarKey)) {
      recommendations.push({
        pillar: pillarKey,
        priority: 'medium',
        reason: `Stödjer din "${intention.primaryIntention}" utveckling`,
        specificFocus: mapping.focus.slice(2, 4)
      });
    }
  });

  // Role-specific emphasis
  if (roleModifier) {
    roleModifier.emphasize.forEach(pillar => {
      const pillarKey = pillar as 'self-care' | 'skills' | 'talent' | 'brand' | 'economy';
      const existing = recommendations.find(r => r.pillar === pillarKey);
      if (existing) {
        if (existing.priority === 'medium') existing.priority = 'high';
        existing.specificFocus = [...existing.specificFocus, ...roleModifier.focus].slice(0, 4);
      } else {
        recommendations.push({
          pillar: pillarKey,
          priority: 'high',
          reason: `Essentiellt för din roll som ${role}`,
          specificFocus: roleModifier.focus.slice(0, 3)
        });
      }
    });
  }

  // Add remaining pillars as low priority if they're not already included
  allPillars.forEach(pillar => {
    if (!recommendations.find(r => r.pillar === pillar)) {
      recommendations.push({
        pillar,
        priority: 'low',
        reason: 'Kompletterande utvecklingsområde',
        specificFocus: ['grundläggande utveckling']
      });
    }
  });

  // Sort by priority and limit to max 3 high priority recommendations
  recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  const highPriorityCount = recommendations.filter(r => r.priority === 'high').length;
  if (highPriorityCount > 3) {
    // Downgrade excess high priority to medium
    recommendations.slice(3).forEach(rec => {
      if (rec.priority === 'high') rec.priority = 'medium';
    });
  }

  return {
    recommendations,
    primaryFocus: mapping.primary,
    rationale: generateRationale(intention, role, mapping),
    estimatedTimeframe: estimateTimeframe(intention, recommendations)
  };
}

function generateRationale(intention: any, role: string, mapping: any): string {
  const area = intention.specificArea || 'detta område';
  const situation = intention.currentSituation ? ` Din nuvarande situation: "${intention.currentSituation}"` : '';
  
  return `Baserat på ditt fokus på "${area}" och din roll som ${role} rekommenderar vi att börja med ${mapping.primary.join(' och ')}-pelarna.${situation} Detta ger dig en stark grund för att nå dina mål.`;
}

function estimateTimeframe(intention: any, recommendations: PillarRecommendation[]): string {
  const highPriority = recommendations.filter(r => r.priority === 'high').length;
  const complexity = intention.currentSituation?.length > 100 ? 'complex' : 'simple';
  
  if (highPriority <= 2 && complexity === 'simple') return '3-6 månader';
  if (highPriority <= 2 && complexity === 'complex') return '6-9 månader';
  if (highPriority <= 3) return '6-12 månader';
  return '9-18 månader';
}

export function getRecommendationSummary(result: RecommendationResult): string {
  const highPriority = result.recommendations.filter(r => r.priority === 'high');
  const pillarNames = highPriority.map(r => {
    const names = {
      'self-care': 'Self Care',
      'skills': 'Skills', 
      'talent': 'Talent',
      'brand': 'Brand',
      'economy': 'Economy'
    };
    return names[r.pillar];
  });
  
  return `Vi rekommenderar att du börjar med ${pillarNames.join(', ')} för optimal utveckling inom ${result.estimatedTimeframe}.`;
}