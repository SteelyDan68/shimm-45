import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { 
  Bot, 
  TrendingUp, 
  Target, 
  Calendar,
  ArrowRight,
  Brain,
  Sparkles,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface GuidanceMessage {
  id: string;
  type: 'progress' | 'recommendation' | 'insight' | 'reminder';
  title: string;
  message: string;
  action?: {
    label: string;
    href: string;
  };
  priority: 'high' | 'medium' | 'low';
  context?: string;
}

const StefanGuidanceWidget = () => {
  const { user } = useAuth();

  const { data: assessmentRounds } = useQuery({
    queryKey: ['assessment-rounds-guidance', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('assessment_rounds')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: activeRecommendations } = useQuery({
    queryKey: ['active-recommendations-guidance', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('ai_coaching_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(2);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Generate guidance messages based on user data
  const generateGuidanceMessages = (): GuidanceMessage[] => {
    const messages: GuidanceMessage[] = [];

    // No assessments yet
    if (!assessmentRounds || assessmentRounds.length === 0) {
      messages.push({
        id: 'no-assessments',
        type: 'recommendation',
        title: 'Välkommen till din utvecklingsresa!',
        message: 'Hej! Jag är Stefan, din AI-guide. För att kunna hjälpa dig bäst behöver jag först förstå dig bättre. Låt oss börja med din första assessment.',
        action: {
          label: 'Gör din första assessment',
          href: '/guided-assessment'
        },
        priority: 'high',
        context: 'onboarding'
      });
      return messages;
    }

    // Recent assessment completed
    const latestAssessment = assessmentRounds[0];
    const isRecentAssessment = latestAssessment && 
      (new Date().getTime() - new Date(latestAssessment.created_at).getTime()) < 24 * 60 * 60 * 1000; // Within 24 hours

    if (isRecentAssessment && latestAssessment.ai_analysis) {
      messages.push({
        id: 'recent-assessment',
        type: 'insight',
        title: 'Ny analys klar!',
        message: `Jag har analyserat din ${latestAssessment.pillar_type === 'self_care' ? 'Självomvårdnad' : latestAssessment.pillar_type}-assessment. Kolla in dina personliga insikter och rekommendationer.`,
        action: {
          label: 'Se analys',
          href: '/my-analyses'
        },
        priority: 'high',
        context: 'new_analysis'
      });
    }

    // Pending recommendations
    if (activeRecommendations && activeRecommendations.length > 0) {
      const overdueRecs = activeRecommendations.filter(rec => 
        rec.due_date && new Date(rec.due_date) < new Date()
      );

      if (overdueRecs.length > 0) {
        messages.push({
          id: 'overdue-recommendations',
          type: 'reminder',
          title: 'Glöm inte dina handlingsplaner',
          message: `Du har ${overdueRecs.length} rekommendation${overdueRecs.length > 1 ? 'er' : ''} som väntar. Små steg framåt ger stora resultat över tid!`,
          action: {
            label: 'Se mitt program',
            href: '/my-program'
          },
          priority: 'medium',
          context: 'overdue_tasks'
        });
      } else {
        messages.push({
          id: 'active-recommendations',
          type: 'progress',
          title: 'Fortsätt den goda utvecklingen',
          message: `Du har ${activeRecommendations.length} aktiv${activeRecommendations.length > 1 ? 'a' : ''} rekommendation${activeRecommendations.length > 1 ? 'er' : ''} att arbeta med. Vilken vill du fokusera på idag?`,
          action: {
            label: 'Öppna mitt program',
            href: '/my-program'
          },
          priority: 'medium',
          context: 'active_tasks'
        });
      }
    }

    // Suggest new assessments
    const completedPillars = assessmentRounds.map(ar => ar.pillar_type);
    const allPillars = ['self_care', 'skills', 'talent', 'brand', 'economy'];
    const incompletePillars = allPillars.filter(pillar => !completedPillars.includes(pillar));

    if (incompletePillars.length > 0 && completedPillars.length > 0) {
      const nextPillar = incompletePillars[0];
      const pillarNames: Record<string, string> = {
        'self_care': 'Självomvårdnad',
        'skills': 'Kompetenser',
        'talent': 'Talang', 
        'brand': 'Varumärke',
        'economy': 'Ekonomi'
      };

      messages.push({
        id: 'next-assessment',
        type: 'recommendation',
        title: 'Redo för nästa steg?',
        message: `Bra jobbat med dina assessments! Nästa område jag rekommenderar är ${pillarNames[nextPillar]}. Detta kommer ge oss en ännu djupare förståelse av din utveckling.`,
        action: {
          label: 'Fortsätt med assessment',
          href: '/guided-assessment'
        },
        priority: 'low',
        context: 'expand_assessment'
      });
    }

    // Default encouraging message
    if (messages.length === 0) {
      messages.push({
        id: 'general-encouragement',
        type: 'insight',
        title: 'Din utvecklingsresa fortsätter',
        message: 'Du gör framsteg! Kom ihåg att utveckling är en process - varje litet steg räknas. Vad vill du fokusera på idag?',
        action: {
          label: 'Se mitt program',
          href: '/my-program'
        },
        priority: 'low',
        context: 'encouragement'
      });
    }

    return messages.slice(0, 2); // Visa max 2 meddelanden
  };

  const guidanceMessages = generateGuidanceMessages();

  const getIcon = (type: string) => {
    switch (type) {
      case 'progress': return <TrendingUp className="h-4 w-4" />;
      case 'recommendation': return <Target className="h-4 w-4" />;
      case 'insight': return <Brain className="h-4 w-4" />;
      case 'reminder': return <Clock className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (guidanceMessages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {guidanceMessages.map((message) => (
        <Card key={message.id} className={`p-4 ${getPriorityColor(message.priority)}`}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white flex-shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-sm">{message.title}</h4>
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Stefan
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                {message.message}
              </p>
              {message.action && (
                <Button size="sm" variant="outline" asChild className="text-xs">
                  <a href={message.action.href}>
                    {getIcon(message.type)}
                    <span className="ml-2">{message.action.label}</span>
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default StefanGuidanceWidget;