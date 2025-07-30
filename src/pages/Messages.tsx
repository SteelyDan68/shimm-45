import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { MessageList } from '@/components/Messaging/MessageList';
import { ComposeMessage } from '@/components/Messaging/ComposeMessage';
import { MessagePreferences } from '@/components/Messaging/MessagePreferences';

export default function Messages() {
  const [showCompose, setShowCompose] = useState(false);

  if (showCompose) {
    return (
      <div className="container mx-auto p-6">
        <ComposeMessage 
          onClose={() => setShowCompose(false)}
          onSent={() => setShowCompose(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Meddelanden</h1>
          <p className="text-muted-foreground">
            Hantera din kommunikation med coaches och klienter
          </p>
        </div>
        <Button onClick={() => setShowCompose(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nytt meddelande
        </Button>
      </div>

      <Tabs defaultValue="messages" className="space-y-6">
        <TabsList>
          <TabsTrigger value="messages">Meddelanden</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Inställningar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Alla meddelanden</CardTitle>
              <CardDescription>
                Här ser du alla dina konversationer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MessageList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <MessagePreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}