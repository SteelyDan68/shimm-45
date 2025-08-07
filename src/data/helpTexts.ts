// Centraliserad hjälptext-databas
export const helpTexts = {
  messages: {
    composeMessage: "Skriv och skicka meddelanden till andra användare. Välj mottagare från listan baserat på dina behörigheter.",
    aiAssisted: "Använd AI-assistenten för att få förslag på professionella svar. AI:n analyserar meddelandet och ger dig ett lämpligt svar.",
    conversations: "Alla dina konversationer visas här. Klicka på en konversation för att visa alla meddelanden.",
    messagePermissions: "Dina meddelandebehörigheter beror på din roll. Klienter kan bara skicka meddelanden till sina coaches.",
    onlineStatus: "Grön prick visar när användaren är online och aktiv i systemet.",
    readReceipts: "Dubbelcheckmarkeringar (✓✓) visar att meddelandet har lästs av mottagaren."
  },
  // Dashboard
  dashboard: {
    welcomeMessage: "Detta är din huvudöversikt där du kan se viktig information och snabbåtkomst till funktioner.",
    clientCount: "Antal aktiva klienter som du hanterar för närvarande.",
    recentActivity: "De senaste aktiviteterna och uppdateringarna för dina klienter.",
    quickActions: "Snabbknappar för de mest använda funktionerna.",
    velocityScore: "Din personliga utvecklingshastighet baserat på aktivitet och framsteg. Uppdateras automatiskt baserat på dina assessments och uppgifter.",
    completedTasks: "Antal uppgifter du har slutfört framgångsrikt. Visar din produktivitet och måluppfyllelse.",
    pendingTasks: "Uppgifter som väntar på att genomföras. Håll denna siffra låg för bäst flöde.",
    pathEntries: "Antal dokumenterade steg i din utvecklingsresa. Varje bedömning, AI-rekommendation och viktigt moment sparas här.",
    capacityBarometer: "Mäter din nuvarande kapacitet att ta sig an nya utmaningar baserat på stress, energi och befintlig arbetsbelastning.",
    nextSteps: "AI-genererade förslag på vad du bör fokusera på härnäst för optimal utveckling."
  },

  // Enhanced Dashboard
  enhancedDashboard: {
    journeyProgress: "Din totala utvecklingsresa mätt i procent. Baserat på genomförda assessments och aktiverade pillar-områden.",
    currentPhase: "Vilken fas av utvecklingsresan du befinner dig i just nu. Varje fas har olika fokusområden och mål.",
    stefanWidget: "Stefan är din AI-coach som ger personliga råd och uppmuntran baserat på din specifika situation.",
    quickOverview: "Snabböversikt över dina viktigaste mätvärden och framsteg.",
    pillarStatus: "Status för alla dina Six Pillars-områden. Färgkodning visar styrkor (grönt), utmaningar (orange) och kritiska områden (rött)."
  },

  // Stefan AI
  stefan: {
    introduction: "Stefan är din personliga AI-utvecklingscoach med fyra olika personligheter som anpassar sig efter dina behov.",
    mentor: "Stefan Mentorn - Ger vägledning, vishetsord och strategiska råd för långsiktig utveckling.",
    cheerleader: "Stefan Hejarklacksledaren - Uppmuntrar, motiverar och firar dina framsteg med entusiasm.",
    strategist: "Stefan Strategen - Analyserar data och ger konkreta, genomtänkta handlingsplaner.",
    friend: "Stefan Vännen - Erbjuder emotionellt stöd, empati och vardagliga råd i en avslappnad ton.",
    proactiveMessages: "Stefan skickar automatiska meddelanden baserat på din aktivitet, tid sedan senaste inloggning och utvecklingsfas.",
    contextualTips: "Tips och råd som anpassas efter vilken del av systemet du använder just nu."
  },

  // Client Profile
  clientProfile: {
    velocityScore: "Velocity Score mäter klientens utvecklingshastighet baserat på aktivitet, framsteg och engagemang. Skala 1-100.",
    clientName: "Klientens fullständiga namn som används i alla kommunikationer och rapporter.",
    email: "Primär e-postadress för kontakt och automatiska uppdateringar.",
    category: "Kategorisering av klient baserat på bransch eller verksamhetsområde.",
    status: "Nuvarande status: Aktiv (pågående samarbete), Inaktiv (pausat), Avslutad (avslutat samarbete).",
    socialHandles: "Sociala medier-konton för datainsamling och analys.",
    followerCounts: "Antal följare på respektive plattform, uppdateras automatiskt.",
    lastUpdate: "Senaste gången klientdata uppdaterades automatiskt.",
    aiInsights: "AI-genererade insikter baserat på klientens data och aktivitet.",
    dataCollection: "Automatisk insamling av data från sociala medier och andra källor.",
    pathTimeline: "Klientens utvecklingsresa med viktiga milstolpar och händelser."
  },

  // Six Pillars
  sixPillars: {
    systemOverview: "Six Pillars är ett utvecklingssystem med sex grundpelare för hållbar framgång och välmående.",
    pillarsOrder: "Pillarnas prioriteringsordning: Self Care (välmående) aktiveras automatiskt först, sedan Skills → Talent → Brand → Economy enligt behov.",
    selfCare: "Välmående och hälsa - grundläggande för hållbar prestanda och kreativitet. Aktiveras automatiskt för alla nya användare.",
    skills: "Färdigheter och tekniska kunskaper - kontinuerlig utveckling och kompetensutveckling.",
    talent: "Naturlig begåvning och kreativitet - identifiera och utveckla unika styrkor.",
    brand: "Personligt varumärke och synlighet - hur du uppfattas och presenterar dig.",
    economy: "Ekonomi och affärsverksamhet - intäkter, investeringar och finansiell hållbarhet.",
    overallScore: "Genomsnittlig poäng baserat på alla aktiverade pelare för denna klient.",
    pillarScore: "Poäng för denna specifika pelare baserat på senaste bedömningen (1-10 skala).",
    lastAssessment: "Datum för den senaste bedömningen av denna pelare.",
    pillarTrend: "Utvecklingstrend: Uppåtgående (förbättring), Nedåtgående (försämring), Stabil (oförändrad).",
    assessment: "Bedömning består av 20 frågor (15 skala-frågor + 5 textfrågor) som analyseras av AI för personliga rekommendationer.",
    heatmap: "Visuell översikt över alla pillar-områden med färgkodning: Grön (stark), Orange (utmaning), Röd (kritisk), Grå (obearbetad).",
    aiAnalysis: "AI analyserar dina svar och ger skräddarsydda råd, handlingsplaner och förbättringsförslag.",
    activePillars: "Endast aktiverade pelare visas i din översikt. Din coach bestämmer vilka områden som är relevanta för dig."
  },

  // Journey & Progress
  journey: {
    welcomePhase: "Upptäck var du står idag - genomför välkomstbedömningen för att få en helhetsbild av din situation.",
    pillarSelectionPhase: "Fördjupa dig inom viktiga livsområden - fokusera på de pillar-områden som är mest relevanta för dig.",
    deepDivePhase: "Utveckla specifika områden - arbeta intensivt med utvalda utvecklingsområden.",
    maintenancePhase: "Håll momentum och fortsätt växa - bibehåll framsteg och upptäck nya möjligheter.",
    journeyProgress: "Din utvecklingsresa mätt i procent baserat på genomförda assessments och aktiverade områden.",
    recommendedAssessments: "AI föreslår vilka bedömningar du bör göra härnäst baserat på din utvecklingsfas och tidigare resultat.",
    smartGuide: "Intelligent guide som visar din nuvarande position och ger förslag på nästa steg i utvecklingsresan.",
    nextSteps: "Dina rekommenderade nästa steg i utvecklingsresan baserat på dina genomförda bedömningar.",
    pillarSelection: "Efter välkomstbedömningen väljer du vilka av de sex Pelare (utvecklingsområden) du vill fokusera på."
  },

  // Welcome Assessment
  welcomeAssessment: {
    overview: "Omfattande välkomstbedömning som kartlägger din nuvarande livssituation och identifierar utvecklingsområden.",
    wheelOfLife: "Livets hjul - bedöm 8 viktiga livsområden på en skala 1-10 för att få en helhetsbild av din balans.",
    adaptiveQuestions: "Intelligenta frågor som anpassar sig baserat på dina tidigare svar för mer personliga insikter.",
    freeTextSection: "Möjlighet att beskriva din situation med egna ord för djupare AI-analys.",
    quickWins: "Identifiera områden där du snabbt kan göra positiva förändringar för omedelbar motivation.",
    aiAnalysis: "Omfattande AI-analys som skapar en personlig utvecklingsplan baserat på alla dina svar."
  },

  // Tasks
  tasks: {
    taskStatus: "Status: Planerad (ej påbörjad), Pågående (aktiv), Slutförd (avklarad), Avbruten (inställd).",
    priority: "Prioritet: Hög (brådskande), Medium (normal), Låg (kan vänta).",
    deadline: "Slutdatum för när uppgiften ska vara färdig.",
    aiGenerated: "Uppgiften skapades automatiskt av AI baserat på klientdata och behov.",
    linkedPathEntry: "Kopplad till en specifik händelse i klientens utvecklingsresa.",
    taskProgress: "Visar hur många uppgifter som är slutförda jämfört med totalt antal.",
    manualTasks: "Uppgifter som du eller din coach har skapat manuellt.",
    scheduler: "Intelligent schemaläggning som föreslår optimal timing för olika uppgifter."
  },


  // Analytics
  analytics: {
    overview: "Detaljerad analys av din utveckling och framsteg över tid med AI-genererade insikter.",
    sentimentTrend: "Utveckling av allmän sentiment och känslor över tid baserat på innehåll och kommentarer.",
    engagementRate: "Procent av följare som aktivt interagerar med innehåll (likes, kommentarer, delningar).",
    growthRate: "Tillväxttakt för följare och engagement över specificerad tidsperiod.",
    contentPerformance: "Hur väl olika typer av innehåll presterar jämfört med varandra.",
    platformComparison: "Jämförelse av prestanda mellan olika sociala medier-plattformar.",
    aiInsightsGenerated: "Antal AI-genererade insikter och rekommendationer baserat på data.",
    pillarAnalytics: "Analys av dina Six Pillars framsteg och utvecklingstrender över tid.",
    filters: "Anpassa tidsperiod och datatyper för mer specifik analys."
  },

  // Administration
  administration: {
    userRoles: "Användarroller: Superadmin (full åtkomst), Admin (hög åtkomst), Manager/Coach (klienthantering), Editor (redigering), User (grundläggande), Client (begränsad åtkomst).",
    
    // Coach-Client Relationships
    coachClientRelationships: "Här hanterar du tilldelningar mellan coaches och klienter. Du kan skapa nya relationer, flytta klienter mellan coaches och ta bort befintliga kopplingar.",
    createRelationship: "Skapa nya coach-client-relationer genom att välja en coach och en klient. Varje klient kan bara ha en aktiv coach åt gången.",
    transferClient: "Flytta en klient från en coach till en annan. Den gamla relationen inaktiveras automatiskt och en ny skapas.",
    unassignedClients: "Klienter som inte är tilldelade till någon coach. Klicka på ögat för att se klientprofilen eller använd 'Skapa relation' för att tilldela dem.",
    relationshipsList: "Lista över alla aktiva coach-client-relationer. Du kan visa klientprofiler, flytta klienter eller ta bort relationer härifrån.",
    relationshipStats: "Statistik över coaches, klienter och aktiva relationer i systemet för överblick och planering.",
    
    securitySettings: "Säkerhetsinställningar för kontoskydd och dataintegritet.",
    automationSettings: "Automatiska processer för datainsamling, rapporter och AI-analys.",
    dataExport: "Exportera all din data i maskinläsbart format enligt GDPR-rättigheter.",
    dataDeletion: "Begär permanent radering av all din personliga data enligt GDPR.",
    auditLog: "Spårning av alla GDPR-relaterade aktiviteter och datanvändning.",
    consentManagement: "Hantering av samtycken för cookies, analys och databehandling."
  },

  // Calendar
  calendar: {
    eventTypes: "Händelsetyper: Möte (schemalagd tid), Deadline (viktigt datum), Påminnelse (notis), Aktivitet (planerad handling).",
    clientVisibility: "Välj om klienten ska kunna se denna händelse i sin kalender.",
    aiPlanning: "AI kan föreslå optimal tidpunkt och typ av aktiviteter baserat på klientdata.",
    recurringEvents: "Återkommande händelser som upprepas enligt specificerat mönster.",
    notifications: "Automatiska påminnelser skickas via e-post eller i systemet."
  },

  // GDPR
  gdpr: {
    dataRights: "Dina lagstadgade rättigheter enligt GDPR att kontrollera din personliga data.",
    dataExport: "Få en komplett kopia av all data vi har om dig i maskinläsbart format.",
    rightToBeForgotten: "Begär att all din data raderas permanent från våra system.",
    consentHistory: "Historik över alla samtycken du gett eller återkallat över tid.",
    auditTrail: "Spårningslogg som visar alla åtgärder som vidtagits med din data."
  },

  // Navigation
  navigation: {
    breadcrumbs: "Visar din nuvarande position i systemet och ger snabb åtkomst till föregående sidor.",
    backButton: "Gå tillbaka till föregående sida eller vy.",
    homeButton: "Snabb åtkomst till din huvud-dashboard.",
    tabs: "Växla mellan olika vyer och funktioner inom samma område."
  },

  // Neuroplasticitet & Hjärnforskning (16-års-anpassat)
  neuroplasticity: {
    simple: "Din hjärna blir starkare när du tränar den - precis som en muskel! 🧠💪",
    detailed: "Forskare har visat att hjärnan skapar nya kopplingar när vi övar. Det kallas neuroplasticitet - vi kallar det 'hjärnvänlig träning'",
    taskGeneration: "Dessa uppgifter är designade enligt hjärnforskning för att hjälpa dig lära och växa på riktigt. Små steg → stora förändringar! 🚀",
    progressTracking: "Vi mäter hur din hjärna utvecklas genom små, konkreta framsteg baserat på vetenskaplig forskning 📊🧠",
    scienceBase: "Baserat på 30+ års hjärnforskning från Stanford, Harvard och MIT",
    principles: "Hjärnvänliga metoder som hjälper din hjärna skapa nya kopplingar för varaktig förändring"
  }
} as const;