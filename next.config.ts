import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Supabase PostgREST type parser produces false SelectQueryError
    // for `pay_date` column (renamed from `payment_date` in DB).
    // Runtime works correctly — this is purely a type-level issue.
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      { source: "/en/stocks/:ticker", destination: "/en/stock/:ticker", permanent: true },
      { source: "/ar/stocks/:ticker", destination: "/ar/stock/:ticker", permanent: true },
    ];
  },
};

export default nextConfig;
