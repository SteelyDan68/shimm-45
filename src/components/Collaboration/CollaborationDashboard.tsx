import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRealtimeCollaboration } from '@/hooks/useRealtimeCollaboration';
import { RealtimePresence } from './RealtimePresence';
import { LiveActivityFeed } from './LiveActivityFeed';
import { CollaborativeEditor } from './CollaborativeEditor';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  Plus, 
  Link2, 
  Settings, 
  MessageSquare,
  FileText,
  PenTool,
  Target
} from 'lucide-react';

export function CollaborationDashboard() {
  const { user } = useAuth();
  const [newRoomName, setNewRoomName] = useState('');
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  
  const {
    isConnected,
    activeCollaborators,
    events,
    joinRoom,
    leaveRoom,
    updateStatus
  } = useRealtimeCollaboration(currentRoom || undefined);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    
    const roomId = `room_${Date.now()}_${newRoomName.toLowerCase().replace(/\s+/g, '_')}`;
    await joinRoom(roomId, { 
      roomName: newRoomName,
      creator: user?.email,
      createdAt: new Date().toISOString()
    });
    
    setCurrentRoom(roomId);
    setNewRoomName('');
  };

  const handleJoinRoom = async (roomId: string) => {
    await joinRoom(roomId);
    setCurrentRoom(roomId);
  };

  const handleLeaveRoom = async () => {
    await leaveRoom();
    setCurrentRoom(null);
  };

  const quickRooms = [
    { id: 'general', name: 'Allmän diskussion', icon: MessageSquare },
    { id: 'assessments', name: 'Bedömningar', icon: Target },
    { id: 'planning', name: 'Planering', icon: FileText },
    { id: 'notes', name: 'Anteckningar', icon: PenTool },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Realtidssamarbete</h1>
          <p className="text-muted-foreground">
            Samarbeta i realtid med ditt team
          </p>
        </div>
        
        {currentRoom && (
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              <Users className="h-3 w-3 mr-1" />
              Rum: {currentRoom.split('_').pop()}
            </Badge>
            <Button variant="outline" onClick={handleLeaveRoom}>
              Lämna rum
            </Button>
          </div>
        )}
      </div>

      {!currentRoom ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick join rooms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Snabbåtkomst rum
              </CardTitle>
              <CardDescription>
                Gå med i populära samarbetsrum direkt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickRooms.map((room) => {
                const Icon = room.icon;
                return (
                  <Button
                    key={room.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleJoinRoom(room.id)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {room.name}
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          {/* Create new room */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Skapa nytt rum
              </CardTitle>
              <CardDescription>
                Starta ett nytt samarbetsrum för ditt team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Rumnamn (t.ex. Projektmöte Q1)"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
              />
              <Button 
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Skapa rum
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Tabs defaultValue="workspace" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="workspace">Arbetsyta</TabsTrigger>
            <TabsTrigger value="presence">Närvaro</TabsTrigger>
            <TabsTrigger value="activity">Aktivitet</TabsTrigger>
            <TabsTrigger value="settings">Inställningar</TabsTrigger>
          </TabsList>

          <TabsContent value="workspace" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <CollaborativeEditor
                documentId={`${currentRoom}_notes`}
                documentType="notes"
                roomId={currentRoom}
                initialContent="# Gemensamma anteckningar\n\nSkriv här..."
              />
              
              <CollaborativeEditor
                documentId={`${currentRoom}_plan`}
                documentType="plan"
                roomId={currentRoom}
                initialContent="# Projektplan\n\n## Mål\n\n## Aktiviteter\n\n## Tidslinje\n"
              />
            </div>
          </TabsContent>

          <TabsContent value="presence" className="space-y-6">
            <RealtimePresence
              collaborators={activeCollaborators}
              isConnected={isConnected}
              currentUserId={user?.id}
            />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <LiveActivityFeed events={events} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Samarbetsinställningar
                </CardTitle>
                <CardDescription>
                  Konfigurera dina samarbetspreferenser
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Status synlighet</h4>
                    <p className="text-sm text-muted-foreground">
                      Visa din status för andra användare
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => updateStatus('away')}
                  >
                    Sätt som borta
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Aktivitetsnotifikationer</h4>
                    <p className="text-sm text-muted-foreground">
                      Få notifikationer om teamaktivitet
                    </p>
                  </div>
                  <Button variant="outline">
                    Konfigurera
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Dela rum</h4>
                    <p className="text-sm text-muted-foreground">
                      Bjud in andra till detta rum
                    </p>
                  </div>
                  <Button variant="outline">
                    <Link2 className="h-4 w-4 mr-2" />
                    Kopiera länk
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}