import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The parent directory contains unrelated lockfiles; anchor tracing here.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
