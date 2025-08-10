/**
 * 🧠 STEFAN GUIDANCE WIDGET - Personlig AI-coaching guidance
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { WidgetProps } from '../types/dashboard-types';
import StefanGuidanceWidgetComponent from '@/components/Stefan/StefanGuidanceWidget';

const StefanGuidanceWidget: React.FC<WidgetProps> = ({ widget, stats, onAction }) => {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-lg font-semibold">
          <Sparkles className="w-5 h-5 text-blue-500" />
          Stefan säger
        </div>
      </div>
      
      <StefanGuidanceWidgetComponent />
    </div>
  );
};

export { StefanGuidanceWidget };
export default StefanGuidanceWidget;