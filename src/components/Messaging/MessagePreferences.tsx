import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { Separator } from '@/components/ui/separator';

export const MessagePreferences = () => {
  const { preferences, updatePreferences } = useMessages();
  const { canManageUsers } = useAuth();
  const [localPrefs, setLocalPrefs] = useState({
    email_notifications: true,
    internal_notifications: true,
    auto_ai_assistance: false
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        email_notifications: preferences.email_notifications,
        internal_notifications: preferences.internal_notifications,
        auto_ai_assistance: preferences.auto_ai_assistance
      });
    }
  }, [preferences]);

  const handleChange = (key: keyof typeof localPrefs, value: boolean) => {
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const success = await updatePreferences(localPrefs);
    if (success) {
      setHasChanges(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meddelandeinställningar</CardTitle>
        <CardDescription>
          Hantera hur du vill ta emot och hantera meddelanden
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">E-postnotifieringar</Label>
              <p className="text-sm text-muted-foreground">
                Få meddelanden via e-post när du får nya meddelanden
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={localPrefs.email_notifications}
              onCheckedChange={(value) => handleChange('email_notifications', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="internal-notifications">Interna notifieringar</Label>
              <p className="text-sm text-muted-foreground">
                Visa meddelanden i systemets meddelandecenter
              </p>
            </div>
            <Switch
              id="internal-notifications"
              checked={localPrefs.internal_notifications}
              onCheckedChange={(value) => handleChange('internal_notifications', value)}
            />
          </div>

          {/* AI-assistans sektion - endast synlig för coaches och administrativa roller */}
          {canManageUsers() && (
            <>
              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-ai-assistance">Automatisk AI-assistans</Label>
                  <p className="text-sm text-muted-foreground">
                    Aktivera automatiska AI-förslag för svar (endast för coaches)
                  </p>
                </div>
                <Switch
                  id="auto-ai-assistance"
                  checked={localPrefs.auto_ai_assistance}
                  onCheckedChange={(value) => handleChange('auto_ai_assistance', value)}
                />
              </div>
            </>
          )}
        </div>

        {hasChanges && (
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave}>
              Spara ändringar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                if (preferences) {
                  setLocalPrefs({
                    email_notifications: preferences.email_notifications,
                    internal_notifications: preferences.internal_notifications,
                    auto_ai_assistance: preferences.auto_ai_assistance
                  });
                }
                setHasChanges(false);
              }}
            >
              Återställ
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};