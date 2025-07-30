import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface AccessCode {
  id: string;
  code: string;
  status: 'active' | 'used' | 'expired' | 'disabled';
  created_at: string;
  used_at: string | null;
  used_by: string | null;
  expires_at: string | null;
  created_by: string;
}

export const AccessCodeManagement = () => {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCodeLength, setNewCodeLength] = useState(8);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin()) {
      fetchCodes();
    }
  }, [isAdmin]);

  const fetchCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('access_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes((data || []) as AccessCode[]);
    } catch (error: any) {
      toast({
        title: "Fel",
        description: "Kunde inte hämta åtkomstkoder: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomCode = (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createCode = async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      const newCode = generateRandomCode(newCodeLength);
      
      const { error } = await supabase
        .from('access_codes')
        .insert({
          code: newCode,
          created_by: user.id,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Kod skapad",
        description: `Ny åtkomstkod skapad: ${newCode}`,
      });

      fetchCodes();
    } catch (error: any) {
      toast({
        title: "Fel",
        description: "Kunde inte skapa kod: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleCodeStatus = async (codeId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    
    try {
      const { error } = await supabase
        .from('access_codes')
        .update({ status: newStatus })
        .eq('id', codeId);

      if (error) throw error;

      toast({
        title: "Status uppdaterad",
        description: `Koden är nu ${newStatus === 'active' ? 'aktiv' : 'inaktiverad'}`,
      });

      fetchCodes();
    } catch (error: any) {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera status: " + error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      used: 'secondary',
      expired: 'destructive',
      disabled: 'outline'
    } as const;

    const labels = {
      active: 'Aktiv',
      used: 'Använd',
      expired: 'Utgången',
      disabled: 'Inaktiverad'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  if (!isAdmin()) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Du har inte behörighet att hantera åtkomstkoder.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Skapa ny åtkomstkod</CardTitle>
          <CardDescription>
            Skapa en ny kod som ger tillgång till registreringssidan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="codeLength" className="text-sm font-medium">
                Kodlängd:
              </label>
              <Input
                id="codeLength"
                type="number"
                min="4"
                max="16"
                value={newCodeLength}
                onChange={(e) => setNewCodeLength(Number(e.target.value))}
                className="w-20"
              />
            </div>
            <Button 
              onClick={createCode} 
              disabled={isCreating}
              className="ml-auto"
            >
              {isCreating ? 'Skapar...' : 'Skapa kod'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Åtkomstkoder</CardTitle>
          <CardDescription>
            Hantera alla skapade åtkomstkoder
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Laddar...</div>
          ) : codes.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Inga åtkomstkoder skapade än
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Skapad</TableHead>
                  <TableHead>Använd</TableHead>
                  <TableHead>Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono font-bold">
                      {code.code}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(code.status)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(code.created_at), 'PP HH:mm', { locale: sv })}
                    </TableCell>
                    <TableCell>
                      {code.used_at 
                        ? format(new Date(code.used_at), 'PP HH:mm', { locale: sv })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {code.status !== 'used' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCodeStatus(code.id, code.status)}
                        >
                          {code.status === 'active' ? 'Inaktivera' : 'Aktivera'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};