import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { aiService } from '../_shared/ai-service.ts';

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
    console.log('Parsing request body...');
    const { client_id, test_mode, platform, url } = await req.json();
    console.log('Request parameters:', { client_id, test_mode, platform, url });

    // Test mode - check API connectivity or specific platform test
    if (test_mode) {
      console.log('Running API tests...');
      
      
      // Twitter API test - DISABLED
      if (platform === 'twitter') {
        console.log('Twitter API has been disabled due to authentication issues');
        
        return new Response(JSON.stringify({
          success: false,
          data: null,
          error: 'Twitter API funktionen har tagits bort på grund av autentiseringsproblem'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // General API connectivity tests
      const testResults = {
        firecrawl: await testFirecrawlApi(firecrawlApiKey),
        google_search: await testGoogleSearchApi(googleSearchApiKey, googleSearchEngineId),
        social_blade: await testSocialBladeApi(socialBladeApiKey),
        rapidapi: await testRapidApi(),
        
        // twitter_api removed due to authentication issues
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
      console.error('Missing client_id parameter');
      throw new Error('client_id is required');
    }

    console.log('Fetching client from database...');

    // Try to find client in profiles table first (new approach)
    let client = null;
    let clientError = null;
    
    const { data: profileClient, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', client_id)
      .single();

    if (profileClient) {
      console.log('Found client in profiles table:', profileClient.email);
      // Transform profile to client format for compatibility
      client = {
        id: profileClient.id,
        name: `${profileClient.first_name || ''} ${profileClient.last_name || ''}`.trim() || profileClient.email,
        category: profileClient.client_category || profileClient.primary_role || 'general',
        instagram_handle: profileClient.instagram_handle,
        tiktok_handle: profileClient.tiktok_handle,
        facebook_page: profileClient.facebook_handle,
        youtube_handle: profileClient.youtube_handle,
        twitter_handle: profileClient.twitter_handle,
        snapchat_handle: profileClient.snapchat_handle,
        platforms: profileClient.platforms || [],
        email: profileClient.email,
        status: profileClient.status || 'active'
      };
    } else {
      // Fallback to clients table (legacy approach)
      console.log('Profile not found, trying clients table...');
      const { data: legacyClient, error: legacyError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', client_id)
        .single();

      client = legacyClient;
      clientError = legacyError;
    }

    if (!client) {
      console.error('Client not found in either profiles or clients table:', { 
        profileError: profileError?.message, 
        clientError: clientError?.message, 
        client_id 
      });
      throw new Error('Client not found');
}


    console.log('Found client:', client.name);
    console.log('Starting data collection processes...');

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

    // Run all data collection in parallel for faster execution
    console.log('Starting parallel data collection processes...');
    const promises = [
      collectNewsData(client, result),
      collectSocialData(client, result),
      collectWebScrapingData(client, result),
      collectMissingSocialProfiles(client, result),
      collectSentimentAnalysis(client, result)
    ];

    // Use Promise.allSettled with timeout
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.log('Data collection timeout reached, continuing with available results');
        resolve('timeout');
      }, 90000); // 90 seconds max
    });

    await Promise.race([
      Promise.allSettled(promises),
      timeoutPromise
    ]);
    
    console.log('All data collection processes completed or timed out');

    // Store all collected data in cache
    console.log('Storing data in cache...');
    await storeDataInCache(client_id, result);

    console.log('Data collection completed for:', client.name);
    console.log('News items:', result.collected_data.news.length);
    console.log('Social metrics:', result.collected_data.social_metrics.length);
    console.log('Web scraping results:', result.collected_data.web_scraping.length);
    console.log('Errors:', result.errors);
    
    console.log('Returning successful response...');
    return new Response(JSON.stringify({
      success: true,
      result: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in data-collector function:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
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

    // First collect Swedish news specifically
    await collectSwedishNews(client, result);

    // Then collect general news for backwards compatibility
    const searchQueries = [
      `"${client.name}" influencer`,
      `"${client.name}" ${client.category}`,
      `${client.name} campaign`
    ];

    for (const query of searchQueries.slice(0, 1)) { // Limit to 1 query for speed
      try {
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleSearchApiKey}&cx=${googleSearchEngineId}&q=${encodeURIComponent(query)}&num=2&sort=date`;
        
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
              date: new Date().toISOString(),
              query: query,
              type: 'general'
            });
          }
        }

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

async function collectSwedishNews(client: any, result: DataCollectionResult) {
  console.log('Collecting Swedish news for:', client.name);
  
  const swedishNewsSources = [
    'aftonbladet.se',
    'expressen.se', 
    'dn.se',
    'svd.se',
    'svt.se'
  ];

  try {
    const searchTerms = [
      `"${client.name}"`,
      client.name,
      `${client.name} influencer`
    ];

    for (const term of searchTerms) {
      try {
        const siteQueries = swedishNewsSources.slice(0, 3).map(site => 
          `${term} site:${site}`
        );

        for (const siteQuery of siteQueries) {
          try {
            const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleSearchApiKey}&cx=${googleSearchEngineId}&q=${encodeURIComponent(siteQuery)}&num=2&sort=date&dateRestrict=m3`;
            
            const response = await fetch(searchUrl);
            
            if (!response.ok) {
              console.log(`Search failed for ${siteQuery}: ${response.status}`);
              continue;
            }

            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
              for (const item of data.items) {
                const newsItem = {
                  title: item.title,
                  url: item.link,
                  snippet: item.snippet,
                  source: item.displayLink,
                  date: item.pagemap?.metatags?.[0]?.['article:published_time'] || 
                        item.pagemap?.metatags?.[0]?.['datePublished'] ||
                        new Date().toISOString(),
                  query: term,
                  type: 'swedish_news',
                  image: item.pagemap?.cse_image?.[0]?.src || 
                         item.pagemap?.metatags?.[0]?.['og:image'] ||
                         item.pagemap?.metatags?.[0]?.image,
                  author: item.pagemap?.metatags?.[0]?.author,
                  newsSource: item.displayLink
                };

                result.collected_data.news.push(newsItem);
                console.log(`Found Swedish news: ${item.title} from ${item.displayLink}`);
              }
            }

            await new Promise(resolve => setTimeout(resolve, 200));
            
          } catch (error) {
            console.error(`Error searching ${siteQuery}:`, error);
          }
        }

      } catch (error) {
        console.error(`Error with search term ${term}:`, error);
      }
    }

    console.log(`Swedish news collection completed. Found ${result.collected_data.news.filter(n => n.type === 'swedish_news').length} Swedish news items`);

  } catch (error) {
    console.error('Error collecting Swedish news:', error);
    result.errors.push(`Swedish news collection failed: ${error.message}`);
  }
}

