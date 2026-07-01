import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  let apiData = null;
  page.on('response', async (response) => {
    if (response.url().includes('/api/players/') && response.status() === 200) {
      try {
          apiData = await response.text();
      } catch (e) {}
    }
  });
  await page.goto('https://www.pokemon-zone.com/players/0728631456578975/sets/', { waitUntil: 'networkidle2' });
  if (apiData) {
    const d = JSON.parse(apiData);
    const cards = d.data?.cards || d.cards || d;
    const b3b = cards.filter(c => c.cardId && (c.cardId.includes('B3b') || c.expansionIds?.includes('B3b')));
    console.log('Total cards:', cards.length, 'B3b:', b3b.length);
  } else {
    console.log('No API data intercepted.');
  }
  await browser.close();
})();
