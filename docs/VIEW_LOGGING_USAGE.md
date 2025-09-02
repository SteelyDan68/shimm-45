# View Logging System

System för att logga tomma vyer och 404-händelser till `server_log_events` tabellen.

## Hooks

### `use404Logger`
Loggar automatiskt 404-händelser när NotFound-komponenten renderas.

```tsx
import { use404Logger } from '@/hooks/use404Logger';

const NotFound = () => {
  use404Logger(); // Loggar automatiskt
  return <div>404 - Page not found</div>;
};
```

### `useViewEmptyLogger`
Loggar vyer som förblir tomma för länge.

```tsx
import { useViewEmptyLogger } from '@/hooks/useViewEmptyLogger';

const DataList = ({ data, loading }) => {
  const isEmpty = !loading && (!data || data.length === 0);
  
  useViewEmptyLogger({
    isEmpty,
    componentName: 'DataList',
    timeout: 5000 // 5 sekunder
  });

  if (loading) return <div>Loading...</div>;
  if (isEmpty) return <div>No data found</div>;
  
  return <div>{/* render data */}</div>;
};
```

## Komponenter

### `ViewEmptyTracker`
Wrapper-komponent som kombinerar innehåll med empty view logging.

```tsx
import { ViewEmptyTracker } from '@/components/ViewEmptyTracker';
import { EmptyStateCard } from '@/components/EmptyStateCard';

const MyComponent = ({ data, loading }) => {
  const isEmpty = !loading && (!data || data.length === 0);

  return (
    <ViewEmptyTracker
      isEmpty={isEmpty}
      componentName="MyComponent"
      timeout={3000}
      emptyStateContent={
        <EmptyStateCard 
          title="Ingen data" 
          description="Ladda om sidan för att försöka igen"
        />
      }
    >
      {/* Normal content when not empty */}
      <div>{data?.map(item => <div key={item.id}>{item.name}</div>)}</div>
    </ViewEmptyTracker>
  );
};
```

### `EmptyStateCard`
Konsistent empty state-komponent.

```tsx
import { EmptyStateCard } from '@/components/EmptyStateCard';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

<EmptyStateCard
  title="Inga uppgifter"
  description="Du har inte några uppgifter för tillfället."
  action={
    <Button onClick={createNewTask}>
      <RefreshCw className="h-4 w-4 mr-2" />
      Skapa ny uppgift
    </Button>
  }
/>
```

## Database Schema

```sql
CREATE TABLE public.server_log_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL,
  event TEXT NOT NULL CHECK (event IN ('view_empty','404')),
  path TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Metadata Fields

### För `404` events:
- `timestamp`: ISO timestamp
- `search`: URL search parameters
- `hash`: URL hash
- `referrer`: Previous page URL
- `user_agent`: Browser user agent
- `authenticated`: Boolean om användaren var inloggad

### För `view_empty` events:
- `component`: Komponent namn
- `timeout_ms`: Timeout före loggning
- `timestamp`: ISO timestamp
- `search`: URL search parameters
- `hash`: URL hash
- `user_agent`: Browser user agent

## Övervaka logs

```sql
-- Se senaste 404s
SELECT * FROM server_log_events 
WHERE event = '404' 
ORDER BY created_at DESC 
LIMIT 20;

-- Se tomma vyer
SELECT path, metadata->>'component' as component, COUNT(*) as count
FROM server_log_events 
WHERE event = 'view_empty'
AND created_at > now() - interval '24 hours'
GROUP BY path, metadata->>'component'
ORDER BY count DESC;
```

## Säkerhetsaspekter

- Tabellen har RLS aktiverat
- Anonyma användare kan logga events
- Endast admins kan läsa logs
- User ID kopplas automatiskt när användaren är inloggad