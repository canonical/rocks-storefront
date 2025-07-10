import { globSync } from "glob";
import path from "node:path";

import progress from "rollup-plugin-progress";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dynamicImportVars from "@rollup/plugin-dynamic-import-vars";

const getInputs = () => {
  const webcomponents = globSync("src/webcomponents/*.ts").map((file) => [
    // This removes `src/` as well as the file extension from each
    // file, so e.g. src/nested/foo.js becomes nested/foo
    path.relative(
      "src",
      file.slice(0, file.length - path.extname(file).length)
    ),
    file,
  ]);

  return Object.fromEntries(webcomponents);
};

const plugins = [
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
];

export default [
  {
    input: getInputs(),
    output: {
      dir: "dist/",
      format: "esm",
      minifyInternalExports: false,
      compact: false,
    },
    plugins: plugins,
    onwarn(warning, warn) {
      if (warning.code === "THIS_IS_UNDEFINED") return;
      warn(warning);
    },
  },
  {
    // add the hydrating script
    input: {
      "hydration-support": "src/hydration-support.ts",
    },
    output: {
      dir: "dist/",
      format: "iife", // makes it executable in the browser
    },
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
    ],
  },
  {
    input: {
      "webcomponents-render": "src/webcomponents-render.ts",
    },
    output: {
      dir: "dist/",
      format: "esm",
      minifyInternalExports: false,
      compact: false,
    },
    plugins: plugins,
    onwarn(warning, warn) {
      if (warning.code === "THIS_IS_UNDEFINED") return;
      warn(warning);
    },
  },
];
