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
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface WeeklySummaryEmailProps {
  clientName: string
  weeklyData: {
    pathEntries: Array<{
      type: string
      title: string
      date: string
    }>
    completedTasks: number
    pendingTasks: number
    newAssessments: number
    velocityRank?: number
    pillarStatus: Array<{
      name: string
      score: number
      icon: string
    }>
  }
  aiSummary: string
  quoteOfWeek: string
}

export const WeeklySummaryEmail = ({
  clientName,
  weeklyData,
  aiSummary,
  quoteOfWeek,
}: WeeklySummaryEmailProps) => (
  <Html>
    <Head />
    <Preview>Din veckosammanfattning är här! 📊</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Hej {clientName}! 👋</Heading>
        
        <Text style={text}>
          Här är din personliga sammanfattning för veckan som gått:
        </Text>

        {/* Weekly Stats */}
        <Section style={statsSection}>
          <Heading style={h2}>📈 Veckans siffror</Heading>
          <Text style={statText}>
            ✅ <strong>{weeklyData.completedTasks}</strong> uppgifter genomförda<br/>
            📝 <strong>{weeklyData.newAssessments}</strong> nya självskattningar<br/>
            📋 <strong>{weeklyData.pendingTasks}</strong> uppgifter kvarstående<br/>
            🎯 <strong>{weeklyData.pathEntries.length}</strong> utvecklingssteg dokumenterade
          </Text>
        </Section>

        <Hr style={hr} />

        {/* AI Summary */}
        <Section style={summarySection}>
          <Heading style={h2}>🧠 Din coach-reflektion</Heading>
          <Text style={text}>
            {aiSummary}
          </Text>
        </Section>

        <Hr style={hr} />

        {/* Pillar Status */}
        {weeklyData.pillarStatus.length > 0 && (
          <>
            <Section style={pillarSection}>
              <Heading style={h2}>⭐ Five Pillars Status</Heading>
              {weeklyData.pillarStatus.map((pillar, index) => (
                <Text key={index} style={pillarText}>
                  {pillar.icon} <strong>{pillar.name}:</strong> {pillar.score}/10
                </Text>
              ))}
            </Section>
            <Hr style={hr} />
          </>
        )}

        {/* Quote of the Week */}
        <Section style={quoteSection}>
          <Heading style={h2}>💭 Veckans inspiration</Heading>
          <Text style={quoteText}>
            "{quoteOfWeek}"
          </Text>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          Fortsätt den fantastiska resan! 🚀<br/>
          <Link href="https://yourapp.com" style={link}>
            Logga in för att se mer detaljer
          </Link>
        </Text>

        <Text style={footerSmall}>
          Detta email skickades automatiskt varje måndag från ditt utvecklingsstöd.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default WeeklySummaryEmail

const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px',
  maxWidth: '600px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
}

const h1 = {
  color: '#1e293b',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '30px 0 20px 0',
  lineHeight: '1.3',
}

const h2 = {
  color: '#334155',
  fontSize: '20px',
  fontWeight: '600',
  margin: '25px 0 15px 0',
  lineHeight: '1.4',
}

const text = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
}

const statText = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.8',
  margin: '16px 0',
  backgroundColor: '#f1f5f9',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
}

const pillarText = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '8px 0',
}

const quoteText = {
  color: '#3b82f6',
  fontSize: '18px',
  fontStyle: 'italic',
  lineHeight: '1.6',
  textAlign: 'center' as const,
  margin: '20px 0',
  padding: '20px',
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  border: '1px solid #bfdbfe',
}

const statsSection = {
  margin: '30px 0',
}

const summarySection = {
  margin: '30px 0',
}

const pillarSection = {
  margin: '30px 0',
}

const quoteSection = {
  margin: '30px 0',
}

const hr = {
  borderColor: '#e2e8f0',
  margin: '30px 0',
}

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
}

const footer = {
  color: '#64748b',
  fontSize: '16px',
  lineHeight: '1.6',
  textAlign: 'center' as const,
  margin: '30px 0 20px 0',
}

const footerSmall = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '1.5',
  textAlign: 'center' as const,
  margin: '20px 0',
}