# Lovable AI Prompt Template System

Detta system använder en standardiserad prompt-template för all AI-rådgivning i Lovable-plattformen.

## Template-struktur

```
Klienten du analyserar är en offentlig person med följande profil:

- Primär roll: {primär_roll}
- Sekundär roll: {sekundär_roll}  
- Nisch: {nisch}
- Kreativa styrkor: {styrkor}
- Upplevda svagheter: {svagheter}
- Aktiva plattformar: {plattformar}
- Ålder: {ålder}
- Särskilda behov: {behov}
- Ort: {ort}
- Pågående livsförändringar: {förändringar}

Utifrån detta ska du tolka följande självskattning:

{client_self_assessment_data}

Gör:
1. En reflektion över vad som framstår som mest akut
2. Identifiera mönster
3. Skapa ett åtgärdsförslag i 2–3 konkreta steg
4. Använd en varm, professionell och personlig ton
```

## Implementering

Templaten implementeras via funktionen `buildLovableAIPrompt()` som:
1. Hämtar klientens onboarding-data från `profile_metadata`
2. Fyller i alla placeholder-värden automatiskt
3. Kombinerar med specifik assessment-data
4. Returnerar en komplett prompt för AI-analys

## Användning

- **Självskattning**: Analyserar hinder och ger personliga råd
- **Strategisk rådgivning**: Performance-analys med kontextuella rekommendationer
- **Framtida AI-funktioner**: Enkel integration av ny funktionalitet

## Fördelar

✅ **Konsistens**: Alla AI-svar följer samma struktur och kvalitet
✅ **Personalisering**: Varje råd anpassas till klientens unika situation  
✅ **Skalbarhet**: Enkelt att lägga till nya AI-funktioner
✅ **Underhållsbarhet**: Central template för alla AI-interaktioner