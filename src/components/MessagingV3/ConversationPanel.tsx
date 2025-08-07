import React, { useState } from 'react';
import { ModernMessagingApp } from '../MessagingV2/ModernMessagingApp';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCoachMessagingPermissions } from '@/hooks/useCoachMessagingPermissions';
import { useMessagingV2 } from '@/hooks/useMessagingV2';
import { useProactiveMessaging } from '@/hooks/useProactiveMessaging';
import { MessageCircle, User, Brain } from 'lucide-react';

/**
 * 🎯 CONVERSATION PANEL - Clean messaging interface
 * Med stöd för både Stefan AI och human coaches
 */

export const ConversationPanel: React.FC = () => {
  const { getMessagingEnabledCoaches } = useCoachMessagingPermissions();
  const { getOrCreateDirectConversation } = useMessagingV2();
  const { getOrCreateStefanConversation } = useProactiveMessaging();
  const messagingEnabledCoaches = getMessagingEnabledCoaches();

  const handleStartCoachConversation = async (coachId: string) => {
    await getOrCreateDirectConversation(coachId);
  };

  const handleStartStefanConversation = async () => {
    await getOrCreateStefanConversation();
  };

  return (
    <div className="space-y-6">
      {/* Quick Start Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Starta ny konversation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stefan AI Option */}
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Stefan AI</h3>
              <p className="text-sm text-muted-foreground">Din personliga AI-coach</p>
            </div>
            <Button 
              onClick={handleStartStefanConversation}
              size="sm"
            >
              Chatta nu
            </Button>
          </div>

          {/* Human Coaches */}
          {messagingEnabledCoaches.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Tillgängliga coaches:</h4>
              {messagingEnabledCoaches.map((coach) => (
                <div key={coach.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {coach.first_name && coach.last_name 
                        ? `${coach.first_name} ${coach.last_name}` 
                        : coach.email
                      }
                    </h3>
                    <p className="text-sm text-muted-foreground">Human coach</p>
                  </div>
                  <Button 
                    onClick={() => handleStartCoachConversation(coach.id)}
                    variant="outline"
                    size="sm"
                  >
                    Skicka meddelande
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Messaging Interface */}
      <Card className="h-[500px] overflow-hidden">
        <ModernMessagingApp className="h-full" />
      </Card>
    </div>
  );
};