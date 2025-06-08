// @ts-check
import withBundleAnalyzer from "@next/bundle-analyzer";
import CompressionPlugin from "compression-webpack-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    optimizeCss: true,
  },
  eslint: {
    // להתעלם משגיאות לינטר בבילד - מפתחים יראו אותן בסביבת הפיתוח בלבד
    ignoreDuringBuilds: true,
  },
  webpack: (config, { dev, isServer }) => {
    // Only apply in production build on client-side
    if (!dev && !isServer) {
      config.plugins.push(
        new CompressionPlugin({
          algorithm: "gzip",
          test: /\.(js|css|html|svg)$/,
          threshold: 10240,
          minRatio: 0.8,
        })
      );
    }
    return config;
  },
};

export default process.env.ANALYZE === "true"
  ? withBundleAnalyzer({ enabled: true })(nextConfig)
  : nextConfig;
