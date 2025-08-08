import { useAuth } from '@/providers/UnifiedAuthProvider';
import { ModernMessagingApp } from '@/components/MessagingV2/ModernMessagingApp';
import { AutonomousMessagingInterface } from '@/components/Stefan/AutonomousMessagingInterface';
import { Button } from '@/components/ui/button';
import { Brain, MessageSquare } from 'lucide-react';

export function Messages() {
  const { user } = useAuth();

  // Show loading state while authentication is loading
  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laddar meddelanden...</p>
            <p className="text-xs text-muted-foreground mt-2">
              Initierar säker anslutning...
            </p>
          </div>
        </div>
      </div>
    );
  }

  

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header - förtydligar funktionaliteten */}
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl font-bold">Meddelanden & AI Chat</h1>
        <p className="text-muted-foreground">
          Kommunicera med ditt team och få hjälp från Stefan AI - allt på ett ställe
        </p>
      </div>
      
      {/* Quick access to Stefan AI */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Stefan AI Coaching</h3>
              <p className="text-sm text-muted-foreground">
                Få personlig coaching och vägledning med AI-driven support
              </p>
            </div>
          </div>
          <Button 
            onClick={() => window.location.href = '/stefan/chat'}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Starta Chat
          </Button>
        </div>
      </div>
      
      {/* Autonomous Messaging Interface - Stefan's proactive messaging */}
      <AutonomousMessagingInterface />
      
      {/* Main Messaging App */}
      <ModernMessagingApp />
    </div>
  );
}