import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Globe,
  Brain,
  Search,
  Share2,
  AlertTriangle,
  Settings,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ApiStatus {
  name: string;
  icon: any;
  status: 'checking' | 'success' | 'error' | 'pending';
  message: string;
  responseTime?: number;
  enabled: boolean;
  category: 'ai' | 'data' | 'social';
}

export const EnhancedApiStatusChecker = () => {
  const { toast } = useToast();
  const [apis, setApis] = useState<ApiStatus[]>([
    { name: 'OpenAI API', icon: Brain, status: 'pending', message: 'Inte testad än', enabled: true, category: 'ai' },
    { name: 'Gemini API', icon: Brain, status: 'pending', message: 'Inte testad än', enabled: true, category: 'ai' },
    { name: 'Firecrawl API', icon: Globe, status: 'pending', message: 'Inte testad än', enabled: true, category: 'data' },
    { name: 'Google Search API', icon: Search, status: 'pending', message: 'Inte testad än', enabled: true, category: 'data' },
    { name: 'Social Blade API', icon: Share2, status: 'pending', message: 'Inte testad än', enabled: true, category: 'social' },
    { name: 'RapidAPI Instagram', icon: Share2, status: 'pending', message: 'Inte testad än', enabled: true, category: 'social' },
    { name: 'RapidAPI TikTok', icon: Share2, status: 'pending', message: 'Inte testad än', enabled: true, category: 'social' },
    { name: 'RapidAPI YouTube', icon: Share2, status: 'pending', message: 'Inte testad än', enabled: true, category: 'social' }
  ]);
  
  const [isChecking, setIsChecking] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const updateApiStatus = (apiName: string, status: 'checking' | 'success' | 'error', message: string, responseTime?: number) => {
    setApis(prev => prev.map(api => 
      api.name === apiName 
        ? { ...api, status, message, responseTime }
        : api
    ));
  };

  const toggleApiEnabled = (apiName: string) => {
    setApis(prev => prev.map(api => 
      api.name === apiName 
        ? { ...api, enabled: !api.enabled }
        : api
    ));
  };

  const testSingleApi = async (apiName: string) => {
    const api = apis.find(a => a.name === apiName);
    if (!api || !api.enabled) return;

    updateApiStatus(apiName, 'checking', 'Testar...');

    try {
      switch (apiName) {
        case 'OpenAI API':
          await testOpenAiApi();
          break;
        case 'Gemini API':
          await testGeminiApi();
          break;
        case 'RapidAPI Instagram':
          await testDataCollectorApi('rapidapi_instagram');
          break;
        case 'RapidAPI TikTok':
          await testDataCollectorApi('rapidapi_tiktok');
          break;
        case 'RapidAPI YouTube':
          await testDataCollectorApi('rapidapi_youtube');
          break;
        case 'Firecrawl API':
          await testDataCollectorApi('firecrawl');
          break;
        case 'Google Search API':
          await testDataCollectorApi('google_search');
          break;
        case 'Social Blade API':
          await testDataCollectorApi('social_blade');
          break;
        default:
          updateApiStatus(apiName, 'error', 'Okänt API');
      }
    } catch (error: any) {
      updateApiStatus(apiName, 'error', `Fel: ${error.message}`);
    }
  };

  const checkAllApis = async () => {
    setIsChecking(true);
    
    // Reset enabled APIs to checking
    setApis(prev => prev.map(api => 
      api.enabled 
        ? { ...api, status: 'checking' as const, message: 'Testar...' }
        : api
    ));

    try {
      const enabledApis = apis.filter(api => api.enabled);
      
      // Test AI APIs
      if (enabledApis.some(api => api.name === 'OpenAI API')) {
        await testOpenAiApi();
      }
      if (enabledApis.some(api => api.name === 'Gemini API')) {
        await testGeminiApi();
      }
      
      // Test Data Collector APIs
      const dataApis = enabledApis.filter(api => 
        ['Firecrawl API', 'Google Search API', 'Social Blade API', 'RapidAPI Instagram', 'RapidAPI TikTok', 'RapidAPI YouTube'].includes(api.name)
      );
      if (dataApis.length > 0) {
        await testDataCollectorApis();
      }
      
    } catch (error) {
      console.error('Error checking APIs:', error);
      toast({
        title: "Fel vid API-test",
        description: "Ett fel inträffade vid testning av API:er",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const testOpenAiApi = async () => {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('client-logic', {
        body: { test_mode: true }
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        updateApiStatus('OpenAI API', 'error', `Fel: ${error.message}`, responseTime);
      } else if (data?.test_success) {
        updateApiStatus('OpenAI API', 'success', 'API fungerar korrekt', responseTime);
      } else {
        updateApiStatus('OpenAI API', 'error', 'Oväntad respons från API', responseTime);
      }
    } catch (error: any) {
      updateApiStatus('OpenAI API', 'error', `Nätverksfel: ${error.message}`);
    }
  };

  const testGeminiApi = async () => {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('gemini-research', {
        body: { 
          test_mode: true,
          query: 'API test' 
        }
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        updateApiStatus('Gemini API', 'error', `Fel: ${error.message}`, responseTime);
      } else if (data?.test_success) {
        updateApiStatus('Gemini API', 'success', 'API fungerar korrekt', responseTime);
      } else {
        updateApiStatus('Gemini API', 'error', 'Oväntad respons från API', responseTime);
      }
    } catch (error: any) {
      updateApiStatus('Gemini API', 'error', `Nätverksfel: ${error.message}`);
    }
  };

  const testDataCollectorApi = async (specificTest: string) => {
    const startTime = Date.now();
    
    // Map friendly names to API test identifiers
    const testMapping: { [key: string]: string } = {
      'firecrawl': 'Firecrawl API',
      'google_search': 'Google Search API', 
      'social_blade': 'Social Blade API',
      'rapidapi_instagram': 'RapidAPI Instagram',
      'rapidapi_tiktok': 'RapidAPI TikTok',
      'rapidapi_youtube': 'RapidAPI YouTube'
    };
    
    const apiName = testMapping[specificTest];
    if (!apiName) {
      updateApiStatus('Unknown API', 'error', 'Okänt API test');
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('data-collector', {
        body: { test_mode: true }
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        updateApiStatus(apiName, 'error', `Fel: ${error.message}`, responseTime);
      } else if (data?.test_results) {
        const results = data.test_results;
        const result = results[specificTest];
        
        if (result) {
          updateApiStatus(apiName, 
            result.success ? 'success' : 'error',
            result.message || 'Okänt fel',
            responseTime
          );
        } else {
          updateApiStatus(apiName, 'error', 'Inget testresultat mottaget', responseTime);
        }
      }
    } catch (error: any) {
      updateApiStatus(apiName, 'error', `Nätverksfel: ${error.message}`);
    }
  };

  const testDataCollectorApis = async () => {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('data-collector', {
        body: { test_mode: true }
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        // Mark all enabled data collector APIs as error
        const dataApis = ['Firecrawl API', 'Google Search API', 'Social Blade API', 'RapidAPI Instagram', 'RapidAPI TikTok', 'RapidAPI YouTube'];
        dataApis.forEach(apiName => {
          const api = apis.find(a => a.name === apiName);
          if (api?.enabled) {
            updateApiStatus(apiName, 'error', `Fel: ${error.message}`, responseTime);
          }
        });
      } else if (data?.test_results) {
        const results = data.test_results;
        
        if (apis.find(a => a.name === 'Firecrawl API')?.enabled) {
          updateApiStatus('Firecrawl API', 
            results.firecrawl?.success ? 'success' : 'error',
            results.firecrawl?.message || 'Okänt fel',
            responseTime
          );
        }

        if (apis.find(a => a.name === 'RapidAPI YouTube')?.enabled) {
          updateApiStatus('RapidAPI YouTube',
            results.rapidapi_youtube?.success ? 'success' : 'error',
            results.rapidapi_youtube?.message || 'Okänt fel',
            responseTime
          );
        }
        
        if (apis.find(a => a.name === 'Google Search API')?.enabled) {
          updateApiStatus('Google Search API',
            results.google_search?.success ? 'success' : 'error', 
            results.google_search?.message || 'Okänt fel',
            responseTime
          );
        }
        
        if (apis.find(a => a.name === 'Social Blade API')?.enabled) {
          updateApiStatus('Social Blade API',
            results.social_blade?.success ? 'success' : 'error',
            results.social_blade?.message || 'Okänt fel', 
            responseTime
          );
        }
        
        if (apis.find(a => a.name === 'RapidAPI Instagram')?.enabled) {
          updateApiStatus('RapidAPI Instagram',
            results.rapidapi_instagram?.success ? 'success' : 'error',
            results.rapidapi_instagram?.message || 'Okänt fel',
            responseTime
          );
        }

        if (apis.find(a => a.name === 'RapidAPI TikTok')?.enabled) {
          updateApiStatus('RapidAPI TikTok',
            results.rapidapi_tiktok?.success ? 'success' : 'error',
            results.rapidapi_tiktok?.message || 'Okänt fel',
            responseTime
          );
        }
      }
    } catch (error: any) {
      const dataApis = ['Firecrawl API', 'Google Search API', 'Social Blade API', 'RapidAPI Instagram', 'RapidAPI TikTok', 'RapidAPI YouTube'];
      dataApis.forEach(apiName => {
        const api = apis.find(a => a.name === apiName);
        if (api?.enabled) {
          updateApiStatus(apiName, 'error', `Nätverksfel: ${error.message}`);
        }
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'error': return <XCircle className="h-5 w-5 text-destructive" />;
      case 'checking': return <RefreshCw className="h-5 w-5 text-primary animate-spin" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge variant="secondary" className="bg-success/10 text-success">Fungerar</Badge>;
      case 'error': return <Badge variant="destructive">Fel</Badge>;
      case 'checking': return <Badge variant="outline" className="border-primary text-primary">Testar...</Badge>;
      default: return <Badge variant="outline">Väntande</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ai': return <Brain className="h-4 w-4" />;
      case 'data': return <Globe className="h-4 w-4" />;
      case 'social': return <Share2 className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const enabledApis = apis.filter(api => api.enabled);
  const allSuccess = enabledApis.every(api => api.status === 'success');
  const anyError = enabledApis.some(api => api.status === 'error');

  const groupedApis = {
    ai: apis.filter(api => api.category === 'ai'),
    data: apis.filter(api => api.category === 'data'),
    social: apis.filter(api => api.category === 'social')
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {allSuccess && <CheckCircle className="h-5 w-5 text-success" />}
              {anyError && <AlertTriangle className="h-5 w-5 text-warning" />}
              API Status & Management
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-refresh" className="text-sm">Auto-uppdatering</Label>
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
              </div>
              <Button 
                onClick={checkAllApis}
                disabled={isChecking}
                size="sm"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testar...
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    Testa aktiverade API:er
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-2xl">{enabledApis.length}</h4>
              <p className="text-sm text-muted-foreground">Aktiverade API:er</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-2xl text-success">{enabledApis.filter(api => api.status === 'success').length}</h4>
              <p className="text-sm text-muted-foreground">Fungerar</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-2xl text-destructive">{enabledApis.filter(api => api.status === 'error').length}</h4>
              <p className="text-sm text-muted-foreground">Med fel</p>
            </div>
          </div>

          {allSuccess && enabledApis.length > 0 && (
            <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
              <p className="text-sm text-success flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Alla aktiverade API:er fungerar korrekt och är redo för live-data
              </p>
            </div>
          )}
          
          {anyError && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Vissa API:er har problem. Kontrollera API-nycklar och konfiguration.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI APIs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI APIs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {groupedApis.ai.map((api) => {
              const Icon = api.icon;
              return (
                <div key={api.name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={api.enabled}
                      onCheckedChange={() => toggleApiEnabled(api.name)}
                    />
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{api.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {api.message}
                        {api.responseTime && (
                          <span className="ml-2 text-xs">({api.responseTime}ms)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testSingleApi(api.name)}
                      disabled={!api.enabled || api.status === 'checking'}
                    >
                      Testa
                    </Button>
                    {getStatusIcon(api.status)}
                    {getStatusBadge(api.status)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data Collection APIs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Data Collection APIs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {groupedApis.data.map((api) => {
              const Icon = api.icon;
              return (
                <div key={api.name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={api.enabled}
                      onCheckedChange={() => toggleApiEnabled(api.name)}
                    />
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{api.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {api.message}
                        {api.responseTime && (
                          <span className="ml-2 text-xs">({api.responseTime}ms)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testSingleApi(api.name)}
                      disabled={!api.enabled || api.status === 'checking'}
                    >
                      Testa
                    </Button>
                    {getStatusIcon(api.status)}
                    {getStatusBadge(api.status)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Social Media APIs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Social Media APIs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {groupedApis.social.map((api) => {
              const Icon = api.icon;
              return (
                <div key={api.name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={api.enabled}
                      onCheckedChange={() => toggleApiEnabled(api.name)}
                    />
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{api.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {api.message}
                        {api.responseTime && (
                          <span className="ml-2 text-xs">({api.responseTime}ms)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testSingleApi(api.name)}
                      disabled={!api.enabled || api.status === 'checking'}
                    >
                      Testa
                    </Button>
                    {getStatusIcon(api.status)}
                    {getStatusBadge(api.status)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};