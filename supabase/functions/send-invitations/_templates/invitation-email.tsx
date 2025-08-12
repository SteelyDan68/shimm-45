import React from 'npm:react@18.3.1';

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
  customMessage,
}) => {
  const invitationUrl = `${appUrl}/invitation-signup?token=${invitationToken}`;

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Inbjudan till plattformen</title>
        <style>{`
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 30px 20px;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            border: 1px solid #e0e0e0;
            border-top: none;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: bold;
            text-align: center;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
          }
          .custom-message {
            background: #fff;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
        `}</style>
      </head>
      <body>
        <div className="header">
          <h1>Välkommen till SHIMMS!</h1>
          <p>SHIMMS - En AI-driven plattform för personal utveckling</p>
        </div>
        
        <div className="content">
          <p>
            Hej! Välkommen till SHIMMS! Du har blivit registrerad att kunna använda den personliga utvecklingsplattformen "SHIMMS" som klient. Logga in och börja din resa! :-)
          </p>
          
          {customMessage && (
            <div className="custom-message">
              <h3>Personligt meddelande:</h3>
              <p>{customMessage}</p>
            </div>
          )}
          
          <p>Klicka på knappen nedan för att logga in och börja din resa:</p>
          
          <div style={{ textAlign: 'center' }}>
            <a href={invitationUrl} className="button">
              Logga in på SHIMMS
            </a>
          </div>
          
          <p>
            Om knappen inte fungerar kan du kopiera och klistra in följande länk i din webbläsare:
          </p>
          <p style={{ wordBreak: 'break-all', background: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
            {invitationUrl}
          </p>
        </div>
        
        <div className="footer">
          <p>Denna inbjudan är giltig i 7 dagar.</p>
          <p>Om du inte förväntade dig denna inbjudan kan du ignorera detta e-postmeddelande.</p>
          <p><strong>Det här meddelandet går inte att svara på.</strong></p>
        </div>
      </body>
    </html>
  );
};