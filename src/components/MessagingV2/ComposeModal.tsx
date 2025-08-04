import React, { useState, useEffect } from 'react';
import { X, Search, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useMessagingV2 } from '@/hooks/useMessagingV2';
import { cn } from '@/lib/utils';

interface ComposeModalProps {
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({ onClose, onConversationCreated }) => {
  const { user } = useAuth();
  const { getOrCreateDirectConversation } = useMessagingV2();
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);

  // Fetch available users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .neq('id', user.id) // Exclude current user
          .limit(50);

        if (error) throw error;
        setAvailableUsers(profiles || []);
      } catch (error) {
        console.error('❌ Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  const filteredUsers = availableUsers.filter(profile => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      profile.first_name?.toLowerCase().includes(searchLower) ||
      profile.last_name?.toLowerCase().includes(searchLower) ||
      profile.email?.toLowerCase().includes(searchLower)
    );
  });

  const getInitials = (profile: UserProfile) => {
    const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return profile.email?.[0]?.toUpperCase() || '?';
  };

  const getDisplayName = (profile: UserProfile) => {
    const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return name || profile.email || 'Okänd användare';
  };

  const handleUserSelect = (profile: UserProfile) => {
    if (selectedUsers.find(u => u.id === profile.id)) {
      setSelectedUsers(prev => prev.filter(u => u.id !== profile.id));
    } else {
      setSelectedUsers(prev => [...prev, profile]);
    }
  };

  const handleStartConversation = async () => {
    if (selectedUsers.length === 0) return;

    setLoading(true);
    try {
      if (selectedUsers.length === 1) {
        // Direct conversation
        const conversationId = await getOrCreateDirectConversation(selectedUsers[0].id);
        if (conversationId) {
          onConversationCreated(conversationId);
        }
      } else {
        // Group conversation - create new conversation
        const participantIds = [user!.id, ...selectedUsers.map(u => u.id)];
        
        const { data: newConversation, error } = await supabase
          .from('conversations')
          .insert({
            created_by: user!.id,
            participant_ids: participantIds,
            conversation_type: 'group',
            title: selectedUsers.map(u => getDisplayName(u)).join(', '),
            metadata: {
              created_from: 'web'
            }
          })
          .select('id')
          .single();

        if (error) throw error;
        onConversationCreated(newConversation.id);
      }
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ny konversation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök användare..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Valda användare:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(profile => (
                  <Badge 
                    key={profile.id} 
                    variant="secondary" 
                    className="flex items-center gap-2 px-3 py-1"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {getInitials(profile)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{getDisplayName(profile)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => handleUserSelect(profile)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* User List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Tillgängliga användare:</h4>
            <ScrollArea className="max-h-64">
              <div className="space-y-1">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Laddar användare...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-4">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? 'Inga användare hittades' : 'Inga användare tillgängliga'}
                    </p>
                  </div>
                ) : (
                  filteredUsers.map(profile => (
                    <div
                      key={profile.id}
                      onClick={() => handleUserSelect(profile)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-muted/50",
                        selectedUsers.find(u => u.id === profile.id) && "bg-primary/10 border border-primary/20"
                      )}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="text-sm">
                          {getInitials(profile)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {getDisplayName(profile)}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {profile.email}
                        </p>
                      </div>

                      {selectedUsers.find(u => u.id === profile.id) && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <X className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Avbryt
            </Button>
            <Button 
              onClick={handleStartConversation}
              disabled={selectedUsers.length === 0 || loading}
              className="flex-1"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : null}
              Starta konversation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};