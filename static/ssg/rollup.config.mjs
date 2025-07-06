import progress from "rollup-plugin-progress";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dynamicImportVars from "@rollup/plugin-dynamic-import-vars";

export default {
  input: "src/webcomponents-render.ts",
  output: {
    dir: "dist/",
    format: "esm",
    sourcemap: true,
  },
  plugins: [
    progress(),
    nodeResolve({
      extensions: [".mjs", ".js", ".json", ".node", ".ts"],
      preferBuiltins: true,
      // Very important!
      // needed so that lit imports pick the correct SSR node module
      exportConditions: ["node"],
    }),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.node.json",
      outputToFilesystem: false,
    }),
    dynamicImportVars(),
  ],
  onwarn(warning, warn) {
    if (warning.code === "THIS_IS_UNDEFINED") return;
    warn(warning);
  },
};
