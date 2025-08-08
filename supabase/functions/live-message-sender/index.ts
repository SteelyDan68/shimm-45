import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { sender_id, recipient_ids, recipient_type, subject, content, notification_type, is_broadcast } = await req.json();

    console.log('🚀 Live message sending initiated:', {
      sender_id,
      recipient_type,
      recipient_count: recipient_ids?.length || 0,
      is_broadcast
    });

    if (!sender_id || !content || !recipient_ids || recipient_ids.length === 0) {
      throw new Error('Missing required fields: sender_id, content, or recipient_ids');
    }

    // Get sender info
    const { data: sender, error: senderError } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', sender_id)
      .single();

    if (senderError) {
      console.error('Sender fetch error:', senderError);
      throw new Error('Could not fetch sender information');
    }

    const senderName = `${sender.first_name || ''} ${sender.last_name || ''}`.trim() || sender.email;

    // Create or find conversations for each recipient
    const conversationIds = [];
    const messagePromises = [];

    for (const recipientId of recipient_ids) {
      try {
        // Skip Stefan AI for now - handle separately
        if (recipientId === 'stefan_ai') {
          continue;
        }

        // Find existing conversation between sender and recipient
        let { data: existingConversation, error: convError } = await supabaseClient
          .from('conversations')
          .select('id')
          .or(`and(created_by.eq.${sender_id},metadata->>recipient_id.eq.${recipientId}),and(created_by.eq.${recipientId},metadata->>recipient_id.eq.${sender_id})`)
          .eq('is_active', true)
          .maybeSingle();

        if (convError) {
          console.warn('Conversation search error:', convError);
        }

        let conversationId;

        if (!existingConversation) {
          // Create new conversation
          const { data: newConversation, error: createError } = await supabaseClient
            .from('conversations')
            .insert({
              title: `Meddelande med ${senderName}`,
              created_by: sender_id,
              is_active: true,
              metadata: {
                recipient_id: recipientId,
                type: 'direct',
                created_at: new Date().toISOString()
              }
            })
            .select('id')
            .single();

          if (createError) {
            console.error('Conversation creation error:', createError);
            continue;
          }

          conversationId = newConversation.id;

          // Add participants
          await supabaseClient
            .from('conversation_participants')
            .insert([
              { conversation_id: conversationId, user_id: sender_id, role: 'member' },
              { conversation_id: conversationId, user_id: recipientId, role: 'member' }
            ]);
        } else {
          conversationId = existingConversation.id;
        }

        conversationIds.push(conversationId);

        // Create message
        const messagePromise = supabaseClient
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: sender_id,
            content: subject ? `**${subject}**\n\n${content}` : content,
            message_type: 'text',
            is_read: false,
            metadata: {
              recipient_type: recipient_type,
              notification_type: notification_type,
              is_broadcast: is_broadcast || false,
              sent_at: new Date().toISOString()
            }
          });

        messagePromises.push(messagePromise);

        // Update conversation last message
        await supabaseClient
          .from('conversations')
          .update({
            last_message_at: new Date().toISOString(),
            last_message: {
              content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
              sender_name: senderName
            }
          })
          .eq('id', conversationId);

      } catch (recipientError) {
        console.error(`Error handling recipient ${recipientId}:`, recipientError);
      }
    }

    // Execute all message insertions
    const messageResults = await Promise.allSettled(messagePromises);
    const successfulMessages = messageResults.filter(result => result.status === 'fulfilled').length;
    const failedMessages = messageResults.filter(result => result.status === 'rejected').length;

    console.log('📨 Message sending results:', {
      successful: successfulMessages,
      failed: failedMessages,
      conversations: conversationIds.length
    });

    // Optional: Send push notifications (can be enhanced later)
    if (successfulMessages > 0) {
      // Here we could integrate with a push notification service
      console.log('✅ Would send push notifications to', successfulMessages, 'recipients');
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        messages_sent: successfulMessages,
        conversations_created: conversationIds.length,
        failed_messages: failedMessages,
        conversation_ids: conversationIds
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in live-message-sender function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Check function logs for more information' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});