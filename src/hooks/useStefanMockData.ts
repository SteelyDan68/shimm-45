import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { StefanInteraction } from '@/types/welcomeAssessment';

// Mock Stefan interactions för när AI:n inte fungerar
export const useStefanMockData = () => {
  const { user } = useAuth();
  const [mockInteractions, setMockInteractions] = useState<StefanInteraction[]>([]);

  useEffect(() => {
    if (!user) return;

    // Skapa realistiska mock interactions baserat på tid och användaraktivitet
    const now = new Date();
    const mockData: StefanInteraction[] = [
      {
        id: 'mock-1',
        user_id: user.id,
        interaction_type: 'proactive',
        stefan_persona: 'mentor',
        context_data: {
          page: '/ai-coaching',
          time_of_day: now.getHours()
        },
        message_content: getContextualMessage(),
        user_response: null,
        created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString() // 10 min sedan
      }
    ];

    setMockInteractions(mockData);
  }, [user]);

  const getContextualMessage = (): string => {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    
    // Tid-baserade meddelanden
    if (hour < 10) {
      return "God morgon! Jag såg att du är igång tidigt idag. Perfekt tid för att sätta intentioner för dagen. Vad vill du fokusera på?";
    } else if (hour < 14) {
      return "Hej! Hur går det med dagens uppgifter? Jag märkte att du har några viktiga saker på gång. Behöver du hjälp med prioritering?";
    } else if (hour < 18) {
      return "Eftermiddagen är här! En bra tid för reflektion. Hur känns det med framstegen idag? Något du vill diskutera?";
    } else {
      return "God kväll! Tiden för att blicka tillbaka på dagen. Vad har fungerat bra idag och vad kan vi förbättra imorgon?";
    }
  };

  const addMockInteraction = (type: string, context: string, message?: string) => {
    const newInteraction: StefanInteraction = {
      id: `mock-${Date.now()}`,
      user_id: user?.id || '',
      interaction_type: type,
      stefan_persona: 'mentor',
      context_data: { context, timestamp: new Date().toISOString() },
      message_content: message || getContextualResponseForType(type, context),
      user_response: null,
      created_at: new Date().toISOString()
    };

    setMockInteractions(prev => [newInteraction, ...prev.slice(0, 9)]);
    return newInteraction;
  };

  const getContextualResponseForType = (type: string, context: string): string => {
    const responses: Record<string, Record<string, string[]>> = {
      'contextual_help': {
        'task_prioritization': [
          "Låt oss titta på dina uppgifter! Jag föreslår att vi börjar med det som har störst påverkan men kräver minst energi. Vad tycker du?",
          "Smart att fråga om prioritering! Baserat på dina mål skulle jag säga: börja med det som rör dig framåt mot din vision."
        ],
        'struggling_tasks': [
          "Jag ser att några uppgifter har kört fast. Det händer oss alla! Ska vi bryta ner dem i mindre bitar?",
          "Fastnade uppgifter är ofta ett tecken på att vi behöver ett nytt perspektiv. Vill du brainstorma alternativa vägar?"
        ],
        'weekly_planning': [
          "Perfekt timing för veckoplanering! Låt oss balansera dina stora mål med vardagens realiteter. Vad är viktigast denna vecka?",
          "Veckoplanering är en konstform! Jag hjälper dig hitta rätt rytm mellan fokus och flexibilitet."
        ]
      },
      'motivation': {
        'task_motivation': [
          "Du har kommit så långt redan! Varje steg du tar nu bygger på allt det hårda arbete du redan lagt ner. Fortsätt!",
          "Motivation kommer och går, men dina vanor håller dig på rätt spår. Du klarar det här!"
        ],
        'general': [
          "Du gör framsteg varje dag, även när det inte känns så. Jag ser din utveckling och den är imponerande!",
          "Kom ihåg varför du började. Den personen du blir på andra sidan av detta kommer tacka dig för att du inte gav upp."
        ]
      },
      'celebration': {
        'milestone_achievement': [
          "WOW! Det här förtjänar vi att fira ordentligt! 🎉 Du har verkligen visat vad du går för.",
          "Fantastiskt! Denna framgång är resultatet av ditt hårda arbete och engagemang. Var stolt!"
        ]
      }
    };

    const categoryResponses = responses[type]?.[context] || responses[type]?.['general'] || [
      "Tack för att du kontaktar mig! Jag är här för att stötta dig på din resa framåt."
    ];

    return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
  };

  return {
    mockInteractions,
    addMockInteraction,
    isUsingMockData: true
  };
};