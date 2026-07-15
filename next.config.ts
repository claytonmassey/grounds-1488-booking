import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Avoid picking a parent lockfile as the workspace root
    root: path.join(__dirname),
  },
};

export default nextConfig;
