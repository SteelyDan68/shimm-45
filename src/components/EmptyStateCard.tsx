import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface EmptyStateCardProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

/**
 * Consistent empty state component for views with no data
 */
export const EmptyStateCard = ({ 
  title = "Ingen data hittades",
  description = "Det finns ingen data att visa för tillfället.",
  icon = <AlertCircle className="h-12 w-12 text-muted-foreground" />,
  action
}: EmptyStateCardProps) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {icon}
        </div>
        <CardTitle className="text-xl text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          {description}
        </p>
        {action && (
          <div className="flex justify-center">
            {action}
          </div>
        )}
      </CardContent>
    </Card>
  );
};