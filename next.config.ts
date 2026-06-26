import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  // Avoid inotify exhaustion on Linux when many dev servers run at once.
  watchOptions: {
    pollIntervalMs: 1000,
  },
};

export default nextConfig;
