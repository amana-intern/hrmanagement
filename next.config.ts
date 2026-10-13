import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // framer-api adalah ESM dengan top-level await — bundling ke CJS akan error,
  // jadi biarkan Node yang require native (Node >= 22.12).
  serverExternalPackages: ['framer-api'],
};

export default nextConfig;
