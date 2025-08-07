/**
 * SÄKERHETSUTILITIES FÖR EDGE FUNCTIONS
 * Centraliserad säkerhetsfunktionalitet för alla edge functions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

export interface SecurityValidationOptions {
  functionName: string;
  requiredRole?: 'client' | 'coach' | 'admin' | 'superadmin' | 'none';
  allowAnonymous?: boolean;
  requireAuthentication?: boolean;
}

export interface SecurityValidationResult {
  authorized: boolean;
  user: any | null;
  roles: string[];
  securityLevel: string;
  errorMessage?: string;
}

/**
 * SÄKER JWT VALIDERING OCH ROLLKONTROLL
 */
export async function validateRequestSecurity(
  req: Request,
  options: SecurityValidationOptions
): Promise<SecurityValidationResult> {
  const {
    functionName,
    requiredRole = 'client',
    allowAnonymous = false,
    requireAuthentication = true
  } = options;

  console.log(`🔒 Security validation for ${functionName}:`, {
    requiredRole,
    allowAnonymous,
    requireAuthentication
  });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Extrahera JWT från Authorization header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader && !allowAnonymous) {
      return {
        authorized: false,
        user: null,
        roles: [],
        securityLevel: 'unauthorized',
        errorMessage: 'No authorization header provided'
      };
    }

    if (!authHeader && allowAnonymous && requiredRole === 'none') {
      // Tillåt anonym åtkomst för publika funktioner
      await logSecurityEvent(supabase, {
        functionName,
        userId: null,
        authorizationSuccess: true,
        securityLevel: 'anonymous',
        requestIp: getClientIP(req),
        userAgent: req.headers.get('user-agent')
      });

      return {
        authorized: true,
        user: null,
        roles: [],
        securityLevel: 'anonymous'
      };
    }

    // Validera JWT token
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return {
        authorized: false,
        user: null,
        roles: [],
        securityLevel: 'unauthorized',
        errorMessage: 'Invalid authorization format'
      };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      await logSecurityEvent(supabase, {
        functionName,
        userId: null,
        authorizationSuccess: false,
        securityViolationType: 'invalid_jwt',
        requestIp: getClientIP(req),
        userAgent: req.headers.get('user-agent'),
        errorDetails: authError?.message
      });

      return {
        authorized: false,
        user: null,
        roles: [],
        securityLevel: 'unauthorized',
        errorMessage: 'Invalid or expired token'
      };
    }

    // Hämta användarens roller via säker databas-funktion
    const { data: authValidation, error: roleError } = await supabase
      .rpc('validate_edge_function_auth', {
        _function_name: functionName,
        _user_id: user.id,
        _required_role: requiredRole,
        _request_ip: getClientIP(req),
        _user_agent: req.headers.get('user-agent')
      });

    if (roleError) {
      console.error(`🚨 SECURITY: Role validation failed for ${functionName}:`, roleError);
      
      return {
        authorized: false,
        user,
        roles: [],
        securityLevel: 'unauthorized',
        errorMessage: `Security validation failed: ${roleError.message}`
      };
    }

    console.log(`✅ SECURITY: Validation successful for ${functionName}:`, {
      userId: user.id,
      securityLevel: authValidation.security_level,
      requiredRole
    });

    return {
      authorized: authValidation.authorized,
      user,
      roles: authValidation.roles || [],
      securityLevel: authValidation.security_level,
      errorMessage: authValidation.authorized ? undefined : 'Insufficient privileges'
    };

  } catch (error: any) {
    console.error(`🚨 SECURITY: Critical error in ${functionName}:`, error);
    
    // Logga kritiskt säkerhetsfel
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_ANON_KEY') || ''
      );
      
      await logSecurityEvent(supabase, {
        functionName,
        userId: null,
        authorizationSuccess: false,
        securityViolationType: 'critical_error',
        requestIp: getClientIP(req),
        userAgent: req.headers.get('user-agent'),
        errorDetails: error.message
      });
    } catch (logError) {
      console.error('Failed to log security error:', logError);
    }

    return {
      authorized: false,
      user: null,
      roles: [],
      securityLevel: 'error',
      errorMessage: 'Security validation failed due to system error'
    };
  }
}

/**
 * LOGGA SÄKERHETSHÄNDELSER
 */
async function logSecurityEvent(
  supabase: any,
  event: {
    functionName: string;
    userId: string | null;
    authorizationSuccess: boolean;
    securityLevel?: string;
    securityViolationType?: string;
    requestIp?: string | null;
    userAgent?: string | null;
    errorDetails?: string;
  }
) {
  try {
    await supabase
      .from('edge_function_security_logs')
      .insert({
        function_name: event.functionName,
        user_id: event.userId,
        authorization_success: event.authorizationSuccess,
        security_violation_type: event.securityViolationType,
        request_ip: event.requestIp,
        user_agent: event.userAgent,
        authentication_method: 'jwt_token',
        request_data: {
          security_level: event.securityLevel,
          error_details: event.errorDetails,
          timestamp: new Date().toISOString()
        }
      });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * EXTRAHERA KLIENT IP-ADRESS
 */
function getClientIP(req: Request): string | null {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         req.headers.get('cf-connecting-ip') ||
         null;
}

/**
 * SÄKER CORS HEADERS
 */
export const SECURE_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400', // 24 timmar
};

/**
 * SÄKER INPUT SANITIZATION
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Grundläggande XSS-skydd
    return input
      .replace(/[<>]/g, '') // Ta bort potentiellt farliga tecken
      .replace(/javascript:/gi, '') // Ta bort javascript: protokoll
      .replace(/on\w+=/gi, '') // Ta bort onevent handlers
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * RATE LIMITING UTILITY (Basic implementation)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const current = requestCounts.get(identifier);
  
  if (!current || now > current.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}

/**
 * SÄKER ERROR RESPONSE
 */
export function createSecureErrorResponse(
  error: string,
  statusCode = 500,
  includeDetails = false
): Response {
  const errorResponse = {
    error: includeDetails ? error : 'An error occurred',
    success: false,
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...SECURE_CORS_HEADERS
    }
  });
}

/**
 * SÄKER SUCCESS RESPONSE
 */
export function createSecureSuccessResponse(data: any): Response {
  return new Response(JSON.stringify({
    ...data,
    success: true,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...SECURE_CORS_HEADERS
    }
  });
}