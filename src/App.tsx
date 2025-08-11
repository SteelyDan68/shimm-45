import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnalyticsProvider } from '@/components/Analytics/AnalyticsProvider';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UnifiedAuthProvider, useAuth } from "@/providers/UnifiedAuthProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { EnhancedStefanContextProvider } from "@/providers/EnhancedStefanContextProvider";
import { NAVIGATION_ROUTES, getDefaultRouteForRole } from "@/config/navigation";
import { Auth } from "@/pages/Auth";
import { AppLayout } from "@/components/AppLayout";
import { MobileOptimizedLayout, useMobileViewport } from "@/components/ui/mobile-optimized-layout";
import { AccessibleSkipLink, KeyboardNavigationIndicator, useKeyboardNavigation } from "@/components/ui/accessibility";
import { errorTracker } from "@/utils/productionErrorTracking";
import { AutoNotificationSystem } from "@/components/Notifications/AutoNotificationSystem";

import { CriticalErrorBoundary, PageErrorBoundary } from "@/components/error/ErrorBoundary";
import { Dashboard } from "./pages/Dashboard";
import { GlobalSearchPage } from "./pages/GlobalSearch";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AdminAnalyticsPage } from "./pages/AdminAnalyticsPage";
import { StefanAdministrationPage } from "./pages/StefanAdministrationPage";
import { Collaboration } from "@/pages/Collaboration";

import { TestingPage } from "@/pages/TestingPage";
import { SixPillars } from "@/pages/SixPillars";
import Mobile from "@/pages/Mobile";

import GDPRManagement from './pages/GDPRManagement';
import UnifiedUserManagement from './pages/UnifiedUserManagement';
// UNIFIED USER PROFILE - Single Source of Truth
import { UnifiedUserProfile } from "./components/UnifiedUserProfile";
import { ClientProfile } from "./pages/ClientProfile";
import { UserProfile } from "./pages/UserProfile";

import { ClientList } from "./components/ClientList";
import ClientDashboard from "./pages/ClientDashboard";
import { OnboardingPage } from "./pages/OnboardingPage";
import UnifiedProfilePage from "./pages/UnifiedProfilePage";
import { ClientAssessmentPage } from "./pages/ClientAssessmentPage";
import { MyAssessments } from "./pages/MyAssessments";
import MyAnalyses from "./pages/MyAnalyses";
import MyProgram from "./pages/MyProgram";
import { GuidedAssessmentFlow } from "./pages/GuidedAssessmentFlow";
import { Messages } from "./pages/Messages";
import { Administration } from "./pages/Administration";