async function collectSocialData(client: any, result: DataCollectionResult) {
  console.log('Collecting social data for:', client.name);
  
  try {
    const socialBladeApiKey = Deno.env.get('SOCIAL_BLADE_API_KEY');
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    
    const platforms = [];
    
    if (client.instagram_handle) {
      platforms.push({ platform: 'instagram', handle: client.instagram_handle });
    }
    if (client.tiktok_handle) {
      platforms.push({ platform: 'tiktok', handle: client.tiktok_handle });
    }
    if (client.facebook_page) {
      platforms.push({ platform: 'facebook', handle: client.facebook_page });
    }

    if (platforms.length === 0) {
      console.log('No social handles found for client');
      return;
    }

    for (const { platform, handle } of platforms) {
      try {
        let socialData = null;
        
        // Try RapidAPI first for Instagram, TikTok, and YouTube (more accurate data)
        if ((platform === 'instagram' || platform === 'tiktok' || platform === 'youtube') && rapidApiKey) {
          try {
            console.log(`Trying RapidAPI for ${platform} handle: ${handle}`);
            if (platform === 'instagram') {
              socialData = await fetchInstagramRapidAPI(handle, rapidApiKey, client.name);
            } else if (platform === 'tiktok') {
              socialData = await fetchTikTokRapidAPI(handle, rapidApiKey, client.name);
            } else if (platform === 'youtube') {
              socialData = await fetchYouTubeRapidAPI(handle, rapidApiKey, client.name);
            }
            console.log(`Successfully collected ${platform} data via RapidAPI for: ${handle}`);
          } catch (rapidError) {
            console.log(`RapidAPI failed for ${handle}, falling back to Social Blade:`, rapidError);
            // Fall back to Social Blade
            if (socialBladeApiKey) {
              socialData = await fetchRealSocialData(platform, handle, socialBladeApiKey, client.name);
            }
          }
        } else {
          // Use Social Blade for other platforms or if RapidAPI is not available
          if (socialBladeApiKey) {
            socialData = await fetchRealSocialData(platform, handle, socialBladeApiKey, client.name);
          } else {
            console.warn('No API keys available for social data collection');
            result.errors.push('No social media API keys configured');
            continue;
          }
        }
        
        if (socialData) {
          result.collected_data.social_metrics.push(socialData);
          console.log(`Successfully collected ${platform} data for: ${handle}`);
        } else {
          console.warn(`No data found for ${platform}: ${handle}`);
        }
        
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

    const searchTerms = [
      `${client.name} influencer`,
      `${client.name} ${client.category} collaboration`
    ];

    for (const term of searchTerms.slice(0, 1)) { // Limit to 1 term for speed
      try {
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleSearchApiKey}&cx=${googleSearchEngineId}&q=${encodeURIComponent(term)}&num=2`;
        
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) continue;
        
        const searchData = await searchResponse.json();
        
        if (searchData.items) {
          for (const item of searchData.items) {
            try {
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

async function collectMissingSocialProfiles(client: any, result: DataCollectionResult) {
  console.log('Searching for missing social profiles for:', client.name);
  
  try {
    const missingPlatforms = [];
    
    if (!client.facebook_page) missingPlatforms.push('facebook');
    if (!client.instagram_handle) missingPlatforms.push('instagram');
    if (!client.tiktok_handle) missingPlatforms.push('tiktok');
    if (!client.youtube_handle) missingPlatforms.push('youtube');
    
    
    if (missingPlatforms.length === 0) {
      console.log('All social platforms already configured');
      return;
    }
    
    console.log('Missing platforms:', missingPlatforms);

    for (const platform of missingPlatforms) {
      try {
        const foundProfile = await searchForSocialProfile(client.name, platform);
        if (foundProfile) {
          console.log(`Found missing ${platform} profile:`, foundProfile);
          result.collected_data.social_metrics.push({
            id: `discovered-${platform}-${Date.now()}`,
            data_type: 'discovered_profile',
            platform: platform,
            source: 'auto_discovery',
            data: foundProfile,
            created_at: new Date().toISOString(),
            notes: `Automatically discovered ${platform} profile for ${client.name}`,
            verification_needed: true,
            suggested_update: {
              field: `${platform}_${platform === 'facebook' ? 'page' : 'handle'}`,
              value: foundProfile.handle || foundProfile.url
            }
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`Error searching for ${platform} profile:`, error);
        result.errors.push(`Profile discovery error for ${platform}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('Error in missing profiles collection:', error);
    result.errors.push(`Profile discovery error: ${error.message}`);
  }
}

// Business Intelligence & Sentiment Analysis Collection
async function collectSentimentAnalysis(client: any, result: DataCollectionResult) {
  console.log('Collecting sentiment analysis and business intelligence for:', client.name);
  
  try {
    // Kontrollera AI-tillgänglighet
    const availability = await aiService.checkAvailability();
    if (!availability.openai && !availability.gemini) {
      console.log('Inga AI-tjänster tillgängliga, hoppar över sentimentanalys');
      result.errors.push('Inga AI-tjänster tillgängliga - sentimentanalys hoppades över');
      return;
    }

    if (!googleSearchApiKey || !googleSearchEngineId) {
      console.log('Google Search API credentials missing, skipping sentiment analysis');
      result.errors.push('Google Search API credentials missing - sentiment analysis skipped');
      return;
    }

    // 1. Collect data from various sources for sentiment analysis
    console.log('Collecting sentiment data...');
    const sentimentData = await collectSentimentData(client.name);
    console.log(`Found ${sentimentData.length} sentiment data items`);
    
    // 2. Twitter API removed due to authentication issues
    // const twitterData = await collectTwitterData(client.name);
    
    // 3. Use only sentiment data sources (Twitter removed)
    const combinedData = [...sentimentData];
    
    if (combinedData.length === 0) {
      console.log('No data found for sentiment analysis');
      result.errors.push('No data found for sentiment analysis');
      return;
    }
    
    console.log(`Analyzing ${combinedData.length} data items with OpenAI...`);
    
    // 4. Analyze with AI (fallback system)
    const analysis = await analyzeSentimentWithAI(client.name, combinedData);
    
    // 5. Store the results
    if (analysis) {
      console.log('Sentiment analysis result:', analysis);
      result.collected_data.social_metrics.push({
        id: `sentiment-${Date.now()}`,
        data_type: 'sentiment_analysis',
        platform: 'business_intelligence',
        source: 'openai_analysis',
        data: analysis,
        created_at: new Date().toISOString(),
        metadata: {
          data_sources_count: combinedData.length,
          twitter_mentions: 0, // Twitter API removed
          sentiment_sources: sentimentData.length
        }
      });
      
      console.log('Sentiment analysis completed successfully');
    } else {
      console.log('No analysis result from OpenAI');
      result.errors.push('Failed to generate sentiment analysis from OpenAI');
    }

  } catch (error) {
    console.error('Error collecting sentiment analysis:', error);
    result.errors.push(`Sentiment analysis error: ${error.message}`);
  }
}

async function collectSentimentData(clientName: string) {
  const searchQueries = [
    // Sentiment analysis sources
    `"${clientName}" site:flashback.org`,
    `"${clientName}" site:reddit.com`,
    `"${clientName}" kritik OR problem OR skandal`,
    `"${clientName}" positiv OR bra OR excellent`,
    
    // Industry trends
    `"${clientName}" branschtrend OR influencer trend 2024 2025`,
    `svenska influencers trends 2024 2025`,
    
    // Competitors
    `svenska influencers liknande "${clientName}"`,
    `konkurrenter till "${clientName}" influencer`,
    
    // Collaboration opportunities
    `"${clientName}" samarbete OR collaboration OR partnerskap`,
    `märkessamarbeten influencers Sverige 2024`,
  ];

  const allData = [];
  
  for (const query of searchQueries.slice(0, 3)) { // Reduce from 6 to 3 for speed
    try {
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleSearchApiKey}&cx=${googleSearchEngineId}&q=${encodeURIComponent(query)}&num=3`;
      
      const response = await fetch(searchUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.items) {
          for (const item of data.items) {
            allData.push({
              title: item.title,
              snippet: item.snippet,
              url: item.link,
              source: item.displayLink,
              query: query,
              date: item.pagemap?.newsarticle?.[0]?.datepublished || 
                    item.pagemap?.article?.[0]?.datepublished ||
                    new Date().toISOString()
            });
          }
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error('Error in sentiment data query:', query, error);
    }
  }
  
  return allData;
}

async function analyzeSentimentWithAI(clientName: string, sentimentData: any[]) {
  try {
    const systemPrompt = 'Du är en expert på business intelligence och sentimentanalys för influencers och sociala medier i Sverige. Returnera alltid giltig JSON.';
    
    const userPrompt = `Analysera följande data om "${clientName}" och skapa en komplett business intelligence rapport. 

Insamlad data:
${JSON.stringify(sentimentData.slice(0, 10), null, 2)}

Vänligen returnera en JSON-struktur med:
{
  "sentiment_score": [numeriskt värde -1 till 1],
  "sentiment_summary": "kort sammanfattning av sentiment",
  "key_themes": ["tema1", "tema2", "tema3"],
  "competitive_insights": "konkurrensinsikter",
  "collaboration_opportunities": "samarbetsmöjligheter",
  "brand_health": "varumärkeshälsa",
  "recommendations": "rekommendationer för framtiden",
  "data_quality": "kvalitet på insamlad data"
}`;

    const aiResponse = await aiService.generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      maxTokens: 1000,
      temperature: 0.3,
      model: 'gpt-4.1-2025-04-14'
    });

    if (!aiResponse.success) {
      throw new Error('AI-analys misslyckades: ' + aiResponse.error);
    }

    const analysisText = aiResponse.content;
    
    if (analysisText) {
      try {
        return JSON.parse(analysisText);
      } catch {
        return {
          sentiment_score: 0,
          sentiment_summary: analysisText.substring(0, 200),
          raw_analysis: analysisText,
          data_quality: "Analystext kunde inte parsas som JSON",
          ai_model_used: aiResponse.model
        };
      }
    }

    return null;

  } catch (error) {
    console.error('Error in AI sentiment analysis:', error);
    return null;
  }
}

// Twitter Data Collection Functions - DISABLED due to API authentication issues
// async function collectTwitterData(clientName: string) {
//   console.log('Twitter API disabled - authentication not working');
//   return [];
// }

// Twitter search function - DISABLED
// async function searchTwitter() {
//   console.log('Twitter API disabled');
//   return [];
// }

// Twitter OAuth functions - DISABLED
// async function generateTwitterOAuthHeader() {
//   console.log('Twitter OAuth disabled');
//   return '';
// }

// OAuth signature generation - DISABLED
// async function generateOAuthSignature() {
//   console.log('OAuth signature disabled');
//   return '';
// }

async function testTwitterAPI() {
  return { 
    success: false, 
    error: 'Twitter API funktionen har tagits bort på grund av autentiseringsproblem' 
  };
}

async function searchForSocialProfile(clientName: string, platform: string) {
  if (!googleSearchApiKey || !googleSearchEngineId) {
    console.log('Google Search API not available for profile discovery');
    return null;
  }

  try {
    const searchQueries = {
      'facebook': [
        `"${clientName}" site:facebook.com`,
        `"${clientName}" facebook profil`,
        `${clientName} facebook page`
      ],
      'instagram': [
        `"${clientName}" site:instagram.com`,
        `"${clientName}" instagram`,
        `@${clientName.replace(/\s+/g, '').toLowerCase()} instagram`
      ],
      'tiktok': [
        `"${clientName}" site:tiktok.com`,
        `"${clientName}" tiktok`,
        `@${clientName.replace(/\s+/g, '').toLowerCase()} tiktok`
      ],
      'youtube': [
        `"${clientName}" site:youtube.com`,
        `"${clientName}" youtube kanal`,
        `${clientName} youtube channel`
      ]
    };

    const queries = searchQueries[platform] || [];

    for (const query of queries) {
      try {
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleSearchApiKey}&cx=${googleSearchEngineId}&q=${encodeURIComponent(query)}&num=3`;
        
        const response = await fetch(searchUrl);
        if (!response.ok) continue;
        
        const data = await response.json();
        
        if (data.items) {
          for (const item of data.items) {
            const profile = extractSocialHandle(item.link, platform, item.title);
            if (profile) {
              return {
                platform: platform,
                url: item.link,
                title: item.title,
                snippet: item.snippet,
                handle: profile,
                confidence: 'medium',
                source_query: query
              };
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error('Search error for profile discovery:', query, error);
      }
    }

    return null;

  } catch (error) {
    console.error('Error in social profile search:', error);
    return null;
  }
}

function extractSocialHandle(url: string, platform: string, title: string) {
  try {
    const urlObj = new URL(url);
    
    switch (platform) {
      case 'facebook':
        if (urlObj.hostname.includes('facebook.com')) {
          const pathParts = urlObj.pathname.split('/').filter(Boolean);
          return pathParts[0] || null;
        }
        break;
        
      case 'instagram':
        if (urlObj.hostname.includes('instagram.com')) {
          const pathParts = urlObj.pathname.split('/').filter(Boolean);
          return pathParts[0] || null;
        }
        break;
        
      case 'tiktok':
        if (urlObj.hostname.includes('tiktok.com')) {
          const pathParts = urlObj.pathname.split('/').filter(Boolean);
          if (pathParts[0] === '@') {
            return pathParts[1] || null;
          }
          return pathParts[0]?.startsWith('@') ? pathParts[0].substring(1) : pathParts[0] || null;
        }
        break;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting social handle:', error);
    return null;
  }
}

// Fetch Instagram data using RapidAPI
async function fetchInstagramRapidAPI(handle: string, apiKey: string, clientName?: string) {
  try {
    const cleanHandle = handle.replace('@', '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', '');
    
    console.log(`Making RapidAPI request for Instagram handle: ${cleanHandle}`);
    
    const response = await fetch(`https://instagram-premium-api-2023.p.rapidapi.com/v1/user/followers?amount=100&username=${cleanHandle}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'instagram-premium-api-2023.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Instagram RapidAPI request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('RapidAPI Instagram response:', JSON.stringify(data, null, 2));
    
    // Transform the data to match our expected format
    const transformedData = {
      followers: data.followers_count || 0,
      following: data.following_count || 0,
      posts: data.media_count || 0,
      engagement_rate: data.engagement_rate || 0,
      verified: data.is_verified || false,
      bio: data.biography || '',
      external_url: data.external_url || '',
      profile_pic_url: data.profile_pic_url || '',
      full_name: data.full_name || '',
      username: cleanHandle,
      source: 'rapidapi_instagram_premium'
    };

    return {
      id: `rapidapi-instagram-${Date.now()}`,
      data_type: 'social_metrics',
      platform: 'instagram',
      source: 'rapidapi_instagram_premium',
      title: `Instagram profile for @${cleanHandle}`,
      url: `https://instagram.com/${cleanHandle}`,
      data: transformedData,
      metadata: {
        followers: transformedData.followers,
        following: transformedData.following,
        engagement_rate: transformedData.engagement_rate,
        verified: transformedData.verified
      },
      created_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching Instagram data from RapidAPI:', error);
    throw error;
  }
}

// Fetch TikTok data using RapidAPI
async function fetchTikTokRapidAPI(handle: string, apiKey: string, clientName?: string) {
  try {
    const cleanHandle = handle.replace('@', '').replace('https://tiktok.com/@', '').replace('https://www.tiktok.com/@', '');
    
    console.log(`Making RapidAPI request for TikTok handle: ${cleanHandle}`);
    
    const response = await fetch(`https://tiktok-api23.p.rapidapi.com/api/user/info?username=${cleanHandle}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`TikTok RapidAPI request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('RapidAPI TikTok response:', JSON.stringify(data, null, 2));
    
    // Transform the data to match our expected format
    const userInfo = data.data?.user_info || data.data || data;
    const stats = userInfo.stats || userInfo;
    
    const transformedData = {
      followers: stats.followers_count || stats.followerCount || 0,
      following: stats.following_count || stats.followingCount || 0,
      posts: stats.video_count || stats.videoCount || 0,
      likes: stats.heart_count || stats.heartCount || 0,
      verified: userInfo.verified || false,
      username: cleanHandle,
      nickname: userInfo.nickname || userInfo.display_name || '',
      bio: userInfo.signature || userInfo.bio || '',
      avatar_url: userInfo.avatar_url || userInfo.avatarLarger || '',
      source: 'rapidapi_tiktok'
    };

    return {
      id: `rapidapi-tiktok-${Date.now()}`,
      data_type: 'social_metrics',
      platform: 'tiktok',
      source: 'rapidapi_tiktok',
      title: `TikTok profile for @${cleanHandle}`,
      url: `https://tiktok.com/@${cleanHandle}`,
      data: transformedData,
      metadata: {
        followers: transformedData.followers,
        following: transformedData.following,
        likes: transformedData.likes,
        verified: transformedData.verified
      },
      created_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching TikTok data from RapidAPI:', error);
    throw error;
  }
}

// Fetch YouTube data using RapidAPI
async function fetchYouTubeRapidAPI(handle: string, apiKey: string, clientName?: string) {
  try {
    const cleanHandle = handle.replace('@', '').replace('https://youtube.com/@', '').replace('https://www.youtube.com/@', '');
    
    console.log(`Making RapidAPI request for YouTube handle: ${cleanHandle}`);
    
    // First, try to get channel info by handle
    const response = await fetch(`https://yt-api.p.rapidapi.com/channel/about?id=${cleanHandle}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'yt-api.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`YouTube RapidAPI request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('RapidAPI YouTube response:', JSON.stringify(data, null, 2));
    
    // Transform the data to match our expected format
    const channelInfo = data.data || data;
    const stats = channelInfo.stats || channelInfo.statistics || {};
    
    const transformedData = {
      subscribers: parseInt(stats.subscriberCount) || 0,
      videos: parseInt(stats.videoCount) || 0,
      views: parseInt(stats.viewCount) || 0,
      verified: channelInfo.badges?.includes('verified') || false,
      username: cleanHandle,
      title: channelInfo.title || channelInfo.name || '',
      description: channelInfo.description || '',
      avatar_url: channelInfo.avatar?.high?.url || channelInfo.thumbnails?.high?.url || '',
      country: channelInfo.country || '',
      created_date: channelInfo.joinedDate || channelInfo.publishedAt || '',
      source: 'rapidapi_youtube'
    };

    return {
      id: `rapidapi-youtube-${Date.now()}`,
      data_type: 'social_metrics',
      platform: 'youtube',
      source: 'rapidapi_youtube',
      title: `YouTube channel for @${cleanHandle}`,
      url: `https://youtube.com/@${cleanHandle}`,
      data: transformedData,
      metadata: {
        subscribers: transformedData.subscribers,
        videos: transformedData.videos,
        views: transformedData.views,
        verified: transformedData.verified
      },
      created_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching YouTube data from RapidAPI:', error);
    throw error;
  }
}

// Test API functions
async function testFirecrawlApi(apiKey: string | undefined) {
  if (!apiKey) {
    return { success: false, message: 'API key saknas' };
  }
  
  try {
    const testResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
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
    
    return { 
      success: testResponse.ok, 
      message: testResponse.ok ? 'API fungerar' : `Fel: ${testResponse.status}` 
    };
  } catch (error) {
    return { success: false, message: `Fel: ${error.message}` };
  }
}

async function testGoogleSearchApi(apiKey: string | undefined, engineId: string | undefined) {
  if (!apiKey || !engineId) {
    return { success: false, message: 'API key eller Engine ID saknas' };
  }
  
  try {
    const testUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=test&num=1`;
    const response = await fetch(testUrl);
    
    return { 
      success: response.ok, 
      message: response.ok ? 'API fungerar' : `Fel: ${response.status}` 
    };
  } catch (error) {
    return { success: false, message: `Fel: ${error.message}` };
  }
}

async function testSocialBladeApi(apiKey: string | undefined) {
  const socialBladeClientId = Deno.env.get('SOCIAL_BLADE_CLIENT_ID');
  
  if (!apiKey || !socialBladeClientId) {
    return { success: false, message: 'API key eller Client ID saknas' };
  }
  
  try {
    const testUrl = `https://matrix.sbapis.com/b/youtube/statistics?query=test&history=default&allow-stale=false`;
    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    return { 
      success: response.ok, 
      message: response.ok ? 'API fungerar' : `Fel: ${response.status}` 
    };
  } catch (error) {
    return { success: false, message: `Fel: ${error.message}` };
  }
}

async function testRapidApi() {
  const apiKey = Deno.env.get('RAPIDAPI_KEY');
  
  if (!apiKey) {
    return { success: false, message: 'RapidAPI key saknas' };
  }
  
  try {
    // Test with YouTube API 
    const response = await fetch('https://yt-api.p.rapidapi.com/video/info?id=arj7oStGLkU', {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'yt-api.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
      },
    });
    
    return { 
      success: response.ok, 
      message: response.ok ? 'RapidAPI (Instagram/TikTok/YouTube) fungerar' : `Fel: ${response.status}` 
    };
  } catch (error) {
    return { success: false, message: `Fel: ${error.message}` };
  }
}

async function fetchRealSocialData(platform: string, handle: string, apiKey: string, clientName?: string) {
  console.log(`Fetching real ${platform} data for handle: ${handle}`);
  
  try {
    return await fetchSocialBladeData(platform, handle, apiKey);
  } catch (error) {
    console.error(`Error fetching ${platform} data:`, error);
    return null;
  }
}




async function fetchSocialBladeData(platform: string, handle: string, apiKey: string) {
  const socialBladeClientId = Deno.env.get('SOCIAL_BLADE_CLIENT_ID');
  
  if (!socialBladeClientId) {
    console.error('Social Blade Client ID missing');
    return null;
  }

  try {
    let cleanHandle = handle;
    if (handle.includes('@')) {
      cleanHandle = handle.split('@')[1] || handle;
    }
    if (handle.includes('/')) {
      cleanHandle = handle.split('/').pop() || handle;
    }

    const url = `https://matrix.sbapis.com/b/${platform}/statistics?query=${encodeURIComponent(cleanHandle)}&history=default&allow-stale=false`;
    console.log('Making request to:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Social Blade API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    console.log(`Social Blade API response for ${platform}:`, JSON.stringify(data, null, 2));
    
    return {
      id: `socialblade-${platform}-${Date.now()}`,
      data_type: 'social_metrics',
      platform: platform,
      source: 'social_blade',
      title: data.data?.id?.display_name || `${platform} profile`,
      url: `https://${platform}.com/${cleanHandle}`,
      data: data,
      metadata: {
        followers: data.data?.statistics?.total?.followers || 0,
        following: data.data?.statistics?.total?.following || 0,
        engagement_rate: data.data?.statistics?.total?.engagement_rate || 0
      },
      created_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('Social Blade API error:', error);
    return null;
  }
}

async function storeDataInCache(clientId: string, result: DataCollectionResult) {
  console.log('Storing collected data in cache...');
  
  try {
    const allData = [];

    // Process news data
    result.collected_data.news.forEach(item => {
      allData.push({
        client_id: clientId,
        data_type: 'news',
        source: item.type || 'google_search',
        title: item.title,
        url: item.url,
        snippet: item.snippet,
        author: item.author,
        image: item.image,
        data: item,
        metadata: {
          query: item.query,
          news_source: item.newsSource || item.source
        },
        created_at: new Date().toISOString()
      });
    });

    // Process social metrics data
    result.collected_data.social_metrics.forEach(item => {
      // Map data_type to allowed values
      let mappedDataType = 'social_metrics'; // default
      if (item.data_type === 'sentiment_analysis') {
        mappedDataType = 'ai_analysis';
      } else if (item.data_type === 'discovered_profile') {
        mappedDataType = 'social_metrics';
      } else if (item.data_type === 'ai_analysis') {
        mappedDataType = 'ai_analysis';
      }
      
      allData.push({
        client_id: clientId,
        data_type: mappedDataType,
        source: item.source || 'unknown',
        platform: item.platform,
        title: item.title,
        url: item.url,
        data: item.data,
        metadata: {
          ...item.metadata || {},
          original_data_type: item.data_type // Store original type in metadata
        },
        created_at: item.created_at || new Date().toISOString()
      });
    });

    // Process web scraping data
    result.collected_data.web_scraping.forEach(item => {
      allData.push({
        client_id: clientId,
        data_type: 'web_scraping',
        source: 'firecrawl',
        title: item.title,
        url: item.url,
        snippet: item.content?.substring(0, 500),
        data: item,
        metadata: {
          search_term: item.search_term
        },
        created_at: new Date().toISOString()
      });
    });

    if (allData.length > 0) {
      const { error } = await supabase
        .from('client_data_cache')
        .insert(allData);

      if (error) {
        console.error('Error storing data in cache:', error);
        result.errors.push(`Cache storage error: ${error.message}`);
      } else {
        console.log(`Successfully stored ${allData.length} items in cache`);
      }
    }

  } catch (error) {
    console.error('Error in cache storage:', error);
    result.errors.push(`Cache storage error: ${error.message}`);
  }
}
