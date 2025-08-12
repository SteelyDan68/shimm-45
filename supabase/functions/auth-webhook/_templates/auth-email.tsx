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

interface AuthEmailProps {
  supabase_url: string;
  email_action_type: string;
  redirect_to: string;
  token_hash: string;
  token: string;
}

export const AuthEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
}: AuthEmailProps) => {
  const getEmailContent = () => {
    switch (email_action_type) {
      case 'signup':
        return {
          title: 'Bekräfta din e-postadress',
          preview: 'Bekräfta din e-postadress för att slutföra registreringen',
          message: 'Klicka på länken nedan för att bekräfta din e-postadress och slutföra registreringen.',
          buttonText: 'Bekräfta e-postadress',
        };
      case 'recovery':
        return {
          title: 'Återställ ditt lösenord',
          preview: 'Återställ ditt lösenord',
          message: 'Du har begärt att återställa ditt lösenord. Klicka på länken nedan för att skapa ett nytt lösenord.',
          buttonText: 'Återställ lösenord',
        };
      case 'magiclink':
        return {
          title: 'Logga in med magisk länk',
          preview: 'Din magiska inloggningslänk',
          message: 'Klicka på länken nedan för att logga in utan lösenord.',
          buttonText: 'Logga in',
        };
      default:
        return {
          title: 'Bekräfta din åtgärd',
          preview: 'Bekräfta din åtgärd',
          message: 'Klicka på länken nedan för att fortsätta.',
          buttonText: 'Fortsätt',
        };
    }
  };

  const content = getEmailContent();

  return (
    <Html>
      <Head />
      <Preview>{content.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{content.title}</Heading>
          <Text style={text}>{content.message}</Text>
          <Link
            href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
            target="_blank"
            style={button}
          >
            {content.buttonText}
          </Link>
          {email_action_type === 'magiclink' && (
            <>
              <Text style={{ ...text, marginTop: '32px' }}>
                Eller kopiera och klistra in denna temporära inloggningskod:
              </Text>
              <Text style={code}>{token}</Text>
            </>
          )}
          <Text style={{ ...text, color: '#666', marginTop: '32px' }}>
            Om du inte begärde detta kan du ignorera detta mail.
          </Text>
          <Text style={{ ...text, color: '#666', fontSize: '12px', fontWeight: 'bold' }}>
            Det här meddelandet går inte att svara på.
          </Text>
          <Text style={footer}>
            Med vänliga hälsningar,<br />
            SHIMMS-teamet
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default AuthEmail;

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

const code = {
  backgroundColor: '#f4f4f4',
  border: '1px solid #ddd',
  borderRadius: '4px',
  color: '#333',
  display: 'inline-block',
  fontFamily: 'monospace',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px 16px',
  margin: '8px 0',
};

const footer = {
  color: '#666',
  fontSize: '12px',
  lineHeight: '1.5',
  marginTop: '32px',
};