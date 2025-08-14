# 📚 TERMINOLOGY STANDARDIZATION GUIDE

**Status:** KRITISK IMPLEMENTATION REQUIRED  
**Impact:** User Experience Consistency  
**Target:** Full Swedish UI with English database schema

---

## 🎯 STANDARDIZATION PRINCIPLES

### Core Rule: **UI = Svenska, Database = English**
- **Database keys/schemas:** Behåll engelska för teknisk konsistens
- **User Interface:** Komplett svenska för användarupplevelse  
- **API/Internal:** Engelska för developer experience
- **Documentation:** Svenska för business, engelska för technical

---

## 📝 OFFICIAL TERMINOLOGY MAPPING

### CORE SYSTEM TERMS

| English (Database) | Svenska (UI) | Context |
|-------------------|--------------|---------|
| `self_care` | Självomvårdnad | Pillar name |
| `skills` | Kompetenser | Pillar name |
| `talent` | Talang | Pillar name |
| `brand` | Varumärke | Pillar name |
| `economy` | Ekonomi | Pillar name |
| `open_track` | Öppna Spåret | Pillar name |
| `assessments` | Självskattningar | User-facing forms |
| `evaluation` | Utvärdering | Internal process |
| `analysis` | Analys | AI processing results |
| `insights` | Insikter | AI-generated recommendations |
| `actionables` | Åtgärder | Tasks/todos |
| `coaching_sessions` | Coaching-sessioner | Professional meetings |
| `milestones` | Milstolpar | Progress markers |
| `progress` | Framsteg | Development tracking |

### ROLE TRANSLATIONS

| English | Svenska | Description |
|---------|---------|-------------|
| `client` | Klient | End user |
| `coach` | Coach | Professional guide |
| `admin` | Admin | System administrator |
| `superadmin` | Superadmin | System owner |

### ACTION TRANSLATIONS

| English | Svenska | UI Context |
|---------|---------|------------|
| `retake` | Gör om | Assessment redo |
| `reset` | Återställ | System reset |
| `complete` | Slutför | Finish task |
| `activate` | Aktivera | Enable pillar |
| `deactivate` | Inaktivera | Disable pillar |
| `analyze` | Analysera | AI processing |
| `generate` | Generera | Create content |
| `schedule` | Schemalägg | Calendar booking |

### STATUS TRANSLATIONS  

| English | Svenska | UI Display |
|---------|---------|------------|
| `pending` | Väntande | Awaiting action |
| `in_progress` | Pågående | Currently active |
| `completed` | Slutförd | Finished successfully |
| `cancelled` | Avbruten | Stopped by user |
| `failed` | Misslyckad | Error occurred |
| `active` | Aktiv | Currently enabled |
| `inactive` | Inaktiv | Currently disabled |

---

## 🔧 IMPLEMENTATION STRATEGY

### Step 1: Create Terminology Constants
```typescript
// src/constants/terminology.ts
export const PILLAR_NAMES = {
  self_care: 'Självomvårdnad',
  skills: 'Kompetenser', 
  talent: 'Talang',
  brand: 'Varumärke',
  economy: 'Ekonomi',
  open_track: 'Öppna Spåret'
} as const;

export const UI_TERMS = {
  assessments: 'Självskattningar',
  analysis: 'Analys',
  insights: 'Insikter',
  actionables: 'Åtgärder',
  progress: 'Framsteg'
} as const;

export const ACTION_TERMS = {
  retake: 'Gör om',
  reset: 'Återställ', 
  complete: 'Slutför',
  activate: 'Aktivera'
} as const;
```

### Step 2: Translation Helper Functions
```typescript
// src/utils/translation.ts
export const translatePillar = (key: string): string => {
  return PILLAR_NAMES[key as keyof typeof PILLAR_NAMES] || key;
};

export const translateTerm = (key: string): string => {
  return UI_TERMS[key as keyof typeof UI_TERMS] || key;
};

export const translateAction = (key: string): string => {
  return ACTION_TERMS[key as keyof typeof ACTION_TERMS] || key;
};
```

### Step 3: Component Migration Pattern
```typescript
// BEFORE (Inconsistent)
<h1>Self Care Assessment</h1>
<Button>Complete assessment</Button>

// AFTER (Standardized)  
<h1>{translatePillar('self_care')} {translateTerm('assessments')}</h1>
<Button>{translateAction('complete')} {translateTerm('assessments').toLowerCase()}</Button>

// Result: "Självomvårdnad Självskattningar" + "Slutför självskattningar"
```

---

## 📋 FILES REQUIRING UPDATES

### CRITICAL PRIORITY (172 instances)
```
Files with "Self Care" or "självomvårdnad":
- src/components/AIAnalysis/SimplifiedAIInsights.tsx
- src/components/Admin/OnboardingWorkflow.tsx
- src/components/AdminPillarManagement.tsx
- src/components/Assessment/PillarEducation.tsx
- src/components/Calendar/AIPlanningDialog.tsx
- [+65 more files]
```

### HIGH PRIORITY (834 instances)
```
Files with "assessments" terminology:
- src/components/AI/AIActionablesPipelineStatus.tsx
- src/components/AssessmentEngine/AssessmentManager.tsx
- src/components/ClientJourney/ClientJourneyOrchestrator.tsx
- src/components/CoachDashboard/CoachDashboard.tsx
- [+108 more files]
```

---

## ✅ QUALITY CHECKLIST

### Pre-Migration Verification
- [ ] All database schemas maintain English keys
- [ ] API endpoints keep English parameters  
- [ ] Internal function names remain English
- [ ] Documentation reflects bilingual approach

### Post-Migration Testing
- [ ] All UI text displays in Swedish
- [ ] No English terms visible to end users
- [ ] Database operations still functional
- [ ] API responses maintain structure
- [ ] Role-specific terminology consistent

### Acceptance Criteria
- [ ] Zero English user-facing text in production
- [ ] All pillar names show Swedish translations
- [ ] Action buttons use Swedish verbs
- [ ] Status indicators use Swedish states
- [ ] Help text and tooltips in Swedish

---

## 🚀 ROLLOUT PLAN

### Week 1: Foundation
- Create terminology constants
- Implement translation helpers
- Update core pillar references

### Week 2: Component Migration  
- Update all dashboard components
- Fix assessment terminology
- Standardize action buttons

### Week 3: Testing & Polish
- E2E testing för all user journeys
- UI/UX review för consistency
- Performance validation

### Week 4: Deployment
- Production deployment
- User feedback collection
- Post-deployment monitoring

---

**MÅLET:** Komplett svenska användarupplevelse med teknisk engelska infrastruktur för optimal developer och user experience.

**STATUS:** ⚠️ AWAITING IMPLEMENTATION - Critical för user experience consistency