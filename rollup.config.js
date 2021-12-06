// rollup.config.js
import pkg from "./package.json";
//import typescript from "rollup-plugin-typescript2";

export default {
  input: "./dist/webglplot.js",
  //plugins: [typescript({ tsconfig: "./tsconfig.json" })],
  output: [
    { file: pkg.main, format: "umd", name: "WebglPlotBundle", exports: "named" },
    { file: pkg.module, format: "es" },
    { file: pkg.exports["."].import, format: "es" },
    { file: pkg.exports["."].require, format: "cjs" },
  ],
};
