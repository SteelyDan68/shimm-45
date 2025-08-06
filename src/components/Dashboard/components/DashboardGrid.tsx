/**
 * 🎯 ENTERPRISE-GRADE DASHBOARD GRID
 * Responsiv grid-layout för dashboard widgets
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '../types/dashboard-types';

interface DashboardGridProps {
  children: React.ReactNode;
  layout: DashboardLayout;
  gridCols?: number;
  className?: string;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  children,
  layout,
  gridCols = 12,
  className = ""
}) => {
  
  const getGridClasses = () => {
    const baseClasses = "grid gap-6 w-full";
    
    // Responsive grid baserat på layout och gridCols
    const responsiveClasses = `
      grid-cols-1 
      sm:grid-cols-2 
      lg:grid-cols-${Math.min(gridCols, 4)}
      xl:grid-cols-${Math.min(gridCols, 6)}
      2xl:grid-cols-${gridCols}
    `;
    
    // Layout-specifika anpassningar
    const layoutClasses = {
      'client-focused': 'max-w-6xl mx-auto',
      'management-focused': 'max-w-7xl mx-auto', 
      'full-control': 'max-w-full',
      'minimal': 'max-w-4xl mx-auto'
    };
    
    return cn(
      baseClasses,
      responsiveClasses,
      layoutClasses[layout],
      className
    );
  };

  return (
    <div className={getGridClasses()}>
      {children}
    </div>
  );
};