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
      // New: Intelligent fallback data collection
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
      // Extract username from YouTube URL if it's a full URL
      let youtubeHandle = client.youtube_channel;
      if (youtubeHandle.includes('youtube.com/@')) {
        youtubeHandle = youtubeHandle.split('@')[1];
      } else if (youtubeHandle.includes('youtube.com/channel/')) {
        youtubeHandle = youtubeHandle.split('/channel/')[1];
      } else if (youtubeHandle.includes('youtube.com/c/')) {
        youtubeHandle = youtubeHandle.split('/c/')[1];
      }
      platforms.push({ platform: 'youtube', handle: youtubeHandle });
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

// New intelligent fallback function to find missing social profiles
async function collectMissingSocialProfiles(client: any, result: DataCollectionResult) {
  console.log('Searching for missing social profiles for:', client.name);
  
  try {
    const missingPlatforms = [];
    
    // Check what social platforms are missing
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
          // Store the found profile information
          result.collected_data.social_metrics.push({
            platform,
            handle: foundProfile.handle,
            url: foundProfile.url,
            source: 'auto_discovery',
            discovery_method: foundProfile.method,
            confidence_score: foundProfile.confidence,
            raw_data: foundProfile,
            last_updated: new Date().toISOString()
          });
          
          console.log(`Found ${platform} profile:`, foundProfile.handle);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error searching for ${platform} profile:`, error);
        result.errors.push(`Auto-discovery error for ${platform}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error in collectMissingSocialProfiles:', error);
    result.errors.push(`Missing profile search error: ${error.message}`);
  }
}

async function searchForSocialProfile(clientName: string, platform: string) {
  if (!googleSearchApiKey || !googleSearchEngineId) {
    console.log('Google Search API not available for profile discovery');
    return null;
  }
  
  try {
    // Construct smart search queries for each platform
    const searchQueries = {
      facebook: [
        `"${clientName}" site:facebook.com`,
        `"${clientName}" facebook profile`,
        `${clientName} influencer facebook`
      ],
      instagram: [
        `"${clientName}" site:instagram.com`,
        `"${clientName}" instagram profile`,
        `${clientName} influencer instagram`
      ],
      tiktok: [
        `"${clientName}" site:tiktok.com`,
        `"${clientName}" tiktok profile`,
        `${clientName} influencer tiktok`
      ],
      youtube: [
        `"${clientName}" site:youtube.com`,
        `"${clientName}" youtube channel`,
        `${clientName} influencer youtube`
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
                handle: profile.handle,
                url: item.link,
                title: item.title,
                method: 'google_search',
                confidence: calculateConfidence(item.title, clientName, platform),
                query_used: query
              };
            }
          }
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error('Error in search query:', query, error);
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('Error searching for social profile:', error);
    return null;
  }
}

function extractSocialHandle(url: string, platform: string, title: string) {
  try {
    const urlObj = new URL(url);
    
    switch (platform) {
      case 'facebook':
        if (urlObj.hostname.includes('facebook.com')) {
          const path = urlObj.pathname;
          const handle = path.split('/').filter(p => p && p !== 'profile.php')[0];
          return handle ? { handle, platform: 'facebook' } : null;
        }
        break;
        
      case 'instagram':
        if (urlObj.hostname.includes('instagram.com')) {
          const path = urlObj.pathname;
          const handle = path.split('/').filter(p => p && p !== 'p')[0];
          return handle ? { handle, platform: 'instagram' } : null;
        }
        break;
        
      case 'tiktok':
        if (urlObj.hostname.includes('tiktok.com')) {
          const path = urlObj.pathname;
          const handle = path.split('/').filter(p => p && !p.startsWith('video'))[0];
          if (handle && handle.startsWith('@')) {
            return { handle: handle.substring(1), platform: 'tiktok' };
          }
        }
        break;
        
      case 'youtube':
        if (urlObj.hostname.includes('youtube.com')) {
          const path = urlObj.pathname;
          if (path.includes('/channel/') || path.includes('/@') || path.includes('/c/')) {
            return { handle: url, platform: 'youtube' }; // Return full URL for YouTube
          }
        }
        break;
    }
    
    return null;
    
  } catch (error) {
    console.error('Error extracting handle from URL:', url, error);
    return null;
  }
}

