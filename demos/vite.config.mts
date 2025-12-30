import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";

function collectHtmlInputs(rootDirAbs: string): Record<string, string> {
  const inputs: Record<string, string> = {};

  const walk = (dirAbs: string) => {
    for (const entry of fs.readdirSync(dirAbs, { withFileTypes: true })) {
      const entryAbs = path.join(dirAbs, entry.name);
      if (entry.isDirectory()) {
        walk(entryAbs);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".html")) continue;

      const rel = path.relative(rootDirAbs, entryAbs).split(path.sep).join("/");
      const name = rel.replace(/\.html$/, "");
      inputs[name] = entryAbs;
    }
  };

  walk(rootDirAbs);
  return inputs;
}

export default defineConfig({
  root: "./demos",
  // Use relative paths so the built demos work when hosted under a subpath
  // (e.g. GitHub Pages or a non-root static folder on a server).
  base: "./",
  publicDir: false,
  build: {
    outDir: "../dist-demos",
    emptyOutDir: true,
    rollupOptions: {
      input: collectHtmlInputs(path.resolve(import.meta.dirname, ".")),
    },
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
