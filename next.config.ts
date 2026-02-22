import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/renderer",
  ],
  transpilePackages: [
    "remotion",
    "@remotion/player",
  ],
};

export default nextConfig;
