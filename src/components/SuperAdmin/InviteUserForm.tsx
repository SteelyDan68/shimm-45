/**
 * INVITE USER FORM - Send invitations to new users
 * 
 * Formulär för att skicka inbjudningar till nya användare
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Users } from 'lucide-react';

interface InviteUserFormProps {
  onSuccess: () => void;
}

export const InviteUserForm: React.FC<InviteUserFormProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    emails: '',
    role: 'client',
    message: '',
    expires_in_days: 7
  });

  const { toast } = useToast();

  const availableRoles = [
    { value: 'client', label: 'Klient' },
    { value: 'coach', label: 'Coach' },
    { value: 'admin', label: 'Admin' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Parse emails (comma or newline separated)
      const emailList = formData.emails
        .split(/[,\n]/)
        .map(email => email.trim())
        .filter(email => email.length > 0);

      if (emailList.length === 0) {
        throw new Error('Minst en e-postadress krävs');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emailList.filter(email => !emailRegex.test(email));
      
      if (invalidEmails.length > 0) {
        throw new Error(`Ogiltiga e-postadresser: ${invalidEmails.join(', ')}`);
      }

      // Send invitations
      const { data, error } = await supabase.functions.invoke('send-invitations', {
        body: {
          emails: emailList,
          role: formData.role,
          custom_message: formData.message,
          expires_in_days: formData.expires_in_days
        }
      });

      if (error) throw error;

      toast({
        title: "Inbjudningar skickade",
        description: `${emailList.length} inbjudningar har skickats framgångsrikt`,
      });

      onSuccess();

      // Reset form
      setFormData({
        emails: '',
        role: 'client',
        message: '',
        expires_in_days: 7
      });

    } catch (error: any) {
      console.error('Error sending invitations:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skicka inbjudningarna",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="emails" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          E-postadresser *
        </Label>
        <Textarea
          id="emails"
          value={formData.emails}
          onChange={(e) => handleInputChange('emails', e.target.value)}
          placeholder="exempel@domain.com, exempel2@domain.com
eller en e-post per rad"
          required
          className="min-h-24"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Separera flera e-postadresser med komma eller ny rad
        </p>
      </div>

      <div>
        <Label htmlFor="role" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Roll
        </Label>
        <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="expires_in_days">Giltig i (dagar)</Label>
        <Select 
          value={formData.expires_in_days.toString()} 
          onValueChange={(value) => handleInputChange('expires_in_days', parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 dag</SelectItem>
            <SelectItem value="3">3 dagar</SelectItem>
            <SelectItem value="7">7 dagar</SelectItem>
            <SelectItem value="14">14 dagar</SelectItem>
            <SelectItem value="30">30 dagar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="message">Personligt meddelande (valfritt)</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => handleInputChange('message', e.target.value)}
          placeholder="Lägg till ett personligt meddelande till inbjudan..."
          className="min-h-20"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading} className="min-w-32">
          {loading ? 'Skickar...' : 'Skicka Inbjudningar'}
        </Button>
      </div>
    </form>
  );
};