import fs from "node:fs";
import path from "node:path";
import Handlebars from "handlebars";
import puppeteer from "puppeteer";

function usage() {
  console.log("Usage: node render.js <data.json> <output.pdf> [--html]");
  process.exit(1);
}

const [,, dataPath, outPdf, flag] = process.argv;
if (!dataPath || !outPdf) usage();

const wantHtmlOnly = flag === "--html";
const tplPath = path.resolve("./template.hbs");
const cssPath = path.resolve("./styles.css");

const data = JSON.parse(fs.readFileSync(path.resolve(dataPath), "utf8"));
const tpl = fs.readFileSync(tplPath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");

Handlebars.registerHelper("json", (ctx) => JSON.stringify(ctx, null, 2));

const html = Handlebars.compile(tpl)(data)
  // Inline CSS path for local rendering safety
  .replace('<link rel="stylesheet" href="./styles.css" />', `<style>${css}</style>`);

const outHtml = outPdf.replace(/\.pdf$/i, ".html");
fs.writeFileSync(outHtml, html, "utf8");
console.log("Wrote HTML:", outHtml);

if (wantHtmlOnly) process.exit(0);

const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();

await page.setContent(html, { waitUntil: "networkidle0" });

// Write a lightweight PNG preview for quick review
const outPng = outPdf.replace(/\.pdf$/i, ".png");
await page.setViewport({ width: 1240, height: 1754 }); // ~A4 @ 150dpi-ish
await page.screenshot({ path: outPng, fullPage: true });
console.log("Wrote PNG:", outPng);

await page.pdf({
  path: outPdf,
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" }
});

await browser.close();
console.log("Wrote PDF:", outPdf);
