import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  types?: string[];
  limit?: number;
  userId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  content?: string;
  metadata?: Record<string, any>;
  relevance_score: number;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const roles = (userRoles || []).map(r => r.role);
    const isAdmin = roles.includes('superadmin') || roles.includes('admin');
    const isCoach = roles.includes('coach');

    const searchRequest: SearchRequest = await req.json();
    const { query, types = [], limit = 50, dateRange } = searchRequest;

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ results: [], totalCount: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchTerm = query.trim().toLowerCase();
    const results: SearchResult[] = [];

    // Helper function to calculate relevance score
    const calculateRelevance = (text: string, searchTerm: string, boost = 1): number => {
      const lowerText = text.toLowerCase();
      let score = 0;
      
      // Exact match gets highest score
      if (lowerText === searchTerm) score += 100;
      // Title starts with search term
      else if (lowerText.startsWith(searchTerm)) score += 75;
      // Title contains search term
      else if (lowerText.includes(searchTerm)) score += 50;
      // Word boundaries
      const wordMatch = lowerText.match(new RegExp(`\\b${searchTerm}\\b`, 'g'));
      if (wordMatch) score += wordMatch.length * 25;
      
      return score * boost;
    };

    // Search profiles/users
    if (!types.length || types.includes('user')) {
      try {
        let profileQuery = supabase
          .from('profiles')
          .select('id, first_name, last_name, email, job_title, organization, client_category, created_at')
          .limit(20);

        // Use PostgreSQL full-text search for better performance
        profileQuery = profileQuery.or(
          `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,organization.ilike.%${searchTerm}%,job_title.ilike.%${searchTerm}%`
        );

        const { data: profiles } = await profileQuery;

        if (profiles) {
          profiles.forEach(profile => {
            const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            const title = fullName || profile.email || 'Okänd användare';
            
            let relevance = 0;
            relevance += calculateRelevance(title, searchTerm, 3);
            relevance += calculateRelevance(profile.email || '', searchTerm, 2);
            relevance += calculateRelevance(profile.organization || '', searchTerm, 1.5);
            relevance += calculateRelevance(profile.job_title || '', searchTerm, 1);

            // Boost recent profiles
            const daysSinceCreation = profile.created_at 
              ? (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
              : 999;
            relevance += Math.max(0, 30 - daysSinceCreation);

            results.push({
              id: profile.id,
              type: 'user',
              title,
              subtitle: profile.job_title || profile.organization || profile.email,
              content: `${profile.client_category || ''} - ${profile.organization || ''}`,
              metadata: { category: profile.client_category, organization: profile.organization },
              relevance_score: relevance,
              created_at: profile.created_at,
              url: `/user/${profile.id}`
            });
          });
        }
      } catch (error) {
        console.error('Profile search error:', error);
      }
    }

    // Search messages
    if (!types.length || types.includes('message')) {
      try {
        let messageQuery = supabase
          .from('messages')
          .select(`
            id, subject, content, created_at, sender_id, receiver_id,
            sender:profiles!messages_sender_id_fkey(first_name, last_name),
            receiver:profiles!messages_receiver_id_fkey(first_name, last_name)
          `)
          .or(`subject.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false })
          .limit(15);

        // Filter messages user can access
        if (!isAdmin) {
          messageQuery = messageQuery.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
        }

        const { data: messages } = await messageQuery;

        if (messages) {
          messages.forEach(message => {
            const title = message.subject || 'Meddelande utan ämne';
            const otherUser = message.sender_id === user.id 
              ? message.receiver as any
              : message.sender as any;
            
            let relevance = 0;
            relevance += calculateRelevance(title, searchTerm, 2);
            relevance += calculateRelevance(message.content || '', searchTerm, 1);

            // Boost recent messages
            const daysSinceCreation = message.created_at 
              ? (Date.now() - new Date(message.created_at).getTime()) / (1000 * 60 * 60 * 24)
              : 999;
            relevance += Math.max(0, 14 - daysSinceCreation); // Favor messages within 2 weeks

            results.push({
              id: message.id,
              type: 'message',
              title,
              subtitle: `Till/Från: ${otherUser?.first_name || ''} ${otherUser?.last_name || ''}`.trim(),
              content: message.content?.substring(0, 200) + (message.content?.length > 200 ? '...' : ''),
              relevance_score: relevance,
              created_at: message.created_at,
              url: `/messages?messageId=${message.id}`
            });
          });
        }
      } catch (error) {
        console.error('Message search error:', error);
      }
    }

    // Search tasks
    if (!types.length || types.includes('task')) {
      try {
        let taskQuery = supabase
          .from('tasks')
          .select('id, title, description, status, priority, deadline, created_at, user_id')
          .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false })
          .limit(15);

        if (!isAdmin) {
          taskQuery = taskQuery.eq('user_id', user.id);
        }

        const { data: tasks } = await taskQuery;

        if (tasks) {
          tasks.forEach(task => {
            let relevance = 0;
            relevance += calculateRelevance(task.title, searchTerm, 3);
            relevance += calculateRelevance(task.description || '', searchTerm, 1);

            // Boost by priority and status
            const priorityBoost = { high: 15, medium: 10, low: 5 }[task.priority] || 0;
            const statusBoost = { active: 10, planned: 5, completed: 0 }[task.status] || 0;
            relevance += priorityBoost + statusBoost;

            results.push({
              id: task.id,
              type: 'task',
              title: task.title,
              subtitle: `Status: ${task.status} | Prioritet: ${task.priority}`,
              content: task.description?.substring(0, 150) + (task.description?.length > 150 ? '...' : ''),
              metadata: { 
                status: task.status, 
                priority: task.priority, 
                deadline: task.deadline 
              },
              relevance_score: relevance,
              created_at: task.created_at,
              user_id: task.user_id,
              url: `/tasks?taskId=${task.id}`
            });
          });
        }
      } catch (error) {
        console.error('Task search error:', error);
      }
    }

    // Search calendar events
    if (!types.length || types.includes('calendar')) {
      try {
        let calendarQuery = supabase
          .from('calendar_events')
          .select('id, title, description, event_date, category, created_at, user_id')
          .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .order('event_date', { ascending: false })
          .limit(10);

        if (!isAdmin) {
          calendarQuery = calendarQuery.eq('user_id', user.id);
        }

        const { data: events } = await calendarQuery;

        if (events) {
          events.forEach(event => {
            let relevance = 0;
            relevance += calculateRelevance(event.title, searchTerm, 2.5);
            relevance += calculateRelevance(event.description || '', searchTerm, 1);

            // Boost upcoming events
            const daysTillEvent = event.event_date 
              ? (new Date(event.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              : -999;
            if (daysTillEvent >= 0 && daysTillEvent <= 30) {
              relevance += 20; // Boost events in next 30 days
            }

            results.push({
              id: event.id,
              type: 'calendar',
              title: event.title,
              subtitle: `${event.category} - ${new Date(event.event_date).toLocaleDateString('sv-SE')}`,
              content: event.description?.substring(0, 150) + (event.description?.length > 150 ? '...' : ''),
              metadata: { 
                category: event.category, 
                event_date: event.event_date 
              },
              relevance_score: relevance,
              created_at: event.created_at,
              user_id: event.user_id,
              url: `/calendar?eventId=${event.id}`
            });
          });
        }
      } catch (error) {
        console.error('Calendar search error:', error);
      }
    }

    // Search assessments
    if (!types.length || types.includes('assessment')) {
      try {
        let assessmentQuery = supabase
          .from('assessment_rounds')
          .select('id, pillar_type, ai_analysis, created_at, user_id')
          .or(`pillar_type.ilike.%${searchTerm}%,ai_analysis.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!isAdmin) {
          assessmentQuery = assessmentQuery.eq('user_id', user.id);
        }

        const { data: assessments } = await assessmentQuery;

        if (assessments) {
          assessments.forEach(assessment => {
            let relevance = 0;
            relevance += calculateRelevance(assessment.pillar_type, searchTerm, 2);
            relevance += calculateRelevance(assessment.ai_analysis || '', searchTerm, 1);

            results.push({
              id: assessment.id,
              type: 'assessment',
              title: `${assessment.pillar_type} Bedömning`,
              subtitle: `Genomförd: ${new Date(assessment.created_at).toLocaleDateString('sv-SE')}`,
              content: assessment.ai_analysis?.substring(0, 150) + (assessment.ai_analysis?.length > 150 ? '...' : ''),
              metadata: { pillar_type: assessment.pillar_type },
              relevance_score: relevance,
              created_at: assessment.created_at,
              user_id: assessment.user_id,
              url: `/client-assessment/${assessment.user_id}?assessmentId=${assessment.id}`
            });
          });
        }
      } catch (error) {
        console.error('Assessment search error:', error);
      }
    }

    // Search organizations (admin/coach only)
    if ((isAdmin || isCoach) && (!types.length || types.includes('organization'))) {
      try {
        const { data: organizations } = await supabase
          .from('organizations')
          .select('id, name, description, contact_email, website, created_at')
          .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .limit(10);

        if (organizations) {
          organizations.forEach(org => {
            let relevance = 0;
            relevance += calculateRelevance(org.name, searchTerm, 3);
            relevance += calculateRelevance(org.description || '', searchTerm, 1);

            results.push({
              id: org.id,
              type: 'organization',
              title: org.name,
              subtitle: org.contact_email || org.website || '',
              content: org.description?.substring(0, 150) + (org.description?.length > 150 ? '...' : ''),
              relevance_score: relevance,
              created_at: org.created_at,
              url: `/administration?tab=organizations&orgId=${org.id}`
            });
          });
        }
      } catch (error) {
        console.error('Organization search error:', error);
      }
    }

    // Apply date range filter
    let filteredResults = results;
    if (dateRange?.start && dateRange?.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      filteredResults = results.filter(result => {
        const resultDate = new Date(result.created_at || result.updated_at || Date.now());
        return resultDate >= startDate && resultDate <= endDate;
      });
    }

    // Sort by relevance score and limit results
    filteredResults.sort((a, b) => b.relevance_score - a.relevance_score);
    const limitedResults = filteredResults.slice(0, limit);

    return new Response(
      JSON.stringify({
        results: limitedResults,
        totalCount: filteredResults.length,
        searchTerm: query
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Global search error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});