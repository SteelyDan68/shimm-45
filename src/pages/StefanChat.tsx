import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IntegratedStefanInterface } from '@/components/Stefan/IntegratedStefanInterface';
import { PedagogicalCoachInterface } from '@/components/Stefan/PedagogicalCoachInterface';

export function StefanChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Stefan AI Coaching</h1>
          <p className="text-muted-foreground">
            {clientId ? `Klient-fokuserad konsultation för klient ${clientId}` : 'Professional coaching-konsultation'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Enhanced Pedagogical AI Coach Interface */}
        <PedagogicalCoachInterface />
        
        {/* Traditional Chat Interface */}
        <div className="max-w-2xl mx-auto">
          <IntegratedStefanInterface
            context="coaching"
            clientId={clientId || undefined}
            className="w-full max-w-none"
            onCoachingAction={(action, data) => {
              
            }}
          />
        </div>
      </div>
    </div>
  );
}