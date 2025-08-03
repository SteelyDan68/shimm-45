import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  User, 
  Building2,
  Globe,
  Instagram,
  Youtube,
  MessageSquare,
  Facebook,
  Twitter,
  Camera,
  Edit3,
  Save,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserData } from "@/hooks/useUserData";
import { useExtendedProfile } from "@/hooks/useExtendedProfile";
import { useToast } from "@/hooks/use-toast";
import { useUnifiedPermissions } from "@/hooks/useUnifiedPermissions";
import type { ExtendedProfileData } from "@/types/extendedProfile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function UserCrmProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { profile, loading: profileLoading, hasRole } = useUserData(userId);
  const { getExtendedProfile, saveExtendedProfile } = useExtendedProfile();
  const { isSuperAdmin, isAdmin } = useUnifiedPermissions();
  
  const [extendedProfile, setExtendedProfile] = useState<ExtendedProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ExtendedProfileData>({});
  const [loadingExtended, setLoadingExtended] = useState(true);

  // SUPERADMIN GOD MODE: Always allow superadmin access, then admin, then own profile
  console.log('🔍 UserCrmProfile access check:', { 
    userId, 
    userAuthId: user?.id, 
    isSuperAdmin,
    isAdmin,
    isOwn: userId === user?.id,
    hasClientRole: hasRole('client')
  });
  const canViewProfile = isSuperAdmin || userId === user?.id || isAdmin;
  
  useEffect(() => {
    console.log('🔍 Access control result:', { canViewProfile, userId, userAuthId: user?.id });
    if (!canViewProfile) {
      console.error('❌ Access denied for user profile view');
      toast({
        title: "Åtkomst nekad",
        description: "Du har inte behörighet att visa denna profil",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    if (userId) {
      loadExtendedProfile();
    }
  }, [userId, canViewProfile]);

  const loadExtendedProfile = async () => {
    try {
      setLoadingExtended(true);
      const data = await getExtendedProfile();
      setExtendedProfile(data);
      setEditData(data || {});
    } catch (error) {
      console.error('Error loading extended profile:', error);
    } finally {
      setLoadingExtended(false);
    }
  };

  const handleSave = async () => {
    try {
      const result = await saveExtendedProfile(editData);
      if (result.success) {
        setExtendedProfile(editData);
        setIsEditing(false);
        toast({
          title: "Profil uppdaterad",
          description: "Användarens profil har uppdaterats framgångsrikt"
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'tiktok': return <MessageSquare className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'snapchat': return <Camera className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Ej angivet';
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  if (profileLoading || loadingExtended) {
    return (
      <div className="container mx-auto p-6">
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
      <div className="container mx-auto p-6">
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
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Användarprofil</h1>
            <p className="text-muted-foreground">CRM-grunddata och kontaktinformation</p>
          </div>
        </div>
        
        {(isSuperAdmin || isAdmin) && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => {
                  setIsEditing(false);
                  setEditData(extendedProfile || {});
                }}>
                  <X className="h-4 w-4 mr-2" />
                  Avbryt
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Spara
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Redigera
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Profile Header Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url || extendedProfile?.avatar_url} />
              <AvatarFallback className="text-lg">
                {getInitials(profile.first_name, profile.last_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">
                  {profile.first_name || extendedProfile?.first_name} {profile.last_name || extendedProfile?.last_name || 'Namnlös användare'}
                </h2>
                <Badge variant="default">
                  {profile.primary_role || extendedProfile?.primary_role || 'Ingen roll'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.email || extendedProfile?.email || 'Ingen e-post'}</span>
                </div>
                
                {(profile.phone || extendedProfile?.phone) && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.phone || extendedProfile?.phone}</span>
                  </div>
                )}
                
                {(profile.location || extendedProfile?.location) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.location || extendedProfile?.location}</span>
                  </div>
                )}
                
                {(profile.date_of_birth || extendedProfile?.date_of_birth) && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Född: {formatDate(profile.date_of_birth || extendedProfile?.date_of_birth)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Grunddata</TabsTrigger>
          <TabsTrigger value="contact">Kontakt & Adress</TabsTrigger>
          <TabsTrigger value="social">Sociala Plattformar</TabsTrigger>
          <TabsTrigger value="professional">Professionellt</TabsTrigger>
          <TabsTrigger value="personal">Personligt</TabsTrigger>
        </TabsList>

        {/* Grunddata */}
        <TabsContent value="basic">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personuppgifter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Förnamn</Label>
                        <Input 
                          value={editData.first_name || ''} 
                          onChange={(e) => setEditData({...editData, first_name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Efternamn</Label>
                        <Input 
                          value={editData.last_name || ''} 
                          onChange={(e) => setEditData({...editData, last_name: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>E-post</Label>
                      <Input 
                        type="email"
                        value={editData.email || ''} 
                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Telefon</Label>
                      <Input 
                        value={editData.phone || ''} 
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Födelsedata</Label>
                      <Input 
                        type="date"
                        value={editData.date_of_birth || ''} 
                        onChange={(e) => setEditData({...editData, date_of_birth: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Kön</Label>
                      <Input 
                        value={editData.gender || ''} 
                        onChange={(e) => setEditData({...editData, gender: e.target.value})}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Förnamn:</span>
                      <span>{profile.first_name || extendedProfile?.first_name || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Efternamn:</span>
                      <span>{profile.last_name || extendedProfile?.last_name || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">E-post:</span>
                      <span>{profile.email || extendedProfile?.email || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefon:</span>
                      <span>{profile.phone || extendedProfile?.phone || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Födelsedata:</span>
                      <span>{formatDate(profile.date_of_birth || extendedProfile?.date_of_birth)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kön:</span>
                      <span>{profile.gender || extendedProfile?.gender || 'Ej angivet'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Systemuppgifter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Användar-ID:</span>
                  <span className="font-mono text-xs">{profile.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
                    {profile.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registrerad:</span>
                  <span>{formatDate(profile.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Senast uppdaterad:</span>
                  <span>{formatDate(profile.updated_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Onboarding:</span>
                  <Badge variant={profile.onboarding_completed ? 'default' : 'secondary'}>
                    {profile.onboarding_completed ? 'Klar' : 'Ej klar'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Kontakt & Adress */}
        <TabsContent value="contact">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Adressinformation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label>Adress</Label>
                      <Input 
                        value={editData.address?.street || ''} 
                        onChange={(e) => setEditData({
                          ...editData, 
                          address: {...editData.address, street: e.target.value}
                        })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Postnummer</Label>
                        <Input 
                          value={editData.address?.postalCode || ''} 
                          onChange={(e) => setEditData({
                            ...editData, 
                            address: {...editData.address, postalCode: e.target.value}
                          })}
                        />
                      </div>
                      <div>
                        <Label>Stad</Label>
                        <Input 
                          value={editData.address?.city || ''} 
                          onChange={(e) => setEditData({
                            ...editData, 
                            address: {...editData.address, city: e.target.value}
                          })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Land</Label>
                      <Input 
                        value={editData.address?.country || ''} 
                        onChange={(e) => setEditData({
                          ...editData, 
                          address: {...editData.address, country: e.target.value}
                        })}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Adress:</span>
                      <span>{extendedProfile?.address?.street || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Postnummer:</span>
                      <span>{extendedProfile?.address?.postalCode || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stad:</span>
                      <span>{extendedProfile?.address?.city || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Land:</span>
                      <span>{extendedProfile?.address?.country || 'Ej angivet'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kontaktpersoner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label>Manager namn</Label>
                      <Input 
                        value={editData.manager_name || ''} 
                        onChange={(e) => setEditData({...editData, manager_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Manager e-post</Label>
                      <Input 
                        type="email"
                        value={editData.manager_email || ''} 
                        onChange={(e) => setEditData({...editData, manager_email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Primär kontakt namn</Label>
                      <Input 
                        value={editData.primary_contact_name || ''} 
                        onChange={(e) => setEditData({...editData, primary_contact_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Primär kontakt e-post</Label>
                      <Input 
                        type="email"
                        value={editData.primary_contact_email || ''} 
                        onChange={(e) => setEditData({...editData, primary_contact_email: e.target.value})}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Manager:</span>
                      <span>{extendedProfile?.manager_name || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Manager e-post:</span>
                      <span>{extendedProfile?.manager_email || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Primär kontakt:</span>
                      <span>{extendedProfile?.primary_contact_name || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Primär kontakt e-post:</span>
                      <span>{extendedProfile?.primary_contact_email || 'Ej angivet'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sociala Plattformar */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Sociala Medier & Plattformar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isEditing ? (
                  <>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        Instagram
                      </Label>
                      <Input 
                        value={editData.instagram_handle || ''} 
                        onChange={(e) => setEditData({...editData, instagram_handle: e.target.value})}
                        placeholder="@användarnamn"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Youtube className="h-4 w-4" />
                        YouTube
                      </Label>
                      <Input 
                        value={editData.youtube_handle || ''} 
                        onChange={(e) => setEditData({...editData, youtube_handle: e.target.value})}
                        placeholder="Kanal-URL eller namn"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        TikTok
                      </Label>
                      <Input 
                        value={editData.tiktok_handle || ''} 
                        onChange={(e) => setEditData({...editData, tiktok_handle: e.target.value})}
                        placeholder="@användarnamn"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </Label>
                      <Input 
                        value={editData.facebook_handle || ''} 
                        onChange={(e) => setEditData({...editData, facebook_handle: e.target.value})}
                        placeholder="Profil eller sida"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" />
                        Twitter/X
                      </Label>
                      <Input 
                        value={editData.twitter_handle || ''} 
                        onChange={(e) => setEditData({...editData, twitter_handle: e.target.value})}
                        placeholder="@användarnamn"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Snapchat
                      </Label>
                      <Input 
                        value={editData.snapchat_handle || ''} 
                        onChange={(e) => setEditData({...editData, snapchat_handle: e.target.value})}
                        placeholder="Användarnamn"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        Instagram:
                      </span>
                      <span>{extendedProfile?.instagram_handle || 'Ej angivet'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Youtube className="h-4 w-4" />
                        YouTube:
                      </span>
                      <span>{extendedProfile?.youtube_handle || 'Ej angivet'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        TikTok:
                      </span>
                      <span>{extendedProfile?.tiktok_handle || 'Ej angivet'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Facebook className="h-4 w-4" />
                        Facebook:
                      </span>
                      <span>{extendedProfile?.facebook_handle || 'Ej angivet'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" />
                        Twitter/X:
                      </span>
                      <span>{extendedProfile?.twitter_handle || 'Ej angivet'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Snapchat:
                      </span>
                      <span>{extendedProfile?.snapchat_handle || 'Ej angivet'}</span>
                    </div>
                  </>
                )}
              </div>
              
              {extendedProfile?.platforms && extendedProfile.platforms.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Aktiva plattformar:</h4>
                  <div className="flex flex-wrap gap-2">
                    {extendedProfile.platforms.map((platform) => (
                      <Badge key={platform} variant="outline" className="flex items-center gap-1">
                        {getSocialIcon(platform)}
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professionellt */}
        <TabsContent value="professional">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Professionell Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label>Primär roll</Label>
                      <Input 
                        value={editData.primary_role || ''} 
                        onChange={(e) => setEditData({...editData, primary_role: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Sekundär roll</Label>
                      <Input 
                        value={editData.secondary_role || ''} 
                        onChange={(e) => setEditData({...editData, secondary_role: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Nisch</Label>
                      <Input 
                        value={editData.niche || ''} 
                        onChange={(e) => setEditData({...editData, niche: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Organisation</Label>
                      <Input 
                        value={editData.organization || ''} 
                        onChange={(e) => setEditData({...editData, organization: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Avdelning</Label>
                      <Input 
                        value={editData.department || ''} 
                        onChange={(e) => setEditData({...editData, department: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Jobbtitel</Label>
                      <Input 
                        value={editData.job_title || ''} 
                        onChange={(e) => setEditData({...editData, job_title: e.target.value})}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Primär roll:</span>
                      <span>{extendedProfile?.primary_role || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sekundär roll:</span>
                      <span>{extendedProfile?.secondary_role || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nisch:</span>
                      <span>{extendedProfile?.niche || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Organisation:</span>
                      <span>{extendedProfile?.organization || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avdelning:</span>
                      <span>{extendedProfile?.department || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jobbtitel:</span>
                      <span>{extendedProfile?.job_title || 'Ej angivet'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kreativt & Utmaningar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label>Kreativa styrkor</Label>
                      <Textarea 
                        value={editData.creative_strengths || ''} 
                        onChange={(e) => setEditData({...editData, creative_strengths: e.target.value})}
                        placeholder="Beskriv kreativa styrkor..."
                      />
                    </div>
                    <div>
                      <Label>Utmaningar</Label>
                      <Textarea 
                        value={editData.challenges || ''} 
                        onChange={(e) => setEditData({...editData, challenges: e.target.value})}
                        placeholder="Beskriv utmaningar..."
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Kreativa styrkor:</span>
                      <p className="mt-1">{extendedProfile?.creative_strengths || 'Ej angivet'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Utmaningar:</span>
                      <p className="mt-1">{extendedProfile?.challenges || 'Ej angivet'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Personligt */}
        <TabsContent value="personal">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hälsa & Tillgänglighet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label>Fysiska begränsningar</Label>
                      <Textarea 
                        value={editData.physical_limitations || ''} 
                        onChange={(e) => setEditData({...editData, physical_limitations: e.target.value})}
                        placeholder="Beskriv eventuella fysiska begränsningar..."
                      />
                    </div>
                    <div>
                      <Label>Neurodiversitet</Label>
                      <Textarea 
                        value={editData.neurodiversity || ''} 
                        onChange={(e) => setEditData({...editData, neurodiversity: e.target.value})}
                        placeholder="Beskriv neurodiversitet eller särskilda behov..."
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Fysiska begränsningar:</span>
                      <p className="mt-1">{extendedProfile?.physical_limitations || 'Ej angivet'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Neurodiversitet:</span>
                      <p className="mt-1">{extendedProfile?.neurodiversity || 'Ej angivet'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Övrigt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label>Bio</Label>
                      <Textarea 
                        value={editData.bio || ''} 
                        onChange={(e) => setEditData({...editData, bio: e.target.value})}
                        placeholder="Kort biografi..."
                      />
                    </div>
                    <div>
                      <Label>Klientkategori</Label>
                      <Input 
                        value={editData.client_category || ''} 
                        onChange={(e) => setEditData({...editData, client_category: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Klientstatus</Label>
                      <Input 
                        value={editData.client_status || ''} 
                        onChange={(e) => setEditData({...editData, client_status: e.target.value})}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Bio:</span>
                      <p className="mt-1">{extendedProfile?.bio || 'Ej angivet'}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Klientkategori:</span>
                      <span>{extendedProfile?.client_category || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Klientstatus:</span>
                      <span>{extendedProfile?.client_status || 'Ej angivet'}</span>
                    </div>
                  </div>
                )}
                
                {extendedProfile?.tags && extendedProfile.tags.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Taggar:</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {extendedProfile.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}