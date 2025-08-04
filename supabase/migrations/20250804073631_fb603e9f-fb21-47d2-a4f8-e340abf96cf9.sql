-- Update some of Stefan's tasks to have deadlines in August 2025 for testing
UPDATE tasks 
SET deadline = '2025-08-05 10:00:00+00'::timestamp with time zone,
    updated_at = now()
WHERE user_id = '5489d5a1-79c7-49b0-8ce3-578967d18cf6' 
  AND title = '5-minuters morgonreflektion'
  AND deadline = '2025-01-31 07:00:00+00'::timestamp with time zone
  AND id = '5a92afff-b5fe-4d00-aa6f-802d113e22f8';

UPDATE tasks 
SET deadline = '2025-08-06 14:00:00+00'::timestamp with time zone,
    updated_at = now()
WHERE user_id = '5489d5a1-79c7-49b0-8ce3-578967d18cf6' 
  AND title = 'Dagens mål'
  AND deadline = '2025-01-31 08:00:00+00'::timestamp with time zone
  AND id = 'ca391e4c-9332-4bc2-99a5-b88f67e990ee';

UPDATE tasks 
SET deadline = '2025-08-07 16:00:00+00'::timestamp with time zone,
    updated_at = now()
WHERE user_id = '5489d5a1-79c7-49b0-8ce3-578967d18cf6' 
  AND title = '10-minuters fysisk aktivitet'
  AND deadline = '2025-01-31 09:00:00+00'::timestamp with time zone
  AND id = 'c7e7f3f3-a541-42e5-bc8c-631179b563cd';

UPDATE tasks 
SET deadline = '2025-08-08 12:00:00+00'::timestamp with time zone,
    updated_at = now()
WHERE user_id = '5489d5a1-79c7-49b0-8ce3-578967d18cf6' 
  AND title = 'Fira dina framsteg'
  AND deadline = '2025-02-17 19:00:00+00'::timestamp with time zone
  AND id = '15079ca3-f4c2-4e68-b8c2-88705bd63bb8';

UPDATE tasks 
SET deadline = '2025-08-09 09:00:00+00'::timestamp with time zone,
    updated_at = now()
WHERE user_id = '5489d5a1-79c7-49b0-8ce3-578967d18cf6' 
  AND title = 'Planera nästa veckas aktiviteter'
  AND deadline = '2025-02-16 10:00:00+00'::timestamp with time zone
  AND id = 'e19d16ff-5917-4973-9409-d4e819de3e8a';