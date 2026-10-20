import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@stash/database", "@stash/types"],
};

export default nextConfig;
