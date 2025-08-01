import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Instagram, 
  Youtube, 
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useExtendedProfile } from '@/hooks/useExtendedProfile';
import { useToast } from '@/hooks/use-toast';
import type { ExtendedProfileData } from '@/types/extendedProfile';

interface ProfileCompletionGateProps {
  children: React.ReactNode;
  requiredForAssessments?: boolean;
}

export function ProfileCompletionGate({ children, requiredForAssessments = false }: ProfileCompletionGateProps) {
  const { user, profile } = useAuth();
  const { getExtendedProfile } = useExtendedProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [extendedProfile, setExtendedProfile] = useState<ExtendedProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadAndCheckProfile();
    }
  }, [user]);

  const loadAndCheckProfile = async () => {
    try {
      setLoading(true);
      const data = await getExtendedProfile();
      setExtendedProfile(data);
      
      if (data) {
        const { percentage, missing } = calculateCompletion(data);
        setCompletionPercentage(percentage);
        setMissingFields(missing);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = (data: ExtendedProfileData) => {
    const requiredFields = [
      { key: 'first_name', label: 'Förnamn', value: data.first_name },
      { key: 'last_name', label: 'Efternamn', value: data.last_name },
      { key: 'email', label: 'E-post', value: data.email },
      { key: 'phone', label: 'Telefon', value: data.phone },
      { key: 'date_of_birth', label: 'Födelsedata', value: data.date_of_birth },
      { key: 'primary_role', label: 'Primär roll', value: data.primary_role },
      { key: 'location', label: 'Plats', value: data.location || data.address?.city },
    ];

    const socialFields = [
      { key: 'instagram_handle', label: 'Instagram', value: data.instagram_handle },
      { key: 'youtube_handle', label: 'YouTube', value: data.youtube_handle },
      { key: 'tiktok_handle', label: 'TikTok', value: data.tiktok_handle },
      { key: 'facebook_handle', label: 'Facebook', value: data.facebook_handle },
      { key: 'twitter_handle', label: 'Twitter/X', value: data.twitter_handle },
    ];

    // Minst en social plattform krävs
    const hasSocialPlatform = socialFields.some(field => field.value);
    const allFields = [...requiredFields];
    
    if (!hasSocialPlatform) {
      allFields.push({ key: 'social_platform', label: 'Minst en social plattform', value: null });
    }

    const completedFields = requiredFields.filter(field => field.value).length + (hasSocialPlatform ? 1 : 0);
    const totalFields = requiredFields.length + 1; // +1 för social platform requirement
    
    const percentage = Math.round((completedFields / totalFields) * 100);
    const missing = allFields.filter(field => !field.value).map(field => field.label);

    return { percentage, missing };
  };

  const isProfileComplete = () => {
    return completionPercentage >= 100;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">Kontrollerar profilstatus...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If profile is complete, show children
  if (isProfileComplete()) {
    return <>{children}</>;
  }

  // Show completion gate
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <User className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-orange-800">
                Komplettera din profil för att fortsätta
              </CardTitle>
              <p className="text-orange-700 mt-1">
                För att få tillgång till alla funktioner behöver vi lite mer information om dig.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Profilkomplettering</span>
              <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          {/* Alert for assessments */}
          {requiredForAssessments && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Du måste komplettera din profil innan du kan göra bedömningar och assessments.
              </AlertDescription>
            </Alert>
          )}

          {/* Missing fields */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Information som saknas:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {missingFields.map((field, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-white border border-orange-200 rounded-lg">
                  <div className="p-1 bg-orange-100 rounded">
                    {field.includes('Instagram') && <Instagram className="h-3 w-3 text-orange-600" />}
                    {field.includes('YouTube') && <Youtube className="h-3 w-3 text-orange-600" />}
                    {field.includes('E-post') && <Mail className="h-3 w-3 text-orange-600" />}
                    {field.includes('Telefon') && <Phone className="h-3 w-3 text-orange-600" />}
                    {field.includes('Plats') && <MapPin className="h-3 w-3 text-orange-600" />}
                    {field.includes('roll') && <Briefcase className="h-3 w-3 text-orange-600" />}
                    {!field.includes('Instagram') && !field.includes('YouTube') && !field.includes('E-post') && 
                     !field.includes('Telefon') && !field.includes('Plats') && !field.includes('roll') && (
                      <User className="h-3 w-3 text-orange-600" />
                    )}
                  </div>
                  <span className="text-sm text-gray-700">{field}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Current profile data preview */}
          {extendedProfile && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Nuvarande information:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      <strong>Namn:</strong> {extendedProfile.first_name} {extendedProfile.last_name}
                    </span>
                  </div>
                  {extendedProfile.email && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        <strong>E-post:</strong> {extendedProfile.email}
                      </span>
                    </div>
                  )}
                  {extendedProfile.primary_role && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        <strong>Roll:</strong> {extendedProfile.primary_role}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  {extendedProfile.phone && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        <strong>Telefon:</strong> {extendedProfile.phone}
                      </span>
                    </div>
                  )}
                  {(extendedProfile.location || extendedProfile.address?.city) && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        <strong>Plats:</strong> {extendedProfile.location || extendedProfile.address?.city}
                      </span>
                    </div>
                  )}
                  {(extendedProfile.instagram_handle || extendedProfile.youtube_handle || 
                    extendedProfile.tiktok_handle || extendedProfile.facebook_handle || 
                    extendedProfile.twitter_handle) && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        <strong>Sociala plattformar:</strong> Ja
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => navigate(`/user/${user?.id}`)}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              <User className="h-4 w-4 mr-2" />
              Komplettera profil
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            
            {!requiredForAssessments && (
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                Hoppa över för tillfället
              </Button>
            )}
          </div>

          {/* Help text */}
          <div className="text-xs text-gray-600 bg-white p-3 rounded border border-orange-200">
            <p>
              <strong>Varför behöver vi denna information?</strong> Vi använder din profilinformation för att:
            </p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Skapa personliga rekommendationer</li>
              <li>Anpassa dina assessments efter din roll och situation</li>
              <li>Ge relevant guidance baserat på din bransch och plattformar</li>
              <li>Säkerställa att våra AI-verktyg förstår din kontext</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}