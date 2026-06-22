import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateImages() {
  console.log('Loading card-data.json...');
  const dataPath = path.resolve('data/raw/card-data.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const cardData = JSON.parse(rawData);
  const cards = cardData.cards;

  console.log(`Found ${cards.length} cards in card-data.json.`);

  let updated = 0;
  let batch = [];

  for (const card of cards) {
    const id = card.cardId;
    const imageUrl = card.illustrationUrl;

    if (id && imageUrl) {
      batch.push({
        id: String(id),
        imageUrl: imageUrl
      });
    }

    if (batch.length === 100) {
      // Supabase upsert doesn't allow partial updates easily without selecting first, 
      // but we can just use an update statement for each, or upsert if we know all required fields.
      // Since we don't want to overwrite other fields, we'll do individual updates or a bulk update RPC.
      // Individual updates are fine for ~600 cards.
      for (const b of batch) {
        await supabase.from('cards').update({ imageUrl: b.imageUrl }).eq('id', b.id);
      }
      updated += batch.length;
      console.log(`Updated ${updated} cards...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    for (const b of batch) {
      await supabase.from('cards').update({ imageUrl: b.imageUrl }).eq('id', b.id);
    }
    updated += batch.length;
  }

  console.log(`Successfully updated ${updated} card images!`);
}

updateImages().catch(console.error);
