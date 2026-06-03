import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 * - HSTS: force HTTPS (ignored by browsers on plain http, so safe in dev).
 * - frame-ancestors 'none' + X-Frame-Options DENY: block clickjacking of the
 *   authenticated app.
 * - nosniff / Referrer-Policy: standard hardening.
 * - CSP is shipped Report-Only for now (observe violations before enforcing) —
 *   it allows the inline styles this app uses and the Supabase API origin.
 *   Tighten and switch to enforcing once the report stream is clean.
 */
const SUPABASE = "https://*.supabase.co";

const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  // App uses inline styles extensively; Next injects inline bootstrap scripts.
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE} wss://*.supabase.co`,
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=15552000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
