import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { 
  ArrowLeft, 
  Brain, 
  TrendingUp, 
  RefreshCw,
  Calendar,
  Filter,
  Download,
  Eye,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useClientData } from '@/hooks/useClientData';
import { supabase } from '@/integrations/supabase/client';
import { SocialWidget } from '@/components/SocialWidget';
import { SwedishNewsWidget } from '@/components/SwedishNewsWidget';
import { DataCollectorWidget } from '@/components/DataCollectorWidget';
import { IntelligenceOverview } from '@/components/Intelligence/IntelligenceOverview';
import { IntelligenceTrends } from '@/components/Intelligence/IntelligenceTrends';
import { IntelligenceNewsSlider } from '@/components/Intelligence/IntelligenceNewsSlider';
import { IntelligenceExport } from '@/components/Intelligence/IntelligenceExport';
import { DateRange } from 'react-day-picker';

interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  client_category?: string;
}

export const Intelligence = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [cacheData, setCacheData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedDataType, setSelectedDataType] = useState<string>('all');
  
  const { getClientCacheData, getNewsMentions, getSocialMetrics } = useClientData();
  
  const isCoachView = hasRole('coach') || hasRole('admin');
  const displayName = userProfile ? 
    `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || userProfile.email || 'Användare' 
    : 'Användare';

  useEffect(() => {
    if (userId && user) {
      loadIntelligenceData();
      
      // Real-time updates
      const channel = supabase
        .channel('intelligence-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'client_data_cache',
            filter: `user_id=eq.${userId}`
          },
          () => loadIntelligenceData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId, user]);

  useEffect(() => {
    applyFilters();
  }, [cacheData, dateRange, selectedDataType]);

  const loadIntelligenceData = async () => {
    if (!userId || !user) return;
    
    setLoading(true);
    try {
      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        toast({
          title: "Fel",
          description: "Kunde inte ladda användardata",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      // SUPERADMIN GOD MODE: Let superadmin access any user, even if not found initially
      if (!profileData && !hasRole('superadmin')) {
        toast({
          title: "Användare hittades inte",
          description: "Du har inte behörighet att se denna användare",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setUserProfile(profileData);

      // Load intelligence cache data
      const cache = await getClientCacheData(userId);
      setCacheData(cache);

    } catch (error) {
      console.error('Error in loadIntelligenceData:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel inträffade",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...cacheData];

    // Filter by date range
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= dateRange.from! && itemDate <= dateRange.to!;
      });
    }

    // Filter by data type
    if (selectedDataType !== 'all') {
      filtered = filtered.filter(item => item.data_type === selectedDataType);
    }

    setFilteredData(filtered);
  };

  const clearFilters = () => {
    setDateRange(undefined);
    setSelectedDataType('all');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Laddar intelligence-data...</div>
      </div>
    );
  }

  // SUPERADMIN GOD MODE: Display special message for superadmin if user not found
  if (!userProfile) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          {hasRole('superadmin') ? (
            <>
              <h2 className="text-xl font-semibold mb-2">⚡ Superadmin Åtkomst</h2>
              <p className="text-muted-foreground">Som superadmin har du full åtkomst, men denna användare finns inte i systemet.</p>
            </>
          ) : (
            'Användare hittades inte'
          )}
        </div>
      </div>
    );
  }

  const newsItems = getNewsMentions(filteredData);
  const socialMetrics = getSocialMetrics(filteredData);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka
        </Button>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Intelligence - {displayName}</h1>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {isCoachView ? 'Coach-vy' : 'Klient-vy'}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Omfattande dataanalys och insights från sociala medier och nyheter
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={loadIntelligenceData} 
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Uppdaterar...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Uppdatera
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Tidslinje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Datumintervall</label>
              <DatePickerWithRange 
                date={dateRange} 
                onDateChange={setDateRange}
                className="w-full"
              />
            </div>
            
            <div className="min-w-48">
              <label className="text-sm font-medium mb-2 block">Datatyp</label>
              <Select value={selectedDataType} onValueChange={setSelectedDataType}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj datatyp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla datatyper</SelectItem>
                  <SelectItem value="news">Nyheter</SelectItem>
                  <SelectItem value="social_metrics">Sociala metrics</SelectItem>
                  <SelectItem value="ai_analysis">AI-analys</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" onClick={clearFilters}>
              Rensa filter
            </Button>
            
            <IntelligenceExport 
              userId={userId!} 
              userData={filteredData}
              userProfile={userProfile}
            />
          </div>
          
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Visar {filteredData.length} av {cacheData.length} datapunkter
            </div>
            {dateRange?.from && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {dateRange.from.toLocaleDateString('sv-SE')} - {dateRange.to?.toLocaleDateString('sv-SE')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="trends">Trender & Analys</TabsTrigger>
          <TabsTrigger value="news">Nyheter & Media</TabsTrigger>
          <TabsTrigger value="social">Sociala Medier</TabsTrigger>
          <TabsTrigger value="collector">Datainsamling</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <IntelligenceOverview 
            userData={filteredData}
            userProfile={userProfile}
            isCoachView={isCoachView}
          />
        </TabsContent>

        {/* Trends & Analysis Tab */}
        <TabsContent value="trends" className="space-y-6">
          <IntelligenceTrends 
            userData={filteredData}
            userProfile={userProfile}
            isCoachView={isCoachView}
          />
        </TabsContent>

        {/* News & Media Tab */}
        <TabsContent value="news" className="space-y-6">
          <IntelligenceNewsSlider 
            newsItems={newsItems}
            userName={displayName}
            isCoachView={isCoachView}
          />
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-6">
          <SocialWidget socialMetrics={socialMetrics} />
        </TabsContent>

        {/* Data Collection Tab */}
        <TabsContent value="collector" className="space-y-6">
          <DataCollectorWidget 
            clientId={userId} 
            clientName={displayName}
            onDataCollected={loadIntelligenceData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};