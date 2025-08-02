import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface RealtimeMetrics {
  activeUsers: number;
  newAssessments: number;
  systemHealth: number;
  lastUpdate: string;
  criticalAlerts: number;
  pillarCompletions: Record<string, number>;
  engagementTrend: 'up' | 'down' | 'stable';
}

export const useAdminRealtime = () => {
  const { user, hasRole } = useAuth();
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    activeUsers: 0,
    newAssessments: 0,
    systemHealth: 100,
    lastUpdate: new Date().toISOString(),
    criticalAlerts: 0,
    pillarCompletions: {
      self_care: 0,
      skills: 0,
      talent: 0,
      brand: 0,
      economy: 0
    },
    engagementTrend: 'stable'
  });
  
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<Array<{
    type: string;
    data: any;
    timestamp: string;
  }>>([]);

  useEffect(() => {
    // Endast för administratörer
    if (!user || (!hasRole('admin') && !hasRole('superadmin'))) {
      return;
    }

    // Realtidskanal för admin-metrics
    const adminChannel = supabase
      .channel('admin-realtime-metrics')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'pillar_assessments' },
        (payload) => {
          const event = {
            type: 'new_assessment',
            data: payload.new,
            timestamp: new Date().toISOString()
          };
          
          setEvents(prev => [event, ...prev.slice(0, 49)]); // Behåll senaste 50
          
          setMetrics(prev => ({
            ...prev,
            newAssessments: prev.newAssessments + 1,
            lastUpdate: new Date().toISOString(),
            pillarCompletions: {
              ...prev.pillarCompletions,
              [payload.new.pillar_key]: (prev.pillarCompletions[payload.new.pillar_key] || 0) + 1
            }
          }));
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const event = {
            type: 'user_activity',
            data: payload.new,
            timestamp: new Date().toISOString()
          };
          
          setEvents(prev => [event, ...prev.slice(0, 49)]);
          
          // Uppdatera active users baserat på senaste aktivitet
          updateActiveUsers();
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'error_logs' },
        (payload) => {
          const event = {
            type: 'system_error',
            data: payload.new,
            timestamp: new Date().toISOString()
          };
          
          setEvents(prev => [event, ...prev.slice(0, 49)]);
          
          if (payload.new.severity === 'critical') {
            setMetrics(prev => ({
              ...prev,
              criticalAlerts: prev.criticalAlerts + 1,
              systemHealth: Math.max(prev.systemHealth - 5, 0)
            }));
          }
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    // Användaraktivitet tracking
    const userActivityChannel = supabase
      .channel('user-presence')
      .on('presence', { event: 'sync' }, () => {
        const state = userActivityChannel.presenceState();
        const activeCount = Object.keys(state).length;
        
        setMetrics(prev => ({
          ...prev,
          activeUsers: activeCount,
          lastUpdate: new Date().toISOString()
        }));
      })
      .subscribe();

    // Beräkna engagemangstrend varje minut
    const trendInterval = setInterval(() => {
      calculateEngagementTrend();
    }, 60000);

    return () => {
      supabase.removeChannel(adminChannel);
      supabase.removeChannel(userActivityChannel);
      clearInterval(trendInterval);
    };
  }, [user, hasRole]);

  const updateActiveUsers = async () => {
    try {
      // Hämta användare som varit aktiva senaste 5 minuterna
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', fiveMinutesAgo);

      setMetrics(prev => ({
        ...prev,
        activeUsers: count || 0,
        lastUpdate: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error updating active users:', error);
    }
  };

  const calculateEngagementTrend = () => {
    // Analysera de senaste events för att beräkna trend
    const recentEvents = events.filter(e => 
      new Date(e.timestamp) > new Date(Date.now() - 10 * 60 * 1000) // Senaste 10 minuterna
    );

    const assessmentEvents = recentEvents.filter(e => e.type === 'new_assessment').length;
    const activityEvents = recentEvents.filter(e => e.type === 'user_activity').length;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    
    if (assessmentEvents > 5 || activityEvents > 10) {
      trend = 'up';
    } else if (assessmentEvents === 0 && activityEvents < 3) {
      trend = 'down';
    }

    setMetrics(prev => ({
      ...prev,
      engagementTrend: trend
    }));
  };

  const getRecentEvents = (limit: number = 20) => {
    return events.slice(0, limit);
  };

  const clearAlerts = () => {
    setMetrics(prev => ({
      ...prev,
      criticalAlerts: 0,
      systemHealth: Math.min(prev.systemHealth + 10, 100)
    }));
  };

  const exportMetrics = () => {
    const exportData = {
      metrics,
      events: events.slice(0, 100),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-metrics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return {
    metrics,
    connected,
    events: getRecentEvents(),
    clearAlerts,
    exportMetrics,
    isRealtime: connected
  };
};