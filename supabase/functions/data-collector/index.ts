import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { client_id } = requestBody;
    
    console.log(`🚀 Starting data collection for client: ${client_id}`);
    
    if (!client_id) {
      throw new Error('Client ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', client_id)
      .single();

    if (profileError || !profile) {
      throw new Error(`Profile not found: ${profileError?.message}`);
    }

    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    
    // Mock data collection for now
    const mockNewsData = {
      title: `Nyhetsartikel om ${fullName}`,
      snippet: 'Detta är en simulerad nyhetsartikel för demonstration.',
      link: 'https://example.com/news',
      displayLink: 'example.com',
      collected_at: new Date().toISOString(),
      search_query: fullName
    };

    const mockSocialData = {
      platform: 'instagram',
      handle: profile.instagram_handle || 'exempel',
      metrics: {
        followers: Math.floor(Math.random() * 10000) + 1000,
        following: Math.floor(Math.random() * 1000) + 100,
        posts: Math.floor(Math.random() * 500) + 50,
        engagement_rate: Math.random() * 10 + 1
      },
      collected_at: new Date().toISOString(),
      data_source: 'api'
    };

    // Store in database
    await supabase.from('user_data_cache').insert([
      {
        user_id: client_id,
        data_type: 'news',
        data: mockNewsData,
        source: 'mock_api'
      },
      {
        user_id: client_id,
        data_type: 'social_metrics',
        data: mockSocialData,
        source: 'mock_api'
      }
    ]);

    console.log(`✅ Data collection completed for ${fullName}`);

    return new Response(JSON.stringify({
      success: true,
      result: {
        client_id,
        collected_data: {
          news: [mockNewsData],
          social_metrics: [mockSocialData],
          web_scraping: [],
          ai_analysis: []
        },
        total_data_points: 2,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Data collection error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});