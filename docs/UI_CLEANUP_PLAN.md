# UI Cleanup Plan - Phase 1
**Genererad:** 2025-01-27 | **Target:** Stale/Placeholder Routes  
**Scope:** Ta bort legacy routes och död kod utan funktionalitet

---

## Executive Summary

Baserat på `docs/UI_AUDIT.json` identifierades följande för rensning:
- **1 Stale Route:** `/client/:clientId` (ersatt av unified routing)
- **1 Placeholder Route:** `*` (404) - **BEHÅLLS** (behövs för error handling)

**Säkerhetsanalys:** Legacy route har ingen meny-koppling och all navigation omdirigeras korrekt via `navigateToClient()`.

---

## Filer att Ändra

### 🗑️ REMOVE: Legacy Route Definition
**Fil:** `src/App.tsx`
- **Rad 147:** `<Route path="/client/:clientId" element={<ClientProfile />} />`
- **Rad 37:** `import { ClientProfile } from "./pages/ClientProfile";`
- **Motivering:** Legacy route ersatt av `/user/:userId` unified routing
- **Rollback:** Återställ Route + import för tillfällig bakåtkompatibilitet

### 🗑️ DELETE: Legacy Component
**Fil:** `src/pages/ClientProfile.tsx` (hela filen)
- **Motivering:** Endast använd av legacy route, ingen sharing detected
- **Rollback:** `git checkout HEAD~1 -- src/pages/ClientProfile.tsx`

---

## Säkerhetsanalys - BEHÅLL DESSA

### ✅ Navigation Function (SAFE)
**Fil:** `src/hooks/useNavigation.ts` - `navigateToClient()`
- **Anledning:** Omdirigerar korrekt till unified route `/user/:userId`
- **Fungerar som:** Backward compatibility layer

### ✅ Client-Related Components (ACTIVE)
- `src/pages/ClientDashboard.tsx` → Används av `/client-dashboard` route
- `src/components/ClientList.tsx` → Använder `navigateToClient()` (safe redirect)
- `src/components/UnifiedUserProfile/ClientProfileView.tsx` → Del av unified system

### ✅ Navigation Config (ACTIVE)
- `CLIENT_DASHBOARD` route → Aktiv funktionalitet för client role
- `CLIENT_360` routes → Aktiva admin-verktyg

---

## Shared Component Analysis

| Komponent | Används av | Action |
|-----------|------------|---------|
| `ClientProfile` | **Endast** legacy route `/client/:clientId` | ❌ DELETE |
| `ClientDashboard` | Route `/client-dashboard` + navigation | ✅ KEEP |
| `ClientList` | Route `/users` + admin panels | ✅ KEEP |
| `ClientProfileView` | UnifiedUserProfile system | ✅ KEEP |

---

## Pre-Cleanup Validation

### ✅ Dependency Check
```bash
# Kontrollera att ClientProfile bara används av legacy route
grep -r "ClientProfile" src/ --exclude="*.tsx.backup"
```

### ✅ Navigation Test
```bash  
# Testa att navigateToClient() fortfarande fungerar
# Förväntat: omdirigering till /user/:userId
```

### ✅ Build Test
```bash
npm run build  # Måste passera efter cleanup
npm run dev    # Måste starta utan errors
```

---

## Rollback Instructions

Om problem uppstår efter cleanup:

```bash
# Återställ legacy route temporärt
git checkout HEAD~1 -- src/App.tsx src/pages/ClientProfile.tsx

# Eller manuellt:
# 1. Lägg till i App.tsx rad 37: import { ClientProfile } from "./pages/ClientProfile";
# 2. Lägg till i App.tsx rad 147: <Route path="/client/:clientId" element={<ClientProfile />} />
# 3. Återskapa ClientProfile.tsx från backup
```

---

## Post-Cleanup Verification

### Framgångskriterier
- [ ] `npm run build` → Success
- [ ] `npm run dev` → No console errors  
- [ ] Navigation från ClientList → Redirectar korrekt till `/user/:userId`
- [ ] Inga 404-fel från gamla bookmarks (bör redirecta via `navigateToClient`)
- [ ] Client-dashboard fortfarande tillgänglig på `/client-dashboard`

### Analytics att Övervaka
- 404-requests för `/client/*` patterns
- Eventuell ökad belastning på `/user/:userId` (omdirigerade requests)

---

## Future Phases

**Phase 2:** Granska "unknown" routes (11 st)  
**Phase 3:** Konsolidera liknande funktionalitet  
**Phase 4:** Automatiserad route validation

---

*Denna plan fokuserar på säker borttagning utan funktionalitetsförlust. Unified routing systemet säkerställer att alla användarförd navigering fortfarande fungerar via redirects.*