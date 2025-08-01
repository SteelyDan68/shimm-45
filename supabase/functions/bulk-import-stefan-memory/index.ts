import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MemoryFragment {
  content: string;
  tags?: string[];
  category: string;
  version?: string;
  source?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { jsonlContent } = await req.json();

    if (!jsonlContent || typeof jsonlContent !== 'string') {
      throw new Error('Missing or invalid JSONL content');
    }

    console.log('Starting bulk import process...');

    // Parse JSONL content
    const lines = jsonlContent.trim().split('\n').filter(line => line.trim());
    const fragments: MemoryFragment[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      try {
        const fragment = JSON.parse(lines[i]);
        if (!fragment.content || !fragment.category) {
          console.warn(`Skipping line ${i + 1}: Missing required fields`);
          continue;
        }
        fragments.push({
          content: fragment.content,
          tags: fragment.tags || [],
          category: fragment.category,
          version: fragment.version || '1.0',
          source: fragment.source || 'Bulk Import'
        });
      } catch (parseError) {
        console.warn(`Failed to parse line ${i + 1}:`, parseError);
      }
    }

    console.log(`Parsed ${fragments.length} valid fragments from ${lines.length} lines`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process fragments in batches of 5 to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < fragments.length; i += batchSize) {
      const batch = fragments.slice(i, i + batchSize);
      
      for (const fragment of batch) {
        try {
          // Generate embedding for the content
          console.log(`Generating embedding for fragment: ${fragment.content.substring(0, 50)}...`);
          
          const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'text-embedding-3-small',
              input: fragment.content,
            }),
          });

          if (!embeddingResponse.ok) {
            const errorData = await embeddingResponse.text();
            throw new Error(`OpenAI API error: ${embeddingResponse.status} ${errorData}`);
          }

          const embeddingData = await embeddingResponse.json();
          const embedding = embeddingData.data[0].embedding;

          // Insert into database
          const { error: insertError } = await supabase
            .from('stefan_memory')
            .insert({
              content: fragment.content,
              tags: fragment.tags,
              category: fragment.category,
              version: fragment.version,
              source: fragment.source,
              embedding: embedding,
            });

          if (insertError) {
            throw insertError;
          }

          successCount++;
          console.log(`Successfully imported fragment ${successCount}`);

        } catch (error) {
          errorCount++;
          const errorMsg = `Fragment ${i + errorCount}: ${error.message}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      // Add delay between batches to respect rate limits
      if (i + batchSize < fragments.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const result = {
      success: true,
      totalProcessed: fragments.length,
      successCount,
      errorCount,
      errors: errors.slice(0, 10), // Limit to first 10 errors
      message: `Bulk import completed: ${successCount} successful, ${errorCount} failed`
    };

    console.log('Bulk import result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in bulk-import-stefan-memory function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        totalProcessed: 0,
        successCount: 0,
        errorCount: 0
      }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});