# GDPR-säkerhetsrekommendationer för SHIMM

## Tekniska säkerhetsåtgärder som behöver implementeras

### 1. Databehandlingsgrund (Lawful basis)
- **Samtycke**: Cookie-popup implementerad ✓
- **Avtalsuppfyllelse**: För klienttjänster 
- **Berättigat intresse**: För säkerhetsloggar
- **Dokumentation**: Varför varje datatyp samlas in

### 2. Teknisk implementation

#### Obligatoriska funktioner:
```typescript
// Datatransparens
- Visa all lagrad data per användare
- Dataportabilitet (export i maskinläsbart format)
- Rättighetscenter för användare

// Datasäkerhet  
- Kryptering i vila och transport (redan implementerat via Supabase)
- Säkra autentiseringsflöden (implementerat)
- Sessionshantering med timeout
- Lösenordspolicy och 2FA

// Dataminimering
- Automatisk datarensning efter X månader
- Minimera insamling av PII
- Pseudonymisering av analytisk data
```

#### Databas-förbättringar:
```sql
-- Lägg till GDPR-spårning i alla tabeller
ALTER TABLE profiles ADD COLUMN consent_timestamp TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN data_retention_until TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN deletion_requested_at TIMESTAMPTZ;

-- Skapa GDPR-logg
CREATE TABLE gdpr_audit_log (
  id UUID PRIMARY KEY,
  user_id UUID,
  action TEXT, -- 'export', 'delete', 'modify'
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  details JSONB
);
```

### 3. Juridiska dokument som behövs

#### Integritetspolicy - Must have:
- Vilken data som samlas
- Varför den samlas  
- Hur länge den lagras
- Med vem den delas
- Användarens rättigheter
- Kontaktuppgifter till DPO

#### Användaravtal - Must have:
- Tydliga villkor för tjänsten
- Databehandlingsvillkor
- Uppsägningsmöjligheter

### 4. Processer och rutiner

#### Databehandling:
- **Dataskyddsombud (DPO)**: Inte obligatoriskt för er storlek, men rekommenderat
- **Konsekvensbedömning**: För AI-analys av känslig data
- **Incidenthantering**: Rutiner för dataintrång (72h rapportering)

#### Användarrättigheter:
```typescript
// Implementera dessa funktioner:
- Få tillgång till sin data (Subject Access Request)
- Rätta felaktig data  
- Radera data (Right to be forgotten)
- Begränsa behandling
- Dataportabilitet
- Invända mot behandling
```

### 5. Tekniska förbättringar prioriterat

#### Hög prioritet (implementera nu):
1. **Utökad cookie-popup** ✓ (implementerad)
2. **Dataexport-funktion** (påbörjad)
3. **Samtyckes-databas** med tidsstämplar
4. **Datarensningsrutiner** (automatiska)

#### Medel prioritet (inom 3 månader):
1. **Komplett integritetspolicy**
2. **Användarrättigheter-center**
3. **GDPR-granskningslogg**
4. **Incident response-process**

#### Låg prioritet (inom 6 månader):
1. **Pseudonymisering av analytics**
2. **Utökad kryptering av känslig data**
3. **Automatiserad compliance-övervakning**

### 6. Risker att hantera

#### Högsta risk:
- **AI-analys av känslig hälsodata** → Kräver särskilt samtycke
- **Automatisk datainsamling** → Måste vara transparent
- **Tredjepartsintegrationer** → Databehandlaravtal krävs

#### Låg risk:
- Supabase är EU-baserat och GDPR-kompatibelt
- Grundläggande säkerhet redan på plats

### 7. Kostnad vs Nytta-analys

#### Måste implementeras (juridiskt krav):
- Integritetspolicy: ~2-5k SEK (juridisk hjälp)
- Datatransparens-funktioner: ~20-40h utveckling
- Incident response: ~10-20h planering

#### Rekommenderat men inte obligatoriskt:
- DPO: ~30-50k SEK/år
- Utökad kryptering: ~40-80h utveckling
- Compliance-verktyg: ~10-20k SEK/år

## Slutsats
Systemet har redan bra grundsäkerhet tack vare Supabase. De kritiska sakerna att lägga till är:
1. Komplett integritetspolicy 
2. Dataexport/radering-funktioner
3. Transparent samtyckes-hantering
4. Dokumentation av databehandling

**Rekommendation**: Börja med juridiska dokumenten och grundläggande användarrättigheter innan ni lanshar offentligt.