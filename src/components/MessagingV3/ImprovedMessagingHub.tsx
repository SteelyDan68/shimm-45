import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { LiveStefanChat } from './LiveStefanChat';
import {
  MessageSquare,
  Brain,
  Users,
  MessageCircle
} from 'lucide-react';

export const ImprovedMessagingHub: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stefan');

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Logga in för att använda meddelanden</h3>
            <p className="text-muted-foreground">
              Du måste vara inloggad för att kunna chatta.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Meddelanden</h1>
                <p className="text-muted-foreground">
                  Chatta med Stefan AI och dina coaches
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Brain className="h-3 w-3 mr-1" />
                Stefan AI Live
              </Badge>
              
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <MessageCircle className="h-3 w-3 mr-1" />
                Realtid
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          
          {/* Left Sidebar - Navigation */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Konversationer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant={activeTab === 'stefan' ? 'default' : 'ghost'} 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('stefan')}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Stefan AI
                  <Badge variant="secondary" className="ml-auto">Live</Badge>
                </Button>
                
                <Button 
                  variant={activeTab === 'coaches' ? 'default' : 'ghost'} 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('coaches')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Mänskliga Coaches
                  <Badge variant="outline" className="ml-auto">Snart</Badge>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            {activeTab === 'stefan' && (
              <LiveStefanChat onMessageSent={() => {
                console.log('Message sent to Stefan');
              }} />
            )}
            
            {activeTab === 'coaches' && (
              <Card className="h-full">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Mänskliga Coaches</h3>
                    <p className="text-muted-foreground mb-4">
                      Denna funktion implementeras snart för kommunikation med dina tilldelade coaches.
                    </p>
                    <Badge variant="outline">Kommer snart</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};