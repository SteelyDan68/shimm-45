import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavLink } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbNavigationProps {
  onBack?: () => void;
  customPath?: BreadcrumbItem[];
}

export const BreadcrumbNavigation = ({ onBack, customPath }: BreadcrumbNavigationProps) => {
  if (!customPath?.length) return null;

  return (
    <nav className="flex items-center space-x-2 mb-6">
      {onBack && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka
        </Button>
      )}
      
      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
        {customPath.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="mx-1">/</span>}
            {item.path ? (
              <NavLink 
                to={item.path} 
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </NavLink>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};