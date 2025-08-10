/**
 * 🎯 PROGRESSIVE DISCLOSURE UTILITIES
 * Intelligenta funktioner för att visa rätt information vid rätt tidpunkt
 */

export interface UserExperienceLevel {
  level: 'beginner' | 'intermediate' | 'advanced';
  completedPillars: number;
  totalSessions: number;
  daysSinceFirstAssessment: number;
  engagementScore: number;
}

export interface FeatureVisibility {
  showAdvancedAnalytics: boolean;
  showDetailedProgress: boolean;
  showCoachingInsights: boolean;
  showSystemMetrics: boolean;
  showBulkActions: boolean;
  showCustomization: boolean;
}

/**
 * Beräknar användarens upplevelse-nivå baserat på aktivitet
 */
export function calculateUserExperienceLevel(
  completedPillars: number,
  totalSessions: number,
  firstAssessmentDate: Date | null,
  recentActivity: number
): UserExperienceLevel {
  const daysSinceFirst = firstAssessmentDate 
    ? Math.floor((new Date().getTime() - firstAssessmentDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Engagement score baserat på aktivitet över tid
  const baseEngagement = (completedPillars * 15) + (totalSessions * 5);
  const timeBonus = Math.min(daysSinceFirst * 0.5, 25);
  const activityBonus = Math.min(recentActivity * 10, 20);
  const engagementScore = Math.min(baseEngagement + timeBonus + activityBonus, 100);

  // Bestäm level baserat på flera faktorer
  let level: 'beginner' | 'intermediate' | 'advanced';
  
  if (completedPillars === 0 || daysSinceFirst < 3) {
    level = 'beginner';
  } else if (completedPillars >= 4 && daysSinceFirst >= 14 && totalSessions >= 5) {
    level = 'advanced';
  } else {
    level = 'intermediate';
  }

  return {
    level,
    completedPillars,
    totalSessions,
    daysSinceFirstAssessment: daysSinceFirst,
    engagementScore
  };
}

/**
 * Bestämmer vilka funktioner som ska visas baserat på användarens nivå
 */
export function getFeatureVisibility(userLevel: UserExperienceLevel): FeatureVisibility {
  const { level, completedPillars, engagementScore } = userLevel;

  return {
    showAdvancedAnalytics: level === 'advanced' || completedPillars >= 3,
    showDetailedProgress: level !== 'beginner',
    showCoachingInsights: level === 'advanced' && engagementScore > 60,
    showSystemMetrics: level === 'advanced',
    showBulkActions: level === 'advanced',
    showCustomization: level !== 'beginner' && engagementScore > 40
  };
}

/**
 * Genererar kontextuella hjälpmeddelanden baserat på användarens tillstånd
 */
export function getContextualGuidance(userLevel: UserExperienceLevel, currentRoute: string): {
  message: string;
  action?: { label: string; href: string };
  priority: 'low' | 'medium' | 'high';
} | null {
  const { level, completedPillars, daysSinceFirstAssessment } = userLevel;

  // Nya användare
  if (level === 'beginner' && completedPillars === 0) {
    return {
      message: 'Välkommen! Låt oss börja med din första självskattning för att förstå dina mål.',
      action: { label: 'Starta självskattning', href: '/guided-assessment' },
      priority: 'high'
    };
  }

  // Användare som börjat men inte varit aktiva
  if (level === 'intermediate' && daysSinceFirstAssessment > 7 && completedPillars < 3) {
    return {
      message: 'Bra att du är tillbaka! Fortsätt din utvecklingsresa med nästa assessment.',
      action: { label: 'Fortsätt assessment', href: '/guided-assessment' },
      priority: 'medium'
    };
  }

  // Avancerade användare som kan utforska mer
  if (level === 'advanced' && currentRoute === '/client-dashboard') {
    return {
      message: 'Du gör fantastiska framsteg! Utforska dina djupare analyser och handlingsplaner.',
      action: { label: 'Se analyser', href: '/my-analyses' },
      priority: 'low'
    };
  }

  return null;
}

/**
 * Bestämmer vilka widgets som ska visas i dashboard
 */
export function getRecommendedWidgets(userLevel: UserExperienceLevel): string[] {
  const { level, completedPillars } = userLevel;
  
  const baseWidgets = ['welcome'];
  
  if (level === 'beginner') {
    return [...baseWidgets, 'client-simplified'];
  }
  
  if (level === 'intermediate') {
    return [...baseWidgets, 'pillar-progress', 'tasks'];
  }
  
  // Advanced users get full dashboard
  return [...baseWidgets, 'pillar-progress', 'tasks', 'calendar', 'client-analytics'];
}

/**
 * Kontrollerar om en funktion ska visas baserat på användarens kontext
 */
export function shouldShowFeature(
  feature: keyof FeatureVisibility,
  userLevel: UserExperienceLevel
): boolean {
  const visibility = getFeatureVisibility(userLevel);
  return visibility[feature];
}

/**
 * Genererar anpassade onboarding-steg baserat på användarens framsteg
 */
export function getOnboardingSteps(userLevel: UserExperienceLevel): {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href?: string;
}[] {
  const { completedPillars, totalSessions } = userLevel;
  
  return [
    {
      id: 'first-assessment',
      title: 'Gör din första assessment',
      description: 'Låt Stefan förstå dina mål och utmaningar',
      completed: completedPillars > 0,
      href: completedPillars === 0 ? '/guided-assessment' : undefined
    },
    {
      id: 'review-analysis',
      title: 'Granska din analys',
      description: 'Se Stefans insikter om dina utvecklingsområden',
      completed: completedPillars > 0 && totalSessions > 1,
      href: completedPillars > 0 ? '/my-analyses' : undefined
    },
    {
      id: 'start-program',
      title: 'Påbörja ditt program',
      description: 'Börja arbeta med dina personliga handlingsplaner',
      completed: totalSessions > 2,
      href: completedPillars > 0 ? '/my-program' : undefined
    },
    {
      id: 'expand-assessment',
      title: 'Utforska fler områden',
      description: 'Gör assessments för andra utvecklingsområden',
      completed: completedPillars >= 3,
      href: completedPillars < 6 ? '/guided-assessment' : undefined
    },
    {
      id: 'mastery',
      title: 'Mästerskap',
      description: 'Du behärskar systemet och kan hjälpa andra',
      completed: completedPillars >= 5 && totalSessions > 10
    }
  ];
}