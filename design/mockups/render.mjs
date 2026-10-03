// Renders every scene in ./scenes to ../../public/images/mockups/<name>.jpg
//   node design/mockups/render.mjs            (all)   |   node design/mockups/render.mjs web-studio reel-1
// Needs Chromium: set CHROMIUM=/path/to/chrome, or run where PLAYWRIGHT_BROWSERS_PATH is set. `npm i -D playwright-core`
import { chromium } from "playwright-core";
import { readdirSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const scenes = path.join(here, "scenes");
const out = path.join(here, "../../public/images/mockups");
mkdirSync(out, { recursive: true });

function findChromium() {
  if (process.env.CHROMIUM) return process.env.CHROMIUM;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  const dir = readdirSync(base).find((d) => d.startsWith("chromium-"));
  return path.join(base, dir, "chrome-linux", "chrome");
}

// Scene size is declared in each html: <body data-w="1440" data-h="900" data-scale="1" data-q="84">
const only = process.argv.slice(2);
const files = readdirSync(scenes).filter((f) => f.endsWith(".html") && (!only.length || only.includes(f.replace(".html", ""))));
const browser = await chromium.launch({ executablePath: findChromium(), args: ["--no-sandbox", "--allow-file-access-from-files"] });
for (const file of files) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto(pathToFileURL(path.join(scenes, file)).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const spec = await page.evaluate(() => {
    const d = document.body.dataset;
    return { w: +(d.w || 1440), h: +(d.h || 900), scale: +(d.scale || 1), q: +(d.q || 84) };
  });
  await page.setViewportSize({ width: spec.w, height: spec.h });
  await page.close();
  const p2 = await browser.newPage({ viewport: { width: spec.w, height: spec.h }, deviceScaleFactor: spec.scale });
  await p2.goto(pathToFileURL(path.join(scenes, file)).href, { waitUntil: "load" });
  await p2.evaluate(() => document.fonts.ready);
  await p2.waitForTimeout(250);
  const name = file.replace(".html", ".jpg");
  await p2.screenshot({ path: path.join(out, name), type: "jpeg", quality: spec.q });
  console.log("rendered", name, `${spec.w}x${spec.h}@${spec.scale}`);
  await p2.close();
}
await browser.close();
