import { UnifiedAIIntegrationTest } from '@/components/Testing/UnifiedAIIntegrationTest';

export const TestingPage = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">System Integration Testing</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive testing suite för att validera att alla AI-funktioner fungerar korrekt i production.
        </p>
      </div>
      
      <UnifiedAIIntegrationTest />
    </div>
  );
};