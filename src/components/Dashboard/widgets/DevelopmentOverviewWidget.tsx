/**
 * 📊 DEVELOPMENT OVERVIEW WIDGET - Utvecklingsöversikt
 */

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { WidgetProps } from '../types/dashboard-types';
import { DevelopmentOverviewContent } from './DevelopmentOverviewContent';

const DevelopmentOverviewWidget: React.FC<WidgetProps> = ({ widget, stats, onAction }) => {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-lg font-semibold">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          Utvecklingsöversikt
        </div>
      </div>
      
      <DevelopmentOverviewContent />
    </div>
  );
};

export { DevelopmentOverviewWidget };
export default DevelopmentOverviewWidget;