import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/@vite/:path*",
        destination: "http://127.0.0.1:3333/@vite/:path*",
      },
      {
        source: "/@react-refresh",
        destination: "http://127.0.0.1:3333/@react-refresh",
      },
      {
        source: "/.sanity/:path*",
        destination: "http://127.0.0.1:3333/.sanity/:path*",
      },
      {
        source: "/node_modules/:path*",
        destination: "http://127.0.0.1:3333/node_modules/:path*",
      },
      {
        source: "/sanity.config.ts",
        destination: "http://127.0.0.1:3333/sanity.config.ts",
      },
      {
        source: "/sanity.cli.ts",
        destination: "http://127.0.0.1:3333/sanity.cli.ts",
      },
      {
        source: "/schemaTypes/:path*",
        destination: "http://127.0.0.1:3333/schemaTypes/:path*",
      },
      {
        source: "/structure.ts",
        destination: "http://127.0.0.1:3333/structure.ts",
      },
      {
        source: "/static/:path*",
        destination: "http://127.0.0.1:3333/static/:path*",
      },
      {
        source: "/admin",
        destination: "http://127.0.0.1:3333/admin",
      },
      {
        source: "/admin/:path*",
        destination: "http://127.0.0.1:3333/admin/:path*",
      },
    ];
  },
};

export default nextConfig;
