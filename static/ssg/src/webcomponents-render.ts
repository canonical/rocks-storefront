import * as fs from "fs";
import * as path from "path";

import { glob } from "glob";
import { render } from "@lit-labs/ssr";
import { html, unsafeStatic } from "lit/static-html.js";
import { collectResult } from "@lit-labs/ssr/lib/render-result.js";

async function renderComponentToFile(resourcePath: string): Promise<void> {
  const filename = path.basename(resourcePath, ".js");
  const outPath = path.join(
    process.cwd(),
    "../..", // go to project root
    "templates/webcomponents/",
    `${filename}.html`
  );
  const htmlStr = await renderHtml(filename);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, htmlStr);

  console.log(`Rendered ${outPath}`);
}

async function renderHtml(filename: string): Promise<string> {
  // read TS file
  const tsCode = fs.readFileSync(`src/webcomponents/${filename}.ts`, "utf-8");
  // dynamic imports need to have a constant relative path
  await import(`../dist/webcomponents/${filename}.js`);

  // read @customElement to define html template
  const elementName = getElementName(tsCode, filename);
  console.log(elementName);

  // name="{{ name }}"
  const htmlTemplate = html`<${unsafeStatic(elementName)}>
    </${unsafeStatic(elementName)}>`;

  const result = render(htmlTemplate);
  return await collectResult(result);
}

function getElementName(code: string, filename: string): string {
  const customElement = /^@customElement\("(.*)"\)/m;
  const result = code.match(customElement);
  if (result === null) {
    throw Error(`There's no custom element in file: ${filename}`);
  }
  return result[1];
}

async function renderAll() {
  const webcomponentsFiles = await glob("**/dist/webcomponents/*.js");
  const promisesArray: Promise<void>[] = [];

  for (const file of webcomponentsFiles) {
    const absolutePath = path.resolve(process.cwd(), file);
    promisesArray.push(
      renderComponentToFile(absolutePath).catch((err) => {
        console.error(`SSR render failed for ${file}:`, err);
        process.exit(1);
      })
    );
  }

  await Promise.all(promisesArray);
  console.log("Rendered all web components");
}

renderAll();
