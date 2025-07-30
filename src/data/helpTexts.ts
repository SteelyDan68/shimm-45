// Centraliserad hjälptext-databas
export const helpTexts = {
  // Dashboard
  dashboard: {
    welcomeMessage: "Detta är din huvudöversikt där du kan se viktig information och snabbåtkomst till funktioner.",
    clientCount: "Antal aktiva klienter som du hanterar för närvarande.",
    recentActivity: "De senaste aktiviteterna och uppdateringarna för dina klienter.",
    quickActions: "Snabbknappar för de mest använda funktionerna."
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

  // Five Pillars
  fivePillars: {
    pillarsOrder: "Pillarnas prioriteringsordning: Skills (färdigheter) → Talent (talang) → Brand (varumärke) → Economy (ekonomi) → Self Care (välmående). Skills kommer först för enklare start.",
    selfCare: "Välmående och hälsa - grundläggande för hållbar prestanda och kreativitet. Kommer sist i bedömningsordningen för att vara mindre överväldigande.",
    skills: "Färdigheter och tekniska kunskaper - kontinuerlig utveckling och kompetensutveckling. Första pillar i bedömningssekvensen för enkel start.",
    talent: "Naturlig begåvning och kreativitet - identifiera och utveckla unika styrkor.",
    brand: "Personligt varumärke och synlighet - hur du uppfattas och presenterar dig.",
    economy: "Ekonomi och affärsverksamhet - intäkter, investeringar och finansiell hållbarhet.",
    overallScore: "Genomsnittlig poäng baserat på alla aktiverade pelare för denna klient.",
    pillarScore: "Poäng för denna specifika pelare baserat på senaste bedömningen.",
    lastAssessment: "Datum för den senaste bedömningen av denna pelare.",
    pillarTrend: "Utvecklingstrend: Uppåtgående (förbättring), Nedåtgående (försämring), Stabil (oförändrad)."
  },

  // Tasks
  tasks: {
    taskStatus: "Status: Planerad (ej påbörjad), Pågående (aktiv), Slutförd (avklarad), Avbruten (inställd).",
    priority: "Prioritet: Hög (brådskande), Medium (normal), Låg (kan vänta).",
    deadline: "Slutdatum för när uppgiften ska vara färdig.",
    aiGenerated: "Uppgiften skapades automatiskt av AI baserat på klientdata och behov.",
    linkedPathEntry: "Kopplad till en specifik händelse i klientens utvecklingsresa.",
    taskProgress: "Visar hur många uppgifter som är slutförda jämfört med totalt antal."
  },

  // Messages
  messages: {
    composeMessage: "Skapa ett nytt meddelande till en annan användare i systemet.",
    messageThread: "Konversationstråd med alla relaterade meddelanden i kronologisk ordning.",
    aiAssisted: "Meddelandet innehåller AI-genererade förslag eller innehåll.",
    readStatus: "Visar om meddelandet har lästs av mottagaren.",
    messagePreferences: "Inställningar för hur du vill få notifikationer och hantera meddelanden."
  },

  // Analytics
  analytics: {
    sentimentTrend: "Utveckling av allmän sentiment och känslor över tid baserat på innehåll och kommentarer.",
    engagementRate: "Procent av följare som aktivt interagerar med innehåll (likes, kommentarer, delningar).",
    growthRate: "Tillväxttakt för följare och engagement över specificerad tidsperiod.",
    contentPerformance: "Hur väl olika typer av innehåll presterar jämfört med varandra.",
    platformComparison: "Jämförelse av prestanda mellan olika sociala medier-plattformar.",
    aiInsightsGenerated: "Antal AI-genererade insikter och rekommendationer baserat på data."
  },

  // Administration
  administration: {
    userRoles: "Användarroller: Superadmin (full åtkomst), Admin (hög åtkomst), Manager/Coach (klienthantering), Editor (redigering), User (grundläggande), Client (begränsad åtkomst).",
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
  }
} as const;