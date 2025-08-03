import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';

/**
 * Progress Calculation Service
 * Korrekt viktning baserat på proportioner av uppgifter, assessments och mål
 */

interface ProgressComponent {
  completed: number;
  total: number;
  weight: number;
  category: 'assessments' | 'tasks' | 'pillars' | 'milestones';
}

interface DevelopmentProgress {
  overall_percentage: number;
  components: ProgressComponent[];
  last_updated: string;
  phase: 'welcome' | 'development_active' | 'development_advanced' | 'mastery';
}

export const calculateUserDevelopmentProgress = async (userId: string): Promise<DevelopmentProgress> => {
  try {
    // 1. Hämta slutförda assessments (30% vikt)
    const { data: assessments } = await supabase
      .from('assessment_states')
      .select('assessment_type, completed_at')
      .eq('user_id', userId)
      .eq('is_draft', false);

    const completedAssessments = assessments?.length || 0;
    const totalExpectedAssessments = 7; // welcome + 6 pillars

    // 2. Hämta slutförda uppgifter (40% vikt)
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status')
      .eq('user_id', userId);

    const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
    const totalTasks = tasks?.length || 1;

    // 3. Hämta pillar aktivering och framsteg (25% vikt)
    const { data: pillarActivations } = await supabase
      .from('client_pillar_activations')
      .select('pillar_key, is_active')
      .eq('user_id', userId)
      .eq('is_active', true);

    const activePillars = pillarActivations?.length || 0;
    const totalPillars = 6;

    // 4. Hämta milestone framsteg (5% vikt) 
    const { data: milestones } = await supabase
      .from('coaching_milestones') 
      .select('status')
      .in('plan_id', (await supabase.from('coaching_plans').select('id').eq('user_id', userId)).data?.map(p => p.id) || []);

    const completedMilestones = milestones?.filter(m => m.status === 'completed').length || 0;
    const totalMilestones = Math.max(milestones?.length || 1, 1);

    // Skapa progress komponenter
    const components: ProgressComponent[] = [
      {
        completed: completedAssessments,
        total: totalExpectedAssessments,
        weight: 0.30,
        category: 'assessments'
      },
      {
        completed: completedTasks,
        total: totalTasks,
        weight: 0.40,
        category: 'tasks'
      },
      {
        completed: activePillars,
        total: totalPillars,
        weight: 0.25,
        category: 'pillars'
      },
      {
        completed: completedMilestones,
        total: totalMilestones,
        weight: 0.05,
        category: 'milestones'
      }
    ];

    // Beräkna viktad total progress
    const weightedProgress = components.reduce((total, component) => {
      const componentProgress = component.total > 0 ? (component.completed / component.total) : 0;
      return total + (componentProgress * component.weight * 100);
    }, 0);

    // Bestäm utvecklingsfas
    let phase: DevelopmentProgress['phase'] = 'welcome';
    if (weightedProgress >= 75) phase = 'mastery';
    else if (weightedProgress >= 50) phase = 'development_advanced';
    else if (weightedProgress >= 15) phase = 'development_active';

    // Uppdatera user_journey_tracking med korrekt progress
    await supabase
      .from('user_journey_tracking')
      .upsert({
        user_id: userId,
        overall_progress: Math.round(weightedProgress),
        current_phase: phase,
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    return {
      overall_percentage: Math.round(weightedProgress),
      components,
      last_updated: new Date().toISOString(),
      phase
    };

  } catch (error) {
    console.error('Progress calculation error:', error);
    return {
      overall_percentage: 0,
      components: [],
      last_updated: new Date().toISOString(),
      phase: 'welcome'
    };
  }
};

export const getProgressDisplay = (progress: DevelopmentProgress) => {
  const { overall_percentage, components, phase } = progress;
  
  return {
    percentage: overall_percentage,
    phase,
    breakdown: components.map(comp => ({
      category: comp.category,
      progress: comp.total > 0 ? Math.round((comp.completed / comp.total) * 100) : 0,
      completed: comp.completed,
      total: comp.total,
      weight: comp.weight
    })),
    phaseDescription: getPhaseDescription(phase)
  };
};

const getPhaseDescription = (phase: string) => {
  switch (phase) {
    case 'welcome': return 'Välkomstfas - Lär känna systemet';
    case 'development_active': return 'Aktiv utveckling - Bygger nya vanor';
    case 'development_advanced': return 'Avancerad utveckling - Fördjupar kunskap';
    case 'mastery': return 'Mästerskap - Lever sina värderingar';
    default: return 'Okänd fas';
  }
};