import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile { id: string; email?: string | null; first_name?: string | null; last_name?: string | null; created_at?: string }

export const useClient360Data = (userId: string) => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<any | null>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [actionables, setActionables] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, rolesRes, aRes, planRes, actRes, recRes, tRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.rpc('get_user_roles_and_relationships', { target_user_id: userId }),
        supabase.from('assessment_rounds').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
        supabase.from('ai_coaching_plans').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('calendar_actionables').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
        supabase.from('ai_coaching_recommendations').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
        supabase.from('path_entries').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(100)
      ]);

      if (pRes.error) throw pRes.error;
      setProfile(pRes.data);
      if (rolesRes.error) console.warn('roles rpc error', rolesRes.error.message); else setRoles(rolesRes.data?.[0] ?? null);
      if (!aRes.error) setAssessments(aRes.data || []);
      if (!planRes.error) setPlans(planRes.data || []);
      if (!actRes.error) setActionables(actRes.data || []);
      if (!recRes.error) setRecommendations(recRes.data || []);
      if (!tRes.error) setTimeline(tRes.data || []);
    } catch (e: any) {
      console.error('Client360 load error', e);
      toast({ title: 'Kunde inte ladda all data', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, userId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    // Realtime updates for this user
    const channel = supabase
      .channel('client360-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assessment_rounds', filter: `user_id=eq.${userId}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_coaching_plans', filter: `user_id=eq.${userId}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_actionables', filter: `user_id=eq.${userId}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_coaching_recommendations', filter: `user_id=eq.${userId}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'path_entries', filter: `user_id=eq.${userId}` }, loadAll)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, loadAll]);

  return { profile, roles, assessments, plans, actionables, recommendations, timeline, loading, refresh: loadAll };
};