import { UnifiedUserManagementPage } from "./pages/UnifiedUserManagement";
import { CoachDashboardPage } from "./pages/CoachDashboard";
import UserAnalytics from "./pages/UserAnalytics";
import { InvitationSignup } from "./pages/InvitationSignup";
import { Intelligence } from "./pages/Intelligence";
import { IntelligenceOverview } from "./pages/IntelligenceOverview";
import { IntelligenceHubPage } from "./pages/IntelligenceHub";
import { DevelopmentOverview } from "./pages/DevelopmentOverview";
import { TasksPage } from "./pages/Tasks";
import { CalendarPage } from "./pages/Calendar";
import { StefanChatPage } from "./pages/StefanChatPage";
import { StefanAICentralHub } from "./components/Stefan/StefanAICentralHub";
import { AIInsights } from "./pages/AIInsights";
import SystemMapPage from "./pages/SystemMap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, hasRole } = useAuth();
  const { isKeyboardUser, announceToScreenReader } = useKeyboardNavigation();
  
  // Initialize mobile viewport optimizations
  useMobileViewport();

  // Set up error tracking with user context
  React.useEffect(() => {
    if (user?.id) {
      errorTracker.setUserId(user.id);
    }
  }, [user?.id]);

  return (
    <>
      {/* Accessibility skip links */}
      <AccessibleSkipLink href="#main-content">
        Hoppa till huvudinnehåll
      </AccessibleSkipLink>
      <AccessibleSkipLink href="#navigation">
        Hoppa till navigation
      </AccessibleSkipLink>
      
      {/* Keyboard navigation indicator */}
      <KeyboardNavigationIndicator isVisible={isKeyboardUser} />
      
      <Routes>
      {/* Public routes that don't require authentication */}
      <Route path="/invitation/:token" element={<InvitationSignup />} />
      
      {/* Protected routes */}
      <Route path="/*" element={
        !user ? (
          <MobileOptimizedLayout>
            <Auth />
          </MobileOptimizedLayout>
        ) : (
          <PageErrorBoundary>
            <MobileOptimizedLayout showNavigation={false}>
              <AppLayout>
                <Suspense fallback={
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                }>
                <Routes>
               <Route path="/" element={<Dashboard />} />
               <Route path={NAVIGATION_ROUTES.DASHBOARD} element={<Dashboard />} />
              <Route path={NAVIGATION_ROUTES.CLIENT_DASHBOARD} element={<ClientDashboard />} />
                <Route path={NAVIGATION_ROUTES.ONBOARDING} element={<OnboardingPage />} />
                <Route path={NAVIGATION_ROUTES.EDIT_PROFILE} element={<UnifiedProfilePage />} />
                <Route path="/client-assessment/:clientId" element={<ClientAssessmentPage />} />
        <Route path="/my-assessments" element={<MyAssessments />} />
        <Route path="/my-analyses" element={<MyAnalyses />} />
        <Route path="/my-program" element={<MyProgram />} />
        <Route path="/guided-assessment" element={<GuidedAssessmentFlow />} />
              
               <Route path={NAVIGATION_ROUTES.COACH_DASHBOARD} element={<CoachDashboardPage />} />
               <Route path={NAVIGATION_ROUTES.USERS} element={
                 <div className="p-6">
                   <h1 className="text-2xl font-bold mb-6">Användare</h1>
                   <ClientList refreshTrigger={0} />
                 </div>
               } />
               {/* UNIFIED ROUTING - Single Source of Truth: user_id only */}
               <Route path="/user/:userId" element={<UnifiedUserProfile />} />
               {/* Legacy routes for backward compatibility */}
               <Route path="/client/:clientId" element={<ClientProfile />} />
              <Route path="/search" element={<GlobalSearchPage />} />
               <Route path="/collaboration" element={<Collaboration />} />
                
                <Route path="/testing" element={<TestingPage />} />
               <Route path={NAVIGATION_ROUTES.SIX_PILLARS} element={<SixPillars />} />
               <Route path="/six-pillars/:pillarKey" element={<SixPillars />} />
               <Route path="/mobile" element={<Mobile />} />
                <Route path={NAVIGATION_ROUTES.INTELLIGENCE} element={<IntelligenceOverview />} />
                <Route path={NAVIGATION_ROUTES.INTELLIGENCE_HUB} element={<IntelligenceHubPage />} />
                <Route path="/intelligence/:userId" element={<Intelligence />} />
                <Route path="/development-overview" element={<DevelopmentOverview />} />
              <Route path={NAVIGATION_ROUTES.MESSAGES} element={<Messages />} />
                
              <Route path="/unified-users" element={<UnifiedUserManagementPage />} />
              <Route path="/gdpr-management" element={<GDPRManagement />} />
              <Route path="/intelligence-hub" element={<IntelligenceHubPage />} />
                 <Route path={NAVIGATION_ROUTES.ADMINISTRATION} element={<Administration />} />
               <Route path={NAVIGATION_ROUTES.AUTH} element={<Auth />} />
               <Route path={NAVIGATION_ROUTES.TASKS} element={<TasksPage />} />
                 <Route path={NAVIGATION_ROUTES.CALENDAR} element={<CalendarPage />} />
                 <Route path="/ai-insights" element={<AIInsights />} />
                 <Route path="/user-analytics" element={<UserAnalytics />} />
                 <Route path="/user-analytics/:userId" element={<UserAnalytics />} />
                   <Route path={NAVIGATION_ROUTES.STEFAN_ADMIN} element={<StefanAdministrationPage />} />
                   <Route path={NAVIGATION_ROUTES.STEFAN_CHAT} element={<StefanChatPage />} />
                   <Route path="/stefan/*" element={<StefanAICentralHub />} />
                   <Route path="/system-map" element={<SystemMapPage />} />
                 <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            </AppLayout>
            </MobileOptimizedLayout>
          </PageErrorBoundary>
        )
      } />
    </Routes>
    </>
  );
};

const App = () => {
  return (
    <React.StrictMode>
      <CriticalErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <TooltipProvider delayDuration={300} skipDelayDuration={100}>
              <UnifiedAuthProvider>
                <NotificationProvider>
                  <EnhancedStefanContextProvider>
                    <AnalyticsProvider>
                      <AppRoutes />
                      <AutoNotificationSystem />
                      <Toaster />
                      <Sonner />
                    </AnalyticsProvider>
                  </EnhancedStefanContextProvider>
                </NotificationProvider>
              </UnifiedAuthProvider>
            </TooltipProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </CriticalErrorBoundary>
    </React.StrictMode>
  );
};

export default App;