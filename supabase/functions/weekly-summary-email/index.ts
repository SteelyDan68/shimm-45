import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { Resend } from 'npm:resend@4.0.0';
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { WeeklySummaryEmail } from './_templates/weekly-summary.tsx';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeeklyData {
  pathEntries: Array<{
    type: string;
    title: string;
    date: string;
  }>;
  completedTasks: number;
  pendingTasks: number;
  newAssessments: number;
  velocityRank?: number;
  pillarStatus: Array<{
    name: string;
    score: number;
    icon: string;
  }>;
}

const PILLAR_CONFIG = {
  self_care: { name: 'Self Care', icon: '🧘' },
  skills: { name: 'Skills', icon: '🎯' },
  talent: { name: 'Talent', icon: '⭐' },
  brand: { name: 'Brand', icon: '🏆' },
  economy: { name: 'Economy', icon: '💰' },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting weekly summary email process...');

    // Environment variables
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openAIApiKey || !resendApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Calculate date range (last 7 days)
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    console.log(`Fetching data from ${oneWeekAgo.toISOString()} to ${now.toISOString()}`);

    // Get all active clients with email addresses
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, email, velocity_score')
      .eq('status', 'active')
      .not('email', 'is', null);

    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    console.log(`Found ${clients?.length || 0} active clients with email addresses`);

    const results = [];

    // Process each client
    for (const client of clients || []) {
      try {
        console.log(`Processing client: ${client.name} (${client.email})`);

        // Gather weekly data
        const weeklyData = await gatherWeeklyData(supabase, client.id, oneWeekAgo, now);
        
        // Skip if no activity
        if (weeklyData.pathEntries.length === 0 && weeklyData.completedTasks === 0 && weeklyData.newAssessments === 0) {
          console.log(`Skipping ${client.name} - no activity this week`);
          continue;
        }

        // Generate AI summary
        const aiSummary = await generateAISummary(openAIApiKey, client, weeklyData);

        // Generate quote of the week
        const quoteOfWeek = await generateQuoteOfWeek(openAIApiKey, client.name);

        // Render email
        const html = await renderAsync(
          React.createElement(WeeklySummaryEmail, {
            clientName: client.name,
            weeklyData,
            aiSummary,
            quoteOfWeek,
          })
        );

        // Send email
        const { data: emailResult, error: emailError } = await resend.emails.send({
          from: 'SHIMM <noreply@yourapp.com>',
          to: [client.email],
          subject: `📊 Veckans sammanfattning för ${client.name}`,
          html,
        });

        if (emailError) {
          console.error(`Failed to send email to ${client.email}:`, emailError);
          results.push({ client: client.name, status: 'error', error: emailError.message });
        } else {
          console.log(`Email sent successfully to ${client.email}`);
          results.push({ client: client.name, status: 'sent', emailId: emailResult.id });
        }

      } catch (error) {
        console.error(`Error processing client ${client.name}:`, error);
        results.push({ client: client.name, status: 'error', error: error.message });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in weekly-summary-email function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function gatherWeeklyData(supabase: any, clientId: string, startDate: Date, endDate: Date): Promise<WeeklyData> {
  // Fetch path entries from last week
  const { data: pathEntries } = await supabase
    .from('path_entries')
    .select('type, title, created_at')
    .eq('client_id', clientId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  // Fetch task statistics
  const { data: tasks } = await supabase
    .from('tasks')
    .select('status, completed_at')
    .eq('client_id', clientId);

  const completedTasksThisWeek = tasks?.filter(t => 
    t.status === 'completed' && 
    t.completed_at &&
    new Date(t.completed_at) >= startDate
  ).length || 0;

  const pendingTasks = tasks?.filter(t => t.status !== 'completed').length || 0;

  // Fetch new assessments
  const { data: assessments } = await supabase
    .from('pillar_assessments')
    .select('created_at')
    .eq('client_id', clientId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Fetch latest pillar status
  const { data: latestAssessments } = await supabase
    .from('pillar_assessments')
    .select('pillar_key, calculated_score')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  // Get latest score for each pillar
  const pillarScores: { [key: string]: number } = {};
  latestAssessments?.forEach(assessment => {
    if (!pillarScores[assessment.pillar_key]) {
      pillarScores[assessment.pillar_key] = assessment.calculated_score || 0;
    }
  });

  const pillarStatus = Object.entries(pillarScores).map(([key, score]) => ({
    name: PILLAR_CONFIG[key as keyof typeof PILLAR_CONFIG]?.name || key,
    score: Math.round(score),
    icon: PILLAR_CONFIG[key as keyof typeof PILLAR_CONFIG]?.icon || '📋'
  }));

  return {
    pathEntries: pathEntries?.map(entry => ({
      type: entry.type,
      title: entry.title,
      date: new Date(entry.created_at).toLocaleDateString('sv-SE')
    })) || [],
    completedTasks: completedTasksThisWeek,
    pendingTasks,
    newAssessments: assessments?.length || 0,
    pillarStatus
  };
}

async function generateAISummary(openAIApiKey: string, client: any, weeklyData: WeeklyData): Promise<string> {
  const prompt = `Du är mentor till en offentlig person som använder ett digitalt stödverktyg. Skriv en kort och peppande reflektion över ${client.name}s vecka:

Veckans aktivitet:
- ${weeklyData.completedTasks} uppgifter genomförda
- ${weeklyData.newAssessments} nya självskattningar
- ${weeklyData.pendingTasks} uppgifter kvarstående
- ${weeklyData.pathEntries.length} utvecklingssteg dokumenterade

Senaste aktiviteter:
${weeklyData.pathEntries.slice(0, 5).map(entry => `- ${entry.title} (${entry.date})`).join('\n')}

Pillarstatus:
${weeklyData.pillarStatus.map(pillar => `- ${pillar.name}: ${pillar.score}/10`).join('\n')}

Skriv en positiv reflektion (max 150 ord) över deras framsteg och eventuella påminnelser. Tonen ska vara varm, kortfattad och motiverande.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Du är en erfaren mentor som skriver personliga, uppmuntrande reflektioner.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const aiResponse = await response.json();
  return aiResponse.choices[0].message.content;
}

async function generateQuoteOfWeek(openAIApiKey: string, clientName: string): Promise<string> {
  const prompt = `Skapa ett personligt, inspirerande citat för ${clientName} inför den kommande veckan. Citattet ska vara motiverande, kort (max 30 ord) och relatera till personlig utveckling och framsteg. Skriv bara citattet, ingen annan text.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Du skapar inspirerande citat för personlig utveckling.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.9,
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const aiResponse = await response.json();
  return aiResponse.choices[0].message.content.replace(/"/g, '');
}