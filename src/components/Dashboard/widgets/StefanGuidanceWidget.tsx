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
      <StefanGuidanceWidgetComponent />
    </div>
  );
};

export { StefanGuidanceWidget };
export default StefanGuidanceWidget;