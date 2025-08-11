import React, { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCoachClientAccess } from '@/hooks/useCoachClientAccess';
import { Client360View } from './Client360View';

interface Client360ExplorerProps {
  initialUserId?: string;
}

interface SimpleUser {
  id: string;
  email: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

export const Client360Explorer: React.FC<Client360ExplorerProps> = ({ initialUserId }) => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SimpleUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(initialUserId);
  const { assignedClients } = useCoachClientAccess();

  const canSeeAll = hasRole('superadmin') || hasRole('admin');

  useEffect(() => {
    setSelectedUserId(initialUserId);
  }, [initialUserId]);

  const fetchUsers = async () => {
    try {
      if (!search && !canSeeAll) {
        // For coaches without search, show assigned clients quickly
        const mapped = assignedClients.map(c => ({ id: c.id, email: c.email, first_name: c.first_name ?? null, last_name: c.last_name ?? null }));
        setResults(mapped);
        return;
      }
      // Basic profiles search
      let query = supabase.from('profiles').select('id, email, first_name, last_name').limit(25);
      if (search) {
        query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      let users: SimpleUser[] = data || [];
      if (!canSeeAll) {
        const allowedIds = new Set(assignedClients.map(c => c.id));
        users = users.filter(u => allowedIds.has(u.id));
      }
      setResults(users);
    } catch (e: any) {
      console.error('Client360 search error', e);
      toast({ title: 'Fel vid sökning', description: e.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, canSeeAll, assignedClients.length]);

  const headerName = useMemo(() => {
    return 'Sök klienter och öppna deras helhetsvy';
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <Input
              placeholder="Sök på e‑post eller namn"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button onClick={fetchUsers}>Sök</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className="text-left rounded-md border p-3 hover:bg-accent/40 transition"
              >
                <div className="font-medium">{u.first_name || u.last_name ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() : (u.email ?? 'Okänd användare')}</div>
                <div className="text-sm text-muted-foreground">{u.email}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedUserId && (
        <Client360View userId={selectedUserId} />
      )}
    </div>
  );
};

