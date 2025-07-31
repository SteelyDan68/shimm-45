import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StefanInteraction } from '@/types/welcomeAssessment';
import { useStefanPersonality } from '@/hooks/useStefanPersonality';
import { STEFAN_PERSONAS } from '@/config/stefanPersonas';
import { MessageCircle, Heart, Lightbulb, Target, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface StefanInteractionCardProps {
  interaction: StefanInteraction;
  showResponse?: boolean;
}

export const StefanInteractionCard = ({ 
  interaction, 
  showResponse = true 
}: StefanInteractionCardProps) => {
  const { updateUserResponse } = useStefanPersonality();
  const [response, setResponse] = useState(interaction.user_response || '');
  const [isResponding, setIsResponding] = useState(false);
  const [hasResponded, setHasResponded] = useState(!!interaction.user_response);

  const persona = STEFAN_PERSONAS[interaction.stefan_persona] || STEFAN_PERSONAS.mentor;

  const handleResponse = async () => {
    if (!response.trim()) return;
    
    setIsResponding(true);
    const success = await updateUserResponse(interaction.id, response);
    
    if (success) {
      setHasResponded(true);
    }
    setIsResponding(false);
  };

  const getPersonaIcon = () => {
    switch (interaction.stefan_persona) {
      case 'mentor':
        return <Lightbulb className="h-4 w-4" />;
      case 'cheerleader':
        return <Heart className="h-4 w-4" />;
      case 'strategist':
        return <Target className="h-4 w-4" />;
      case 'friend':
        return <User className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getPersonaColor = () => {
    switch (interaction.stefan_persona) {
      case 'mentor':
        return 'bg-blue-500';
      case 'cheerleader':
        return 'bg-green-500';
      case 'strategist':
        return 'bg-purple-500';
      case 'friend':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getInteractionTypeLabel = () => {
    switch (interaction.interaction_type) {
      case 'proactive':
        return 'Proaktivt meddelande';
      case 'reactive':
        return 'Svar på fråga';
      case 'celebration':
        return 'Firande';
      case 'support':
        return 'Stöd';
      default:
        return 'Meddelande';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/stefan-avatar.png" alt="Stefan" />
              <AvatarFallback className={`text-white ${getPersonaColor()}`}>
                S
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {getPersonaIcon()}
                Stefan {persona.name.split(' ')[1]}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {getInteractionTypeLabel()}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(interaction.created_at), { 
                    addSuffix: true, 
                    locale: sv 
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {interaction.message_content && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {interaction.message_content}
            </p>
          </div>
        )}

        {showResponse && (
          <div className="space-y-3">
            {hasResponded ? (
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Ditt svar:</h4>
                <p className="text-sm text-blue-700 whitespace-pre-wrap">
                  {interaction.user_response}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Svara Stefan:</h4>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Skriv ditt svar eller dina tankar här..."
                  className="min-h-[80px]"
                />
                <Button
                  onClick={handleResponse}
                  disabled={!response.trim() || isResponding}
                  size="sm"
                  className="w-full"
                >
                  {isResponding ? 'Skickar...' : 'Skicka svar'}
                </Button>
              </div>
            )}
          </div>
        )}

        {interaction.context_data && Object.keys(interaction.context_data).length > 0 && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">Visa kontextdata</summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {JSON.stringify(interaction.context_data, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
};