/**
 * MANUELL ANVÄNDARSKAPANDE – Inbjudningar avvecklade
 */

import React from 'react';
import { CreateUserForm } from '@/components/AdminComponents/CreateUserForm';

interface InviteUserFormProps {
  onSuccess: () => void;
}

export const InviteUserForm: React.FC<InviteUserFormProps> = ({ onSuccess }) => {
  return (
    <div className="w-full max-w-3xl">
      <CreateUserForm onSuccess={onSuccess} />
    </div>
  );
};
