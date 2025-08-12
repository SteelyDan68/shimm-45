/**
 * 🔄 CONSOLE LOG MIGRATION UTILITY
 * Hjälper migrera console.log statements till production logger
 */

import { logger } from '@/utils/productionLogger';

// Legacy console replacement för gradual migration
export const legacyConsole = {
  log: (...args: any[]) => {
    // I development: visa som vanligt
    if (import.meta.env.DEV) {
      console.log(...args);
    }
    // I production: använd structured logging
    logger.debug(args.map(String).join(' '), { 
      legacy_console: true,
      args: args.slice(1) 
    });
  },
  
  error: (...args: any[]) => {
    const [message, ...rest] = args;
    const error = rest.find(arg => arg instanceof Error);
    
    if (import.meta.env.DEV) {
      console.error(...args);
    }
    
    logger.error(
      String(message), 
      error, 
      { 
        legacy_console: true, 
        additional_args: rest.filter(arg => !(arg instanceof Error))
      }
    );
  },
  
  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
    
    logger.warn(args.map(String).join(' '), { 
      legacy_console: true,
      args: args.slice(1) 
    });
  },
  
  info: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.info(...args);
    }
    
    logger.info(args.map(String).join(' '), { 
      legacy_console: true,
      args: args.slice(1) 
    });
  }
};

// Global replacement för snabb migration
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  // I production: ersätt console med säker version
  (window as any).console = {
    ...console,
    log: legacyConsole.log,
    error: legacyConsole.error,
    warn: legacyConsole.warn,
    info: legacyConsole.info
  };
}