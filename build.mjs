// vite.config.js
import { resolve } from "path";
import { build, defineConfig } from "vite";
import dts from "vite-plugin-dts";

const libConfig = defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(import.meta.dirname, "src/webglplot.ts"),
      name: "webglplot",
      // the proper extensions will be added
      fileName: "webglplot",
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {},
      },
    },
  },
  plugins: [dts({ rollupTypes: true })],
});

const benchmarkConfig = defineConfig({
  root: resolve(import.meta.dirname, "benchmark"),
  build: {
    outDir: resolve(import.meta.dirname, "dist-benchmark"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "benchmark", "bench-thick.html"),
      },
    },
  },
});

async function runBuilds() {
  // Build the library
  await build(libConfig);
  // Build the benchmarks
  await build(benchmarkConfig);
}

runBuilds();
