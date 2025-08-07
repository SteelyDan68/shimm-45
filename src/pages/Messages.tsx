import { useAuth } from '@/providers/UnifiedAuthProvider';
import { ModernMessagingApp } from '@/components/MessagingV2/ModernMessagingApp';
import { AutonomousMessagingInterface } from '@/components/Stefan/AutonomousMessagingInterface';

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
      
      {/* Autonomous Messaging Interface - Stefan's proactive messaging */}
      <AutonomousMessagingInterface />
      
      {/* Main Messaging App */}
      <ModernMessagingApp />
    </div>
  );
}