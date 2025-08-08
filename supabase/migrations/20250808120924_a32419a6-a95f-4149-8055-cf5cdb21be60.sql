-- Update the open_track assessment template to match the actual questions in OpenTrackAssessmentForm
UPDATE assessment_templates 
SET questions = '[
  {
    "id": "life_vision",
    "text": "Om du kunde leva ditt drömmliv om 5 år, hur skulle det se ut?",
    "type": "text",
    "weight": 0.3,
    "category": "vision"
  },
  {
    "id": "passion_discovery", 
    "text": "Vad får dig att tappa tidskänslan? När känner du dig mest levande?",
    "type": "text",
    "weight": 0.3,
    "category": "vision"
  },
  {
    "id": "exploration_areas",
    "text": "Vilka områden lockar dig mest att utforska?", 
    "type": "checkboxes",
    "weight": 0.15,
    "category": "exploration",
    "options": [
      "Kreativitet & Konstnärligt uttryck",
      "Relationer & Djup kommunikation", 
      "Spiritualitet & Inre utveckling",
      "Livslångt lärande & Intellektuell nyfikenhet",
      "Äventyr & Nya kulturella upplevelser",
      "Syfte & Meningsfullhet",
      "Ledarskap & Påverkan",
      "Innovation & Entreprenörskap",
      "Kroppslig hälsa & Extremsporter",
      "Miljöengagemang & Hållbarhet"
    ]
  },
  {
    "id": "curiosity_level",
    "text": "Hur stark är din nyfikenhet att utforska okända områden?",
    "type": "slider",
    "min": 1,
    "max": 10,
    "weight": 0.1,
    "category": "exploration"
  },
  {
    "id": "risk_appetite", 
    "text": "Hur bekväm är du med att ta risker för din utveckling?",
    "type": "slider",
    "min": 1,
    "max": 10,
    "weight": 0.1,
    "category": "capacity"
  },
  {
    "id": "commitment_level",
    "text": "Hur dedikerad är du till denna utvecklingsresa?",
    "type": "slider", 
    "min": 1,
    "max": 10,
    "weight": 0.05,
    "category": "planning"
  }
]'::jsonb,
scoring_config = '{
  "max_score": 100,
  "adaptive_scoring": true,
  "qualitative_focus": true,
  "weight_factors": {
    "vision": 0.6,
    "exploration": 0.25,
    "capacity": 0.1,
    "planning": 0.05
  }
}'::jsonb
WHERE pillar_key = 'open_track';