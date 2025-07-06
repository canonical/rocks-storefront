import * as fs from "fs";
import * as path from "path";

// Needed to set up all the shims for rendering on the server
import "@lit-labs/ssr/lib/install-global-dom-shim";

import { glob } from "glob";
import { html, render } from "@lit-labs/ssr";
import { collectResult } from "@lit-labs/ssr/lib/render-result.js";

async function renderComponentToFile(resourcePath: string): Promise<void> {
  const filename = getFileName(resourcePath);
  const outPath = path.join(
    process.cwd(),
    "templates/webcomponents/",
    filename
  );
  const htmlStr = await renderHtml(resourcePath);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, htmlStr);

  console.log(`Rendered ${outPath}`);
}

function getFileName(resourcePath: string): string {
  let filename = path.basename(resourcePath);
  const extensionIndex = filename.lastIndexOf(".");
  if (extensionIndex > 0) {
    filename = filename.substring(0, extensionIndex) + ".html";
  }
  return filename;
}

async function renderHtml(resourcePath: string): Promise<string> {
  //const webcomponent = await import(`${resourcePath}`);
  console.log(resourcePath);
  // read @customElement to define html template
  // const elementName = getElementName
  // read properties and print them in order to receive a jinja template value

  const htmlTemplate = html`<my-element name="{{ name }}">
    <p>Test</p>
  </my-element>`;

  const result = render(htmlTemplate);
  const debug = await collectResult(result);
  console.log(debug);

  return "";
}

async function renderAll() {
  const webcomponentsFiles = glob.sync("static/ssg/dist/webcomponents/*");
  const promisesArray: Promise<void>[] = [];
  console.log(webcomponentsFiles);

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
