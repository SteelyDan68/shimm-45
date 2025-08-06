/**
 * SEND INVITATION FORM - Refactored to use Unified Invitation System
 */

import React from 'react';
import { UnifiedInvitationManager } from '@/components/UnifiedInvitations';

interface SendInvitationFormProps {
  onSuccess?: () => void;
}

export const SendInvitationForm = ({ onSuccess }: SendInvitationFormProps) => {
  return (
    <UnifiedInvitationManager 
      onSuccess={onSuccess}
      defaultRole="client"
      allowBulk={false}
    />
  );
};