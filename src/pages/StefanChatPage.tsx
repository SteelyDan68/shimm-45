import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import StefanAIChat from '@/components/StefanAIChat';
import { PedagogicalCoachInterface } from '@/components/Stefan/PedagogicalCoachInterface';

export function StefanChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(-1)}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Stefan AI Coaching
              </h1>
              <p className="text-muted-foreground">
                {clientId ? `Klient-fokuserad konsultation för klient ${clientId}` : 'Professional coaching-konsultation med AI-driven guidance'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Enhanced Pedagogical AI Coach Interface */}
          <div className="lg:col-span-1">
            <PedagogicalCoachInterface />
          </div>
          
          {/* Unified Stefan AI Chat Interface */}
          <div className="lg:col-span-1">
            <StefanAIChat 
              clientId={clientId || undefined}
              className="h-[600px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}