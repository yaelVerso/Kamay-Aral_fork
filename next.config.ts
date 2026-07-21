import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;
const supabaseOrigin = supabaseHostname ? `https://${supabaseHostname}` : "";

const contentSecurityPolicy = [
  `default-src 'self'`,
  // 'unsafe-inline' is required here: the Next.js App Router injects its
  // own inline <script> tags per page (streaming RSC payload/hydration
  // data, different content every render), not just our one static
  // pre-hydration script — a hash-only policy blocks those too and breaks
  // hydration app-wide (forms/buttons stop responding). A per-request
  // nonce via middleware is the stricter alternative if this ever needs
  // tightening, but isn't compatible with the static headers() config here.
  `script-src 'self' 'unsafe-inline'`,
  // 'unsafe-inline' is required for the per-request inline <style> in
  // app/layout.tsx (admin-configurable brand colors) and other inline
  // style="" attributes (progress bars, color swatches) — its content
  // varies per request/admin setting, so it can't be pinned to a hash.
  `style-src 'self' 'unsafe-inline'`,
  // blob: covers the logo preview in BrandingSettingsForm (URL.createObjectURL)
  // before it's uploaded; data: covers any inline SVG/data-URI images.
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  `media-src 'self' ${supabaseOrigin}`,
  `connect-src 'self' ${supabaseOrigin}`,
  `font-src 'self'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
].join("; ");

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
