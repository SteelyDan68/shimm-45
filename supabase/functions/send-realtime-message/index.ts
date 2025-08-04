import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with user's auth for RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('Unauthorized')
    }

    // Check if user is superadmin to use service role if needed
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
    
    const isSuperAdmin = userRoles?.some(r => r.role === 'superadmin') || false
    
    // Use service role client for superadmin to bypass RLS if needed
    const dbClient = isSuperAdmin 
      ? createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )
      : supabaseClient

    const requestBody = await req.json()
    console.log('📨 Request body:', requestBody)
    
    const { receiverId, content, subject } = requestBody

    if (!receiverId || !content) {
      console.error('Missing fields:', { receiverId: !!receiverId, content: !!content })
      throw new Error('Missing required fields: receiverId and content')
    }

    console.log('✅ Starting message insert:', {
      sender_id: user.id,
      receiver_id: receiverId,
      content_length: content.length,
      subject
    })

    // Insert the message using appropriate client
    const { data: message, error: insertError } = await dbClient
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content,
        subject,
        is_read: false
      })
      .select(`
        *,
        sender_profile:profiles!messages_sender_id_fkey(first_name, last_name, email),
        receiver_profile:profiles!messages_receiver_id_fkey(first_name, last_name, email)
      `)
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      throw insertError
    }

    console.log('✅ Message inserted successfully:', message.id)

    // Send real-time notification to receiver
    await supabaseClient
      .channel('messages')
      .send({
        type: 'broadcast',
        event: 'new_message',
        payload: {
          message,
          sender_id: user.id,
          receiver_id: receiverId
        }
      })

    console.log('✅ Real-time notification sent')

    // Get receiver's notification preferences using appropriate client
    const { data: receiverPrefs } = await dbClient
      .from('message_preferences')
      .select('email_notifications, internal_notifications')
      .eq('user_id', receiverId)
      .single()

    // Send email notification if enabled
    if (receiverPrefs?.email_notifications !== false) {
      const { data: receiverProfile } = await dbClient
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', receiverId)
        .single()

      if (receiverProfile?.email) {
        const { data: senderProfile } = await dbClient
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single()

        const senderName = senderProfile 
          ? `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() || user.email
          : user.email

        try {
          await supabaseClient.functions.invoke('send-message-notification', {
            body: {
              receiverEmail: receiverProfile.email,
              senderName,
              subject: subject || 'Nytt meddelande',
              messageContent: content,
            }
          })
          console.log('✅ Email notification sent')
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError)
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('🚨 Error in send-realtime-message:', error)
    console.error('🚨 Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return new Response(JSON.stringify({
      error: error.message,
      details: 'Check edge function logs for more information'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})