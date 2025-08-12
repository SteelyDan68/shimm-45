/**
 * 🚀 CONSOLE LOG MIGRATION UTILITY
 * Bulk migration script för att ersätta console.* statements med production logger
 */

import { logger } from './productionLogger';

export const migrateConsoleStatements = {
  // Ersättning av vanliga console statements
  log: (...args: any[]) => logger.debug(args.map(String).join(' ')),
  error: (...args: any[]) => {
    const [message, error, ...rest] = args;
    if (error instanceof Error) {
      logger.error(String(message), error, { additionalArgs: rest });
    } else {
      logger.error(args.map(String).join(' '));
    }
  },
  warn: (...args: any[]) => logger.warn(args.map(String).join(' ')),
  info: (...args: any[]) => logger.info(args.map(String).join(' ')),
  
  // Performance timing replacement
  time: (label: string) => logger.time(label),
  timeEnd: (label: string) => logger.timeEnd(label),
  
  // Group replacements (fallback till debug)
  group: (...args: any[]) => logger.debug(`GROUP: ${args.map(String).join(' ')}`),
  groupEnd: () => logger.debug('GROUP END'),
  
  // Table replacement
  table: (data: any) => logger.debug('TABLE DATA', { tableData: data }),
  
  // Count replacement
  count: (label?: string) => logger.debug(`COUNT${label ? `: ${label}` : ''}`),
  
  // Assert replacement
  assert: (condition: any, ...args: any[]) => {
    if (!condition) {
      logger.error(`ASSERTION FAILED: ${args.map(String).join(' ')}`);
    }
  }
};

// Runtime replacement utility för development debugging
export const replaceConsoleInDevelopment = () => {
  if (import.meta.env.DEV) {
    // I development, behåll console men logga också
    const originalConsole = { ...console };
    
    console.log = (...args) => {
      originalConsole.log(...args);
      logger.debug(args.map(String).join(' '));
    };
    
    console.error = (...args) => {
      originalConsole.error(...args);
      const [message, error, ...rest] = args;
      if (error instanceof Error) {
        logger.error(String(message), error, { additionalArgs: rest });
      } else {
        logger.error(args.map(String).join(' '));
      }
    };
    
    console.warn = (...args) => {
      originalConsole.warn(...args);
      logger.warn(args.map(String).join(' '));
    };
    
    console.info = (...args) => {
      originalConsole.info(...args);
      logger.info(args.map(String).join(' '));
    };
  }
};