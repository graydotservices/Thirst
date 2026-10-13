export function contentSecurityPolicy(nonce: string, development: boolean, supabaseUrl?: string): string {
  let origin = '';
  try { const url = new URL(supabaseUrl || ''); if (url.protocol === 'https:') origin = url.origin; } catch { /* Local assets only until configured. */ }
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ''}`,
    // Existing React inline styles and receipt styles need this. Script attributes remain forbidden.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `img-src 'self' data: blob: ${origin}`,
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self' ${origin}${development ? ' ws://localhost:* ws://127.0.0.1:*' : ''}`,
    "frame-src 'self' https://www.google.com https://maps.google.com",
    "media-src 'self'", "object-src 'none'", "base-uri 'none'",
    "form-action 'self'", "frame-ancestors 'none'",
    ...(development ? [] : ['upgrade-insecure-requests']),
  ].map(directive => directive.trim()).join('; ');
}
