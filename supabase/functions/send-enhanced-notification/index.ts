import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { EnhancedNotificationEmail } from './_templates/enhanced-notification.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userId: string;
  type: 'message_received' | 'coaching_session_reminder' | 'assessment_deadline' | 'system_announcement';
  title: string;
  content: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: Record<string, any>;
  scheduleFor?: string; // ISO string
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Enhanced notification request received');

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { userId, type, title, content, priority = 'normal', metadata = {}, scheduleFor }: NotificationRequest = await req.json();

    console.log(`Creating notification for user ${userId}, type: ${type}`);

    // Get user's notification settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching notification settings:', settingsError);
    }

    // Use default settings if none found
    const userSettings = settings || {
      email_notifications: true,
      browser_notifications: false,
      internal_notifications: true,
      coaching_session_reminders: true,
      assessment_deadline_reminders: true,
      quiet_hours_start: null,
      quiet_hours_end: null,
      weekend_notifications: false
    };

    // Check if notification should be sent based on type and user settings
    const shouldSendNotification = () => {
      switch (type) {
        case 'message_received':
          return userSettings.internal_notifications;
        case 'coaching_session_reminder':
          return userSettings.coaching_session_reminders;
        case 'assessment_deadline':
          return userSettings.assessment_deadline_reminders;
        default:
          return true; // System announcements always go through
      }
    };

    if (!shouldSendNotification()) {
      console.log(`Notification type ${type} disabled for user ${userId}`);
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Notification skipped due to user preferences" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check quiet hours
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    if (!userSettings.weekend_notifications && isWeekend && priority !== 'urgent') {
      console.log(`Skipping weekend notification for user ${userId}`);
      // Schedule for Monday instead
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + (8 - now.getDay()) % 7);
      nextMonday.setHours(9, 0, 0, 0);
      scheduleFor = nextMonday.toISOString();
    }

    if (userSettings.quiet_hours_start && userSettings.quiet_hours_end && priority !== 'urgent') {
      const quietStart = userSettings.quiet_hours_start;
      const quietEnd = userSettings.quiet_hours_end;
      
      if (currentTime >= quietStart || currentTime <= quietEnd) {
        console.log(`Skipping notification during quiet hours for user ${userId}`);
        // Schedule for after quiet hours
        const nextAllowedTime = new Date(now);
        if (currentTime >= quietStart) {
          nextAllowedTime.setDate(now.getDate() + 1);
        }
        const [hours, minutes] = quietEnd.split(':');
        nextAllowedTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        scheduleFor = nextAllowedTime.toISOString();
      }
    }

    // Create notification in database
    const { data: notification, error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: userId,
        notification_type: type,
        title,
        content,
        priority,
        category: type.includes('coaching') ? 'coaching' : 
                 type.includes('assessment') ? 'assessment' : 
                 type.includes('message') ? 'general' : 'system',
        metadata,
        scheduled_for: scheduleFor || new Date().toISOString(),
        email_sent: false,
        browser_sent: false
      })
      .select()
      .single();

    if (notificationError) throw notificationError;

    console.log('Notification created:', notification.id);

    // If not scheduled for later, send immediately
    if (!scheduleFor || new Date(scheduleFor) <= new Date()) {
      // Send email notification if enabled
      if (userSettings.email_notifications) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('email, first_name, last_name')
          .eq('id', userId)
          .single();

        if (profile?.email) {
          try {
            console.log(`Sending email notification to ${profile.email}`);

            const html = await renderAsync(
              React.createElement(EnhancedNotificationEmail, {
                recipientName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
                notificationType: type,
                title,
                content,
                priority,
                metadata,
                appUrl: Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com') || 'https://your-app.com'
              })
            );

            const emailResponse = await resend.emails.send({
              from: "Plattformen <notifications@resend.dev>",
              to: [profile.email],
              subject: `${priority === 'urgent' ? '🚨 BRÅDSKANDE: ' : ''}${title}`,
              html,
            });

            if (emailResponse.error) {
              console.error('Email sending failed:', emailResponse.error);
              
              // Log delivery failure
              await supabaseClient
                .from('notification_delivery_log')
                .insert({
                  notification_id: notification.id,
                  delivery_method: 'email',
                  status: 'failed',
                  error_message: emailResponse.error.message
                });
            } else {
              console.log('Email sent successfully:', emailResponse.data?.id);
              
              // Update notification as email sent
              await supabaseClient
                .from('notifications')
                .update({ 
                  email_sent: true,
                  sent_at: new Date().toISOString()
                })
                .eq('id', notification.id);

              // Log successful delivery
              await supabaseClient
                .from('notification_delivery_log')
                .insert({
                  notification_id: notification.id,
                  delivery_method: 'email',
                  status: 'delivered',
                  delivery_metadata: { email_id: emailResponse.data?.id }
                });
            }
          } catch (emailError) {
            console.error('Email notification error:', emailError);
            
            await supabaseClient
              .from('notification_delivery_log')
              .insert({
                notification_id: notification.id,
                delivery_method: 'email',
                status: 'failed',
                error_message: emailError.message
              });
          }
        }
      }

      // Send real-time notification through Supabase channels
      await supabaseClient
        .channel(`notifications:${userId}`)
        .send({
          type: 'broadcast',
          event: 'new_notification',
          payload: {
            notification: {
              id: notification.id,
              type,
              title,
              content,
              priority,
              metadata,
              created_at: notification.created_at
            }
          }
        });

      console.log('Real-time notification sent');
    } else {
      console.log(`Notification scheduled for: ${scheduleFor}`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      notification_id: notification.id,
      message: scheduleFor ? `Notification scheduled for ${scheduleFor}` : "Notification sent successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in enhanced notification function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Ett fel uppstod vid skickandet av notifiering"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);