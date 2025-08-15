import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { HelpTooltip } from '@/components/HelpTooltip';
import { Pause, Play, Target } from 'lucide-react';

interface ProgramOverviewCardProps {
  onSelectPlan?: (planId: string | null) => void;
}

interface PlanItem {
  id: string;
  status: 'active' | 'paused' | 'completed' | 'superseded';
  duration: number;
  generated_at?: string;
}

interface ActionableItem {
  id: string;
  plan_id: string | null;
  completion_status: 'pending' | 'in_progress' | 'completed' | 'deferred';
}

export const ProgramOverviewCard: React.FC<ProgramOverviewCardProps> = ({ onSelectPlan }) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [actionables, setActionables] = useState<ActionableItem[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const { data: planData } = await supabase
          .from('ai_coaching_plans')
          .select('id,status,duration,generated_at')
          .eq('user_id', user.id)
          .in('status', ['active', 'paused']);

        const { data: actionableData } = await supabase
          .from('calendar_actionables')
          .select('id,plan_id,completion_status')
          .eq('user_id', user.id);

        setPlans(planData as any || []);
        setActionables(actionableData as any || []);
      } catch (e) {
        console.error('ProgramOverview load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const statsByPlan = useMemo(() => {
    const map = new Map<string, { total: number; completed: number; inProgress: number }>();
    actionables.forEach(a => {
      if (!a.plan_id) return;
      const s = map.get(a.plan_id) || { total: 0, completed: 0, inProgress: 0 };
      s.total += 1;
      if (a.completion_status === 'completed') s.completed += 1;
      if (a.completion_status === 'in_progress' || a.completion_status === 'pending') s.inProgress += 1;
      map.set(a.plan_id, s);
    });
    return map;
  }, [actionables]);

  const handleSelect = (planId: string | null) => {
    setSelectedPlanId(planId);
    onSelectPlan?.(planId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" aria-hidden="true" />
          <span>Ditt program</span>
          <HelpTooltip content="Här ser du en snabb översikt över dina aktiva program och kan filtrera uppgifter per program. Pepp: Du är på rätt väg – välj ett program för laserfokus!" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1,2].map(i => (
              <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Dina AI-genererade uppgifter kommer att visas här när du genomför en pillar-bedömning.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/pillar-journey'}
            >
              Gör din första bedömning
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button
              variant={selectedPlanId === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSelect(null)}
            >
              Alla program
            </Button>
            {plans.map((p) => {
              const s = statsByPlan.get(p.id) || { total: 0, completed: 0, inProgress: 0 };
              const isSelected = selectedPlanId === p.id;
              return (
                <Button
                  key={p.id}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSelect(p.id)}
                  className="flex items-center gap-2"
                >
                  {p.status === 'paused' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  <span>{p.status === 'paused' ? 'Pausat' : 'Aktivt'}</span>
                  <Badge variant="secondary" className="ml-1">{s.inProgress}/{s.total}</Badge>
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
