/**
 * 🎨 DESIGN SYSTEM ENFORCEMENT UTILITY
 * SCRUM-TEAM UX/UI EXPERT IMPLEMENTATION
 * 
 * Fokus: Semantic color tokens, consistent styling, zero direct colors
 * Budget: 1 miljard kronor development standard
 */

/**
 * ⚠️ DEPRECATED COLOR PATTERNS DETECTOR
 * Identifierar och flaggar direkta färger som bryter designsystemet
 */
export const DEPRECATED_COLOR_PATTERNS = [
  // Direct colors that should use semantic tokens
  'bg-white', 'text-white', 'bg-black', 'text-black',
  'bg-gray-', 'text-gray-', 'border-gray-',
  'bg-red-', 'text-red-', 'border-red-',
  'bg-blue-', 'text-blue-', 'border-blue-',
  'bg-green-', 'text-green-', 'border-green-',
  'bg-yellow-', 'text-yellow-', 'border-yellow-',
  'bg-purple-', 'text-purple-', 'border-purple-',
  'bg-pink-', 'text-pink-', 'border-pink-',
  'bg-indigo-', 'text-indigo-', 'border-indigo-',
  'bg-orange-', 'text-orange-', 'border-orange-'
] as const;

/**
 * ✅ SEMANTIC COLOR TOKENS MAPPING
 * Mappar direkta färger till designsystemets semantiska tokens
 */
export const SEMANTIC_COLOR_MAPPING = {
  // Background colors
  'bg-white': 'bg-background',
  'bg-black': 'bg-foreground',
  'bg-gray-50': 'bg-muted',
  'bg-gray-100': 'bg-muted/50',
  'bg-gray-900': 'bg-foreground',
  
  // Text colors
  'text-white': 'text-background',
  'text-black': 'text-foreground',
  'text-gray-500': 'text-muted-foreground',
  'text-gray-600': 'text-muted-foreground',
  'text-gray-700': 'text-foreground/80',
  'text-gray-900': 'text-foreground',
  
  // Border colors
  'border-gray-200': 'border-border',
  'border-gray-300': 'border-border',
  'border-white': 'border-background',
  
  // Status colors (use semantic meanings)
  'bg-red-100': 'bg-destructive/10',
  'bg-red-500': 'bg-destructive',
  'bg-red-600': 'bg-destructive',
  'text-red-600': 'text-destructive',
  'text-red-800': 'text-destructive',
  'border-red-200': 'border-destructive/20',
  
  'bg-green-100': 'bg-success/10',
  'bg-green-500': 'bg-success',
  'bg-green-600': 'bg-success',
  'text-green-600': 'text-success',
  'text-green-800': 'text-success',
  'border-green-200': 'border-success/20',
  
  'bg-yellow-100': 'bg-warning/10',
  'bg-yellow-500': 'bg-warning',
  'bg-yellow-600': 'bg-warning',
  'text-yellow-600': 'text-warning',
  'text-yellow-800': 'text-warning',
  'border-yellow-200': 'border-warning/20',
  
  'bg-blue-100': 'bg-info/10',
  'bg-blue-500': 'bg-info',
  'bg-blue-600': 'bg-primary',
  'text-blue-600': 'text-primary',
  'text-blue-800': 'text-primary',
  'border-blue-200': 'border-primary/20',
  
  // Purple/Brain colors for AI
  'bg-purple-600': 'bg-brain',
  'bg-purple-500': 'bg-brain',
  'text-purple-600': 'text-brain',
  'border-purple-200': 'border-brain/20'
} as const;

/**
 * 🔍 COLOR PATTERN ANALYZER
 * Analyserar kod för designsystem-brott
 */
export const analyzeColorPatterns = (codeContent: string) => {
  const violations: Array<{
    pattern: string;
    line: number;
    suggestion: string;
    severity: 'error' | 'warning' | 'info';
  }> = [];

  const lines = codeContent.split('\n');
  
  lines.forEach((line, index) => {
    DEPRECATED_COLOR_PATTERNS.forEach(pattern => {
      if (line.includes(pattern)) {
        const suggestion = SEMANTIC_COLOR_MAPPING[pattern as keyof typeof SEMANTIC_COLOR_MAPPING] 
          || `Use semantic token instead of ${pattern}`;
        
        violations.push({
          pattern,
          line: index + 1,
          suggestion,
          severity: pattern.includes('white') || pattern.includes('black') ? 'error' : 'warning'
        });
      }
    });
  });

  return violations;
};

/**
 * 🎨 DESIGN SYSTEM VALIDATION
 * Validerar att komponenter följer designsystemet
 */
export const validateDesignSystemCompliance = (componentCode: string, componentName: string) => {
  const violations = analyzeColorPatterns(componentCode);
  
  const report = {
    componentName,
    totalViolations: violations.length,
    errors: violations.filter(v => v.severity === 'error').length,
    warnings: violations.filter(v => v.severity === 'warning').length,
    violations,
    complianceScore: Math.max(0, 100 - (violations.length * 5)),
    isCompliant: violations.length === 0
  };

  // Log violations in development
  if (process.env.NODE_ENV === 'development' && violations.length > 0) {
    console.group(`🎨 Design System Violations in ${componentName}`);
    violations.forEach(violation => {
      console.warn(`Line ${violation.line}: ${violation.pattern} → ${violation.suggestion}`);
    });
    console.groupEnd();
  }

  return report;
};

