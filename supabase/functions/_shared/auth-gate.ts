/**
 * Centraliserad Auth-Gate för Edge Functions
 * Hantera rollbaserad åtkomst och säkerhet
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface AuthResult {
  success: boolean;
  user: any;
  error?: string;
  hasRole?: (role: string) => boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

interface RoleCheckOptions {
  requireRole?: string[];
  requireAuth?: boolean;
  allowPublic?: boolean;
}

export class AuthGate {
  private supabase;

  constructor() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Validerar JWT och hämtar användarroller
   */
  async validateAuth(req: Request, options: RoleCheckOptions = {}): Promise<AuthResult> {
    const { requireRole = [], requireAuth = true, allowPublic = false } = options;

    // Om public tillåten och ingen auth header finns
    const authHeader = req.headers.get('Authorization');
    if (allowPublic && !authHeader) {
      return { success: true, user: null };
    }

    if (requireAuth && !authHeader) {
      return { 
        success: false, 
        error: 'Authentication required - Missing Authorization header',
        user: null 
      };
    }

    if (!authHeader) {
      return { success: true, user: null };
    }

    try {
      // Extrahera JWT från Authorization header
      const token = authHeader.replace('Bearer ', '');
      
      // Verifiera JWT med Supabase
      const { data: { user }, error: authError } = await this.supabase.auth.getUser(token);
      
      if (authError || !user) {
        console.warn('Auth validation failed:', authError?.message);
        return { 
          success: false, 
          error: `Authentication failed: ${authError?.message || 'Invalid token'}`,
          user: null 
        };
      }

      // Hämta användarens roller
      const { data: roles, error: rolesError } = await this.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.warn('Error fetching user roles:', rolesError);
        return {
          success: false,
          error: `Failed to fetch user roles: ${rolesError.message}`,
          user: null
        };
      }

      const userRoles = roles?.map(r => r.role) || [];
      const isAdmin = userRoles.includes('admin') || userRoles.includes('superadmin');
      const isSuperAdmin = userRoles.includes('superadmin');

      // Kontrollera om användaren har nödvändig roll
      if (requireRole.length > 0 && !requireRole.some(role => userRoles.includes(role)) && !isSuperAdmin) {
        return {
          success: false,
          error: `Access denied. Required role: ${requireRole.join(' or ')}`,
          user: user
        };
      }

      // Hjälpfunktion för rollkontroll
      const hasRole = (role: string): boolean => {
        return userRoles.includes(role) || isSuperAdmin;
      };

      return {
        success: true,
        user: user,
        hasRole: hasRole,
        isAdmin: isAdmin,
        isSuperAdmin: isSuperAdmin
      };

    } catch (error) {
      console.error('Auth validation error:', error);
      return {
        success: false,
        error: `Authentication error: ${error.message}`,
        user: null
      };
    }
  }

  /**
   * Middleware för att skydda edge functions
   */
  async protect(req: Request, options: RoleCheckOptions = {}): Promise<AuthResult | Response> {
    const authResult = await this.validateAuth(req, options);
    
    if (!authResult.success) {
      return new Response(JSON.stringify({ 
        error: authResult.error,
        code: 'AUTH_FAILED'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return authResult;
  }

  /**
   * Genererar identitetsträng för rate limiting
   */
  getIdentity(user: any, req: Request): string {
    if (user?.id) {
      return `user:${user.id}`;
    }
    
    // Fallback till IP för icke-autentiserade användare
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    return `ip:${ip}`;
  }

  /**
   * Loggar säkerhetsrelaterade händelser
   */
  async logSecurityEvent(eventType: string, details: any, user?: any): Promise<void> {
    try {
      await this.supabase
        .from('edge_function_security_logs')
        .insert({
          event_type: eventType,
          user_id: user?.id || null,
          details: details,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}

// Exportera singleton
export const authGate = new AuthGate();