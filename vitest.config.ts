/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import Inspect from 'vite-plugin-inspect'

export default defineConfig({
  plugins: [react(), tsconfigPaths(),Inspect({
    build: true,
    outputDir: '.vite-inspect'
  })],
  test: {
    globals: true,
    environment: "happy-dom",
    // setupFiles: ["./test/setup-test-env.ts"],

  },
  
});
