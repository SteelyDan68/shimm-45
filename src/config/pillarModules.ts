import { PillarModuleConfig, PillarKey } from '@/types/sixPillarsModular';

// Prioriteringsordning för pillars (Self Care först för att visa självskattning direkt)
export const PILLAR_PRIORITY_ORDER: PillarKey[] = [
  'self_care',
  'skills',
  'talent', 
  'brand',
  'economy',
  'open_track'
];

// Define questions and scoring logic for each pillar module
export const PILLAR_MODULES: Record<PillarKey, PillarModuleConfig> = {
  self_care: {
    key: 'self_care',
    name: 'Self Care',
    description: 'Utvärdera din grundläggande välbefinnande och livskvalitet. Detta pillar fokuserar på de fundamentala behoven som måste vara tillgodosedda för att du ska kunna fungera optimalt.',
    icon: '💚',
    color: '#10B981',
    questions: [
      // === SEKTION 1: GRUNDLÄGGANDE VÄLBEFINNANDE ===
      // Stress och emotionell hälsa (i jagperspektiv med procentskala)
      { key: 'stress_hantering', text: 'Jag hanterar stress bra i vardagen', type: 'slider', min: 0, max: 100, weight: 1.3 },
      { key: 'energiniva', text: 'Min energinivå är utmärkt på dagarna', type: 'slider', min: 0, max: 100, weight: 1.3 },
      { key: 'sovkvalitet', text: 'Min sömn är bra och jag vaknar utvilad', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'emotionell_balans', text: 'Jag känner mig emotionellt balanserad', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'tid_for_vila', text: 'Jag har tillräckligt med tid för vila och återhämtning', type: 'slider', min: 0, max: 100, weight: 1.1 },
      
      // Fysisk hälsa och välbefinnande
      { key: 'fysisk_aktivitet', text: 'Jag är nöjd med min fysiska aktivitetsnivå', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'kostvanor', text: 'Jag äter på ett sätt som får mig att må bra', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'halsorutiner', text: 'Jag följer hälsosamma rutiner regelbundet', type: 'slider', min: 0, max: 100, weight: 1.0 },
      
      // === SEKTION 2: RESURSER & MÖJLIGHETER (SJÄLVEFFEKTIVITET) ===
      // Socialt stöd och relationer
      { key: 'socialt_stod', text: 'Jag känner mig stöttad av människor omkring mig', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'nara_relationer', text: 'Jag har människor i mitt liv som verkligen bryr sig om mig', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'professionellt_natverk', text: 'Jag har tillgång till människor som kan hjälpa mig professionellt', type: 'slider', min: 0, max: 100, weight: 1.0 },
      
      // Ekonomiska och praktiska resurser
      { key: 'ekonomisk_stabilitet', text: 'Jag känner mig ekonomiskt trygg för framtiden', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'praktiska_resurser', text: 'Jag har tillgång till de praktiska resurser jag behöver', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'teknisk_kompetens', text: 'Jag känner mig bekväm med teknik och digitala verktyg', type: 'slider', min: 0, max: 100, weight: 0.9 },
      
      // Personliga styrkor och förmågor
      { key: 'problemlosning', text: 'Jag är bra på att lösa problem som uppstår', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'anpassningsformaga', text: 'Jag anpassar mig lätt till nya situationer', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'sjalvkansla', text: 'Jag har god självkänsla och självförtroende', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'framtidsoptimism', text: 'Jag ser ljust på min framtid', type: 'slider', min: 0, max: 100, weight: 1.1 },
      
      // === SEKTION 3: LIVSKVALITET & BALANS ===
      // Work-life balance och gränser
      { key: 'arbete_vila_balans', text: 'Jag har en bra balans mellan arbete och vila', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'personliga_granser', text: 'Jag är bra på att sätta och hålla personliga gränser', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'meningsfullhet', text: 'Jag känner att mitt liv har mening och syfte', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'kreativitet_uttryck', text: 'Jag har utrymme för kreativitet och personligt uttryck', type: 'slider', min: 0, max: 100, weight: 1.0 },
      
      // Lärande och utveckling
      { key: 'larande_motivation', text: 'Jag känner motivation att lära mig nya saker', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'personlig_tillvaxt', text: 'Jag utvecklas som person på ett sätt som känns rätt', type: 'slider', min: 0, max: 100, weight: 1.1 },
      
      // === SEKTION 4: DJUPANALYS (WHEEL OF LIFE INTEGRATION) ===
      // Öppna frågor för holistisk förståelse
      { key: 'livsomraden_analys', text: 'Bedöm dina 8 livsområden (Karriär, Ekonomi, Hälsa, Relationer, Personlig utveckling, Rekreation, Fysisk miljö, Bidrag till samhället). Vilket område behöver mest uppmärksamhet just nu?', type: 'text', weight: 0.8 },
      { key: 'styrkor_resurser', text: 'Vilka är dina 3 största styrkor/resurser som du kan bygga vidare på för att förbättra ditt välbefinnande?', type: 'text', weight: 0.8 },
      { key: 'energigivare', text: 'Vilka aktiviteter, människor eller miljöer ger dig mest energi och välbefinnande?', type: 'text', weight: 0.7 },
      { key: 'stress_triggers', text: 'Vad är dina största stressutlösare och vilka tidiga varningssignaler märker du?', type: 'text', weight: 0.7 },
      { key: 'support_system', text: 'Beskriv ditt stödsystem - vem vänder du dig till vid olika typer av utmaningar?', type: 'text', weight: 0.7 },
      { key: 'framtidsvisioner', text: 'Hur ser ditt ideala liv ut om 3 år? Vad behöver förändras för att komma dit?', type: 'text', weight: 0.6 },
      { key: 'tidigare_framgangar', text: 'Berätta om en period när du mådde riktigt bra. Vad utmärkte den tiden?', type: 'text', weight: 0.6 },
      { key: 'hinder_mojligheter', text: 'Vilka är dina största hinder just nu, och vilka oupptäckta möjligheter finns det?', type: 'text', weight: 0.6 }
    ],
    scoreCalculation: (answers) => {
      let totalScore = 0;
      let totalWeight = 0;

      // Nya procentbaserade frågor (0-100% skala) - uppdaterad lista med alla nya frågor
      const percentageKeys = ['stress_hantering', 'energiniva', 'sovkvalitet', 'emotionell_balans', 'tid_for_vila', 
                             'fysisk_aktivitet', 'kostvanor', 'halsorutiner', 'socialt_stod', 'nara_relationer', 
                             'professionellt_natverk', 'ekonomisk_stabilitet', 'praktiska_resurser', 'teknisk_kompetens',
                             'problemlosning', 'anpassningsformaga', 'sjalvkansla', 'framtidsoptimism',
                             'arbete_vila_balans', 'personliga_granser', 'meningsfullhet', 'kreativitet_uttryck',
                             'larande_motivation', 'personlig_tillvaxt'];
      
      percentageKeys.forEach(key => {
        const question = PILLAR_MODULES.self_care.questions.find(q => q.key === key);
        if (question && typeof answers[key] === 'number') {
          const percentage = answers[key]; // 0-100
          // Konvertera till poäng där 50% = neutral (0), <50% = negativ, >50% = positiv
          const normalizedScore = (percentage - 50) / 50; // Range: -1 till +1
          const finalScore = Math.max(-1, Math.min(1, normalizedScore)) * 5 + 5; // Range: 0-10
          
          totalScore += finalScore * (question.weight || 1);
          totalWeight += (question.weight || 1);
        }
      });

      // Fallback för gamla hinder-data om det finns
      const hinderKeys = ['mediestress', 'social_media_press', 'kritik_hat', 'prestationsangest', 'tidsbrist', 'balans_arbete_privatliv', 'ekonomisk_oro', 'relationsproblem', 'halsoproblem', 'perfektionism', 'kontrollbehov', 'ensamhet'];
      const hinderScores = hinderKeys.filter(key => typeof answers[key] === 'number').map(key => answers[key]);
      if (hinderScores.length > 0) {
        const avgHinder = hinderScores.reduce((a, b) => a + b, 0) / hinderScores.length;
        const hinderScore = (10 - avgHinder) / 10 * 10; // Inverterar skalan
        totalScore += hinderScore * 0.3;
        totalWeight += 0.3;
      }

      // Functional access score (gamla systemet som backup)
      const functionalKeys = ['mat_access', 'sovplats_access', 'hygien_access', 'kommunikation_access'];
      const functionalValues = functionalKeys.filter(key => answers[key]).map(key => answers[key]);
      if (functionalValues.length > 0) {
        const yesCount = functionalValues.filter(v => v === 'ja').length;
        const functionalScore = yesCount / functionalValues.length * 10;
        totalScore += functionalScore * 0.2;
        totalWeight += 0.2;
      }

      return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 10) / 10 : 5;
    },
    insightGeneration: (answers, score) => {
      const criticalAreas = [];
      const strongAreas = [];
      
      // Analysera hinder
      const hinderKeys = ['mediestress', 'social_media_press', 'kritik_hat', 'prestationsangest', 'tidsbrist', 'balans_arbete_privatliv', 'ekonomisk_oro', 'relationsproblem', 'halsoproblem', 'sjalvkansla', 'perfektionism', 'kontrollbehov', 'ensamhet'];
      hinderKeys.forEach(key => {
        const value = answers[key];
        if (typeof value === 'number') {
          if (value >= 8) criticalAreas.push(key);
          if (value <= 3) strongAreas.push(key);
        }
      });
      
      return {
        criticalAreas,
        strongAreas,
        overallStatus: score >= 7 ? 'strong' : score >= 5 ? 'moderate' : 'needs_attention'
      };
    }
  },

  skills: {
    key: 'skills',
    name: 'Färdigheter & Utveckling',
    description: 'Utvärdera och utveckla dina professionella kompetenser strategiskt med neuroplastisk precision. Fokuserar på evidensbaserad kompetensutveckling och optimal inlärning.',
    icon: '🎯',
    color: '#3B82F6',
    questions: [
      // === SEKTION 1: NUVARANDE KOMPETENSNIVÅ & SJÄLVFÖRTROENDE ===
      { key: 'kompetens_karnomrade', text: 'Jag känner mig mycket kompetent inom mitt huvudområde', type: 'slider', min: 0, max: 100, weight: 1.3 },
      { key: 'praktisk_tillämpning', text: 'Jag tillämpar mina färdigheter effektivt i verkliga situationer', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'inlarningsformaga', text: 'Jag lär mig nya färdigheter snabbt och effektivt', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'sjalvfortroende_expertis', text: 'Jag känner mig trygg i min professionella expertis', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'kunskapsbredd', text: 'Jag har bred kunskap som kompletterar min kärnkompetens', type: 'slider', min: 0, max: 100, weight: 1.0 },
      
      // === SEKTION 2: UTVECKLINGSPROCESS & NEUROPLASTISK METODIK ===
      { key: 'strukturerad_utveckling', text: 'Jag följer en strukturerad plan för min kompetensutveckling', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'feedback_integration', text: 'Jag tar emot och använder feedback för att förbättras', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'deliberate_practice', text: 'Jag övar mina färdigheter medvetet och systematiskt', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'reflektion_larande', text: 'Jag reflekterar regelbundet över min utveckling', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'progressivt_utmanande', text: 'Jag utmanar mig kontinuerligt med svårare uppgifter', type: 'slider', min: 0, max: 100, weight: 1.1 },
      
      // === SEKTION 3: PROBLEMLÖSNING & KREATIV TILLÄMPNING ===
      { key: 'komplexa_utmaningar', text: 'Jag känner mig trygg när jag möter komplexa problem', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'innovativ_problemlosning', text: 'Jag hittar ofta kreativa lösningar på svåra problem', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'anpassningsformaga', text: 'Jag anpassar mig snabbt till nya verktyg och metoder', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'kritiskt_tankande', text: 'Jag analyserar problem grundligt innan jag löser dem', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'experimentell_attityd', text: 'Jag vågar testa nya metoder och tillvägagångssätt', type: 'slider', min: 0, max: 100, weight: 1.0 },
      
      // === SEKTION 4: KUNSKAPSDELNING & SAMARBETSLÄRANDE ===
      { key: 'kunskapsdelning', text: 'Jag delar gärna min kunskap och hjälper andra att utvecklas', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'samarbetslärande', text: 'Jag lär mig effektivt tillsammans med andra kollegor', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'mentorskap', text: 'Jag är bra på att både ge och ta emot mentorskap', type: 'slider', min: 0, max: 100, weight: 0.9 },
      { key: 'tvärfunktionellt_arbete', text: 'Jag samarbetar väl med människor från andra områden', type: 'slider', min: 0, max: 100, weight: 0.9 },
      
      // === SEKTION 5: MÅLSÄTTNING & PROGRESSMÄTNING ===
      { key: 'tydliga_mal', text: 'Jag har tydliga och mätbara mål för min utveckling', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'progress_tracking', text: 'Jag följer upp min utveckling systematiskt och regelbundet', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'milstolpe_planering', text: 'Jag bryter ner stora mål i mindre, hanterbara steg', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'långsiktig_vision', text: 'Jag har en klar vision för var jag vill vara om 2-3 år', type: 'slider', min: 0, max: 100, weight: 1.0 },
      
      // === SEKTION 6: DJUPANALYS & NEUROPLASTISK PLANERING ===
      { key: 'karnexpertis_analys', text: 'Definiera dina 3 främsta expertområden och vad som gör dig unik. Vilka specifika kunskaper/färdigheter utgör din konkurrensfördel?', type: 'text', weight: 0.8 },
      { key: 'skill_gap_kartlaggning', text: 'Kartlägg de 5 viktigaste färdigheterna du behöver utveckla för att nå nästa nivå. Prioritera dem efter påverkan på dina mål.', type: 'text', weight: 0.8 },
      { key: 'larande_optimering', text: 'Beskriv din optimala inlärningsmiljö och -metod. När lär du dig bäst och vilka faktorer maximerar din neuroplastiska potential?', type: 'text', weight: 0.7 },
      { key: 'utvecklingshinder', text: 'Identifiera de största hindren för din kompetensutveckling. Vad stoppar dig från att utvecklas snabbare och hur kan dessa övervinnas?', type: 'text', weight: 0.7 },
      { key: 'expertis_framtidsvision', text: 'Beskriv din vision som expert om 2-3 år. Vilken typ av problem vill du lösa och vilken påverkan vill du ha i din bransch?', type: 'text', weight: 0.6 },
      { key: 'neuroplastisk_strategi', text: 'Hur skulle en 66-dagars intensiv utvecklingsresa se ut för dig? Vilka dagliga micro-practices skulle maximera din kompetensutveckling?', type: 'text', weight: 0.6 }
    ],
    scoreCalculation: (answers: Record<string, any>) => {
      let totalScore = 0;
      let totalWeight = 0;
      
      // Procentbaserade frågor (0-100% skala)
      const percentageKeys = ['kompetens_karnomrade', 'praktisk_tillämpning', 'inlarningsformaga', 'sjalvfortroende_expertis', 
                             'kunskapsbredd', 'strukturerad_utveckling', 'feedback_integration', 'deliberate_practice', 
                             'reflektion_larande', 'progressivt_utmanande', 'komplexa_utmaningar', 'innovativ_problemlosning',
                             'anpassningsformaga', 'kritiskt_tankande', 'experimentell_attityd', 'kunskapsdelning',
                             'samarbetslärande', 'mentorskap', 'tvärfunktionellt_arbete', 'tydliga_mal', 'progress_tracking',
                             'milstolpe_planering', 'långsiktig_vision'];
      
      percentageKeys.forEach(key => {
        const question = PILLAR_MODULES.skills.questions.find(q => q.key === key);
        if (question && typeof answers[key] === 'number') {
          const percentage = answers[key]; // 0-100
          // Konvertera till poäng där 50% = neutral (0), <50% = negativ, >50% = positiv
          const normalizedScore = (percentage - 50) / 50; // Range: -1 till +1
          const finalScore = Math.max(-1, Math.min(1, normalizedScore)) * 5 + 5; // Range: 0-10
          
          totalScore += finalScore * (question.weight || 1);
          totalWeight += (question.weight || 1);
        }
      });
      
      return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 10) / 10 : 5;
    },
    insightGeneration: (answers: Record<string, any>, score: number) => {
      const criticalAreas = [];
      const strongAreas = [];
      
      // Analysera utvecklingsområden baserat på nya procentskalan
      const percentageKeys = ['kompetens_karnomrade', 'praktisk_tillämpning', 'inlarningsformaga', 'sjalvfortroende_expertis', 
                             'kunskapsbredd', 'strukturerad_utveckling', 'feedback_integration', 'deliberate_practice', 
                             'reflektion_larande', 'progressivt_utmanande', 'komplexa_utmaningar', 'innovativ_problemlosning',
                             'anpassningsformaga', 'kritiskt_tankande', 'experimentell_attityd', 'kunskapsdelning',
                             'samarbetslärande', 'mentorskap', 'tvärfunktionellt_arbete', 'tydliga_mal', 'progress_tracking',
                             'milstolpe_planering', 'långsiktig_vision'];
      
      percentageKeys.forEach(key => {
        const value = answers[key];
        if (typeof value === 'number') {
          if (value <= 30) criticalAreas.push(key); // 30% eller lägre = kritiskt område
          if (value >= 80) strongAreas.push(key);   // 80% eller högre = styrkeområde
        }
      });
      
      return {
        criticalAreas,
        strongAreas,
        overallStatus: score >= 7 ? 'strong' : score >= 5 ? 'moderate' : 'needs_attention',
        focusArea: answers.karnexpertis_analys || '',
        developmentPlan: answers.neuroplastisk_strategi || ''
      };
    }
  },

  talent: {
    key: 'talent',
    name: 'Talang & Styrkor',
    description: 'Upptäck och maximera dina naturliga begåvningar med neuroplastisk precision. Fokuserar på att identifiera, utveckla och strategiskt utnyttja det som gör dig exceptionell.',
    icon: '⭐',
    color: '#F59E0B',
    questions: [
      // === SEKTION 1: TALANGIDENTIFIERING & NATURLIG BEGÅVNING ===
      { key: 'naturlig_begavning', text: 'Jag vet tydligt vad jag är naturligt begåvad för', type: 'slider', min: 0, max: 100, weight: 1.3 },
      { key: 'anstrangningslost_excellens', text: 'Jag presterar lätt inom mina talangområden medan andra kämpar', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'extern_bekraftelse', text: 'Andra uppmärksammar och berömer regelbundet mina specifika styrkor', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'intuitivt_masterskap', text: 'Jag förstår vissa saker intuitivt utan att behöva träna mycket', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'snabb_inlarning', text: 'Jag lär mig exponentiellt snabbare inom vissa områden', type: 'slider', min: 0, max: 100, weight: 1.1 },
      
      // === SEKTION 2: FLOW-TILLSTÅND & OPTIMAL PRESTANDA ===
      { key: 'flow_frekvens', text: 'Jag hamnar ofta i flow-tillstånd där tiden bara försvinner', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'energi_fran_talanger', text: 'Mina talanger ger mig energi istället för att trötta ut mig', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'effortless_state', text: 'Jag känner mig som "i min rätta element" när jag använder mina talanger', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'optimal_prestanda', text: 'Jag presterar på min högsta nivå när jag får använda mina talanger', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'naturlig_rytm', text: 'Jag hittar naturligt den optimala rytmen och metoden inom mina talangområden', type: 'slider', min: 0, max: 100, weight: 1.0 },
      
      // === SEKTION 3: STRATEGISKT TALANTUTNYTTJANDE ===
      { key: 'dagligt_utnyttjande', text: 'Jag använder mina största talanger dagligen i mitt arbete/liv', type: 'slider', min: 0, max: 100, weight: 1.3 },
      { key: 'medveten_utveckling', text: 'Jag investerar medvetet tid i att utveckla mina starkaste områden', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'progressiv_utmaning', text: 'Jag utmanar kontinuerligt mina talanger med svårare uppgifter', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'strategisk_fokusering', text: 'Jag fokuserar mer på att utveckla styrkor än att fixa svagheter', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'talang_kombinationer', text: 'Jag kombinerar mina talanger på unika sätt för maximal påverkan', type: 'slider', min: 0, max: 100, weight: 1.0 },
      
      // === SEKTION 4: AUTENTICITET & PASSION ===
      { key: 'akta_sjalv', text: 'Jag känner mig som min äkta själv när jag använder mina talanger', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'inre_motivation', text: 'Jag motiveras inifrån av att utveckla och använda mina talanger', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'djup_tillfredsställelse', text: 'Jag känner djup glädje och tillfredsställelse från mina talangområden', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'naturlig_passion', text: 'Min passion för mina talangområden kommer naturligt och uthålligt', type: 'slider', min: 0, max: 100, weight: 1.0 },
      
      // === SEKTION 5: VÄRDESKAPANDE & UNIK CONTRIBUTION ===
      { key: 'unikt_bidrag', text: 'Mina talanger bidrar med något unikt som andra inte kan erbjuda', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'varde_for_andra', text: 'Mina talanger skapar tydligt och mätbart värde för andra', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'eftertragade_expertis', text: 'Människor söker aktivt upp mig för mina specifika talanger', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'monetär_värdering', text: 'Jag kan få bra betalt för mina talanger och expertis', type: 'slider', min: 0, max: 100, weight: 0.9 },
      
      // === SEKTION 6: DJUPANALYS & NEUROPLASTISK UTVECKLING ===
      { key: 'signatur_talanger', text: 'Identifiera dina 3 mest utmärkande talanger. Beskriv detaljerat vad som gör dig exceptionell inom dessa områden och hur de manifesteras.', type: 'text', weight: 0.8 },
      { key: 'anstrangningslosa_prestationer', text: 'Beskriv konkreta prestationer som kändes nästan för lätta för dig. Vad är det andra kämpar med som du gör naturligt?', type: 'text', weight: 0.7 },
      { key: 'barndom_indikatorer', text: 'Vilka tidiga tecken på dina talanger såg du redan som barn? Beskriv specifika exempel och mönster.', type: 'text', weight: 0.6 },
      { key: 'energigivande_aktiviteter', text: 'Vilka specifika aktiviteter inom dina talangområden ger dig mest energi och får dig att känna dig fullt levande?', type: 'text', weight: 0.6 },
      { key: 'talanggap_analys', text: 'Var finns det outnyttjad potential i dina talanger? Hur skulle du kunna utveckla dem till nästa nivå?', type: 'text', weight: 0.6 },
      { key: 'neuroplastisk_talangutveckling', text: 'Designa en 66-dagars intensiv talangutvecklingsplan. Vilka dagliga practices skulle maximera din talangpotential?', type: 'text', weight: 0.6 }
    ],
    scoreCalculation: (answers: Record<string, any>) => {
      let totalScore = 0;
      let totalWeight = 0;
      
      // Procentbaserade frågor (0-100% skala)
      const percentageKeys = ['naturlig_begavning', 'anstrangningslost_excellens', 'extern_bekraftelse', 'intuitivt_masterskap',
                             'snabb_inlarning', 'flow_frekvens', 'energi_fran_talanger', 'effortless_state', 'optimal_prestanda',
                             'naturlig_rytm', 'dagligt_utnyttjande', 'medveten_utveckling', 'progressiv_utmaning',
                             'strategisk_fokusering', 'talang_kombinationer', 'akta_sjalv', 'inre_motivation',
                             'djup_tillfredsställelse', 'naturlig_passion', 'unikt_bidrag', 'varde_for_andra',
                             'eftertragade_expertis', 'monetär_värdering'];
      
      percentageKeys.forEach(key => {
        const question = PILLAR_MODULES.talent.questions.find(q => q.key === key);
        if (question && typeof answers[key] === 'number') {
          const percentage = answers[key]; // 0-100
          // Konvertera till poäng där 50% = neutral (0), <50% = negativ, >50% = positiv
          const normalizedScore = (percentage - 50) / 50; // Range: -1 till +1
          const finalScore = Math.max(-1, Math.min(1, normalizedScore)) * 5 + 5; // Range: 0-10
          
          totalScore += finalScore * (question.weight || 1);
          totalWeight += (question.weight || 1);
        }
      });
      
      return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 10) / 10 : 5;
    },
    insightGeneration: (answers: Record<string, any>, score: number) => {
      const criticalAreas = [];
      const strongAreas = [];
      
      // Analysera talangområden baserat på nya procentskalan
      const percentageKeys = ['naturlig_begavning', 'anstrangningslost_excellens', 'extern_bekraftelse', 'intuitivt_masterskap',
                             'snabb_inlarning', 'flow_frekvens', 'energi_fran_talanger', 'effortless_state', 'optimal_prestanda',
                             'naturlig_rytm', 'dagligt_utnyttjande', 'medveten_utveckling', 'progressiv_utmaning',
                             'strategisk_fokusering', 'talang_kombinationer', 'akta_sjalv', 'inre_motivation',
                             'djup_tillfredsställelse', 'naturlig_passion', 'unikt_bidrag', 'varde_for_andra',
                             'eftertragade_expertis', 'monetär_värdering'];
      
      percentageKeys.forEach(key => {
        const value = answers[key];
        if (typeof value === 'number') {
          if (value <= 30) criticalAreas.push(key); // 30% eller lägre = kritiskt område
          if (value >= 80) strongAreas.push(key);   // 80% eller högre = styrkeområde
        }
      });
      
      return {
        criticalAreas,
        strongAreas,
        overallStatus: score >= 7 ? 'strong' : score >= 5 ? 'moderate' : 'needs_attention',
        signatureTalents: answers.signatur_talanger || '',
        developmentPotential: answers.talanggap_analys || '',
        neuroplasticPlan: answers.neuroplastisk_talangutveckling || ''
      };
    }
  },

  brand: {
    key: 'brand',
    name: 'Varumärke & Position',
    description: 'Bygg ett starkt och autentiskt personligt varumärke med neuroplastisk strategi. Fokuserar på att skapa en magnetisk identitet som attraherar rätt möjligheter.',
    icon: '🎨',
    color: '#8B5CF6',
    questions: [
      // === SEKTION 1: VARUMÄRKESKLARHET & AUTENTICITET ===
      { key: 'varumärke_klarhet', text: 'Jag har en kristallklar bild av vad mitt varumärke representerar', type: 'slider', min: 0, max: 100, weight: 1.3 },
      { key: 'autentiskt_uttryck', text: 'Mitt varumärke uttrycker perfekt vem jag verkligen är', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'konsekvent_budskap', text: 'Mitt budskap är konsekvent över alla mina kanaler och plattformar', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'värdegrund_tydlighet', text: 'Mina kärnvärden och principer syns tydligt i mitt varumärke', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'personlighet_genomskinlighet', text: 'Min personlighet skiner igenom på ett äkta sätt', type: 'slider', min: 0, max: 100, weight: 1.1 },
      
      // === SEKTION 2: MÅLGRUPPSFÖRSTÅELSE & MARKNADSPOSITIONERING ===
      { key: 'målgrupp_djupförståelse', text: 'Jag förstår djupt vad min målgrupp verkligen behöver och önskar', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'unik_marknadsposition', text: 'Jag har en tydlig och unik position på min marknad', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'konkurrensfördel', text: 'Jag sticker ut tydligt och positivt från andra inom mitt område', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'nichspecialisering', text: 'Jag är erkänt stark inom min specifika nisch eller expertområde', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'marknadskännedom', text: 'Jag förstår min marknad och dess trender mycket väl', type: 'slider', min: 0, max: 100, weight: 1.0 },
      
      // === SEKTION 3: VISUELL IDENTITET & KOMMUNIKATION ===
      { key: 'visuell_konsistens', text: 'Jag har en stark och igenkännbar visuell profil', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'berättarkraft', text: 'Jag berättar min historia på ett fängslande och minnevärt sätt', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'innehållsvärde', text: 'Mitt innehåll tillför verkligt och mätbart värde för min målgrupp', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'kommunikationsstil', text: 'Min kommunikationsstil är distintik och lätt att känna igen', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'professionell_närvaro', text: 'Jag upprätthåller en professionell och trovärdig närvaro', type: 'slider', min: 0, max: 100, weight: 1.0 },
      
      // === SEKTION 4: ENGAGEMANG & FÖRTROENDEBYGGANDE ===
      { key: 'äkta_engagemang', text: 'Jag skapar genuint engagemang och meningsfulla interaktioner', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'förtroende_byggande', text: 'Jag bygger systematiskt förtroende genom konsekvent leverans', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'rykte_medvetenhet', text: 'Jag är fullt medveten om hur andra uppfattar mitt varumärke', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'community_byggande', text: 'Jag bygger en lojal community omkring mitt varumärke', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'social_proof', text: 'Jag har stark social proof och positiva rekommendationer', type: 'slider', min: 0, max: 100, weight: 0.9 },
      
      // === SEKTION 5: UTVECKLING & STRATEGISK ANPASSNING ===
      { key: 'strategisk_utveckling', text: 'Jag utvecklar mitt varumärke strategiskt och medvetet över tid', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'feedback_integration', text: 'Jag lyssnar på och anpassar mig intelligent efter feedback', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'trend_anpassning', text: 'Jag anpassar mig till relevanta trender utan att förlora min autenticitet', type: 'slider', min: 0, max: 100, weight: 0.9 },
      { key: 'varumärke_mätning', text: 'Jag mäter och utvärderar mitt varumärkes påverkan regelbundet', type: 'slider', min: 0, max: 100, weight: 0.9 },
      
      // === SEKTION 6: DJUPANALYS & NEUROPLASTISK VARUMÄRKESBYGGANDE ===
      { key: 'varumärke_kärna', text: 'Definiera kärnan i ditt varumärke i EN mening. Vad representerar du fundamentalt och vad gör dig oumbärlig?', type: 'text', weight: 0.8 },
      { key: 'ideal_perception', text: 'Beskriv exakt hur du vill att din drömpublik ska beskriva dig till andra. Vilka specifika ord och känslor vill du väcka?', type: 'text', weight: 0.7 },
      { key: 'värdeerbjudande_analys', text: 'Artikulera ditt unika värdeerbjudande. Varför ska människor välja just dig framför alla andra alternativ?', type: 'text', weight: 0.7 },
      { key: 'perception_gap', text: 'Analysera skillnaden mellan hur du vill uppfattas och hur du faktiskt uppfattas. Vad behöver justeras?', type: 'text', weight: 0.6 },
      { key: 'varumärke_evolution_vision', text: 'Designa din varumärkesvision för 2-3 år framåt. Vad vill du vara känd för och hur når du dit?', type: 'text', weight: 0.6 },
      { key: 'neuroplastisk_varumärke_strategi', text: 'Skapa en 66-dagars plan för att neuroplastiskt förstärka ditt varumärke. Vilka dagliga handlingar skulle bygga din önskade image?', type: 'text', weight: 0.6 }
    ],
    scoreCalculation: (answers: Record<string, any>) => {
      let totalScore = 0;
      let totalWeight = 0;
      
      // Procentbaserade frågor (0-100% skala)
      const percentageKeys = ['varumärke_klarhet', 'autentiskt_uttryck', 'konsekvent_budskap', 'värdegrund_tydlighet',
                             'personlighet_genomskinlighet', 'målgrupp_djupförståelse', 'unik_marknadsposition', 
                             'konkurrensfördel', 'nichspecialisering', 'marknadskännedom', 'visuell_konsistens',
                             'berättarkraft', 'innehållsvärde', 'kommunikationsstil', 'professionell_närvaro',
                             'äkta_engagemang', 'förtroende_byggande', 'rykte_medvetenhet', 'community_byggande',
                             'social_proof', 'strategisk_utveckling', 'feedback_integration', 'trend_anpassning',
                             'varumärke_mätning'];
      
      percentageKeys.forEach(key => {
        const question = PILLAR_MODULES.brand.questions.find(q => q.key === key);
        if (question && typeof answers[key] === 'number') {
          const percentage = answers[key]; // 0-100
          // Konvertera till poäng där 50% = neutral (0), <50% = negativ, >50% = positiv
          const normalizedScore = (percentage - 50) / 50; // Range: -1 till +1
          const finalScore = Math.max(-1, Math.min(1, normalizedScore)) * 5 + 5; // Range: 0-10
          
          totalScore += finalScore * (question.weight || 1);
          totalWeight += (question.weight || 1);
        }
      });
      
      return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 10) / 10 : 5;
    },
    insightGeneration: (answers: Record<string, any>, score: number) => {
      const criticalAreas = [];
      const strongAreas = [];
      
      // Analysera varumärkesområden baserat på nya procentskalan
      const percentageKeys = ['varumärke_klarhet', 'autentiskt_uttryck', 'konsekvent_budskap', 'värdegrund_tydlighet',
                             'personlighet_genomskinlighet', 'målgrupp_djupförståelse', 'unik_marknadsposition', 
                             'konkurrensfördel', 'nichspecialisering', 'marknadskännedom', 'visuell_konsistens',
                             'berättarkraft', 'innehållsvärde', 'kommunikationsstil', 'professionell_närvaro',
                             'äkta_engagemang', 'förtroende_byggande', 'rykte_medvetenhet', 'community_byggande',
                             'social_proof', 'strategisk_utveckling', 'feedback_integration', 'trend_anpassning',
                             'varumärke_mätning'];
      
      percentageKeys.forEach(key => {
        const value = answers[key];
        if (typeof value === 'number') {
          if (value <= 30) criticalAreas.push(key); // 30% eller lägre = kritiskt område
          if (value >= 80) strongAreas.push(key);   // 80% eller högre = styrkeområde
        }
      });
      
      return {
        criticalAreas,
        strongAreas,
        overallStatus: score >= 7 ? 'strong' : score >= 5 ? 'moderate' : 'needs_attention',
        brandCore: answers.varumärke_kärna || '',
        valueProposition: answers.värdeerbjudande_analys || '',
        strategicPlan: answers.neuroplastisk_varumärke_strategi || ''
      };
    }
  },

  economy: {
    key: 'economy',
    name: 'Ekonomi & Hållbarhet',
    description: 'Bygg finansiell resiliens och exponentiell ekonomisk tillväxt. Fokuserar på neuroplastisk värdeskapande, systematisk intäktsoptimering och hållbar välståndsutveckling.',
    icon: '💰',
    color: '#059669',
    questions: [
      // === SEKTION 1: INTÄKTSSTABILITET & VÄRDESKAPANDE ===
      { key: 'intäkt_förutsägbarhet', text: 'Mina inkomster är stabila och förutsägbara månad till månad', type: 'slider', min: 0, max: 100, weight: 1.3 },
      { key: 'inkomst_diversifiering', text: 'Jag har flera starka och pålitliga inkomstströmmar', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'prissättnings_självförtroende', text: 'Jag känner mig helt trygg med att ta full betalt för mitt värde', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'värde_monetisering', text: 'Jag förvandlar effektivt min expertis och värde till intäkter', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'passiv_intäktspotential', text: 'Jag utvecklar intäktsströmmar som genererar pengar utan min direkta tid', type: 'slider', min: 0, max: 100, weight: 1.1 },
      
      // === SEKTION 2: KOSTNADSHANTERING & FINANSIELL INTELLIGENS ===
      { key: 'kostnadskontroll', text: 'Jag har fullständig kontroll och överblick över alla mina utgifter', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'investering_avkastning', text: 'Jag mäter och optimerar avkastningen på alla mina investeringar', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'operationell_effektivitet', text: 'Jag arbetar maximalt kostnadseffektivt och eliminerar slöseri', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'skatteoptimering', text: 'Jag optimerar min skattesituation lagligt och strategiskt', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'finansiell_literacy', text: 'Jag förstår djupt finansiella nyckeltal och affärsprinciper', type: 'slider', min: 0, max: 100, weight: 1.0 },
      
      // === SEKTION 3: FINANSIELL SÄKERHET & PLANERING ===
      { key: 'ekonomisk_buffert', text: 'Jag har stark ekonomisk buffert för oväntade situationer', type: 'slider', min: 0, max: 100, weight: 1.2 },
      { key: 'finansiella_mål', text: 'Jag har kristallklara finansiella mål och detaljerade planer', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'kassaflöde_hantering', text: 'Jag hanterar kassaflödet proaktivt och förutseende', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'långsiktig_planering', text: 'Jag planerar och sparar strategiskt för långsiktiga mål', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'risk_hantering', text: 'Jag hanterar finansiella risker intelligent och systematiskt', type: 'slider', min: 0, max: 100, weight: 1.0 },
      
      // === SEKTION 4: TILLVÄXT & SKALNING ===
      { key: 'tillväxt_investeringar', text: 'Jag investerar strategiskt och beräknat för framtida tillväxt', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'skalbarhet_fokus', text: 'Jag bygger affärsmodeller och system som kan skala exponentiellt', type: 'slider', min: 0, max: 100, weight: 1.1 },
      { key: 'marknadsmöjligheter', text: 'Jag identifierar och agerar snabbt på ekonomiska möjligheter', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'affärsutveckling', text: 'Jag utvecklar kontinuerligt nya sätt att skapa värde och intäkter', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'innovation_investeringar', text: 'Jag investerar i innovation och framtidsteknologier', type: 'slider', min: 0, max: 100, weight: 0.9 },
      
      // === SEKTION 5: EKONOMISK MINDSET & STRATEGI ===
      { key: 'överflöd_mindset', text: 'Jag har ett starkt överflöd-mindset och ser ekonomiska möjligheter överallt', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'ekonomisk_disciplin', text: 'Jag har stark finansiell disciplin och håller mig till mina planer', type: 'slider', min: 0, max: 100, weight: 1.0 },
      { key: 'värdealignment', text: 'Min ekonomiska strategi är helt alignad med mina värderingar', type: 'slider', min: 0, max: 100, weight: 0.9 },
      { key: 'kontinuerlig_optimering', text: 'Jag optimerar kontinuerligt mina ekonomiska processer och strategier', type: 'slider', min: 0, max: 100, weight: 0.9 },
      
      // === SEKTION 6: DJUPANALYS & NEUROPLASTISK EKONOMISK UTVECKLING ===
      { key: 'intäkt_strategi_analys', text: 'Analysera din huvudsakliga intäktsstrategi i detalj. Hur tjänar du pengar idag och hur ska detta utvecklas de närmaste 2 åren?', type: 'text', weight: 0.8 },
      { key: 'prissättnings_filosofi', text: 'Beskriv din prissättningsfilosofi och -strategi. Hur bestämmer du värdet på ditt erbjudande och optimerar du priser?', type: 'text', weight: 0.7 },
      { key: 'tillväxt_investeringsplan', text: 'Kartlägg dina viktigaste tillväxtinvesteringar. Vad ger högst ROI och hur mäter du framgång?', type: 'text', weight: 0.7 },
      { key: 'ekonomiska_hinder', text: 'Identifiera dina största ekonomiska begränsningar. Vad hindrar exponentiell tillväxt och hur kan detta lösas?', type: 'text', weight: 0.6 },
      { key: 'ekonomisk_framtidsvision', text: 'Designa din ekonomiska vision för 3-5 år framåt. Vad är ditt välståndsmål och hur når du dit?', type: 'text', weight: 0.6 },
      { key: 'neuroplastisk_ekonomi_strategi', text: 'Skapa en 66-dagars plan för neuroplastisk ekonomisk utveckling. Vilka dagliga habits skulle transformera din ekonomiska situation?', type: 'text', weight: 0.6 }
    ],
    scoreCalculation: (answers: Record<string, any>) => {
      let totalScore = 0;
      let totalWeight = 0;
      
      // Procentbaserade frågor (0-100% skala)
      const percentageKeys = ['intäkt_förutsägbarhet', 'inkomst_diversifiering', 'prissättnings_självförtroende', 
                             'värde_monetisering', 'passiv_intäktspotential', 'kostnadskontroll', 'investering_avkastning',
                             'operationell_effektivitet', 'skatteoptimering', 'finansiell_literacy', 'ekonomisk_buffert',
                             'finansiella_mål', 'kassaflöde_hantering', 'långsiktig_planering', 'risk_hantering',
                             'tillväxt_investeringar', 'skalbarhet_fokus', 'marknadsmöjligheter', 'affärsutveckling',
                             'innovation_investeringar', 'överflöd_mindset', 'ekonomisk_disciplin', 'värdealignment',
                             'kontinuerlig_optimering'];
      
      percentageKeys.forEach(key => {
        const question = PILLAR_MODULES.economy.questions.find(q => q.key === key);
        if (question && typeof answers[key] === 'number') {
          const percentage = answers[key]; // 0-100
          // Konvertera till poäng där 50% = neutral (0), <50% = negativ, >50% = positiv
          const normalizedScore = (percentage - 50) / 50; // Range: -1 till +1
          const finalScore = Math.max(-1, Math.min(1, normalizedScore)) * 5 + 5; // Range: 0-10
          
          totalScore += finalScore * (question.weight || 1);
          totalWeight += (question.weight || 1);
        }
      });
      
      return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 10) / 10 : 5;
    },
    insightGeneration: (answers: Record<string, any>, score: number) => {
      const criticalAreas = [];
      const strongAreas = [];
      
      // Analysera ekonomiska områden baserat på nya procentskalan
      const percentageKeys = ['intäkt_förutsägbarhet', 'inkomst_diversifiering', 'prissättnings_självförtroende', 
                             'värde_monetisering', 'passiv_intäktspotential', 'kostnadskontroll', 'investering_avkastning',
                             'operationell_effektivitet', 'skatteoptimering', 'finansiell_literacy', 'ekonomisk_buffert',
                             'finansiella_mål', 'kassaflöde_hantering', 'långsiktig_planering', 'risk_hantering',
                             'tillväxt_investeringar', 'skalbarhet_fokus', 'marknadsmöjligheter', 'affärsutveckling',
                             'innovation_investeringar', 'överflöd_mindset', 'ekonomisk_disciplin', 'värdealignment',
                             'kontinuerlig_optimering'];
      
      percentageKeys.forEach(key => {
        const value = answers[key];
        if (typeof value === 'number') {
          if (value <= 30) criticalAreas.push(key); // 30% eller lägre = kritiskt område
          if (value >= 80) strongAreas.push(key);   // 80% eller högre = styrkeområde
        }
      });
      
      return {
        criticalAreas,
        strongAreas,
        overallStatus: score >= 7 ? 'strong' : score >= 5 ? 'moderate' : 'needs_attention',
        revenueStrategy: answers.intäkt_strategi_analys || '',
        growthPlan: answers.tillväxt_investeringsplan || '',
        neuroplasticStrategy: answers.neuroplastisk_ekonomi_strategi || ''
      };
    }
  },

  open_track: {
    key: 'open_track',
    name: 'Öppet Spår',
    description: 'Din personliga utvecklingsresa med fritt valbara mål och förändringar',
    icon: '🛤️',
    color: '#EC4899',
    questions: [
      // Huvudmål och vision
      { key: 'change_goal', text: 'Vad vill du specifikt förändra eller utveckla?', type: 'text', weight: 2.0 },
      { key: 'goal_importance', text: 'Varför är denna förändring viktig för dig?', type: 'text', weight: 1.8 },
      { key: 'success_vision', text: 'Hur ser framgång ut för dig inom detta område? Beskriv så detaljerat som möjligt.', type: 'text', weight: 1.8 },
      
      // Nuläge och utmaningar
      { key: 'current_situation', text: 'Hur ser din situation ut idag inom detta område?', type: 'text', weight: 1.5 },
      { key: 'main_challenges', text: 'Vilka är dina största utmaningar eller hinder?', type: 'text', weight: 1.6 },
      { key: 'previous_attempts', text: 'Vad har du redan provat för att förändra detta?', type: 'text', weight: 1.3 },
      { key: 'challenge_background', text: 'Beskriv bakgrunden till denna utmaning - hur länge har den funnits?', type: 'text', weight: 1.2 },
      
      // Kapacitet och tidsplanering
      { key: 'daily_time_commitment', text: 'Hur mycket tid per dag kan du realistiskt avsätta för detta?', type: 'multiple_choice', options: ['5-10 minuter', '15-30 minuter', '30-60 minuter', '1-2 timmar', 'Mer än 2 timmar'], weight: 1.8 },
      { key: 'weekly_schedule', text: 'Vilka dagar i veckan passar bäst för dig att arbeta med detta?', type: 'multiple_choice', options: ['Varje dag', 'Vardagar', 'Helger', 'Specifika dagar (beskriv i kommentar)', 'Oregelbundet när jag har tid'], weight: 1.5 },
      { key: 'total_timeframe', text: 'Hur lång tid föreställer du dig att denna förändring behöver ta?', type: 'multiple_choice', options: ['1-4 veckor', '1-3 månader', '3-6 månader', '6-12 månader', 'Mer än ett år', 'Det spelar ingen roll'], weight: 1.6 },
      { key: 'urgency_level', text: 'Hur akut känns denna förändring för dig?', type: 'slider', min: 1, max: 10, weight: 1.4 },
      
      // Resurser och stöd
      { key: 'available_resources', text: 'Vilka resurser, verktyg eller hjälp har du tillgång till?', type: 'text', weight: 1.3 },
      { key: 'support_system', text: 'Vem i din omgivning kan stötta dig i denna förändring?', type: 'text', weight: 1.2 },
      { key: 'motivation_level', text: 'Hur motiverad känner du dig just nu (1-10)?', type: 'slider', min: 1, max: 10, weight: 1.5 },
      { key: 'confidence_level', text: 'Hur säker är du på att du kan lyckas med denna förändring (1-10)?', type: 'slider', min: 1, max: 10, weight: 1.4 },
      
      // Djupare förståelse
      { key: 'emotional_connection', text: 'Vilka känslor väcker denna förändring hos dig?', type: 'text', weight: 1.1 },
      { key: 'past_successes', text: 'Berätta om en liknande förändring du lyckats med tidigare', type: 'text', weight: 1.2 },
      { key: 'biggest_fear', text: 'Vad är du mest rädd för när det gäller denna förändring?', type: 'text', weight: 1.1 },
      { key: 'milestone_preferences', text: 'Föredrar du små dagliga framsteg eller större veckovisa mål?', type: 'multiple_choice', options: ['Små dagliga steg', 'Större veckovisa mål', 'En blandning av båda', 'Låt coachen bestämma'], weight: 1.3 },
      
      // Kommentarer och tillägg
      { key: 'additional_context', text: 'Finns det något annat viktigt att veta om din situation eller detta mål?', type: 'text', weight: 1.0 },
      { key: 'preferred_approach', text: 'Vilken typ av stöd eller approach tror du skulle fungera bäst för dig?', type: 'text', weight: 1.1 }
    ],
    scoreCalculation: (answers: Record<string, any>) => {
      // För "Öppet spår" är scoring mer kvalitativ och baserad på flera faktorer
      let totalScore = 0;
      let components = 0;
      
      // Målklarhet (30% av total score)
      const goalClarity = (answers.change_goal?.length > 10 ? 7 : 3) + 
                         (answers.goal_importance?.length > 20 ? 7 : 3) + 
                         (answers.success_vision?.length > 30 ? 8 : 4);
      totalScore += (goalClarity / 22) * 3;
      components++;
      
      // Motivation och självförtroende (25% av total score)
      const motivationScore = ((answers.motivation_level || 5) + (answers.confidence_level || 5)) / 2;
      totalScore += (motivationScore / 10) * 2.5;
      components++;
      
      // Kapacitet och realism (25% av total score)
      const hasRealisticTimeframe = answers.total_timeframe && answers.daily_time_commitment;
      const urgencyBalance = answers.urgency_level >= 3 && answers.urgency_level <= 8; // Lagom urgency
      const capacityScore = (hasRealisticTimeframe ? 6 : 3) + (urgencyBalance ? 4 : 2);
      totalScore += (capacityScore / 10) * 2.5;
      components++;
      
      // Förberedelse och insikt (20% av total score)
      const preparationScore = (answers.current_situation?.length > 15 ? 5 : 2) + 
                              (answers.main_challenges?.length > 15 ? 5 : 2);
      totalScore += (preparationScore / 10) * 2;
      components++;
      
      return components > 0 ? Math.round((totalScore / components) * 10) / 10 : 5;
    },
    insightGeneration: (answers: Record<string, any>, score: number) => {
      const insights: Record<string, any> = {
        overallScore: score,
        changeGoal: answers.change_goal || '',
        timeCommitment: answers.daily_time_commitment || '',
        timeframe: answers.total_timeframe || '',
        motivationLevel: answers.motivation_level || 5,
        confidenceLevel: answers.confidence_level || 5,
        urgencyLevel: answers.urgency_level || 5,
        mainChallenges: answers.main_challenges || '',
        supportSystem: answers.support_system || '',
        readinessLevel: 'moderate',
        recommendedApproach: '',
        keyFocusAreas: []
      };
      
      // Bedöm beredskap baserat på score och svar
      if (score >= 7.5 && insights.motivationLevel >= 7 && insights.confidenceLevel >= 6) {
        insights.readinessLevel = 'high';
        insights.recommendedApproach = 'intensiv';
      } else if (score >= 5.5 && insights.motivationLevel >= 5) {
        insights.readinessLevel = 'moderate';
        insights.recommendedApproach = 'gradual';
      } else {
        insights.readinessLevel = 'preparation_needed';
        insights.recommendedApproach = 'foundational';
      }
      
      // Identifiera nyckelområden baserat på svar
      if (insights.motivationLevel >= 8) insights.keyFocusAreas.push('high_motivation');
      if (insights.confidenceLevel <= 4) insights.keyFocusAreas.push('confidence_building');
      if (insights.urgencyLevel >= 8) insights.keyFocusAreas.push('urgent_action');
      if (answers.previous_attempts?.length > 20) insights.keyFocusAreas.push('learning_from_past');
      if (answers.support_system?.length > 10) insights.keyFocusAreas.push('strong_support');
      
      return insights;
    }
  }
};