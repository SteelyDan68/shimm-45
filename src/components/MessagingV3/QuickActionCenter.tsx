import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useRoleCache } from '@/hooks/useRoleCache';
import { useStefanInterventions } from '@/hooks/useStefanInterventions';
import { useNavigation } from '@/hooks/useNavigation';
import {
  Brain,
  MessageSquare,
  TrendingUp,
  Target,
  Calendar,
  CheckSquare,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle,
  Heart,
  Activity,
  BarChart3,
  User
} from 'lucide-react';

/**
 * 🎯 QUICK ACTION CENTER - Centralized action hub
 */

export const QuickActionCenter: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin } = useRoleCache();
  const { performBehaviorAnalysis, analyzing, createIntervention, loading } = useStefanInterventions();
  const { navigateTo } = useNavigation();

  const handleTestMessage = async (triggerType: string) => {
    if (!user || !isAdmin) return;
    
    const testMessages = {
      inactivity_check: 'Test: Hej! Hur går din utveckling idag?',
      progress_celebration: 'Test: Fantastiska framsteg! Fortsätt så här! 🎉',
      task_reminder: 'Test: Påminnelse om dina viktigaste uppgifter.',
      motivation_boost: 'Test: Du gör ett fantastiskt jobb! 💪',
      assessment_prompt: 'Test: Dags för en ny utvärdering!',
      pillar_focus: 'Test: Låt oss fokusera på Self Care idag.'
    };

    const message = testMessages[triggerType as keyof typeof testMessages] || 'Test message';
    await createIntervention(triggerType, message, 'medium', { 
      test_message: true, 
      created_by_admin: user.id 
    });
  };

  const quickActions = [
    {
      title: 'Kör AI-Analys',
      description: 'Få personliga insikter om din utveckling',
      icon: Brain,
      action: performBehaviorAnalysis,
      disabled: analyzing,
      loading: analyzing,
      variant: 'default' as const,
      color: 'bg-purple-500'
    },
    {
      title: 'Min Profil',
      description: 'Uppdatera personlig information',
      icon: User,
      action: () => navigateTo('/edit-profile'),
      variant: 'outline' as const
    },
    {
      title: 'Mina Uppgifter',
      description: 'Se och hantera dina uppgifter',
      icon: CheckSquare,
      action: () => navigateTo('/tasks'),
      variant: 'outline' as const
    },
    {
      title: 'Kalender',
      description: 'Planera dina aktiviteter',
      icon: Calendar,
      action: () => navigateTo('/calendar'),
      variant: 'outline' as const
    },
    {
      title: 'Sex Pelare',
      description: 'Din utvecklingsresa',
      icon: Target,
      action: () => navigateTo('/six-pillars'),
      variant: 'outline' as const
    },
    {
      title: 'Analytics Dashboard',
      description: 'Se din utveckling över tid',
      icon: BarChart3,
      action: () => navigateTo('/user-analytics'),
      variant: 'outline' as const
    }
  ];

  const adminTestActions = [
    {
      title: 'Test Inaktivitet',
      description: 'Simulera inaktivitetsmeddelande',
      icon: Clock,
      action: () => handleTestMessage('inactivity_check'),
      color: 'text-orange-600'
    },
    {
      title: 'Test Framsteg',
      description: 'Simulera framstegsmeddelande',
      icon: CheckCircle,
      action: () => handleTestMessage('progress_celebration'),
      color: 'text-green-600'
    },
    {
      title: 'Test Påminnelse',
      description: 'Simulera påminnelsemeddelande',
      icon: AlertCircle,
      action: () => handleTestMessage('task_reminder'),
      color: 'text-blue-600'
    },
    {
      title: 'Test Motivation',
      description: 'Simulera motivationsmeddelande',
      icon: Heart,
      action: () => handleTestMessage('motivation_boost'),
      color: 'text-pink-600'
    },
    {
      title: 'Test Assessment',
      description: 'Simulera utvärderingsmeddelande',
      icon: Target,
      action: () => handleTestMessage('assessment_prompt'),
      color: 'text-purple-600'
    },
    {
      title: 'Test Pillar',
      description: 'Simulera pelar-meddelande',
      icon: Activity,
      action: () => handleTestMessage('pillar_focus'),
      color: 'text-indigo-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Snabbåtgärder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${action.color || 'bg-primary/10'}`}>
                      <action.icon className={`h-5 w-5 ${action.color ? 'text-white' : 'text-primary'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">{action.title}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{action.description}</p>
                      <Button
                        size="sm"
                        variant={action.variant}
                        onClick={action.action}
                        disabled={action.disabled || loading}
                        className="w-full"
                      >
                        {action.loading ? (
                          <>
                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-2" />
                            Analyserar...
                          </>
                        ) : (
                          action.title
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admin Test Functions */}
      {isAdmin && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              🔧 Admin Test-funktioner
              <Badge variant="secondary" className="text-xs">Endast admin</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {adminTestActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={action.action}
                  disabled={loading}
                  className="justify-start text-left h-auto p-3"
                >
                  <div className="flex items-center gap-2 w-full">
                    <action.icon className={`h-4 w-4 ${action.color}`} />
                    <div className="text-left">
                      <div className="font-medium text-xs">{action.title}</div>
                      <div className="text-xs text-muted-foreground">{action.description}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help & Support */}
      <Card>
        <CardHeader>
          <CardTitle>Behöver du hjälp?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Om du har frågor eller behöver support, tveka inte att kontakta oss.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              Kontakta Support
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <TrendingUp className="h-4 w-4 mr-2" />
              Guide & Tips
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};