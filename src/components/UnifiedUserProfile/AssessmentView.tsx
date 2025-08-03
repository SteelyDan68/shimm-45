import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';
import { InsightAssessment } from '@/components/InsightAssessment/InsightAssessment';

interface AssessmentViewProps {
  userId: string;
  profile: any;
}

/**
 * ASSESSMENT VIEW
 * Specialized view for assessments and evaluation tools
 * Uses ONLY user_id - Single Source of Truth principle
 */
export const AssessmentView = ({ userId, profile }: AssessmentViewProps) => {
  const getUserName = () => {
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return fullName || profile.email || 'Namnlös användare';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Bedömningsverktyg
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <InsightAssessment 
              clientId={userId}
              clientName={getUserName()}
            />
            
            <div className="text-center py-8 text-muted-foreground">
              <p>Fler bedömningsverktyg kommer att läggas till här</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};