import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PreapprovedSignupRequest {
  token: string;
  first_name?: string;
  last_name?: string;
  redirectTo?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { token, first_name, last_name, redirectTo }: PreapprovedSignupRequest =
      await req.json();

    if (!token || typeof token !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid token" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
      return new Response(
        JSON.stringify({ error: "Server misconfiguration" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const nowIso = new Date().toISOString();

    // 1) Validate invitation token
    const { data: invites, error: inviteErr } = await supabase
      .from("invitations")
      .select("id,email,invited_role,status,expires_at")
      .eq("token", token)
      .eq("status", "pending")
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .limit(1);

    if (inviteErr) {
      console.error("Invitation lookup error", inviteErr);
      return new Response(JSON.stringify({ error: "Invitation lookup failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const invitation = invites && invites.length > 0 ? invites[0] : null;

    if (!invitation) {
      return new Response(JSON.stringify({ error: "Invalid or expired invitation" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const email = String(invitation.email).toLowerCase();
    const invitedRole = invitation.invited_role as string;

    // 2) Create/invite the user with email verification required
    const { data: invited, error: adminInviteErr } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          first_name: first_name ?? null,
          last_name: last_name ?? null,
          invited_role: invitedRole,
          invitation_id: invitation.id,
        },
        // If redirectTo is not provided, Supabase will use the Auth settings' Site URL
        redirectTo: redirectTo || undefined,
      },
    );

    if (adminInviteErr) {
      console.warn("inviteUserByEmail error", adminInviteErr);
      // Common case: user already exists. In that case, we cannot reliably fetch user_id here.
      // Return a specific status so client can fallback to normal login + claim flow.
      return new Response(
        JSON.stringify({
          status: "user_exists",
          message: "User already registered. Please sign in and the invitation will be claimed automatically.",
          email,
        }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const userId = invited?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Failed to create user" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 3) Assign role (idempotent)
    const { error: roleErr } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: invitedRole, assigned_at: new Date().toISOString() });

    if (roleErr && !(roleErr as any)?.code === "23505") {
      console.warn("user_roles insert warning", roleErr);
      // Not fatal – continue
    }

    // 4) Mark invitation as accepted
    const { error: acceptErr } = await supabase
      .from("invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invitation.id);

    if (acceptErr) {
      console.warn("Invitation accept warning", acceptErr);
      // Not fatal – continue
    }

    const response = {
      status: "invited",
      invitation_id: invitation.id,
      user_id: userId,
      email,
      role_assigned: !roleErr,
      email_verification_required: true,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("preapproved-signup fatal error", err);
    return new Response(JSON.stringify({ error: err?.message || "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
