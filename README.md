# Coaching Platform

En omfattande coachingplattform byggd med React, TypeScript och Supabase.

## 🤖 AI FALLBACK SYSTEM IMPLEMENTERAT

**KRITISKT**: Systemet har nu OpenAI som primär AI-tjänst med Gemini som automatisk fallback.

### AI Services Status:
- ✅ **AIService** centraliserad service skapad (`supabase/functions/_shared/ai-service.ts`)
- ✅ **Analyze Assessment** - AI fallback implementerad
- ✅ **Analyze Dynamic Assessment** - AI fallback implementerad  
- ✅ **Analyze Pillar Assessment** - AI fallback implementerad
- ✅ **Analyze Pillar Module** - AI fallback implementerad
- ⚠️ **AI Message Assistant** - Påbörjad uppdatering
- ⚠️ **Client Logic** - Påbörjad uppdatering
- ⚠️ **Data Collector** - Behöver uppdateras
- ⚠️ **Generate AI Planning** - Behöver uppdateras

### Behöver Gemini API-nyckel:
För att aktivera fullständig fallback-funktionalitet behöver Gemini API-nyckeln läggas till i Supabase secrets.

## 🆘 Hjälpsystem för utvecklare

**KRITISKT**: Alla nya komponenter MÅSTE inkludera hjälptooltips enligt standardprocessen.

### Snabbstart för nya komponenter:
1. Läs `docs/help-system-guide.md` för fullständig guide  
2. Använd `docs/component-template.tsx` som utgångspunkt
3. Lägg till hjälptexter i `src/data/helpTexts.ts`
4. Använd `src/utils/helpSystem.ts` för enkla wrappers

### Obligatorisk checklist:
- [ ] Hjälptexter tillagda i `helpTexts.ts`
- [ ] `HelpTooltip` används vid alla viktiga element  
- [ ] Komponenten följer design-riktlinjerna
- [ ] Hjälptexterna är på svenska och tydliga

## Project info