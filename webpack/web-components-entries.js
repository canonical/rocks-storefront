/* eslint-disable @typescript-eslint/no-require-imports */
const glob = require("glob");

function addWebComponentsEntryPoints(entryPoints) {
  const webcomponentsFiles = glob.sync("static/ssg/src/webcomponents/*");
  for (const file of webcomponentsFiles) {
    const entryName = "webcomponents/" + getEntryName(file);
    entryPoints[entryName] = getEntryFile(file);
  }
}

function getEntryName(filePath) {
  const lastSlashIndex = filePath.lastIndexOf("/");
  const lastDotIndex = filePath.lastIndexOf(".");
  return filePath.substring(
    lastSlashIndex + 1,
    lastDotIndex < 0 ? filePath.length : lastDotIndex
  );
}

function getEntryFile(filePath) {
  if (!filePath.startsWith("./")) {
    return "./" + filePath;
  }
  return filePath;
}

module.exports = { addWebComponentsEntryPoints };
