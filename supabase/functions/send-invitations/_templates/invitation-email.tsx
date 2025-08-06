import React from 'npm:react@18.3.1';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Button,
  Hr,
} from 'npm:@react-email/components@0.0.22';

interface InvitationEmailProps {
  invitedBy: string;
  invitationToken: string;
  role: string;
  appUrl: string;
  customMessage?: string;
}

export const InvitationEmail: React.FC<InvitationEmailProps> = ({
  invitedBy,
  invitationToken,
  role,
  appUrl,
  customMessage
}) => {
  const invitationUrl = `${appUrl}/invitation-signup?token=${invitationToken}`;

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={h1}>Du har fått en inbjudan!</Text>
            
            <Text style={paragraph}>
              {invitedBy} har bjudit in dig till plattformen som {role}.
            </Text>

            {customMessage && (
              <>
                <Text style={paragraphBold}>Personligt meddelande:</Text>
                <Text style={messageBox}>
                  {customMessage}
                </Text>
              </>
            )}

            <Text style={paragraph}>
              Klicka på knappen nedan för att acceptera inbjudan och skapa ditt konto:
            </Text>

            <Button style={button} href={invitationUrl}>
              Acceptera inbjudan
            </Button>

            <Text style={paragraph}>
              Eller kopiera och klistra in denna länk i din webbläsare:
            </Text>
            
            <Text style={linkText}>
              <Link href={invitationUrl} style={link}>
                {invitationUrl}
              </Link>
            </Text>

            <Hr style={hr} />
            
            <Text style={footer}>
              Denna inbjudan kommer att upphöra inom 7 dagar. Om du inte vill gå med kan du ignorera detta email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
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

const box = {
  padding: '0 48px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
};

const paragraphBold = {
  ...paragraph,
  fontWeight: 'bold',
  marginBottom: '8px',
};

const messageBox = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '6px',
  padding: '16px',
  color: '#495057',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px 0',
  margin: '24px 0',
};

const linkText = {
  ...paragraph,
  fontSize: '14px',
  color: '#666',
};

const link = {
  color: '#5469d4',
  textDecoration: 'underline',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
};