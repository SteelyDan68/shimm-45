/**
 * 📋 SYSTEMINTEGRITET BEST PRACTICES - IMPLEMENTATION GUIDE
 * 
 * Detta dokument ger konkreta best practices för att bevara systemintegritet
 * och tydliga rollstrukturer under utveckling.
 */

// ============= ROLLBASERAD ARKITEKTUR GUIDE =============

export const ROLE_ARCHITECTURE_GUIDE = {
  
  /**
   * 🏗️ ARKITEKTURPRINCIPER
   */
  principles: {
    single_source_of_truth: {
      description: "user_id är den enda källan till sanning för all användardata",
      implementation: [
        "Alla tabeller med användardata ska ha user_id kolumn",
        "Använd user_attributes för metadata och egenskaper",
        "Använd user_roles för rollhantering (ALDRIG direkt på profiles)",
        "coach_client_assignments för relationer mellan roller"
      ],
      examples: {
        correct: "SELECT * FROM tasks WHERE user_id = auth.uid()",
        incorrect: "SELECT * FROM tasks WHERE profile_id = (SELECT id FROM profiles...)"
      }
    },
    
    hierarchical_roles: {
      description: "Tydlig rollhierarki med arv och begränsningar",
      hierarchy: [
        { role: "superadmin", level: 100, inherits: ["admin", "coach", "client"] },
        { role: "admin", level: 80, inherits: ["coach", "client"] },
        { role: "coach", level: 60, inherits: ["client"] },
        { role: "client", level: 40, inherits: [] }
      ],
      implementation: [
        "Superadmin har god mode - kan se och göra allt",
        "Admin kan hantera organisationen och användare",
        "Coach kan bara se sina tilldelade klienter", 
        "Client kan bara se sin egen data"
      ]
    },
    
    defense_in_depth: {
      description: "Flera säkerhetslager som skyddar systemet",
      layers: [
        "Database RLS policies (första försvarslinjen)",
        "Application-level authorization (andra linjen)",
        "API/Edge function validation (tredje linjen)",
        "UI-level permission checks (fjärde linjen)"
      ]
    }
  },

  /**
   * 🔒 SÄKERHETSMÖNSTER
   */
  security_patterns: {
    rls_policies: {
      description: "Row Level Security policies skyddar data på databas-nivå",
      best_practices: [
        "Använd SECURITY DEFINER funktioner för rollkontroller",
        "Förhindra rekursiva RLS-policies",
        "Testa policies med olika roller",
        "Logga säkerhetsrelevanta händelser"
      ],
      example_policy: `
        CREATE POLICY "Users can only view their own data"
        ON public.user_data
        FOR SELECT
        USING (auth.uid() = user_id);
        
        CREATE POLICY "Admins can view all data"  
        ON public.user_data
        FOR SELECT
        USING (public.is_admin(auth.uid()));
      `
    },
    
    role_functions: {
      description: "Centraliserade funktioner för rollkontroller",
      required_functions: [
        "has_role(user_id, role) - Kontrollerar specifik roll",
        "is_admin(user_id) - Kontrollerar admin-rättigheter", 
        "is_superadmin(user_id) - Kontrollerar superadmin",
        "superadmin_god_mode(user_id) - Full åtkomst för superadmin"
      ],
      implementation_pattern: `
        CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
        RETURNS BOOLEAN
        LANGUAGE sql
        STABLE SECURITY DEFINER
        SET search_path = public
        AS $$
          SELECT EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = _user_id AND role = _role
          )
        $$;
      `
    }
  }
};

// ============= UTVECKLINGS BEST PRACTICES =============

