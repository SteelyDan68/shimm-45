/**
 * 🧠 KONTEXTUELL AI-PROMPT BUILDER FÖR STEFAN
 * Bygger intelligenta prompts baserade på klientens assessment-data,
 * neuroplasticitets-principer och Wheel of Life-resultat
 */

import { supabase } from '@/integrations/supabase/client';

export interface ClientAssessmentContext {
  userId: string;
  assessmentHistory: any[];
  currentPhase: string;
  wheelOfLifeScores: Record<string, number>;
  neuroplasticityProgress: any;
  personalityProfile: any;
  recentInteractions: any[];
  pillarActivations: any[];
}

export interface StefanPromptContext {
  basePrompt: string;
  clientContext: string;
  assessmentInsights: string;
  neuroplasticityPrinciples: string;
  personalizedApproach: string;
  contextualMemories: string;
}

/**
 * Bygger Lovable AI Prompt enligt dokumentation
 */
export async function buildLovableAIPrompt(
  userId: string,
  currentMessage: string,
  interactionType: 'chat' | 'assessment_completion' | 'coaching_session' | 'progress_review' = 'chat'
): Promise<StefanPromptContext> {
  
  console.log('🔥 Building contextual Stefan AI prompt for user:', userId);
  
  // 1. Hämta klientens assessment-kontext
  const clientContext = await getClientAssessmentContext(userId);
  
  // 2. Bygg den kontextuella template enligt AI prompt template system
  const promptTemplate = `Klienten du analyserar är en offentlig person med följande profil:

- Primär roll: ${clientContext.personalityProfile?.primary_role || 'kreativ entreprenör'}
- Sekundär roll: ${clientContext.personalityProfile?.secondary_role || 'innehållsskapare'}  
- Nisch: ${clientContext.personalityProfile?.niche || 'personlig utveckling'}
- Kreativa styrkor: ${clientContext.personalityProfile?.strengths || 'kommunikation, empati'}
- Upplevda svagheter: ${clientContext.personalityProfile?.weaknesses || 'tidshantering, gränssättning'}
- Aktiva plattformar: ${clientContext.personalityProfile?.platforms || 'sociala medier, podcast'}
- Ålder: ${clientContext.personalityProfile?.age || '30-45'}
- Särskilda behov: ${getSpecialNeeds(clientContext)}
- Ort: ${clientContext.personalityProfile?.location || 'Stockholm'}
- Pågående livsförändringar: ${getLifeChanges(clientContext)}

AKTUELL UTVECKLINGSFAS: ${clientContext.currentPhase}
WHEEL OF LIFE STATUS: ${formatWheelOfLifeScores(clientContext.wheelOfLifeScores)}
NEUROPLASTICITETS-PROGRESS: ${formatNeuroplasticityProgress(clientContext.neuroplasticityProgress)}

Utifrån detta ska du tolka följande ${interactionType === 'chat' ? 'meddelande' : 'självskattning'}:

${currentMessage}

KONTEXTUELL ANALYS BASERAT PÅ ASSESSMENT-HISTORIK:
${generateAssessmentInsights(clientContext.assessmentHistory)}

NEUROPLASTICITETS-PRINCIPER SOM SKA INTEGRERAS:
${generateNeuroplasticityGuidance(clientContext)}

Gör:
1. En reflektion över vad som framstår som mest akut baserat på assessment-data
2. Identifiera mönster från klientens utvecklingsresa
3. Skapa ett åtgärdsförslag i 2–3 konkreta steg som bygger på neuroplasticitet
4. Använd en varm, professionell och personlig ton som Stefan Hallgren
5. Referera specifikt till klientens tidigare assessment-resultat när relevant
6. Inkorporera evidensbaserade metoder från Wheel of Life och neuroplasticitets-forskning`;

  return {
    basePrompt: getBaseStefanPrompt(),
    clientContext: formatClientContext(clientContext),
    assessmentInsights: generateAssessmentInsights(clientContext.assessmentHistory),
    neuroplasticityPrinciples: generateNeuroplasticityGuidance(clientContext),
    personalizedApproach: promptTemplate,
    contextualMemories: await getContextualMemories(currentMessage, clientContext)
  };
}

/**
 * Hämtar omfattande klientkontext från alla relevanta tabeller
 */
