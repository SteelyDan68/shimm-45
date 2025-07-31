import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface MessageNotificationProps {
  senderName: string;
  subject?: string;
  messagePreview: string;
  appUrl: string;
}

export const MessageNotification = ({
  senderName,
  subject,
  messagePreview,
  appUrl,
}: MessageNotificationProps) => (
  <Html>
    <Head />
    <Preview>{`Nytt meddelande från ${senderName}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Nytt meddelande</Heading>
        <Text style={text}>
          Du har fått ett nytt meddelande från <strong>{senderName}</strong>.
        </Text>
        {subject && (
          <Text style={text}>
            <strong>Ämne:</strong> {subject}
          </Text>
        )}
        <Text style={messageBox}>
          {messagePreview}
        </Text>
        <Link
          href={`${appUrl}/messages`}
          target="_blank"
          style={button}
        >
          Läs meddelandet
        </Link>
        <Text style={{ ...text, color: '#666', marginTop: '32px' }}>
          Du kan hantera dina meddelandeinställningar i din profil.
        </Text>
        <Text style={footer}>
          Med vänliga hälsningar,<br />
          Plattformsteamet
        </Text>
      </Container>
    </Body>
  </Html>
);

export default MessageNotification;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '14px',
  margin: '24px 0',
  lineHeight: '1.5',
};

const messageBox = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '6px',
  color: '#495057',
  fontSize: '14px',
  fontStyle: 'italic',
  padding: '16px',
  margin: '24px 0',
  lineHeight: '1.5',
};

const button = {
  backgroundColor: '#000',
  borderRadius: '6px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: '500',
  lineHeight: '50px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  width: '200px',
  margin: '16px 0',
};

const footer = {
  color: '#666',
  fontSize: '12px',
  lineHeight: '1.5',
  marginTop: '32px',
};