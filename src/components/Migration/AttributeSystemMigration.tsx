import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { MigrationStatusCard } from './MigrationStatusCard';

interface MigrationStats {
  total_users: number;
  users_with_legacy_roles: number;
  users_with_attributes: number;
  legacy_relationships: number;
  migrated_relationships: number;
}

export const AttributeSystemMigration = () => {
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [migrationLog, setMigrationLog] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchMigrationStats = async () => {
    try {
      // Hämta statistik om vad som behöver migreras
      const { data: totalUsers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      const { data: legacyRoles } = await supabase
        .from('user_roles')
        .select('user_id', { count: 'exact', head: true });

      const { data: attributeUsers } = await supabase
        .from('user_attributes')
        .select('user_id')
        .like('attribute_key', 'role_%')
        .eq('is_active', true);

      const { data: legacyRelationships } = await supabase
        .from('coach_client_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      const { data: attributeRelationships } = await supabase
        .from('user_attributes')
        .select('id', { count: 'exact', head: true })
        .eq('attribute_key', 'relationship')
        .eq('is_active', true);

      setStats({
        total_users: totalUsers?.length || 0,
        users_with_legacy_roles: legacyRoles?.length || 0,
        users_with_attributes: new Set(attributeUsers?.map(u => u.user_id)).size,
        legacy_relationships: legacyRelationships?.length || 0,
        migrated_relationships: attributeRelationships?.length || 0
      });

    } catch (error) {
      console.error('Error fetching migration stats:', error);
      toast({
        title: "Fel vid hämtning av migreringsstatistik",
        description: "Kunde inte hämta data för migrering",
        variant: "destructive"
      });
    }
  };

  const migrateUserRoles = async () => {
    setMigrationLog(prev => [...prev, "🔄 Startar migration av användarroller..."]);
    
    try {
      // Hämta alla användare med legacy roller
      const { data: legacyRoles, error } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (error) throw error;

      let migrated = 0;
      const total = legacyRoles?.length || 0;

      for (const userRole of legacyRoles || []) {
        try {
          // Kontrollera om attribut redan finns
          const { data: existing } = await supabase
            .from('user_attributes')
            .select('id')
            .eq('user_id', userRole.user_id)
            .eq('attribute_key', `role_${userRole.role}`)
            .eq('is_active', true)
            .maybeSingle();

          if (!existing) {
            // Skapa nytt attribut
            const { error: insertError } = await supabase.rpc('set_user_attribute', {
              _user_id: userRole.user_id,
              _attribute_key: `role_${userRole.role}`,
              _attribute_value: JSON.stringify(userRole.role),
              _attribute_type: 'role'
            });

            if (insertError) {
              setMigrationLog(prev => [...prev, `❌ Fel vid migration av roll ${userRole.role} för användare ${userRole.user_id}`]);
            } else {
              migrated++;
              setMigrationLog(prev => [...prev, `✅ Migrerade roll ${userRole.role} för användare ${userRole.user_id}`]);
            }
          } else {
            setMigrationLog(prev => [...prev, `⏭️ Roll ${userRole.role} finns redan som attribut för användare ${userRole.user_id}`]);
          }

          setProgress((migrated / total) * 50); // 50% för roller
        } catch (error) {
          setMigrationLog(prev => [...prev, `❌ Fel vid migration av användare ${userRole.user_id}: ${error}`]);
        }
      }

      setMigrationLog(prev => [...prev, `🎉 Migration av roller klar: ${migrated}/${total} migrerade`]);
      return migrated;

    } catch (error) {
      setMigrationLog(prev => [...prev, `❌ Kritiskt fel vid rollmigration: ${error}`]);
      throw error;
    }
  };

  const migrateRelationships = async () => {
    setMigrationLog(prev => [...prev, "🔄 Startar migration av relationer..."]);
    
    try {
      // Hämta alla aktiva coach-client relationer
      const { data: relationships, error } = await supabase
        .from('coach_client_assignments')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      let migrated = 0;
      const total = relationships?.length || 0;

      for (const rel of relationships || []) {
        try {
          // Skapa attribut för coach om relationen (coach-perspektiv)
          await supabase.rpc('set_user_attribute', {
            _user_id: rel.coach_id,
            _attribute_key: `relationship_client_${rel.client_id}`,
            _attribute_value: JSON.stringify({
              type: 'coach_to_client',
              target_user_id: rel.client_id,
              assigned_at: rel.assigned_at,
              assigned_by: rel.assigned_by
            }),
            _attribute_type: 'relationship'
          });

          // Skapa attribut för client om relationen (client-perspektiv)
          await supabase.rpc('set_user_attribute', {
            _user_id: rel.client_id,
            _attribute_key: `relationship_coach_${rel.coach_id}`,
            _attribute_value: JSON.stringify({
              type: 'client_to_coach',
              target_user_id: rel.coach_id,
              assigned_at: rel.assigned_at,
              assigned_by: rel.assigned_by
            }),
            _attribute_type: 'relationship'
          });

          migrated++;
          setMigrationLog(prev => [...prev, `✅ Migrerade relation: Coach ${rel.coach_id} <-> Client ${rel.client_id}`]);
          setProgress(50 + (migrated / total) * 50); // 50-100% för relationer

        } catch (error) {
          setMigrationLog(prev => [...prev, `❌ Fel vid migration av relation ${rel.id}: ${error}`]);
        }
      }

      setMigrationLog(prev => [...prev, `🎉 Migration av relationer klar: ${migrated}/${total} migrerade`]);
      return migrated;

    } catch (error) {
      setMigrationLog(prev => [...prev, `❌ Kritiskt fel vid relationsmigration: ${error}`]);
      throw error;
    }
  };

  const runFullMigration = async () => {
    setMigrating(true);
    setProgress(0);
    setMigrationLog(["🚀 Startar fullständig migration till attributsystemet..."]);

    try {
      // Steg 1: Migrera roller
      await migrateUserRoles();
      
      // Steg 2: Migrera relationer
      await migrateRelationships();
      
      setProgress(100);
      setMigrationLog(prev => [...prev, "🎊 MIGRATION KOMPLETT! Alla data har flyttats till attributsystemet."]);
      
      toast({
        title: "Migration klar",
        description: "Alla data har migrerats till det nya attributsystemet",
        variant: "default"
      });

      // Uppdatera statistik
      await fetchMigrationStats();

    } catch (error) {
      setMigrationLog(prev => [...prev, `💥 MIGRATION MISSLYCKADES: ${error}`]);
      toast({
        title: "Migration misslyckades",
        description: "Ett fel uppstod under migrationen",
        variant: "destructive"
      });
    } finally {
      setMigrating(false);
    }
  };

  React.useEffect(() => {
    fetchMigrationStats();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Migration till Attributsystemet
          </CardTitle>
          <CardDescription>
            Migrera från gamla tabeller (user_roles, coach_client_assignments) till det nya flexibla attributsystemet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <MigrationStatusCard
                title="Användarroller"
                description="Migration från user_roles till user_attributes"
                legacyCount={stats.users_with_legacy_roles}
                migratedCount={stats.users_with_attributes}
                status={stats.users_with_legacy_roles === 0 ? 'completed' : 'pending'}
              />
              <MigrationStatusCard
                title="Coach-Client Relationer"
                description="Migration från coach_client_assignments till attribut"
                legacyCount={stats.legacy_relationships}
                migratedCount={stats.migrated_relationships}
                status={stats.legacy_relationships === 0 ? 'completed' : 'pending'}
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={fetchMigrationStats}
                variant="outline"
                disabled={migrating}
              >
                Uppdatera statistik
              </Button>
              <Button 
                onClick={runFullMigration}
                disabled={migrating || !stats}
                className="bg-primary"
              >
                {migrating ? "Migrerar..." : "Starta fullständig migration"}
              </Button>
            </div>

            {migrating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Migration pågår...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {migrationLog.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Migreringslogg</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-60 overflow-y-auto font-mono text-xs">
                    {migrationLog.map((log, index) => (
                      <div key={index} className={`
                        ${log.includes('❌') ? 'text-red-600' : ''}
                        ${log.includes('✅') ? 'text-green-600' : ''}
                        ${log.includes('🎉') || log.includes('🎊') ? 'text-blue-600 font-bold' : ''}
                        ${log.includes('⏭️') ? 'text-yellow-600' : ''}
                      `}>
                        {log}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};