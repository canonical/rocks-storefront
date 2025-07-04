import progress from "rollup-plugin-progress";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dynamicImportVars from "@rollup/plugin-dynamic-import-vars";

export default {
  input: "src/webcomponents-render.ts",
  output: {
    file: "dist/webcomponents-render.js",
    format: "esm",
    sourcemap: true,
  },
  plugins: [
    nodeResolve({
      extensions: [".mjs", ".js", ".json", ".node", ".ts"],
    }),
    progress(),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.node.json",
    }),
    dynamicImportVars(),
  ],
  onwarn(warning, warn) {
    if (warning.code === "THIS_IS_UNDEFINED") return;
    warn(warning);
  },
};
