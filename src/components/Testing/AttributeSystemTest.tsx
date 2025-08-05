import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedUserData } from '@/hooks/useUnifiedUserData';
import { useUserRelationships } from '@/hooks/useUserRelationships';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TestTube, User, Users, Settings } from 'lucide-react';

export const AttributeSystemTest = () => {
  const { users, loading, refetch } = useUnifiedUserData();
  const { relationships, stats, createRelationship } = useUserRelationships();
  const { toast } = useToast();
  
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [attributeKey, setAttributeKey] = useState<string>('');
  const [attributeValue, setAttributeValue] = useState<string>('');
  const [attributeType, setAttributeType] = useState<string>('property');
  
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [`${new Date().toLocaleTimeString()}: ${result}`, ...prev]);
  };

  const testUserData = async () => {
    try {
      addTestResult("🧪 Testar unified user data...");
      
      if (users.length === 0) {
        addTestResult("❌ Inga användare hittades");
        return;
      }

      addTestResult(`✅ Hämtade ${users.length} användare via hybrid-system`);
      
      const usersWithRoles = users.filter(u => u.roles && u.roles.length > 0);
      addTestResult(`✅ ${usersWithRoles.length} användare har roller via hybrid-system`);
      
      // Testa rolldistribution
      const roleStats = users.reduce((acc, user) => {
        user.roles?.forEach(role => {
          acc[role] = (acc[role] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);
      
      addTestResult(`📊 Rolldistribution: ${JSON.stringify(roleStats)}`);

    } catch (error: any) {
      addTestResult(`❌ Fel vid test av user data: ${error.message}`);
    }
  };

  const testRelationships = async () => {
    try {
      addTestResult("🧪 Testar user relationships...");
      
      addTestResult(`✅ Hämtade ${relationships.length} aktiva relationer`);
      addTestResult(`📊 Stats: ${stats.total_coaches} coaches, ${stats.total_clients} clients`);
      
      const coachIds = new Set(relationships.map(r => r.coach_id));
      const clientIds = new Set(relationships.map(r => r.client_id));
      
      addTestResult(`✅ Unika coaches: ${coachIds.size}, Unika clients: ${clientIds.size}`);

    } catch (error: any) {
      addTestResult(`❌ Fel vid test av relationships: ${error.message}`);
    }
  };

  const testAttributeCreation = async () => {
    if (!selectedUserId || !attributeKey || !attributeValue) {
      toast({
        title: "Fält saknas",
        description: "Fyll i alla fält för att testa attributskapande",
        variant: "destructive"
      });
      return;
    }

    try {
      addTestResult(`🧪 Testar skapande av attribut: ${attributeKey} = ${attributeValue}`);
      
      // Här skulle vi använda useUnifiedUserData hook för att skapa attribut
      // Men vi har inte implementerat updateAttribute än, så vi simulerar
      addTestResult(`⚠️ Attributskapande inte implementerat än - endast test av UI`);
      
    } catch (error: any) {
      addTestResult(`❌ Fel vid test av attributskapande: ${error.message}`);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    addTestResult("🚀 Startar fullständig systemtest...");
    
    await testUserData();
    await testRelationships();
    
    addTestResult("🎊 Alla tester slutförda!");
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Attributsystem Test Center
          </CardTitle>
          <CardDescription>
            Testa det nya attributsystemet och hybrid-stödet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Översikt</TabsTrigger>
              <TabsTrigger value="users">Användare</TabsTrigger>
              <TabsTrigger value="relationships">Relationer</TabsTrigger>
              <TabsTrigger value="attributes">Attribut</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <User className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">{users.length}</p>
                        <p className="text-sm text-muted-foreground">Totala användare</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Users className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">{relationships.length}</p>
                        <p className="text-sm text-muted-foreground">Aktiva relationer</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-8 w-8 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold">{users.filter(u => u.roles?.length).length}</p>
                        <p className="text-sm text-muted-foreground">Med roller</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Button onClick={runAllTests} disabled={loading} size="lg" className="w-full">
                  {loading ? "Laddar..." : "Kör alla tester"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={testUserData} disabled={loading}>
                  Testa användardata
                </Button>
                <Button onClick={refetch} disabled={loading} variant="outline">
                  Uppdatera data
                </Button>
              </div>

              {users.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {users.slice(0, 10).map(user => (
                    <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{user.first_name} {user.last_name}</span>
                        <span className="text-sm text-muted-foreground ml-2">{user.email}</span>
                      </div>
                      <div className="flex gap-1">
                        {user.roles?.map(role => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="relationships" className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={testRelationships} disabled={loading}>
                  Testa relationer
                </Button>
              </div>

              {relationships.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {relationships.slice(0, 10).map(rel => (
                    <div key={rel.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="text-sm">
                        <span className="font-medium">Coach:</span> {rel.coach_id.slice(0, 8)}...
                        <span className="font-medium ml-2">Client:</span> {rel.client_id.slice(0, 8)}...
                      </div>
                      <Badge variant={rel.is_active ? "default" : "secondary"}>
                        {rel.is_active ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="attributes" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Select onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj användare" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.slice(0, 20).map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Attributnyckel (t.ex. test_property)"
                    value={attributeKey}
                    onChange={(e) => setAttributeKey(e.target.value)}
                  />

                  <Input
                    placeholder="Attributvärde (t.ex. test_value)"
                    value={attributeValue}
                    onChange={(e) => setAttributeValue(e.target.value)}
                  />

                  <Select onValueChange={setAttributeType} defaultValue="property">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="property">Property</SelectItem>
                      <SelectItem value="role">Role</SelectItem>
                      <SelectItem value="relationship">Relationship</SelectItem>
                      <SelectItem value="setting">Setting</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button onClick={testAttributeCreation} className="w-full">
                    Skapa testattribut
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {testResults.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm">Testresultat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-60 overflow-y-auto font-mono text-xs">
                  {testResults.map((result, index) => (
                    <div key={index} className={`
                      ${result.includes('❌') ? 'text-red-600' : ''}
                      ${result.includes('✅') ? 'text-green-600' : ''}
                      ${result.includes('🎊') ? 'text-blue-600 font-bold' : ''}
                      ${result.includes('⚠️') ? 'text-yellow-600' : ''}
                    `}>
                      {result}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};