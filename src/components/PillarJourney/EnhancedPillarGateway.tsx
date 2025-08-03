import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Lock, CheckCircle, Play, Star, Clock, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PillarKey } from '@/types/sixPillarsModular';
import { PILLAR_MODULES } from '@/config/pillarModules';

interface EnhancedPillarGatewayProps {
  userId: string;
  onPillarSelect: (pillarKey: PillarKey, isSequential: boolean) => void;
  completedPillars: PillarKey[];
  recommendedPillar: PillarKey;
  isFirstTime: boolean;
}

const EnhancedPillarGateway: React.FC<EnhancedPillarGatewayProps> = ({
  userId,
  onPillarSelect,
  completedPillars,
  recommendedPillar,
  isFirstTime
}) => {
  const { toast } = useToast();
  const [selectedPillar, setSelectedPillar] = useState<PillarKey | null>(null);
  const [showGatewayBlock, setShowGatewayBlock] = useState(false);

  // Check if user needs to complete mandatory first pillar
  useEffect(() => {
    if (isFirstTime && completedPillars.length === 0) {
      setShowGatewayBlock(true);
    }
  }, [isFirstTime, completedPillars]);

  const getPillarStatus = (pillarKey: PillarKey) => {
    if (completedPillars.includes(pillarKey)) {
      return 'completed';
    }
    
    if (completedPillars.length === 0 && pillarKey === recommendedPillar) {
      return 'available'; // First mandatory pillar
    }
    
    // Sequential logic: next pillar is available if previous ones are completed
    const pillarOrder: PillarKey[] = ['self_care', 'skills', 'talent', 'brand', 'economy', 'open_track'];
    const currentIndex = pillarOrder.indexOf(pillarKey);
    
    if (currentIndex === 0) {
      return completedPillars.length > 0 ? 'available' : 'required';
    }
    
    const previousPillar = pillarOrder[currentIndex - 1];
    return completedPillars.includes(previousPillar) ? 'available' : 'locked';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'available': return 'bg-blue-500';
      case 'required': return 'bg-red-500 animate-pulse';
      case 'locked': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      case 'available': return <Play className="w-5 h-5" />;
      case 'required': return <Target className="w-5 h-5 animate-bounce" />;
      case 'locked': return <Lock className="w-5 h-5" />;
      default: return <Lock className="w-5 h-5" />;
    }
  };

  const handlePillarClick = (pillarKey: PillarKey) => {
    const status = getPillarStatus(pillarKey);
    
    if (status === 'locked') {
      toast({
        title: "🔒 Pillar låst",
        description: "Slutför föregående pillar först för att låsa upp denna!",
        variant: "destructive",
      });
      return;
    }
    
    if (status === 'completed') {
      toast({
        title: "✅ Redan klar",
        description: "Du har redan slutfört denna pillar. Bra jobbat!",
      });
      return;
    }

    setSelectedPillar(pillarKey);
    
    // Special handling for mandatory first pillar
    if (showGatewayBlock && pillarKey === recommendedPillar) {
      toast({
        title: "🎯 Obligatorisk start",
        description: "Perfekt! Denna pillar är din väg in i systemet.",
      });
    }
    
    onPillarSelect(pillarKey, true);
  };

  const progressPercentage = (completedPillars.length / 6) * 100;

  // Gateway blocking message for first-time users
  if (showGatewayBlock && completedPillars.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Target className="w-6 h-6" />
              🚪 Välkommen! Du måste starta här
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">
              För att låsa upp systemet måste du först genomföra minst en pillar-assessment. 
              Vi rekommenderar att börja med <strong>{PILLAR_MODULES[recommendedPillar].name}</strong> 
              baserat på din Wheel of Life-bedömning.
            </p>
            <Button 
              onClick={() => handlePillarClick(recommendedPillar)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Target className="w-4 h-4 mr-2" />
              Starta med {PILLAR_MODULES[recommendedPillar].name}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              Din Pillar-Resa
            </span>
            <Badge variant="outline">
              {completedPillars.length}/6 Completed
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Framsteg</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Pillar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Object.keys(PILLAR_MODULES) as PillarKey[]).map((pillarKey) => {
          const pillar = PILLAR_MODULES[pillarKey];
          const status = getPillarStatus(pillarKey);
          const isRecommended = pillarKey === recommendedPillar;
          
          return (
            <Card 
              key={pillarKey}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                status === 'available' ? 'ring-2 ring-blue-500' : ''
              } ${status === 'required' ? 'ring-2 ring-red-500' : ''}`}
              onClick={() => handlePillarClick(pillarKey)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{pillar.icon}</span>
                    <CardTitle className="text-lg">{pillar.name}</CardTitle>
                  </div>
                  <div className={`p-2 rounded-full text-white ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {pillar.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={status === 'completed' ? 'default' : 'secondary'}
                    className={status === 'required' ? 'bg-red-100 text-red-700' : ''}
                  >
                    {status === 'completed' && '✅ Klar'}
                    {status === 'available' && '🎯 Tillgänglig'}
                    {status === 'required' && '🚨 Obligatorisk'}
                    {status === 'locked' && '🔒 Låst'}
                  </Badge>
                  
                  {isRecommended && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      ⭐ Rekommenderad
                    </Badge>
                  )}
                </div>
                
                {(status === 'available' || status === 'required') && (
                  <Button 
                    className="w-full mt-3"
                    variant={status === 'required' ? 'default' : 'outline'}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Starta assessment
                  </Button>
                )}
                
                {status === 'locked' && (
                  <Button 
                    className="w-full mt-3" 
                    variant="ghost" 
                    disabled
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Låses upp snart
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Motivation Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <h3 className="text-lg font-semibold text-blue-900">
              🎯 Varför genomföra alla sex pillars?
            </h3>
            <p className="text-blue-700">
              Ju fler pillars du genomför, desto mer personlig och träffsäker blir din AI-coach. 
              En komplett bedömning ger oss helhetsbilden för att skapa den perfekta utvecklingsplanen för dig!
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-blue-600">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                ~10 min per pillar
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                Personliga aktiviteter
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                Bättre resultat
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedPillarGateway;