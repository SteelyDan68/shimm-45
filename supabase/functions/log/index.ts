/**
 * 📊 SERVER LOG COLLECTOR EDGE FUNCTION
 * 
 * Centraliserad mottagare för alla server-side loggar från produktionLogger.
 * Säkerställer strukturerad observability och felsökning.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { corsHeaders } from '../_shared/http-utils.ts';

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

interface BatchLogRequest {
  logs: LogEntry[];
  metadata?: {
    source?: string;
    environment?: string;
    version?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    let requestBody: BatchLogRequest | LogEntry;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // CRITICAL FIX: Clean IP address to prevent database errors
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     req.headers.get('cf-connecting-ip') || 
                     '127.0.0.1';
    
    // Extract only the first valid IP address from comma-separated list
    const cleanIP = clientIP.split(',')[0].trim();
    
    // Validate IP format before using
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    const validIP = ipRegex.test(cleanIP) ? cleanIP : '127.0.0.1';

    // Normalize to batch format
    let logs: LogEntry[];
    if ('logs' in requestBody) {
      logs = requestBody.logs;
    } else {
      logs = [requestBody];
    }

    // Validate and transform logs for database insert
    const dbLogs = logs.map(log => {
      // Validate required fields
      if (!log.level || !log.message) {
        throw new Error('Missing required fields: level and message');
      }

      // Validate log level
      if (!['debug', 'info', 'warn', 'error', 'fatal'].includes(log.level)) {
        throw new Error(`Invalid log level: ${log.level}`);
      }

      return {
        level: log.level,
        message: log.message,
        timestamp: log.timestamp || new Date().toISOString(),
        context: log.context || {},
        error_stack: log.error?.stack || null,
        user_id: log.userId || null,
        session_id: log.sessionId || null,
        url: log.url || null,
        user_agent: log.userAgent || req.headers.get('user-agent') || '',
        ip_address: validIP !== '127.0.0.1' ? validIP : null
      };
    });

    // Batch insert to database
    const { error: insertError } = await supabase
      .from('server_log_events')
      .insert(dbLogs);

    if (insertError) {
      console.error('Database insert error:', insertError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to store logs',
          details: insertError.message 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Log the successful storage for internal debugging
    console.log(`Successfully stored ${logs.length} log entries`, {
      levels: logs.map(l => l.level),
      userIds: [...new Set(logs.map(l => l.userId).filter(Boolean))],
      sessionIds: [...new Set(logs.map(l => l.sessionId).filter(Boolean))]
    });

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true,
        stored: logs.length,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Log endpoint error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});