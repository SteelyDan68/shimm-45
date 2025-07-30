import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PathEntry } from './PathEntry';
import { PathFilters } from './PathFilters';
import { AddPathEntry } from './AddPathEntry';
import { useClientPath } from '@/hooks/useClientPath';
import { Clock, AlertCircle } from 'lucide-react';

interface PathTimelineProps {
  clientId: string;
  clientName?: string;
  readonly?: boolean;
}

export function PathTimeline({ clientId, clientName, readonly = false }: PathTimelineProps) {
  const { 
    entries, 
    loading, 
    filters, 
    setFilters, 
    createEntry, 
    updateEntry, 
    deleteEntry 
  } = useClientPath(clientId);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div>Laddar timeline...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5" />
              <CardTitle>
                Klientresa{clientName ? ` - ${clientName}` : ''}
              </CardTitle>
            </div>
            {!readonly && (
              <AddPathEntry clientId={clientId} onAdd={createEntry} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <PathFilters 
            filters={filters} 
            onFiltersChange={setFilters}
            entryCount={entries.length}
          />
        </CardContent>
      </Card>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ingen timeline än</h3>
              <p className="text-muted-foreground">
                {readonly 
                  ? 'Inga poster har lagts till för denna klient än.'
                  : 'Börja dokumentera klientens resa genom att lägga till en post.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-0">
              {entries.map((entry, index) => (
                <div key={entry.id} className={index === entries.length - 1 ? '' : ''}>
                  <PathEntry
                    entry={entry}
                    onUpdate={readonly ? async () => false : updateEntry}
                    onDelete={readonly ? async () => false : deleteEntry}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}