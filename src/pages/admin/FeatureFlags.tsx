/**
 * 🚩 FEATURE FLAGS ADMIN PANEL
 * Manage feature flags and experimental routes
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Flag, 
  Settings, 
  AlertTriangle, 
  Eye, 
  EyeOff,
  RefreshCw,
  Shield,
  Code,
  Zap,
  ExternalLink,
  Info
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useNavigation } from '@/hooks/useNavigation';
import {
  FEATURE_FLAGS,
  FEATURE_FLAG_METADATA,
  FeatureFlagKey,
  getAllFeatureFlags,
  toggleFeatureFlag,
  resetFeatureFlags,
  canAccessFeature
} from '@/config/FEATURE_FLAGS';

export const FeatureFlagsPage: React.FC = () => {
  const { user, roles, isSuperAdmin } = useAuth();  
  const { toast } = useToast();
  const { navigateTo } = useNavigation();
  
  const [flags, setFlags] = useState(getAllFeatureFlags());
  const [loading, setLoading] = useState<string | null>(null);

  // Ensure roles is an array and isSuperAdmin is a boolean
  const userRoles = Array.isArray(roles) ? roles : [];
  const isUserSuperAdmin = typeof isSuperAdmin === 'function' ? isSuperAdmin() : Boolean(isSuperAdmin);

  useEffect(() => {
    // Refresh flags state
    setFlags(getAllFeatureFlags());
  }, []);

  const handleToggleFlag = async (flag: FeatureFlagKey) => {
    setLoading(flag);
    
    try {
      const newValue = toggleFeatureFlag(flag);
      
      toast({
        title: 'Feature Flag Updated',
        description: `${FEATURE_FLAG_METADATA[flag].name} is now ${newValue ? 'enabled' : 'disabled'}. Page will reload.`,
      });
      
      // Note: toggleFeatureFlag will reload the page
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update feature flag',
        variant: 'destructive'
      });
      setLoading(null);
    }
  };

  const handleResetAll = () => {
    if (!confirm('Reset all feature flags to environment defaults? This will reload the page.')) {
      return;
    }
    
    resetFeatureFlags();
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'uncertain': return AlertTriangle;
      case 'experimental': return Zap;
      case 'development': return Code;
      default: return Flag;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'uncertain': return 'text-amber-600';
      case 'experimental': return 'text-purple-600';
      case 'development': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (!isUserSuperAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access denied. Feature flag management requires superadmin privileges.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const groupedFlags = Object.entries(FEATURE_FLAG_METADATA).reduce((acc, [key, meta]) => {
    if (!acc[meta.category]) acc[meta.category] = [];
    acc[meta.category].push({ key: key as FeatureFlagKey, meta });
    return acc;
  }, {} as Record<string, Array<{ key: FeatureFlagKey; meta: typeof FEATURE_FLAG_METADATA[FeatureFlagKey] }>>);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Flag className="h-8 w-8 text-primary" />
            Feature Flags
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage experimental routes and uncertain functionality
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="destructive"
            onClick={handleResetAll}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Reset All
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Feature flags control visibility of uncertain or experimental routes. 
          Changes persist in localStorage and require page reload to take effect.
        </AlertDescription>
      </Alert>

      {/* Feature Flag Groups */}
      {Object.entries(groupedFlags).map(([category, categoryFlags]) => {
        const CategoryIcon = getCategoryIcon(category);
        
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CategoryIcon className={`h-5 w-5 ${getCategoryColor(category)}`} />
                {category.charAt(0).toUpperCase() + category.slice(1)} Features
                <Badge variant="outline">
                  {categoryFlags.length} flags
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryFlags.map(({ key, meta }) => {
                const isEnabled = flags[key];
                const canUserAccess = canAccessFeature(key, userRoles, isUserSuperAdmin);
                const isLoading = loading === key;
                
                return (
                  <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {isEnabled ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-red-600" />
                          )}
                          <h3 className="font-semibold">{meta.name}</h3>
                        </div>
                        
                        <div className="flex gap-2">
                          <Badge variant={getRiskColor(meta.risk)}>
                            {meta.risk} risk
                          </Badge>
                          {meta.route && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              {meta.route}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {meta.description}
                      </p>
                      
                      {!canUserAccess && isEnabled && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Feature is enabled but user lacks required permissions
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {meta.route && isEnabled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateTo(meta.route!)}
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Visit
                        </Button>
                      )}
                      
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => handleToggleFlag(key)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Current Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Environment Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Environment Variables</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>VITE_ENABLE_DEVELOPMENT_OVERVIEW</p>
                <p>VITE_ENABLE_AI_INSIGHTS</p>
                <p>VITE_ENABLE_SYSTEM_MAP</p>
                <p>VITE_ENABLE_BETA_FEATURES</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Override Methods</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Environment variables (.env)</p>
                <p>• Runtime toggles (localStorage)</p>
                <p>• Admin panel controls</p>
              </div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Changes made here override environment defaults and persist until manually reset or cleared from localStorage.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureFlagsPage;