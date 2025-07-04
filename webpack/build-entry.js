/* eslint-disable @typescript-eslint/no-require-imports */
const utils = require("./web-components-entries.js");

module.exports = () => {
  const entryPoints = {
    "global-nav": "./static/js/src/base/global-nav.ts",
    "docs-side-nav": "./static/js/src/base/docs-side-nav.ts",
    base: "./static/js/src/base/base.js",
    details: "./static/js/src/public/details/index.ts",
    details_overview: "./static/js/src/public/details/overview/index.js",
    store: "./static/js/src/store/index.tsx",
  };

  utils.addWebComponentsEntryPoints(entryPoints);

  return entryPoints;
};
