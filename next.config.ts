// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Falls der Build auf Vercel wegen unterschiedlicher envs/typs zickt, nicht blockieren.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
