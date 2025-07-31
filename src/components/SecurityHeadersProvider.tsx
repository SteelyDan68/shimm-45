import { useEffect } from 'react';

/**
 * Security headers provider component that sets up Content Security Policy
 * and other security headers for the application
 */
export function SecurityHeadersProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set Content Security Policy through meta tag
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'"
      ].join('; ');
      document.head.appendChild(meta);
    }

    // Set X-Content-Type-Options
    const xContentType = document.querySelector('meta[name="x-content-type-options"]');
    if (!xContentType) {
      const meta = document.createElement('meta');
      meta.name = 'x-content-type-options';
      meta.content = 'nosniff';
      document.head.appendChild(meta);
    }

    // Set X-Frame-Options
    const xFrameOptions = document.querySelector('meta[name="x-frame-options"]');
    if (!xFrameOptions) {
      const meta = document.createElement('meta');
      meta.name = 'x-frame-options';
      meta.content = 'DENY';
      document.head.appendChild(meta);
    }

    // Set Referrer-Policy
    const referrerPolicy = document.querySelector('meta[name="referrer"]');
    if (!referrerPolicy) {
      const meta = document.createElement('meta');
      meta.name = 'referrer';
      meta.content = 'strict-origin-when-cross-origin';
      document.head.appendChild(meta);
    }
  }, []);

  return <>{children}</>;
}