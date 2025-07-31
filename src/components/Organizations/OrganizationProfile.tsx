import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Edit, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Users,
  Settings,
  Activity
} from 'lucide-react';
import { OrganizationMemberManager } from './OrganizationMemberManager';
import { useOrganizations } from '@/hooks/useOrganizations';
import type { Organization } from '@/types/organizations';

interface OrganizationProfileProps {
  organization: Organization;
  onEdit: () => void;
}

export function OrganizationProfile({ organization, onEdit }: OrganizationProfileProps) {
  const { getOrganizationMembers } = useOrganizations();
  const members = getOrganizationMembers(organization.id);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{organization.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusColor(organization.status)}>
                {getStatusLabel(organization.status)}
              </Badge>
              {organization.settings?.industry && (
                <Badge variant="outline">
                  {organization.settings.industry}
                </Badge>
              )}
              {organization.settings?.size && (
                <Badge variant="secondary">
                  {organization.settings.size}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Redigera
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="members">Medlemmar ({members.length})</TabsTrigger>
          <TabsTrigger value="settings">Inställningar</TabsTrigger>
          <TabsTrigger value="activity">Aktivitet</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Grundläggande information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {organization.description && (
                  <div>
                    <h4 className="font-medium mb-1">Beskrivning</h4>
                    <p className="text-muted-foreground">{organization.description}</p>
                  </div>
                )}
                
                {organization.settings?.founded && (
                  <div>
                    <h4 className="font-medium mb-1">Grundat</h4>
                    <p className="text-muted-foreground">{organization.settings.founded}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-1">Skapad</h4>
                  <p className="text-muted-foreground">
                    {new Date(organization.created_at).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Kontaktinformation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {organization.contact_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${organization.contact_email}`} className="text-sm hover:text-primary">
                      {organization.contact_email}
                    </a>
                  </div>
                )}

                {organization.contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${organization.contact_phone}`} className="text-sm hover:text-primary">
                      {organization.contact_phone}
                    </a>
                  </div>
                )}

                {organization.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={organization.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm hover:text-primary"
                    >
                      {organization.website}
                    </a>
                  </div>
                )}

                {organization.address && (organization.address.street || organization.address.city) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      {organization.address.street && <div>{organization.address.street}</div>}
                      <div>
                        {organization.address.postal_code} {organization.address.city}
                      </div>
                      {organization.address.country && organization.address.country !== 'Sverige' && (
                        <div>{organization.address.country}</div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Statistik
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{members.length}</div>
                  <div className="text-sm text-muted-foreground">Medlemmar</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {members.filter(m => m.role === 'admin').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Administratörer</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {organization.settings?.industry || 'Ej angivet'}
                  </div>
                  <div className="text-sm text-muted-foreground">Bransch</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {organization.settings?.size || 'Ej angivet'}
                  </div>
                  <div className="text-sm text-muted-foreground">Storlek</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <OrganizationMemberManager organizationId={organization.id} />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Organisationsinställningar
              </CardTitle>
              <CardDescription>
                Hantera organisationens inställningar och konfiguration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Slug</h4>
                  <p className="text-muted-foreground">{organization.slug}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Status</h4>
                  <Badge className={getStatusColor(organization.status)}>
                    {getStatusLabel(organization.status)}
                  </Badge>
                </div>
              </div>

              {organization.settings && Object.keys(organization.settings).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Ytterligare inställningar</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <pre className="text-xs">{JSON.stringify(organization.settings, null, 2)}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Aktivitetshistorik
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Organisation skapad</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(organization.created_at).toLocaleString('sv-SE')}
                    </p>
                  </div>
                </div>

                {organization.updated_at !== organization.created_at && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Senast uppdaterad</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(organization.updated_at).toLocaleString('sv-SE')}
                      </p>
                    </div>
                  </div>
                )}

                {members.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Ingen aktivitet att visa</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}