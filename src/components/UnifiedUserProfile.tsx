import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  TrendingUp,
  RefreshCw,
  User,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserData } from '@/hooks/useUserData';

// Import specialized components
import { ClientProfileView } from './UnifiedUserProfile/ClientProfileView';
import { UserCrmView } from './UnifiedUserProfile/UserCrmView';
import { AssessmentView } from './UnifiedUserProfile/AssessmentView';
import { PasswordInlineEditor } from '@/components/Profile/PasswordInlineEditor';

interface UnifiedUserProfileProps {
  // No props needed - everything comes from URL and context
}

/**
 * UNIFIED USER PROFILE COMPONENT
 * Single Source of Truth: Uses ONLY user_id
 * Context-driven UI: Renders different views based on ?context= parameter
 * Role-based access: Respects user permissions and roles
 */
export const UnifiedUserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isSuperAdmin, isAdmin, canManageUsers } = useAuth();
  const { toast } = useToast();
  
  // SINGLE SOURCE OF TRUTH: All data fetched via user_id
  const { profile, loading, hasRole, roles } = useUserData(userId);
  
  // Context determines UI behavior
  const context = searchParams.get('context') || 'profile';
  const tab = searchParams.get('tab');
  const pillar = searchParams.get('pillar');
  
  // SIMPLIFIED ACCESS CONTROL: Only check once when user/userId changes
  const canViewProfile = useMemo(() => {
    if (!user?.id || !userId) return false;
    
    return (
      isSuperAdmin() ||
      isAdmin() ||
      userId === user.id ||
      canManageUsers
    );
  }, [user?.id, userId, isSuperAdmin, isAdmin, canManageUsers]);

  // SIMPLIFIED ACCESS CHECK: Only redirect once on access denial
  useEffect(() => {
    if (user?.id && userId && !canViewProfile) {
      console.error('❌ Access denied for unified user profile');
      toast({
        title: "Åtkomst nekad",
        description: "Du har inte behörighet att visa denna profil",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [user?.id, userId, canViewProfile]);

  const getUserDisplayName = () => {
    if (!profile) return 'Okänd användare';
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return fullName || profile.email || 'Namnlös användare';
  };

  const getUserInitials = () => {
    return `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase() || 'U';
  };

  const getContextTitle = () => {
    switch (context) {
      case 'client': return 'Klientprofil';
      case 'assessment': return 'Bedömning';
      case 'coach': return 'Coach-vy';
      default: return 'Användarprofil';
    }
  };

  const getContextDescription = () => {
    switch (context) {
      case 'client': return 'Klientdata, utveckling och coaching-verktyg';
      case 'assessment': return 'Bedömningar och analysverktyg';
      case 'coach': return 'Coach-verktyg och klientöversikt';
      default: return 'CRM-grunddata och kontaktinformation';
    }
  };

  // SIMPLIFIED LOADING STATE: Single source of loading
  if (!user?.id || loading || !userId) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="animate-pulse">Laddar profil...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
        </div>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-2">Användare hittades inte</h2>
          <p className="text-muted-foreground">Den begärda användarprofilen kunde inte hittas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* UNIFIED HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
          
            <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-2xl font-bold">{getUserDisplayName()}</h1>
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground">{getContextDescription()}</p>
                <Badge variant="outline">{getContextTitle()}</Badge>
                {roles.map((role, index) => (
                  <Badge key={index} variant="secondary">
                    {typeof role === 'string' ? role : role?.role || 'Unknown'}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Context-specific actions - REMOVED per team decision */}
        {/* Placeholder buttons eliminated for cleaner UX */}
      </div>

      <PasswordInlineEditor userId={userId!} userEmail={profile.email} userName={getUserDisplayName()} />

      {/* CONTEXT-DRIVEN CONTENT */}
      {context === 'client' && (
        <ClientProfileView 
          userId={userId!}
          profile={profile}
          extendedProfile={profile}
          defaultTab={tab}
          defaultPillar={pillar}
        />
      )}
      
      {context === 'assessment' && (
        <AssessmentView 
          userId={userId!}
          profile={profile}
        />
      )}
      
      {/* Default: CRM/Profile view */}
      {(!context || context === 'profile') && (
        <UserCrmView 
          userId={userId!}
          profile={profile}
          extendedProfile={profile}
          canEdit={isSuperAdmin() || isAdmin()}
          onProfileUpdate={() => {}} // No longer needed - useUserData handles updates
        />
      )}
    </div>
  );
};