-- Byta från Five Pillars till Six Pillars i hela systemet

-- 1. Kommentera i pillar_definitions tabellen - uppdatera beskrivningar
UPDATE pillar_definitions 
SET description = REPLACE(description, 'Five Pillars', 'Six Pillars')
WHERE description LIKE '%Five Pillars%';

UPDATE pillar_definitions 
SET description = REPLACE(description, 'five pillars', 'six pillars')  
WHERE description LIKE '%five pillars%';

UPDATE pillar_definitions 
SET ai_prompt_template = REPLACE(ai_prompt_template, 'Five Pillars', 'Six Pillars')
WHERE ai_prompt_template LIKE '%Five Pillars%';

UPDATE pillar_definitions 
SET ai_prompt_template = REPLACE(ai_prompt_template, 'five pillars', 'six pillars')
WHERE ai_prompt_template LIKE '%five pillars%';

-- 2. Uppdatera eventuella kommentarer eller beskrivningar i andra tabeller
UPDATE assessment_form_definitions 
SET description = REPLACE(description, 'Five Pillars', 'Six Pillars')
WHERE description LIKE '%Five Pillars%';

UPDATE assessment_form_definitions 
SET description = REPLACE(description, 'five pillars', 'six pillars')
WHERE description LIKE '%five pillars%';

UPDATE assessment_form_definitions 
SET ai_prompt_template = REPLACE(ai_prompt_template, 'Five Pillars', 'Six Pillars')
WHERE ai_prompt_template LIKE '%Five Pillars%';

UPDATE assessment_form_definitions 
SET ai_prompt_template = REPLACE(ai_prompt_template, 'five pillars', 'six pillars')
WHERE ai_prompt_template LIKE '%five pillars%';

-- 3. Uppdatera assessment_questions
UPDATE assessment_questions 
SET question_text = REPLACE(question_text, 'Five Pillars', 'Six Pillars')
WHERE question_text LIKE '%Five Pillars%';

UPDATE assessment_questions 
SET question_text = REPLACE(question_text, 'five pillars', 'six pillars')
WHERE question_text LIKE '%five pillars%';

-- 4. Uppdatera befintliga AI-analyser i pillar_assessments
UPDATE pillar_assessments 
SET ai_analysis = REPLACE(ai_analysis, 'Five Pillars', 'Six Pillars')
WHERE ai_analysis LIKE '%Five Pillars%';

UPDATE pillar_assessments 
SET ai_analysis = REPLACE(ai_analysis, 'five pillars', 'six pillars')
WHERE ai_analysis LIKE '%five pillars%';

-- 5. Uppdatera assessment_rounds
UPDATE assessment_rounds 
SET ai_analysis = REPLACE(ai_analysis, 'Five Pillars', 'Six Pillars')
WHERE ai_analysis LIKE '%Five Pillars%';

UPDATE assessment_rounds 
SET ai_analysis = REPLACE(ai_analysis, 'five pillars', 'six pillars')
WHERE ai_analysis LIKE '%five pillars%';

UPDATE assessment_rounds 
SET comments = REPLACE(comments, 'Five Pillars', 'Six Pillars')
WHERE comments LIKE '%Five Pillars%';

UPDATE assessment_rounds 
SET comments = REPLACE(comments, 'five pillars', 'six pillars')
WHERE comments LIKE '%five pillars%';

-- 6. Uppdatera calendar_events beskrivningar
UPDATE calendar_events 
SET description = REPLACE(description, 'Five Pillars', 'Six Pillars')
WHERE description LIKE '%Five Pillars%';

UPDATE calendar_events 
SET description = REPLACE(description, 'five pillars', 'six pillars')
WHERE description LIKE '%five pillars%';

UPDATE calendar_events 
SET title = REPLACE(title, 'Five Pillars', 'Six Pillars')
WHERE title LIKE '%Five Pillars%';

