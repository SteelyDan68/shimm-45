// admin-list-auth-users: Returns auth.users summary for Superadmins only
// Uses service role key to access auth admin API and lists unconfirmed users

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";

    // Client with requester auth context (to read who is calling)
    const supabaseUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client with service role for auth.admin access
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Identify caller
    const {
      data: { user },
      error: userErr,
    } = await supabaseUser.auth.getUser();
    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: "not_authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authorization: only superadmins
    const { data: isSuperadmin, error: roleErr } = await supabaseAdmin.rpc(
      "is_superadmin",
      { _user_id: user.id }
    );

    if (roleErr) {
      return new Response(
        JSON.stringify({ error: "role_check_failed", details: roleErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isSuperadmin) {
      return new Response(
        JSON.stringify({ error: "forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // List users from auth
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) {
      return new Response(
        JSON.stringify({ error: "list_failed", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const users = (data?.users || []).map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      email_confirmed_at: (u.email_confirmed_at as string | null) ?? null,
      confirmed: !!u.email_confirmed_at,
      last_sign_in_at: (u.last_sign_in_at as string | null) ?? null,
    }));

    return new Response(
      JSON.stringify({ users }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "unexpected_error", details: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
