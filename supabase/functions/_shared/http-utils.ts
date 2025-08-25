/**
 * HTTP Utilities för Edge Functions
 * Centraliserade CORS headers, error responses och HTTP helpers
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface ErrorResponse {
  error: string;
  code: string;
  details?: any;
  timestamp?: string;
}

interface SuccessResponse<T = any> {
  data?: T;
  message?: string;
  metadata?: any;
}

export class HttpResponse {
  /**
   * OPTIONS preflight response
   */
  static options(): Response {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200 
    });
  }

  /**
   * Success response
   */
  static success<T>(data?: T, message?: string, metadata?: any, status = 200): Response {
    const response: SuccessResponse<T> = {
      ...(data !== undefined && { data }),
      ...(message && { message }),
      ...(metadata && { metadata })
    };

    return new Response(JSON.stringify(response), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  /**
   * Error response
   */
  static error(
    error: string, 
    code: string, 
    status = 500, 
    details?: any
  ): Response {
    const response: ErrorResponse = {
      error,
      code,
      timestamp: new Date().toISOString(),
      ...(details && { details })
    };

    return new Response(JSON.stringify(response), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  /**
   * Authentication error
   */
  static authError(message = 'Authentication required'): Response {
    return HttpResponse.error(message, 'AUTH_REQUIRED', 401);
  }

  /**
   * Authorization error
   */
  static authzError(message = 'Access denied'): Response {
    return HttpResponse.error(message, 'ACCESS_DENIED', 403);
  }

  /**
   * Rate limit error
   */
  static rateLimitError(resetTime: Date, current: number, limit: number): Response {
    return HttpResponse.error(
      'Rate limit exceeded',
      'RATE_LIMIT_EXCEEDED',
      429,
      {
        current_requests: current,
        limit: limit,
        reset_time: resetTime.toISOString()
      }
    );
  }

  /**
   * Validation error
   */
  static validationError(message: string, details?: any): Response {
    return HttpResponse.error(message, 'VALIDATION_ERROR', 400, details);
  }

  /**
   * Not found error
   */
  static notFound(resource = 'Resource'): Response {
    return HttpResponse.error(`${resource} not found`, 'NOT_FOUND', 404);
  }

  /**
   * Internal server error
   */
  static internalError(message = 'Internal server error'): Response {
    return HttpResponse.error(message, 'INTERNAL_ERROR', 500);
  }

  /**
   * Service unavailable
   */
  static serviceUnavailable(service: string): Response {
    return HttpResponse.error(
      `${service} service is currently unavailable`, 
      'SERVICE_UNAVAILABLE', 
      503
    );
  }
}

/**
 * Request validation helpers
 */
export class RequestValidator {
  /**
   * Validate required fields in request body
   */
  static validateRequired(data: any, requiredFields: string[]): string | null {
    for (const field of requiredFields) {
      if (!data[field]) {
        return `Missing required field: ${field}`;
      }
    }
    return null;
  }

  /**
   * Validate content type
   */
  static validateContentType(req: Request, expectedType = 'application/json'): boolean {
    const contentType = req.headers.get('content-type');
    return contentType?.includes(expectedType) ?? false;
  }

  /**
   * Safe JSON parsing
   */
  static async safeParseJson(req: Request): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!RequestValidator.validateContentType(req)) {
        return { success: false, error: 'Invalid content type. Expected application/json' };
      }

      const data = await req.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: `Invalid JSON: ${error.message}` };
    }
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private startTime: number;
  private functionName: string;

  constructor(functionName: string) {
    this.functionName = functionName;
    this.startTime = Date.now();
  }

  /**
   * Get elapsed time in milliseconds
   */
  getElapsed(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Log performance metrics
   */
  log(additionalData?: any): void {
    const elapsed = this.getElapsed();
    console.log(`Performance [${this.functionName}]: ${elapsed}ms`, additionalData);
  }

  /**
   * Create performance metadata
   */
  getMetadata(additionalData?: any): any {
    return {
      function_name: this.functionName,
      execution_time_ms: this.getElapsed(),
      timestamp: new Date().toISOString(),
      ...additionalData
    };
  }
}