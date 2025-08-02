import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  CheckCircle, 
  Lightbulb,
  Zap,
  ArrowRight,
  Heart,
  Star,
  DollarSign
} from 'lucide-react';

interface AIInsight {
  category: 'styrka' | 'utvecklingsområde' | 'snabb_vinst';
  title: string;
  description: string;
  actionable_steps: string[];
  neuroplastic_principle: string;
  estimated_impact: 'hög' | 'medium' | 'låg';
  timeframe: string;
  pillar_connection?: string;
}

interface SimplifiedAIInsightsProps {
  insights: AIInsight[];
  assessmentType: string;
  score?: number;
  onCreateTodos?: (insights: AIInsight[]) => void;
  className?: string;
}

/**
 * SCRUM Expert-Team Implementation för AI-rapporter:
 * - Product Manager: Enkla, genomförbara insights för maximal användaradoption
 * - Behavioral Scientist: Neuroplastiska principer för varaktig förändring  
 * - UI/UX Expert: "Lagom stora stycken" och tydlig prioritering
 * - Educator: Scaffolded progression från insight till handling
 * - Data Scientist: Evidensbaserade rekommendationer
 */
export const SimplifiedAIInsights = ({ 
  insights, 
  assessmentType, 
  score, 
  onCreateTodos,
  className 
}: SimplifiedAIInsightsProps) => {

  const getCategoryIcon = (category: AIInsight['category']) => {
    switch (category) {
      case 'styrka': return <Star className="h-4 w-4 text-green-600" />;
      case 'utvecklingsområde': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'snabb_vinst': return <Zap className="h-4 w-4 text-yellow-600" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: AIInsight['category']) => {
    switch (category) {
      case 'styrka': return 'bg-green-50 border-green-200';
      case 'utvecklingsområde': return 'bg-blue-50 border-blue-200';
      case 'snabb_vinst': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getImpactColor = (impact: AIInsight['estimated_impact']) => {
    switch (impact) {
      case 'hög': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'låg': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPillarIcon = (pillar?: string) => {
    switch (pillar) {
      case 'self_care': return <Heart className="h-4 w-4" />;
      case 'economy': return <DollarSign className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  // Gruppera insights per kategori för pedagogisk struktur
  const groupedInsights = insights.reduce((acc, insight) => {
    if (!acc[insight.category]) {
      acc[insight.category] = [];
    }
    acc[insight.category].push(insight);
    return acc;
  }, {} as Record<string, AIInsight[]>);

  const categoryTitles = {
    'styrka': 'Dina styrkor att bygga vidare på',
    'utvecklingsområde': 'Områden för tillväxt',
    'snabb_vinst': 'Snabba vinster (börja här!)'
  };

  const categoryDescriptions = {
    'styrka': 'Dessa är dina naturliga talanger som du kan använda för att accelerera din utveckling.',
    'utvecklingsområde': 'Här har du störst potential för transformation och tillväxt.',
    'snabb_vinst': 'Små förändringar som kan ge stora resultat redan inom några veckor.'
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header med score */}
      {score && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  AI-analys: {assessmentType}
                </CardTitle>
                <p className="text-muted-foreground">Personliga insikter baserat på dina svar</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{score}/10</div>
                <div className="text-sm text-muted-foreground">Nuvarande nivå</div>
              </div>
            </div>
            <Progress value={score * 10} className="mt-4" />
          </CardHeader>
        </Card>
      )}

      {/* Neuroplastisk motivation */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900 mb-2">Din hjärna är redo för förändring</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Genom att fokusera på små, konsekventa steg skapar du nya neuronala banor som gör positiva 
                förändringar automatiska. AI har analyserat dina svar och skapat en personlig utvecklingsplan 
                baserad på neuroplastikens principer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights grupperade per kategori */}
      {Object.entries(groupedInsights).map(([category, categoryInsights]) => (
        <div key={category} className="space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
              {getCategoryIcon(category as AIInsight['category'])}
              {categoryTitles[category as keyof typeof categoryTitles]}
            </h2>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
              {categoryDescriptions[category as keyof typeof categoryDescriptions]}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {categoryInsights.map((insight, index) => (
              <Card key={index} className={getCategoryColor(insight.category)}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getCategoryIcon(insight.category)}
                        {insight.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Badge variant="outline" className={getImpactColor(insight.estimated_impact)}>
                        {insight.estimated_impact} påverkan
                      </Badge>
                      {insight.pillar_connection && (
                        <Badge variant="outline" className="text-xs">
                          {getPillarIcon(insight.pillar_connection)}
                          {insight.pillar_connection}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Neuroplastisk princip */}
                  <div className="bg-white/60 p-3 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm font-medium text-purple-700 mb-1">
                      <Brain className="h-3 w-3" />
                      Neuroplastisk strategi
                    </div>
                    <p className="text-xs text-muted-foreground">{insight.neuroplastic_principle}</p>
                  </div>

                  {/* Konkreta steg */}
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Konkreta nästa steg:
                    </h4>
                    <div className="space-y-2">
                      {insight.actionable_steps.slice(0, 3).map((step, stepIndex) => (
                        <div key={stepIndex} className="flex items-start gap-2 text-sm">
                          <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                            {stepIndex + 1}
                          </div>
                          <span className="leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tidsram */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Tidsram: {insight.timeframe}
                    </div>
                    {category === 'snabb_vinst' && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Börja denna vecka!
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Call to Action för ToDo-skapande */}
      {onCreateTodos && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Target className="h-6 w-6 text-green-600" />
                <h3 className="text-xl font-semibold">Är du redo att börja?</h3>
              </div>
              <p className="text-muted-foreground max-w-md mx-auto">
                Låt AI skapa konkreta uppgifter baserat på dina insights. Varje uppgift är designad 
                för att maximera neuroplastisk utveckling genom små, genomförbara steg.
              </p>
              <Button 
                onClick={() => onCreateTodos(insights)}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                Skapa mina utvecklingsuppgifter
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Neuroplastiska påminnelser */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <h4 className="font-medium flex items-center justify-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              Kom ihåg: Små steg, stora resultat
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-blue-600">21 dagar</div>
                <div className="text-muted-foreground">för att bilda nya neuronala banor</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600">66 dagar</div>
                <div className="text-muted-foreground">för automatiska beteenden</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-purple-600">Daglig träning</div>
                <div className="text-muted-foreground">stärker hjärnans plasticitet</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};