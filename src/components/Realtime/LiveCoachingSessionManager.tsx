/**
 * 🎥 LIVE COACHING SESSION MANAGER
 * Real-time coaching sessions med live chat och screen sharing
 * Phase 4: Real-time Experience Revolution
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  MessageSquare, 
  Share, 
  Users, 
  Clock,
  Send,
  Phone,
  PhoneOff,
  Monitor,
  Hand,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface LiveMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'system' | 'action';
}

interface SessionParticipant {
  userId: string;
  userName: string;
  avatar?: string;
  role: 'coach' | 'client';
  status: 'connected' | 'connecting' | 'disconnected';
  audioEnabled: boolean;
  videoEnabled: boolean;
  handRaised: boolean;
}

interface LiveCoachingSession {
  id: string;
  title: string;
  description: string;
  coachId: string;
  clientId: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  participants: SessionParticipant[];
  isRecording: boolean;
}

interface LiveCoachingSessionManagerProps {
  sessionId?: string;
  autoJoin?: boolean;
  className?: string;
}

export const LiveCoachingSessionManager: React.FC<LiveCoachingSessionManagerProps> = ({
  sessionId,
  autoJoin = false,
  className = ""
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [session, setSession] = useState<LiveCoachingSession | null>(null);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeChannelRef = useRef<any>(null);

  // 🔄 REAL-TIME SESSION SUBSCRIPTION
  useEffect(() => {
    if (!sessionId || !user?.id) return;

    // Subscribe to session updates
    const channel = supabase
      .channel(`live-session-${sessionId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coaching_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          // Handle session updates
          console.log('Session updated:', payload);
        }
      )
      .on('broadcast',
        { event: 'participant_update' },
        (payload) => {
          setSession(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              participants: prev.participants.map(p => 
                p.userId === payload.userId 
                  ? { ...p, ...payload.updates }
                  : p
              )
            };
          });
        }
      )
      .on('broadcast',
        { event: 'chat_message' },
        (payload) => {
          const newMessage: LiveMessage = {
            id: crypto.randomUUID(),
            userId: payload.userId,
            userName: payload.userName,
            message: payload.message,
            timestamp: new Date(),
            type: 'text'
          };
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .on('broadcast',
        { event: 'hand_raised' },
        (payload) => {
          addSystemMessage(`${payload.userName} har räckt upp handen`);
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [sessionId, user?.id]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addSystemMessage = useCallback((message: string) => {
    const systemMessage: LiveMessage = {
      id: crypto.randomUUID(),
      userId: 'system',
      userName: 'System',
      message,
      timestamp: new Date(),
      type: 'system'
    };
    setMessages(prev => [...prev, systemMessage]);
  }, []);

  const joinSession = useCallback(async () => {
    try {
      // Request media permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: audioEnabled
      });
      
      setLocalStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsJoined(true);
      addSystemMessage(`${user?.email || 'Du'} gick med i sessionen`);
      
      // Broadcast join event
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'participant_update',
          payload: {
            userId: user?.id,
            updates: {
              status: 'connected',
              audioEnabled,
              videoEnabled
            }
          }
        });
      }
      
      toast({
        title: "Ansluten till session",
        description: "Du är nu ansluten till den live coaching-sessionen."
      });
      
    } catch (error) {
      console.error('Error joining session:', error);
      toast({
        title: "Kunde inte ansluta",
        description: "Misslyckades med att ansluta till sessionen. Kontrollera dina mediaenheter.",
        variant: "destructive"
      });
    }
  }, [user?.id, audioEnabled, videoEnabled, toast, addSystemMessage]);

  const leaveSession = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    setIsJoined(false);
    addSystemMessage(`${user?.email || 'Du'} lämnade sessionen`);
    
    // Broadcast leave event
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.send({
        type: 'broadcast',
        event: 'participant_update',
        payload: {
          userId: user?.id,
          updates: { status: 'disconnected' }
        }
      });
    }
  }, [localStream, user?.id, addSystemMessage]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
      
      // Broadcast audio status
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'participant_update',
          payload: {
            userId: user?.id,
            updates: { audioEnabled: !audioEnabled }
          }
        });
      }
    }
  }, [localStream, audioEnabled, user?.id]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
      
      // Broadcast video status
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'participant_update',
          payload: {
            userId: user?.id,
            updates: { videoEnabled: !videoEnabled }
          }
        });
      }
    }
  }, [localStream, videoEnabled, user?.id]);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      setScreenSharing(true);
      addSystemMessage("Skärmdelning startad");
      
      // Handle screen share end
      screenStream.getVideoTracks()[0].onended = () => {
        setScreenSharing(false);
        addSystemMessage("Skärmdelning avslutad");
      };
      
    } catch (error) {
      console.error('Error starting screen share:', error);
      toast({
        title: "Skärmdelning misslyckades",
        description: "Kunde inte starta skärmdelning.",
        variant: "destructive"
      });
    }
  }, [addSystemMessage, toast]);

  const raiseHand = useCallback(() => {
    setHandRaised(!handRaised);
    
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.send({
        type: 'broadcast',
        event: 'hand_raised',
        payload: {
          userId: user?.id,
          userName: user?.email || 'Unknown',
          raised: !handRaised
        }
      });
    }
  }, [handRaised, user?.id, user?.email]);

  const sendMessage = useCallback(() => {
    if (!newMessage.trim()) return;
    
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.send({
        type: 'broadcast',
        event: 'chat_message',
        payload: {
          userId: user?.id,
          userName: user?.email || 'Unknown',
          message: newMessage.trim()
        }
      });
    }
    
    setNewMessage('');
  }, [newMessage, user?.id, user?.email]);

  // Mock session data for demo
  useEffect(() => {
    setSession({
      id: sessionId || 'demo-session',
      title: 'Coaching Session - Utvecklingssamtal',
      description: 'Live coaching session fokuserad på personlig utveckling',
      coachId: 'coach-1',
      clientId: user?.id || '',
      status: 'active',
      startTime: new Date(),
      participants: [
        {
          userId: 'coach-1',
          userName: 'Stefan (Coach)',
          role: 'coach',
          status: 'connected',
          audioEnabled: true,
          videoEnabled: true,
          handRaised: false
        },
        {
          userId: user?.id || '',
          userName: user?.email || 'Du',
          role: 'client',
          status: isJoined ? 'connected' : 'disconnected',
          audioEnabled,
          videoEnabled,
          handRaised
        }
      ],
      isRecording: false
    });
  }, [sessionId, user?.id, user?.email, isJoined, audioEnabled, videoEnabled, handRaised]);

  if (!session) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Ingen aktiv session</h3>
          <p className="text-muted-foreground">Det finns ingen live coaching-session just nu.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                {session.title}
              </CardTitle>
              <CardDescription>{session.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                {session.status === 'active' ? 'LIVE' : session.status}
              </Badge>
              {session.isRecording && (
                <Badge variant="destructive">
                  🔴 Spelar in
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Video Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Video */}
          <Card>
            <CardContent className="p-0 relative aspect-video bg-black rounded-lg overflow-hidden">
              {isJoined ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center">
                    <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-4">Coaching Session</p>
                    <Button onClick={joinSession} size="lg">
                      <Phone className="h-4 w-4 mr-2" />
                      Gå med i session
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Video Controls Overlay */}
              {isJoined && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-lg p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAudio}
                    className={cn(
                      "text-white hover:bg-white/20",
                      !audioEnabled && "bg-red-500 hover:bg-red-600"
                    )}
                  >
                    {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleVideo}
                    className={cn(
                      "text-white hover:bg-white/20",
                      !videoEnabled && "bg-red-500 hover:bg-red-600"
                    )}
                  >
                    {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={startScreenShare}
                    className="text-white hover:bg-white/20"
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={raiseHand}
                    className={cn(
                      "text-white hover:bg-white/20",
                      handRaised && "bg-yellow-500 hover:bg-yellow-600"
                    )}
                  >
                    <Hand className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={leaveSession}
                    className="text-white hover:bg-white/20 bg-red-500 hover:bg-red-600"
                  >
                    <PhoneOff className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Deltagare ({session.participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {session.participants.map((participant) => (
                  <div key={participant.userId} className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback>
                        {participant.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <p className="font-medium">{participant.userName}</p>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {participant.role}
                        </Badge>
                        <Badge 
                          variant={participant.status === 'connected' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {participant.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {participant.audioEnabled ? (
                        <Mic className="h-3 w-3 text-green-500" />
                      ) : (
                        <MicOff className="h-3 w-3 text-red-500" />
                      )}
                      {participant.videoEnabled ? (
                        <Video className="h-3 w-3 text-green-500" />
                      ) : (
                        <VideoOff className="h-3 w-3 text-red-500" />
                      )}
                      {participant.handRaised && (
                        <Hand className="h-3 w-3 text-yellow-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Sidebar */}
        <div className="space-y-4">
          <Card className="h-96">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Live Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-full">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className={cn(
                    "flex gap-2",
                    message.type === 'system' && "justify-center"
                  )}>
                    {message.type === 'system' ? (
                      <div className="text-xs text-muted-foreground bg-muted rounded-full px-3 py-1">
                        {message.message}
                      </div>
                    ) : (
                      <>
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarFallback className="text-xs">
                            {message.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{message.userName}</span>
                            <span className="text-xs text-muted-foreground">
                              {message.timestamp.toLocaleTimeString('sv-SE', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <p className="text-sm break-words">{message.message}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              {isJoined && (
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Skriv ett meddelande..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="text-sm"
                    />
                    <Button size="sm" onClick={sendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};