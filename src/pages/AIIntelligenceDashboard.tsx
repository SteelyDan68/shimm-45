/**
 * 🧠 AI INTELLIGENCE DASHBOARD
 * Central hub för alla AI-drivna coaching och analytics funktioner
 * Phase 3: AI Intelligence Revolution - KOMPLETT
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Lightbulb, BarChart3, Sparkles } from 'lucide-react';
import { AutonomousCoachingEngine } from '@/components/AI/AutonomousCoachingEngine';
import { SmartRecommendationEngine } from '@/components/AI/SmartRecommendationEngine';
import { PredictiveAnalytics } from '@/components/AI/PredictiveAnalytics';
import { useAuth } from '@/providers/UnifiedAuthProvider';

export const AIIntelligenceDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 p-6">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 flex items-center justify-center mb-4">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent">
          AI Intelligence Dashboard
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Enterprise-grade AI för coaching, rekommendationer och prediktiv analys av din utvecklingsresa
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Autonomous Coaching
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Smart Recommendations
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Predictive Analytics
          </Badge>
        </div>
      </div>

      {/* AI Intelligence Tabs */}
      <Tabs defaultValue="coaching" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="coaching" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Autonomous Coaching
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Smart Recommendations
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Predictive Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coaching">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Autonomous Coaching Engine
              </CardTitle>
              <CardDescription>
                AI-driven coaching insights som proaktivt identifierar utvecklingsmöjligheter och utmaningar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AutonomousCoachingEngine userId={user?.id} autoMode={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-500" />
                Smart Recommendation Engine
              </CardTitle>
              <CardDescription>
                Personaliserade rekommendationer baserade på neuroplasticitet och adaptivt lärande
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SmartRecommendationEngine userId={user?.id} maxRecommendations={6} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                Predictive Analytics
              </CardTitle>
              <CardDescription>
                Prediktiv analys för att förutse och optimera din utvecklingsresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PredictiveAnalytics userId={user?.id} timeframe={30} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Achievement Badge */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="text-center py-6">
          <Sparkles className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-purple-900">Phase 3: AI Intelligence Revolution</h3>
          <p className="text-purple-700 text-sm mt-1">
            ✅ Autonomous Coaching ✅ Smart Recommendations ✅ Predictive Analytics
          </p>
        </CardContent>
      </Card>
    </div>
  );
};