UPDATE calendar_events 
SET title = REPLACE(title, 'five pillars', 'six pillars')
WHERE title LIKE '%five pillars%';

-- 7. Uppdatera tasks 
UPDATE tasks 
SET title = REPLACE(title, 'Five Pillars', 'Six Pillars')
WHERE title LIKE '%Five Pillars%';

UPDATE tasks 
SET title = REPLACE(title, 'five pillars', 'six pillars')
WHERE title LIKE '%five pillars%';

UPDATE tasks 
SET description = REPLACE(description, 'Five Pillars', 'Six Pillars')
WHERE description LIKE '%Five Pillars%';

UPDATE tasks 
SET description = REPLACE(description, 'five pillars', 'six pillars')
WHERE description LIKE '%five pillars%';

-- 8. Uppdatera path_entries
UPDATE path_entries 
SET title = REPLACE(title, 'Five Pillars', 'Six Pillars')
WHERE title LIKE '%Five Pillars%';

UPDATE path_entries 
SET title = REPLACE(title, 'five pillars', 'six pillars')
WHERE title LIKE '%five pillars%';

UPDATE path_entries 
SET content = REPLACE(content, 'Five Pillars', 'Six Pillars')
WHERE content LIKE '%Five Pillars%';

UPDATE path_entries 
SET content = REPLACE(content, 'five pillars', 'six pillars')
WHERE content LIKE '%five pillars%';

UPDATE path_entries 
SET details = REPLACE(details, 'Five Pillars', 'Six Pillars')
WHERE details LIKE '%Five Pillars%';

UPDATE path_entries 
SET details = REPLACE(details, 'five pillars', 'six pillars')
WHERE details LIKE '%five pillars%';

-- 9. Uppdatera messages
UPDATE messages 
SET subject = REPLACE(subject, 'Five Pillars', 'Six Pillars')
WHERE subject LIKE '%Five Pillars%';

UPDATE messages 
SET subject = REPLACE(subject, 'five pillars', 'six pillars')
WHERE subject LIKE '%five pillars%';

UPDATE messages 
SET content = REPLACE(content, 'Five Pillars', 'Six Pillars')
WHERE content LIKE '%Five Pillars%';

UPDATE messages 
SET content = REPLACE(content, 'five pillars', 'six pillars')
WHERE content LIKE '%five pillars%';

-- 10. Uppdatera stefan_interactions
UPDATE stefan_interactions 
SET message_content = REPLACE(message_content, 'Five Pillars', 'Six Pillars')
WHERE message_content LIKE '%Five Pillars%';

UPDATE stefan_interactions 
SET message_content = REPLACE(message_content, 'five pillars', 'six pillars')
WHERE message_content LIKE '%five pillars%';

UPDATE stefan_interactions 
SET user_response = REPLACE(user_response, 'Five Pillars', 'Six Pillars')
WHERE user_response LIKE '%Five Pillars%';

UPDATE stefan_interactions 
SET user_response = REPLACE(user_response, 'five pillars', 'six pillars')
WHERE user_response LIKE '%five pillars%';

UPDATE stefan_interactions 
SET ai_analysis = REPLACE(ai_analysis, 'Five Pillars', 'Six Pillars')
WHERE ai_analysis LIKE '%Five Pillars%';

UPDATE stefan_interactions 
SET ai_analysis = REPLACE(ai_analysis, 'five pillars', 'six pillars')
WHERE ai_analysis LIKE '%five pillars%';

-- 11. Uppdatera stefan_memory
UPDATE stefan_memory 
SET content = REPLACE(content, 'Five Pillars', 'Six Pillars')
WHERE content LIKE '%Five Pillars%';

UPDATE stefan_memory 
SET content = REPLACE(content, 'five pillars', 'six pillars')
WHERE content LIKE '%five pillars%';

-- Kommentar: Alla databas-fält som innehåller "Five Pillars" eller "five pillars" har uppdaterats till "Six Pillars" / "six pillars"