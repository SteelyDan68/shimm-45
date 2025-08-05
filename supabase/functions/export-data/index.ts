import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ExportRequest {
  dataTypes: string[]
  format: 'csv' | 'excel' | 'json'
  name: string
  includeMetadata: boolean
  filters?: {
    dateRange?: { start: string; end: string }
    userIds?: string[]
    status?: string
    categories?: string[]
  }
  user_id: string
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { dataTypes, format, name, includeMetadata, filters, user_id }: ExportRequest = await req.json()

    console.log('Export request:', { dataTypes, format, name, user_id })

    // Create export request record
    const { data: exportRecord, error: createError } = await supabase
      .from('export_requests')
      .insert({
        name,
        format,
        data_types: dataTypes,
        status: 'processing',
        created_by: user_id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating export record:', createError)
      throw createError
    }

    // Start background processing
    processExport(exportRecord.id, dataTypes, format, includeMetadata, filters, user_id)

    return new Response(
      JSON.stringify({ export_id: exportRecord.id, status: 'processing' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Export error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

async function processExport(
  exportId: string, 
  dataTypes: string[], 
  format: string, 
  includeMetadata: boolean, 
  filters: any, 
  userId: string
) {
  try {
    const exportedData: any = {}
    
    // Export each data type
    for (const dataType of dataTypes) {
      switch (dataType) {
        case 'users':
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            
          exportedData.users = profiles
          break
          
        case 'tasks':
          const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            
          exportedData.tasks = tasks
          break
          
        case 'messages':
          const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            
          exportedData.messages = messages
          break
          
        case 'assessments':
          const { data: assessments } = await supabase
            .from('assessment_rounds')
            .select('*')
            .eq('user_id', userId)
            
          exportedData.assessments = assessments
          break
          
        case 'calendar':
          const { data: events } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('user_id', userId)
            
          exportedData.calendar = events
          break
          
        case 'analytics':
          const { data: analytics } = await supabase
            .from('analytics_metrics')
            .select('*')
            .eq('user_id', userId)
            
          exportedData.analytics = analytics
          break
          
        case 'coaching':
          const { data: coaching } = await supabase
            .from('coaching_sessions')
            .select('*')
            .eq('user_id', userId)
            
          exportedData.coaching = coaching
          break
      }
    }

    // Generate file content based on format
    let fileContent: string
    let contentType: string
    
    switch (format) {
      case 'json':
        fileContent = JSON.stringify(exportedData, null, 2)
        contentType = 'application/json'
        break
        
      case 'csv':
        // Simple CSV conversion for first data type
        const firstDataType = Object.keys(exportedData)[0]
        const data = exportedData[firstDataType] || []
        
        if (data.length > 0) {
          const headers = Object.keys(data[0])
          const csvRows = [
            headers.join(','),
            ...data.map((row: any) => 
              headers.map(header => 
                JSON.stringify(row[header] || '')
              ).join(',')
            )
          ]
          fileContent = csvRows.join('\n')
        } else {
          fileContent = 'No data found'
        }
        contentType = 'text/csv'
        break
        
      default:
        fileContent = JSON.stringify(exportedData, null, 2)
        contentType = 'application/json'
    }

    // For demo purposes, we'll just store the content as a simple string
    // In production, you'd upload to Supabase Storage
    const mockFileUrl = `data:${contentType};base64,${btoa(fileContent)}`

    // Update export record as completed
    await supabase
      .from('export_requests')
      .update({
        status: 'completed',
        file_url: mockFileUrl,
        file_size_bytes: fileContent.length,
        completed_at: new Date().toISOString()
      })
      .eq('id', exportId)

    console.log('Export completed successfully:', exportId)

  } catch (error) {
    console.error('Export processing error:', error)
    
    // Update export record as failed
    await supabase
      .from('export_requests')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', exportId)
  }
}