import { globSync } from "glob";
import path from "node:path";
import { fileURLToPath } from "node:url";

import progress from "rollup-plugin-progress";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dynamicImportVars from "@rollup/plugin-dynamic-import-vars";

export default {
  input: Object.fromEntries(
    globSync("src/**/*.ts").map((file) => [
      // This removes `src/` as well as the file extension from each
      // file, so e.g. src/nested/foo.js becomes nested/foo
      path.relative(
        "src",
        file.slice(0, file.length - path.extname(file).length)
      ),
      // This expands the relative paths to absolute paths, so e.g.
      // src/nested/foo becomes /project/src/nested/foo.js
      fileURLToPath(new URL(file, import.meta.url)),
    ])
  ),
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
