import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface InvitationEmailProps {
  invitedBy: string
  invitationToken: string
  role: string
  appUrl: string
  customMessage?: string
}

export const InvitationEmail = ({
  invitedBy,
  invitationToken,
  role,
  appUrl,
  customMessage,
}: InvitationEmailProps) => (
  <Html>
    <Head />
    <Preview>Välkommen till SHIMMS - Din inbjudan väntar</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Välkommen till SHIMMS!</Heading>
        <Text style={text}>
          Hej!
        </Text>
        <Text style={text}>
          Du har blivit inbjuden av {invitedBy} att använda SHIMMS - en personlig utvecklingsplattform som {role}.
        </Text>
        
        {customMessage && (
          <Text style={{ ...text, backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
            <strong>Meddelande från {invitedBy}:</strong><br />
            {customMessage}
          </Text>
        )}
        
        <Text style={text}>
          Klicka på länken nedan för att slutföra din registrering och komma igång:
        </Text>
        
        <Link
          href={`${appUrl}/invitation-signup?token=${invitationToken}`}
          target="_blank"
          style={{
            ...link,
            display: 'block',
            marginBottom: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            textAlign: 'center' as const,
          }}
        >
          Slutför registrering och logga in
        </Link>
        
        <Text style={{ ...text, color: '#6c757d', fontSize: '14px' }}>
          Om länken inte fungerar, kopiera och klistra in denna URL i din webbläsare:
          <br />
          {appUrl}/invitation-signup?token={invitationToken}
        </Text>
        
        <Text style={{ ...text, color: '#6c757d', fontSize: '12px', marginTop: '24px' }}>
          Om du inte förväntade dig denna inbjudan kan du ignorera detta e-postmeddelande.
          <br />
          Detta meddelande går inte att svara på.
        </Text>
        
        <Text style={footer}>
          Med vänliga hälsningar,<br />
          SHIMMS-teamet
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InvitationEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  paddingLeft: '20px',
  paddingRight: '20px',
  margin: '0 auto',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
}

const link = {
  color: '#007bff',
  fontSize: '16px',
  textDecoration: 'underline',
}

const text = {
  color: '#333',
  fontSize: '16px',
  margin: '16px 0',
  lineHeight: '1.5',
}

const footer = {
  color: '#6c757d',
  fontSize: '14px',
  lineHeight: '22px',
  marginTop: '32px',
  marginBottom: '24px',
}