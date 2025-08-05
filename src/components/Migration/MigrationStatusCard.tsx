import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, Clock, Database } from 'lucide-react';

interface MigrationStatusCardProps {
  title: string;
  description: string;
  legacyCount: number;
  migratedCount: number;
  status: 'pending' | 'in-progress' | 'completed' | 'warning';
}

export const MigrationStatusCard: React.FC<MigrationStatusCardProps> = ({
  title,
  description,
  legacyCount,
  migratedCount,
  status
}) => {
  const totalCount = legacyCount + migratedCount;
  const progressPercentage = totalCount > 0 ? (migratedCount / totalCount) * 100 : 0;

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <Database className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Klar</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Varning</Badge>;
      case 'in-progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Pågår</Badge>;
      default:
        return <Badge variant="outline">Väntar</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Migrerad:</span>
            <span className="font-medium">{migratedCount} / {totalCount}</span>
          </div>
          
          <Progress value={progressPercentage} className="h-2" />
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Legacy:</span>
              <span className="font-medium text-orange-600">{legacyCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Attribut:</span>
              <span className="font-medium text-green-600">{migratedCount}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};