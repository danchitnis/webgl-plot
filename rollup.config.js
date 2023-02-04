// rollup.config.js
//import pkg from "./package.json" ;
//import dts from "rollup-plugin-dts";
//import typescript from "rollup-plugin-typescript2";
import { readFileSync } from "fs";
const pkg = JSON.parse(readFileSync("package.json", { encoding: "utf8" }));

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
