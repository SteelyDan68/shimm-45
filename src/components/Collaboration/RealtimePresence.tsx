import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Wifi, WifiOff } from 'lucide-react';
import { UserPresence } from '@/hooks/useRealtimeCollaboration';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface RealtimePresenceProps {
  collaborators: UserPresence[];
  isConnected: boolean;
  currentUserId?: string;
}

export function RealtimePresence({ collaborators, isConnected, currentUserId }: RealtimePresenceProps) {
  const otherCollaborators = collaborators.filter(c => c.userId !== currentUserId);
  
  const getStatusColor = (status: UserPresence['status']) => {
    switch (status) {
      case 'online': return 'bg-success';
      case 'away': return 'bg-warning';
      case 'busy': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getStatusText = (status: UserPresence['status']) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Borta';
      case 'busy': return 'Upptagen';
      default: return 'Offline';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-4 w-4" />
          Aktiva medarbetare
          <Badge variant="secondary" className="ml-auto">
            {collaborators.length}
          </Badge>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-3 w-3 text-success" />
              Ansluten till realtidssamarbete
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-destructive" />
              Frånkopplad från realtidssamarbete
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {otherCollaborators.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Ingen annan är aktiv just nu</p>
            <p className="text-sm">Bjud in kollegor för att samarbeta</p>
          </div>
        ) : (
          <div className="space-y-3">
            {otherCollaborators.map((collaborator) => (
              <TooltipProvider key={collaborator.userId}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(collaborator.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div 
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(collaborator.status)}`}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {collaborator.userName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getStatusText(collaborator.status)}
                          {collaborator.lastSeen && (
                            <span className="ml-1">
                              • {formatDistanceToNow(new Date(collaborator.lastSeen), { 
                                addSuffix: true, 
                                locale: sv 
                              })}
                            </span>
                          )}
                        </p>
                      </div>

                      {collaborator.currentPage && (
                        <Badge variant="outline" className="text-xs">
                          {collaborator.currentPage.split('/').pop() || 'Dashboard'}
                        </Badge>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <p className="font-medium">{collaborator.userName}</p>
                      <p>Status: {getStatusText(collaborator.status)}</p>
                      {collaborator.currentPage && (
                        <p>Sida: {collaborator.currentPage}</p>
                      )}
                      {collaborator.metadata?.activity && (
                        <p>Aktivitet: {collaborator.metadata.activity}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}