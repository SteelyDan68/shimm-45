/**
 * SYSTEMKRITISK STATE MANAGEMENT RIKTLINJER
 * 
 * 🚨 TEAM DOKUMENTATION: Assessment State Management Best Practices
 * ===================================================================
 * 
 * PROBLEM SOM LÖSTS:
 * ✅ WelcomeAssessmentCard visar "Börja nu" även efter slutfört test
 * ✅ Ingen hantering av påbörjade men inte slutförda assessments
 * ✅ Användare fastnar i "loop back to dashboard" när de klickar "Börja nu"
 * ✅ Inkonsistent state mellan olika assessment-typer
 * 
 * LÖSNING IMPLEMENTERAD:
 * ==============================
 * 
 * 1. ROBUST STATE DETECTION
 *    - Kollar BÅDE completed OCH in-progress assessments
 *    - Använder AI analysis som marker för "truly completed"
 *    - Hanterar expired drafts (äldre än 7 dagar)
 * 
 * 2. CLEAR USER MESSAGING
 *    - Tydlig indikation av varje state
 *    - Användarens val finns alltid tillgängliga
 *    - Förklarar vad som händer vid varje action
 * 
 * 3. CONTROLLED USER JOURNEY
 *    - Ingen överraskande navigation
 *    - Användaren vet alltid vad som händer härnäst
 *    - Säkra state transitions med confirmations
 * 
 * ASSESSMENT STATES HANTERADE:
 * =============================
 * 
 * 🟢 NOT_STARTED: "Börja nu" knapp → Startar assessment
 * 🟡 IN_PROGRESS: "Fortsätt" + "Börja om" options
 * ✅ COMPLETED: "Gör om assessment" med clear motivation
 * ⏰ EXPIRED: "Börja om från början" (draft för gammal)
 * ❌ ERROR: Error handling med retry option
 * 
 * KRITISKA KONTROLLER:
 * ====================
 * 
 * ✅ AI Analysis Required: Endast assessments med AI-analys räknas som completed
 * ✅ Draft Expiration: Drafts äldre än 7 dagar flaggas som expired
 * ✅ Clear User Choice: Användaren bestämmer alltid nästa steg
 * ✅ State Consistency: samma logik för alla assessment types
 * ✅ Debug Logging: Console logs för development debugging
 * 
 * NÄSTA STEG FÖR TEAMET:
 * =======================
 * 
 * IMMEDIATE:
 * - Tillämpa samma pattern på SixPillars assessments
 * - Lägg till samma state management för alla assessment types
 * - Test: Verifiera att alla states fungerar korrekt
 * 
 * SHORT-TERM:
 * - Migrera ALLA assessment components till detta pattern
 * - Skapa universal AssessmentStateCard component
 * - Implementera auto-save för drafts
 * 
 * LONG-TERM:
 * - Assessment progress tracking med percentage
 * - Smart notifications för expired drafts
 * - Analytics på assessment completion rates
 * 
 * DATABASE SCHEMA REQUIREMENTS:
 * ==============================
 * 
 * COMPLETED ASSESSMENTS:
 * - welcome_assessments (ai_analysis NOT NULL = completed)
 * - pillar_assessments (ai_analysis NOT NULL = completed)
 * 
 * DRAFT ASSESSMENTS:
 * - assessment_form_assignments (completed_at IS NULL = in progress)
 * 
 * STATE DETECTION LOGIC:
 * - Check completed first (har AI analysis?)
 * - Check drafts second (completed_at IS NULL?)
 * - Default to not_started
 * 
 * USER JOURNEY UPDATES:
 * - user_journey_states uppdateras vid completion
 * - Completed assessments läggs till i completed_assessments array
 * - Journey progress ökas baserat på assessment type
 */

export const ASSESSMENT_STATE_PATTERNS = {
  // Standard states alla assessments ska hantera
  states: [
    'not_started',
    'in_progress', 
    'completed',
    'expired',
    'error'
  ],
  
  // Actions tillgängliga för varje state
  actions: {
    not_started: ['start'],
    in_progress: ['resume', 'restart'],
    completed: ['retake', 'view_results'], 
    expired: ['restart'],
    error: ['retry', 'contact_support']
  },
  
  // UI patterns för varje state
  ui_patterns: {
    not_started: {
      variant: 'primary',
      title: 'Börja din bedömning',
      description: 'Kort beskrivning av fördelarna',
      primary_action: 'Börja nu'
    },
    in_progress: {
      variant: 'warning',
      title: 'Du har påbörjat',
      description: 'Dina svar är sparade',
      primary_action: 'Fortsätt',
      secondary_action: 'Börja om'
    },
    completed: {
      variant: 'success', 
      title: 'Slutförd!',
      description: 'Motivering för att göra om',
      primary_action: 'Gör om assessment',
      secondary_action: 'Se resultat'
    }
  }
} as const;