import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  output: "standalone", // za Docker (docker-compose)
  poweredByHeader: false,
  serverExternalPackages: [
    "pdfjs-dist",
    "@napi-rs/canvas",
    "pg",
    "nodemailer",
    "node-cron",
  ],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // service worker naj se vedno prevzame svež
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
  },
};

export default nextConfig;
