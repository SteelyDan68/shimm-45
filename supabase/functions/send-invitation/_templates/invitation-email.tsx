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

interface InvitationEmailProps {
  invitedBy: string;
  invitationToken: string;
  role: string;
  appUrl: string;
}

export const InvitationEmail = ({
  invitedBy,
  invitationToken,
  role,
  appUrl,
}: InvitationEmailProps) => (
  <Html>
    <Head />
    <Preview>Du har blivit inbjuden till plattformen</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Inbjudan till plattformen</Heading>
        <Text style={text}>
          Hej! Du har blivit inbjuden av <strong>{invitedBy}</strong> att gå med i vår plattform som <strong>{role}</strong>.
        </Text>
        <Text style={text}>
          Klicka på länken nedan för att acceptera inbjudan och skapa ditt konto:
        </Text>
        <Link
          href={`${appUrl}/invitation-signup?token=${invitationToken}`}
          target="_blank"
          style={button}
        >
          Acceptera inbjudan
        </Link>
        <Text style={{ ...text, color: '#666', marginTop: '32px' }}>
          Om du inte förväntade dig denna inbjudan kan du ignorera detta mail.
        </Text>
        <Text style={footer}>
          Med vänliga hälsningar,<br />
          Plattformsteamet
        </Text>
      </Container>
    </Body>
  </Html>
);

export default InvitationEmail;

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