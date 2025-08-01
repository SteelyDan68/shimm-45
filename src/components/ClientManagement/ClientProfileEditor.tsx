import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Briefcase, 
  Phone, 
  Mail,
  MapPin,
  Instagram,
  Youtube,
  Facebook,
  MessageCircle,
  Hash,
  Settings,
  Save,
  X
} from "lucide-react";

interface ClientProfileEditorProps {
  client: any;
  onSave: () => void;
  onCancel: () => void;
}

const categories = ["influencer", "creator", "brand", "other"];
const statuses = ["active", "inactive", "pending", "suspended"];

export function ClientProfileEditor({ client, onSave, onCancel }: ClientProfileEditorProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  // Basic info
  const [basicInfo, setBasicInfo] = useState({
    name: client.name || '',
    email: client.email || '',
    phone: client.phone || '',
    category: client.category || '',
    status: client.status || 'active'
  });

  // Social media
  const [socialMedia, setSocialMedia] = useState({
    instagram_handle: client.instagram_handle || '',
    youtube_channel: client.youtube_channel || '',
    tiktok_handle: client.tiktok_handle || '',
    facebook_page: client.facebook_page || ''
  });

  // Manager info
  const [managerInfo, setManagerInfo] = useState({
    manager_name: client.manager_name || '',
    manager_email: client.manager_email || ''
  });

  // Profile metadata (onboarding data)
  const [profileMetadata, setProfileMetadata] = useState({
    generalInfo: client.profile_metadata?.generalInfo || {
      name: '',
      age: '',
      gender: '',
      height: '',
      weight: '',
      physicalLimitations: '',
      neurodiversity: ''
    },
    publicRole: client.profile_metadata?.publicRole || {
      primaryRole: '',
      secondaryRole: '',
      niche: '',
      creativeStrengths: '',
      platforms: [],
      challenges: '',
      instagramHandle: '',
      youtubeHandle: '',
      tiktokHandle: '',
      snapchatHandle: '',
      facebookHandle: '',
      twitterHandle: ''
    },
    lifeMap: client.profile_metadata?.lifeMap || {
      location: '',
      livingWith: '',
      hasChildren: '',
      ongoingChanges: '',
      pastCrises: ''
    }
  });

  // Additional settings
  const [additionalSettings, setAdditionalSettings] = useState({
    velocity_score: client.velocity_score || 50,
    notes: client.notes || '',
    tags: client.tags || [],
    follower_counts: client.follower_counts || {}
  });

  const [newTag, setNewTag] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedClient = {
        ...basicInfo,
        ...socialMedia,
        ...managerInfo,
        velocity_score: additionalSettings.velocity_score,
        notes: additionalSettings.notes,
        tags: additionalSettings.tags,
        follower_counts: additionalSettings.follower_counts,
        profile_metadata: {
          ...profileMetadata,
          onboardingCompleted: true,
          onboardingCompletedAt: client.profile_metadata?.onboardingCompletedAt || new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('clients')
        .update(updatedClient)
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Profil uppdaterad",
        description: "Klientprofilen har sparats framgångsrikt."
      });

      onSave();
    } catch (error: any) {
      console.error('Error updating client:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara klientprofilen: " + error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !additionalSettings.tags.includes(newTag.trim())) {
      setAdditionalSettings(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setAdditionalSettings(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Grundinfo
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            Sociala medier
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Onboarding
          </TabsTrigger>
          <TabsTrigger value="manager" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Manager
          </TabsTrigger>
          <TabsTrigger value="additional" className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Övrigt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grundläggande information</CardTitle>
              <CardDescription>Redigera klientens basinformation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Namn</Label>
                  <Input
                    id="name"
                    value={basicInfo.name}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Kategori</Label>
                  <Select 
                    value={basicInfo.category} 
                    onValueChange={(value) => setBasicInfo(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={basicInfo.email}
                      onChange={(e) => setBasicInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={basicInfo.phone}
                      onChange={(e) => setBasicInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={basicInfo.status} 
                    onValueChange={(value) => setBasicInfo(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status === "active" ? "Aktiv" : 
                           status === "inactive" ? "Inaktiv" :
                           status === "pending" ? "Väntande" : "Suspenderad"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sociala medier</CardTitle>
              <CardDescription>Hantera klientens sociala medieplattformar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="instagram"
                      placeholder="användarnamn"
                      value={socialMedia.instagram_handle}
                      onChange={(e) => setSocialMedia(prev => ({ ...prev, instagram_handle: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Endast användarnamnet (utan @ tecken)</p>
                </div>
                <div>
                  <Label htmlFor="youtube">YouTube</Label>
                  <div className="relative">
                    <Youtube className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="youtube"
                      placeholder="Kanalnamn eller handle"
                      value={socialMedia.youtube_channel}
                      onChange={(e) => setSocialMedia(prev => ({ ...prev, youtube_channel: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Kanalnamn eller handle (utan @ tecken)</p>
                </div>
                <div>
                  <Label htmlFor="tiktok">TikTok</Label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="tiktok"
                      placeholder="användarnamn"
                      value={socialMedia.tiktok_handle}
                      onChange={(e) => setSocialMedia(prev => ({ ...prev, tiktok_handle: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Endast användarnamnet (utan @ tecken)</p>
                </div>
                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="facebook"
                      placeholder="Sidnamn eller URL"
                      value={socialMedia.facebook_page}
                      onChange={(e) => setSocialMedia(prev => ({ ...prev, facebook_page: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* General Info */}
            <Card>
              <CardHeader>
                <CardTitle>Allmän information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="fullName">Fullständigt namn</Label>
                  <Input
                    id="fullName"
                    value={profileMetadata.generalInfo.name}
                    onChange={(e) => setProfileMetadata(prev => ({
                      ...prev,
                      generalInfo: { ...prev.generalInfo, name: e.target.value }
                    }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="age">Ålder</Label>
                    <Input
                      id="age"
                      value={profileMetadata.generalInfo.age}
                      onChange={(e) => setProfileMetadata(prev => ({
                        ...prev,
                        generalInfo: { ...prev.generalInfo, age: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Kön</Label>
                    <Input
                      id="gender"
                      value={profileMetadata.generalInfo.gender}
                      onChange={(e) => setProfileMetadata(prev => ({
                        ...prev,
                        generalInfo: { ...prev.generalInfo, gender: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="height">Längd</Label>
                    <Input
                      id="height"
                      value={profileMetadata.generalInfo.height}
                      onChange={(e) => setProfileMetadata(prev => ({
                        ...prev,
                        generalInfo: { ...prev.generalInfo, height: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Vikt</Label>
                    <Input
                      id="weight"
                      value={profileMetadata.generalInfo.weight}
                      onChange={(e) => setProfileMetadata(prev => ({
                        ...prev,
                        generalInfo: { ...prev.generalInfo, weight: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Public Role */}
            <Card>
              <CardHeader>
                <CardTitle>Offentlig roll</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="primaryRole">Primär roll</Label>
                  <Input
                    id="primaryRole"
                    value={profileMetadata.publicRole.primaryRole}
                    onChange={(e) => setProfileMetadata(prev => ({
                      ...prev,
                      publicRole: { ...prev.publicRole, primaryRole: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="secondaryRole">Sekundär roll</Label>
                  <Input
                    id="secondaryRole"
                    value={profileMetadata.publicRole.secondaryRole}
                    onChange={(e) => setProfileMetadata(prev => ({
                      ...prev,
                      publicRole: { ...prev.publicRole, secondaryRole: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="niche">Nisch</Label>
                  <Input
                    id="niche"
                    value={profileMetadata.publicRole.niche}
                    onChange={(e) => setProfileMetadata(prev => ({
                      ...prev,
                      publicRole: { ...prev.publicRole, niche: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="creativeStrengths">Kreativa styrkor</Label>
                  <Textarea
                    id="creativeStrengths"
                    value={profileMetadata.publicRole.creativeStrengths}
                    onChange={(e) => setProfileMetadata(prev => ({
                      ...prev,
                      publicRole: { ...prev.publicRole, creativeStrengths: e.target.value }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Life Map */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Livskarta</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Plats</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={profileMetadata.lifeMap.location}
                      onChange={(e) => setProfileMetadata(prev => ({
                        ...prev,
                        lifeMap: { ...prev.lifeMap, location: e.target.value }
                      }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="livingWith">Bor med</Label>
                  <Input
                    id="livingWith"
                    value={profileMetadata.lifeMap.livingWith}
                    onChange={(e) => setProfileMetadata(prev => ({
                      ...prev,
                      lifeMap: { ...prev.lifeMap, livingWith: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="hasChildren">Har barn</Label>
                  <Select 
                    value={profileMetadata.lifeMap.hasChildren} 
                    onValueChange={(value) => setProfileMetadata(prev => ({
                      ...prev,
                      lifeMap: { ...prev.lifeMap, hasChildren: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Ja</SelectItem>
                      <SelectItem value="no">Nej</SelectItem>
                      <SelectItem value="planning">Planerar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ongoingChanges">Pågående förändringar</Label>
                  <Textarea
                    id="ongoingChanges"
                    value={profileMetadata.lifeMap.ongoingChanges}
                    onChange={(e) => setProfileMetadata(prev => ({
                      ...prev,
                      lifeMap: { ...prev.lifeMap, ongoingChanges: e.target.value }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="manager" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Managerinformation</CardTitle>
              <CardDescription>Kontaktuppgifter för klientens manager eller representant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="managerName">Managers namn</Label>
                  <Input
                    id="managerName"
                    value={managerInfo.manager_name}
                    onChange={(e) => setManagerInfo(prev => ({ ...prev, manager_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="managerEmail">Managers email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="managerEmail"
                      type="email"
                      value={managerInfo.manager_email}
                      onChange={(e) => setManagerInfo(prev => ({ ...prev, manager_email: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="additional" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Inställningar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="velocityScore">Velocity Score</Label>
                  <Input
                    id="velocityScore"
                    type="number"
                    min="0"
                    max="100"
                    value={additionalSettings.velocity_score}
                    onChange={(e) => setAdditionalSettings(prev => ({ 
                      ...prev, 
                      velocity_score: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Anteckningar</Label>
                  <Textarea
                    id="notes"
                    placeholder="Interna anteckningar om klienten..."
                    value={additionalSettings.notes}
                    onChange={(e) => setAdditionalSettings(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taggar</CardTitle>
                <CardDescription>Lägg till taggar för att organisera klienter</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ny tagg..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag} variant="outline">
                    Lägg till
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {additionalSettings.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Avbryt
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            "Sparar..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Spara profil
            </>
          )}
        </Button>
      </div>
    </div>
  );
}