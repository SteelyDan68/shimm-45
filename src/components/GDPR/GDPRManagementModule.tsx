/**
 * 🌟 ENTERPRISE GDPR MANAGEMENT MODULE 🌟
 * 
 * Huvudmodul som integrerar alla GDPR-funktioner
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { GDPRAdminDashboard } from './GDPRAdminDashboard';
import { UserGDPRRequestForm } from './UserGDPRRequestForm';
import { Shield, AlertTriangle } from 'lucide-react';

export const GDPRManagementModule: React.FC = () => {
  const { user, hasRole } = useAuth();
  
  const isSuperAdmin = user && hasRole('superadmin');
  const isAdmin = user && (hasRole('admin') || hasRole('superadmin'));

  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Shield className="h-5 w-5" />
            Åtkomst nekad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Du måste vara inloggad för att använda GDPR-funktioner.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Visa admin-dashboard för admins och superadmins
  if (isAdmin) {
    return <GDPRAdminDashboard />;
  }

  // Visa användarformulär för vanliga användare
  return <UserGDPRRequestForm />;
};