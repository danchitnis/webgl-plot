import dts from "rollup-plugin-dts";

const config = [
  // …
  {
    input: "./dist/webglplot.d.ts",
    output: [{ file: "./dist/webglplot.esm.d.ts", format: "es" }],
    plugins: [dts()],
  },
];

export default config;