function calculateConfidence(title: string, clientName: string, platform: string): number {
  let confidence = 0;
  
  // Check if client name appears in title
  if (title.toLowerCase().includes(clientName.toLowerCase())) {
    confidence += 40;
  }
  
  // Check for platform-specific keywords
  const platformKeywords = {
    facebook: ['facebook', 'fb'],
    instagram: ['instagram', 'ig'],
    tiktok: ['tiktok', 'tt'],
    youtube: ['youtube', 'yt', 'channel']
  };
  
  const keywords = platformKeywords[platform] || [];
  for (const keyword of keywords) {
    if (title.toLowerCase().includes(keyword)) {
      confidence += 15;
      break;
    }
  }
  
  // Check for influencer/profile keywords
  const profileKeywords = ['influencer', 'profile', 'official', 'verified'];
  for (const keyword of profileKeywords) {
    if (title.toLowerCase().includes(keyword)) {
      confidence += 10;
    }
  }
  
  return Math.min(confidence, 100);
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
  const socialBladeClientId = Deno.env.get('SOCIAL_BLADE_CLIENT_ID');
  
  if (!apiKey) {
    return { success: false, message: 'API key (token) saknas' };
  }

  if (!socialBladeClientId) {
    return { success: false, message: 'Client ID saknas' };
  }

  try {
    // Test with a known handle to verify API connectivity
    const testEndpoint = `https://matrix.sbapis.com/b/instagram/statistics?query=instagram&history=default&allow-stale=false`;
    
    const response = await fetch(testEndpoint, {
      method: 'GET',
      headers: {
        'clientid': socialBladeClientId,
        'token': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return { success: true, message: 'Social Blade API fungerar korrekt' };
    } else {
      const errorText = await response.text();
      return { success: false, message: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    return { success: false, message: `Nätverksfel: ${error.message}` };
  }
}

async function fetchRealSocialData(platform: string, handle: string, apiKey: string) {
  console.log(`Fetching real ${platform} data for handle: ${handle}`);
  
  // For YouTube, try YouTube Data API first, then fallback to Social Blade
  if (platform.toLowerCase() === 'youtube') {
    const youtubeData = await fetchYouTubeData(handle);
    if (youtubeData) {
      return youtubeData;
    }
    console.log('YouTube API failed, falling back to Social Blade');
  }
  
  // Use Social Blade for other platforms or as YouTube fallback
  return await fetchSocialBladeData(platform, handle, apiKey);
}

async function fetchYouTubeData(handle: string) {
  const youtubeApiKey = Deno.env.get('YOUTUBE_DATA_API_KEY');
  
  if (!youtubeApiKey) {
    console.log('YouTube Data API key not found, using Social Blade fallback');
    return null;
  }

  try {
    // Extract channel ID or username from various YouTube URL formats
    let channelIdentifier = handle;
    let searchType = 'forUsername'; // Default search type
    
    if (handle.includes('youtube.com/@')) {
      channelIdentifier = handle.split('@')[1];
      searchType = 'forHandle';
    } else if (handle.includes('youtube.com/channel/')) {
      channelIdentifier = handle.split('/channel/')[1];
      searchType = 'id';
    } else if (handle.includes('youtube.com/c/')) {
      channelIdentifier = handle.split('/c/')[1];
      searchType = 'forUsername';
    } else if (handle.includes('youtube.com/user/')) {
      channelIdentifier = handle.split('/user/')[1];
      searchType = 'forUsername';
    }

    console.log(`YouTube API: Searching for channel with ${searchType}: ${channelIdentifier}`);

    let channelId = '';
    
    // If we don't have a direct channel ID, search for it
    if (searchType !== 'id') {
      let searchUrl = '';
      
      if (searchType === 'forHandle') {
        searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&type=channel&q=@${channelIdentifier}&key=${youtubeApiKey}&maxResults=1`;
      } else {
        searchUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&${searchType}=${channelIdentifier}&key=${youtubeApiKey}`;
      }
      
      console.log(`YouTube API: Making search request to find channel ID`);
      const searchResponse = await fetch(searchUrl);
      
      if (!searchResponse.ok) {
        console.error(`YouTube API search error: ${searchResponse.status}`);
        return null;
      }
      
      const searchData = await searchResponse.json();
      
      if (searchData.items && searchData.items.length > 0) {
        channelId = searchData.items[0].id.channelId || searchData.items[0].id;
      } else {
        console.log('No YouTube channel found for identifier:', channelIdentifier);
        return null;
      }
    } else {
      channelId = channelIdentifier;
    }

    console.log(`YouTube API: Found channel ID: ${channelId}`);

    // Get channel statistics
    const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,brandingSettings&id=${channelId}&key=${youtubeApiKey}`;
    
    console.log(`YouTube API: Getting channel statistics`);
    const statsResponse = await fetch(statsUrl);
    
    if (!statsResponse.ok) {
      console.error(`YouTube API stats error: ${statsResponse.status}`);
      return null;
    }
    
    const statsData = await statsResponse.json();
    
    if (!statsData.items || statsData.items.length === 0) {
      console.log('No channel data found for ID:', channelId);
      return null;
    }
    
    const channel = statsData.items[0];
    const stats = channel.statistics;
    const snippet = channel.snippet;
    
    console.log(`YouTube API: Successfully retrieved data for channel: ${snippet.title}`);
    
    return {
      platform: 'youtube',
      handle: handle,
      subscribers: parseInt(stats.subscriberCount) || 0,
      videos: parseInt(stats.videoCount) || 0,
      views: parseInt(stats.viewCount) || 0,
      channel_id: channelId,
      channel_title: snippet.title,
      channel_description: snippet.description,
      channel_created: snippet.publishedAt,
      thumbnail_url: snippet.thumbnails?.high?.url,
      raw_data: {
        source: 'youtube_api',
        statistics: stats,
        snippet: snippet,
        branding: channel.brandingSettings
      },
      last_updated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error fetching YouTube data:', error);
    return null;
  }
}

async function fetchSocialBladeData(platform: string, handle: string, apiKey: string) {
  const socialBladeClientId = Deno.env.get('SOCIAL_BLADE_CLIENT_ID');
  
  if (!socialBladeClientId) {
    console.log('Social Blade Client ID not found');
    return null;
  }
  
  try {
    let apiEndpoint = '';
    
    // Set correct endpoint based on platform using Social Blade Matrix API
    switch (platform.toLowerCase()) {
      case 'instagram':
        apiEndpoint = `https://matrix.sbapis.com/b/instagram/statistics?query=${encodeURIComponent(handle)}&history=default&allow-stale=false`;
        break;
      case 'youtube':
        apiEndpoint = `https://matrix.sbapis.com/b/youtube/statistics?query=${encodeURIComponent(handle)}&history=default&allow-stale=false`;
        break;
      case 'tiktok':
        apiEndpoint = `https://matrix.sbapis.com/b/tiktok/statistics?query=${encodeURIComponent(handle)}&history=default&allow-stale=false`;
        break;
      case 'facebook':
        apiEndpoint = `https://matrix.sbapis.com/b/facebook/statistics?query=${encodeURIComponent(handle)}&history=default&allow-stale=false`;
        break;
      default:
        console.log(`Platform ${platform} not supported yet`);
        return null;
    }

    console.log(`Making request to: ${apiEndpoint}`);
    
    const response = await fetch(apiEndpoint, {
      method: 'GET',
      headers: {
        'clientid': socialBladeClientId,
        'token': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Social Blade API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Response body:', errorText);
      return null;
    }

    const data = await response.json();
    console.log(`Social Blade API response for ${platform}:`, JSON.stringify(data, null, 2));
    
    // Parse the response based on platform
    let parsedData = {
      platform,
      handle,
      raw_data: data,
      last_updated: new Date().toISOString()
    };

    if (platform === 'instagram') {
      parsedData = {
        ...parsedData,
        followers: data.statistics?.followers || data.followers || 0,
        following: data.statistics?.following || data.following || 0,
        posts: data.statistics?.posts || data.posts || 0,
        engagement_rate: data.statistics?.engagement_rate || data.engagement_rate || 0,
        avg_likes: data.statistics?.avg_likes || data.avg_likes || 0,
        avg_comments: data.statistics?.avg_comments || data.avg_comments || 0
      };
    } else if (platform === 'youtube') {
      parsedData = {
        ...parsedData,
        subscribers: data.statistics?.subscribers || data.subscribers || 0,
        videos: data.statistics?.videos || data.videos || 0,
        views: data.statistics?.views || data.views || 0,
        avg_views: data.statistics?.avg_views || data.avg_views || 0
      };
    } else if (platform === 'tiktok') {
      parsedData = {
        ...parsedData,
        followers: data.statistics?.followers || data.followers || 0,
        likes: data.statistics?.likes || data.likes || 0,
        videos: data.statistics?.videos || data.videos || 0
      };
    } else if (platform === 'facebook') {
      parsedData = {
        ...parsedData,
        followers: data.statistics?.followers || data.followers || 0,
        likes: data.statistics?.likes || data.likes || 0,
        posts: data.statistics?.posts || data.posts || 0,
        page_views: data.statistics?.page_views || data.page_views || 0
      };
    }
    
    return parsedData;
    
  } catch (error) {
    console.error(`Error fetching ${platform} data:`, error);
    return null;
  }
}

async function storeDataInCache(clientId: string, result: DataCollectionResult) {
  console.log('Storing collected data in cache...');
  
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

  // Store social metrics - dynamically set source based on data source
  for (const socialItem of result.collected_data.social_metrics) {
    let source = 'social_blade'; // Default
    
    if (socialItem.source === 'auto_discovery') {
      source = 'auto_discovery';
    } else if (socialItem.raw_data?.source === 'youtube_api') {
      source = 'youtube_api';
    }
    
    cacheEntries.push({
      client_id: clientId,
      data_type: 'social_metrics',
      source: source,
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

async function testYouTubeDataApi() {
  const youtubeApiKey = Deno.env.get('YOUTUBE_DATA_API_KEY');
  
  if (!youtubeApiKey) {
    return { success: false, message: 'YouTube Data API key saknas' };
  }

  try {
    // Test with a known YouTube channel (@JockeJonna)
    const testData = await fetchYouTubeData('JockeJonna');
    
    if (testData && testData.channel_title) {
      return { 
        success: true, 
        message: `YouTube Data API fungerar korrekt (${testData.channel_title})` 
      };
    } else {
      return { 
        success: false, 
        message: 'YouTube Data API svarade men ingen kanal hittades' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: `YouTube Data API fel: ${error.message}` 
    };
  }
}