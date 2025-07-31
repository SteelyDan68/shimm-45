import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Globe, 
  Mail,
  Phone,
  MapPin,
  Search,
  Filter
} from 'lucide-react';
import { OrganizationForm } from './OrganizationForm';
import { OrganizationProfile } from './OrganizationProfile';
import { useOrganizations } from '@/hooks/useOrganizations';
import type { Organization } from '@/types/organizations';

export function OrganizationManager() {
  const { 
    organizations, 
    loading, 
    filters, 
    setFilters, 
    stats, 
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getOrganizationMembers
  } = useOrganizations();

  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateOrganization = async (data: Partial<Organization>) => {
    setIsSubmitting(true);
    const result = await createOrganization(data);
    if (result) {
      setIsFormDialogOpen(false);
      setEditingOrganization(null);
    }
    setIsSubmitting(false);
  };

  const handleUpdateOrganization = async (data: Partial<Organization>) => {
    if (!editingOrganization) return;
    
    setIsSubmitting(true);
    const result = await updateOrganization(editingOrganization.id, data);
    if (result) {
      setIsFormDialogOpen(false);
      setEditingOrganization(null);
    }
    setIsSubmitting(false);
  };

  const handleDeleteOrganization = async (organization: Organization) => {
    if (!window.confirm(`Är du säker på att du vill ta bort "${organization.name}"? Detta kan inte ångras.`)) {
      return;
    }
    
    await deleteOrganization(organization.id);
  };

  const openCreateDialog = () => {
    setEditingOrganization(null);
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (organization: Organization) => {
    setEditingOrganization(organization);
    setIsFormDialogOpen(true);
  };

  const openProfileDialog = (organization: Organization) => {
    setSelectedOrganization(organization);
    setIsProfileDialogOpen(true);
  };

  const getStatusColor = (status: Organization['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'prospect': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: Organization['status']) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'inactive': return 'Inaktiv';
      case 'prospect': return 'Prospekt';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Laddar organisationer...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Organisationshantering</h2>
          <p className="text-muted-foreground">Hantera organisationer som en komplett kunddatabas</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Ny organisation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Totalt</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Aktiva</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Prospekt</p>
                <p className="text-2xl font-bold">{stats.prospects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gray-500" />
              <div>
                <p className="text-sm text-muted-foreground">Inaktiva</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök organisationer..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <Select 
              value={filters.status} 
              onValueChange={(value: any) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla status</SelectItem>
                <SelectItem value="active">Aktiva</SelectItem>
                <SelectItem value="inactive">Inaktiva</SelectItem>
                <SelectItem value="prospect">Prospekt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Organizations List */}
      <div className="grid gap-4">
        {organizations.map((organization) => {
          const memberCount = getOrganizationMembers(organization.id).length;
          
          return (
            <Card key={organization.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 
                        className="text-lg font-semibold cursor-pointer hover:text-primary"
                        onClick={() => openProfileDialog(organization)}
                      >
                        {organization.name}
                      </h3>
                      <Badge className={getStatusColor(organization.status)}>
                        {getStatusLabel(organization.status)}
                      </Badge>
                      {organization.settings?.industry && (
                        <Badge variant="outline">
                          {organization.settings.industry}
                        </Badge>
                      )}
                    </div>

                    {organization.description && (
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {organization.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {organization.contact_email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {organization.contact_email}
                        </div>
                      )}
                      {organization.contact_phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {organization.contact_phone}
                        </div>
                      )}
                      {organization.website && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <a href={organization.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                            Webbsida
                          </a>
                        </div>
                      )}
                      {organization.address?.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {organization.address.city}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {memberCount} medlemmar
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openProfileDialog(organization)}
                    >
                      Visa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(organization)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteOrganization(organization)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {organizations.length === 0 && (
          <Card>
            <CardContent className="text-center py-10">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inga organisationer</h3>
              <p className="text-muted-foreground mb-4">
                Börja genom att skapa din första organisation
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Skapa organisation
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOrganization ? 'Redigera organisation' : 'Skapa ny organisation'}
            </DialogTitle>
          </DialogHeader>
          <OrganizationForm
            organization={editingOrganization || undefined}
            onSubmit={editingOrganization ? handleUpdateOrganization : handleCreateOrganization}
            onCancel={() => {
              setIsFormDialogOpen(false);
              setEditingOrganization(null);
            }}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedOrganization?.name}</DialogTitle>
          </DialogHeader>
          {selectedOrganization && (
            <OrganizationProfile 
              organization={selectedOrganization}
              onEdit={() => {
                setIsProfileDialogOpen(false);
                openEditDialog(selectedOrganization);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}