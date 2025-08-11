/**
 * 📱 MOBILE-FIRST OPTIMIZED LAYOUT
 * Responsiv layout optimerad för smartphones och tablets
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Bell, User } from 'lucide-react';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  className?: string;
  showNavigation?: boolean;
}

export const MobileOptimizedLayout: React.FC<MobileOptimizedLayoutProps> = ({
  children,
  className,
  showNavigation = true
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { label: 'Dashboard', href: '/client-dashboard', icon: '🏠' },
    { label: 'Assessments', href: '/my-assessments', icon: '📋' },
    { label: 'Analyser', href: '/my-analyses', icon: '🧠' },
    { label: 'Program', href: '/my-program', icon: '🎯' },
    { label: 'Guided Assessment', href: '/guided-assessment', icon: '🚀' }
  ];

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Main Content - No duplicate header since TopNavigation handles it */}
      <main className="container mx-auto px-4 py-6 md:py-8 space-y-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="flex items-center justify-around py-2">
          {navigationItems.slice(0, 4).map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 p-2 text-xs font-medium rounded-lg hover:bg-muted transition-colors"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="truncate max-w-[60px]">{item.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Mobile padding for bottom navigation */}
      <div className="md:hidden h-16"></div>
    </div>
  );
};

export default MobileOptimizedLayout;