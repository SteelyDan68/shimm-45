import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdvancedAnalyticsDashboard } from '@/components/Analytics/AdvancedAnalyticsDashboard';
import { BusinessIntelligenceEngine } from '@/components/Analytics/BusinessIntelligenceEngine';
import { PredictiveInsightsEngine } from '@/components/Analytics/PredictiveInsightsEngine';

export default function AdvancedAnalyticsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Phase 5: Advanced Analytics Revolution</h1>
        <p className="text-muted-foreground">Enterprise-grade analytics med AI-powered insights</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Analytics Overview</TabsTrigger>
          <TabsTrigger value="business">Business Intelligence</TabsTrigger>
          <TabsTrigger value="predictive">Predictive Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AdvancedAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="business">
          <BusinessIntelligenceEngine />
        </TabsContent>

        <TabsContent value="predictive">
          <PredictiveInsightsEngine />
        </TabsContent>
      </Tabs>
    </div>
  );
}