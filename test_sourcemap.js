const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('pageerror', err => console.log('ERROR:', err.stack));
    page.on('console', msg => console.log('LOG:', msg.text()));
    await page.goto('file://' + process.cwd() + '/dist/index.html');
    await browser.close();
})();
