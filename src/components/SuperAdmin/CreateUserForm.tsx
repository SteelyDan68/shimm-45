/**
 * CREATE USER FORM - Comprehensive User Creation
 * 
 * Formulär för att skapa nya användare med komplett profilinformation
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Contact, MapPin } from 'lucide-react';

interface CreateUserFormProps {
  onSuccess: () => void;
}

export const CreateUserForm: React.FC<CreateUserFormProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Sverige',
    date_of_birth: '',
    bio: '',
    roles: [] as string[],
    send_invitation: true,
    notify_user: true
  });

  const { toast } = useToast();

  const availableRoles = [
    { value: 'client', label: 'Klient' },
    { value: 'coach', label: 'Coach' },
    { value: 'admin', label: 'Admin' },
    { value: 'superadmin', label: 'Superadmin' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRoleToggle = (role: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roles: checked 
        ? [...prev.roles, role]
        : prev.roles.filter(r => r !== role)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.email || !formData.first_name || !formData.last_name) {
        throw new Error('E-post, förnamn och efternamn är obligatoriska');
      }

      if (formData.roles.length === 0) {
        throw new Error('Minst en roll måste tilldelas');
      }

      // Create user via edge function
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password || undefined,
          first_name: formData.first_name,
          last_name: formData.last_name,
          roles: formData.roles,
        }
      });

      if (error) throw error;

      toast({
        title: "Användare skapad",
        description: `${formData.first_name} ${formData.last_name} har skapats framgångsrikt`,
      });

      onSuccess();

      // Reset form
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        country: 'Sverige',
        date_of_birth: '',
        bio: '',
        roles: [],
        send_invitation: true,
        notify_user: true
      });

    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skapa användaren",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Grundinfo</TabsTrigger>
          <TabsTrigger value="contact">Kontakt</TabsTrigger>
          <TabsTrigger value="roles">Roller</TabsTrigger>
          <TabsTrigger value="settings">Inställningar</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Grundläggande Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Förnamn *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Efternamn *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">E-postadress *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Lösenord (lämna tomt för automatiskt)</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Genereras automatiskt om tomt"
                />
              </div>

              <div>
                <Label htmlFor="date_of_birth">Födelsedatum</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="bio">Biografi</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Kort beskrivning av användaren..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Contact className="h-5 w-5" />
                Kontaktinformation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">Telefonnummer</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+46 70 123 45 67"
                />
              </div>

              <div>
                <Label htmlFor="address">Adress</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Gatunummer och gatunamn"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Stad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Postnummer</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    placeholder="123 45"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="country">Land</Label>
                <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sverige">Sverige</SelectItem>
                    <SelectItem value="Norge">Norge</SelectItem>
                    <SelectItem value="Danmark">Danmark</SelectItem>
                    <SelectItem value="Finland">Finland</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Roller och Behörigheter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Välj minst en roll för användaren. Roller bestämmer vad användaren kan göra i systemet.
              </p>
              
              <div className="space-y-3">
                {availableRoles.map((role) => (
                  <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={role.value}
                      checked={formData.roles.includes(role.value)}
                      onCheckedChange={(checked) => handleRoleToggle(role.value, checked as boolean)}
                    />
                    <Label htmlFor={role.value} className="flex-1">
                      {role.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inställningar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="send_invitation"
                  checked={formData.send_invitation}
                  onCheckedChange={(checked) => handleInputChange('send_invitation', checked)}
                />
                <Label htmlFor="send_invitation">
                  Skicka inbjudan via e-post
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify_user"
                  checked={formData.notify_user}
                  onCheckedChange={(checked) => handleInputChange('notify_user', checked)}
                />
                <Label htmlFor="notify_user">
                  Meddela användaren om kontoskapandet
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading} className="min-w-32">
          {loading ? 'Skapar...' : 'Skapa Användare'}
        </Button>
      </div>
    </form>
  );
};