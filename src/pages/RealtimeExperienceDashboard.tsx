/**
 * 🚀 REAL-TIME EXPERIENCE DASHBOARD
 * Central hub för alla real-time funktioner och live samarbete
 * Phase 4: Real-time Experience Revolution - KOMPLETT
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Video, 
  Users, 
  Zap, 
  Activity, 
  MessageSquare, 
  Target,
  Play,
  Clock
} from 'lucide-react';
import { RealtimeNotificationSystem } from '@/components/Realtime/RealtimeNotificationSystem';
import { LiveCoachingSessionManager } from '@/components/Realtime/LiveCoachingSessionManager';
import { CollaborativeDevelopmentWorkspace } from '@/components/Realtime/CollaborativeDevelopmentWorkspace';
import { useAuth } from '@/providers/UnifiedAuthProvider';

export const RealtimeExperienceDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications');

  // Demo session data
  const [hasActiveSession] = useState(false);
  const [pendingCollaboration] = useState(2);

  return (
    <div className="space-y-6 p-6">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 flex items-center justify-center mb-4">
          <Zap className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
          Real-time Experience Center
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Live notifikationer, coaching sessions och samarbetsfunktioner för en revolutionär användarupplevelse
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Live Notifications
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Video Sessions
          </Badge>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Collaborative Workspace
          </Badge>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Bell className="h-5 w-5" />
              Live Notifikationer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-900">Real-time</p>
                <p className="text-sm text-green-700">Aktiva system-wide</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Video className="h-5 w-5" />
              Coaching Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-900">
                  {hasActiveSession ? 'LIVE' : 'Standby'}
                </p>
                <p className="text-sm text-blue-700">
                  {hasActiveSession ? 'Session aktiv' : 'Redo för session'}
                </p>
              </div>
              {hasActiveSession ? (
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              ) : (
                <Button size="sm" variant="outline">
                  <Play className="h-4 w-4 mr-1" />
                  Starta
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Users className="h-5 w-5" />
              Samarbete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-900">{pendingCollaboration}</p>
                <p className="text-sm text-purple-700">Väntande samarbeten</p>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <div className="w-2 h-2 bg-purple-300 rounded-full" />
                <div className="w-2 h-2 bg-purple-100 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Features Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Live Notifikationer
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Coaching Sessions
          </TabsTrigger>
          <TabsTrigger value="collaboration" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Samarbetsyta
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-green-500" />
                Real-time Notification System
              </CardTitle>
              <CardDescription>
                Live notifikationer med Supabase Realtime för omedelbar feedback och uppdateringar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <div className="space-y-4">
                    {/* Notification Demo Panel */}
                    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2 text-green-800">Live Notification Features</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span>Coaching insights</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span>Task reminders</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                            <span>Achievement alerts</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full" />
                            <span>System updates</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="text-sm text-muted-foreground">
                      <p>🔄 Real-time notifikationer är aktiva och lyssnar på:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Nya AI coaching-rekommendationer</li>
                        <li>Uppgiftsuppdateringar och påminnelser</li>
                        <li>Genomförda utvecklingspillars</li>
                        <li>Systemuppdateringar och meddelanden</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="lg:col-span-1 flex justify-center lg:justify-end">
                  <RealtimeNotificationSystem 
                    maxVisibleNotifications={3}
                    autoHideDelay={6000}
                    enableSound={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-blue-500" />
                Live Coaching Session Manager
              </CardTitle>
              <CardDescription>
                Real-time video sessions med live chat, screen sharing och interaktiva coaching-verktyg
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LiveCoachingSessionManager 
                sessionId="demo-session-001"
                autoJoin={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collaboration">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Collaborative Development Workspace
              </CardTitle>
              <CardDescription>
                Real-time samarbete för utvecklingsplanering med live editing och kommentarer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CollaborativeDevelopmentWorkspace 
                workspaceId={`workspace-${user?.id}`}
                userId={user?.id}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Achievement Badge */}
      <Card className="bg-gradient-to-r from-green-50 to-purple-50 border-green-200">
        <CardContent className="text-center py-6">
          <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-green-900">Phase 4: Real-time Experience Revolution</h3>
          <p className="text-green-700 text-sm mt-1">
            ✅ Live Notifications ✅ Video Sessions ✅ Collaborative Workspace
          </p>
          <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Supabase Realtime</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Live Chat</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>Real-time Collaboration</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};