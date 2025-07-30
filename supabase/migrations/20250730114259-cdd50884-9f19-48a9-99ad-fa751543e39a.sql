-- Update Self Care pillar prompt template
UPDATE pillar_definitions 
SET ai_prompt_template = 'Du analyserar en offentlig person. Bedöm deras hinder och resurser för att må och prestera bra baserat på följande assessment data:

{assessment_data}

Analysera både:
- HINDER: Vad förhindrar dem från att må bra? (stress, sömnbrist, dålig balans etc.)
- RESURSER: Vilka styrkor och möjligheter har de? (bra rutiner, stödsystem etc.)

Ge 2–3 konkreta förslag på hur de kan stärka sitt välmående och balans som offentlig person.'
WHERE pillar_key = 'self_care';