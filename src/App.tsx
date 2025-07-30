import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Auth } from "@/pages/Auth";
import { AppLayout } from "@/components/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { AllClients } from "./pages/AllClients";
import { ClientProfile } from "./pages/ClientProfile";
import { ClientDashboard } from "./pages/ClientDashboard";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ClientAssessmentPage } from "./pages/ClientAssessmentPage";
import { Administration } from "./pages/Administration";
import { CoachDashboardPage } from "./pages/CoachDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user } = useAuth();

  if (!user) {
    return <Auth />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/client-assessment/:clientId" element={<ClientAssessmentPage />} />
        <Route path="/clients" element={<AllClients />} />
        <Route path="/coach" element={<CoachDashboardPage />} />
        <Route path="/client/:clientId" element={<ClientProfile />} />
        <Route path="/admin" element={<Administration />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/analytics" element={<div className="p-6"><h1 className="text-2xl font-bold">Analys - Kommer snart</h1></div>} />
        <Route path="/reports" element={<div className="p-6"><h1 className="text-2xl font-bold">Rapporter - Kommer snart</h1></div>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
