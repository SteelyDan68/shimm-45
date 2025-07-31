import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { useDailyCheckIn } from '@/hooks/useDailyCheckIn';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, Heart, Zap, Brain, Target, TrendingUp } from 'lucide-react';
import type { DailyCheckIn } from '@/types/gamification';

export const DailyCheckInWidget: React.FC = () => {
  const { user } = useAuth();
  const { 
    todaysCheckIn, 
    submitCheckIn, 
    checkTodaysStatus, 
    getCheckInTrends,
    isLoading 
  } = useDailyCheckIn(user?.id);

  const [checkInData, setCheckInData] = useState({
    mood_score: 5,
    energy_level: 5,
    stress_level: 5,
    motivation_level: 5,
    pillar_focus: 'self_care',
    daily_intention: '',
    reflection_notes: ''
  });

  const [trends, setTrends] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (user?.id) {
      checkTodaysStatus();
      loadTrends();
    }
  }, [user?.id, checkTodaysStatus]);

  const loadTrends = async () => {
    if (user?.id) {
      const trendData = await getCheckInTrends(7);
      setTrends(trendData);
    }
  };

  const handleSubmit = async () => {
    const today = new Date().toISOString().split('T')[0];
    const success = await submitCheckIn({
      ...checkInData,
      date: today
    });
    if (success) {
      setShowForm(false);
      // Refresh both trends and today's status
      await loadTrends();
      await checkTodaysStatus();
    }
  };

  const pillars = [
    { key: 'self_care', name: 'Self Care', icon: Heart, description: 'Hälsa & välbefinnande' },
    { key: 'skills', name: 'Skills', icon: Brain, description: 'Kompetensutveckling' },
    { key: 'talent', name: 'Talent', icon: Zap, description: 'Naturliga gåvor' },
    { key: 'brand', name: 'Brand', icon: Target, description: 'Personlig image' },
    { key: 'economy', name: 'Economy', icon: TrendingUp, description: 'Ekonomisk stabilitet' }
  ];

  if (todaysCheckIn && !showForm) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <CardTitle className="text-lg">Dagens check-in genomförd!</CardTitle>
          </div>
          <CardDescription>
            Du checkade in kl. {new Date(todaysCheckIn.completed_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{todaysCheckIn.mood_score}</div>
              <div className="text-xs text-muted-foreground">Humör</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{todaysCheckIn.energy_level}</div>
              <div className="text-xs text-muted-foreground">Energi</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{10 - todaysCheckIn.stress_level}</div>
              <div className="text-xs text-muted-foreground">Balans</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{todaysCheckIn.motivation_level}</div>
              <div className="text-xs text-muted-foreground">Motivation</div>
            </div>
          </div>

          {trends && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">7-dagars trend:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`flex items-center justify-between ${trends.mood_trend > 0 ? 'text-green-600' : trends.mood_trend < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  <span>Humör</span>
                  <span>{trends.mood_trend > 0 ? '↗' : trends.mood_trend < 0 ? '↘' : '→'}</span>
                </div>
                <div className={`flex items-center justify-between ${trends.energy_trend > 0 ? 'text-green-600' : trends.energy_trend < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  <span>Energi</span>
                  <span>{trends.energy_trend > 0 ? '↗' : trends.energy_trend < 0 ? '↘' : '→'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="text-sm">
            <strong>Dagens fokus:</strong> {pillars.find(p => p.key === todaysCheckIn.pillar_focus)?.name}
          </div>
          
          {todaysCheckIn.daily_intention && (
            <div className="text-sm">
              <strong>Intention:</strong> {todaysCheckIn.daily_intention}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!showForm) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Daglig check-in</CardTitle>
          <CardDescription>
            Ta 2 minuter för att reflektera över din dag och fokusera din utveckling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowForm(true)} className="w-full">
            Starta dagens check-in
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Daglig check-in</CardTitle>
        <CardDescription>
          Hur mår du idag? Detta hjälper Stefan att ge dig bättre coaching.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mood Score */}
        <div className="space-y-3">
          <Label>Humör (1-10)</Label>
          <div className="space-y-2">
            <Slider
              value={[checkInData.mood_score]}
              onValueChange={(values) => setCheckInData(prev => ({ ...prev, mood_score: values[0] }))}
              min={1}
              max={10}
              step={1}
              className="flex-1"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mycket dåligt</span>
              <span className="font-semibold">{checkInData.mood_score}</span>
              <span>Excellent</span>
            </div>
          </div>
        </div>

        {/* Energy Level */}
        <div className="space-y-3">
          <Label>Energinivå (1-10)</Label>
          <div className="space-y-2">
            <Slider
              value={[checkInData.energy_level]}
              onValueChange={(values) => setCheckInData(prev => ({ ...prev, energy_level: values[0] }))}
              min={1}
              max={10}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Helt slut</span>
              <span className="font-semibold">{checkInData.energy_level}</span>
              <span>Pigg & alert</span>
            </div>
          </div>
        </div>

        {/* Stress Level */}
        <div className="space-y-3">
          <Label>Stressnivå (1-10)</Label>
          <div className="space-y-2">
            <Slider
              value={[checkInData.stress_level]}
              onValueChange={(values) => setCheckInData(prev => ({ ...prev, stress_level: values[0] }))}
              min={1}
              max={10}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Helt avslappnad</span>
              <span className="font-semibold">{checkInData.stress_level}</span>
              <span>Mycket stressad</span>
            </div>
          </div>
        </div>

        {/* Motivation Level */}
        <div className="space-y-3">
          <Label>Motivation (1-10)</Label>
          <div className="space-y-2">
            <Slider
              value={[checkInData.motivation_level]}
              onValueChange={(values) => setCheckInData(prev => ({ ...prev, motivation_level: values[0] }))}
              min={1}
              max={10}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Ingen motivation</span>
              <span className="font-semibold">{checkInData.motivation_level}</span>
              <span>Supertaggad</span>
            </div>
          </div>
        </div>

        {/* Pillar Focus */}
        <div className="space-y-3">
          <Label>Vilken pelare vill du fokusera på idag?</Label>
          <RadioGroup 
            value={checkInData.pillar_focus} 
            onValueChange={(value) => setCheckInData(prev => ({ ...prev, pillar_focus: value }))}
            className="grid grid-cols-1 gap-3"
          >
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.key} className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-accent/50">
                  <RadioGroupItem value={pillar.key} id={pillar.key} />
                  <Icon className="w-4 h-4" />
                  <div className="flex-1">
                    <Label htmlFor={pillar.key} className="font-medium cursor-pointer">
                      {pillar.name}
                    </Label>
                    <div className="text-xs text-muted-foreground">{pillar.description}</div>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {/* Daily Intention */}
        <div className="space-y-3">
          <Label>Vad vill du åstadkomma idag? (frivilligt)</Label>
          <Textarea
            value={checkInData.daily_intention}
            onChange={(e) => setCheckInData(prev => ({ ...prev, daily_intention: e.target.value }))}
            placeholder="T.ex. 'Genomföra träningspass', 'Slutföra en viktig uppgift', 'Ta kontakt med en potentiell klient'..."
            className="min-h-[80px]"
          />
        </div>

        {/* Reflection Notes */}
        <div className="space-y-3">
          <Label>Reflektion (frivilligt)</Label>
          <Textarea
            value={checkInData.reflection_notes}
            onChange={(e) => setCheckInData(prev => ({ ...prev, reflection_notes: e.target.value }))}
            placeholder="Hur känner du dig? Vad funkar bra? Vad behöver förbättras?"
            className="min-h-[80px]"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
            {isLoading ? 'Sparar...' : 'Genomför check-in'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};