/**
 * 🔧 AUTOMATED COLOR MIGRATION
 * Automatiskt ersätter direkta färger med semantiska tokens
 */
export const migrateToSemanticColors = (codeContent: string): string => {
  let migratedCode = codeContent;
  
  Object.entries(SEMANTIC_COLOR_MAPPING).forEach(([deprecated, semantic]) => {
    const regex = new RegExp(`\\b${deprecated}\\b`, 'g');
    migratedCode = migratedCode.replace(regex, semantic);
  });
  
  return migratedCode;
};

/**
 * 📊 COMPONENT VARIANT ANALYZER
 * Analyserar och föreslår component variants för bättre konsistens
 */
export const analyzeComponentVariants = (componentCode: string) => {
  const variantSuggestions: Array<{
    type: 'button' | 'badge' | 'card' | 'input';
    currentPattern: string;
    suggestedVariant: string;
    reason: string;
  }> = [];

  // Button variant analysis
  if (componentCode.includes('bg-green-') && componentCode.includes('Button')) {
    variantSuggestions.push({
      type: 'button',
      currentPattern: 'bg-green-* custom styling',
      suggestedVariant: 'variant="success"',
      reason: 'Use semantic button variant instead of direct colors'
    });
  }

  if (componentCode.includes('bg-red-') && componentCode.includes('Button')) {
    variantSuggestions.push({
      type: 'button',
      currentPattern: 'bg-red-* custom styling',
      suggestedVariant: 'variant="destructive"',
      reason: 'Use semantic button variant instead of direct colors'
    });
  }

  // Badge variant analysis
  if (componentCode.includes('bg-purple-') && componentCode.includes('Badge')) {
    variantSuggestions.push({
      type: 'badge',
      currentPattern: 'bg-purple-* custom styling',
      suggestedVariant: 'variant="brain"',
      reason: 'Use brain variant for AI-related badges'
    });
  }

  return variantSuggestions;
};

/**
 * ⚡ PERFORMANCE-OPTIMIZED STYLE UTILITIES
 * Optimerade styling-funktioner som följer designsystemet
 */
export const createSemanticClasses = {
  status: (status: 'success' | 'error' | 'warning' | 'info') => {
    const baseClasses = 'px-2 py-1 rounded-md text-xs font-medium';
    const statusClasses = {
      success: 'bg-success/10 text-success border border-success/20',
      error: 'bg-destructive/10 text-destructive border border-destructive/20',
      warning: 'bg-warning/10 text-warning border border-warning/20',
      info: 'bg-info/10 text-info border border-info/20'
    };
    
    return `${baseClasses} ${statusClasses[status]}`;
  },

  priority: (priority: 'high' | 'medium' | 'low') => {
    const baseClasses = 'px-2 py-1 rounded-md text-xs font-medium';
    const priorityClasses = {
      high: 'bg-destructive/10 text-destructive border border-destructive/20',
      medium: 'bg-warning/10 text-warning border border-warning/20',
      low: 'bg-success/10 text-success border border-success/20'
    };
    
    return `${baseClasses} ${priorityClasses[priority]}`;
  },

  card: (variant: 'default' | 'highlighted' | 'success' | 'warning' | 'error' = 'default') => {
    const baseClasses = 'rounded-lg border bg-card text-card-foreground shadow-sm';
    const variantClasses = {
      default: '',
      highlighted: 'border-primary/20 bg-primary/5',
      success: 'border-success/20 bg-success/5',
      warning: 'border-warning/20 bg-warning/5',
      error: 'border-destructive/20 bg-destructive/5'
    };
    
    return `${baseClasses} ${variantClasses[variant]}`;
  },

  button: (variant: 'primary' | 'secondary' | 'success' | 'destructive' | 'brain' = 'primary') => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    const variantClasses = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      success: 'bg-success text-success-foreground hover:bg-success/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      brain: 'bg-brain text-brain-foreground hover:bg-brain/90'
    };
    
    return `${baseClasses} ${variantClasses[variant]}`;
  }
};

/**
 * 🧹 CSS CLEANUP UTILITIES
 * Hjälpfunktioner för att rensa upp CSS och förbättra performance
 */
export const optimizeCSSClasses = (classNames: string): string => {
  return classNames
    .split(/\s+/)
    .filter(Boolean)
    .filter((cls, index, arr) => arr.indexOf(cls) === index) // Remove duplicates
    .join(' ');
};

/**
 * 📏 RESPONSIVE DESIGN HELPERS
 * Hjälpfunktioner för konsistent responsive design
 */
export const createResponsiveClasses = {
  container: 'container mx-auto px-4 sm:px-6 lg:px-8',
  grid: (cols: { base?: number; sm?: number; md?: number; lg?: number; xl?: number }) => {
    const classes = ['grid', 'gap-4'];
    
    if (cols.base) classes.push(`grid-cols-${cols.base}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    
    return classes.join(' ');
  },
  
  spacing: (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => {
    const spacingMap = {
      xs: 'space-y-2',
      sm: 'space-y-4',
      md: 'space-y-6',
      lg: 'space-y-8',
      xl: 'space-y-12'
    };
    
    return spacingMap[size];
  }
};

export default {
  analyzeColorPatterns,
  validateDesignSystemCompliance,
  migrateToSemanticColors,
  analyzeComponentVariants,
  createSemanticClasses,
  optimizeCSSClasses,
  createResponsiveClasses,
  SEMANTIC_COLOR_MAPPING,
  DEPRECATED_COLOR_PATTERNS
};