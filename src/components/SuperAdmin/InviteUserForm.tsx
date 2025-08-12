/**
 * INVITE USER FORM - Förbättrat inbjudnings- och användarhanteringssystem
 */

import React from 'react';
import { UnifiedInvitationManager } from '@/components/UnifiedInvitations';
import { CreateUserForm } from '@/components/AdminComponents/CreateUserForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, UserPlus } from 'lucide-react';

interface InviteUserFormProps {
  onSuccess: () => void;
}

export const InviteUserForm: React.FC<InviteUserFormProps> = ({ onSuccess }) => {
  return (
    <Tabs defaultValue="invite" className="w-full max-w-4xl">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="invite" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Bjud in för självregistrering
        </TabsTrigger>
        <TabsTrigger value="create" className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Skapa användare manuellt
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="invite" className="mt-6">
        <UnifiedInvitationManager 
          onSuccess={onSuccess}
          defaultRole="client"
          allowBulk={true}
          className="w-full"
        />
      </TabsContent>
      
      <TabsContent value="create" className="mt-6">
        <CreateUserForm onSuccess={onSuccess} />
      </TabsContent>
    </Tabs>
  );
};