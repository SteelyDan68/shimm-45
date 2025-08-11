import { useAuth } from "@/providers/UnifiedAuthProvider";
import { TopNavigation } from "@/components/TopNavigation";
import { AutoBreadcrumbs } from "@/components/Navigation/AutoBreadcrumbs";
import { MobileContainer } from "@/components/ui/mobile-responsive";
import { useIsMobile } from "@/hooks/use-mobile";
import StefanAIChat from "@/components/StefanAIChat";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <TopNavigation />
      
      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)] overflow-auto">
        <MobileContainer className="py-4 min-h-full">
          <AutoBreadcrumbs />
          {children}
        </MobileContainer>
      </main>
      
      {/* Stefan AI Chat Widget - Right side */}
      <StefanAIChat />
    </div>
  );
};