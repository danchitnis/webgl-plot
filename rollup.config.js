// rollup.config.js
import pkg from "./package.json";
//import typescript from "rollup-plugin-typescript2";

export default {
  input: "./dist/webglplot.js",
  //plugins: [typescript({ tsconfig: "./tsconfig.json" })],
  output: [
    { file: pkg.main, format: "umd", name: "WebGLPlot" },
    { file: pkg.module, format: "es" },
  ],
};

// rollup.config.js
/*export default {
  input: "./dist/webglplot.js",
  output: {
    file: "./dist/bundle.js",
    name: "webglplotBundle",
    format: "iife",
  },
};*/
