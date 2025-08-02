import React from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorData {
  id: string;
  error: Error;
  context?: string;
  timestamp: Date;
}

interface ErrorContextType {
  reportError: (error: Error, context?: string) => void;
  clearErrors: () => void;
  errors: ErrorData[];
}

const ErrorContext = React.createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: React.ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [errors, setErrors] = React.useState<ErrorData[]>([]);
  const { toast } = useToast();

  const reportError = React.useCallback((error: Error, context?: string) => {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newError: ErrorData = {
      id: errorId,
      error,
      context,
      timestamp: new Date()
    };

    setErrors(prev => [...prev, newError]);

    toast({
      title: "Ett fel inträffade",
      description: context || "Vi arbetar på att lösa problemet.",
      variant: "destructive",
    });

    if (process.env.NODE_ENV === 'development') {
      console.error('Error reported:', { error, context, errorId });
    }
  }, [toast]);

  const clearErrors = React.useCallback(() => {
    setErrors([]);
  }, []);

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportError(
        new Error(event.reason?.message || 'Unhandled Promise Rejection'), 
        'Unhandled Promise Rejection'
      );
    };

    const handleError = (event: ErrorEvent) => {
      reportError(
        new Error(event.message), 
        `Global Error: ${event.filename}:${event.lineno}:${event.colno}`
      );
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [reportError]);

  const value = React.useMemo(() => ({
    reportError,
    clearErrors,
    errors
  }), [reportError, clearErrors, errors]);

  return React.createElement(
    ErrorContext.Provider,
    { value },
    children
  );
};

export const useErrorReporting = () => {
  const context = React.useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useErrorReporting must be used within an ErrorProvider');
  }
  return context;
};