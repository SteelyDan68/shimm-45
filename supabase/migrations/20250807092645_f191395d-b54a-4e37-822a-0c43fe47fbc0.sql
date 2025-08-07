-- Fix ambiguous column reference in migration function
CREATE OR REPLACE FUNCTION migrate_all_legacy_assessments()
RETURNS TABLE (
  user_id UUID,
  pillar_type TEXT,
  migration_status TEXT,
  details TEXT
) AS $$
DECLARE
  user_record RECORD;
  pillar_record RECORD;
  migration_count INTEGER := 0;
BEGIN
  RAISE LOG 'Starting bulk migration of legacy assessment data...';
  
  -- Loopa genom alla användare som har path_entries men saknar assessment_rounds
  FOR user_record IN 
    SELECT DISTINCT pe.user_id, p.email
    FROM path_entries pe
    JOIN profiles p ON pe.user_id = p.id
    WHERE pe.type = 'recommendation' 
      AND pe.ai_generated = true
      AND (pe.metadata->>'pillar_type') IS NOT NULL
      AND pe.details IS NOT NULL
      AND length(pe.details) > 100
      AND p.is_active = true
  LOOP
    
    -- Loopa genom alla pillar-typer för denna användare
    FOR pillar_record IN
      SELECT DISTINCT 
        (pe.metadata->>'pillar_type') as pillar_type,
        pe.details,
        pe.metadata,
        pe.created_at,
        pe.updated_at,
        pe.id as path_entry_id
      FROM path_entries pe
      WHERE pe.user_id = user_record.user_id
        AND pe.type = 'recommendation'
        AND pe.ai_generated = true
        AND (pe.metadata->>'pillar_type') IS NOT NULL
        AND pe.details IS NOT NULL
        AND length(pe.details) > 100
        -- Endast om assessment_round inte redan finns
        AND NOT EXISTS (
          SELECT 1 FROM assessment_rounds ar 
          WHERE ar.user_id = user_record.user_id 
            AND ar.pillar_type = (pe.metadata->>'pillar_type')
        )
      ORDER BY pe.created_at DESC
      LIMIT 1 -- Senaste analysen per pillar
    LOOP
      
      BEGIN
        -- Skapa assessment_round från path_entry data
        INSERT INTO assessment_rounds (
          user_id,
          created_by,
          pillar_type,
          answers,
          scores,
          comments,
          ai_analysis,
          created_at,
          updated_at
        ) VALUES (
          user_record.user_id,
          user_record.user_id,
          pillar_record.pillar_type,
          COALESCE(
            (pillar_record.metadata->'assessment_data')::jsonb,
            jsonb_build_object(
              'bulk_migrated_from_path_entry', true,
              'original_path_entry_id', pillar_record.path_entry_id,
              'migration_timestamp', now()
            )
          ),
          jsonb_build_object(
            pillar_record.pillar_type, COALESCE((pillar_record.metadata->>'assessment_score')::numeric, 0),
            'overall', COALESCE((pillar_record.metadata->>'assessment_score')::numeric, 0)
          ),
          'Bulk-migrerad från legacy system via universal migration',
          pillar_record.details,
          pillar_record.created_at,
          pillar_record.updated_at
        );
        
        migration_count := migration_count + 1;
        
        RETURN QUERY SELECT 
          user_record.user_id,
          pillar_record.pillar_type,
          'SUCCESS'::TEXT,
          format('Migrated assessment for %s', user_record.email);
          
        RAISE LOG 'Migrated % assessment for user %', pillar_record.pillar_type, user_record.email;
        
      EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
          user_record.user_id,
          pillar_record.pillar_type,
          'ERROR'::TEXT,
          format('Failed: %s', SQLERRM);
          
        RAISE LOG 'Migration failed for % % - %', user_record.email, pillar_record.pillar_type, SQLERRM;
      END;
      
    END LOOP;
  END LOOP;
  
  RAISE LOG 'Bulk migration completed. Total migrations: %', migration_count;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;