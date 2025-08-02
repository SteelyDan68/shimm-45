-- Ta bort user_relationships tabellen som skapar konflikt med user_roles
-- och ersätt med en enkel coach_client_assignments tabell

-- Först, skapa en enkel coach-client tilldelningstabell
CREATE TABLE IF NOT EXISTS public.coach_client_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  client_id UUID NOT NULL,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coach_id, client_id)
);

-- Aktivera RLS
ALTER TABLE public.coach_client_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies för coach_client_assignments
CREATE POLICY "Admins can manage all coach-client assignments" 
ON public.coach_client_assignments 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Coaches can view their assigned clients" 
ON public.coach_client_assignments 
FOR SELECT 
USING (auth.uid() = coach_id OR auth.uid() = client_id);

CREATE POLICY "Admins can create coach-client assignments" 
ON public.coach_client_assignments 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

-- Skapa trigger för updated_at
CREATE TRIGGER update_coach_client_assignments_updated_at
BEFORE UPDATE ON public.coach_client_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Ta bort user_relationships tabellen helt
DROP TABLE IF EXISTS public.user_relationships CASCADE;