import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // za Docker (docker-compose)
  serverExternalPackages: [
    "pdfjs-dist",
    "@napi-rs/canvas",
    "pg",
    "nodemailer",
    "node-cron",
  ],
};

export default nextConfig;
