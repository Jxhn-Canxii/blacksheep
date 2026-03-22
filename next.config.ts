import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,

  // ✅ Point to monorepo root (IMPORTANT for Turbo)
  outputFileTracingRoot: path.join(__dirname, "../../"),

  images: {
    formats: ["image/avif", "image/webp"],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;