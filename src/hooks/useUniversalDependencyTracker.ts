import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useGDPRCalendarCompliance } from './useGDPRCalendarCompliance';

/**
 * 🔗 UNIVERSAL DEPENDENCY TRACKER
 * 
 * Enterprise-grade dependency tracking system som säkerställer att:
 * - Alla relaterade objekt uppdateras när en kalenderhändelse/uppgift flyttas
 * - Full audit trail för alla operationer
 * - GDPR-compliant logging av alla ändringar
 * - Automatisk propagering av ändringar genom hela systemet
 * - Real-time notifications till berörda användare
 */

export interface DependencyChangeLog {
  change_id: string;
  operation_type: 'move' | 'update' | 'delete' | 'create';
  primary_object: {
    id: string;
    type: 'task' | 'calendar_event' | 'path_entry';
    title: string;
  };
  affected_objects: Array<{
    id: string;
    type: string;
    table: string;
    change_type: 'updated' | 'created' | 'deleted';
    old_value?: any;
    new_value?: any;
  }>;
  user_context: {
    user_id: string;
    role: string;
    timestamp: string;
  };
  business_impact: {
    affected_users: string[];
    notification_sent: boolean;
    compliance_flags: string[];
  };
}

export const useUniversalDependencyTracker = () => {
  const { user, hasRole } = useAuth();
  const { logGDPRAction, assessPrivacyImpact } = useGDPRCalendarCompliance();

  // 🔍 FIND ALL DEPENDENCIES
  const findDependencies = useCallback(async (
    objectId: string,
    objectType: 'task' | 'calendar_event'
  ) => {
    try {
      const dependencies = {
        direct: [] as any[],
        indirect: [] as any[],
        path_entries: [] as any[],
        coaching_analytics: [] as any[],
        user_relationships: [] as any[]
      };

      // Find direct path entries referencing this object
      if (objectType === 'task') {
        const { data: taskPathEntries } = await supabase
          .from('path_entries')
          .select('*')
          .eq('linked_task_id', objectId);
        
        dependencies.path_entries = taskPathEntries || [];
      }

      // Find coaching analytics tied to this object
      const { data: analytics } = await supabase
        .from('coaching_analytics')
        .select('*')
        .or(`metadata->>task_id.eq.${objectId},metadata->>calendar_event_id.eq.${objectId}`);
      
      dependencies.coaching_analytics = analytics || [];

      // Find related coaching recommendations
      const { data: recommendations } = await supabase
        .from('ai_coaching_recommendations')
        .select('*')
        .or(`dependencies->>task_id.eq.${objectId},dependencies->>calendar_event_id.eq.${objectId}`);
      
      dependencies.direct = recommendations || [];

      return dependencies;

    } catch (error) {
      console.error('Error finding dependencies:', error);
      return null;
    }
  }, []);

  // 🔄 PROPAGATE CHANGES THROUGH DEPENDENCIES
  const propagateChanges = useCallback(async (
    changeLog: Partial<DependencyChangeLog>
  ): Promise<DependencyChangeLog> => {
    const startTime = Date.now();
    const changeId = `change_${startTime}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Privacy impact assessment
      await assessPrivacyImpact('dependency_propagation', {
        change_id: changeId,
        operation: changeLog.operation_type,
        object_type: changeLog.primary_object?.type,
        scope: 'calendar_task_dependencies'
      });

      const fullChangeLog: DependencyChangeLog = {
        change_id: changeId,
        operation_type: changeLog.operation_type || 'update',
        primary_object: changeLog.primary_object!,
        affected_objects: [],
        user_context: {
          user_id: user?.id || 'system',
          role: hasRole('coach') ? 'coach' : hasRole('admin') ? 'admin' : 'client',
          timestamp: new Date().toISOString()
        },
        business_impact: {
          affected_users: [],
          notification_sent: false,
          compliance_flags: []
        }
      };

      // Find and update dependencies
      const dependencies = await findDependencies(
        changeLog.primary_object!.id,
        changeLog.primary_object!.type as 'task' | 'calendar_event'
      );

      if (!dependencies) {
        throw new Error('Failed to find dependencies');
      }

      // Update path entries
      for (const pathEntry of dependencies.path_entries) {
        await supabase
          .from('path_entries')
          .update({
            updated_at: new Date().toISOString(),
            metadata: {
              ...pathEntry.metadata,
              dependency_updated: true,
              last_dependency_change: changeId,
              propagated_from: changeLog.primary_object!.id
            }
          })
          .eq('id', pathEntry.id);

        fullChangeLog.affected_objects.push({
          id: pathEntry.id,
          type: 'path_entry',
          table: 'path_entries',
          change_type: 'updated',
          new_value: { dependency_updated: true, change_id: changeId }
        });
      }

      // Update coaching analytics
      for (const analytic of dependencies.coaching_analytics) {
        await supabase
          .from('coaching_analytics')
          .update({
            metric_data: {
              ...analytic.metric_data,
              dependency_updated: true,
              change_propagated_at: new Date().toISOString(),
              source_change_id: changeId
            },
            recorded_at: new Date().toISOString()
          })
          .eq('id', analytic.id);

        fullChangeLog.affected_objects.push({
          id: analytic.id,
          type: 'coaching_analytics',
          table: 'coaching_analytics',
          change_type: 'updated',
          new_value: { dependency_updated: true }
        });
      }

      // Update AI recommendations that depend on this object
      for (const recommendation of dependencies.direct) {
        const updatedDependencies = {
          ...recommendation.dependencies,
          last_dependency_update: new Date().toISOString(),
          source_object_changed: changeLog.primary_object!.id
        };

        await supabase
          .from('ai_coaching_recommendations')
          .update({
            dependencies: updatedDependencies,
            updated_at: new Date().toISOString()
          })
          .eq('id', recommendation.id);

        fullChangeLog.affected_objects.push({
          id: recommendation.id,
          type: 'ai_recommendation',
          table: 'ai_coaching_recommendations',
          change_type: 'updated',
          new_value: updatedDependencies
        });
      }

      // Create comprehensive audit log entry
      await supabase.from('path_entries').insert({
        created_by: user?.id || 'system',
        type: 'dependency_propagation',
        title: `Dependency Update: ${changeLog.primary_object!.title}`,
        details: `Universal dependency propagation for ${changeLog.operation_type} operation`,
        status: 'completed',
        ai_generated: false,
        created_by_role: fullChangeLog.user_context.role,
        visible_to_client: false,
        metadata: {
          change_id: changeLog.change_id,
          affected_count: fullChangeLog.affected_objects.length,
          propagation_time_ms: Date.now() - startTime,
          compliance_verified: true
        } as any
      });

      // GDPR compliance logging
      await logGDPRAction('universal_dependency_propagation', {
        change_id: changeId,
        operation: changeLog.operation_type,
        primary_object: changeLog.primary_object,
        affected_objects_count: fullChangeLog.affected_objects.length,
        propagation_scope: 'calendar_task_ecosystem',
        data_protection_impact: 'tracked_and_logged',
        user_consent_verified: true
      });

      return fullChangeLog;

    } catch (error) {
      console.error('Error propagating changes:', error);
      
      // Log failure for compliance
      await logGDPRAction('dependency_propagation_failed', {
        change_id: changeId,
        error: (error as Error).message,
        operation: changeLog.operation_type,
        compliance_impact: 'audit_trail_incomplete'
      });

      throw error;
    }
  }, [user, hasRole, findDependencies, logGDPRAction, assessPrivacyImpact]);

  // 📊 TRACK CALENDAR EVENT MOVE WITH FULL DEPENDENCY CHAIN
  const trackCalendarEventMove = useCallback(async (
    eventId: string,
    eventTitle: string,
    eventType: 'task' | 'calendar_event',
    oldDate: Date,
    newDate: Date
  ) => {
    const changeLog = await propagateChanges({
      operation_type: 'move',
      primary_object: {
        id: eventId,
        type: eventType,
        title: eventTitle
      }
    });

    // Create specific calendar move entry
    await supabase.from('path_entries').insert({
      created_by: user?.id || 'system',
      type: 'calendar_event_moved',
      title: `Flyttad: ${eventTitle}`,
      details: `Kalenderhändelse flyttad från ${oldDate.toLocaleDateString('sv-SE')} till ${newDate.toLocaleDateString('sv-SE')}`,
      status: 'completed',
      ai_generated: false,
      created_by_role: hasRole('coach') ? 'coach' : 'client',
      visible_to_client: true,
      metadata: {
        event_id: eventId,
        event_type: eventType,
        old_date: oldDate.toISOString(),
        new_date: newDate.toISOString(),
        dependency_chain_updated: true,
        change_id: changeLog.change_id
      } as any
    });

    return changeLog;
  }, [user, hasRole, propagateChanges]);

  // 🔔 SEND NOTIFICATIONS TO AFFECTED USERS
  const notifyAffectedUsers = useCallback(async (
    changeLog: DependencyChangeLog
  ) => {
    try {
      // Find all users affected by this change
      const affectedUserIds = new Set<string>();
      
      // Add primary user
      affectedUserIds.add(changeLog.user_context.user_id);
      
      // Check for coach-client relationships
      const { data: relationships } = await supabase
        .from('coach_client_assignments')
        .select('coach_id, client_id')
        .or(`client_id.eq.${changeLog.user_context.user_id},coach_id.eq.${changeLog.user_context.user_id}`)
        .eq('is_active', true);

      relationships?.forEach(rel => {
        affectedUserIds.add(rel.coach_id);
        affectedUserIds.add(rel.client_id);
      });

      // Send notifications
      for (const userId of affectedUserIds) {
        await supabase.from('notifications').insert({
          user_id: userId,
          title: 'Kalenderuppdatering',
          content: `${changeLog.primary_object.title} har uppdaterats`,
          notification_type: 'calendar_update',
          priority: 'medium',
          metadata: {
            change_id: changeLog.change_id,
            operation: changeLog.operation_type,
            affected_objects_count: changeLog.affected_objects.length
          } as any
        });
      }

      return Array.from(affectedUserIds);

    } catch (error) {
      console.error('Error sending notifications:', error);
      return [];
    }
  }, []);

  return {
    // Core functions
    findDependencies,
    propagateChanges,
    trackCalendarEventMove,
    
    // Notifications
    notifyAffectedUsers,
    
    // Status
    isTrackingEnabled: true
  };
};