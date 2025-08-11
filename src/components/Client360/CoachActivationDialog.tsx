import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useUserManagement } from '@/hooks/useUserManagement';

interface CoachActivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

interface CoachOption { id: string; email: string | null; name: string; }

export const CoachActivationDialog: React.FC<CoachActivationDialogProps> = ({ open, onOpenChange, clientId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createCoachClientRelationship } = useUserManagement();
  const [coaches, setCoaches] = useState<CoachOption[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return coaches;
    const s = search.toLowerCase();
    return coaches.filter(c => (c.name || '').toLowerCase().includes(s) || (c.email || '').toLowerCase().includes(s));
  }, [coaches, search]);

  const loadCoaches = async () => {
    try {
      // 1) Get coach user_ids
      const { data: roleRows, error: roleErr } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'coach');
      if (roleErr) throw roleErr;
      const ids = (roleRows || []).map(r => r.user_id);
      if (!ids.length) { setCoaches([]); return; }
      // 2) Fetch profiles
      const { data: profs, error: profErr } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', ids);
      if (profErr) throw profErr;
      const options: CoachOption[] = (profs || []).map(p => ({ id: p.id, email: p.email, name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || (p.email ?? 'Coach') }));
      setCoaches(options);
    } catch (e: any) {
      console.error('Load coaches error', e);
    }
  };

  useEffect(() => { if (open) loadCoaches(); }, [open]);

  const handleActivate = async () => {
    if (!selectedCoach) {
      toast({ title: 'Välj coach', description: 'Välj en coach att koppla till klienten', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      // 1) Create relationship
      const ok = await createCoachClientRelationship(selectedCoach, clientId);
      if (!ok) throw new Error('Kunde inte skapa relation');

      // 2) Enable messaging permission
      const { error: permErr } = await supabase.from('coach_messaging_permissions').upsert({
        coach_id: selectedCoach,
        client_id: clientId,
        is_enabled: true,
        enabled_by: user?.id ?? null,
        enabled_at: new Date().toISOString(),
        metadata: { source: 'Client360', reason: 'manual_activation' }
      });
      if (permErr) console.warn('Messaging permission error (ignored):', permErr.message);

      // 3) Optional: path entry for audit (best-effort)
      try {
        await supabase.from('path_entries').insert({
          user_id: clientId,
          type: 'system_event',
          title: 'Coachrelation aktiverad',
          details: `Coach ${selectedCoach} kopplad via Client360`,
          created_by: user?.id ?? null,
          ai_generated: false,
          metadata: { coach_id: selectedCoach, source: 'Client360' }
        });
      } catch (_) {}

      toast({ title: 'Coach aktiverad', description: 'Relationen är skapad och meddelanden aktiverade' });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Fel', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aktivera coachrelation</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Sök coach" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filtered.map(c => (
              <label key={c.id} className="flex items-center gap-2 p-2 rounded-md border hover:bg-accent/40">
                <input type="radio" name="coach" value={c.id} checked={selectedCoach === c.id} onChange={() => setSelectedCoach(c.id)} />
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.email}</div>
                </div>
              </label>
            ))}
            {!filtered.length && <div className="text-sm text-muted-foreground">Inga coacher hittades.</div>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleActivate} disabled={loading}>{loading ? 'Aktiverar…' : 'Aktivera'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
