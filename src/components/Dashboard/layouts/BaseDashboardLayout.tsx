/**
 * 🏗️ ENTERPRISE-GRADE BASE DASHBOARD LAYOUT
 * Gemensam layout för alla dashboard-implementationer
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Settings, Bell, HelpCircle, LogOut, Menu, ChevronDown,
  Sparkles, Shield, Users, BarChart3
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../contexts/DashboardContext';

interface BaseDashboardLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showNavigation?: boolean;
  className?: string;
}

export const BaseDashboardLayout: React.FC<BaseDashboardLayoutProps> = ({
  children,
  showHeader = false, // Disabled redundant header since AppLayout handles navigation
  showNavigation = false, // Disabled redundant navigation since AppLayout has AppSidebar
  className = ""
}) => {
  const { state } = useDashboard();

  return (
    <div className={`${className}`}>
      {/* 🎯 MAIN CONTENT AREA - Clean layout without redundant navigation */}
      <main>
        {state.isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Laddar dashboard...</p>
            </Card>
          </div>
        ) : state.error ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <BarChart3 className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium mb-2">Dashboard-fel</h3>
              <p className="text-muted-foreground mb-4">{state.error}</p>
              <Button onClick={() => window.location.reload()}>
                Försök igen
              </Button>
            </Card>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
};