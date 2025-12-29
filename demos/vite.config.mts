import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: "./demos",
  publicDir: false,
  build: {
    outDir: "../dist-benchmark",
    emptyOutDir: true,
  },
  // This ensures we can import from the src directory
  resolve: {
    alias: {
      "@lib": path.resolve(import.meta.dirname, "../src"),
    },
  },
  // Enable watching files in src directory
  optimizeDeps: {
    entries: ["../src/**/*.ts"],
  },
});