export const DEVELOPMENT_BEST_PRACTICES = {
  
  /**
   * 🚀 PRE-DEVELOPMENT CHECKLIST
   */
  before_coding: [
    {
      task: "Definiera rollbaserad åtkomst",
      description: "Vilka roller ska kunna använda funktionen?",
      action: "Uppdatera ROLE_MATRIX med nya permissions"
    },
    {
      task: "Planera datamodell", 
      description: "Hur ska data relatera till user_id?",
      action: "Skapa ER-diagram som visar user_id kopplingar"
    },
    {
      task: "Identifiera säkerhetsrisker",
      description: "Vilka är potentiella säkerhetshål?", 
      action: "Genomför hot-modellering för funktionen"
    },
    {
      task: "Planera navigation",
      description: "Var ska funktionen vara tillgänglig?",
      action: "Uppdatera navigation.ts med rollfilter"
    }
  ],

  /**
   * 🔧 DURING DEVELOPMENT
   */
  coding_standards: {
    database_changes: [
      "Skapa ALLTID RLS policies för nya tabeller",
      "Använd user_id kolumn för användarspecifik data",
      "Testa RLS policies med olika roller",
      "Dokumentera säkerhetsöverväganden"
    ],
    
    frontend_development: [
      "Använd UnifiedAuthProvider för rollkontroller",
      "Implementera loading states för auth",
      "Dölj UI-element som användaren inte har åtkomst till",
      "Visa informativa meddelanden vid behörighetsproblem"
    ],
    
    api_development: [
      "Validera användarbehörigheter i varje endpoint", 
      "Använd Supabase client metoder (ej raw SQL)",
      "Logga säkerhetsrelevanta API-anrop",
      "Implementera rate limiting för känsliga operationer"
    ]
  },

  /**
   * ✅ POST-DEVELOPMENT VALIDATION
   */
  testing_checklist: [
    {
      category: "Rollbaserad testning",
      tests: [
        "Testa funktionen med varje roll (superadmin, admin, coach, client)",
        "Verifiera att data isoleras korrekt mellan roller",
        "Kontrollera att admin inte kan se superadmin-specifik data",
        "Testa att coach bara ser sina tilldelade klienter"
      ]
    },
    {
      category: "Säkerhetstestning", 
      tests: [
        "Försök komma åt data som inte tillhör användaren",
        "Testa med ogiltig auth-token",
        "Kontrollera error handling för behörighetsproblem",
        "Verifiera att känslig data inte läcker i felmeddelanden"
      ]
    },
    {
      category: "Integration testing",
      tests: [
        "Testa navigation mellan sidor med olika roller",
        "Verifiera att betaOnly funktioner bara syns för Anna",
        "Kontrollera att dashboards renderar korrekt för varje roll",
        "Testa utloggning och inloggning med olika roller"
      ]
    }
  ]
};

// ============= ROLLOPTIMERING REKOMMENDATIONER =============

export const ROLE_OPTIMIZATION_ROADMAP = {
  
  /**
   * 🎯 OMEDELBAR ÅTGÄRDER (Nästa sprint)
   */
  immediate_priorities: [
    {
      priority: "KRITISK",
      title: "Konsolidera 'user' rollen",
      description: "Migrera alla 'user' roller till 'client' för konsistens",
      implementation_steps: [
        "1. Identifiera alla användare med 'user' roll",
        "2. Skapa migration script som uppdaterar till 'client'", 
        "3. Testa att alla funktioner fungerar med ny rollstruktur",
        "4. Ta bort 'user' från app_role enum"
      ],
      sql_migration: `
        -- Migrera user roll till client
        UPDATE user_roles 
        SET role = 'client' 
        WHERE role = 'user';
        
        -- Verifiera migration
        SELECT role, COUNT(*) FROM user_roles GROUP BY role;
      `,
      estimated_effort: "2-4 timmar"
    },
    
    {
      priority: "HÖG",
      title: "Förstärk coach-klient isolation",
      description: "Säkerställ att coaches bara kan se sina tilldelade klienter",
      implementation_steps: [
        "1. Uppdatera alla RLS policies som rör klientdata",
        "2. Lägg till coach_client_assignments validering",
        "3. Testa isolation mellan olika coaches",
        "4. Uppdatera frontend att använda coach-assignments"
      ],
      rls_policy_example: `
        CREATE POLICY "Coaches can only view assigned clients"
        ON public.profiles
        FOR SELECT
        USING (
          auth.uid() = id OR
          public.is_admin(auth.uid()) OR
          (
            public.has_role(auth.uid(), 'coach') AND
            EXISTS (
              SELECT 1 FROM coach_client_assignments cca
              WHERE cca.coach_id = auth.uid() 
                AND cca.client_id = profiles.id
                AND cca.is_active = true
            )
          )
        );
      `,
      estimated_effort: "4-8 timmar"
    },
    
    {
      priority: "MEDIUM",
      title: "Beta-funktioner kodstruktur",
      description: "Förbättra hur beta-funktioner hanteras i koden",
      implementation_steps: [
        "1. Skapa centraliserad beta-feature manager",
        "2. Ersätt hardkodad 'Anna Andersson' logik med flexibel betaUsers",
        "3. Lägg till beta-feature toggles i databas",
        "4. Implementera UI för att hantera beta-användare"
      ],
      estimated_effort: "3-6 timmar"
    }
  ],

  /**
   * 🛣️ LÅNGSIKTIGA FÖRBÄTTRINGAR (Nästa månader)
   */
  long_term_improvements: [
    {
      title: "Dynamisk behörighetsmatris",
      description: "Ersätt hårdkodad PERMISSIONS med databasdriven behörighetsmatris",
      benefits: [
        "Flexibel behörighetshantering utan kodändringar",
        "Granulär kontroll över vad olika roller kan göra",
        "Auditloggar för behörighetsändringar",
        "A/B testing av behörighetsmodeller"
      ],
      implementation_approach: "Ny tabell: role_permissions med koppling till actions och resources"
    },
    
    {
      title: "Rollbaserad routing",
      description: "Automatisk routing baserat på användarens primära roll",
      benefits: [
        "Smidigare användarupplevelse",
        "Mindre förvirring om vilka sidor som är tillgängliga", 
        "Automatisk omdirigering efter inloggning",
        "Rollspecifika landningssidor"
      ],
      implementation_approach: "Utöka React Router med role-based route guards"
    },
    
    {
      title: "Multi-tenant arkitektur",
      description: "Stöd för flera organisationer med isolerad data",
      benefits: [
        "Skalbarhet för flera kunder",
        "Bättre dataisolering",
        "Organisation-specifika konfigurationer",
        "Separat billing per organisation"
      ],
      implementation_approach: "Lägg till organization_id i alla relevanta tabeller + RLS policies"
    }
  ],

  /**
   * 📊 SUCCESS METRICS
   */
  success_metrics: {
    security: [
      "Antal säkerhetsincidenter per månad",
      "Tid från upptäckt till fix av säkerhetsproblem",
      "Antal failed authorization attempts", 
      "Code coverage för säkerhetstester"
    ],
    usability: [
      "Antal support tickets relaterade till behörigheter",
      "Användartillfredsställelse per roll",
      "Tid från registrering till produktiv användning",
      "Antal användarfel relaterade till rollförvirring"
    ],
    maintainability: [
      "Tid att implementera nya rollbaserade funktioner",
      "Antal buggar införda vid rollförändringar",
      "Code complexity metrics för auth-relaterad kod",
      "Utvecklartillfredsställelse med auth-systemet"
    ]
  }
};

