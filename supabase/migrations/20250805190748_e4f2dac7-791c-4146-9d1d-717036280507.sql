-- ============================================================================
-- HYBRID ARCHITECTURE MIGRATION: CRITICAL SYSTEM ROLLBACK & OPTIMIZATION
-- ============================================================================
-- Rolling back path_entries and other high-frequency data from attributes 
-- to dedicated tables for optimal performance

-- 1. RECREATE PATH_ENTRIES TABLE (for high-frequency journaling data)
CREATE TABLE IF NOT EXISTS public.path_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  type TEXT NOT NULL DEFAULT 'milestone',
  title TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  visible_to_client BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_by_role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_path_entries_user_id ON public.path_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_path_entries_client_id ON public.path_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_path_entries_timestamp ON public.path_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_path_entries_type ON public.path_entries(type);

-- Enable RLS
ALTER TABLE public.path_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own path entries" 
ON public.path_entries FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own path entries" 
ON public.path_entries FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own path entries" 
ON public.path_entries FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own path entries" 
ON public.path_entries FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all path entries" 
ON public.path_entries FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Coaches can view their clients' path entries" 
ON public.path_entries FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = path_entries.user_id 
    AND cca.is_active = true
  )
);

-- 2. RECREATE MESSAGES TABLE (for high-frequency messaging data)
CREATE TABLE IF NOT EXISTS public.messages_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  receiver_id UUID,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  metadata JSONB DEFAULT '{}',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_v2_conversation_id ON public.messages_v2(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_v2_sender_id ON public.messages_v2(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_v2_receiver_id ON public.messages_v2(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_v2_created_at ON public.messages_v2(created_at);

-- Enable RLS
ALTER TABLE public.messages_v2 ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view messages they sent or received" 
ON public.messages_v2 FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create their own messages" 
ON public.messages_v2 FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" 
ON public.messages_v2 FOR UPDATE 
USING (auth.uid() = sender_id);

CREATE POLICY "Admins can manage all messages" 
ON public.messages_v2 FOR ALL 
USING (is_admin(auth.uid()));

-- 3. ADD TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_path_entries_updated_at
    BEFORE UPDATE ON public.path_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_v2_updated_at
    BEFORE UPDATE ON public.messages_v2
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 4. KEEP USER_ATTRIBUTES FOR CONFIGURATION DATA ONLY
-- Keep pillar activations, user preferences, settings in user_attributes
-- These are low-frequency configuration data, perfect for attributes

-- 5. CREATE MIGRATION HELPER FUNCTION
CREATE OR REPLACE FUNCTION migrate_path_entries_from_attributes()
RETURNS TEXT AS $$
DECLARE
  user_record RECORD;
  path_data JSONB;
  entry_record JSONB;
  migrated_count INTEGER := 0;
BEGIN
  -- Loop through all users who have path_entries in attributes
  FOR user_record IN 
    SELECT DISTINCT user_id, attribute_value
    FROM user_attributes 
    WHERE attribute_key = 'path_entries' 
    AND is_active = true
  LOOP
    path_data := user_record.attribute_value;
    
    -- Insert each path entry into the new table
    FOR entry_record IN SELECT * FROM jsonb_array_elements(path_data)
    LOOP
      INSERT INTO public.path_entries (
        id, user_id, client_id, type, title, details, timestamp, status,
        ai_generated, visible_to_client, metadata, created_by, created_by_role,
        created_at, updated_at
      ) VALUES (
        COALESCE((entry_record->>'id')::UUID, gen_random_uuid()),
        user_record.user_id,
        (entry_record->>'client_id')::UUID,
        COALESCE(entry_record->>'type', 'milestone'),
        COALESCE(entry_record->>'title', 'Unnamed Entry'),
        entry_record->>'details',
        COALESCE((entry_record->>'timestamp')::TIMESTAMP WITH TIME ZONE, now()),
        COALESCE(entry_record->>'status', 'active'),
        COALESCE((entry_record->>'ai_generated')::BOOLEAN, false),
        COALESCE((entry_record->>'visible_to_client')::BOOLEAN, false),
        COALESCE(entry_record->'metadata', '{}'),
        COALESCE((entry_record->>'created_by')::UUID, user_record.user_id),
        COALESCE(entry_record->>'created_by_role', 'user'),
        COALESCE((entry_record->>'created_at')::TIMESTAMP WITH TIME ZONE, now()),
        COALESCE((entry_record->>'updated_at')::TIMESTAMP WITH TIME ZONE, now())
      ) ON CONFLICT (id) DO NOTHING;
      
      migrated_count := migrated_count + 1;
    END LOOP;
    
    -- Mark the attribute as migrated (don't delete, keep for backup)
    UPDATE user_attributes 
    SET attribute_key = 'path_entries_migrated_backup'
    WHERE user_id = user_record.user_id 
    AND attribute_key = 'path_entries';
  END LOOP;
  
  RETURN 'Migrated ' || migrated_count || ' path entries from attributes to dedicated table';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;