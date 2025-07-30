# Hjälpsystem - Utvecklarguide

## Översikt
Alla nya komponenter och funktioner MÅSTE inkludera hjälptooltips för att säkerställa en konsistent användarupplevelse.

## Snabbstart

### 1. Importera komponenter
```tsx
import { HelpTooltip } from '@/components/HelpTooltip';
import { helpTexts } from '@/data/helpTexts';
```

### 2. Lägg till hjälptext i helpTexts.ts
```typescript
// Lägg till i rätt kategori i src/data/helpTexts.ts
export const helpTexts = {
  dittOmråde: {
    dinFunktion: "Beskrivning av vad denna funktion gör..."
  }
}
```

### 3. Använd HelpTooltip-komponenten
```tsx
<div className="flex items-center gap-2">
  <Label>Ditt fält</Label>
  <HelpTooltip content={helpTexts.dittOmråde.dinFunktion} />
</div>
```

## Obligatoriska platser för hjälptooltips

### ✅ Form-fält
- Alla input-fält
- Select-dropdowns  
- Checkboxes och radio buttons
- Textareas

### ✅ Knappar och actions
- Primära action-knappar
- Destructive actions (radera, avbryt)
- AI-genererade funktioner

### ✅ Status-indikatorer
- Badges med status
- Progress bars
- Score-värden
- Trender

### ✅ Navigering
- Menyalternativ
- Tabs
- Breadcrumbs

### ✅ Data-visning
- Tabellrubriker
- Chart-axlar
- Metrics

## Design-riktlinjer

### Placering
- Till höger om labels
- Efter viktiga värden/siffror
- I card-headers för komplexa komponenter

### Content
- Skriv på svenska
- Håll det kort (max 2 meningar)
- Förklara vad, inte hur
- Inkludera enheter/skalor om relevant

### Visuell stil
- Använd standard Info-ikonen
- Färg: `text-muted-foreground hover:text-foreground`
- Storlek: `h-3 w-3` för kompakta områden, `h-4 w-4` för större

## Templates för vanliga patterns

### Form-fält
```tsx
<div className="space-y-2">
  <div className="flex items-center gap-2">
    <Label htmlFor="field">Fältnamn</Label>
    <HelpTooltip content={helpTexts.category.field} />
  </div>
  <Input id="field" />
</div>
```

### Status Badge
```tsx
<div className="flex items-center gap-1">
  <Badge variant="outline">{status}</Badge>
  <HelpTooltip content={helpTexts.category.status} />
</div>
```

### Card Header
```tsx
<CardHeader>
  <div className="flex items-center justify-between">
    <CardTitle className="flex items-center gap-2">
      Titel
      <HelpTooltip content={helpTexts.category.cardTitle} />
    </CardTitle>
  </div>
</CardHeader>
```

## Checklist för nya komponenter

- [ ] Hjälptext tillagd i `helpTexts.ts`
- [ ] `HelpTooltip` importerad
- [ ] Tooltip placerad vid alla viktiga element
- [ ] Testad med hover/focus
- [ ] Content är på svenska och tydlig
- [ ] Följer design-riktlinjerna

## Vanliga misstag att undvika

❌ Glöm inte att lägga till i helpTexts.ts först
❌ Använd inte inline-text istället för centraliserad text
❌ Placera inte tooltips på dynamiska element
❌ Skriv inte för långa förklaringar
❌ Glöm inte mobile-kompatibilitet (touch-enheter)

## Underhåll

### Uppdatera befintlig hjälptext
1. Hitta rätt kategori i `helpTexts.ts`
2. Uppdatera texten
3. Texten uppdateras automatiskt överallt

### Lägga till nya kategorier
1. Lägg till ny sektion i `helpTexts.ts`
2. Följ befintlig naming convention
3. Använd beskrivande nycklar

## Integration med AI/dynamiskt innehåll

För AI-genererat innehåll:
```tsx
{item.ai_generated && (
  <div className="flex items-center gap-1">
    <Badge variant="secondary">
      <Brain className="h-3 w-3 mr-1" />
      AI
    </Badge>
    <HelpTooltip content={helpTexts.ai.generated} />
  </div>
)}
```