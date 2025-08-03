/**
 * ========================================================
 * UNIFIED USER RESOLVER - SINGLE SOURCE OF TRUTH
 * ========================================================
 * 
 * This replaces the old user-client-resolver.ts
 * ALL user operations now use user_id ONLY
 * Roles are fetched via user_roles table
 * No more client_id confusion
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Single user data structure - no more client_id confusion
export interface UnifiedUserData {
  user_id: string;
  name: string;
  email: string;
  profile_metadata: any;
  velocity_score: number | null;
  category: string;
  roles: string[];
  coach_relationships: string[];
  client_relationships: string[];
}

/**
 * SINGLE FUNCTION TO RESOLVE ANY USER
 * Uses ONLY user_id - no more client_id parameter confusion
 */
export async function resolveUser(
  user_id: string,
  supabase: any
): Promise<UnifiedUserData | null> {
  try {
    // 1. Get basic profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, client_category, primary_role, velocity_score, profile_metadata, custom_fields')
      .eq('id', user_id)
      .single();

    if (profileError || !profileData) {
      console.warn('Could not find user profile for user_id:', user_id);
      return null;
    }

    // 2. Get roles and relationships using our new function
    const { data: contextData, error: contextError } = await supabase
      .rpc('get_user_roles_and_relationships', { target_user_id: user_id });

    if (contextError) {
      console.warn('Could not get user context:', contextError);
    }

    const context = contextData?.[0] || { roles: [], coach_relationships: [], client_relationships: [] };

    // 3. Build unified user data
    const userData: UnifiedUserData = {
      user_id: user_id,
      name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || profileData.email || 'Unknown User',
      email: profileData.email,
      profile_metadata: profileData.profile_metadata || {},
      velocity_score: profileData.velocity_score || 50,
      category: profileData.client_category || profileData.primary_role || 'general',
      roles: context.roles || [],
      coach_relationships: context.coach_relationships || [],
      client_relationships: context.client_relationships || []
    };

    return userData;
  } catch (error) {
    console.error('Error resolving user data:', error);
    return null;
  }
}

/**
 * BUILD USER CONTEXT FOR AI PROMPTS
 * Uses unified user data - no more client_id confusion
 */
export async function buildUserContext(
  user_id: string,
  supabase: any
): Promise<string> {
  try {
    const userData = await resolveUser(user_id, supabase);
    
    if (!userData) {
      console.warn('Could not resolve user data');
      return '';
    }

    const metadata = userData.profile_metadata;
    if (!metadata) {
      return `Användare: ${userData.name} (kategori: ${userData.category}) med roller: ${userData.roles.join(', ')}`;
    }

    // Build personal context from onboarding data
    let context = `ANVÄNDARKONTEXT för ${userData.name}:\n\n`;
    context += `Roller: ${userData.roles.join(', ')}\n`;

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

    // Add relationships
    if (userData.coach_relationships.length > 0) {
      context += `\nAktiva coach-relationer: ${userData.coach_relationships.length} st\n`;
    }
    if (userData.client_relationships.length > 0) {
      context += `Aktiva klient-relationer: ${userData.client_relationships.length} st\n`;
    }

    context += `\nKategori: ${userData.category}\n`;
    context += `\n---\n\n`;

    return context;
  } catch (error) {
    console.error('Error building user context:', error);
    return '';
  }
}

/**
 * BUILD AI PROMPT WITH USER CONTEXT
 * Simplified - only takes user_id
 */
export function buildUniversalAIPrompt(
  userData: UnifiedUserData, 
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

Här är användarens profil:
- User ID: ${userData.user_id}
- Roller: ${userData.roles.join(', ')}
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

/**
 * MAIN FUNCTION TO BUILD AI PROMPT - UNIFIED APPROACH
 * Only takes user_id - no more confusion
 */
export async function buildAIPromptWithUnifiedUser(
  user_id: string,
  supabase: any, 
  assessmentData: string,
  baseSystemPrompt: string = 'Du är en professionell mentor som hjälper användare att identifiera och övervinna hinder.'
): Promise<string> {
  try {
    const userData = await resolveUser(user_id, supabase);
    
    if (!userData) {
      console.warn('Could not resolve user data for prompt template');
      return `${baseSystemPrompt}\n\n${assessmentData}`;
    }

    return buildUniversalAIPrompt(userData, assessmentData, baseSystemPrompt);
  } catch (error) {
    console.error('Error building AI prompt with unified user:', error);
    return `${baseSystemPrompt}\n\n${assessmentData}`;
  }
}

// Backward compatibility function for existing code
export async function buildAIPromptWithContext(
  user_id: string,
  supabase: any, 
  baseSystemPrompt: string, 
  userMessage: string
): Promise<{ systemPrompt: string; userMessage: string }> {
  const assessmentPrompt = await buildAIPromptWithUnifiedUser(
    user_id,
    supabase,
    userMessage,
    baseSystemPrompt
  );

  return {
    systemPrompt: assessmentPrompt,
    userMessage: userMessage
  };
}