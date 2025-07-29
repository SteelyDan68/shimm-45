// Mock data generator for testing dashboard
import { supabase } from '@/integrations/supabase/client';

export const generateMockData = async (clientId: string) => {
  const mockData = [
    // Mock news data
    {
      client_id: clientId,
      data_type: 'news',
      source: 'google_search',
      data: {
        title: 'Influencer spotlights växande trend inom hållbarhet',
        url: 'https://example.com/news1',
        date: new Date().toISOString(),
        source: 'Dagens Media',
        description: 'En djupgående artikel om hur influencers driver hållbarhetstrenden framåt genom autentiska samarbeten och genomtänkta partnerships.'
      }
    },
    {
      client_id: clientId,
      data_type: 'news',
      source: 'google_search',
      data: {
        title: 'Ny kampanj når rekordmånga unga konsumenter',
        url: 'https://example.com/news2',
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        source: 'Resumé',
        description: 'Kampanjen som kombinerar kreativitet med datadriven strategi visar imponerande resultat i målgruppen 18-34 år.'
      }
    },
    // Mock social metrics
    {
      client_id: clientId,
      data_type: 'social_metrics',
      source: 'social_blade',
      data: {
        platform: 'Instagram',
        followers: 125340,
        following: 890,
        posts: 1247,
        engagement_rate: 4.8,
        likes: 8420,
        comments: 342,
        shares: 156,
        growth_rate: 12.5,
        posts_per_week: 5
      }
    },
    // Mock AI analysis
    {
      client_id: clientId,
      data_type: 'ai_analysis',
      source: 'openai',
      data: {
        sentiment: 'positive',
        summary: 'Stark positiv trend i engagemang med fokus på autentiskt innehåll',
        topics: ['hållbarhet', 'lifestyle', 'mode'],
        confidence: 0.87
      }
    },
    // Mock Gemini web research
    {
      client_id: clientId,
      data_type: 'web_research',
      source: 'gemini',
      data: {
        query_type: 'comprehensive',
        research_results: [
          {
            category: 'news_mentions',
            title: 'Senaste nyhetsomnämnanden',
            query: 'Sök efter senaste nyhetsomnämnanden',
            result: 'Hittade 3 relevanta omnämnanden från senaste veckan:\n\n1. Dagens Media: "Influencer marketing når nya höjder"\n2. Resumé: "Authenticity wins in 2024 campaigns"\n3. Marketing Week: "Rising stars in sustainability content"',
            timestamp: new Date().toISOString()
          },
          {
            category: 'industry_trends',
            title: 'Branschtrends och konkurrenter',
            query: 'Analysera aktuella trender inom branchen',
            result: 'Stora trender 2024:\n• Micro-influencers får större fokus\n• Hållbarhetsbudskap allt viktigare\n• Video-first content dominerar\n• Autenticitet värdesätts högre än reach',
            timestamp: new Date().toISOString()
          }
        ],
        timestamp: new Date().toISOString()
      }
    }
  ];

  for (const item of mockData) {
    try {
      const { error } = await supabase
        .from('client_data_cache')
        .insert([item]);
      
      if (error) {
        console.error('Error inserting mock data:', error);
      }
    } catch (error) {
      console.error('Error in generateMockData:', error);
    }
  }
};