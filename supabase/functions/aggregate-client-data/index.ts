import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AggregationRequest {
  client_id: string;
  force_refresh?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { client_id, force_refresh = false }: AggregationRequest = await req.json();

    if (!client_id) {
      return new Response(
        JSON.stringify({ error: 'client_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Starting data aggregation for client: ${client_id}`);

    // 1. Aggregate Assessment Records
    const { data: assessments, error: assessmentError } = await supabase
      .from('assessment_rounds')
      .select('*')
      .eq('client_id', client_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (assessmentError) {
      console.error('Error fetching assessments:', assessmentError);
    } else {
      // Create assessment record XML for recent assessments
      for (const assessment of assessments.slice(0, 10)) {
        const xmlContent = createAssessmentRecordXML(assessment);
        
        await supabase
          .from('client_data_containers')
          .upsert({
            client_id,
            container_type: 'assessment_record',
            xml_content: xmlContent,
            metadata: {
              source_assessment_id: assessment.id,
              pillar_type: assessment.pillar_type,
              aggregated_at: new Date().toISOString()
            },
            created_by: assessment.created_by
          }, {
            onConflict: 'client_id,container_type,metadata->>source_assessment_id'
          });
      }
    }

    // 2. Aggregate Progress Timeline
    const { data: pathEntries, error: pathError } = await supabase
      .from('path_entries')
      .select('*')
      .eq('client_id', client_id)
      .order('timestamp', { ascending: true });

    if (pathError) {
      console.error('Error fetching path entries:', pathError);
    } else {
      // Create progress timeline XML
      const timelineXML = createProgressTimelineXML(pathEntries);
      
      await supabase
        .from('client_data_containers')
        .upsert({
          client_id,
          container_type: 'progress_timeline',
          xml_content: timelineXML,
          metadata: {
            entry_count: pathEntries.length,
            date_range: {
              start: pathEntries[0]?.timestamp,
              end: pathEntries[pathEntries.length - 1]?.timestamp
            },
            aggregated_at: new Date().toISOString()
          },
          created_by: pathEntries[0]?.created_by || client_id
        }, {
          onConflict: 'client_id,container_type'
        });
    }

    // 3. Aggregate Pillar Assessments
    const { data: pillarAssessments, error: pillarError } = await supabase
      .from('pillar_assessments')
      .select('*')
      .eq('client_id', client_id)
      .order('created_at', { ascending: false });

    if (pillarError) {
      console.error('Error fetching pillar assessments:', pillarError);
    } else {
      // Create pillar analysis XML
      const pillarXML = createPillarAnalysisXML(pillarAssessments);
      
      await supabase
        .from('client_data_containers')
        .upsert({
          client_id,
          container_type: 'pillar_analysis',
          xml_content: pillarXML,
          metadata: {
            assessment_count: pillarAssessments.length,
            pillars_assessed: [...new Set(pillarAssessments.map(a => a.pillar_key))],
            aggregated_at: new Date().toISOString()
          },
          created_by: pillarAssessments[0]?.created_by || client_id
        }, {
          onConflict: 'client_id,container_type'
        });
    }

    console.log(`Data aggregation completed for client: ${client_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Client data aggregated successfully',
        containers_created: ['assessment_record', 'progress_timeline', 'pillar_analysis']
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in aggregate-client-data function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function createAssessmentRecordXML(assessment: any): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<AssessmentRecord>
  <timestamp>${new Date().toISOString()}</timestamp>
  <assessmentId>${assessment.id}</assessmentId>
  <clientId>${assessment.client_id}</clientId>
  <assessmentType>${assessment.pillar_type || assessment.form_definition_id || 'general'}</assessmentType>
  <scores>${JSON.stringify(assessment.scores).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</scores>
  <answers>${JSON.stringify(assessment.answers).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</answers>
  <aiAnalysis>${assessment.ai_analysis || ''}</aiAnalysis>
  <createdBy>${assessment.created_by}</createdBy>
  <metadata>
    <version>1.0</version>
    <source>assessment_rounds</source>
    <aggregated_at>${new Date().toISOString()}</aggregated_at>
  </metadata>
</AssessmentRecord>`;
}

function createProgressTimelineXML(pathEntries: any[]): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<ProgressTimeline>
  <timelineId>timeline_${Date.now()}</timelineId>
  <generatedAt>${new Date().toISOString()}</generatedAt>
  <entryCount>${pathEntries.length}</entryCount>`;

  pathEntries.forEach((entry, index) => {
    xml += `
  <Entry>
    <entryId>${entry.id}</entryId>
    <sequence>${index + 1}</sequence>
    <timestamp>${entry.timestamp}</timestamp>
    <type>${entry.type}</type>
    <title>${entry.title}</title>
    <details>${entry.details || ''}</details>
    <status>${entry.status}</status>
    <aiGenerated>${entry.ai_generated}</aiGenerated>
    <visibleToClient>${entry.visible_to_client}</visibleToClient>
    <metadata>${JSON.stringify(entry.metadata || {}).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</metadata>
  </Entry>`;
  });

  xml += `
</ProgressTimeline>`;

  return xml;
}

function createPillarAnalysisXML(pillarAssessments: any[]): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<PillarAnalysis>
  <analysisId>pillar_analysis_${Date.now()}</analysisId>
  <generatedAt>${new Date().toISOString()}</generatedAt>
  <assessmentCount>${pillarAssessments.length}</assessmentCount>`;

  pillarAssessments.forEach((assessment, index) => {
    xml += `
  <PillarAssessment>
    <assessmentId>${assessment.id}</assessmentId>
    <sequence>${index + 1}</sequence>
    <pillarKey>${assessment.pillar_key}</pillarKey>
    <calculatedScore>${assessment.calculated_score || 0}</calculatedScore>
    <assessmentData>${JSON.stringify(assessment.assessment_data).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</assessmentData>
    <insights>${JSON.stringify(assessment.insights || {}).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</insights>
    <aiAnalysis>${assessment.ai_analysis || ''}</aiAnalysis>
    <createdAt>${assessment.created_at}</createdAt>
  </PillarAssessment>`;
  });

  xml += `
</PillarAnalysis>`;

  return xml;
}