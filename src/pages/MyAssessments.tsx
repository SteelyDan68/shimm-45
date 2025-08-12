/**
 * 🎯 MY ASSESSMENTS - CORE DELIVERABLE #1
 * Formaterade assessment-resultat som huvudprodukt för klienten
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Calendar, 
  TrendingUp, 
  Heart, 
  Lightbulb, 
  Star, 
  Palette, 
  DollarSign,
  Route,
  Download,
  Eye,
  BarChart3,
  Brain,
  ArrowLeft
} from 'lucide-react';

interface AssessmentResult {
  id: string;
  pillar_type: string;
  created_at: string;
  scores?: Record<string, number>;
  responses?: Record<string, any>;
  ai_analysis?: string;
  completion_percentage?: number;
  // Add fields from the actual database schema
  answers?: any;
  comments?: string;
  form_definition_id?: string;
  updated_at?: string;
  user_id?: string;
  created_by?: string;
}

const PILLAR_CONFIG = {
  'self_care': { 
    name: 'Self Care', 
    icon: Heart, 
    color: 'hsl(var(--self-care))',
    bgColor: 'hsl(var(--self-care) / 0.1)',
    description: 'Din fysiska och mentala hälsa'
  },
  'skills': { 
    name: 'Skills', 
    icon: Lightbulb, 
    color: 'hsl(var(--skills))',
    bgColor: 'hsl(var(--skills) / 0.1)',
    description: 'Dina kompetenser och färdigheter'
  },
  'talent': { 
    name: 'Talent', 
    icon: Star, 
    color: 'hsl(var(--talent))',
    bgColor: 'hsl(var(--talent) / 0.1)',
    description: 'Dina naturliga styrkor och begåvningar'
  },
  'brand': { 
    name: 'Brand', 
    icon: Palette, 
    color: 'hsl(var(--brand))',
    bgColor: 'hsl(var(--brand) / 0.1)',
    description: 'Din personliga varumärkesbyggnad'
  },
  'economy': { 
    name: 'Economy', 
    icon: DollarSign, 
    color: 'hsl(var(--economy))',
    bgColor: 'hsl(var(--economy) / 0.1)',
    description: 'Din ekonomiska utveckling'
  },
  'open_track': { 
    name: 'Öppet spår', 
    icon: Route, 
    color: 'hsl(var(--primary))',
    bgColor: 'hsl(var(--primary) / 0.1)',
    description: 'Din personliga utvecklingsresa'
  }
};

export const MyAssessments: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    if (user) {
      loadAssessments();
    }
  }, [user]);

  const loadAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_rounds')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Map database results to our interface
      const mappedData = (data || []).map(item => ({
        ...item,
        responses: typeof item.answers === 'object' ? item.answers : {},
        scores: typeof item.scores === 'object' && item.scores ? 
          Object.fromEntries(
            Object.entries(item.scores).map(([key, val]) => [key, typeof val === 'number' ? val : 0])
          ) : {},
        completion_percentage: 100 // Assume completed assessments are 100%
      }));
      setAssessments(mappedData);
    } catch (error) {
      console.error('Error loading assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallScore = (scores?: Record<string, number>) => {
    if (!scores || Object.keys(scores).length === 0) return 0;
    const values = Object.values(scores);
    return values.reduce((sum, score) => sum + score, 0) / values.length;
  };

  const formatAssessmentDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  const renderAssessmentDetail = (assessment: AssessmentResult) => {
    const pillarConfig = PILLAR_CONFIG[assessment.pillar_type as keyof typeof PILLAR_CONFIG];
    const IconComponent = pillarConfig?.icon || FileText;
    const overallScore = calculateOverallScore(assessment.scores);

    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="p-3 rounded-lg"
                style={{ 
                  backgroundColor: pillarConfig?.bgColor,
                  color: pillarConfig?.color 
                }}
              >
                <IconComponent className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {pillarConfig?.name || assessment.pillar_type} Självskattning
                </CardTitle>
                <CardDescription>
                  Genomförd {formatAssessmentDate(assessment.created_at)}
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setSelectedAssessment(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Övergripande Resultat</h3>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {Math.round(overallScore)}/10
              </Badge>
            </div>
            <Progress value={overallScore * 10} className="h-3 mb-2" />
            <p className="text-sm text-muted-foreground">
              Baserat på dina svar inom {pillarConfig?.description || 'detta område'}
            </p>
          </div>

          {/* Detailed Scores */}
          {assessment.scores && Object.keys(assessment.scores).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Detaljerade Resultat
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(assessment.scores).map(([key, value]) => (
                  <div key={key} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-lg font-bold">{value}/10</span>
                    </div>
                    <Progress value={value * 10} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Responses Preview */}
          {assessment.responses && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dina Svar
              </h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Här är ett urval av dina svar från bedömningen:
                </p>
                <div className="space-y-2">
                  {Object.entries(assessment.responses)
                    .slice(0, 3)
                    .map(([question, answer]) => (
                      <div key={question} className="border-l-2 border-primary pl-3">
                        <p className="text-sm font-medium">{question}:</p>
                        <p className="text-sm text-muted-foreground">
                          {typeof answer === 'string' ? answer.substring(0, 150) + '...' : String(answer)}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis Preview */}
          {assessment.ai_analysis && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Stefan AI Analys
              </h3>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm">
                  {assessment.ai_analysis.substring(0, 300)}...
                </p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto mt-2"
                  onClick={() => navigate('/my-analyses')}
                >
                  Se fullständig analys →
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => {
                // TODO: Implement PDF export
                console.log('Exporting assessment as PDF');
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Ladda ner som PDF
            </Button>
            <Button 
              className="flex-1"
              onClick={() => navigate('/my-analyses')}
            >
              <Brain className="h-4 w-4 mr-2" />
              Se AI-Analys
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Laddar dina självskattningar...</p>
      </div>
    );
  }

  if (selectedAssessment) {
    return (
      <div className="container mx-auto p-6">
        {renderAssessmentDetail(selectedAssessment)}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Mina Självskattningar</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Här ser du alla dina genomförda självskattningar formaterade som vackra rapporter. 
          Varje självskattning visar dina svar och poäng inom respektive område.
        </p>
      </div>

      {/* No Assessments State */}
      {assessments.length === 0 && (
        <Alert className="max-w-2xl mx-auto">
          <TrendingUp className="h-4 w-4" />
          <AlertDescription className="text-center">
            <div className="space-y-3">
              <p><strong>Du har inte genomfört några självskattningar än.</strong></p>
              <p>Börja med att göra din första självskattning för att få personliga insikter och rekommendationer från Stefan AI.</p>
              <Button 
                className="mt-3"
                onClick={() => navigate('/client-dashboard?startAssessment=true')}
              >
                Gör din första självskattning
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Assessments Grid */}
      {assessments.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Dina Genomförda Självskattningar ({assessments.length})
            </h2>
            <Button 
              variant="outline"
              onClick={() => navigate('/client-dashboard?startAssessment=true')}
            >
              Gör ny självskattning
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((assessment) => {
              const pillarConfig = PILLAR_CONFIG[assessment.pillar_type as keyof typeof PILLAR_CONFIG];
              const IconComponent = pillarConfig?.icon || FileText;
              const overallScore = calculateOverallScore(assessment.scores);

              return (
                <Card 
                  key={assessment.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4"
                  style={{ borderLeftColor: pillarConfig?.color }}
                  onClick={() => setSelectedAssessment(assessment)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-3 rounded-lg"
                        style={{ 
                          backgroundColor: pillarConfig?.bgColor,
                          color: pillarConfig?.color 
                        }}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {pillarConfig?.name || assessment.pillar_type}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatAssessmentDate(assessment.created_at)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Övergripande Resultat</span>
                        <Badge variant="secondary">
                          {Math.round(overallScore)}/10
                        </Badge>
                      </div>
                      <Progress value={overallScore * 10} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {assessment.scores ? Object.keys(assessment.scores).length : 0} områden bedömda
                      </span>
                      <div className="flex items-center gap-1 text-primary">
                        <Eye className="h-3 w-3" />
                        <span>Visa detaljer</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};