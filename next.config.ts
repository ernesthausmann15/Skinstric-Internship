import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app does not need the generated agent instruction files.
  agentRules: false,
  // The embedded browser opens 127.0.0.1 while `next dev` serves localhost.
  // Without this, hot reload requests are blocked and the page stays stale.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
