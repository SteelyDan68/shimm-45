-- Update Skills pillar prompt template and questions
UPDATE pillar_definitions 
SET ai_prompt_template = 'Du analyserar klientens färdighetsnivå inom {nisch}. Bedöm deras nuvarande nivå baserat på följande assessment data:

{assessment_data}

Analysera särskilt:
- TRÄNINGSREGELBUNDENHET: Hur konsekvent tränar de på sina färdigheter?
- FEEDBACK-KVALITET: Får de rätt typ av återkoppling för utveckling?
- TEKNISK UTVECKLING: Hur prioriterar de att förbättra sina tekniska färdigheter?
- UTVECKLINGSKÄNSLA: Upplever de framsteg i sin kompetensutveckling?

Bedöm deras nuvarande nivå och föreslå 2–3 konkreta steg för att förbättra deras skills. Håll tonen pedagogisk och inspirerande.'
WHERE pillar_key = 'skills';