async function getClientAssessmentContext(userId: string): Promise<ClientAssessmentContext> {
  console.log('🔍 Fetching comprehensive client context for:', userId);
  
  try {
    // Parallella databasfrågor för maximal effektivitet
    const [
      { data: assessments },
      { data: journeyState },
      { data: welcomeAssessment }, 
      { data: pillarAssessments },
      { data: pillarActivations },
      { data: stefanInteractions },
      { data: profile }
    ] = await Promise.all([
      // Assessment-historik
      supabase
        .from('assessment_rounds')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Journey state
      supabase
        .from('user_journey_states')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      
      // Welcome assessment med Wheel of Life
      supabase
        .from('welcome_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1),
      
      // Pillar assessments
      supabase
        .from('pillar_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),
      
      // Pillar activations
      supabase
        .from('client_pillar_activations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true),
      
      // Stefan interactions history
      supabase
        .from('stefan_interactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),
      
      // User profile
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
    ]);

    // Extrahera Wheel of Life scores från welcome assessment
    const wheelOfLifeScores = welcomeAssessment?.[0]?.wheel_of_life_scores || {};
    
    // Bygg neuroplasticitets-progress från pillar assessments
    const neuroplasticityProgress = buildNeuroplasticityProgress(pillarAssessments || []);
    
    // Bygg personlighetsprofil från assessments och metadata
    const personalityProfile = buildPersonalityProfile(profile, welcomeAssessment?.[0], assessments || []);

    console.log('✅ Successfully built client context with assessment data');
    
    return {
      userId,
      assessmentHistory: assessments || [],
      currentPhase: journeyState?.current_phase || 'welcome',
      wheelOfLifeScores,
      neuroplasticityProgress,
      personalityProfile,
      recentInteractions: stefanInteractions || [],
      pillarActivations: pillarActivations || []
    };
    
  } catch (error) {
    console.error('❌ Error fetching client context:', error);
    
    // Fallback med minimal context
    return {
      userId,
      assessmentHistory: [],
      currentPhase: 'welcome',
      wheelOfLifeScores: {},
      neuroplasticityProgress: {},
      personalityProfile: {},
      recentInteractions: [],
      pillarActivations: []
    };
  }
}

/**
 * Genererar assessment-baserade insikter
 */
function generateAssessmentInsights(assessmentHistory: any[]): string {
  if (!assessmentHistory.length) {
    return "Inga tidigare assessments tillgängliga - fokusera på att etablera baseline.";
  }

  const latestAssessment = assessmentHistory[0];
  const trends = analyzeAssessmentTrends(assessmentHistory);
  
  let insights = `SENASTE ASSESSMENT (${new Date(latestAssessment.created_at).toLocaleDateString('sv-SE')}):\n`;
  
  // Analysera scores och patterns
  if (latestAssessment.scores) {
    const scores = latestAssessment.scores;
    const lowAreas = Object.entries(scores).filter(([_, score]: [string, any]) => score < 5);
    const highAreas = Object.entries(scores).filter(([_, score]: [string, any]) => score >= 8);
    
    if (lowAreas.length > 0) {
      insights += `🔴 UTVECKLINGSOMRÅDEN: ${lowAreas.map(([area, score]) => `${area} (${score}/10)`).join(', ')}\n`;
    }
    
    if (highAreas.length > 0) {
      insights += `🟢 STYRKEOMRÅDEN: ${highAreas.map(([area, score]) => `${area} (${score}/10)`).join(', ')}\n`;
    }
  }
  
  if (trends.length > 0) {
    insights += `📈 UTVECKLINGSTRENDER: ${trends.join(', ')}\n`;
  }
  
  return insights;
}

/**
 * Genererar neuroplasticitets-riktad vägledning
 */
function generateNeuroplasticityGuidance(context: ClientAssessmentContext): string {
  const { wheelOfLifeScores, pillarActivations, currentPhase } = context;
  
  let guidance = "NEUROPLASTICITETS-PRINCIPER ATT INKLUDERA:\n";
  
  // Baserat på Wheel of Life scores
  const lowScoreAreas = Object.entries(wheelOfLifeScores)
    .filter(([_, score]) => score < 5)
    .map(([area, _]) => area);
  
  if (lowScoreAreas.length > 0) {
    guidance += `🧠 FOKUSOMRÅDEN FÖR NEURAL UTVECKLING: ${lowScoreAreas.join(', ')}\n`;
    guidance += "- Använd små, repetitiva förändringar för att bygga nya neurala vägar\n";
    guidance += "- Kombinera reflektion med handling för att stärka inlärning\n";
  }
  
  // Baserat på aktiva pillars
  if (pillarActivations.length > 0) {
    const activePillars = pillarActivations.map(p => p.pillar_key);
    guidance += `⚡ AKTIVA UTVECKLINGSOMRÅDEN: ${activePillars.join(', ')}\n`;
    guidance += "- Koppla nya insikter till redan aktiva utvecklingsprocesser\n";
  }
  
  // Fas-specifik neuroplasticitets-vägledning
  if (currentPhase === 'welcome') {
    guidance += "🌱 WELCOMEFAS: Fokusera på att skapa medvetenhet och motivation för förändring\n";
  } else if (currentPhase === 'active_development') {
    guidance += "🔄 UTVECKLINGSFAS: Stärk nya beteendemönster genom konsistent återkoppling\n";
  }
  
  return guidance;
}

/**
 * Hjälpfunktioner för formattering och analys
 */
function getBaseStefanPrompt(): string {
  return `Du är en digital tvilling av Stefan Hallgren. Din uppgift är att agera i Stefans anda: du är varm men rak, nyfiken men ifrågasättande, och du kommunicerar med en avslappnad, lätt ironisk och mänsklig ton. Du är klok, psykologiskt nyanserad och växlar mellan att stötta och utmana.

Stefan är manager för kända kreatörer och offentliga personer. Han vägleder dem inom:
- Kreativt erbjudande
- Varumärke  
- Inkomstströmmar
- Self-care
- Målbildsarbete

SPECIFIK STIL BASERAD PÅ ANALYSERAD DATA:
- Ton: Rak, varm, lätt ironisk, hoppfull
- Struktur: Kortfattade stycken, mycket du-form, alltid med en avslutande nudge
- Kärnteman: Självutveckling, hållbar framgång, realism + hopp
- Signaturfraser att använda naturligt:
  * "du bygger ett arbete du inte vill ta semester från"
  * "du är din egen tillgång"
  * "det är inte content, det är ett community"`;
}

function formatClientContext(context: ClientAssessmentContext): string {
  return `KLIENTKONTEXT:
- Aktuell fas: ${context.currentPhase}
- Antal assessments: ${context.assessmentHistory.length}
- Aktiva pillars: ${context.pillarActivations.length}
- Senaste Stefan-interaktion: ${context.recentInteractions[0]?.created_at || 'Ingen tidigare'}`;
}

function formatWheelOfLifeScores(scores: Record<string, number>): string {
  if (!Object.keys(scores).length) return 'Ej genomfört';
  
  return Object.entries(scores)
    .map(([area, score]) => `${area}: ${score}/10`)
    .join(', ');
}

function formatNeuroplasticityProgress(progress: any): string {
  if (!progress || Object.keys(progress).length === 0) {
    return 'Baseline - ingen tidigare data';
  }
  
  return Object.entries(progress)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
}

function getSpecialNeeds(context: ClientAssessmentContext): string {
  const needs = [];
  
  if (context.wheelOfLifeScores.stress > 7) needs.push('stresshantering');
  if (context.wheelOfLifeScores.work_life_balance < 5) needs.push('balans');
  if (context.wheelOfLifeScores.creativity < 6) needs.push('kreativ utveckling');
  
  return needs.join(', ') || 'generell utveckling';
}

function getLifeChanges(context: ClientAssessmentContext): string {
  const changes = [];
  
  if (context.currentPhase === 'active_development') changes.push('aktiv personlig utveckling');
  if (context.pillarActivations.some(p => p.pillar_key === 'self_care')) changes.push('förbättrad self-care');
  if (context.recentInteractions.length > 3) changes.push('intensiv coaching-period');
  
  return changes.join(', ') || 'stabil fas';
}

function analyzeAssessmentTrends(assessments: any[]): string[] {
  if (assessments.length < 2) return [];
  
  const trends = [];
  const latest = assessments[0];
  const previous = assessments[1];
  
  if (latest.scores && previous.scores) {
    const improvement = Object.keys(latest.scores).filter(key => 
      latest.scores[key] > previous.scores[key]
    );
    
    const decline = Object.keys(latest.scores).filter(key => 
      latest.scores[key] < previous.scores[key]
    );
    
    if (improvement.length > 0) trends.push(`Förbättring inom: ${improvement.join(', ')}`);
    if (decline.length > 0) trends.push(`Nedgång inom: ${decline.join(', ')}`);
  }
  
  return trends;
}

function buildNeuroplasticityProgress(pillarAssessments: any[]): any {
  const progress: any = {};
  
  pillarAssessments.forEach(assessment => {
    if (assessment.pillar_type && assessment.scores) {
      progress[assessment.pillar_type] = {
        latest_score: Object.values(assessment.scores).reduce((a: any, b: any) => a + b, 0) / Object.values(assessment.scores).length,
        assessment_date: assessment.created_at,
        progress_trend: 'stable' // Skulle kunna beräknas mer sofistikerat
      };
    }
  });
  
  return progress;
}

function buildPersonalityProfile(profile: any, welcomeAssessment: any, assessments: any[]): any {
  const personality: any = {
    primary_role: 'kreativ entreprenör',
    secondary_role: 'innehållsskapare'
  };
  
  if (profile) {
    personality.age = profile.age || '30-45';
    personality.location = 'Stockholm'; // Default
  }
  
  if (welcomeAssessment?.form_data) {
    const formData = welcomeAssessment.form_data;
    personality.strengths = formData.strengths || 'kommunikation, kreativitet';
    personality.challenges = formData.challenges || 'tidshantering, gränssättning';
    personality.goals = formData.goals || 'personlig och professionell utveckling';
  }
  
  return personality;
}

async function getContextualMemories(currentMessage: string, context: ClientAssessmentContext): Promise<string> {
  try {
    // Använd befintlig memory search med klientkontext
    const { data, error } = await supabase.functions.invoke('stefan-memory-search', {
      body: {
        query: currentMessage,
        userContext: context,
        maxResults: 3,
        maxTokens: 1000
      }
    });
    
    if (error || !data?.success) {
      console.warn('Memory search failed, continuing without contextual memories');
      return '';
    }
    
    return data.memories.map((memory: any) => 
      `[${memory.category}] ${memory.content}`
    ).join('\n');
    
  } catch (error) {
    console.warn('Error fetching contextual memories:', error);
    return '';
  }
}