import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 🔍 AI AVAILABILITY CHECKER
 * Kontrollerar tillgänglighet för OpenAI och Gemini APIs
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Checking AI model availability...');

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    // Parallella health checks
    const [openAIStatus, geminiStatus] = await Promise.allSettled([
      checkOpenAIAvailability(openAIApiKey),
      checkGeminiAvailability(geminiApiKey)
    ]);

    const openaiAvailable = openAIStatus.status === 'fulfilled' && openAIStatus.value;
    const geminiAvailable = geminiStatus.status === 'fulfilled' && geminiStatus.value;

    // Bestäm primär service
    let primaryService = 'none';
    if (openaiAvailable && geminiAvailable) {
      primaryService = 'openai'; // Prioritera OpenAI för kvalitet
    } else if (openaiAvailable) {
      primaryService = 'openai';
    } else if (geminiAvailable) {
      primaryService = 'gemini';
    }

    const result = {
      openai: openaiAvailable,
      gemini: geminiAvailable,
      primary: primaryService,
      status: openaiAvailable || geminiAvailable ? 'healthy' : 'down',
      timestamp: new Date().toISOString()
    };

    console.log('✅ AI availability check completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ AI availability check failed:', error);
    
    return new Response(JSON.stringify({
      openai: false,
      gemini: false,
      primary: 'none',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 200, // Return 200 even on error for client handling
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * 🔥 CHECK OPENAI AVAILABILITY
 */
async function checkOpenAIAvailability(apiKey: string | undefined): Promise<boolean> {
  if (!apiKey) {
    console.log('❌ OpenAI API key not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (response.ok) {
      console.log('✅ OpenAI API is available');
      return true;
    } else {
      console.log('❌ OpenAI API returned error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ OpenAI API check failed:', error.message);
    return false;
  }
}

/**
 * 💎 CHECK GEMINI AVAILABILITY
 */
async function checkGeminiAvailability(apiKey: string | undefined): Promise<boolean> {
  if (!apiKey) {
    console.log('❌ Gemini API key not configured');
    return false;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (response.ok) {
      console.log('✅ Gemini API is available');
      return true;
    } else {
      console.log('❌ Gemini API returned error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Gemini API check failed:', error.message);
    return false;
  }
}