/**
 * 📰 ACTIVITY FEED WIDGET
 */
import React from 'react';
import { WidgetProps } from '../types/dashboard-types';

const ActivityFeedWidget: React.FC<WidgetProps> = ({ widget }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <div className="flex-1">
          <div className="font-medium text-sm">Assessment genomförd</div>
          <div className="text-xs text-muted-foreground">Självomvårdnad - idag</div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        <div className="flex-1">
          <div className="font-medium text-sm">Ny handlingsplan</div>
          <div className="text-xs text-muted-foreground">Stefan AI - igår</div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
        <div className="flex-1">
          <div className="font-medium text-sm">Mål uppnått</div>
          <div className="text-xs text-muted-foreground">Kompetensutveckling - 3 dagar sedan</div>
        </div>
      </div>
    </div>
  );
};

export default ActivityFeedWidget;