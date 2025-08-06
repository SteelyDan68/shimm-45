import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  role: string;
  custom_message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Send Invitation Function Started');
    
    const { email, role, custom_message = '' }: InvitationRequest = await req.json();
    
    console.log(`Sending invitation to: ${email} as ${role}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Ogiltig e-postadress');
    }

    // Calculate expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    console.log('Creating invitation in database...');
    
    // Create invitation
    const { data: invitation, error: createError } = await supabaseClient
      .from('invitations')
      .insert({
        email,
        invited_role: role,
        invited_by: '9065f42b-b9cc-4252-b73f-4374c6286b5e', // Admin user ID
        expires_at: expiresAt.toISOString(),
      })
      .select('id, token')
      .single();

    if (createError) {
      console.error('Database error:', createError);
      
      // Handle duplicate invitation
      if (createError.code === '23505') {
        console.log('Duplicate invitation detected, updating existing...');
        
        // Update existing invitation
        const { data: updatedInvitation, error: updateError } = await supabaseClient
          .from('invitations')
          .update({
            expires_at: expiresAt.toISOString(),
            status: 'pending'
          })
          .eq('email', email)
          .eq('status', 'pending')
          .select('id, token')
          .single();
          
        if (updateError) {
          throw new Error('Kunde inte uppdatera befintlig inbjudan');
        }
        
        invitation = updatedInvitation;
      } else {
        throw new Error('Kunde inte skapa inbjudan');
      }
    }

    if (!invitation?.token) {
      throw new Error('Ingen token genererades');
    }

    console.log('Invitation created successfully:', invitation.id);

    // Create invitation URL
    const appUrl = 'https://00a0d53e-45e2-45a5-8d70-ae3e74d84396.lovableproject.com';
    const invitationUrl = `${appUrl}/invitation-signup?token=${invitation.token}`;

    console.log('✅ Invitation sent successfully');

    return new Response(JSON.stringify({ 
      success: true,
      message: `Inbjudan skickad till ${email}`,
      invitation_id: invitation.id,
      invitation_url: invitationUrl,
      dev_mode: true // Indicate this is dev mode without email sending
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ Invitation error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error?.message || "Ett fel uppstod vid skickande av inbjudan"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);