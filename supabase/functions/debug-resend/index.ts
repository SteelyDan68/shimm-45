import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    let domains: any[] | null = null;
    let resendError: string | null = null;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const domainList = await resend.domains.list();
        domains = domainList?.data?.map((d: any) => ({
          id: d.id,
          name: d.name,
          status: d.status,
          region: d.region,
          created_at: d.created_at,
        })) || [];
      } catch (e: any) {
        resendError = e?.message || String(e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        resendStatus: {
          hasKey: !!resendApiKey,
          keyLength: resendApiKey?.length || 0,
          keyPrefix: resendApiKey?.substring(0, 3) || 'none',
          keyStartsWithRe: resendApiKey?.startsWith('re_') || false,
          domains,
          error: resendError,
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);