// ============= EMERGENCY PROCEDURES =============

export const EMERGENCY_PROCEDURES = {
  
  /**
   * 🚨 SÄKERHETSINCIDENT RESPONS
   */
  security_incident_response: {
    immediate_actions: [
      "1. Identifiera omfattningen av incidenten",
      "2. Isolera komprometterade konton",
      "3. Logga ut alla användare om nödvändigt",
      "4. Backup av aktuell data innan ändringar",
      "5. Dokumentera alla åtgärder i incident log"
    ],
    
    investigation_steps: [
      "1. Analysera admin_audit_log för onormal aktivitet",
      "2. Kontrollera user_roles för oauktoriserade rollförändringar",
      "3. Granska RLS policy effektivitet",
      "4. Identifiera potentiella systemsårbarheter",
      "5. Kommunicera med berörda användare"
    ],
    
    recovery_procedures: [
      "1. Återställ komprometterade konton",
      "2. Uppdatera säkerhetspolicies om nödvändigt",
      "3. Stärk övervakning av kritiska funktioner",
      "4. Genomför säkerhetsgenomgång av kod",
      "5. Utbilda team om lärdomar från incidenten"
    ]
  },

  /**
   * 🔧 ROLLPROBLEM FELSÖKNING
   */
  role_troubleshooting: {
    common_issues: {
      user_cant_access_feature: {
        diagnosis: [
          "Kontrollera user_roles tabellen för användarens roller",
          "Verifiera att RLS policies tillåter åtkomst",
          "Kolla navigation.ts för rätt rollfilter",
          "Testa med superadmin för att isolera problemet"
        ],
        solutions: [
          "Tilldela rätt roll till användaren",
          "Uppdatera RLS policy om den är för restriktiv",
          "Lägg till roll i navigation konfiguration",
          "Kontrollera frontend behörighetskontroller"
        ]
      },
      
      admin_cant_see_all_users: {
        diagnosis: [
          "Kontrollera is_admin() funktion",
          "Verifiera RLS policies på profiles tabellen",
          "Kolla coach_client_assignments för begränsningar",
          "Testa med superadmin för jämförelse"
        ],
        solutions: [
          "Uppdatera admin RLS policies",
          "Kontrollera att admin-roll är korrekt tilldelad",
          "Säkerställ att SECURITY DEFINER fungerar",
          "Rensa cache/session och testa igen"
        ]
      }
    }
  }
};

export default {
  ROLE_ARCHITECTURE_GUIDE,
  DEVELOPMENT_BEST_PRACTICES, 
  ROLE_OPTIMIZATION_ROADMAP,
  EMERGENCY_PROCEDURES
};