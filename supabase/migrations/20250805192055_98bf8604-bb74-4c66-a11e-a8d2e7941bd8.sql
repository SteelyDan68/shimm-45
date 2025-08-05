-- CRITICAL: Add missing RLS policies for tables without policies
-- Based on linter findings, we need to add RLS policies for several tables

-- 1. Add policies for path_entries table
CREATE POLICY "Users can view their own path entries" 
ON public.path_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own path entries" 
ON public.path_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own path entries" 
ON public.path_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all path entries" 
ON public.path_entries 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Coaches can view their clients' path entries" 
ON public.path_entries 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = user_id 
    AND cca.is_active = true
  )
);

-- 2. Add policies for messages_v2 table
CREATE POLICY "Users can view messages they are involved in" 
ON public.messages_v2 
FOR SELECT 
USING (
  auth.uid() = sender_id 
  OR auth.uid() = receiver_id 
  OR is_admin(auth.uid())
);

CREATE POLICY "Users can send messages" 
ON public.messages_v2 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own sent messages" 
ON public.messages_v2 
FOR UPDATE 
USING (auth.uid() = sender_id);

-- 3. Add policies for user_attributes table (temporary fallback for legacy data)
CREATE POLICY "Users can view their own attributes" 
ON public.user_attributes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own attributes" 
ON public.user_attributes 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user attributes" 
ON public.user_attributes 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "System functions can manage user attributes" 
ON public.user_attributes 
FOR ALL 
WITH CHECK (true);

-- 4. Fix security definer functions with proper search path
-- This addresses the WARN issues from the linter
ALTER FUNCTION public.get_user_context SET search_path TO 'public';
ALTER FUNCTION public.set_invitation_token SET search_path TO 'public';
ALTER FUNCTION public.generate_invitation_token SET search_path TO 'public';
ALTER FUNCTION public.cleanup_user_references SET search_path TO 'public';
ALTER FUNCTION public.delete_user_completely SET search_path TO 'public';
ALTER FUNCTION public.reset_user_welcome_assessment SET search_path TO 'public';

-- 5. Update system references from SHIMM to SHIMMS in database functions and configs
UPDATE public.invitations 
SET invitation_text = REPLACE(invitation_text, 'SHIMM', 'SHIMMS')
WHERE invitation_text LIKE '%SHIMM%';

-- 6. Create migration helper function for moving data from user_attributes to path_entries
CREATE OR REPLACE FUNCTION public.migrate_pillar_data_to_path_entries()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec RECORD;
  entry_count INTEGER := 0;
BEGIN
  -- Migrate pillar_activations from user_attributes to path_entries
  FOR rec IN 
    SELECT user_id, attribute_value 
    FROM user_attributes 
    WHERE attribute_key = 'pillar_activations' 
    AND is_active = true
  LOOP
    -- For each user with pillar activations, create path entries
    IF jsonb_typeof(rec.attribute_value) = 'array' THEN
      WITH pillar_data AS (
        SELECT 
          rec.user_id,
          value->'pillar_key' as pillar_key,
          (value->>'is_active')::boolean as is_active,
          value->>'activated_at' as activated_at
        FROM jsonb_array_elements(rec.attribute_value) as value
        WHERE value->>'pillar_key' IS NOT NULL
      )
      INSERT INTO path_entries (
        user_id, 
        created_by, 
        timestamp, 
        type, 
        title, 
        details, 
        status, 
        ai_generated, 
        visible_to_client, 
        metadata
      )
      SELECT 
        user_id,
        user_id,
        COALESCE(activated_at::timestamp, now()),
        'action',
        'Aktiverad pelare: ' || (pillar_key #>> '{}'),
        'Migrerad från gamla systemet',
        'completed',
        false,
        true,
        jsonb_build_object(
          'pillar_key', pillar_key #>> '{}',
          'action', CASE WHEN is_active THEN 'activate' ELSE 'deactivate' END,
          'migrated', true
        )
      FROM pillar_data
      ON CONFLICT DO NOTHING;
      
      entry_count := entry_count + 1;
    END IF;
  END LOOP;

  -- Migrate pillar_assessments from user_attributes to path_entries  
  FOR rec IN 
    SELECT user_id, attribute_value 
    FROM user_attributes 
    WHERE attribute_key = 'pillar_assessments' 
    AND is_active = true
  LOOP
    IF jsonb_typeof(rec.attribute_value) = 'array' THEN
      WITH assessment_data AS (
        SELECT 
          rec.user_id,
          value->'pillar_key' as pillar_key,
          value->'calculated_score' as score,
          value->'assessment_data' as data,
          value->>'created_at' as created_at
        FROM jsonb_array_elements(rec.attribute_value) as value
        WHERE value->>'pillar_key' IS NOT NULL
      )
      INSERT INTO path_entries (
        user_id, 
        created_by, 
        timestamp, 
        type, 
        title, 
        details, 
        status, 
        ai_generated, 
        visible_to_client, 
        metadata
      )
      SELECT 
        user_id,
        user_id,
        COALESCE(created_at::timestamp, now()),
        'assessment',
        'Bedömning: ' || (pillar_key #>> '{}'),
        'Migrerad från gamla systemet',
        'completed',
        false,
        true,
        jsonb_build_object(
          'pillar_key', pillar_key #>> '{}',
          'assessment_score', score,
          'assessment_data', data,
          'migrated', true
        )
      FROM assessment_data
      ON CONFLICT DO NOTHING;
      
      entry_count := entry_count + 1;
    END IF;
  END LOOP;

  RETURN format('Migrated pillar data for %s users to path_entries', entry_count);
END;
$$;