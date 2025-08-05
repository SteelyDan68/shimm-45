import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserAttributes } from './useUserAttributes';

export interface StefanInteraction {
  id: string;
  user_id: string;
  interaction_type: 'coaching' | 'personality' | 'memory' | 'analysis';
  content: {
    message: string;
    persona: 'caring' | 'motivational' | 'analytical' | 'supportive';
    context: any;
  };
  response?: string;
  timestamp: string;
  metadata?: any;
}

export interface StefanPersonality {
  persona: 'caring' | 'motivational' | 'analytical' | 'supportive';
  context_awareness: number;
  empathy_level: number;
  coaching_style: string;
}

export interface StefanMemory {
  id: string;
  user_id: string;
  memory_type: 'interaction' | 'preference' | 'goal' | 'insight';
  content: any;
  importance_score: number;
  created_at: string;
  last_accessed: string;
}

export const useUnifiedStefan = (userId?: string) => {
  const [interactions, setInteractions] = useState<StefanInteraction[]>([]);
  const [memories, setMemories] = useState<StefanMemory[]>([]);
  const [personality, setPersonality] = useState<StefanPersonality | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { setAttribute, getAttribute, hasAttribute } = useUserAttributes();

  // Fetch Stefan data for user
  const fetchStefanData = useCallback(async (targetUserId?: string) => {
    if (!targetUserId && !userId) return;
    
    const fetchUserId = targetUserId || userId;
    setLoading(true);

    try {
      // Get Stefan interactions using attributes
      const stefanInteractionAttr = await getAttribute(fetchUserId!, 'stefan_interactions');
      if (stefanInteractionAttr && Array.isArray(stefanInteractionAttr)) {
        setInteractions(stefanInteractionAttr as unknown as StefanInteraction[]);
      }

      // Get Stefan memories using attributes
      const stefanMemoryAttr = await getAttribute(fetchUserId!, 'stefan_memories');
      if (stefanMemoryAttr && Array.isArray(stefanMemoryAttr)) {
        setMemories(stefanMemoryAttr as unknown as StefanMemory[]);
      }

      // Get Stefan personality using attributes
      const stefanPersonalityAttr = await getAttribute(fetchUserId!, 'stefan_personality');
      if (stefanPersonalityAttr && typeof stefanPersonalityAttr === 'object') {
        setPersonality(stefanPersonalityAttr as unknown as StefanPersonality);
      } else {
        // Set default personality
        const defaultPersonality: StefanPersonality = {
          persona: 'caring',
          context_awareness: 0.8,
          empathy_level: 0.9,
          coaching_style: 'supportive'
        };
        setPersonality(defaultPersonality);
        await setAttribute(fetchUserId!, {
          attribute_key: 'stefan_personality',
          attribute_value: defaultPersonality,
          attribute_type: 'config'
        });
      }

    } catch (error) {
      console.error('Error fetching Stefan data:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta Stefan AI data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [userId, getAttribute, setAttribute, toast]);

  // Create new Stefan interaction
  const createInteraction = useCallback(async (
    targetUserId: string,
    interactionData: Omit<StefanInteraction, 'id' | 'user_id' | 'timestamp'>
  ) => {
    try {
      const newInteraction: StefanInteraction = {
        id: crypto.randomUUID(),
        user_id: targetUserId,
        timestamp: new Date().toISOString(),
        ...interactionData
      };

      // Get current interactions
      const currentInteractions = await getAttribute(targetUserId, 'stefan_interactions') || [];
      const updatedInteractions = Array.isArray(currentInteractions) 
        ? [...(currentInteractions as unknown as StefanInteraction[]), newInteraction]
        : [newInteraction];

      // Update attribute with new interaction
      const success = await setAttribute(targetUserId, {
        attribute_key: 'stefan_interactions',
        attribute_value: updatedInteractions,
        attribute_type: 'metadata'
      });

      if (success) {
        setInteractions(updatedInteractions);
        toast({
          title: "Stefan interaction skapad",
          description: "Ny interaction har lagrats"
        });
      }

      return success;
    } catch (error) {
      console.error('Error creating Stefan interaction:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa Stefan interaction",
        variant: "destructive"
      });
      return false;
    }
  }, [getAttribute, setAttribute, toast]);

  // Update user response to interaction
  const updateUserResponse = useCallback(async (
    interactionId: string,
    response: string
  ) => {
    try {
      const updatedInteractions = interactions.map(interaction =>
        interaction.id === interactionId
          ? { ...interaction, response }
          : interaction
      );

      if (userId) {
        const success = await setAttribute(userId, {
          attribute_key: 'stefan_interactions',
          attribute_value: updatedInteractions,
          attribute_type: 'metadata'
        });

        if (success) {
          setInteractions(updatedInteractions);
          toast({
            title: "Svar uppdaterat",
            description: "Ditt svar på Stefan har sparats"
          });
        }

        return success;
      }

      return false;
    } catch (error) {
      console.error('Error updating user response:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara ditt svar",
        variant: "destructive"
      });
      return false;
    }
  }, [interactions, userId, setAttribute, toast]);

  // Store memory for Stefan
  const storeMemory = useCallback(async (
    targetUserId: string,
    memoryData: Omit<StefanMemory, 'id' | 'user_id' | 'created_at' | 'last_accessed'>
  ) => {
    try {
      const newMemory: StefanMemory = {
        id: crypto.randomUUID(),
        user_id: targetUserId,
        created_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
        ...memoryData
      };

      // Get current memories
      const currentMemories = await getAttribute(targetUserId, 'stefan_memories') || [];
      const updatedMemories = Array.isArray(currentMemories) 
        ? [...(currentMemories as unknown as StefanMemory[]), newMemory]
        : [newMemory];

      // Keep only most important memories (limit to 100)
      const sortedMemories = updatedMemories
        .sort((a, b) => b.importance_score - a.importance_score)
        .slice(0, 100);

      const success = await setAttribute(targetUserId, {
        attribute_key: 'stefan_memories',
        attribute_value: sortedMemories,
        attribute_type: 'metadata'
      });

      if (success) {
        setMemories(sortedMemories);
      }

      return success;
    } catch (error) {
      console.error('Error storing Stefan memory:', error);
      return false;
    }
  }, [getAttribute, setAttribute]);

  // Update personality
  const updatePersonality = useCallback(async (
    targetUserId: string,
    newPersonality: Partial<StefanPersonality>
  ) => {
    try {
      const updatedPersonality = { ...personality, ...newPersonality };
      
      const success = await setAttribute(targetUserId, {
        attribute_key: 'stefan_personality',
        attribute_value: updatedPersonality,
        attribute_type: 'config'
      });

      if (success) {
        setPersonality(updatedPersonality as StefanPersonality);
        toast({
          title: "Stefan personlighet uppdaterad",
          description: "Stefans beteende har anpassats"
        });
      }

      return success;
    } catch (error) {
      console.error('Error updating Stefan personality:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera Stefan personlighet",
        variant: "destructive"
      });
      return false;
    }
  }, [personality, setAttribute, toast]);

  // Check if user has Stefan enabled
  const hasStefanEnabled = useCallback(async (targetUserId: string) => {
    return await hasAttribute(targetUserId, 'stefan_enabled', true);
  }, [hasAttribute]);

  // Enable Stefan for user
  const enableStefan = useCallback(async (targetUserId: string) => {
    return await setAttribute(targetUserId, {
      attribute_key: 'stefan_enabled',
      attribute_value: true,
      attribute_type: 'config'
    });
  }, [setAttribute]);

  // Get context-aware Stefan response
  const getStefanResponse = useCallback(async (
    targetUserId: string,
    userMessage: string,
    context?: any
  ) => {
    try {
      // Use edge function for AI processing
      const { data, error } = await supabase.functions.invoke('unified-stefan-chat', {
        body: {
          user_id: targetUserId,
          message: userMessage,
          context,
          personality,
          recent_memories: memories.slice(0, 10)
        }
      });

      if (error) throw error;

      // Store this interaction
      if (data?.response) {
        await createInteraction(targetUserId, {
          interaction_type: 'coaching',
          content: {
            message: userMessage,
            persona: personality?.persona || 'caring',
            context
          },
          response: data.response
        });
      }

      return data?.response || "Jag förstår inte riktigt, kan du förklara mer?";
    } catch (error) {
      console.error('Error getting Stefan response:', error);
      return "Ursäkta, jag har tekniska problem just nu. Försök igen senare.";
    }
  }, [personality, memories, createInteraction]);

  // Initialize on component mount
  useEffect(() => {
    if (userId) {
      fetchStefanData(userId);
    }
  }, [userId, fetchStefanData]);

  return {
    interactions,
    memories,
    personality,
    loading,
    createInteraction,
    updateUserResponse,
    storeMemory,
    updatePersonality,
    hasStefanEnabled,
    enableStefan,
    getStefanResponse,
    refetch: fetchStefanData
  };
};
