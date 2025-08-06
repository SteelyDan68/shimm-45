/**
 * 🌟 ENTERPRISE GDPR REQUESTS HOOK 🌟
 * 
 * Världsklass hantering av GDPR-förfrågningar med real-time updates
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface GDPRRequest {
  id: string;
  user_id: string;
  request_type: 'data_export' | 'data_deletion' | 'data_portability' | 'data_access';
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'completed';
  reason?: string;
  user_message?: string;
  admin_notes?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requested_at: string;
  reviewed_at?: string;
  completed_at?: string;
  reviewed_by?: string;
  approved_by?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

export interface GDPRNotification {
  id: string;
  request_id: string;
  admin_user_id: string;
  notification_type: 'new_request' | 'request_approved' | 'request_completed' | 'request_rejected';
  message: string;
  is_read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  read_at?: string;
  request?: GDPRRequest;
}

export const useGDPRRequests = () => {
  const [requests, setRequests] = useState<GDPRRequest[]>([]);
  const [notifications, setNotifications] = useState<GDPRNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, hasRole, roles } = useAuth();
  const { toast } = useToast();
  
  const isAdmin = user && (hasRole('admin') || hasRole('superadmin'));

  // Ladda GDPR requests
  const loadRequests = async () => {
    try {
      setLoading(true);
      
      console.log('🔥 useGDPRRequests: Loading requests...', {
        user: user?.id,
        userEmail: user?.email,
        isAdmin: isAdmin,
        hasRole_admin: hasRole('admin'),
        hasRole_superadmin: hasRole('superadmin'),
        roles: roles
      });
      
      let query = supabase
        .from('gdpr_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // Om inte admin, visa bara egna requests
      if (!isAdmin) {
        console.log('🔥 useGDPRRequests: Not admin, filtering by user_id:', user?.id);
        query = query.eq('user_id', user?.id);
      } else {
        console.log('🔥 useGDPRRequests: Admin access - loading all requests');
      }

      const { data, error } = await query;

      if (error) {
        console.error('🔥 useGDPRRequests: Database error:', error);
        throw error;
      }

      console.log('🔥 useGDPRRequests: Loaded requests:', data?.length || 0, data);
      setRequests((data || []) as GDPRRequest[]);
    } catch (err: any) {
      console.error('Error loading GDPR requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ladda notifikationer för admins
  const loadNotifications = async () => {
    if (!isAdmin || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from('gdpr_notifications')
        .select(`
          *,
          gdpr_requests!inner (
            id,
            request_type,
            status,
            user_id
          )
        `)
        .eq('admin_user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedNotifications = (data || []).map(notif => ({
        ...notif,
        notification_type: notif.notification_type as GDPRNotification['notification_type'],
        priority: notif.priority as GDPRNotification['priority'],
        request: notif.gdpr_requests ? {
          ...notif.gdpr_requests,
          request_type: notif.gdpr_requests.request_type as GDPRRequest['request_type'],
          status: notif.gdpr_requests.status as GDPRRequest['status'],
          priority: 'medium' as GDPRRequest['priority'],
          requested_at: notif.created_at,
          created_at: notif.created_at,
          updated_at: notif.created_at,
          user_email: 'N/A',
          user_name: 'Användare'
        } : undefined
      })) as GDPRNotification[];

      setNotifications(formattedNotifications);
    } catch (err: any) {
      console.error('Error loading notifications:', err);
    }
  };

  // Skapa ny GDPR request
  const createRequest = async (
    requestType: GDPRRequest['request_type'],
    reason?: string,
    userMessage?: string
  ) => {
    if (!user?.id) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att skapa en GDPR-begäran",
        variant: "destructive"
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('gdpr_requests')
        .insert({
          user_id: user.id,
          request_type: requestType,
          reason,
          user_message: userMessage,
          priority: requestType === 'data_deletion' ? 'high' : 'medium'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "GDPR-begäran skickad",
        description: "Din begäran har skickats till administratörer för granskning",
      });

      await loadRequests(); // Uppdatera listan
      return data;
    } catch (err: any) {
      console.error('Error creating GDPR request:', err);
      toast({
        title: "Fel vid skapande av begäran",
        description: err.message,
        variant: "destructive"
      });
      return null;
    }
  };

  // Uppdatera request status (endast admins)
  const updateRequestStatus = async (
    requestId: string,
    status: GDPRRequest['status'],
    adminNotes?: string
  ) => {
    if (!isAdmin) {
      toast({
        title: "Åtkomst nekad",
        description: "Endast administratörer kan uppdatera GDPR-begäranden",
        variant: "destructive"
      });
      return false;
    }

    try {
      const updates: any = {
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString()
      };

      if (adminNotes) {
        updates.admin_notes = adminNotes;
      }

      if (status === 'approved') {
        updates.approved_by = user?.id;
      }

      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('gdpr_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Begäran uppdaterad",
        description: `Status ändrad till: ${status}`,
      });

      await loadRequests();
      return true;
    } catch (err: any) {
      console.error('Error updating request:', err);
      toast({
        title: "Fel vid uppdatering",
        description: err.message,
        variant: "destructive"
      });
      return false;
    }
  };

  // Markera notifikation som läst
  const markNotificationRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('gdpr_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      await loadNotifications();
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    loadRequests();
    if (isAdmin) {
      loadNotifications();
    }

    // Prenumerera på real-time uppdateringar
    const requestsChannel = supabase
      .channel('gdpr-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gdpr_requests'
        },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    const notificationsChannel = supabase
      .channel('gdpr-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gdpr_notifications'
        },
        () => {
          if (isAdmin) {
            loadNotifications();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [user?.id, isAdmin]);

  return {
    requests,
    notifications,
    loading,
    error,
    createRequest,
    updateRequestStatus,
    markNotificationRead,
    refreshRequests: loadRequests,
    refreshNotifications: loadNotifications,
    unreadNotificationCount: notifications.filter(n => !n.is_read).length
  };
};