import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ClientFormProps {
  onSuccess: () => void;
}

export const ClientForm = ({ onSuccess }: ClientFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    email: '',
    phone: '',
    status: 'active',
    primary_contact_name: '',
    primary_contact_email: '',
    manager_name: '',
    manager_email: '',
    instagram_handle: '',
    tiktok_handle: '',
    youtube_channel: '',
    facebook_page: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('clients')
        .insert([{
          ...formData,
          user_id: user.id,
        }]);

      if (error) throw error;

      toast({
        title: "Klient tillagd",
        description: "Klienten har skapats framgångsrikt",
      });
      
      // Reset form
      setFormData({
        name: '',
        category: '',
        email: '',
        phone: '',
        status: 'active',
        primary_contact_name: '',
        primary_contact_email: '',
        manager_name: '',
        manager_email: '',
        instagram_handle: '',
        tiktok_handle: '',
        youtube_channel: '',
        facebook_page: '',
        notes: '',
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Fel",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lägg till ny klient</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Namn *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategori *" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="influencer">Influencer</SelectItem>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="brand">Brand</SelectItem>
                <SelectItem value="other">Övrigt</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="email"
              placeholder="E-post"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              placeholder="Telefon"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              placeholder="Primär kontakt"
              value={formData.primary_contact_name}
              onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
            />
            <Input
              type="email"
              placeholder="Kontakt e-post"
              value={formData.primary_contact_email}
              onChange={(e) => setFormData({ ...formData, primary_contact_email: e.target.value })}
            />
            <Input
              placeholder="Manager namn"
              value={formData.manager_name}
              onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
            />
            <Input
              type="email"
              placeholder="Manager e-post"
              value={formData.manager_email}
              onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })}
            />
            <Input
              placeholder="Instagram handle"
              value={formData.instagram_handle}
              onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
            />
            <Input
              placeholder="TikTok handle"
              value={formData.tiktok_handle}
              onChange={(e) => setFormData({ ...formData, tiktok_handle: e.target.value })}
            />
            <Input
              placeholder="YouTube kanal"
              value={formData.youtube_channel}
              onChange={(e) => setFormData({ ...formData, youtube_channel: e.target.value })}
            />
            <Input
              placeholder="Facebook sida"
              value={formData.facebook_page}
              onChange={(e) => setFormData({ ...formData, facebook_page: e.target.value })}
            />
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="inactive">Inaktiv</SelectItem>
                <SelectItem value="prospect">Prospekt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Anteckningar"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Sparar...' : 'Spara klient'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};