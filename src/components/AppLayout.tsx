import { useAuth } from "@/hooks/useAuth";
import { TopNavigation } from "@/components/TopNavigation";
import { MobileContainer } from "@/components/ui/mobile-responsive";
import StefanAIChat from "./StefanAIChat";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNavigation />
      
      <main className="flex-1 overflow-auto">
        <MobileContainer className="py-4 min-h-full">
          {children}
        </MobileContainer>
      </main>
      <StefanAIChat />
    </div>
  );
};