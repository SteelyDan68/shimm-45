-- Update Brand pillar prompt template
UPDATE pillar_definitions 
SET ai_prompt_template = 'Analysera klientens varumärke baserat på följande assessment data:

{assessment_data}

Analysera särskilt:
- VARUMÄRKETS TYDLIGHET: Hur igenkännbart och tydligt är deras personliga varumärke?
- PLATTFORMSKOMMUNIKATION: Hur väl signalerar de rätt budskap på sina kanaler?
- BUDSKAPSEFFEKTIVITET: Hur väl når de fram med det de vill kommunicera?
- TROVÄRDIGHET: Hur stark är deras credibility och autenticitet?
- VARUMÄRKESAMBITION: Hur vill de att deras varumärke ska uppfattas?

Ge en snabb reflektion om varumärkets tydlighet, samt 2–3 råd för att stärka det. Håll en strategisk och positiv ton.'
WHERE pillar_key = 'brand';