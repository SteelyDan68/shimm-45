import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Hjälpfunktion för att bygga AI-kontext från klientens profile_metadata
export async function buildClientContext(clientId: string, supabase: any): Promise<string> {
  try {
    // Hämta klientens profile_metadata
    const { data: clientData, error } = await supabase
      .from('clients')
      .select('name, profile_metadata, velocity_score, category')
      .eq('id', clientId)
      .single();

    if (error || !clientData) {
      console.warn('Could not fetch client context data:', error?.message);
      return '';
    }

    const metadata = clientData.profile_metadata;
    if (!metadata) {
      return `Klient: ${clientData.name} (kategori: ${clientData.category})`;
    }

    // Bygg personlig kontext från onboarding-data
    let context = `KLIENTKONTEXT för ${clientData.name}:\n\n`;

    // Allmän information
    if (metadata.generalInfo) {
      const general = metadata.generalInfo;
      if (general.age) context += `Ålder: ${general.age} år\n`;
      if (general.gender) context += `Kön/pronomen: ${general.gender}\n`;
      if (general.physicalLimitations) context += `Fysiska begränsningar: ${general.physicalLimitations}\n`;
      if (general.neurodiversity) context += `Neurodiversitet/psykiska aspekter: ${general.neurodiversity}\n`;
    }

    // Offentlig roll och karriär
    if (metadata.publicRole) {
      const role = metadata.publicRole;
      context += `\nPROFESSIONELL ROLL:\n`;
      if (role.primaryRole) context += `Primär roll: ${role.primaryRole}\n`;
      if (role.secondaryRole) context += `Sekundär roll: ${role.secondaryRole}\n`;
      if (role.niche) context += `Nisch/genre: ${role.niche}\n`;
      if (role.creativeStrengths) context += `Kreativa styrkor: ${role.creativeStrengths}\n`;
      if (role.challenges) context += `Upplevda svårigheter: ${role.challenges}\n`;
      if (role.platforms && role.platforms.length > 0) {
        context += `Aktiva plattformar: ${role.platforms.join(', ')}\n`;
      }
    }

    // Livssituation
    if (metadata.lifeMap) {
      const life = metadata.lifeMap;
      context += `\nLIVSSITUATION:\n`;
      if (life.location) context += `Ort: ${life.location}\n`;
      if (life.livingWith) context += `Lever med: ${life.livingWith}\n`;
      if (life.hasChildren) {
        const childText = life.hasChildren === 'yes' ? 'Ja' : 
                         life.hasChildren === 'no' ? 'Nej' : 
                         life.hasChildren === 'planning' ? 'Planerar barn' : life.hasChildren;
        context += `Barn: ${childText}\n`;
      }
      if (life.ongoingChanges) context += `Pågående förändringar: ${life.ongoingChanges}\n`;
      if (life.pastCrises) context += `Tidigare livskriser som påverkar: ${life.pastCrises}\n`;
    }

    // Lägg till velocity score om det finns
    if (clientData.velocity_score) {
      context += `\nNuvarande velocity score: ${clientData.velocity_score}/100\n`;
    }

    context += `\nKategori: ${clientData.category}\n`;
    context += `\n---\n\n`;

    return context;
  } catch (error) {
    console.error('Error building client context:', error);
    return '';
  }
}

// Standardiserad AI prompt-template för konsistent rådgivning
export function buildLovableAIPrompt(clientContext: any, assessmentData: string, baseSystemPrompt: string = ''): string {
  const metadata = clientContext.profile_metadata || {};
  
  // Extrahera data från onboarding med fallbacks
  const primaryRole = metadata.publicRole?.primaryRole || 'Okänd roll';
  const secondaryRole = metadata.publicRole?.secondaryRole || 'Ingen sekundär roll';
  const niche = metadata.publicRole?.niche || 'Okänd nisch';
  const strengths = metadata.publicRole?.creativeStrengths || 'Inga angivna styrkor';
  const challenges = metadata.publicRole?.challenges || 'Inga angivna utmaningar';
  const platforms = metadata.publicRole?.platforms?.length > 0 ? 
    metadata.publicRole.platforms.join(', ') : 'Inga angivna plattformar';
  const age = metadata.generalInfo?.age || 'Okänd ålder';
  const specialNeeds = [
    metadata.generalInfo?.physicalLimitations,
    metadata.generalInfo?.neurodiversity
  ].filter(Boolean).join(', ') || 'Inga angivna särskilda behov';
  const location = metadata.lifeMap?.location || 'Okänd ort';
  const ongoingChanges = metadata.lifeMap?.ongoingChanges || 'Inga angivna förändringar';

  const promptTemplate = `${baseSystemPrompt}

Här är klientens profil:
- Primär roll: ${primaryRole}
- Sekundär roll: ${secondaryRole}
- Nisch: ${niche}
- Kreativa styrkor: ${strengths}
- Upplevda svårigheter: ${challenges}
- Aktiva plattformar: ${platforms}
- Ålder: ${age}
- Särskilda behov: ${specialNeeds}
- Ort: ${location}
- Pågående livsförändringar: ${ongoingChanges}

Här är deras självskattning:
${assessmentData}`;

  return promptTemplate;
}

// Huvudfunktion för att enkelt få en komplett AI-prompt med Lovable template
export async function buildAIPromptWithLovableTemplate(
  clientId: string, 
  supabase: any, 
  assessmentData: string,
  baseSystemPrompt: string = 'Du är en professionell mentor som hjälper offentliga personer att identifiera och övervinna hinder.'
): Promise<string> {
  try {
    // Hämta klientdata
    const { data: clientData, error } = await supabase
      .from('clients')
      .select('name, profile_metadata, velocity_score, category')
      .eq('id', clientId)
      .single();

    if (error || !clientData) {
      console.warn('Could not fetch client data for prompt template:', error?.message);
      return `${baseSystemPrompt}\n\n${assessmentData}`;
    }

    return buildLovableAIPrompt(clientData, assessmentData, baseSystemPrompt);
  } catch (error) {
    console.error('Error building AI prompt with Lovable template:', error);
    return `${baseSystemPrompt}\n\n${assessmentData}`;
  }
}

// Bakåtkompatibilitet - behåller befintlig funktion för andra användningsområden
export async function buildAIPromptWithContext(
  clientId: string, 
  supabase: any, 
  baseSystemPrompt: string, 
  userMessage: string
): Promise<{ systemPrompt: string; userMessage: string }> {
  const assessmentPrompt = await buildAIPromptWithLovableTemplate(
    clientId,
    supabase,
    userMessage,
    baseSystemPrompt
  );

  return {
    systemPrompt: assessmentPrompt,
    userMessage: userMessage
  };
}