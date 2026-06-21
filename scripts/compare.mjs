import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function compare() {
  // Read CSV
  const csvContent = fs.readFileSync('../collection_pokemon_final.csv', 'utf-8');
  const lines = csvContent.split('\n').filter(l => l.trim() !== '');
  
  // Skip header
  const csvData = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace('\r', '');
    const match = line.match(/^(.+?),(\d+)$/);
    if (match) {
      const name = match[1].trim().toLowerCase();
      const qty = parseInt(match[2].trim(), 10);
      if (qty > 0) {
        csvData[name] = (csvData[name] || 0) + qty;
      }
    }
  }

  // Read DB
  const db = await open({
    filename: './ptcgp_tracker.sqlite',
    driver: sqlite3.Database
  });

  const dbCards = await db.all('SELECT name, quantity FROM cards WHERE quantity > 0');
  const dbData = {};
  for (const card of dbCards) {
    // pokemon-zone names might include " ex", let's normalize
    const name = card.name.trim().toLowerCase();
    dbData[name] = (dbData[name] || 0) + card.quantity;
  }

  await db.close();

  console.log(`Unique cards in CSV: ${Object.keys(csvData).length}`);
  console.log(`Unique cards in DB: ${Object.keys(dbData).length}`);

  let totalCsv = 0;
  let totalDb = 0;
  for (const qty of Object.values(csvData)) totalCsv += qty;
  for (const qty of Object.values(dbData)) totalDb += qty;

  console.log(`Total card copies in CSV: ${totalCsv}`);
  console.log(`Total card copies in DB: ${totalDb}`);

  let diffCount = 0;
  console.log('\n--- Differences ---');
  for (const name of new Set([...Object.keys(csvData), ...Object.keys(dbData)])) {
    const csvQ = csvData[name] || 0;
    const dbQ = dbData[name] || 0;
    if (csvQ !== dbQ) {
      console.log(`${name}: CSV=${csvQ}, DB=${dbQ}`);
      diffCount++;
    }
  }

  if (diffCount === 0) {
    console.log('\nAll data matches perfectly!');
  } else {
    console.log(`\nFound differences in ${diffCount} card names.`);
  }
}

compare().catch(console.error);
