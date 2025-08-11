import { useAuth } from "@/providers/UnifiedAuthProvider";
import { TopNavigation } from "@/components/TopNavigation";
import { AppSidebar } from "@/components/AppSidebar";
import { AutoBreadcrumbs } from "@/components/Navigation/AutoBreadcrumbs";
import { MobileContainer } from "@/components/ui/mobile-responsive";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOptimizedAuth } from "@/hooks/useOptimizedAuth";
import StefanAIChat from "@/components/StefanAIChat";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { isClient } = useOptimizedAuth();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen={!isMobile && !isClient} open={undefined}>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar - Desktop Navigation */}
        {!isClient && <AppSidebar />}
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          <TopNavigation />
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <MobileContainer className="py-4 min-h-full">
              <AutoBreadcrumbs />
              {children}
            </MobileContainer>
          </main>
        </div>
        
        {/* Stefan AI Chat Widget - Right side */}
        <StefanAIChat />
      </div>
    </SidebarProvider>
  );
};