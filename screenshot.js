const fs = require("fs");
const path = require("path");
const puppeteer = require('puppeteer');
const {promisify} = require('util');

const readFileAsync = promisify(fs.readFile);

async function screenshot(page, name, markup) {
  console.log(`processing ${name}`);
  const url = `http://localhost:1234/index.html?markup=${encodeURIComponent(markup)}`;
  await page.goto(url);

  const aHandle = await page.evaluateHandle(() => document.body);
  const heightHandle = await aHandle.getProperty("offsetHeight");
  const height = await heightHandle.jsonValue();

  const bHandle = await page.evaluateHandle(() => document.body.children[0]);
  const bounds = await bHandle.boundingBox();

  await page.screenshot({path: `screenshots/${name}.png`, clip: bounds});
}

(async () => {
  const browser = await puppeteer.launch();

  const pages = [
    await browser.newPage(),
    await browser.newPage(),
  ];

  const consoleHandler =  msg => {
    msg.args().forEach(arg => {
      arg.jsonValue().then(value => console.log(value));
    });
  };

  pages.forEach(page => {
    page.on("console", consoleHandler);
    page.setViewport({
      width: 600,
      height: 600,
    });
  });

  const files = fs.readdirSync("tests").filter(file => path.extname(file) === ".html");

  while (files.length > 0) {
    // TODO(kevinb): rewrite to use Promise.race so that we don't have to wait
    // for pages to complete before starting other tests.
    await Promise.all(pages.slice(0, Math.min(pages.length, files.length)).map(async (page) => {
      const file = files.shift();
      const contents = await readFileAsync(path.join("tests", file), "utf8");
      await screenshot(page, path.basename(file, ".html"), contents);
    }));
      }

  await browser.close();
})();