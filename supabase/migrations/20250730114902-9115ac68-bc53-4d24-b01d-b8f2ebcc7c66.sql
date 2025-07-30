-- Update Talent pillar prompt template
UPDATE pillar_definitions 
SET ai_prompt_template = 'Du analyserar klientens talang och kreativitet baserat på följande assessment data:

{assessment_data}

Analysera särskilt:
- DRIVKRAFT & FOKUS: Hur stark är deras inre motivation och förmåga att fokusera?
- KREATIVITET: Hur väl genererar de nya idéer och innovativa lösningar?
- HANDLINGSKRAFT: Hur snabbt kan de omsätta idéer till konkreta handlingar?
- UNIK RÖST: Hur utvecklad är deras personliga stil och unika uttryck?
- KREATIV TILLÄMPNING: Hur använder de sin kreativitet i praktiken idag?

Identifiera 1–2 starka talangområden och ge 2–3 råd om hur de kan utvecklas ytterligare. Tonen ska vara motiverande och upplyftande.'
WHERE pillar_key = 'talent';