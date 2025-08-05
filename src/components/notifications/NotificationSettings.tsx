import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/providers/NotificationProvider';
import { Settings, Mail, Smartphone, Clock } from 'lucide-react';

interface NotificationSettingsProps {
  className?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  className = ""
}) => {
  const { preferences, updatePreferences, isLoading } = useNotifications();

  if (isLoading || !preferences) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
            <span className="text-mobile-sm">Laddar inställningar...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-mobile-lg flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Notifikationsinställningar
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* General Settings */}
        <div>
          <h3 className="text-mobile-base font-semibold mb-4">Allmänt</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-mobile-sm font-medium">E-postnotifikationer</Label>
                  <p className="text-mobile-xs text-muted-foreground">
                    Få notifikationer via e-post
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => updatePreferences({ email_notifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-mobile-sm font-medium">Push-notifikationer</Label>
                  <p className="text-mobile-xs text-muted-foreground">
                    Få notifikationer direkt till enheten
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.push_notifications}
                onCheckedChange={(checked) => updatePreferences({ push_notifications: checked })}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Quiet Hours */}
        <div>
          <h3 className="text-mobile-base font-semibold mb-4">Tystnad</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-mobile-sm">Från tid</Label>
                <Input
                  type="time"
                  value={preferences.quiet_hours_start || '22:00'}
                  onChange={(e) => updatePreferences({ quiet_hours_start: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-mobile-sm">Till tid</Label>
                <Input
                  type="time"
                  value={preferences.quiet_hours_end || '08:00'}
                  onChange={(e) => updatePreferences({ quiet_hours_end: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};