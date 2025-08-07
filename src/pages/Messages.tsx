import { useAuth } from '@/providers/UnifiedAuthProvider';
import { ImprovedMessagingHub } from '@/components/MessagingV3/ImprovedMessagingHub';

export function Messages() {
  const { user } = useAuth();

  // Show loading state while authentication is loading
  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4 animate-fade-in">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div>
              <p className="text-muted-foreground font-medium">Laddar meddelanden...</p>
              <p className="text-xs text-muted-foreground mt-2">
                Initierar säker anslutning...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <ImprovedMessagingHub />;
}