/**
 * 🎯 UNIFIED INVITATION MANAGER
 * 
 * Komplett inbjudningshantering med enhetlig UX
 * Ersätter alla fragmenterade invitation komponenter
 * Inkluderar dubblettskydd och statushantering
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Mail, Plus, Send, Users, X, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUnifiedInvitations, InvitationResult } from '@/hooks/useUnifiedInvitations';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { PendingInvitations } from './PendingInvitations';
import { supabase } from '@/integrations/supabase/client';

interface UnifiedInvitationManagerProps {
  onSuccess?: () => void;
  defaultRole?: string;
  allowBulk?: boolean;
  className?: string;
}

export const UnifiedInvitationManager: React.FC<UnifiedInvitationManagerProps> = ({
  onSuccess,
  defaultRole = 'client',
  allowBulk = true,
  className = ''
}) => {
  const { user, profile } = useAuth();
  const { sendInvitations, loading, error, clearError } = useUnifiedInvitations();

  // Form state
  const [emails, setEmails] = useState<string[]>(['']);
  const [role, setRole] = useState(defaultRole);
  const [customMessage, setCustomMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [sendEmail, setSendEmail] = useState(true);

  // UI state
  const [results, setResults] = useState<InvitationResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [pendingEmails, setPendingEmails] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const inviterName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.email || 'Administratör';

  const addEmailField = () => {
    setEmails([...emails, '']);
  };

  const removeEmailField = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index));
    }
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  // Ladda pågående inbjudningar för dubblettskydd
  const loadPendingInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('email')
        .eq('status', 'pending');
      
      if (error) throw error;
      setPendingEmails(data?.map(inv => inv.email) || []);
    } catch (error) {
      console.error('Error loading pending invitations:', error);
    }
  };

  useEffect(() => {
    loadPendingInvitations();
  }, [refreshTrigger]);

  const validateEmails = (): { valid: string[], duplicates: string[], invalid: string[] } => {
    const trimmedEmails = emails
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid: string[] = [];
    const invalid: string[] = [];
    const duplicates: string[] = [];
    
    trimmedEmails.forEach(email => {
      if (!emailRegex.test(email)) {
        invalid.push(email);
      } else if (pendingEmails.includes(email)) {
        duplicates.push(email);
      } else {
        valid.push(email);
      }
    });
    
    return { valid, duplicates, invalid };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const emailValidation = validateEmails();

    if (emailValidation.valid.length === 0) {
      return;
    }

    try {
      const response = await sendInvitations({
        emails: emailValidation.valid,
        role,
        invitedBy: inviterName,
        custom_message: customMessage.trim() || undefined,
        expires_in_days: expiresInDays,
        send_email: sendEmail
      });

      setResults(response.results);
      setShowResults(true);

      if (response.success && onSuccess) {
        onSuccess();
      }

      // Rensa formuläret vid framgång och uppdatera pending lista
      if (response.summary.successful > 0) {
        setEmails(['']);
        setCustomMessage('');
        setRefreshTrigger(prev => prev + 1); // Trigga refresh av pending lista
      }

    } catch (err) {
      console.error('Invitation error:', err);
    }
  };

  const resetForm = () => {
    setEmails(['']);
    setCustomMessage('');
    setResults([]);
    setShowResults(false);
    clearError();
  };

  const emailValidation = validateEmails();
  const hasValidEmails = emailValidation.valid.length > 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Huvudformulär */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Skicka inbjudningar
          </CardTitle>
          <CardDescription>
            Bjud in nya användare till plattformen. De får ett e-postmeddelande med en säker länk för att skapa sitt konto.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* E-postadresser */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">E-postadresser</Label>
                {allowBulk && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEmailField}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Lägg till
                  </Button>
                )}
              </div>

              {emails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="anvandare@exempel.se"
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                    className="flex-1"
                  />
                  {allowBulk && emails.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeEmailField(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {/* Email validation feedback */}
              {hasValidEmails && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {emailValidation.valid.length} giltig{emailValidation.valid.length !== 1 ? 'a' : ''} e-postadress{emailValidation.valid.length !== 1 ? 'er' : ''}
                </div>
              )}
              
              {emailValidation.invalid.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  {emailValidation.invalid.length} ogiltig{emailValidation.invalid.length !== 1 ? 'a' : ''} e-postadress{emailValidation.invalid.length !== 1 ? 'er' : ''}
                </div>
              )}
              
              {emailValidation.duplicates.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Pågående inbjudningar hittades:</div>
                    <div className="text-sm">
                      {emailValidation.duplicates.join(', ')} har redan skickats inbjudningar som väntar på svar.
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Separator />

            {/* Roll */}
            <div className="space-y-2">
              <Label htmlFor="role">Användarroll</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj roll" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Klient</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="admin">Administratör</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Personligt meddelande */}
            <div className="space-y-2">
              <Label htmlFor="custom_message">Personligt meddelande (valfritt)</Label>
              <Textarea
                id="custom_message"
                placeholder="Lägg till ett personligt meddelande till inbjudan..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Avancerade inställningar */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">Avancerade inställningar</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expires_in_days">Giltig i dagar</Label>
                  <Select value={expiresInDays.toString()} onValueChange={(v) => setExpiresInDays(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 dag</SelectItem>
                      <SelectItem value="3">3 dagar</SelectItem>
                      <SelectItem value="7">7 dagar</SelectItem>
                      <SelectItem value="14">14 dagar</SelectItem>
                      <SelectItem value="30">30 dagar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="send_email"
                    checked={sendEmail}
                    onCheckedChange={setSendEmail}
                  />
                  <Label htmlFor="send_email">Skicka e-post</Label>
                </div>
              </div>
            </div>

            {/* Fel */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Knappar */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading || !hasValidEmails}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    Skickar...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Skicka {emailValidation.valid.length > 1 ? `${emailValidation.valid.length} inbjudningar` : 'inbjudan'}
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={loading}
              >
                Rensa
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Resultat */}
      {showResults && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Inbjudningsresultat
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                      : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    
                    <div>
                      <div className="font-medium">{result.email}</div>
                      {result.dev_mode && (
                        <div className="text-sm text-orange-600">
                          Development mode - E-post begränsad
                        </div>
                      )}
                      {result.error && (
                        <div className="text-sm text-red-600">{result.error}</div>
                      )}
                    </div>
                  </div>

                  {result.success && (
                    <Badge variant={result.dev_mode ? "secondary" : "default"}>
                      {result.dev_mode ? "Dev Mode" : "Skickad"}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pågående inbjudningar */}
      <PendingInvitations onRefresh={() => setRefreshTrigger(prev => prev + 1)} />
    </div>
  );
};