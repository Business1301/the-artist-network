import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    const noStoreHeaders = [
      {
        key: "Cache-Control",
        value: "private, no-cache, no-store, max-age=0, must-revalidate",
      },
      {
        key: "CDN-Cache-Control",
        value: "no-store",
      },
      {
        key: "Netlify-CDN-Cache-Control",
        value: "no-store",
      },
      {
        key: "Pragma",
        value: "no-cache",
      },
      {
        key: "Vary",
        value: "Cookie",
      },
    ];

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
      {
        source: "/dashboard/:path*",
        headers: noStoreHeaders,
      },
      {
        source: "/admin/:path*",
        headers: noStoreHeaders,
      },
      {
        source: "/auth/:path*",
        headers: noStoreHeaders,
      },
      {
        source: "/login",
        headers: noStoreHeaders,
      },
      {
        source: "/signup",
        headers: noStoreHeaders,
      },
      {
        source: "/opportunities",
        headers: noStoreHeaders,
      },
      {
        source: "/opportunities/:path*",
        headers: noStoreHeaders,
      },
    ];
  },
};

export default nextConfig;
