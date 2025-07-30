import { ClientCard } from './ClientCard';
import { ClientLogView } from '@/components/ClientPath/ClientLogView';
import { DashboardFilters } from './DashboardFilters';
import { useCoachDashboard } from '@/hooks/useCoachDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Users } from 'lucide-react';

export function CoachDashboard() {
  const {
    clients,
    loading,
    activeFilter,
    setActiveFilter,
    sortBy,
    setSortBy,
    refreshData,
    totalClients,
    filteredCount
  } = useCoachDashboard();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Filters */}
      <DashboardFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        totalClients={totalClients}
        filteredCount={filteredCount}
        loading={loading}
        onRefresh={refreshData}
      />

      {/* Client Grid */}
      {!loading && filteredCount === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalClients === 0 
                  ? 'Inga klienter behöver uppmärksamhet' 
                  : 'Inga klienter matchar filtret'
                }
              </h3>
              <p className="text-muted-foreground">
                {totalClients === 0 
                  ? 'Alla dina klienter går bra just nu! 🎉'
                  : 'Prova att ändra filter eller sortering för att se andra klienter.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map(client => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {!loading && totalClients > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{totalClients}</div>
                <div className="text-sm text-muted-foreground">Klienter behöver uppmärksamhet</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {clients.filter(c => c.issues.some(i => i.severity === 'high')).length}
                </div>
                <div className="text-sm text-muted-foreground">Hög prioritet</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {clients.filter(c => c.issues.some(i => i.type === 'new_barriers')).length}
                </div>
                <div className="text-sm text-muted-foreground">Nya hinder</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {clients.filter(c => c.issues.some(i => i.type === 'inactive')).length}
                </div>
                <div className="text-sm text-muted-foreground">Inaktiva</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}