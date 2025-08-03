import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useWelcomeAssessment } from '@/hooks/useWelcomeAssessment';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  ArrowRight, 
  Star, 
  Target, 
  TrendingUp, 
  CheckCircle,
  Lightbulb,
  Heart,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';

/**
 * 🧠 AI INSIGHTS PAGE - 16-åringar måste förstå vad de ska göra
 * Visar tydligt vad AI:n har analyserat och vad nästa steg är
 */
export const AIInsights = () => {
  const { user, profile } = useAuth();
  const { getLatestWelcomeAssessment, loading } = useWelcomeAssessment();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    const loadInsights = async () => {
      if (!user) return;
      
      const latestAssessment = await getLatestWelcomeAssessment();
      if (latestAssessment) {
        setAssessment(latestAssessment);
        
        // Parse AI analysis if it exists
        if (latestAssessment.ai_analysis) {
          setInsights(latestAssessment.ai_analysis);
        }
        
        // Parse recommendations
        if (latestAssessment.recommendations) {
          setRecommendations(latestAssessment.recommendations.recommended_pillars || []);
        }
      }
    };

    loadInsights();
  }, [user, getLatestWelcomeAssessment]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Inga AI-insikter än 🤔</h2>
            <p className="text-muted-foreground mb-4">
              Du behöver göra din första självbedömning för att Stefan ska kunna hjälpa dig.
            </p>
            <Button onClick={() => navigate('/client-dashboard')}>
              Tillbaka till start
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-success';
    if (score >= 6) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreText = (score: number) => {
    if (score >= 8) return 'Bra! 😊';
    if (score >= 6) return 'Okej 😐';
    return 'Behöver förbättras 😕';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" onClick={() => navigate('/client-dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            🤖 Stefans AI-analys av dig
          </h1>
          <p className="text-muted-foreground">
            Här är vad Stefan upptäckte om dig när du gjorde självbedömningen
          </p>
        </div>
      </div>

      {/* Quick Summary */}
      <Alert className="border-primary/20 bg-primary/5">
        <Brain className="h-4 w-4" />
        <AlertDescription>
          <strong>Snabb sammanfattning:</strong> Stefan har analyserat alla dina svar och hittat 
          de områden där du är starkast och där du kan utvecklas mest. Här ser du allt på ett enkelt sätt! 🎯
        </AlertDescription>
      </Alert>

      {/* Wheel of Life Results */}
      {assessment.wheel_of_life_scores && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              🎯 Dina livsområden - hur du mår just nu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Du bedömde dig själv på 8 olika områden i livet. Här är resultatet:
            </p>
            
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(assessment.wheel_of_life_scores).map(([area, score]: [string, any]) => (
                <div key={area} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">{area}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                      {score}/10
                    </span>
                    <span className="text-sm">{getScoreText(score)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              🧠 Vad Stefan tänker om dig
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Stefan säger:</p>
                <div className="whitespace-pre-wrap text-sm">{insights}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-success" />
              ✨ Stefans förslag till dig
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Baserat på dina svar rekommenderar Stefan att du börjar med dessa områden:
            </p>
            
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-4 bg-success/5 border border-success/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <Heart className="h-4 w-4 text-success" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-success-foreground">
                        {rec.pillar_name || rec.name || `Rekommendation ${index + 1}`}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rec.reasoning || rec.description || 'Stefan tror att detta område kommer hjälpa dig mest just nu.'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            🚀 Vad gör du nu?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Nu när du vet vad Stefan tänker om dig, här är vad du kan göra härnäst:
          </p>
          
          <div className="space-y-3">
            <Button 
              className="w-full justify-between h-auto p-4"
              onClick={() => navigate('/client-dashboard?tab=pillars')}
            >
              <div className="text-left">
                <div className="font-medium">🎯 Börja utveckla dig</div>
                <div className="text-sm opacity-80">Välj vilka områden du vill fokusera på</div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-between h-auto p-4"
              onClick={() => navigate('/messages')}
            >
              <div className="text-left">
                <div className="font-medium">💬 Prata med Stefan</div>
                <div className="text-sm opacity-80">Ställ frågor om din analys</div>
              </div>
              <MessageSquare className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-between h-auto p-4"
              onClick={() => navigate('/client-dashboard')}
            >
              <div className="text-left">
                <div className="font-medium">📊 Se allt om din resa</div>
                <div className="text-sm opacity-80">Gå tillbaka till din huvudsida</div>
              </div>
              <CheckCircle className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Date */}
      {assessment.created_at && (
        <div className="text-center text-sm text-muted-foreground">
          Analys gjord: {new Date(assessment.created_at).toLocaleDateString('sv-SE')}
        </div>
      )}
    </div>
  );
};