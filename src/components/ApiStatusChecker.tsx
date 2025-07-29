import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Youtube,
  Twitter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ApiStatus {
  name: string;
  icon: any;
  status: 'checking' | 'success' | 'error' | 'pending';
  message: string;
  responseTime?: number;
}

export const ApiStatusChecker = () => {
  const { toast } = useToast();
  const [apis, setApis] = useState<ApiStatus[]>([
    { name: 'OpenAI API', icon: Brain, status: 'pending', message: 'Inte testad än' },
    { name: 'Gemini API', icon: Brain, status: 'pending', message: 'Inte testad än' },
    { name: 'YouTube Data API', icon: Youtube, status: 'pending', message: 'Inte testad än' },
    // { name: 'Twitter API', icon: Twitter, status: 'pending', message: 'Inte testad än' }, // REMOVED
    { name: 'Firecrawl API', icon: Globe, status: 'pending', message: 'Inte testad än' },
    { name: 'Google Search API', icon: Search, status: 'pending', message: 'Inte testad än' },
    { name: 'Social Blade API', icon: Share2, status: 'pending', message: 'Inte testad än' }
  ]);
  const [isChecking, setIsChecking] = useState(false);

  const updateApiStatus = (apiName: string, status: 'checking' | 'success' | 'error', message: string, responseTime?: number) => {
    setApis(prev => prev.map(api => 
      api.name === apiName 
        ? { ...api, status, message, responseTime }
        : api
    ));
  };

  const checkAllApis = async () => {
    setIsChecking(true);
    
    // Reset all to checking
    setApis(prev => prev.map(api => ({ ...api, status: 'checking' as const, message: 'Testar...' })));

    try {
      // Test OpenAI API via edge function
      await testOpenAiApi();
      
      // Test Gemini API via edge function
      await testGeminiApi();
      
      // Test Data Collector APIs (includes Firecrawl, Google Search, Social Blade, YouTube)
      await testDataCollectorApis();
      
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

  const testDataCollectorApis = async () => {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('data-collector', {
        body: { test_mode: true }
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        // Mark all data collector APIs as error
        updateApiStatus('Firecrawl API', 'error', `Fel: ${error.message}`, responseTime);
        updateApiStatus('Google Search API', 'error', `Fel: ${error.message}`, responseTime);
        updateApiStatus('Social Blade API', 'error', `Fel: ${error.message}`, responseTime);
        updateApiStatus('YouTube Data API', 'error', `Fel: ${error.message}`, responseTime);
        // updateApiStatus('Twitter API', 'error', `Fel: ${error.message}`, responseTime); // REMOVED
      } else if (data?.test_results) {
        // Update each API based on individual test results
        const results = data.test_results;
        
        updateApiStatus('Firecrawl API', 
          results.firecrawl?.success ? 'success' : 'error',
          results.firecrawl?.message || 'Okänt fel',
          responseTime
        );
        
        updateApiStatus('Google Search API',
          results.google_search?.success ? 'success' : 'error', 
          results.google_search?.message || 'Okänt fel',
          responseTime
        );
        
        updateApiStatus('Social Blade API',
          results.social_blade?.success ? 'success' : 'error',
          results.social_blade?.message || 'Okänt fel', 
          responseTime
        );

        updateApiStatus('YouTube Data API',
          results.youtube_api?.success ? 'success' : 'error',
          results.youtube_api?.message || 'Okänt fel',
          responseTime
        );
      } else {
        updateApiStatus('Firecrawl API', 'error', 'Oväntad respons från API', responseTime);
        updateApiStatus('Google Search API', 'error', 'Oväntad respons från API', responseTime);
        updateApiStatus('Social Blade API', 'error', 'Oväntad respons från API', responseTime);
        updateApiStatus('YouTube Data API', 'error', 'Oväntad respons från API', responseTime);
      }
    } catch (error: any) {
      updateApiStatus('Firecrawl API', 'error', `Nätverksfel: ${error.message}`);
      updateApiStatus('Google Search API', 'error', `Nätverksfel: ${error.message}`);
      updateApiStatus('Social Blade API', 'error', `Nätverksfel: ${error.message}`);
      updateApiStatus('YouTube Data API', 'error', `Nätverksfel: ${error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'checking': return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-800">Fungerar</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-800">Fel</Badge>;
      case 'checking': return <Badge className="bg-blue-100 text-blue-800">Testar...</Badge>;
      default: return <Badge variant="outline">Väntande</Badge>;
    }
  };

  const allSuccess = apis.every(api => api.status === 'success');
  const anyError = apis.some(api => api.status === 'error');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {allSuccess && <CheckCircle className="h-5 w-5 text-green-600" />}
            {anyError && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
            API Status
          </CardTitle>
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
              'Testa alla API:er'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {apis.map((api) => {
            const Icon = api.icon;
            return (
              <div key={api.name} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
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
                  {getStatusIcon(api.status)}
                  {getStatusBadge(api.status)}
                </div>
              </div>
            );
          })}
        </div>
        
        {allSuccess && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Alla API:er fungerar korrekt och är redo för live-data
            </p>
          </div>
        )}
        
        {anyError && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Vissa API:er har problem. Kontrollera API-nycklar och konfiguration.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};