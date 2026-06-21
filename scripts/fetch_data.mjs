import fs from 'fs';

const cookies = process.env.POKEMON_ZONE_COOKIE || '';

// We try a standard Chrome User-Agent. If CF blocks, we might need the exact one from Brave.
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

async function fetchPage(url, filename) {
  try {
    const res = await fetch(url, {
      headers: {
        'cookie': cookies,
        'user-agent': userAgent,
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'max-age=0',
        'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Brave";v="126"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1'
      }
    });
    
    console.log(`Fetch ${url}: Status ${res.status}`);
    const text = await res.text();
    fs.writeFileSync(filename, text);
    console.log(`Saved to ${filename}`);
    
    // Also let's try to fetch an API endpoint if we can guess it
    if (res.status === 200 && filename === 'collection.html') {
      // Very often data is embedded in a script tag like <script id="__NEXT_DATA__" or similar
      // Or in pokemon-zone.com (which uses Django based on csrftoken), it might be inside a JS variable or HTML table.
    }
  } catch(e) {
    console.error('Error fetching', url, e);
  }
}

async function run() {
  await fetchPage('https://www.pokemon-zone.com/api/game/game-data/', 'game_data.json');
  await fetchPage('https://www.pokemon-zone.com/api/game/card-data/', 'api_card_data.json');
}

run();
