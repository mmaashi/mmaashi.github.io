import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/en/stocks/:ticker", destination: "/en/stock/:ticker", permanent: true },
      { source: "/ar/stocks/:ticker", destination: "/ar/stock/:ticker", permanent: true },
    ];
  },
};

export default nextConfig;
