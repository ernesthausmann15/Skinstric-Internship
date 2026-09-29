import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app does not need the generated agent instruction files.
  agentRules: false,
};

export default nextConfig;
