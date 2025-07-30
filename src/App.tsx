import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Auth } from "@/pages/Auth";
import { AppLayout } from "@/components/AppLayout";
import { CookieConsent } from "@/components/CookieConsent";
import { Dashboard } from "./pages/Dashboard";
import { AllClients } from "./pages/AllClients";
import { ClientProfile } from "./pages/ClientProfile";
import { ClientDashboard } from "./pages/ClientDashboard";
import { OnboardingPage } from "./pages/OnboardingPage";
import { EditProfilePage } from "./pages/EditProfilePage";
import { ClientAssessmentPage } from "./pages/ClientAssessmentPage";
import { Messages } from "./pages/Messages";
import { Administration } from "./pages/Administration";
import { CoachDashboardPage } from "./pages/CoachDashboard";
import { InvitationSignup } from "./pages/InvitationSignup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, hasRole } = useAuth();

  return (
    <Routes>
      {/* Public routes that don't require authentication */}
      <Route path="/invitation/:token" element={<InvitationSignup />} />
      
      {/* Protected routes */}
      <Route path="/*" element={
        !user ? <Auth /> : (
          <AppLayout>
            <Routes>
              <Route path="/" element={
                hasRole('client') ? <ClientDashboard /> : <Dashboard />
              } />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/client-dashboard" element={<ClientDashboard />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/edit-profile" element={<EditProfilePage />} />
              <Route path="/client-assessment/:clientId" element={<ClientAssessmentPage />} />
              <Route path="/clients" element={<AllClients />} />
              <Route path="/coach" element={<CoachDashboardPage />} />
              <Route path="/client/:clientId" element={<ClientProfile />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/admin" element={<Administration />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/analytics" element={<div className="p-6"><h1 className="text-2xl font-bold">Analys</h1><p className="text-muted-foreground">Analytiska insikter om dina klienter finns i varje klientprofil.</p></div>} />
              <Route path="/data-collection" element={<div className="p-6"><h1 className="text-2xl font-bold">Datainsamling</h1><p className="text-muted-foreground">Datainsamlingsverktyg finns integrerade i klientprofilerna.</p></div>} />
              <Route path="/reports" element={<div className="p-6"><h1 className="text-2xl font-bold">Rapporter</h1><p className="text-muted-foreground">Automatiska veckobrev skickas varje måndag. Mer rapportfunktionalitet utvecklas.</p></div>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        )
      } />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
        <CookieConsent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
