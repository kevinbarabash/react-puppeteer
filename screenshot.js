const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { promisify } = require("util");
const babel = require("babel-core");
const babylon = require("babylon");

const readFileAsync = promisify(fs.readFile);

(async () => {
  const startLaunch = Date.now();
  const browser = await puppeteer.launch();
  console.log("launch: " + (Date.now() - startLaunch));

  const consoleHandler = msg => {
    msg.args().forEach(arg => {
      arg.jsonValue().then(value => console.log(value));
    });
  };

  const startGoto = Date.now();
  const pages = [await browser.newPage(), await browser.newPage()];
  await Promise.all(pages.map(async (page) => {
    await page.goto("http://localhost:4444");
    page.on("console", consoleHandler);
    page.setViewport({
      width: 600,
      height: 600
    });
  }));
  console.log("goto: " + (Date.now() - startGoto));

  const files = fs
    .readdirSync("tests")
    .filter(file => path.extname(file) === ".js");

  while (files.length > 0) {
    // TODO(kevinb): rewrite to use Promise.race so that we don't have to wait
    // for pages to complete before starting other tests.
    await Promise.all(
      pages.slice(0, Math.min(pages.length, files.length)).map(async page => {
        const file = files.shift();

        // load test code
        const startEval = Date.now();
        await page.evaluate((test) => {
          const script = document.createElement('script');
          script.setAttribute('src', `/tests/${test}`);
          script.setAttribute('type', 'module');
          document.body.appendChild(script);
        }, file);
        console.log("eval elapsed: " + (Date.now() - startEval));
        
        // wait for rendering to complete
        await page.waitForSelector(".complete");

        // save screenshot
        const startScreenshot = Date.now();
        const bounds = await page.evaluate(() => {
          const container = document.querySelector("#container");
          return {
            x: container.offsetLeft,
            y: container.offsetTop,
            width: container.offsetWidth,
            height: container.offsetHeight,
          };
        });
        const name = path.basename(file, ".js");
        await page.screenshot({ 
          path: `screenshots/${name}.png`, 
          clip: bounds,
        });
        console.log("screenshot elapsed: " + (Date.now() - startScreenshot));

        // reset for next test
        await page.evaluate(() => {
          const container = document.querySelector("#container");
          ReactDOM.unmountComponentAtNode(container);
          container.classList.remove("complete");
        });
      })
    );
  }

  await browser.close();
})();
