/**
 * 📋 TASKS OPTIMIZED PAGE - Neuroplastisk uppgiftshantering
 * SCRUM-TEAM IMPLEMENTATION: Balanserad uppgiftsvy med optimering
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  CheckSquare, 
  Brain, 
  TrendingUp,
  Calendar,
  Settings
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import TaskOptimizationSystem from '@/components/Tasks/TaskOptimizationSystem';
import { EnhancedCalendarView } from '@/components/Calendar/EnhancedCalendarView';
import { ClientTaskList } from '@/components/ClientTasks/ClientTaskList';

const TasksOptimized = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) {
    return <div>Laddar...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <CheckSquare className="h-10 w-10 text-blue-600" />
          <h1 className="text-4xl font-bold">Mina Uppgifter</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Neuroplastisk uppgiftshantering för optimal utveckling och välmående
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Översikt
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Uppgifter
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Kalender
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Optimering
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task List Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Senaste Uppgifter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ClientTaskList clientId={user.id} />
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setActiveTab('tasks')}
                  >
                    Se alla uppgifter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Optimization Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Neuroplastisk Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TaskOptimizationSystem 
                  userId={user.id}
                  onTasksOptimized={() => {
                    // Refresh data if needed
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Alla Uppgifter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ClientTaskList clientId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <EnhancedCalendarView 
            userId={user.id}
          />
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization">
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Neuroplastisk Uppgiftsoptimering
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Detta system använder neuroplastiska principer för att optimera dina uppgifter. 
                  Målet är att skapa en balans som främjar inlärning och utveckling utan överbelastning.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="font-semibold text-blue-600">60/40 Regel</div>
                    <div className="text-sm text-muted-foreground">60% bekväma, 40% utmanande uppgifter</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="font-semibold text-green-600">Optimal Balans</div>
                    <div className="text-sm text-muted-foreground">Maximerar neuroplastisk utveckling</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="font-semibold text-purple-600">Automatisk Justering</div>
                    <div className="text-sm text-muted-foreground">AI-driven optimering av arbetsbörda</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <TaskOptimizationSystem 
              userId={user.id}
              onTasksOptimized={() => {
                // Refresh tasks list
                window.location.reload();
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TasksOptimized;