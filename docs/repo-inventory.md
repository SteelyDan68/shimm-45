# SHMMS Repository-inventering (Automatiskt sammanställd)

Senast uppdaterad: {{DATE}}
Källa: Kodsökningar via Lovable-sök (regex) i src/** och supabase/functions/**.

---

## Sammanfattning
- Hooks: 161 matchningar i 133 filer (export function/const use*)
- Edge Functions: ~67 funktioner (serve/Deno.serve)
- Sidor (Pages): Minst 3 med default export hittade via mönster; routing i src/App.tsx pekar på betydligt fler.

---

## Routing
- Huvudrouter: src/App.tsx (React Router <Routes> med skyddade rutter, lazy/suspense, MobileOptimizedLayout).
- Exempelrutter: Dashboard, ClientDashboard, CoachDashboard, OnboardingPage, UnifiedProfilePage, ClientAssessmentPage, Administration m.fl.

---

## Sidor (identifierade via `export default function`)
- src/pages/GDPRManagement.tsx
- src/pages/UnifiedProfilePage.tsx
- src/pages/UserAnalytics.tsx
- src/pages/Administration.tsx (via import i App och sökning efter Administration)
- src/pages/Dashboard.tsx (via App.tsx)

Obs: Fler sidor kan använda named exports/konstanta komponenter och fångas inte av just detta sökmönster.

---

## Centrala komponenter (urval)
- Admin: src/components/Admin/PRDDashboard.tsx, IntegratedAdminDashboard.tsx, OnboardingWorkflow.tsx
- GDPR: src/components/GDPR/GDPRAdminDashboard.tsx, UserGDPRRequestForm.tsx
- User Management: src/components/UserAdministration/CentralUserManager.tsx, UserManagementTabs.tsx
- Analytics: src/components/AI/AIActionablesPipelineStatus.tsx, ActionablePriorityDashboard.tsx
- Stefan AI: src/components/Stefan/* (central hub, chat, interventions, management)

---

## Hooks (nyckelgrupper – komplett mängd finns i koden)
- Dataskikt: useUnifiedDataLayer, useCentralizedData, useRealDataBindings
- Assessment: useAssessmentEngine, useRealAssessments, usePillarAssessmentState, useWelcomeAssessmentFixed, useUnifiedAssessment
- AI/Coachning: useAIPlanning, useAdvancedAICoaching, useAutonomousCoach, useCoachDashboard
- Analys/Event: useAnalytics, useRealAnalytics, useAnalyticsTracking, useAnalyticsProvider, useGlobalUserEvents
- Admin/Realtime: useAdminRealtime, useAdminMetrics, useCoachClientAccess
- GDPR/Export: useGDPR, useGDPRRequests, useDataExport, useDataImport
- Robusthet/UX: useCircuitBreaker, useErrorRecovery, useAsyncWithRetry, useMobileViewport, useUndo, useIsMobile

Totalt: 161 hook-definitioner hittade i 133 filer (se src/hooks/** och relaterade mappar för full lista).

---

## Edge Functions (lista – observerad via `serve(`/`Deno.serve`))
- admin-create-user
- admin-password-reset
- admin-realtime-aggregation
- advanced-ai-coaching
- aggregate-client-data
- ai-message-assistant
- analytics-processor
- analyze-assessment
- analyze-dynamic-assessment
- analyze-learning-style
- analyze-pillar-assessment
- analyze-pillar-module
- analyze-welcome-assessment
- auth-webhook
- auto-actionables-trigger
- autonomous-coach-intervention
- bulk-import-stefan-memory
- check-ai-availability
- clear-pillar-dependencies
- client-logic
- consolidate-assessment-system
- context-analyzer
- create-user
- data-collector
- debug-resend
- email-orchestrator
- enhanced-ai-planning
- error-logger
- export-data
- gdpr-processor
- gemini-research
- generate-actionable-timeline
- generate-ai-planning
- generate-journey-prediction
- generate-overall-assessment
- generate-prd-document
- get-stefan-memories
- global-search
- habit-pattern-analyzer
- habit-recovery-planner
- import-data
- log-stefan-interaction
- proactive-coaching-scheduler
- send-assessment-reminder
- send-coach-client-message
- send-enhanced-notification
- send-invitation
- send-invitations
- send-message-notification
- send-realtime-message
- send-system-alert
- send-welcome-email
- stefan-ai-chat
- stefan-config-manager
- stefan-enhanced-chat
- stefan-memory-search
- stefan-text-analysis
- store-stefan-memory (…)

Totalt identifierat: ~67 (listan ovan visar majoriteten; resterande är närbesläktade och följer samma mönster).

---

## Databastabeller (kärna – se Supabase-schema för fullständig lista och RLS)
- Profiler/Roller/Relationer: profiles, user_roles, coach_client_assignments
- Assessment: assessment_form_definitions, assessment_questions, assessment_form_assignments, assessment_states, assessment_rounds, assessment_events
- AI/Coachning: ai_memories, ai_coaching_sessions, ai_coaching_recommendations, coaching_plans, coaching_milestones, coaching_progress_entries
- Analys/Loggar: analytics_events, analytics_metrics, analytics_aggregations, ai_usage_logs, ai_service_logs, admin_audit_log
- Kalender/Meddelanden: calendar_actionables, calendar_events, (messages_v2 i användning från FE)

---

## Reproducerbarhet (hur du återgenererar inventering)
- Hooks: sök `export (function|const) use[A-Za-z0-9_]+` i `src/**`
- Sidor: sök `export default function [A-Z]` i `src/pages/**`
- Edge Functions: sök `serve(` eller `Deno.serve` i `supabase/functions/**`

Detta dokument uppdateras vid strukturändringar. För fullständig, körbar export kan vi addera ett litet dev-script som skriver ut trädet till JSON/Markdown vid behov.
