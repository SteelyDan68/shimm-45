import React, { ReactNode } from 'react';
import { HelpTooltip } from '@/components/HelpTooltip';
import { helpTexts } from '@/data/helpTexts';

/**
 * Utility för att enkelt lägga till hjälptooltips i komponenter
 */

type HelpTextPath = string;

/**
 * Hämtar hjälptext från den centraliserade databasen
 */
export const getHelpText = (path: HelpTextPath): string => {
  const pathArray = path.split('.');
  let current: any = helpTexts;
  
  for (const key of pathArray) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      console.warn(`Help text not found for path: ${path}`);
      return `Hjälptext saknas för: ${path}`;
    }
  }
  
  return typeof current === 'string' ? current : `Invalid help text path: ${path}`;
};

/**
 * Hook för att enkelt använda hjälpsystemet i komponenter
 */
export const useHelpSystem = () => {
  const addHelpTooltip = (
    helpTextPath: HelpTextPath,
    customContent?: string,
    side?: 'top' | 'right' | 'bottom' | 'left'
  ) => {
    const content = customContent || getHelpText(helpTextPath);
    return React.createElement(HelpTooltip, { content, side });
  };
  
  const getHelp = (path: HelpTextPath) => getHelpText(path);
  
  return {
    addHelpTooltip,
    getHelp,
    HelpTooltip
  };
};

/**
 * Wrapper-komponent för form-fält med automatisk hjälp
 */
interface FormFieldWithHelpProps {
  label: string;
  helpTextPath: HelpTextPath;
  children: ReactNode;
  required?: boolean;
  className?: string;
}

export const FormFieldWithHelp: React.FC<FormFieldWithHelpProps> = ({ 
  label, 
  helpTextPath, 
  children, 
  required = false,
  className = ""
}) => {
  return React.createElement(
    'div',
    { className: `space-y-2 ${className}` },
    React.createElement(
      'div',
      { className: 'flex items-center gap-2' },
      React.createElement(
        'label',
        { className: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70' },
        label,
        required && React.createElement('span', { className: 'text-red-500 ml-1' }, '*')
      ),
      React.createElement(HelpTooltip, { content: getHelpText(helpTextPath) })
    ),
    children
  );
};

/**
 * Wrapper för badge med hjälp
 */
interface BadgeWithHelpProps {
  children: ReactNode;
  helpTextPath: HelpTextPath;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

export const BadgeWithHelp: React.FC<BadgeWithHelpProps> = ({ 
  children, 
  helpTextPath, 
  variant = 'default',
  className = ""
}) => {
  return React.createElement(
    'div',
    { className: 'flex items-center gap-1' },
    React.createElement('span', { className }, children),
    React.createElement(HelpTooltip, { content: getHelpText(helpTextPath) })
  );
};

/**
 * Validerar att alla hjälptexter finns för en given komponent
 */
export const validateHelpTexts = (requiredPaths: HelpTextPath[]): boolean => {
  const missingPaths: string[] = [];
  
  requiredPaths.forEach(path => {
    try {
      const text = getHelpText(path);
      if (text.startsWith('Hjälptext saknas för:') || text.startsWith('Invalid help text path:')) {
        missingPaths.push(path);
      }
    } catch {
      missingPaths.push(path);
    }
  });
  
  if (missingPaths.length > 0) {
    console.warn('Missing help texts for paths:', missingPaths);
    return false;
  }
  
  return true;
};

/**
 * Development utility för att lista alla tillgängliga hjälptexter
 */
export const listAllHelpTexts = (): string[] => {
  const paths: string[] = [];
  
  const traverse = (obj: any, currentPath: string = '') => {
    Object.keys(obj).forEach(key => {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        traverse(obj[key], newPath);
      } else if (typeof obj[key] === 'string') {
        paths.push(newPath);
      }
    });
  };
  
  traverse(helpTexts);
  return paths.sort();
};