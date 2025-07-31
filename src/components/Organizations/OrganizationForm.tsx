import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Organization } from '@/types/organizations';

interface OrganizationFormProps {
  organization?: Organization;
  onSubmit: (data: Partial<Organization>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function OrganizationForm({ organization, onSubmit, onCancel, isLoading }: OrganizationFormProps) {
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    slug: organization?.slug || '',
    description: organization?.description || '',
    website: organization?.website || '',
    contact_email: organization?.contact_email || '',
    contact_phone: organization?.contact_phone || '',
    status: organization?.status || 'active',
    // Address
    street: organization?.address?.street || '',
    city: organization?.address?.city || '',
    postal_code: organization?.address?.postal_code || '',
    country: organization?.address?.country || 'Sverige',
    // Settings
    industry: organization?.settings?.industry || '',
    size: organization?.settings?.size || '',
    founded: organization?.settings?.founded || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const organizationData: Partial<Organization> = {
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: formData.description || undefined,
      website: formData.website || undefined,
      contact_email: formData.contact_email || undefined,
      contact_phone: formData.contact_phone || undefined,
      status: formData.status as Organization['status'],
      address: {
        street: formData.street || undefined,
        city: formData.city || undefined,
        postal_code: formData.postal_code || undefined,
        country: formData.country || undefined,
      },
      settings: {
        industry: formData.industry || undefined,
        size: formData.size || undefined,
        founded: formData.founded || undefined,
      }
    };

    onSubmit(organizationData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Grundläggande information</CardTitle>
          <CardDescription>
            Grundläggande uppgifter om organisationen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organisationsnamn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Företagsnamn"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL-vänligt namn)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                placeholder="organisationsnamn-slug"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivning</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Beskriv organisationen..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Webbsida</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://www.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                  <SelectItem value="prospect">Prospekt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kontaktinformation</CardTitle>
          <CardDescription>
            Primära kontaktuppgifter för organisationen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Kontakt e-post</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="info@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Telefonnummer</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                placeholder="+46 8 123 456 78"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adressinformation</CardTitle>
          <CardDescription>
            Fysisk adress till organisationen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">Gatuadress</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => handleInputChange('street', e.target.value)}
              placeholder="Storgatan 1"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Stad</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Stockholm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postnummer</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                placeholder="111 22"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Land</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="Sverige"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organisationsdetaljer</CardTitle>
          <CardDescription>
            Ytterligare information om organisationen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry">Bransch</Label>
              <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj bransch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Teknik</SelectItem>
                  <SelectItem value="healthcare">Hälso- och sjukvård</SelectItem>
                  <SelectItem value="finance">Finans</SelectItem>
                  <SelectItem value="education">Utbildning</SelectItem>
                  <SelectItem value="consulting">Konsulting</SelectItem>
                  <SelectItem value="manufacturing">Tillverkning</SelectItem>
                  <SelectItem value="retail">Detaljhandel</SelectItem>
                  <SelectItem value="other">Annat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Storlek</Label>
              <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj storlek" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 anställda</SelectItem>
                  <SelectItem value="11-50">11-50 anställda</SelectItem>
                  <SelectItem value="51-200">51-200 anställda</SelectItem>
                  <SelectItem value="201-500">201-500 anställda</SelectItem>
                  <SelectItem value="500+">500+ anställda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="founded">Grundat år</Label>
              <Input
                id="founded"
                value={formData.founded}
                onChange={(e) => handleInputChange('founded', e.target.value)}
                placeholder="2020"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Avbryt
        </Button>
        <Button type="submit" disabled={isLoading || !formData.name}>
          {isLoading ? 'Sparar...' : organization ? 'Uppdatera' : 'Skapa organisation'}
        </Button>
      </div>
    </form>
  );
}