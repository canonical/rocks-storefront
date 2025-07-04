/* eslint-disable @typescript-eslint/no-require-imports */
const utils = require("./web-components-entries.js");

module.exports = () => {
  const entryPoints = {};

  utils.addWebComponentsEntryPoints(entryPoints);

  return entryPoints;
};
