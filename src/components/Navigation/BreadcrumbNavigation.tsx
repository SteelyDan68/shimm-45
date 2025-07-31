import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface BreadcrumbNavigationProps {
  onBack?: () => void;
  showHome?: boolean;
  customPath?: Array<{ label: string; path?: string; }>;
}

export const BreadcrumbNavigation = ({ 
  onBack, 
  showHome = true, 
  customPath 
}: BreadcrumbNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getPathData = () => {
    if (customPath) return customPath;
    
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const pathData = [];
    
    // Add home
    if (showHome) {
      pathData.push({ label: 'Dashboard', path: '/client-dashboard' });
    }
    
    // Map common paths
    const pathMapping: Record<string, string> = {
      'client-dashboard': 'Dashboard',
      'pillars': 'Five Pillars',
      'analytics': 'Analys',
      'tasks': 'Uppgifter',
      'journey': 'Min resa',
      'edit-profile': 'Redigera Profil',
      'onboarding': 'Välkomstregistrering',
      'messages': 'Meddelanden'
    };
    
    pathSegments.forEach((segment, index) => {
      const label = pathMapping[segment] || segment;
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      pathData.push({ label, path });
    });
    
    return pathData;
  };

  const pathData = getPathData();

  return (
    <div className="flex items-center gap-2 py-2">
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Tillbaka
        </Button>
      )}
      
      {!onBack && pathData.length > 1 && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="h-4 w-4" />
          Tillbaka
        </Button>
      )}
      
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        {pathData.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span>/</span>}
            {item.path && index < pathData.length - 1 ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 font-normal text-muted-foreground hover:text-foreground"
                onClick={() => navigate(item.path!)}
              >
                {item.label}
              </Button>
            ) : (
              <span className={index === pathData.length - 1 ? "font-medium text-foreground" : ""}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
      
      {showHome && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/client-dashboard')}
          className="ml-auto"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Dashboard</span>
        </Button>
      )}
    </div>
  );
};