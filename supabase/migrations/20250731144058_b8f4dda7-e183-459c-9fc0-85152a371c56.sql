-- Sätt på RLS igen på user_roles tabellen
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Bekräfta att alla andra kritiska tabeller har RLS aktiverat
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.path_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pillar_assessments ENABLE ROW LEVEL SECURITY;