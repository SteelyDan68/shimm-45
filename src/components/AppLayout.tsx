import { useAuth } from "@/hooks/useAuth";
import { TopNavigation } from "@/components/TopNavigation";
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
    <div className="min-h-screen flex flex-col">
      <TopNavigation />
      
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
      <StefanAIChat />
    </div>
  );
};