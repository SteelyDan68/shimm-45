import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useClient360Data } from '@/hooks/useClient360Data';
import { useRoleBasedPillarAccess } from '@/hooks/useRoleBasedPillarAccess';
import { NAVIGATION_ROUTES } from '@/config/navigation';
import { useNavigation } from '@/hooks/useNavigation';
import { CoachActivationDialog } from './CoachActivationDialog';

interface Props { userId: string; }

export const Client360View: React.FC<Props> = ({ userId }) => {
  const { navigateTo } = useNavigation();
  const { profile, roles, assessments, plans, actionables, recommendations, timeline, loading, refresh } = useClient360Data(userId);
  const [openAssign, setOpenAssign] = useState(false);
  const access = useRoleBasedPillarAccess(userId);

  const fullName = useMemo(() => {
    const f = profile?.first_name || '';
    const l = profile?.last_name || '';
    const combined = `${f} ${l}`.trim();
    return combined || profile?.email || 'Användare';
  }, [profile]);

  const hasCoach = (roles?.client_relationships?.length ?? 0) > 0; // client has coaches if array non-empty

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <CardTitle className="text-xl">{fullName}</CardTitle>
          <div className="text-sm text-muted-foreground">{profile?.email}</div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigateTo(NAVIGATION_ROUTES.INTELLIGENCE_USER(userId))}>Intelligence</Button>
          {access.canManageAllUsers || access.userRole === 'coach' ? (
            <Button onClick={() => setOpenAssign(true)}>{hasCoach ? 'Hantera coachrelation' : 'Aktivera coach'}</Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="timeline">
          <TabsList className="mb-3 overflow-x-auto">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="assessments">Bedömningar</TabsTrigger>
            <TabsTrigger value="program">Program</TabsTrigger>
            <TabsTrigger value="actions">Åtgärder</TabsTrigger>
            <TabsTrigger value="insights">Insikter</TabsTrigger>
          </TabsList>
          <TabsContent value="timeline">
            <div className="space-y-2">
              {timeline.map((e) => (
                <div key={e.id} className="border rounded-md p-3">
                  <div className="text-xs text-muted-foreground">{new Date(e.timestamp || e.created_at).toLocaleString()} • {e.type}</div>
                  <div className="font-medium">{e.title || e.details?.slice(0, 120) || 'Händelse'}</div>
                </div>
              ))}
              {!timeline.length && <div className="text-sm text-muted-foreground">Ingen aktivitet ännu.</div>}
            </div>
          </TabsContent>
          <TabsContent value="assessments">
            <div className="space-y-2">
              {assessments.map(a => (
                <div key={a.id} className="border rounded-md p-3">
                  <div className="flex justify-between text-sm">
                    <div className="font-medium">{a.pillar_type}</div>
                    <div className="text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</div>
                  </div>
                  {a.ai_analysis && <div className="text-sm mt-1 line-clamp-3">{a.ai_analysis}</div>}
                </div>
              ))}
              {!assessments.length && <div className="text-sm text-muted-foreground">Inga bedömningar funna.</div>}
            </div>
          </TabsContent>
          <TabsContent value="program">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plans.map(p => (
                <div key={p.id} className="border rounded-md p-3">
                  <div className="font-medium">Program • {p.status}</div>
                  <div className="text-sm text-muted-foreground">Start: {new Date(p.created_at).toLocaleDateString()} • Längd: {p.duration} dagar</div>
                </div>
              ))}
              {!plans.length && <div className="text-sm text-muted-foreground">Inga aktiva program.</div>}
              <div className="md:col-span-2">
                <div className="font-medium mb-2">Planerade åtgärder</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {actionables.map(a => (
                    <div key={a.id} className="border rounded-md p-3">
                      <div className="font-medium">{a.title}</div>
                      <div className="text-sm text-muted-foreground">{a.pillar_key} • {a.completion_percentage || 0}%</div>
                    </div>
                  ))}
                  {!actionables.length && <div className="text-sm text-muted-foreground">Inga åtgärder planerade.</div>}
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="actions">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {recommendations.map(r => (
                <div key={r.id} className="border rounded-md p-3">
                  <div className="text-xs text-muted-foreground">{r.category} • {r.priority}</div>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-sm line-clamp-3">{r.description}</div>
                </div>
              ))}
              {!recommendations.length && <div className="text-sm text-muted-foreground">Inga rekommendationer.</div>}
            </div>
          </TabsContent>
          <TabsContent value="insights">
            <div className="text-sm text-muted-foreground">Fler insikter och KPI:er kan adderas här framåt.</div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CoachActivationDialog open={openAssign} onOpenChange={setOpenAssign} clientId={userId} />
    </Card>
  );
};
