-- Åtgärda coach_client_assignments tabellen som har korrupt struktur
DROP TABLE IF EXISTS public.coach_client_assignments CASCADE;

-- Återskapa coach_client_assignments tabellen med korrekt struktur
CREATE TABLE public.coach_client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coach_id, client_id)
);

-- Enable RLS
ALTER TABLE public.coach_client_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage coach assignments"
ON public.coach_client_assignments
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Superadmin god mode - coach assignments"
ON public.coach_client_assignments
FOR ALL
TO authenticated
USING (superadmin_god_mode(auth.uid()))
WITH CHECK (superadmin_god_mode(auth.uid()));

CREATE POLICY "Users can view coach assignments"
ON public.coach_client_assignments
FOR SELECT
TO authenticated
USING (
  auth.uid() = coach_id OR 
  auth.uid() = client_id OR 
  is_admin(auth.uid()) OR
  superadmin_god_mode(auth.uid())
);

-- Add indexes for performance
CREATE INDEX idx_coach_client_assignments_coach_id ON public.coach_client_assignments(coach_id);
CREATE INDEX idx_coach_client_assignments_client_id ON public.coach_client_assignments(client_id);
CREATE INDEX idx_coach_client_assignments_active ON public.coach_client_assignments(is_active);

-- Add update trigger
CREATE TRIGGER update_coach_client_assignments_updated_at
  BEFORE UPDATE ON public.coach_client_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_prd_updated_at();