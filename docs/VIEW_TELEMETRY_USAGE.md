# View Telemetry System - Användningsguide

Efter UI-rensningen behöver vi övervaka om vi oavsiktligt brutit någon funktionalitet. Detta system loggar automatiskt:

## 📊 Vad loggas

1. **404-händelser** - Automatiskt när användare träffar NotFound-sidan
2. **Tomma vyer** - Vyer som visar "No data" i över X sekunder

## 🔧 Användning

### Automatisk 404-loggning
```typescript
// Redan implementerat i NotFound.tsx
import { use404Logging } from '@/hooks/useViewLogging';

const NotFound = () => {
  use404Logging(); // Loggar automatiskt
  return <div>404 Content</div>;
};
```

### Loggning av tomma vyer

#### Option 1: ViewTelemetryWrapper (Rekommenderat)
```tsx
import { ViewTelemetryWrapper } from '@/components/logging/ViewTelemetryWrapper';

const MyComponent = () => {
  const { data, loading } = useMyData();
  
  return (
    <ViewTelemetryWrapper 
      hasData={data && data.length > 0} 
      loading={loading}
      viewName="MyComponent"
      thresholdSeconds={10}
    >
      {loading ? (
        <LoadingSpinner />
      ) : data?.length > 0 ? (
        <DataTable data={data} />
      ) : (
        <EmptyState message="No data available" />
      )}
    </ViewTelemetryWrapper>
  );
};
```

#### Option 2: Hook direkt
```tsx
import { useEmptyViewLogging } from '@/hooks/useViewLogging';

const MyComponent = () => {
  const { data, loading } = useMyData();
  
  // Loggar om hasData=false och loading=false i 10+ sekunder
  useEmptyViewLogging(
    data && data.length > 0, // hasData
    loading,                  // loading
    10                       // threshold seconds
  );
  
  return <div>Component content</div>;
};
```

#### Option 3: HOC för befintliga komponenter
```tsx
import { withEmptyStateLogging } from '@/components/EmptyStateLogger';

interface MyComponentProps {
  data: any[];
  loading: boolean;
}

const MyComponent = ({ data, loading }: MyComponentProps) => (
  <div>Component content</div>
);

export default withEmptyStateLogging(MyComponent, (props) => ({
  hasData: props.data && props.data.length > 0,
  loading: props.loading,
  thresholdSeconds: 10
}));
```

## 📋 Prioriterade komponenter att övervaka

Baserat på dead code-analysen, fokusera på dessa kritiska vyer:

### Högt prioritet (Kritiska funktioner)
- **Assessment views** - `/my-assessments`, assessment flows
- **Task management** - `/tasks`, actionables 
- **Client 360** - `/client-360`, user profiles
- **Analytics** - `/user-analytics`, dashboard metrics
- **Admin** - `/administration`, user management

### Exempel implementation:
```tsx
// I UserAnalytics.tsx
const UserAnalytics = () => {
  const { analytics, loading } = useUserAnalytics();
  
  return (
    <ViewTelemetryWrapper 
      hasData={analytics && Object.keys(analytics).length > 0}
      loading={loading}
      viewName="UserAnalytics"
      thresholdSeconds={15} // Längre threshold för komplexa data
    >
      <AnalyticsContent analytics={analytics} loading={loading} />
    </ViewTelemetryWrapper>
  );
};
```

## 🔍 Övervaka loggar

Loggar sparas i `server_log_events` tabellen:

```sql
-- Se senaste 404-händelser
SELECT path, COUNT(*) as count, MAX(created_at) as latest
FROM server_log_events 
WHERE event = '404'
GROUP BY path 
ORDER BY count DESC;

-- Se tomma vyer som loggas ofta
SELECT path, COUNT(*) as count, 
       AVG((metadata->>'threshold_seconds')::numeric) as avg_threshold
FROM server_log_events 
WHERE event = 'view_empty'
GROUP BY path 
ORDER BY count DESC;
```

## ⚠️ Viktiga noteringar

1. **Deduplicering** - Samma event+path loggas bara en gång per session
2. **Threshold** - Standard 10 sekunder, justera efter komplexitet
3. **Performance** - Använd sparsamt på kritiska renderingspaths
4. **Privacy** - User ID loggas bara om användaren är inloggad

## 🚀 Nästa steg

1. Implementera wrappers på kritiska komponenter
2. Övervaka loggar första veckorna efter deployment
3. Justera thresholds baserat på verklig data
4. Skapa alerts för kritiska rutt-problem