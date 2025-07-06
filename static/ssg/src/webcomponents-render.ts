import * as fs from "fs";
import * as path from "path";

import { glob } from "glob";
import { html, render } from "@lit-labs/ssr";
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
  // dynamic imports need to have a constant relative path
  await import(`../dist/webcomponents/${filename}.js`);

  // read @customElement to define html template
  // const elementName = getElementName
  // read properties and print them in order to receive a jinja template value

  const htmlTemplate = html`<my-element name="{{ name }}">
    <p>Test</p>
  </my-element>`;

  const result = render(htmlTemplate);
  return await collectResult(result);
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
