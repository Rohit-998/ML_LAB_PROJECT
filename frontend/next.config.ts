import type { NextConfig } from "next";

// The browser calls the Flask API directly at NEXT_PUBLIC_API_URL (see src/lib/api.ts and .env.example).
const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default config;
