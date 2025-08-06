/**
 * INVITE USER FORM - Refactored to use Unified Invitation System
 */

import React from 'react';
import { UnifiedInvitationManager } from '@/components/UnifiedInvitations';

interface InviteUserFormProps {
  onSuccess: () => void;
}

export const InviteUserForm: React.FC<InviteUserFormProps> = ({ onSuccess }) => {
  return (
    <UnifiedInvitationManager 
      onSuccess={onSuccess}
      defaultRole="client"
      allowBulk={true}
      className="max-w-4xl"
    />
  );
};