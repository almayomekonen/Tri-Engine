import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  swcMinify: true,

  compress: true,

  images: {
    domains: [],
    formats: ["image/webp", "image/avif"],
  },

  experimental: {
    optimizeCss: true,

    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },

  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
              maxSize: 244000,
            },
            common: {
              name: "common",
              minChunks: 2,
              chunks: "all",
              enforce: true,
              maxSize: 244000,
            },
          },
        },
      };
    }

    if (!dev) {
      config.devtool = false;
    }

    return config;
  },

  output: "standalone",

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  trailingSlash: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
