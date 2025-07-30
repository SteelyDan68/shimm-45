-- Update Economy pillar prompt template
UPDATE pillar_definitions 
SET ai_prompt_template = 'Analysera klientens ekonomiska förutsättningar baserat på följande assessment data:

{assessment_data}

Analysera särskilt:
- EKONOMISK TRYGGHET: Hur säker känner de sig i sin nuvarande ekonomiska situation?
- INTÄKTSKÄLLOR: Hur tydliga och stabila är deras inkomstkällor från arbetet?
- INTÄKTSMÖJLIGHETER: Hur väl ser de nya sätt att monetisera sitt varumärke?
- KOSTNADSKONTROLL: Hur bra har de koll på sina utgifter och ekonomi?
- EKONOMISKA AMBITIONER: Vad skulle öka deras ekonomiska trygghet och intäkter?

Identifiera 1–2 intäktsmöjligheter och ge 2–3 konkreta steg för att förbättra deras ekonomi. Tonen ska vara realistisk men inspirerande.'
WHERE pillar_key = 'economy';