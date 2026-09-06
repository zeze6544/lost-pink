import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/you", destination: "/settings", permanent: true },
      { source: "/subscription", destination: "/billing", permanent: true },
      { source: "/name", destination: "/", permanent: true },
    ];
  },
  devIndicators: false,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["nodemailer"],
};

export default nextConfig;
