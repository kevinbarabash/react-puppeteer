const fs = require("fs");
const path = require("path");
const puppeteer = require('puppeteer');

async function screenshot(page, name, markup) {
  // console.log(`generating screenshot for ${name}`);
  const url = `http://localhost:1234/index.html?markup=${encodeURIComponent(markup)}`;
  console.log(url);
  await page.goto(url);

  const aHandle = await page.evaluateHandle(() => document.body);
  const heightHandle = await aHandle.getProperty("offsetHeight");
  const height = await heightHandle.jsonValue();

  const bHandle = await page.evaluateHandle(() => document.body.children[0]);
  const bounds = await bHandle.boundingBox();
  console.log(bounds);

  await page.screenshot({path: `screenshots/${name}.png`, clip: bounds});
}

(async () => {
  const browser = await puppeteer.launch();

  const pages = [
    await browser.newPage(),
    await browser.newPage(),
    await browser.newPage(),
    await browser.newPage(),
  ];

  const consoleHandler =  msg => {
    msg.args().forEach(arg => {
      arg.jsonValue().then(value => console.log(value));
    });
  };

  pages.forEach(page => page.on("console", consoleHandler));

  // TODO(kevinb): use Promise.race to spread work over a finite number of 
  // pages

  const files = fs.readdirSync("tests").filter(file => path.extname(file) === ".html");

  await Promise.all(files.map((file, i) => new Promise((resolve, reject) => {
    fs.readFile(path.join("tests", file), "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(screenshot(pages[i], path.basename(file, ".html"), data));
      }
    });
  })));

  await browser.close();
})();
