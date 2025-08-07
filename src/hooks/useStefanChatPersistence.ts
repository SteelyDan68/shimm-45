import { supabase } from '@/integrations/supabase/client';

export type StefanMessageRole = 'user' | 'assistant' | 'system' | 'coach';

interface InsertMessageParams {
  conversation_id: string;
  sender_id: string;
  role: StefanMessageRole;
  content: string;
  ai_model?: string;
  tokens?: number;
  metadata?: Record<string, any>;
}

export const ensureStefanConversation = async (userId: string) => {
  // Try get latest active conversation
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) return { id: existing.id };

  // Create a new conversation (align with existing schema)
  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      created_by: userId,
      participant_ids: [userId],
      title: 'Stefan Chat',
      status: 'active',
      last_message_at: new Date().toISOString(),
      model: 'stefan_ai'
    })
    .select('id')
    .single();

  if (error || !created) throw new Error(error?.message || 'Kunde inte skapa konversation');
  return { id: created.id };
};

export const insertStefanMessage = async ({
  conversation_id,
  sender_id,
  role,
  content,
  ai_model,
  tokens,
  metadata
}: InsertMessageParams) => {
  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id,
      sender_id,
      role,
      content,
      ai_model,
      tokens,
      metadata: metadata || {}
    });

  if (error) throw new Error(error.message);

  // Update conversation timestamp
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversation_id);
};

export const subscribeToStefanMessages = (
  conversationId: string,
  onInsert: (payload: any) => void
) => {
  const channel = supabase
    .channel('schema-db-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
      if ((payload.new as any)?.conversation_id === conversationId) {
        onInsert(payload);
      }
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
};
