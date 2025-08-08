import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sender_id, recipient_ids, content, subject } = await req.json();

    // Store notifications for each recipient
    const notifications = recipient_ids.map((recipient_id: string) => ({
      user_id: recipient_id,
      title: subject || 'Nytt meddelande',
      message: content,
      type: 'message',
      sender_id: sender_id,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabaseAdmin
      .from('user_notifications')
      .insert(notifications);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, count: recipient_ids.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);