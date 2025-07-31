import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProgress } from '@/hooks/useProgress';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Trophy, 
  Bell, 
  BarChart, 
  Settings,
  Plus,
  Eye,
  EyeOff,
  Send,
  Calendar
} from 'lucide-react';

export const AdminGamificationPanel: React.FC = () => {
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { 
    scheduleNotification, 
    sendImmediateNotification,
    getPendingNotifications 
  } = useSmartNotifications(selectedClientId);

  const {
    progress,
    awardXP,
    trackActivity
  } = useProgress(selectedClientId);

  // Form states
  const [notificationForm, setNotificationForm] = useState({
    type: 'custom_coaching' as const,
    title: '',
    message: '',
    priority: 'medium' as const,
    scheduled_for: '',
    immediate: false
  });

  const [xpForm, setXpForm] = useState({
    amount: 0,
    reason: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, custom_fields')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda klienter",
        variant: "destructive"
      });
    }
  };

  const handleSendNotification = async () => {
    if (!selectedClientId) {
      toast({
        title: "Fel",
        description: "Välj en klient först",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      let success = false;

      if (notificationForm.immediate) {
        success = await sendImmediateNotification(
          notificationForm.title,
          notificationForm.message,
          notificationForm.type,
          notificationForm.priority
        );
      } else {
        success = await scheduleNotification(
          notificationForm.type,
          notificationForm.title,
          notificationForm.message,
          notificationForm.scheduled_for,
          notificationForm.priority
        );
      }

      if (success) {
        setNotificationForm({
          type: 'custom_coaching',
          title: '',
          message: '',
          priority: 'medium',
          scheduled_for: '',
          immediate: false
        });
        toast({
          title: "Framgång",
          description: notificationForm.immediate ? "Notifikation skickad" : "Notifikation schemalagd"
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAwardXP = async () => {
    if (!selectedClientId || !xpForm.amount || !xpForm.reason) {
      toast({
        title: "Fel",
        description: "Fyll i alla fält",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await awardXP(xpForm.amount, `Admin: ${xpForm.reason}`);
      if (success) {
        setXpForm({ amount: 0, reason: '' });
        toast({
          title: "XP tilldelat",
          description: `${xpForm.amount} XP tilldelat för ${xpForm.reason}`
        });
      }
    } catch (error) {
      console.error('Error awarding XP:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressSummary = () => {
    if (!progress) return null;
    
    return {
      level: progress.current_level,
      xp: progress.current_xp,
      streak: progress.current_streak_days,
      sessions: progress.total_sessions_completed
    };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Gamification Administration
          </CardTitle>
          <CardDescription>
            Hantera XP, prestationer, notifikationer och användarengagemang
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-select">Välj klient</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj en klient..." />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name || client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClientId && progress && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">{progress.current_level}</div>
                  <div className="text-xs text-muted-foreground">Nivå</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{progress.current_xp}</div>
                  <div className="text-xs text-muted-foreground">XP</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{progress.current_streak_days}</div>
                  <div className="text-xs text-muted-foreground">Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{progress.total_sessions_completed}</div>
                  <div className="text-xs text-muted-foreground">Sessioner</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifikationer
          </TabsTrigger>
          <TabsTrigger value="xp" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            XP & Prestationer
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Bulk Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Skicka notifikation</CardTitle>
              <CardDescription>
                Skicka personaliserade meddelanden till användare
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Typ</Label>
                  <Select 
                    value={notificationForm.type} 
                    onValueChange={(value: any) => setNotificationForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      <SelectItem value="custom_coaching">Coaching</SelectItem>
                      <SelectItem value="check_in_reminder">Check-in påminnelse</SelectItem>
                      <SelectItem value="achievement_earned">Prestation</SelectItem>
                      <SelectItem value="streak_warning">Streak varning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioritet</Label>
                  <Select 
                    value={notificationForm.priority} 
                    onValueChange={(value: any) => setNotificationForm(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      <SelectItem value="low">Låg</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">Hög</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Titel</Label>
                <Input
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Notifikationens titel..."
                />
              </div>

              <div className="space-y-2">
                <Label>Meddelande</Label>
                <Textarea
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Skriv ditt meddelande här..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={notificationForm.immediate}
                  onCheckedChange={(checked) => setNotificationForm(prev => ({ ...prev, immediate: checked }))}
                />
                <Label>Skicka omedelbart</Label>
              </div>

              {!notificationForm.immediate && (
                <div className="space-y-2">
                  <Label>Schemalägg för</Label>
                  <Input
                    type="datetime-local"
                    value={notificationForm.scheduled_for}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, scheduled_for: e.target.value }))}
                  />
                </div>
              )}

              <Button 
                onClick={handleSendNotification} 
                disabled={!selectedClientId || isLoading}
                className="w-full"
              >
                {isLoading ? 'Skickar...' : (
                  <>
                    {notificationForm.immediate ? <Send className="w-4 h-4 mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
                    {notificationForm.immediate ? 'Skicka nu' : 'Schemalägg'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="xp">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tilldela XP</CardTitle>
                <CardDescription>
                  Ge användare extra XP för särskilda prestationer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>XP-mängd</Label>
                  <Input
                    type="number"
                    value={xpForm.amount}
                    onChange={(e) => setXpForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                    placeholder="Antal XP..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Anledning</Label>
                  <Input
                    value={xpForm.reason}
                    onChange={(e) => setXpForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Varför tilldelas XP..."
                  />
                </div>

                <Button 
                  onClick={handleAwardXP} 
                  disabled={!selectedClientId || isLoading}
                  className="w-full"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Tilldela XP
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Snabbåtgärder</CardTitle>
                <CardDescription>
                  Vanliga gamification-åtgärder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => trackActivity('manual_bonus', 50)}
                  disabled={!selectedClientId}
                  className="w-full justify-start"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  +50 XP Daglig bonus
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => trackActivity('weekly_goal_completed', 100)}
                  disabled={!selectedClientId}
                  className="w-full justify-start"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  +100 XP Veckomål
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => trackActivity('special_achievement', 200)}
                  disabled={!selectedClientId}
                  className="w-full justify-start"
                >
                  <Badge className="w-4 h-4 mr-2" />
                  +200 XP Special prestation
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Analytics</CardTitle>
              <CardDescription>
                Översikt över användarengagemang och gamification-effektivitet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart className="w-12 h-12 mx-auto mb-4" />
                <p>Analytics kommer snart...</p>
                <p className="text-sm">Här kommer detaljerad statistik över användarengagemang</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Actions</CardTitle>
              <CardDescription>
                Utför åtgärder på flera användare samtidigt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4" />
                <p>Bulk actions kommer snart...</p>
                <p className="text-sm">Här kommer funktioner för att hantera flera användare samtidigt</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};