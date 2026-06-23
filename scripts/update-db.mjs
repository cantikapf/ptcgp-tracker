import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import https from 'https';

console.log('🌟 Starting Database & Image Update Process...');

const cardDataUrl = 'https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/refs/heads/main/dist/cards.json';
const destPath = path.resolve(process.cwd(), 'data/raw/card-data.json');

// Ensure directory exists
if (!fs.existsSync(path.dirname(destPath))) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
}

console.log('1️⃣ Fetching latest card catalog from community database...');
https.get(cardDataUrl, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync(destPath, data);
    console.log('✅ Successfully updated data/raw/card-data.json!');
    
    try {
      console.log('\n2️⃣ Downloading new images for missing cards (this will skip existing ones)...');
      execSync('node scripts/download-all-images.mjs', { stdio: 'inherit' });
      
      console.log('\n3️⃣ Injecting new cards and local image URLs into Supabase database...');
      execSync('node scripts/seed_db.mjs', { stdio: 'inherit' });
      
      console.log('\n🎉 ALL DONE! Your database and local images are fully up to date!');
      console.log('\n👉 NEXT STEP: Run these commands in your terminal to publish the updates:');
      console.log('   git add .');
      console.log('   git commit -m "chore: update database and download new local images"');
      console.log('   git push origin main');
    } catch (err) {
      console.error('❌ An error occurred during the update process:', err.message);
    }
  });
}).on('error', (err) => {
  console.error('❌ Failed to fetch card-data.json:', err.message);
});
