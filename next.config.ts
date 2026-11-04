import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  serverExternalPackages: ["sharp", "pg"],
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Memory pages must never leak their secret URL via Referer, nor be indexed.
      {
        source: "/q/:token*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
      {
        source: "/m/:slug*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default nextConfig;
