import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🌟 Starting Database & Image Update Process...');

const cardDataUrl = 'https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/refs/heads/main/dist/cards.json';
const setsDataUrl = 'https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/refs/heads/main/dist/sets.json';

const destPath = path.resolve(process.cwd(), 'data/raw/card-data.json');
const setsPath = path.resolve(process.cwd(), 'data/raw/sets.json');

// Ensure directory exists
if (!fs.existsSync(path.dirname(destPath))) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
}

async function updateDatabase() {
  try {
    console.log('1️⃣ Fetching latest card catalog and sets from community database...');
    
    const [cardRes, setsRes] = await Promise.all([
      fetch(cardDataUrl),
      fetch(setsDataUrl)
    ]);
    
    if (!cardRes.ok) throw new Error(`Failed to fetch cards: ${cardRes.statusText}`);
    if (!setsRes.ok) throw new Error(`Failed to fetch sets: ${setsRes.statusText}`);
    
    const cardData = await cardRes.text();
    const setsData = await setsRes.text();
    
    fs.writeFileSync(destPath, cardData);
    fs.writeFileSync(setsPath, setsData);
    
    console.log('✅ Successfully updated data/raw/card-data.json and data/raw/sets.json!');
    
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
    process.exit(1);
  }
}

updateDatabase();
