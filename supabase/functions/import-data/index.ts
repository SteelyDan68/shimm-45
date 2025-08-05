import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ImportRequest {
  file: {
    name: string
    content: string
    type: string
  }
  type: string
  mapping?: Record<string, string>
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
    const { file, type, mapping, user_id }: ImportRequest = await req.json()

    console.log('Import request:', { fileName: file.name, type, user_id })

    // Create import request record
    const { data: importRecord, error: createError } = await supabase
      .from('import_requests')
      .insert({
        file_name: file.name,
        type,
        status: 'processing',
        created_by: user_id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating import record:', createError)
      throw createError
    }

    // Start background processing
    processImport(importRecord.id, file, type, mapping, user_id)

    return new Response(
      JSON.stringify({ import_id: importRecord.id, status: 'processing' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Import error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

async function processImport(
  importId: string,
  file: any,
  type: string,
  mapping: any,
  userId: string
) {
  try {
    // Parse CSV content
    const lines = file.content.split('\n')
    const headers = lines[0].split(',').map((h: string) => h.trim())
    const dataRows = lines.slice(1).filter((line: string) => line.trim())

    let processedRows = 0
    let errors = 0

    // Process each row
    for (const row of dataRows) {
      try {
        const values = row.split(',').map((v: string) => v.trim().replace(/"/g, ''))
        const rowData: any = {}

        // Map CSV columns to database columns
        headers.forEach((header, index) => {
          const mappedColumn = mapping?.[header] || header.toLowerCase()
          rowData[mappedColumn] = values[index]
        })

        // Insert data based on type
        switch (type) {
          case 'users':
            // Add user data - would need proper validation
            if (rowData.email) {
              await supabase
                .from('profiles')
                .upsert({
                  email: rowData.email,
                  first_name: rowData.first_name || '',
                  last_name: rowData.last_name || ''
                })
            }
            break

          case 'tasks':
            // Add task data
            if (rowData.title) {
              await supabase
                .from('tasks')
                .insert({
                  title: rowData.title,
                  description: rowData.description || '',
                  user_id: userId,
                  status: rowData.status || 'pending',
                  priority: rowData.priority || 'medium'
                })
            }
            break

          case 'calendar':
            // Add calendar events
            if (rowData.title && rowData.event_date) {
              await supabase
                .from('calendar_events')
                .insert({
                  title: rowData.title,
                  description: rowData.description || '',
                  event_date: new Date(rowData.event_date).toISOString(),
                  user_id: userId,
                  category: rowData.category || 'general',
                  created_by: userId,
                  created_by_role: 'client'
                })
            }
            break
        }

        processedRows++

      } catch (rowError) {
        console.error('Row processing error:', rowError)
        errors++
      }
    }

    // Update import record as completed
    await supabase
      .from('import_requests')
      .update({
        status: 'completed',
        total_rows: dataRows.length,
        processed_rows: processedRows,
        errors,
        completed_at: new Date().toISOString()
      })
      .eq('id', importId)

    console.log('Import completed successfully:', importId, { processedRows, errors })

  } catch (error) {
    console.error('Import processing error:', error)
    
    // Update import record as failed
    await supabase
      .from('import_requests')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', importId)
  }
}