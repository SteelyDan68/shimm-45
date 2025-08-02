import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdvancedAICoaching } from '@/hooks/useAdvancedAICoaching';
import { 
  Brain, 
  Target, 
  Clock, 
  TrendingUp, 
  Play, 
  Pause, 
  Calendar,
  Star,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

export function CoachingDashboard() {
  const {
    currentSession,
    isAnalyzing,
    recommendations,
    coachingPlan,
    sessionHistory,
    hasActiveSession,
    sessionDuration,
    totalSessions,
    averageSessionRating,
    startCoachingSession,
    endCoachingSession,
    generateCoachingPlan,
    implementRecommendation,
    scheduleFollowUp
  } = useAdvancedAICoaching();

  const [sessionFeedback, setSessionFeedback] = useState({ rating: 5, comment: '' });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🔴';
      default: return '⚪';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'action': return <Target className="h-4 w-4" />;
      case 'reflection': return <Brain className="h-4 w-4" />;
      case 'learning': return <BookOpen className="h-4 w-4" />;
      case 'habit': return <CheckCircle className="h-4 w-4" />;
      case 'goal': return <Star className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const handleStartSession = async (type: 'assessment' | 'planning' | 'review' | 'emergency') => {
    await startCoachingSession(type);
  };

  const handleEndSession = async () => {
    await endCoachingSession({
      ...sessionFeedback,
      implementedRecommendations: []
    });
    setSessionFeedback({ rating: 5, comment: '' });
  };

  const formatSessionDuration = (duration: number) => {
    const minutes = Math.floor(duration / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            AI Coaching
          </h1>
          <p className="text-muted-foreground">
            Personlig AI-coach för din utvecklingsresa
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {hasActiveSession && (
            <Badge variant="outline" className="px-3 py-1">
              <Clock className="h-3 w-3 mr-1" />
              {formatSessionDuration(sessionDuration)}
            </Badge>
          )}
          
          {!hasActiveSession ? (
            <div className="flex gap-2">
              <Button 
                onClick={() => handleStartSession('assessment')}
                disabled={isAnalyzing}
              >
                <Play className="h-4 w-4 mr-2" />
                Starta session
              </Button>
              <Button 
                variant="outline"
                onClick={() => generateCoachingPlan()}
                disabled={isAnalyzing}
              >
                Skapa plan
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline"
              onClick={handleEndSession}
            >
              <Pause className="h-4 w-4 mr-2" />
              Avsluta session
            </Button>
          )}
        </div>
      </div>

      {isAnalyzing && (
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">AI:n analyserar din situation...</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Totala sessioner
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {sessionHistory.length > 0 && `Senaste: ${formatDistanceToNow(
                new Date(sessionHistory[sessionHistory.length - 1]?.startTime || Date.now()),
                { addSuffix: true, locale: sv }
              )}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Genomsnittlig rating
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageSessionRating.toFixed(1)}/5
            </div>
            <p className="text-xs text-muted-foreground">
              Baserat på dina feedback
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aktiva rekommendationer
            </CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recommendations.length}</div>
            <p className="text-xs text-muted-foreground">
              Personaliserade råd från AI
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">Rekommendationer</TabsTrigger>
          <TabsTrigger value="plan">Coaching Plan</TabsTrigger>
          <TabsTrigger value="session">Aktuell Session</TabsTrigger>
          <TabsTrigger value="history">Historik</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Inga rekommendationer</h3>
                <p className="text-muted-foreground mb-4">
                  Starta en coaching-session för att få personaliserade råd
                </p>
                <Button onClick={() => handleStartSession('assessment')}>
                  Starta Assessment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <Card key={rec.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(rec.type)}
                        <CardTitle className="text-lg">{rec.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(rec.priority) as any}>
                          {rec.priority}
                        </Badge>
                        <span className="text-sm">
                          {getDifficultyIcon(rec.difficulty)} {rec.estimatedTime}min
                        </span>
                      </div>
                    </div>
                    <CardDescription>
                      {rec.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Beskrivning:</p>
                      <p>{rec.description}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Motivering:</p>
                      <p className="text-sm">{rec.reasoning}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Förväntat resultat:</p>
                      <p className="text-sm">{rec.expectedOutcome}</p>
                    </div>

                    {rec.metrics && rec.metrics.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Mätvärden:</p>
                        <div className="flex flex-wrap gap-1">
                          {rec.metrics.map((metric, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {metric}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {rec.resources && rec.resources.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Resurser:</p>
                        <div className="space-y-2">
                          {rec.resources.map((resource, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <Badge variant="outline">{resource.type}</Badge>
                              <span>{resource.title}</span>
                              {resource.url && (
                                <a 
                                  href={resource.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  Öppna
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => implementRecommendation(rec.id)}
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Implementera
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => scheduleFollowUp(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schemalägg uppföljning
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          {!coachingPlan ? (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Ingen coaching plan</h3>
                <p className="text-muted-foreground mb-4">
                  Skapa en personaliserad utvecklingsplan med AI
                </p>
                <Button onClick={() => generateCoachingPlan()}>
                  Generera Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personlig Utvecklingsplan</CardTitle>
                  <CardDescription>
                    {coachingPlan.duration} dagar • {coachingPlan.focusAreas.join(', ')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold mb-2">Fokusområden:</h4>
                      <div className="flex flex-wrap gap-1">
                        {coachingPlan.focusAreas.map((area, index) => (
                          <Badge key={index} variant="secondary">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Nästa milstolpe:</h4>
                      <p className="text-sm text-muted-foreground">
                        {coachingPlan.milestones[0]?.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Veckovis plan:</h3>
                {coachingPlan.weeklyGoals.map((week) => (
                  <Card key={week.week}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Vecka {week.week}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium mb-2">Mål:</h5>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {week.goals.map((goal, index) => (
                              <li key={index}>{goal}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">Aktiviteter:</h5>
                          <div className="space-y-2">
                            {week.activities.map((activity, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                {getTypeIcon(activity.type)}
                                <span>{activity.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  {activity.estimatedTime}min
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="session" className="space-y-4">
          {!hasActiveSession ? (
            <Card>
              <CardContent className="text-center py-8">
                <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Ingen aktiv session</h3>
                <p className="text-muted-foreground mb-4">
                  Starta en coaching-session för personlig vägledning
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => handleStartSession('assessment')}>
                    Assessment
                  </Button>
                  <Button variant="outline" onClick={() => handleStartSession('planning')}>
                    Planering
                  </Button>
                  <Button variant="outline" onClick={() => handleStartSession('review')}>
                    Återblick
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Aktiv Coaching Session</CardTitle>
                  <Badge variant="outline">
                    {currentSession?.type}
                  </Badge>
                </div>
                <CardDescription>
                  Pågående i {formatSessionDuration(sessionDuration)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Session feedback:</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-muted-foreground">Rating (1-5):</label>
                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setSessionFeedback(prev => ({ ...prev, rating: star }))}
                            className={`text-lg ${star <= sessionFeedback.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                          >
                            ⭐
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Kommentar (valfri):</label>
                      <textarea
                        value={sessionFeedback.comment}
                        onChange={(e) => setSessionFeedback(prev => ({ ...prev, comment: e.target.value }))}
                        className="w-full mt-1 p-2 border rounded text-sm"
                        rows={3}
                        placeholder="Hur var denna session?"
                      />
                    </div>
                  </div>
                </div>
                
                <Button onClick={handleEndSession} className="w-full">
                  Avsluta Session
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {sessionHistory.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Ingen historik</h3>
                <p className="text-muted-foreground">
                  Dina coaching-sessioner kommer att visas här
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sessionHistory.slice().reverse().map((session) => (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {session.type === 'assessment' && 'Bedömning'}
                        {session.type === 'planning' && 'Planering'}
                        {session.type === 'review' && 'Återblick'}
                        {session.type === 'emergency' && 'Akut stöd'}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {session.userFeedback?.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-sm">{session.userFeedback.rating}/5</span>
                          </div>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(session.startTime, { addSuffix: true, locale: sv })}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Varaktighet:</span> {
                          session.endTime 
                            ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60))
                            : '?'
                        } minuter
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Rekommendationer:</span> {session.recommendations.length}
                      </p>
                      {session.userFeedback?.implementedRecommendations && (
                        <p className="text-sm">
                          <span className="font-medium">Genomförda:</span> {session.userFeedback.implementedRecommendations.length}
                        </p>
                      )}
                      {session.userFeedback?.comment && (
                        <p className="text-sm">
                          <span className="font-medium">Kommentar:</span> {session.userFeedback.comment}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}