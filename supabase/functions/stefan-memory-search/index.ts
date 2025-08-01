import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Helper function to calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { query, maxResults = 3, maxTokens = 1500 } = await req.json();

    if (!query) {
      throw new Error('Query is required');
    }

    console.log('Searching Stefan memory for:', query.substring(0, 100) + '...');

    // Generate embedding for the user query
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
        encoding_format: 'float',
      }),
    });

    if (!embeddingResponse.ok) {
      const errorData = await embeddingResponse.text();
      console.error('OpenAI embedding error:', errorData);
      throw new Error(`OpenAI embedding error: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    console.log('Generated query embedding with dimensions:', queryEmbedding.length);

    // Perform similarity search using pgvector cosine similarity
    // First try to get all memories and compute similarity in application
    const { data: allMemories, error: fetchError } = await supabase
      .from('stefan_memory')
      .select('id, content, tags, category, source, version, created_at, embedding');

    if (fetchError) {
      console.error('Error fetching memories:', fetchError);
      throw new Error(`Database fetch error: ${fetchError.message}`);
    }

    let memories = [];
    
    if (allMemories && allMemories.length > 0) {
      // Calculate cosine similarity in memory for now
      memories = allMemories
        .filter(memory => memory.embedding) // Only memories with embeddings
        .map(memory => {
          // Parse the embedding vector from PostgreSQL format
          let embedding;
          try {
            if (typeof memory.embedding === 'string') {
              // Remove brackets and split
              embedding = memory.embedding.replace(/[\[\]]/g, '').split(',').map(Number);
            } else {
              embedding = memory.embedding;
            }
          } catch (e) {
            console.error('Failed to parse embedding for memory:', memory.id);
            return null;
          }

          // Calculate cosine similarity
          const similarity = cosineSimilarity(queryEmbedding, embedding);
          
          return {
            ...memory,
            similarity,
            embedding: undefined // Remove embedding from response for efficiency
          };
        })
        .filter(memory => memory !== null)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxResults);
    }

    console.log('Found memories:', memories?.length || 0);

    // Filter and limit by token count (approximate)
    let filteredMemories = [];
    let totalTokens = 0;
    const avgTokensPerChar = 0.25; // Rough approximation

    if (memories && Array.isArray(memories)) {
      for (const memory of memories) {
        if (!memory || !memory.content) continue;
        
        const estimatedTokens = memory.content.length * avgTokensPerChar;
        if (totalTokens + estimatedTokens <= maxTokens) {
          filteredMemories.push(memory);
          totalTokens += estimatedTokens;
        } else {
          break;
        }
      }
    }

    console.log('Filtered memories:', filteredMemories.length, 'Total estimated tokens:', totalTokens);

    return new Response(JSON.stringify({
      success: true,
      memories: filteredMemories,
      totalEstimatedTokens: totalTokens,
      method: 'similarity_search',
      query
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in stefan-memory-search function:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});