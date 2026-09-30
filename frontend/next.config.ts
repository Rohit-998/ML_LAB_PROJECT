import type { NextConfig } from "next";

// The Flask API runs separately; proxying keeps the browser on one origin (no CORS needed).
const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:5000";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default config;
