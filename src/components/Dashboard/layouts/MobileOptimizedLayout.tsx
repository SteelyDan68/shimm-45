/**
 * 📱 MOBILE-FIRST OPTIMIZED LAYOUT
 * Responsiv layout optimerad för smartphones och tablets
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Bell, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

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
    { label: 'Översikt', href: '/client-dashboard', icon: '🏠' },
    { label: 'Självskattning', href: '/my-assessments', icon: '📋' },
    { label: 'Analyser', href: '/my-analyses', icon: '🧠' },
    { label: 'Program', href: '/my-program', icon: '🎯' },
    { label: 'Guidad självskattning', href: '/guided-assessment', icon: '🚀' }
  ];

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Mobile Header */}
      {showNavigation && (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between px-4">
            {/* Menu Button */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Öppna meny</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[350px]">
                <nav className="flex flex-col gap-4 mt-6">
                  <div className="px-4 py-2 text-lg font-semibold">SHIMMS</div>
                  {navigationItems.map((item) => (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) => cn(
                        'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                        isActive ? 'bg-muted text-primary' : 'hover:bg-muted'
                      )}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo/Brand */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">SHIMMS</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
                <span className="sr-only">Notifikationer</span>
              </Button>
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4" />
                <span className="sr-only">Profil</span>
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Desktop Navigation */}
      {showNavigation && (
        <nav className="hidden md:flex items-center justify-center gap-6 py-4 border-b">
          {navigationItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => cn(
                'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive ? 'bg-muted text-primary' : 'hover:bg-muted'
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8 space-y-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="flex items-center justify-around py-2">
          {navigationItems.slice(0, 4).map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => cn(
                'flex flex-col items-center gap-1 p-2 text-xs font-medium rounded-lg transition-colors',
                isActive ? 'bg-muted text-primary' : 'hover:bg-muted'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="truncate max-w-[60px]">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Mobile padding for bottom navigation */}
      <div className="md:hidden h-16"></div>
    </div>
  );
};

export default MobileOptimizedLayout;