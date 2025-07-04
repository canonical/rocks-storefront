/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-env node */

const buildEntry = require("./webpack/build-entry.js");
const buildRules = require("./webpack/build-rules.js");
/*
const componentsEntry = require("./webpack/components-entry.js");
const componentsRules = require("./webpack/components-rules.js");
const path = require("path");
*/

const production = process.env.ENVIRONMENT !== "devel";

module.exports = [
  {
    name: "build",
    entry: buildEntry,
    output: {
      filename: "[name].js",
      path: __dirname + "/static/js/dist",
    },
    mode: production ? "production" : "development",
    devtool: production ? "source-map" : "eval-source-map",
    module: {
      rules: buildRules,
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
    },
  },
];

/*
{
    name: "webcomponents-ssg",
    target: "node",
    entry: componentsEntry,
    output: {
      filename: "[name].js",
      path: path.resolve(__dirname, "static/ssg/dist/"),
      library: {
        type: "module",
      },
      chunkFormat: "module",
      module: true,
    },
    experiments: {
      outputModule: true,
    },
    mode: production ? "production" : "development",
    devtool: false,
    module: {
      rules: componentsRules,
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
    },
  },
*/
