-- UNIVERSELL DATASYNKRONISERING: Auto-sync trigger för assessment data
-- Säkerställer att assessment_rounds och path_entries hålls synkroniserade

-- 1. Skapa trigger function för synkronisering
CREATE OR REPLACE FUNCTION sync_assessment_data_universal()
RETURNS TRIGGER AS $$
DECLARE
  pillar_display_name TEXT;
  avg_score NUMERIC;
BEGIN
  -- Hantera bara AI-genererade recommendations med pillar_type
  IF NEW.type = 'recommendation' 
     AND NEW.ai_generated = true 
     AND (NEW.metadata->>'pillar_type') IS NOT NULL 
     AND NEW.details IS NOT NULL 
     AND length(NEW.details) > 100 THEN
    
    -- Beräkna genomsnittlig score
    avg_score := COALESCE((NEW.metadata->>'assessment_score')::numeric, 0);
    
    -- Konvertera pillar_type till display name
    pillar_display_name := CASE (NEW.metadata->>'pillar_type')
      WHEN 'talent' THEN 'Talang'
      WHEN 'skills' THEN 'Kompetenser'
      WHEN 'brand' THEN 'Varumärke' 
      WHEN 'economy' THEN 'Ekonomi'
      WHEN 'self_care' THEN 'Självomvårdnad'
      WHEN 'open_track' THEN 'Öppna spåret'
      ELSE (NEW.metadata->>'pillar_type')
    END;
    
    -- Försök skapa motsvarande assessment_round (om den inte redan finns)
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
      NEW.user_id,
      NEW.created_by,
      (NEW.metadata->>'pillar_type'),
      COALESCE(
        (NEW.metadata->'assessment_data')::jsonb,
        jsonb_build_object(
          'auto_synced_from_path_entry', true,
          'original_path_entry_id', NEW.id,
          'sync_timestamp', now()
        )
      ),
      jsonb_build_object(
        (NEW.metadata->>'pillar_type'), avg_score,
        'overall', avg_score
      ),
      COALESCE('Auto-synced från path_entries via universal trigger', NEW.metadata->>'comments'),
      NEW.details,
      NEW.created_at,
      NEW.updated_at
    )
    ON CONFLICT (user_id, pillar_type) 
    DO UPDATE SET 
      ai_analysis = EXCLUDED.ai_analysis,
      updated_at = now(),
      comments = EXCLUDED.comments || ' (Updated via sync)'
    WHERE assessment_rounds.ai_analysis IS NULL 
       OR length(assessment_rounds.ai_analysis) < length(EXCLUDED.ai_analysis);
    
    RAISE LOG 'Universal sync: Created/updated assessment_round for user % pillar %', NEW.user_id, (NEW.metadata->>'pillar_type');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Skapa trigger på path_entries för automatisk synkronisering
DROP TRIGGER IF EXISTS trigger_sync_assessment_data_universal ON path_entries;
CREATE TRIGGER trigger_sync_assessment_data_universal
  AFTER INSERT OR UPDATE ON path_entries
  FOR EACH ROW
  EXECUTE FUNCTION sync_assessment_data_universal();

-- 3. Skapa function för bulk migration av befintlig data
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
        (metadata->>'pillar_type') as pillar_type,
        details,
        metadata,
        created_at,
        updated_at,
        id as path_entry_id
      FROM path_entries 
      WHERE user_id = user_record.user_id
        AND type = 'recommendation'
        AND ai_generated = true
        AND (metadata->>'pillar_type') IS NOT NULL
        AND details IS NOT NULL
        AND length(details) > 100
        -- Endast om assessment_round inte redan finns
        AND NOT EXISTS (
          SELECT 1 FROM assessment_rounds ar 
          WHERE ar.user_id = user_record.user_id 
            AND ar.pillar_type = (metadata->>'pillar_type')
        )
      ORDER BY created_at DESC
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Sätta permissions för funktionerna
GRANT EXECUTE ON FUNCTION sync_assessment_data_universal() TO authenticated;
GRANT EXECUTE ON FUNCTION migrate_all_legacy_assessments() TO authenticated;