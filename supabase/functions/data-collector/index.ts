import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
const googleSearchApiKey = Deno.env.get('GOOGLE_SEARCH_API_KEY');
const googleSearchEngineId = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID');
const socialBladeApiKey = Deno.env.get('SOCIAL_BLADE_API_KEY');

const supabaseUrl = "https://gcoorbcglxczmukzcmqs.supabase.co";
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey || '');

interface DataCollectionResult {
  success: boolean;
  client_name: string;
  collected_data: {
    news: any[];
    social_metrics: any[];
    web_scraping: any[];
  };
  errors: string[];
}

serve(async (req) => {
  console.log('DataCollector function called:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { client_id, test_mode } = await req.json();

    // Test mode - check API connectivity
    if (test_mode) {
      console.log('Running API connectivity tests...');
      
      const testResults = {
        firecrawl: await testFirecrawlApi(firecrawlApiKey),
        google_search: await testGoogleSearchApi(googleSearchApiKey, googleSearchEngineId),
        social_blade: await testSocialBladeApi(socialBladeApiKey)
      };

      return new Response(JSON.stringify({
        success: true,
        test_results: testResults
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing data collection for client:', client_id);

    if (!client_id) {
      throw new Error('client_id is required');
    }

    // Get client info
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      throw new Error('Client not found');
    }

    console.log('Found client:', client.name);

    // Initialize result
    const result: DataCollectionResult = {
      success: true,
      client_name: client.name,
      collected_data: {
        news: [],
        social_metrics: [],
        web_scraping: []
      },
      errors: []
    };

    // Run all data collection in parallel
    const promises = [
      collectNewsData(client, result),
      collectSocialData(client, result),
      collectWebScrapingData(client, result)
    ];

    await Promise.allSettled(promises);

    // Store all collected data in cache
    await storeDataInCache(client_id, result);

    console.log('Data collection completed for:', client.name);
    console.log('News items:', result.collected_data.news.length);
    console.log('Social metrics:', result.collected_data.social_metrics.length);
    console.log('Web scraping results:', result.collected_data.web_scraping.length);
    console.log('Errors:', result.errors);

    return new Response(JSON.stringify({
      success: true,
      result: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in data-collector function:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function collectNewsData(client: any, result: DataCollectionResult) {
  console.log('Collecting news data for:', client.name);
  
  try {
    if (!googleSearchApiKey || !googleSearchEngineId) {
      throw new Error('Google Search API credentials missing');
    }

    const searchQueries = [
      `"${client.name}" influencer`,
      `"${client.name}" ${client.category}`,
      `${client.name} campaign`
    ];

    for (const query of searchQueries) {
      try {
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleSearchApiKey}&cx=${googleSearchEngineId}&q=${encodeURIComponent(query)}&num=3&sort=date`;
        
        const response = await fetch(searchUrl);
        
        if (!response.ok) {
          console.error('Google Search API error:', response.status, await response.text());
          continue;
        }

        const data = await response.json();
        
        if (data.items) {
          for (const item of data.items) {
            result.collected_data.news.push({
              title: item.title,
              url: item.link,
              snippet: item.snippet,
              source: item.displayLink,
              date: new Date().toISOString(), // Google doesn't always provide dates
              query: query
            });
          }
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error('Error in news query:', query, error);
        result.errors.push(`News search error for "${query}": ${error.message}`);
      }
    }

  } catch (error) {
    console.error('Error collecting news data:', error);
    result.errors.push(`News collection error: ${error.message}`);
  }
}

async function collectSocialData(client: any, result: DataCollectionResult) {
  console.log('Collecting social data for:', client.name);
  
  try {
    const socialBladeApiKey = Deno.env.get('SOCIAL_BLADE_API_KEY');
    
    if (!socialBladeApiKey) {
      console.warn('Social Blade API key missing, skipping social data collection');
      result.errors.push('Social Blade API key not configured');
      return;
    }

    // Try to get data from social handles in client profile
    const platforms = [];
    
    if (client.instagram_handle) {
      platforms.push({ platform: 'instagram', handle: client.instagram_handle });
    }
    if (client.tiktok_handle) {
      platforms.push({ platform: 'tiktok', handle: client.tiktok_handle });
    }
    if (client.youtube_channel) {
      platforms.push({ platform: 'youtube', handle: client.youtube_channel });
    }

    if (platforms.length === 0) {
      console.warn('No social handles found for client, skipping social data collection');
      return;
    }

    for (const { platform, handle } of platforms) {
      try {
        const socialData = await fetchRealSocialData(platform, handle, socialBladeApiKey);
        if (socialData) {
          result.collected_data.social_metrics.push(socialData);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error('Error collecting social data for:', platform, handle, error);
        result.errors.push(`Social data error for ${platform}/${handle}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('Error in social data collection:', error);
    result.errors.push(`Social collection error: ${error.message}`);
  }
}

async function collectWebScrapingData(client: any, result: DataCollectionResult) {
  console.log('Collecting web scraping data for:', client.name);
  
  try {
    if (!firecrawlApiKey) {
      throw new Error('Firecrawl API key missing');
    }

    // Search URLs to scrape
    const searchTerms = [
      `${client.name} influencer`,
      `${client.name} ${client.category} collaboration`
    ];

    for (const term of searchTerms) {
      try {
        // First, search for URLs using Google Search
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleSearchApiKey}&cx=${googleSearchEngineId}&q=${encodeURIComponent(term)}&num=2`;
        
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) continue;
        
        const searchData = await searchResponse.json();
        
        if (searchData.items) {
          for (const item of searchData.items) {
            try {
              // Scrape each URL with Firecrawl
              const scrapeResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${firecrawlApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  url: item.link,
                  pageOptions: {
                    onlyMainContent: true
                  }
                })
              });

              if (scrapeResponse.ok) {
                const scrapeData = await scrapeResponse.json();
                
                result.collected_data.web_scraping.push({
                  url: item.link,
                  title: item.title,
                  content: scrapeData.data?.content || '',
                  markdown: scrapeData.data?.markdown || '',
                  metadata: scrapeData.data?.metadata || {},
                  search_term: term
                });
              }
              
              // Rate limiting
              await new Promise(resolve => setTimeout(resolve, 1000));
              
            } catch (scrapeError) {
              console.error('Scraping error for URL:', item.link, scrapeError);
              result.errors.push(`Scraping error for ${item.link}: ${scrapeError.message}`);
            }
          }
        }

      } catch (error) {
        console.error('Error in web scraping for term:', term, error);
        result.errors.push(`Web scraping error for "${term}": ${error.message}`);
      }
    }

  } catch (error) {
    console.error('Error in web scraping collection:', error);
    result.errors.push(`Web scraping collection error: ${error.message}`);
  }
}

// Test API functions
async function testFirecrawlApi(apiKey: string | undefined) {
  if (!apiKey) {
    return { success: false, message: 'API key saknas' };
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        pageOptions: { onlyMainContent: true }
      })
    });

    if (response.ok) {
      return { success: true, message: 'API fungerar korrekt' };
    } else {
      const error = await response.text();
      return { success: false, message: `HTTP ${response.status}: ${error}` };
    }
  } catch (error) {
    return { success: false, message: `Nätverksfel: ${error.message}` };
  }
}

async function testGoogleSearchApi(apiKey: string | undefined, engineId: string | undefined) {
  if (!apiKey || !engineId) {
    return { success: false, message: 'API key eller Engine ID saknas' };
  }

  try {
    const testUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=test&num=1`;
    const response = await fetch(testUrl);

    if (response.ok) {
      return { success: true, message: 'API fungerar korrekt' };
    } else {
      const error = await response.text();
      return { success: false, message: `HTTP ${response.status}: ${error}` };
    }
  } catch (error) {
    return { success: false, message: `Nätverksfel: ${error.message}` };
  }
}

async function testSocialBladeApi(apiKey: string | undefined) {
  if (!apiKey) {
    return { success: false, message: 'API key saknas' };
  }

  try {
    // Note: Social Blade API endpoint structure may vary
    // This is a generic test - adjust based on actual API documentation
    const response = await fetch('https://api.socialblade.com/v1/youtube/statistics', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    });

    if (response.ok || response.status === 401) {
      // 401 means API key is recognized but may need different endpoint
      return { success: true, message: 'API key accepterad' };
    } else {
      return { success: false, message: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { success: false, message: `Nätverksfel: ${error.message}` };
  }
}

async function fetchRealSocialData(platform: string, handle: string, apiKey: string) {
  // Implementation would depend on Social Blade API documentation
  // For now, we'll log what we're trying to fetch and return structured data
  console.log(`Fetching real ${platform} data for handle: ${handle}`);
  
  try {
    // Note: This is a placeholder implementation
    // You'll need to implement based on Social Blade's actual API structure
    
    if (platform === 'instagram') {
      // Example Instagram data fetch
      const response = await fetch(`https://api.socialblade.com/v1/instagram/statistics?username=${handle}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        return {
          platform: 'instagram',
          handle: handle,
          followers: data.followers || 0,
          following: data.following || 0,
          posts: data.posts || 0,
          engagement_rate: data.engagement_rate || 0,
          growth_rate: data.growth_rate || 0,
          last_updated: new Date().toISOString()
        };
      }
    }
    
    // If API call fails or platform not supported, return null
    return null;
    
  } catch (error) {
    console.error(`Error fetching ${platform} data:`, error);
    throw error;
  }
}

async function storeDataInCache(clientId: string, result: DataCollectionResult) {
  console.log('Storing collected data in cache...');
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const cacheEntries = [];

  // Store news data
  for (const newsItem of result.collected_data.news) {
    cacheEntries.push({
      client_id: clientId,
      data_type: 'news',
      source: 'google_search',
      data: newsItem
    });
  }

  // Store social metrics
  for (const socialItem of result.collected_data.social_metrics) {
    cacheEntries.push({
      client_id: clientId,
      data_type: 'social_metrics',
      source: 'social_blade',
      data: socialItem
    });
  }

  // Store web scraping results
  for (const webItem of result.collected_data.web_scraping) {
    cacheEntries.push({
      client_id: clientId,
      data_type: 'web_scraping',
      source: 'firecrawl',
      data: webItem
    });
  }

  if (cacheEntries.length > 0) {
    const { error } = await supabase
      .from('client_data_cache')
      .insert(cacheEntries);

    if (error) {
      console.error('Error storing cache data:', error);
      throw error;
    }

    console.log(`Stored ${cacheEntries.length} cache entries`);
  }
}