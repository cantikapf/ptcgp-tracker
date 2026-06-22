import fs from 'fs';
import path from 'path';

async function downloadAll() {
  const cardData = JSON.parse(fs.readFileSync('data/raw/card-data.json', 'utf-8'));
  const allCards = cardData.cards || cardData.data?.cards || [];
  
  const destDir = 'public/images/cards';
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  let count = 0;
  let success = 0;
  let failed = 0;

  console.log(`Starting download for ${allCards.length} cards...`);

  const BATCH_SIZE = 50;
  
  for (let i = 0; i < allCards.length; i += BATCH_SIZE) {
    const batch = allCards.slice(i, i + BATCH_SIZE);
    
    const promises = batch.map(async (card) => {
      if (!card.slug) return;
      
      const fileExt = card.illustrationUrl?.endsWith('.png') ? '.png' : '.webp';
      const destPath = path.join(destDir, `${card.slug}${fileExt}`);
      
      // Skip if already exists
      if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
        success++;
        return;
      }

      let sourceUrl = card.illustrationUrl;
      if (!sourceUrl) {
        sourceUrl = `https://assets.pokemon-zone.com/game-assets/CardPreviews/c${card.cardId}.webp`;
      }

      try {
        const res = await fetch(sourceUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Referer': 'https://pokemon-zone.com/'
          }
        });

        if (res.status === 200) {
          const buffer = await res.arrayBuffer();
          fs.writeFileSync(destPath, Buffer.from(buffer));
          success++;
        } else {
          failed++;
          console.error(`Failed to download ${card.slug} (Status: ${res.status}): ${sourceUrl}`);
        }
      } catch (err) {
        failed++;
        console.error(`Error downloading ${card.slug}:`, err.message);
      }
    });

    await Promise.all(promises);
    count += batch.length;
    console.log(`Progress: ${count} / ${allCards.length} (Success: ${success}, Failed: ${failed})`);
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\nFinished! Successfully downloaded ${success} images. Failed: ${failed}.`);
}

downloadAll().catch(console.error);
