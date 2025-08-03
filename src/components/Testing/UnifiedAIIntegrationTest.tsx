import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  AlertTriangle,
  TestTube,
  Brain,
  MessageSquare,
  Target
} from 'lucide-react';
import { useUnifiedAI } from '@/hooks/useUnifiedAI';
import { useToast } from '@/hooks/use-toast';

/**
 * 🧪 INTEGRATION TEST SUITE för Unified AI Orchestrator
 * - Testar alla AI actions mot riktiga edge functions
 * - Validerar error handling och performance
 * - Verifierar data flow end-to-end
 */
export const UnifiedAIIntegrationTest = () => {
  const { 
    stefanChat, 
    coachingAnalysis, 
    assessmentAnalysis, 
    messageAssistant, 
    planningGeneration, 
    habitAnalysis,
    healthCheck,
    loading 
  } = useUnifiedAI();
  
  const { toast } = useToast();
  
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');

  // Test definitions
  const testSuite = [
    {
      id: 'health_check',
      name: 'AI Health Check',
      description: 'Verificar att AI-tjänster är tillgängliga',
      icon: <TestTube className="h-4 w-4" />,
      test: async () => {
        const result = await healthCheck();
        return {
          success: result.status === 'healthy',
          data: result,
          details: `Primary: ${result.primary}, Status: ${result.status}`
        };
      }
    },
    {
      id: 'stefan_chat',
      name: 'Stefan Chat Integration',
      description: 'Testa Stefan AI chat funktionalitet',
      icon: <Brain className="h-4 w-4" />,
      test: async () => {
        const result = await stefanChat({
          message: 'Hej Stefan, detta är ett integrationstest. Svara kort att allt fungerar.',
          conversationHistory: []
        });
        return {
          success: !!result && result.message.length > 10,
          data: result,
          details: result ? `Response: ${result.message.substring(0, 50)}...` : 'Inget svar'
        };
      }
    },
    {
      id: 'coaching_analysis',
      name: 'Coaching Analysis',
      description: 'Testa AI coaching analysis',
      icon: <Target className="h-4 w-4" />,
      test: async () => {
        const result = await coachingAnalysis({
          sessionType: 'assessment',
          userContext: { goals: ['Bättre stresshantering'], preferences: {} },
          assessmentData: { stress_level: 7, energy_level: 4 }
        });
        return {
          success: !!result && result.analysis,
          data: result,
          details: result ? `Analysis generated with ${result.analysis.recommendations?.length || 0} recommendations` : 'Ingen analys'
        };
      }
    },
    {
      id: 'assessment_analysis',
      name: 'Assessment Analysis',
      description: 'Testa assessment analys funktionalitet',
      icon: <CheckCircle className="h-4 w-4" />,
      test: async () => {
        const result = await assessmentAnalysis({
          assessmentType: 'welcome_test',
          scores: { self_care: 6, stress: 4, energy: 5 },
          responses: { main_challenge: 'Stresshantering i vardagen' },
          pillarKey: 'self_care'
        });
        return {
          success: !!result && result.analysis.length > 20,
          data: result,
          details: result ? `Analysis: ${result.analysis.substring(0, 50)}...` : 'Ingen analys'
        };
      }
    },
    {
      id: 'message_assistant',
      name: 'Message Assistant',
      description: 'Testa AI message assistant',
      icon: <MessageSquare className="h-4 w-4" />,
      test: async () => {
        const result = await messageAssistant({
          messageContent: 'Jag behöver hjälp med att hantera stress på jobbet.',
          senderName: 'Test User',
          context: 'Coaching konversation'
        });
        return {
          success: !!result && result.suggestion.length > 10,
          data: result,
          details: result ? `Suggestion: ${result.suggestion.substring(0, 50)}...` : 'Inget förslag'
        };
      }
    },
    {
      id: 'error_handling',
      name: 'Error Handling Test',
      description: 'Testa felhantering vid ogiltiga requests',
      icon: <AlertTriangle className="h-4 w-4" />,
      test: async () => {
        try {
          // Skicka ogiltiga data för att testa error handling
          const result = await stefanChat({
            message: '', // Tom message ska trigga fel
            conversationHistory: []
          });
          return {
            success: false,
            data: result,
            details: 'Förväntade fel men fick resultat'
          };
        } catch (error) {
          return {
            success: true, // Vi FÖRVÄNTAR oss fel här
            data: { error: error instanceof Error ? error.message : 'Unknown error' },
            details: 'Error handling fungerar korrekt'
          };
        }
      }
    }
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults({});
    
    for (const test of testSuite) {
      setCurrentTest(test.id);
      
      try {
        const startTime = Date.now();
        const result = await test.test();
        const duration = Date.now() - startTime;
        
        setTestResults(prev => ({
          ...prev,
          [test.id]: {
            ...result,
            duration,
            timestamp: new Date().toISOString()
          }
        }));
        
        // Kort paus mellan tester
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        setTestResults(prev => ({
          ...prev,
          [test.id]: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: 0,
            timestamp: new Date().toISOString()
          }
        }));
      }
    }
    
    setCurrentTest('');
    setIsRunning(false);
    
    // Sammanfatta resultat
    const results = Object.values(testResults);
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    
    toast({
      title: `Integration Test Completed`,
      description: `${passed}/${total} tests passed`,
      variant: passed === total ? "default" : "destructive"
    });
  };

  const runSingleTest = async (testId: string) => {
    const test = testSuite.find(t => t.id === testId);
    if (!test) return;
    
    setCurrentTest(testId);
    
    try {
      const startTime = Date.now();
      const result = await test.test();
      const duration = Date.now() - startTime;
      
      setTestResults(prev => ({
        ...prev,
        [testId]: {
          ...result,
          duration,
          timestamp: new Date().toISOString()
        }
      }));
      
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testId]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: 0,
          timestamp: new Date().toISOString()
        }
      }));
    }
    
    setCurrentTest('');
  };

  const getTestStatus = (testId: string) => {
    const result = testResults[testId];
    if (!result) return 'pending';
    return result.success ? 'passed' : 'failed';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Unified AI Integration Test Suite
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Comprehensive testing av alla AI-funktioner för att säkerställa production-readiness.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={runAllTests}
              disabled={isRunning || loading}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Kör tester...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Kör alla tester
                </>
              )}
            </Button>
            
            {Object.keys(testResults).length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {Object.values(testResults).filter(r => r.success).length} / {Object.keys(testResults).length} tester godkända
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="grid gap-4">
        {testSuite.map(test => {
          const status = currentTest === test.id ? 'running' : getTestStatus(test.id);
          const result = testResults[test.id];
          
          return (
            <Card key={test.id} className={`border-l-4 ${
              status === 'passed' ? 'border-l-green-500' :
              status === 'failed' ? 'border-l-red-500' :
              status === 'running' ? 'border-l-blue-500' : 'border-l-gray-300'
            }`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {test.icon}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{test.name}</h3>
                        <Badge className={getStatusColor(status)}>
                          {getStatusIcon(status)}
                          <span className="ml-1">
                            {status === 'running' ? 'Kör...' : 
                             status === 'passed' ? 'Godkänd' :
                             status === 'failed' ? 'Misslyckad' : 'Väntar'}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{test.description}</p>
                      
                      {result && (
                        <div className="space-y-2">
                          <div className="text-sm">
                            <strong>Resultat:</strong> {result.details}
                          </div>
                          {result.duration > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Svarstid: {result.duration}ms
                            </div>
                          )}
                          {result.data && result.success && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground">
                                Visa rådata
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </details>
                          )}
                          {result.error && (
                            <Alert className="mt-2">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription className="text-sm">
                                <strong>Fel:</strong> {result.error}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runSingleTest(test.id)}
                    disabled={isRunning || loading || currentTest === test.id}
                  >
                    {currentTest === test.id ? 'Kör...' : 'Testa'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Results Summary */}
      {Object.keys(testResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Sammanfattning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(testResults).filter(r => r.success).length}
                  </div>
                  <div className="text-sm text-green-600">Godkända tester</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {Object.values(testResults).filter(r => !r.success).length}
                  </div>
                  <div className="text-sm text-red-600">Misslyckade tester</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(Object.values(testResults).reduce((acc, r) => acc + r.duration, 0) / Object.values(testResults).length)}ms
                  </div>
                  <div className="text-sm text-blue-600">Genomsnittlig svarstid</div>
                </div>
              </div>
              
              {Object.values(testResults).some(r => !r.success) && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Varning:</strong> Ett eller flera tester misslyckades. 
                    Systemet är inte redo för production förrän alla tester går igenom.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};