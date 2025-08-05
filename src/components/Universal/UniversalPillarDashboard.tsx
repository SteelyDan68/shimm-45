/**
 * 🎯 UNIVERSAL PILLAR DASHBOARD
 * 
 * Komplett pillar dashboard som fungerar för alla roller
 * Anpassar sig automatiskt baserat på användarens behörigheter
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Users, TrendingUp, Settings, User, RefreshCw } from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useRoleBasedPillarAccess } from '@/hooks/useRoleBasedPillarAccess';
import { UniversalPillarProgressTracker } from './UniversalPillarProgressTracker';

interface UniversalPillarDashboardProps {
  initialUserId?: string;
  allowUserSelection?: boolean;
  className?: string;
}

export const UniversalPillarDashboard: React.FC<UniversalPillarDashboardProps> = ({
  initialUserId,
  allowUserSelection = false,
  className = ''
}) => {
  const { user, hasRole, isSuperAdmin } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(initialUserId);
  const [activeTab, setActiveTab] = useState('overview');

  const {
    pillarProgress,
    stats,
    loading,
    error,
    canView,
    canEdit,
    userRole,
    accessLevel,
    contextInfo,
    isViewingOwnData,
    canManageAllUsers,
    canViewOtherUsers,
    refreshData
  } = useRoleBasedPillarAccess(selectedUserId);

  // Determine effective user ID (fallback to current user)
  const effectiveUserId = selectedUserId || user?.id;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Six Pillars Dashboard
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {contextInfo}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={accessLevel === 'admin' ? 'default' : 'secondary'}>
                {userRole} behörighet
              </Badge>
              <Button variant="outline" size="sm" onClick={refreshData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Uppdatera
              </Button>
            </div>
          </div>

          {/* User Selection (for admins and coaches) */}
          {allowUserSelection && canViewOtherUsers && (
            <div className="mt-4 flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">Visa data för:</span>
              <Select value={selectedUserId || 'self'} onValueChange={(value) => 
                setSelectedUserId(value === 'self' ? undefined : value)
              }>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Välj användare" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Min egen data</SelectItem>
                  {/* TODO: Add user list from API */}
                  <SelectItem value="example-user">Exempel användare</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Översikt
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Detaljer
          </TabsTrigger>
          {canEdit && (
            <TabsTrigger value="management" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Hantering
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Progress Tracker */}
            <UniversalPillarProgressTracker 
              targetUserId={effectiveUserId}
              showActions={canEdit}
              className="md:col-span-2"
            />
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detaljerad Pillar Analys</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {pillarProgress.map((pillar) => (
                  <Card key={pillar.pillar_key} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold capitalize">
                        {pillar.pillar_key.replace('_', ' ')}
                      </h3>
                      <Badge variant={pillar.is_active ? 'default' : 'secondary'}>
                        {pillar.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Framsteg:</span>
                          <div className="font-medium">{pillar.progress_percentage}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Genomförda:</span>
                          <div className="font-medium">{pillar.completion_count}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Nivå:</span>
                          <div className="font-medium">{pillar.current_level}</div>
                        </div>
                      </div>
                      
                      {pillar.last_activity && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Senaste aktivitet:</span>
                          <div className="font-medium">
                            {new Date(pillar.last_activity).toLocaleDateString('sv-SE', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      )}

                      {pillar.next_milestone && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Nästa mål:</span>
                          <div className="font-medium">{pillar.next_milestone}</div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Management Tab (Only for users with edit permissions) */}
        {canEdit && (
          <TabsContent value="management" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pillar Hantering</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Hantera pillar-aktiveringar och inställningar
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Management actions will be added here */}
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Hanteringsverktyg</h3>
                    <p>Avancerade hanteringsverktyg kommer snart.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};