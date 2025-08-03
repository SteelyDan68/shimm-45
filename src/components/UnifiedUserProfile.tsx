import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Brain, 
  TrendingUp,
  RefreshCw,
  Settings,
  User,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedPermissions } from '@/hooks/useUnifiedPermissions';
import { useUserData } from '@/hooks/useUserData';
import { useExtendedProfile } from '@/hooks/useExtendedProfile';

// Import specialized components
import { ClientProfileView } from './UnifiedUserProfile/ClientProfileView';
import { UserCrmView } from './UnifiedUserProfile/UserCrmView';
import { AssessmentView } from './UnifiedUserProfile/AssessmentView';

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
  const { user } = useAuth();
  const { toast } = useToast();
  
  // SINGLE SOURCE OF TRUTH: All data fetched via user_id
  const { profile, loading: profileLoading, hasRole, roles } = useUserData(userId);
  const { getExtendedProfile } = useExtendedProfile();
  const { isSuperAdmin, isAdmin, canManageUsers } = useUnifiedPermissions();
  
  // Context determines UI behavior
  const context = searchParams.get('context') || 'profile'; // client, assessment, profile
  const tab = searchParams.get('tab');
  const pillar = searchParams.get('pillar');
  
  // SUPERADMIN GOD MODE: Always allow superadmin access
  const canViewProfile = isSuperAdmin || userId === user?.id || isAdmin || canManageUsers;
  
  const [extendedProfile, setExtendedProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  console.log('🔄 UnifiedUserProfile:', {
    userId,
    context,
    tab,
    pillar,
    userRoles: roles,
    canViewProfile,
    isSuperAdmin
  });

  useEffect(() => {
    if (!canViewProfile) {
      console.error('❌ Access denied for unified user profile');
      toast({
        title: "Åtkomst nekad",
        description: "Du har inte behörighet att visa denna profil",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    if (userId) {
      loadUserData();
    }
  }, [userId, canViewProfile]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load extended profile data
      const extData = await getExtendedProfile();
      setExtendedProfile(extData);
      
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda användardata",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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

  if (profileLoading || loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
        </div>
        <div className="text-center py-8">Laddar profil...</div>
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
              <AvatarImage src={profile.avatar_url || extendedProfile?.avatar_url} />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-2xl font-bold">{getUserDisplayName()}</h1>
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground">{getContextDescription()}</p>
                <Badge variant="outline">{getContextTitle()}</Badge>
                {roles.map((role, index) => (
                  <Badge key={index} variant="secondary">{String(role)}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Context-specific actions */}
        {context === 'client' && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Brain className="h-4 w-4 mr-2" />
              Kör AI-analys
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Inställningar
            </Button>
          </div>
        )}
      </div>

      {/* CONTEXT-DRIVEN CONTENT */}
      {context === 'client' && (
        <ClientProfileView 
          userId={userId!}
          profile={profile}
          extendedProfile={extendedProfile}
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
      {!context || context === 'profile' && (
        <UserCrmView 
          userId={userId!}
          profile={profile}
          extendedProfile={extendedProfile}
          canEdit={isSuperAdmin || isAdmin}
          onProfileUpdate={loadUserData}
        />
      )}
    </div>
  );
};