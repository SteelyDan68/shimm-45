import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { aiService } from '../_shared/ai-service.ts';
import { buildAIPromptWithLovableTemplate } from '../_shared/client-context.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = "https://gcoorbcglxczmukzcmqs.supabase.co";
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey || '');

interface CacheData {
  data_type: string;
  source: string;
  data: any;
  created_at: string;
}

interface VelocityMetrics {
  followerGrowth: number;
  engagementRate: number;
  postFrequency: number;
  recentActivity: number;
}

serve(async (req) => {
  console.log('Client Logic function called:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { client_id, test_mode } = await req.json();
    
    // Test mode - check OpenAI API connectivity
    if (test_mode) {
      console.log('Testing OpenAI API connectivity...');
      
      if (!openAIApiKey) {
        return new Response(JSON.stringify({
          success: false,
          test_success: false,
          error: 'OpenAI API key not configured'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const testResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
          }
        });

        if (testResponse.ok) {
          return new Response(JSON.stringify({
            success: true,
            test_success: true,
            message: 'OpenAI API fungerar korrekt'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            test_success: false,
            error: `OpenAI API error: ${testResponse.status}`
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          test_success: false,
          error: `OpenAI API network error: ${error.message}`
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log('Processing logic for client:', client_id);

    if (!client_id) {
      throw new Error('client_id is required');
    }

    // 1. Fetch client data from cache
    const { data: cacheData, error: cacheError } = await supabase
      .from('client_data_cache')
      .select('*')
      .eq('client_id', client_id)
      .order('created_at', { ascending: false });

    if (cacheError) {
      console.error('Error fetching cache data:', cacheError);
      throw cacheError;
    }

    console.log('Found cache entries:', cacheData?.length || 0);

    // 2. Calculate velocity metrics
    const metrics = calculateVelocityMetrics(cacheData || []);
    console.log('Calculated metrics:', metrics);

    // 3. Determine velocity rank
    const velocityRank = calculateVelocityRank(metrics);
    console.log('Velocity rank:', velocityRank);

    // 4. Generate AI recommendation
    const aiRecommendation = await generateAIRecommendation(metrics, velocityRank, cacheData || [], client_id);
    console.log('AI recommendation generated');

    // 5. Update client logic_state
    const logicState = {
      velocity_rank: velocityRank,
      recommendation: aiRecommendation.recommendation,
      tone: aiRecommendation.tone,
      last_updated: new Date().toISOString(),
      metrics: metrics
    };

    const { error: updateError } = await supabase
      .from('clients')
      .update({ logic_state: logicState })
      .eq('id', client_id);

    if (updateError) {
      console.error('Error updating logic state:', updateError);
      throw updateError;
    }

    console.log('Logic state updated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      logic_state: logicState 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in client-logic function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateVelocityMetrics(cacheData: CacheData[]): VelocityMetrics {
  console.log('Calculating velocity metrics...');
  
  const socialMetrics = cacheData.filter(d => d.data_type === 'social_metrics');
  const newsData = cacheData.filter(d => d.data_type === 'news');
  const aiAnalysis = cacheData.filter(d => d.data_type === 'ai_analysis');

  // Calculate follower growth (mock calculation)
  let followerGrowth = 0;
  if (socialMetrics.length >= 2) {
    const latest = socialMetrics[0]?.data?.followers || 0;
    const previous = socialMetrics[1]?.data?.followers || 0;
    followerGrowth = previous > 0 ? ((latest - previous) / previous) * 100 : 0;
  }

  // Calculate engagement rate (mock calculation)
  const engagementRate = socialMetrics.length > 0 
    ? socialMetrics[0]?.data?.engagement_rate || 0 
    : 0;

  // Calculate post frequency (posts per week)
  const postFrequency = socialMetrics.length > 0 
    ? socialMetrics[0]?.data?.posts_per_week || 0 
    : 0;

  // Calculate recent activity score based on news mentions and AI analysis
  const recentActivity = (newsData.length * 10) + (aiAnalysis.length * 5);

  return {
    followerGrowth,
    engagementRate,
    postFrequency,
    recentActivity
  };
}

function calculateVelocityRank(metrics: VelocityMetrics): string {
  console.log('Calculating velocity rank...');
  
  let score = 0;

  // Follower growth scoring
  if (metrics.followerGrowth > 5) score += 3;
  else if (metrics.followerGrowth > 2) score += 2;
  else if (metrics.followerGrowth > 0) score += 1;

  // Engagement rate scoring
  if (metrics.engagementRate > 5) score += 3;
  else if (metrics.engagementRate > 3) score += 2;
  else if (metrics.engagementRate > 1) score += 1;

  // Post frequency scoring
  if (metrics.postFrequency > 7) score += 2;
  else if (metrics.postFrequency > 3) score += 1;

  // Recent activity scoring
  if (metrics.recentActivity > 50) score += 2;
  else if (metrics.recentActivity > 20) score += 1;

  // Determine rank based on total score
  if (score >= 8) return 'A';
  else if (score >= 5) return 'B';
  else return 'C';
}

async function generateAIRecommendation(
  metrics: VelocityMetrics, 
  velocityRank: string, 
  cacheData: CacheData[],
  clientId: string
): Promise<{ recommendation: string; tone: string }> {
  console.log('Generating AI recommendation...');

  // Build metrics and data summary for AI analysis
  const metricsData = `PERFORMANCE METRICS:
- Följartillväxt: ${metrics.followerGrowth.toFixed(1)}%
- Engagement rate: ${metrics.engagementRate.toFixed(1)}%
- Inläggsfrekvens: ${metrics.postFrequency} per vecka
- Aktivitetspoäng: ${metrics.recentActivity}
- Velocity rank: ${velocityRank}

RECENT DATA INSIGHTS:
${cacheData.slice(0, 3).map(d => `- ${d.data_type}: ${JSON.stringify(d.data).substring(0, 200)}...`).join('\n')}

UPPGIFT: Baserat på ovan metrics och klientens profil, ge strategiska rekommendationer för förbättring. 
Fokusera på konkreta åtgärder som passar klientens roll och situation.

Svara i JSON format:
{
  "recommendation": "Din rekommendation här...",
  "tone": "strategic"
}`;

  // Build AI prompt using Lovable template for strategic recommendations
  const systemPrompt = await buildAIPromptWithLovableTemplate(
    clientId,
    supabase,
    metricsData,
    'Du är en expert på influencer marketing och social media strategi. Du analyserar performance data och ger strategiska rekommendationer anpassade till klientens unika situation och roll. Svara alltid i JSON format på svenska.'
  );

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(content);
      return {
        recommendation: parsed.recommendation || 'Fortsätt med din nuvarande strategi och övervaka resultaten.',
        tone: parsed.tone || 'strategic'
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return {
        recommendation: 'Fortsätt med din nuvarande strategi och övervaka resultaten.',
        tone: 'strategic'
      };
    }

  } catch (error) {
    console.error('Error generating AI recommendation:', error);
    return {
      recommendation: 'Fortsätt med din nuvarande strategi och övervaka resultaten.',
      tone: 'strategic'
    };
  }
}