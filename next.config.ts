import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow localtunnel domains
  images: {
    domains: ["loca.lt"],
  },
};

export default nextConfig;
