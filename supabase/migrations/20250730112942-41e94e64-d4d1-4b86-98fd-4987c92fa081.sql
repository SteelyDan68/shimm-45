-- Insert default questions for Self Care Assessment
INSERT INTO public.assessment_questions (form_definition_id, question_text, question_type, question_key, min_value, max_value, sort_order)
SELECT 
  id,
  'Hur väl sover du?',
  'scale',
  'sleep_quality',
  1,
  5,
  1
FROM public.assessment_form_definitions WHERE assessment_type = 'self_care';

INSERT INTO public.assessment_questions (form_definition_id, question_text, question_type, question_key, min_value, max_value, sort_order)
SELECT 
  id,
  'Hur stressad känner du dig?',
  'scale',
  'stress_level',
  1,
  5,
  2
FROM public.assessment_form_definitions WHERE assessment_type = 'self_care';

INSERT INTO public.assessment_questions (form_definition_id, question_text, question_type, question_key, min_value, max_value, sort_order)
SELECT 
  id,
  'Hur ofta motionerar du?',
  'scale',
  'exercise_frequency',
  1,
  5,
  3
FROM public.assessment_form_definitions WHERE assessment_type = 'self_care';

INSERT INTO public.assessment_questions (form_definition_id, question_text, question_type, question_key, min_value, max_value, sort_order)
SELECT 
  id,
  'Hur nöjd är du med dina matvanor?',
  'scale',
  'nutrition',
  1,
  5,
  4
FROM public.assessment_form_definitions WHERE assessment_type = 'self_care';

INSERT INTO public.assessment_questions (form_definition_id, question_text, question_type, question_key, min_value, max_value, sort_order)
SELECT 
  id,
  'Hur balanserat är ditt liv?',
  'scale',
  'work_life_balance',
  1,
  5,
  5
FROM public.assessment_form_definitions WHERE assessment_type = 'self_care';

-- Insert default questions for Skills Assessment
INSERT INTO public.assessment_questions (form_definition_id, question_text, question_type, question_key, min_value, max_value, sort_order)
SELECT 
  id,
  'Hur nöjd är du med dina tekniska färdigheter?',
  'scale',
  'technical_skills',
  1,
  5,
  1
FROM public.assessment_form_definitions WHERE assessment_type = 'skills';

INSERT INTO public.assessment_questions (form_definition_id, question_text, question_type, question_key, min_value, max_value, sort_order)
SELECT 
  id,
  'Hur bra är du på kommunikation?',
  'scale',
  'communication',
  1,
  5,
  2
FROM public.assessment_form_definitions WHERE assessment_type = 'skills';

INSERT INTO public.assessment_questions (form_definition_id, question_text, question_type, question_key, min_value, max_value, sort_order)
SELECT 
  id,
  'Hur utvecklade är dina ledarskapsförmågor?',
  'scale',
  'leadership',
  1,
  5,
  3
FROM public.assessment_form_definitions WHERE assessment_type = 'skills';

INSERT INTO public.assessment_questions (form_definition_id, question_text, question_type, question_key, min_value, max_value, sort_order)
SELECT 
  id,
  'Hur kreativ känner du dig?',
  'scale',
  'creativity',
  1,
  5,
  4
FROM public.assessment_form_definitions WHERE assessment_type = 'skills';

INSERT INTO public.assessment_questions (form_definition_id, question_text, question_type, question_key, min_value, max_value, sort_order)
SELECT 
  id,
  'Hur snabbt lär du dig nya saker?',
  'scale',
  'learning_ability',
  1,
  5,
  5
FROM public.assessment_form_definitions WHERE assessment_type = 'skills';