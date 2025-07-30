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

// Hjälpfunktion för att bygga personlig systemPrompt baserat på klientkontext
export function buildPersonalizedSystemPrompt(clientContext: string, basePrompt: string): string {
  if (!clientContext.trim()) {
    return basePrompt;
  }

  return `${clientContext}

INSTRUKTIONER: Ta hänsyn till all information ovan om klienten när du ger råd. Anpassa ditt språk, dina exempel och rekommendationer baserat på:
- Deras professionella roll och nisch
- Deras kreativa styrkor och utmaningar
- Deras livssituation och pågående förändringar
- Eventuella fysiska eller psykiska särskilda behov
- Deras aktiva plattformar och målgrupp

${basePrompt}`;
}

// Huvudfunktion för att enkelt få en komplett AI-prompt med klientkontext
export async function buildAIPromptWithContext(
  clientId: string, 
  supabase: any, 
  baseSystemPrompt: string, 
  userMessage: string
): Promise<{ systemPrompt: string; userMessage: string }> {
  const clientContext = await buildClientContext(clientId, supabase);
  const personalizedSystemPrompt = buildPersonalizedSystemPrompt(clientContext, baseSystemPrompt);

  return {
    systemPrompt: personalizedSystemPrompt,
    userMessage: userMessage
  };
}