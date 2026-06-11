import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow external IP connections for local development (resolves the Next.js warning)
  // @ts-ignore - this is supported in newer Next.js versions for turbopack
  experimental: {
    ...({} as any)
  },
  // If next doesn't recognize this in TS, we use ts-ignore or any 
};
// Next.js warns about cross-origin requests. 
(nextConfig as any).allowedDevOrigins = ['26.124.124.105'];

export default nextConfig;
