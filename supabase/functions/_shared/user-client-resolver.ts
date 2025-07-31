import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Helper functions to resolve between user_id and client_id for backward compatibility
export interface UserClientData {
  user_id: string;
  client_id: string;
  name: string;
  profile_metadata: any;
  velocity_score: number | null;
  category: string;
}

export async function resolveUserClient(
  identifier: { user_id?: string; client_id?: string },
  supabase: any
): Promise<UserClientData | null> {
  try {
    let userData: UserClientData | null = null;

    if (identifier.user_id) {
      // If user_id is provided, get client data via user_id
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, name, profile_metadata, velocity_score, category, user_id')
        .eq('user_id', identifier.user_id)
        .single();

      if (clientError || !clientData) {
        // If no client record, try to get from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, profile_metadata')
          .eq('id', identifier.user_id)
          .single();

        if (profileError || !profileData) {
          console.warn('Could not find user data for user_id:', identifier.user_id);
          return null;
        }

        userData = {
          user_id: identifier.user_id,
          client_id: identifier.user_id, // Fallback to user_id if no client record
          name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Unknown User',
          profile_metadata: profileData.profile_metadata || {},
          velocity_score: 50, // Default value
          category: 'client'
        };
      } else {
        userData = {
          user_id: clientData.user_id,
          client_id: clientData.id,
          name: clientData.name,
          profile_metadata: clientData.profile_metadata,
          velocity_score: clientData.velocity_score,
          category: clientData.category
        };
      }
    } else if (identifier.client_id) {
      // If client_id is provided, get data via client_id (backward compatibility)
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, name, profile_metadata, velocity_score, category, user_id')
        .eq('id', identifier.client_id)
        .single();

      if (clientError || !clientData) {
        console.warn('Could not find client data for client_id:', identifier.client_id);
        return null;
      }

      userData = {
        user_id: clientData.user_id,
        client_id: clientData.id,
        name: clientData.name,
        profile_metadata: clientData.profile_metadata,
        velocity_score: clientData.velocity_score,
        category: clientData.category
      };
    } else {
      console.warn('Neither user_id nor client_id provided');
      return null;
    }

    return userData;
  } catch (error) {
    console.error('Error resolving user/client data:', error);
    return null;
  }
}

// Build client context using either user_id or client_id
export async function buildUserClientContext(
  identifier: { user_id?: string; client_id?: string },
  supabase: any
): Promise<string> {
  try {
    const userData = await resolveUserClient(identifier, supabase);
    
    if (!userData) {
      console.warn('Could not resolve user/client data');
      return '';
    }

    const metadata = userData.profile_metadata;
    if (!metadata) {
      return `Klient: ${userData.name} (kategori: ${userData.category})`;
    }

    // Build personal context from onboarding data
    let context = `KLIENTKONTEXT för ${userData.name}:\n\n`;

    // General information
    if (metadata.generalInfo) {
      const general = metadata.generalInfo;
      if (general.age) context += `Ålder: ${general.age} år\n`;
      if (general.gender) context += `Kön/pronomen: ${general.gender}\n`;
      if (general.physicalLimitations) context += `Fysiska begränsningar: ${general.physicalLimitations}\n`;
      if (general.neurodiversity) context += `Neurodiversitet/psykiska aspekter: ${general.neurodiversity}\n`;
    }

    // Professional role and career
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

    // Life situation
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

    // Add velocity score if available
    if (userData.velocity_score) {
      context += `\nNuvarande velocity score: ${userData.velocity_score}/100\n`;
    }

    context += `\nKategori: ${userData.category}\n`;
    context += `\n---\n\n`;

    return context;
  } catch (error) {
    console.error('Error building user/client context:', error);
    return '';
  }
}

// Build Lovable AI prompt with user/client compatibility
export function buildUniversalAIPrompt(
  userData: UserClientData, 
  assessmentData: string, 
  baseSystemPrompt: string = ''
): string {
  const metadata = userData.profile_metadata || {};
  
  // Extract data from onboarding with fallbacks
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

// Main function to build AI prompt with universal template
export async function buildAIPromptWithUniversalTemplate(
  identifier: { user_id?: string; client_id?: string },
  supabase: any, 
  assessmentData: string,
  baseSystemPrompt: string = 'Du är en professionell mentor som hjälper offentliga personer att identifiera och övervinna hinder.'
): Promise<string> {
  try {
    const userData = await resolveUserClient(identifier, supabase);
    
    if (!userData) {
      console.warn('Could not resolve user/client data for prompt template');
      return `${baseSystemPrompt}\n\n${assessmentData}`;
    }

    return buildUniversalAIPrompt(userData, assessmentData, baseSystemPrompt);
  } catch (error) {
    console.error('Error building AI prompt with universal template:', error);
    return `${baseSystemPrompt}\n\n${assessmentData}`;
  }
}

// Backward compatibility function for buildAIPromptWithContext
export async function buildAIPromptWithContext(
  identifier: { user_id?: string; client_id?: string },
  supabase: any, 
  baseSystemPrompt: string, 
  userMessage: string
): Promise<{ systemPrompt: string; userMessage: string }> {
  const assessmentPrompt = await buildAIPromptWithUniversalTemplate(
    identifier,
    supabase,
    userMessage,
    baseSystemPrompt
  );

  return {
    systemPrompt: assessmentPrompt,
    userMessage: userMessage
  };
}