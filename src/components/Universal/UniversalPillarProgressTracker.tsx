/**
 * 🌍 UNIVERSAL PILLAR PROGRESS TRACKER
 * 
 * Fungerar för ALLA roller och användningsfall
 * Single Source of Truth för pillar progress visning
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, User, Eye, Edit3, BarChart3 } from 'lucide-react';
import { useRoleBasedPillarAccess } from '@/hooks/useRoleBasedPillarAccess';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UniversalPillarProgressTrackerProps {
  targetUserId?: string;
  compact?: boolean;
  showActions?: boolean;
  className?: string;
}

export const UniversalPillarProgressTracker: React.FC<UniversalPillarProgressTrackerProps> = ({
  targetUserId,
  compact = false,
  showActions = true,
  className = ''
}) => {
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
    refreshData,
    activatePillar,
    deactivatePillar
  } = useRoleBasedPillarAccess(targetUserId);

  // Access Control Check
  if (!canView) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-6 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Åtkomst nekad</h3>
          <p className="text-muted-foreground">
            Du har inte behörighet att visa pillar progress för denna användare.
          </p>
          <Badge variant="outline" className="mt-2">
            {contextInfo}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  // Loading State
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Laddar pillar progress...</p>
        </CardContent>
      </Card>
    );
  }

  // Error State
  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            className="mt-4"
          >
            Försök igen
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Compact View
  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Six Pillars</CardTitle>
            <Badge variant="outline" className="text-xs">
              {stats.active_pillars}/6 aktiva
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Genomsnittlig framsteg</span>
              <span>{stats.overall_progress}%</span>
            </div>
            <Progress value={stats.overall_progress} className="h-2" />
            <div className="flex justify-between text-xs">
              <span>Aktiviteter: {stats.recent_activities}</span>
              <span>Nivå: {stats.user_level}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Six Pillars Progress
              {!isViewingOwnData && (
                <Badge variant="outline" className="ml-2">
                  <User className="h-3 w-3 mr-1" />
                  Extern användare
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {contextInfo}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={accessLevel === 'admin' ? 'default' : 'secondary'}>
              {canEdit ? <Edit3 className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              {canEdit ? 'Kan redigera' : 'Endast visa'}
            </Badge>
            {showActions && (
              <Button variant="outline" size="sm" onClick={refreshData}>
                Uppdatera
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.active_pillars}</div>
            <div className="text-xs text-muted-foreground">Aktiva pelare</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.overall_progress}%</div>
            <div className="text-xs text-muted-foreground">Framsteg</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.total_completed}</div>
            <div className="text-xs text-muted-foreground">Genomförda</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.user_level}</div>
            <div className="text-xs text-muted-foreground">Användar-nivå</div>
          </div>
        </div>

        {/* Individual Pillars */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Individuella pelare</h4>
          <div className="grid gap-3">
            {pillarProgress.map((pillar) => (
              <div key={pillar.pillar_key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-3 h-3 rounded-full ${pillar.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">
                        {pillar.pillar_key.replace('_', ' ')}
                      </span>
                      <Badge variant={pillar.is_active ? 'default' : 'secondary'} className="text-xs">
                        {pillar.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex-1">
                        <Progress value={pillar.progress_percentage} className="h-2" />
                      </div>
                      <span className="text-xs text-muted-foreground min-w-[3rem]">
                        {pillar.progress_percentage}%
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {pillar.completion_count} genomförda • Nivå {pillar.current_level}
                      {pillar.last_activity && (
                        <> • Senast: {new Date(pillar.last_activity).toLocaleDateString()}</>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {canEdit && showActions && (
                  <div className="flex items-center gap-1">
                    {pillar.is_active ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deactivatePillar(pillar.pillar_key)}
                        className="text-xs"
                      >
                        Inaktivera
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => activatePillar(pillar.pillar_key)}
                        className="text-xs"
                      >
                        Aktivera
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* No Data State */}
        {pillarProgress.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Ingen pillar progress</h3>
            <p>Inga pillar-aktiviteter har registrerats än.</p>
            {canEdit && (
              <p className="text-sm mt-2">
                Aktivera pelare för att börja spåra framsteg.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};