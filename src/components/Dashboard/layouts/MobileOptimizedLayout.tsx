/**
 * 📱 MOBILE-FIRST OPTIMIZED LAYOUT
 * Responsiv layout optimerad för smartphones och tablets
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileOptimizedLayout: React.FC<MobileOptimizedLayoutProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8 space-y-6">
        {children}
      </main>
    </div>
  );
};

export default MobileOptimizedLayout;