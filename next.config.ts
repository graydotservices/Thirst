import type { NextConfig } from "next";

const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const storageHost = storageUrl ? new URL(storageUrl).hostname : null;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The shared stylesheet is ~32 KB before compression. Deliver it with HTML
  // so streamed content never paints with default browser margins/layout.
  experimental: { inlineCss: true },
  images: {
    dangerouslyAllowSVG: false,
    dangerouslyAllowLocalIP: false,
    remotePatterns: storageHost ? [{
        protocol: "https",
        hostname: storageHost,
        pathname: "/storage/v1/object/public/product-images/**",
        search: '',
    }] : [],
  },
  async headers() {
    const security = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ...(process.env.NODE_ENV === 'production' ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }] : []),
    ];
    return [
      { source: '/:path*', headers: security },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] },
      { source: '/admin/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
};

export default nextConfig;
