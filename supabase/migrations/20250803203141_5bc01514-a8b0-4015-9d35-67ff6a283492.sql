-- Add pillar field to tasks table for better categorization
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS pillar text;

-- Add index for better performance when filtering by pillar
CREATE INDEX IF NOT EXISTS idx_tasks_pillar ON public.tasks(pillar);

-- Add neuroplastic principle field for tracking development methodology
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS neuroplastic_principle text;

-- Add estimated time for better planning
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS estimated_time_minutes integer DEFAULT 0;

-- Update existing tasks to have default pillar based on title keywords
UPDATE public.tasks 
SET pillar = CASE 
  WHEN LOWER(title) LIKE '%hälsa%' OR LOWER(title) LIKE '%välmående%' OR LOWER(title) LIKE '%self_care%' THEN 'self_care'
  WHEN LOWER(title) LIKE '%färdighet%' OR LOWER(title) LIKE '%kompetens%' OR LOWER(title) LIKE '%skills%' THEN 'skills'
  WHEN LOWER(title) LIKE '%talang%' OR LOWER(title) LIKE '%begåvning%' OR LOWER(title) LIKE '%talent%' THEN 'talent'
  WHEN LOWER(title) LIKE '%varumärke%' OR LOWER(title) LIKE '%profil%' OR LOWER(title) LIKE '%brand%' THEN 'brand'
  WHEN LOWER(title) LIKE '%ekonomi%' OR LOWER(title) LIKE '%finans%' OR LOWER(title) LIKE '%economy%' THEN 'economy'
  ELSE 'open_track'
END
WHERE pillar IS NULL;