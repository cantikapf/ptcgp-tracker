import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://www.pokemon-zone.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000); // Wait a bit for JS to render
  const html = await page.content();
  fs.writeFileSync('login.html', html);
  await browser.close();
  console.log('Saved login.html');
})();
