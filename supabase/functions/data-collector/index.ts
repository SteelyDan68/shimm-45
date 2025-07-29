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
    const { client_id, test_mode, platform, url } = await req.json();

    // Test mode - check API connectivity or specific platform test
    if (test_mode) {
      console.log('Running API tests...');
      
      // YouTube API specific test
      if (platform === 'youtube' && url) {
        console.log('YouTube API test mode for URL:', url);
        
        let handle = url;
        if (url.includes('youtube.com/@')) {
          handle = url.split('@')[1];
        } else if (url.includes('youtube.com/channel/')) {
          handle = url.split('/channel/')[1];
        } else if (url.includes('youtube.com/c/')) {
          handle = url.split('/c/')[1];
        }
        
        const youtubeData = await fetchYouTubeData(handle);
        
        return new Response(JSON.stringify({
          success: !!youtubeData,
          data: youtubeData,
          error: youtubeData ? null : 'Failed to fetch YouTube data'
        }), {
          status: youtubeData ? 200 : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // General API connectivity tests
      const testResults = {
        firecrawl: await testFirecrawlApi(firecrawlApiKey),
        google_search: await testGoogleSearchApi(googleSearchApiKey, googleSearchEngineId),
        social_blade: await testSocialBladeApi(socialBladeApiKey),
        youtube_api: await testYouTubeDataApi()
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
      collectWebScrapingData(client, result),
      collectMissingSocialProfiles(client, result)
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

    // First collect Swedish news specifically
    await collectSwedishNews(client, result);

    // Then collect general news for backwards compatibility
    const searchQueries = [
      `"${client.name}" influencer`,
      `"${client.name}" ${client.category}`,
      `${client.name} campaign`
    ];

    for (const query of searchQueries.slice(0, 2)) {
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
    
    if (!socialBladeApiKey) {
      console.warn('Social Blade API key missing, skipping social data collection');
      result.errors.push('Social Blade API key not configured');
      return;
    }

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
    if (client.facebook_page) {
      platforms.push({ platform: 'facebook', handle: client.facebook_page });
    }

    if (platforms.length === 0) {
      console.warn('No social handles found for client, skipping social data collection');
      return;
    }

    for (const { platform, handle } of platforms) {
      try {
        const socialData = await fetchRealSocialData(platform, handle, socialBladeApiKey, client.name);
        if (socialData) {
          result.collected_data.social_metrics.push(socialData);
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

    for (const term of searchTerms) {
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
    if (!client.youtube_channel) missingPlatforms.push('youtube');
    
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
              field: `${platform}_${platform === 'youtube' ? 'channel' : platform === 'facebook' ? 'page' : 'handle'}`,
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
        
      case 'youtube':
        if (urlObj.hostname.includes('youtube.com')) {
          const pathParts = urlObj.pathname.split('/').filter(Boolean);
          if (pathParts[0] === 'channel' || pathParts[0] === 'c' || pathParts[0] === 'user') {
            return pathParts[1] || null;
          }
          if (pathParts[0]?.startsWith('@')) {
            return pathParts[0].substring(1) || null;
          }
          return pathParts[0] || null;
        }
        break;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting social handle:', error);
    return null;
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

async function fetchRealSocialData(platform: string, handle: string, apiKey: string, clientName?: string) {
  console.log(`Fetching real ${platform} data for handle: ${handle}`);
  
  try {
    if (platform === 'youtube') {
      return await fetchYouTubeData(handle, clientName);
    } else {
      return await fetchSocialBladeData(platform, handle, apiKey);
    }
  } catch (error) {
    console.error(`Error fetching ${platform} data:`, error);
    return null;
  }
}

async function fetchYouTubeData(handle: string, clientName?: string) {
  const youtubeApiKey = Deno.env.get('YOUTUBE_DATA_API_KEY');
  
  if (!youtubeApiKey) {
    console.log('YouTube Data API key missing, falling back to Social Blade');
    const socialBladeApiKey = Deno.env.get('SOCIAL_BLADE_API_KEY');
    if (socialBladeApiKey) {
      return await fetchSocialBladeData('youtube', handle, socialBladeApiKey);
    }
    return null;
  }

  try {
    let channelId = null;
    
    if (handle.startsWith('UC') && handle.length === 24) {
      channelId = handle;
    } else if (handle.includes('youtube.com')) {
      if (clientName) {
        const intelligentResult = await findYouTubeChannelWithIntelligentSearch(handle, clientName, youtubeApiKey);
        if (intelligentResult) {
          channelId = intelligentResult.id;
        }
      }
    } else {
      try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&key=${youtubeApiKey}&maxResults=1`;
        const searchResponse = await fetch(searchUrl);
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.items && searchData.items.length > 0) {
            channelId = searchData.items[0].snippet.channelId;
          }
        }
      } catch (searchError) {
        console.error('YouTube search error:', searchError);
      }
    }

    if (!channelId) {
      console.log('YouTube channel not found, falling back to Social Blade');
      const socialBladeApiKey = Deno.env.get('SOCIAL_BLADE_API_KEY');
      if (socialBladeApiKey) {
        return await fetchSocialBladeData('youtube', handle, socialBladeApiKey);
      }
      return null;
    }

    const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${youtubeApiKey}`;
    const response = await fetch(channelsUrl);
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      return {
        id: `youtube-${Date.now()}`,
        data_type: 'youtube_stats',
        platform: 'youtube',
        source: 'youtube_data_api',
        data: {
          channel_id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          subscriber_count: parseInt(channel.statistics.subscriberCount || '0'),
          video_count: parseInt(channel.statistics.videoCount || '0'),
          view_count: parseInt(channel.statistics.viewCount || '0'),
          published_at: channel.snippet.publishedAt,
          thumbnails: channel.snippet.thumbnails,
          handle: handle
        },
        created_at: new Date().toISOString()
      };
    }

    return null;

  } catch (error) {
    console.error('YouTube Data API error:', error);
    
    const socialBladeApiKey = Deno.env.get('SOCIAL_BLADE_API_KEY');
    if (socialBladeApiKey) {
      console.log('Falling back to Social Blade for YouTube data');
      return await fetchSocialBladeData('youtube', handle, socialBladeApiKey);
    }
    
    return null;
  }
}

async function findYouTubeChannelWithIntelligentSearch(handle: string, clientName: string, apiKey: string) {
  console.log(`Intelligent YouTube search for handle: "${handle}", client: "${clientName}"`);
  
  const searchStrategies = [
    {
      name: 'Direct handle search',
      queries: [
        `"@${handle.replace('@', '')}"`,
        `"${handle.replace('@', '')}"`,
        handle.replace('@', ''),
        `@${handle.replace('@', '')}`
      ]
    },
    {
      name: 'Client name search', 
      queries: Array.from(new Set([
        `"${clientName}"`,
        `"${clientName} Family"`,
        `"Family ${clientName}"`,
        `"${clientName} Family"`,
        `"${clientName} Family"`,
        `"Family ${clientName}"`
      ]))
    },
    {
      name: 'Fuzzy search',
      queries: [
        clientName.split(' ')[0],
        `${clientName.split(' ')[0]} vlogs`,
        `${clientName.split(' ')[0]} gaming`,
        `${clientName.split(' ')[0]} lifestyle`
      ]
    }
  ];

  for (const strategy of searchStrategies) {
    try {
      const results = await searchYouTubeChannels(strategy.queries, apiKey, strategy.name);
      
      if (results.length > 0) {
        const bestMatch = results[0];
        console.log(`Found YouTube channel via ${strategy.name}:`, bestMatch.snippet.title);
        return bestMatch;
      }
      
    } catch (error) {
      console.error(`Error in strategy ${strategy.name}:`, error);
    }
  }

  console.log('No YouTube channel found after all search strategies');
  return null;
}

async function searchYouTubeChannels(queries: string[], apiKey: string, strategy: string) {
  const allResults = [];
  console.log(`${strategy}: Trying ${queries.length} search queries`);
  
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`  Query ${i + 1}: "${query}"`);
    
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&key=${apiKey}&maxResults=5`;
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        console.error(`Search error for "${query}": ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          if (!allResults.find(r => r.snippet.channelId === item.snippet.channelId)) {
            allResults.push(item);
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Search error for "${query}":`, error);
    }
  }
  
  console.log(`${strategy}: Found ${allResults.length} unique channels`);
  return allResults;
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
      data: data,
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
    const allData = [
      ...result.collected_data.news.map(item => ({
        ...item,
        client_id: clientId,
        data_type: 'news',
        source: item.type || 'google_search',
        created_at: new Date().toISOString()
      })),
      ...result.collected_data.social_metrics.map(item => ({
        ...item,
        client_id: clientId,
        created_at: item.created_at || new Date().toISOString()
      })),
      ...result.collected_data.web_scraping.map(item => ({
        ...item,
        client_id: clientId,
        data_type: 'web_scraping',
        source: 'firecrawl',
        created_at: new Date().toISOString()
      }))
    ];

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

async function testYouTubeDataApi() {
  const youtubeApiKey = Deno.env.get('YOUTUBE_DATA_API_KEY');
  
  if (!youtubeApiKey) {
    return { 
      success: false, 
      message: 'YouTube Data API key saknas' 
    };
  }
  
  try {
    const testUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=test&key=${youtubeApiKey}&maxResults=1`;
    const response = await fetch(testUrl);
    
    return { 
      success: response.ok, 
      message: response.ok ? 'API fungerar' : `Fel: ${response.status}` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `YouTube Data API fel: ${error.message}` 
    };
  }
}