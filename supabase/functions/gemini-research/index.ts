import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = "https://gcoorbcglxczmukzcmqs.supabase.co";
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey || '');

serve(async (req) => {
  console.log('Gemini research function called:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { client_id, query_type = 'comprehensive', test_mode } = await req.json();
    
    // Test mode - check Gemini API connectivity
    if (test_mode) {
      console.log('Testing Gemini API connectivity...');
      
      if (!geminiApiKey) {
        return new Response(JSON.stringify({
          success: false,
          test_success: false,
          error: 'Gemini API key not configured'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);

        if (testResponse.ok) {
          return new Response(JSON.stringify({
            success: true,
            test_success: true,
            message: 'Gemini API fungerar korrekt'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            test_success: false,
            error: `Gemini API error: ${testResponse.status}`
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          test_success: false,
          error: `Gemini API network error: ${error.message}`
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    console.log('Processing Gemini research for client:', client_id, 'type:', query_type);

    if (!client_id) {
      throw new Error('client_id is required');
    }

    // Get client info first
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      throw new Error('Client not found');
    }

    console.log('Found client:', client.name);

    // Generate research queries based on client info
    const researchData = await performGeminiResearch(client, query_type);
    console.log('Gemini research completed');

    // Store research data in cache
    const cacheEntries = [
      {
        client_id: client_id,
        data_type: 'web_research',
        source: 'gemini',
        data: {
          query_type: query_type,
          research_results: researchData,
          timestamp: new Date().toISOString()
        }
      }
    ];

    const { error: cacheError } = await supabase
      .from('client_data_cache')
      .insert(cacheEntries);

    if (cacheError) {
      console.error('Error storing cache data:', cacheError);
      throw cacheError;
    }

    console.log('Research data stored successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      research_data: researchData,
      client_name: client.name
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-research function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function performGeminiResearch(client: any, queryType: string) {
  console.log('Starting Gemini research for:', client.name);

  const queries = generateResearchQueries(client, queryType);
  const results = [];

  for (const query of queries) {
    try {
      console.log('Executing query:', query.title);
      const response = await callGeminiAPI(query.prompt);
      
      results.push({
        category: query.category,
        title: query.title,
        query: query.prompt,
        result: response,
        timestamp: new Date().toISOString()
      });

      // Add small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Error in individual query:', error);
      results.push({
        category: query.category,
        title: query.title,
        query: query.prompt,
        result: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  return results;
}

function generateResearchQueries(client: any, queryType: string) {
  const baseQueries = [
    {
      category: 'news_mentions',
      title: 'Senaste nyhetsomnämnanden',
      prompt: `Sök efter senaste nyhetsomnämnanden om ${client.name} på svenska och engelska. Inkludera datum, källa och sammanfattning av varje omnämnande från de senaste 30 dagarna. Fokusera på relevanta mediekanaler, branschpublikationer och sociala medier.`
    },
    {
      category: 'industry_trends',
      title: 'Branschtrends och konkurrenter',
      prompt: `Analysera aktuella trender inom ${client.category} branchen som är relevanta för ${client.name}. Identifiera konkurrenter, marknadstrender och möjligheter. Inkludera information om vad som händer inom influencer marketing och content creation just nu.`
    },
    {
      category: 'collaboration_opportunities',
      title: 'Samarbetsmöjligheter',
      prompt: `Hitta potentiella varumärkessamarbeten och partnerships för ${client.name} inom ${client.category} kategorin. Leta efter brands som aktivt söker influencers, nya produktlanseringar eller kampanjer där ${client.name} skulle passa in.`
    }
  ];

  if (queryType === 'comprehensive') {
    baseQueries.push(
      {
        category: 'social_presence',
        title: 'Social närvaro och engagement',
        prompt: `Analysera ${client.name}s sociala medier närvaro. Kolla deras senaste innehåll, engagement rates, följartillväxt och jämför med liknande profiler inom ${client.category}. Inkludera Instagram, TikTok och YouTube om tillämpligt.`
      },
      {
        category: 'reputation_analysis',
        title: 'Ryktesanalys',
        prompt: `Gör en sentimentanalys av hur ${client.name} uppfattas online. Leta efter recensioner, kommentarer och diskussioner om dem på olika plattformar. Identifiera både positiva och negativa trender i deras rykte.`
      }
    );
  }

  return baseQueries;
}

async function callGeminiAPI(prompt: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
}