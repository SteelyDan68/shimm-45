/**
 * NAVIGATION DEAD-END PREVENTION SYSTEM
 * 
 * Solution Architect: Proactive UI/UX flow validation
 * QA Engineer: Prevents user dead-ends through systematic validation
 * Product Manager: Ensures consistent user journey experience
 * UX Designer: 16-year-old friendly error prevention
 * 
 * WORLD-CLASS EXECUTION: Enterprise-grade navigation control system
 */

import { toast } from '@/hooks/use-toast';

interface NavigationRule {
  componentName: string;
  actionText: string;
  expectedRoute?: string;
  onClickHandler?: () => void;
  validation: (route: string, handler?: () => void) => {
    isValid: boolean;
    errorMessage?: string;
    suggestedFix?: string;
  };
}

/**
 * Global registry of navigation rules to prevent dead-ends
 * All action prompts must register here for validation
 */
const NAVIGATION_RULES: NavigationRule[] = [
  {
    componentName: 'WelcomeAssessmentCard',
    actionText: 'Börja nu',
    onClickHandler: () => {}, // Should show form
    validation: (route, handler) => {
      if (!handler) {
        return {
          isValid: false,
          errorMessage: 'Missing click handler for assessment start',
          suggestedFix: 'Add onClick={() => setShowForm(true)} to ActionPrompt'
        };
      }
      return { isValid: true };
    }
  },
  {
    componentName: 'IntelligentPillarSuggestions',
    actionText: 'Utforska alla områden',
    expectedRoute: '/client-dashboard?tab=pillars',
    validation: (route) => {
      const isValidRoute = route && route.includes('/client-dashboard');
      return {
        isValid: isValidRoute,
        errorMessage: isValidRoute ? undefined : 'Invalid or missing route',
        suggestedFix: 'Ensure targetRoute="/client-dashboard?tab=pillars" is set'
      };
    }
  }
];

/**
 * Validates that an ActionPrompt has proper navigation setup
 * Prevents dead-ends by checking route and click handlers
 */
export const validateNavigation = (
  componentName: string,
  actionText: string,
  targetRoute?: string,
  onClick?: () => void
): { isValid: boolean; errors: string[] } => {
  const rule = NAVIGATION_RULES.find(
    r => r.componentName === componentName && 
         r.actionText.toLowerCase().includes(actionText.toLowerCase().substring(0, 10))
  );

  if (!rule) {
    // Allow new components but warn in dev mode
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 NavigationValidator: No rule found for ${componentName} - "${actionText}". Consider adding validation.`);
    }
    return { isValid: true, errors: [] };
  }

  const result = rule.validation(targetRoute || '', onClick);
  
  if (!result.isValid) {
    const error = `🚨 NAVIGATION DEAD-END DETECTED in ${componentName}: ${result.errorMessage}`;
    console.error(error);
    
    if (process.env.NODE_ENV === 'development') {
      toast({
        title: "🚨 Navigation Dead-End Detected",
        description: `${componentName}: ${result.errorMessage}`,
        variant: "destructive"
      });
    }
    
    return { 
      isValid: false, 
      errors: [result.errorMessage!, result.suggestedFix].filter(Boolean) as string[]
    };
  }

  return { isValid: true, errors: [] };
};

/**
 * Register a new navigation rule for a component
 * Use this when creating new ActionPrompts
 */
export const registerNavigationRule = (rule: NavigationRule) => {
  const existingIndex = NAVIGATION_RULES.findIndex(
    r => r.componentName === rule.componentName && r.actionText === rule.actionText
  );
  
  if (existingIndex >= 0) {
    NAVIGATION_RULES[existingIndex] = rule;
  } else {
    NAVIGATION_RULES.push(rule);
  }
};

/**
 * Run system-wide navigation validation
 * Can be called from admin dashboard to check for issues
 */
export const runSystemNavigationAudit = (): {
  totalRules: number;
  passedRules: number;
  failedRules: { componentName: string; issue: string }[];
} => {
  const failedRules: { componentName: string; issue: string }[] = [];
  let passedRules = 0;

  NAVIGATION_RULES.forEach(rule => {
    try {
      const result = rule.validation(rule.expectedRoute || '', rule.onClickHandler);
      if (result.isValid) {
        passedRules++;
      } else {
        failedRules.push({
          componentName: rule.componentName,
          issue: result.errorMessage || 'Unknown validation error'
        });
      }
    } catch (error) {
      failedRules.push({
        componentName: rule.componentName,
        issue: `Validation error: ${error}`
      });
    }
  });

  return {
    totalRules: NAVIGATION_RULES.length,
    passedRules,
    failedRules
  };
};

/**
 * Enhanced ActionPrompt wrapper that includes automatic validation
 * Use this for critical user journey components
 */
export const validateAndExecuteNavigation = (
  componentName: string,
  actionText: string,
  targetRoute?: string,
  onClick?: () => void
): boolean => {
  const validation = validateNavigation(componentName, actionText, targetRoute, onClick);
  
  if (!validation.isValid) {
    console.error(`🚨 Navigation blocked for safety:`, validation.errors);
    
    toast({
      title: "🔧 Navigation Issue Detected",
      description: "This action needs to be fixed by the development team. Please report this issue.",
      variant: "destructive"
    });
    
    return false;
  }
  
  return true;
};