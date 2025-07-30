import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, Monitor, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  browserNotifications: boolean;
  deadlineReminder: number; // hours before
  overdueReminder: boolean;
  assessmentReminder: boolean;
  customEventReminder: boolean;
  reminderTime: string; // time of day
}

export const NotificationSettings = ({ isOpen, onClose, clientId }: NotificationSettingsProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    browserNotifications: false,
    deadlineReminder: 24,
    overdueReminder: true,
    assessmentReminder: true,
    customEventReminder: false,
    reminderTime: '09:00'
  });

  const handleSave = () => {
    // Here you would save to database
    toast({
      title: "Inställningar sparade",
      description: "Dina notifieringsinställningar har uppdaterats."
    });
    onClose();
  };

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setSettings(prev => ({ ...prev, browserNotifications: true }));
        toast({
          title: "Webbläsarnotiser aktiverade",
          description: "Du kommer nu att få notiser i webbläsaren."
        });
      } else {
        toast({
          title: "Notiser nekade",
          description: "Du kan aktivera notiser i webbläsarinställningarna.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifieringsinställningar
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="font-medium">E-postnotiser</span>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, emailNotifications: checked }))
              }
            />
          </div>

          {/* Browser Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span className="font-medium">Webbläsarnotiser</span>
            </div>
            <Switch
              checked={settings.browserNotifications}
              onCheckedChange={(checked) => {
                if (checked) {
                  requestBrowserPermission();
                } else {
                  setSettings(prev => ({ ...prev, browserNotifications: false }));
                }
              }}
            />
          </div>

          {/* Deadline Reminder */}
          <div className="space-y-2">
            <label className="font-medium">Påminnelse före deadline</label>
            <Select 
              value={settings.deadlineReminder.toString()} 
              onValueChange={(value) => 
                setSettings(prev => ({ ...prev, deadlineReminder: parseInt(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 timme före</SelectItem>
                <SelectItem value="6">6 timmar före</SelectItem>
                <SelectItem value="12">12 timmar före</SelectItem>
                <SelectItem value="24">1 dag före</SelectItem>
                <SelectItem value="48">2 dagar före</SelectItem>
                <SelectItem value="72">3 dagar före</SelectItem>
                <SelectItem value="168">1 vecka före</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reminder Time */}
          <div className="space-y-2">
            <label className="font-medium">Tid för dagliga påminnelser</label>
            <input
              type="time"
              value={settings.reminderTime}
              onChange={(e) => setSettings(prev => ({ ...prev, reminderTime: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* Event Type Reminders */}
          <div className="space-y-3">
            <label className="font-medium">Påminnelser för händelsetyper</label>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Försenade uppgifter</span>
              <Switch
                checked={settings.overdueReminder}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, overdueReminder: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Bedömningar</span>
              <Switch
                checked={settings.assessmentReminder}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, assessmentReminder: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Egna händelser</span>
              <Switch
                checked={settings.customEventReminder}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, customEventReminder: checked }))
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Spara inställningar
            </Button>
            <Button variant="outline" onClick={onClose}>
              Avbryt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};