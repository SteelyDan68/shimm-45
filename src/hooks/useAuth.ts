import { useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  organization: string | null;
  department: string | null;
  job_title: string | null;
  bio: string | null;
  date_of_birth: string | null;
  address: any;
  social_links: any;
  preferences: any;
  status: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AppRole = 'superadmin' | 'admin' | 'coach' | 'manager' | 'editor' | 'organization' | 'client';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  assigned_by: string | null;
  assigned_at: string;
  expires_at: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();


  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile and roles fetching to avoid deadlock
          setTimeout(() => {
            fetchUserProfile(session.user.id);
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchUserProfile(session.user.id);
          fetchUserRoles(session.user.id);
        }, 0);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  }, []);

  const fetchUserRoles = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching roles:', error);
        return;
      }

      // Filter out 'user' role and cast to AppRole[]
      const userRoles = data?.map(item => item.role).filter(role => role !== 'user') as AppRole[] || [];
      setRoles(userRoles);
    } catch (error) {
      console.error('Error in fetchUserRoles:', error);
    }
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) {
        toast({
          title: "Registreringsfel",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      if (data.user && !data.session) {
        toast({
          title: "Bekräfta din e-post",
          description: "Vi har skickat en bekräftelselänk till din e-post.",
        });
      }


      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Registreringsfel",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Inloggningsfel",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Update last login
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      toast({
        title: "Välkommen!",
        description: "Du är nu inloggad.",
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Inloggningsfel", 
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Utloggningsfel",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      setUser(null);
      setSession(null);
      setProfile(null);
      setRoles([]);

      toast({
        title: "Utloggad",
        description: "Du har loggats ut.",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Utloggningsfel",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Ingen användare inloggad') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        toast({
          title: "Uppdateringsfel",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Refresh profile
      await fetchUserProfile(user.id);

      toast({
        title: "Profil uppdaterad",
        description: "Din profil har uppdaterats.",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Uppdateringsfel",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const hasRole = useCallback((role: AppRole): boolean => {
    return roles.includes(role);
  }, [roles]);

  const hasAnyRole = useCallback((checkRoles: AppRole[]): boolean => {
    return checkRoles.some(role => roles.includes(role));
  }, [roles]);

  const isAdmin = useCallback((): boolean => {
    return hasAnyRole(['superadmin', 'admin']);
  }, [roles, hasAnyRole]);

  const canManageUsers = useCallback((): boolean => {
    return hasAnyRole(['superadmin', 'admin', 'manager']);
  }, [roles, hasAnyRole]);

  return {
    user,
    session,
    profile,
    roles,
    isLoading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    hasRole,
    hasAnyRole,
    isAdmin,
    canManageUsers,
    fetchUserProfile,
    fetchUserRoles,
  };
};