import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    // Avoid stale Server Component output during local HMR (Next.js 15+ default).
    serverComponentsHmrCache: false,
  },
};

export default withNextIntl(nextConfig);
