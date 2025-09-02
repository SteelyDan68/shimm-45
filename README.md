# Coaching Platform

En omfattande coachingplattform byggd med React, TypeScript och Supabase.

## 🧭 Navigation System

### Centraliserad Navigation

Alla navigationsrelaterade konfigurationer hanteras centralt genom:
- **Config:** `src/config/navigation.ts` - Huvudkonfiguration för alla routes
- **Helpers:** `src/utils/navigationHelpers.ts` - Standardiserade navigationspattern
- **Hook:** `src/hooks/useNavigation.ts` - React hook för navigation

### Lägga till ny meny/route

1. **Lägg till route i navigation.ts:**
```typescript
// I NAVIGATION_ROUTES
NEW_FEATURE: "/new-feature",

// I MAIN_NAVIGATION array
{
  title: "Ny funktion",
  url: NAVIGATION_ROUTES.NEW_FEATURE,
  icon: NewIcon,
  roles: ["admin", "client"],
  description: "Beskrivning av funktionen",
  requiredTables: ["table1", "table2"], // Valfritt
  requiredFunctions: ["function1"], // Valfritt
  betaOnly: false, // Valfritt
  featureFlag: "NEW_FEATURE_FLAG" // Valfritt
}
```

2. **Lägg till pattern i navigationHelpers.ts:**
```typescript
// I NAVIGATION_PATTERNS
NEW_FEATURE: () => NAVIGATION_ROUTES.NEW_FEATURE,
```

3. **Uppdatera useNavigation hook om behövs:**
```typescript
// I goTo objektet
newFeature: () => navigate(NAVIGATION_PATTERNS.NEW_FEATURE()),
```

4. **Lägg till route i App.tsx:**
```typescript
<Route path={NAVIGATION_ROUTES.NEW_FEATURE} element={<NewFeaturePage />} />
```

### Använd navigation i komponenter

```typescript
import { useNavigation } from '@/hooks/useNavigation';

const MyComponent = () => {
  const { goTo } = useNavigation();
  
  return (
    <Button onClick={() => goTo.newFeature()}>
      Gå till ny funktion
    </Button>
  );
};
```

### Navigation Properties

**NavigationItem interface:**
- `title` - Visningsnamn i menyn
- `url` - Route path
- `icon` - Lucide React ikon
- `roles` - Användarroller som kan se länken
- `description` - Beskrivning av funktionen
- `requiredTables` - DB-tabeller som krävs (för validering)
- `requiredFunctions` - Edge functions som krävs (för validering)
- `betaOnly` - Endast för beta-användare
- `featureFlag` - Feature flag för A/B testing
- `exact` - Exakt path matching

### Rollbaserad Filtrering

Navigation filtreras automatiskt baserat på:
- Användarroller (`roles` array)
- Beta-användare (`betaOnly` flag)
- Feature flags (`featureFlag`)

### Best Practices

1. **Använd alltid centraliserad navigation** - Inga hårdkodade `/path` strings i komponenter
2. **Använd `goTo` objektet** - Standardiserade navigationsmönster
3. **Definiera roller korrekt** - Säkerställ att rätt användare ser rätt menyer
4. **Lägg till beskrivningar** - Hjälper med underhåll och dokumentation

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