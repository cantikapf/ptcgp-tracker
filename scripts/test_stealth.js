const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const url = 'https://www.pokemon-zone.com/api/players/0728631456578975/';
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  const content = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync('stealth_output.json', content);
  
  const data = JSON.parse(content);
  console.log('Has cards in data?', !!data.data.cards);
  console.log('Has cards in player?', !!data.data.player.cards);
  
  await browser.close();
})();
