import React from 'react';
import { useErrorReporting } from '@/hooks/useErrorReporting';

interface NetworkError extends Error {
  status?: number;
  response?: any;
}

interface ApiErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  retryable?: boolean;
  context?: string;
}

export const useApiErrorHandler = () => {
  const { reportError } = useErrorReporting();

  const handleApiError = React.useCallback(
    (error: NetworkError, options: ApiErrorHandlerOptions = {}) => {
      const {
        showToast = true,
        logError = true,
        context = 'API Call'
      } = options;

      // Enhanced error information
      const enhancedError = new Error(
        `${context}: ${error.message} ${error.status ? `(${error.status})` : ''}`
      );

      // Add additional properties
      (enhancedError as any).originalError = error;
      (enhancedError as any).status = error.status;
      (enhancedError as any).response = error.response;

      if (logError) {
        reportError(enhancedError, context);
      }

      return enhancedError;
    },
    [reportError]
  );

  const handleNetworkError = React.useCallback(
    (error: any, context = 'Network Request') => {
      let userMessage = 'Ett nätverksfel inträffade';
      
      if (error?.status) {
        switch (error.status) {
          case 400:
            userMessage = 'Ogiltiga data skickades till servern';
            break;
          case 401:
            userMessage = 'Du måste logga in för att fortsätta';
            break;
          case 403:
            userMessage = 'Du har inte behörighet för denna åtgärd';
            break;
          case 404:
            userMessage = 'Den begärda resursen kunde inte hittas';
            break;
          case 429:
            userMessage = 'För många förfrågningar. Försök igen senare';
            break;
          case 500:
            userMessage = 'Ett serverfel inträffade. Försök igen senare';
            break;
          default:
            userMessage = `Serverfel (${error.status}). Försök igen senare`;
        }
      }

      return handleApiError(error, { 
        context, 
        showToast: true 
      });
    },
    [handleApiError]
  );

  const wrapApiCall = React.useCallback(
    <T>(
      apiCall: () => Promise<T>,
      options: ApiErrorHandlerOptions = {}
    ): Promise<T> => {
      return apiCall().catch((error) => {
        handleNetworkError(error, options.context);
        throw error;
      });
    },
    [handleNetworkError]
  );

  return {
    handleApiError,
    handleNetworkError,
    wrapApiCall
  };
};

// Supabase-specific error handler
export const useSupabaseErrorHandler = () => {
  const { handleApiError } = useApiErrorHandler();

  const handleSupabaseError = React.useCallback(
    (error: any, context = 'Supabase Operation') => {
      let userFriendlyMessage = 'Ett databasfel inträffade';

      // Map common Supabase error codes to user-friendly messages
      if (error?.code) {
        switch (error.code) {
          case 'PGRST116':
            userFriendlyMessage = 'Ingen data hittades';
            break;
          case '23505':
            userFriendlyMessage = 'Denna data existerar redan';
            break;
          case '23503':
            userFriendlyMessage = 'Detta kan inte tas bort eftersom det används någon annanstans';
            break;
          case '42501':
            userFriendlyMessage = 'Du har inte behörighet för denna åtgärd';
            break;
          case '08006':
            userFriendlyMessage = 'Anslutningsproblem till databasen';
            break;
          default:
            userFriendlyMessage = `Databasfel: ${error.message}`;
        }
      }

      const enhancedError = new Error(userFriendlyMessage);
      (enhancedError as any).originalError = error;
      (enhancedError as any).code = error.code;

      return handleApiError(enhancedError, { context });
    },
    [handleApiError]
  );

  const wrapSupabaseCall = React.useCallback(
    <T>(
      supabaseCall: () => Promise<{ data: T; error: any }>,
      context?: string
    ): Promise<T> => {
      return supabaseCall().then(({ data, error }) => {
        if (error) {
          handleSupabaseError(error, context);
          throw error;
        }
        return data;
      });
    },
    [handleSupabaseError]
  );

  return {
    handleSupabaseError,
    wrapSupabaseCall
  };
};