import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Auth } from "@/pages/Auth";
import { AppLayout } from "@/components/AppLayout";
import { CookieConsent } from "@/components/CookieConsent";
import { SecurityHeadersProvider } from "@/components/SecurityHeadersProvider";
import { ProfileCompletionGate } from "@/components/Profile/ProfileCompletionGate";
import { Dashboard } from "./pages/Dashboard";

import { ClientProfile } from "./pages/ClientProfile";
import { UserProfile } from "./pages/UserProfile";
import UserCrmProfile from "./pages/UserCrmProfile";
import { ClientDashboard } from "./pages/ClientDashboard";
import { OnboardingPage } from "./pages/OnboardingPage";
import EditProfilePage from "./pages/EditProfilePage";
import { ClientAssessmentPage } from "./pages/ClientAssessmentPage";
import { Messages } from "./pages/Messages";
import { Administration } from "./pages/Administration";
import { CoachDashboardPage } from "./pages/CoachDashboard";
import { InvitationSignup } from "./pages/InvitationSignup";
import { Intelligence } from "./pages/Intelligence";
import { IntelligenceOverview } from "./pages/IntelligenceOverview";
import { TasksPage } from "./pages/Tasks";
import { CalendarPage } from "./pages/Calendar";
import { StefanChatPage } from "./pages/StefanChat";
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
            <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
              <Routes>
              <Route path="/" element={
                (() => {
                  // Prioritera enligt hierarki: superadmin > admin > coach > client
                  if (hasRole('superadmin') || hasRole('admin')) return <Dashboard />;
                  if (hasRole('coach')) return <CoachDashboardPage />;
                  if (hasRole('client')) return <ClientDashboard />;
                  return <Dashboard />; // Fallback
                })()
              } />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/client-dashboard" element={<ClientDashboard />} />
               <Route path="/onboarding" element={
                 <ProfileCompletionGate requiredForAssessments={true}>
                   <OnboardingPage />
                 </ProfileCompletionGate>
               } />
               <Route path="/edit-profile" element={<EditProfilePage />} />
               <Route path="/client-assessment/:clientId" element={
                 <ProfileCompletionGate requiredForAssessments={true}>
                   <ClientAssessmentPage />
                 </ProfileCompletionGate>
               } />
              
              <Route path="/coach" element={<CoachDashboardPage />} />
              <Route path="/client/:clientId" element={<ClientProfile />} />
              <Route path="/user/:userId" element={<UserCrmProfile />} />
              <Route path="/intelligence" element={<IntelligenceOverview />} />
              <Route path="/intelligence/:userId" element={<Intelligence />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/administration" element={<Administration />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/stefan-chat" element={<StefanChatPage />} />
              <Route path="/analytics" element={<div className="p-6"><h1 className="text-2xl font-bold">Analys</h1><p className="text-muted-foreground">Analytiska insikter om dina klienter finns i varje klientprofil.</p></div>} />
              <Route path="/data-collection" element={<div className="p-6"><h1 className="text-2xl font-bold">Datainsamling</h1><p className="text-muted-foreground">Datainsamlingsverktyg finns integrerade i klientprofilerna.</p></div>} />
              <Route path="/reports" element={<div className="p-6"><h1 className="text-2xl font-bold">Rapporter</h1><p className="text-muted-foreground">Automatiska veckobrev skickas varje måndag. Mer rapportfunktionalitet utvecklas.</p></div>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </AppLayout>
        )
      } />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SecurityHeadersProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
          <CookieConsent />
        </BrowserRouter>
      </TooltipProvider>
    </SecurityHeadersProvider>
  </QueryClientProvider>
);

export default App;