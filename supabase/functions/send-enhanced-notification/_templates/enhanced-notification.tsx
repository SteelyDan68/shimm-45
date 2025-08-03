import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Button,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface EnhancedNotificationEmailProps {
  recipientName: string;
  notificationType: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: Record<string, any>;
  appUrl: string;
}

export const EnhancedNotificationEmail = ({
  recipientName,
  notificationType,
  title,
  content,
  priority,
  metadata = {},
  appUrl,
}: EnhancedNotificationEmailProps) => {
  const getNotificationIcon = () => {
    switch (notificationType) {
      case 'message_received': return '💬';
      case 'coaching_session_reminder': return '🎯';
      case 'assessment_deadline': return '📝';
      case 'system_announcement': return '📢';
      default: return '🔔';
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'low': return '#6B7280';
      case 'normal': return '#3B82F6';
      case 'high': return '#F59E0B';
      case 'urgent': return '#EF4444';
      default: return '#3B82F6';
    }
  };

  const getNotificationTypeText = () => {
    switch (notificationType) {
      case 'message_received': return 'Nytt meddelande';
      case 'coaching_session_reminder': return 'Coaching-påminnelse';
      case 'assessment_deadline': return 'Bedömningsdeadline';
      case 'system_announcement': return 'Systemmeddelande';
      default: return 'Notifiering';
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerText}>
              {getNotificationIcon()} Plattformen
            </Text>
          </Section>

          {/* Priority indicator */}
          {priority !== 'normal' && (
            <Section style={{
              ...priorityBanner,
              backgroundColor: getPriorityColor(),
            }}>
              <Text style={priorityText}>
                {priority === 'urgent' ? '🚨 BRÅDSKANDE' : 
                 priority === 'high' ? '⚡ HÖG PRIORITET' : 
                 '🔽 LÅG PRIORITET'}
              </Text>
            </Section>
          )}

          {/* Greeting */}
          <Text style={greeting}>
            Hej {recipientName}!
          </Text>

          {/* Notification type */}
          <Text style={notificationType}>
            {getNotificationTypeText()}
          </Text>

          {/* Title */}
          <Heading style={h1}>{title}</Heading>

          {/* Content */}
          <Text style={content}>{content}</Text>

          {/* Metadata */}
          {Object.keys(metadata).length > 0 && (
            <Section style={metadataSection}>
              <Text style={metadataTitle}>Ytterligare information:</Text>
              {Object.entries(metadata).map(([key, value]) => (
                <Text key={key} style={metadataItem}>
                  <strong>{key}:</strong> {String(value)}
                </Text>
              ))}
            </Section>
          )}

          {/* Action button */}
          <Section style={buttonSection}>
            <Button style={button} href={`${appUrl}/messages`}>
              Gå till plattformen
            </Button>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Text style={footer}>
            Du får detta meddelande eftersom du är registrerad på Plattformen.
            <br />
            För att ändra dina notifieringsinställningar,{' '}
            <Link href={`${appUrl}/profile`} style={link}>
              klicka här
            </Link>
            .
          </Text>

          <Text style={footerSmall}>
            © 2024 Plattformen. Alla rättigheter förbehållna.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default EnhancedNotificationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const header = {
  backgroundColor: '#1e293b',
  padding: '20px 40px',
  textAlign: 'center' as const,
};

const headerText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const priorityBanner = {
  padding: '12px 40px',
  textAlign: 'center' as const,
  marginBottom: '0',
};

const priorityText = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0',
  textTransform: 'uppercase' as const,
};

const greeting = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 40px 0',
};

const notificationType = {
  color: '#64748b',
  fontSize: '14px',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '8px 40px 0',
};

const h1 = {
  color: '#1e293b',
  fontSize: '28px',
  fontWeight: 'bold',
  lineHeight: '36px',
  margin: '16px 40px 24px',
};

const content = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 40px 24px',
};

const metadataSection = {
  backgroundColor: '#f1f5f9',
  padding: '16px 40px',
  margin: '0 40px 24px',
  borderRadius: '8px',
};

const metadataTitle = {
  color: '#334155',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px',
};

const metadataItem = {
  color: '#64748b',
  fontSize: '14px',
  margin: '4px 0',
  lineHeight: '20px',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '20px 40px',
};

const footer = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 40px',
  textAlign: 'center' as const,
};

const footerSmall = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '16px 40px 0',
  textAlign: 'center' as const,
};

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
};