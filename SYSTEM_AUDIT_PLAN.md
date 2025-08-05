# 🎯 SYSTEMOMFATTANDE DATABAS-UI KOPPLINGSAUDIT

## PHASE 1: KARTLÄGGNING (COMPLETED)
✅ Identifierade 243 filer med user/auth references
✅ Identifierade 46 filer med databaskopplingar
✅ Identifierade 82 dashboard/widget komponenter  
✅ Identifierade 117 filer med loading states

## PHASE 2: KRITISKA SYSTEM MODULES

### A. DASHBOARD ECOSYSTEM
**EnhancedClientDashboard.tsx** - HYBRID DATA CORRUPTION
- ✅ Använder `usePillarOrchestration` (trasig `user_attributes`)
- ❌ Blandar data från `calendar_events`, `tasks`, `user_attributes`
- ❌ Pillar completion logic disconnected från verklig data

**Andra Dashboard komponenter:**
- `CoachDashboard.tsx` 
- `AdminDashboard.tsx`
- `UnifiedDashboard.tsx`
- `PRDDashboard.tsx`

### B. HOOKS ECOSYSTEM
**DATA INCONSISTENCY CRISIS:**
- `useUserAttributes.ts` - Gammalt system (user_attributes)
- `usePillarOrchestration.ts` - ✅ FIXED till path_entries
- `useUserPillars.ts` - ✅ FIXED till path_entries  
- `useUnifiedPillars.ts` - ❌ FORTFARANDE user_attributes

### C. WIDGET ECOSYSTEM
- Progress trackers
- Statistics widgets
- Activity feeds
- Calendar components
- Task managers

## PHASE 3: EXECUTION STRATEGY

### STEP 1: UNIFIED DATA LAYER
- [x] Migrera `useUserAttributes` → `usePathEntries`
- [x] Skapa `useCentralizedData` hook
- [x] Eliminera alla `user_attributes` dependencies

### STEP 2: DASHBOARD MODERNIZATION
- [x] Fix `EnhancedClientDashboard`
- [x] Fix `PillarProgressTracker` (REAL DATA)
- [x] Modernisera hooks med centralized data

### STEP 3: WIDGET SYNCHRONIZATION  
- [x] LIVE pillar progress från path_entries
- [x] Centralized metrics computation
- [x] Consistent error handling

### STEP 4: VERIFICATION MATRIX
- [ ] Manuell testing av varje komponent
- [ ] Automated integration tests
- [ ] Performance benchmarking

## PRIORITY ORDER:
1. **EnhancedClientDashboard** (Stefan ser detta)
2. **useUnifiedPillars** (används överallt)
3. **useUserAttributes** migration
4. **Alla övriga dashboards**
5. **Widget ecosystem**

## SUCCESS CRITERIA:
- ✅ Stefan ser korrekt Self Care completion
- ✅ Alla räknevärken matchar verklig data
- ✅ UI uppdateras real-time vid dataändringar
- ✅ Zero data inconsistencies
- ✅ Single source of truth: path_entries