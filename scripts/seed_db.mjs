import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function seed() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Loading JSON files...');
  const cardDataRaw = JSON.parse(fs.readFileSync('data/raw/card-data.json', 'utf-8'));
  const mineRaw = JSON.parse(fs.readFileSync('data/raw/mine.json', 'utf-8'));

  const allCards = cardDataRaw.cards || cardDataRaw.data?.cards || {};
  const userCards = mineRaw.data?.cards || [];

  const quantities = {};
  const lastReceivedAt = {};
  for (const item of userCards) {
    if (item.cardId) {
      quantities[item.cardId] = (quantities[item.cardId] || 0) + (item.amount || 1);
      if (item.lastReceivedAt) {
        lastReceivedAt[item.cardId] = item.lastReceivedAt;
      }
    }
  }

  const cardEntries = Array.isArray(allCards) ? allCards : Object.entries(allCards);
  let batch = [];
  let count = 0;

  for (let i=0; i<cardEntries.length; i++) {
    const entry = cardEntries[i];
    let id, card;
    if (Array.isArray(allCards)) {
        card = entry;
        id = card.id || card.cardId;
    } else {
        id = entry[0];
        card = entry[1];
    }
    
    const name = card.name || (card.slug ? card.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : id);
    const qty = quantities[id] || 0;
    
    let imageUrl = '';
    if (card.expansionId && (card.collectionNumber || card.pokedexNumber)) {
      const cleanExp = card.expansionId.replace(/-/g, '').toLowerCase();
      const num = card.collectionNumber || card.pokedexNumber || 0;
      const paddedNum = String(num).padStart(3, '0');
      imageUrl = `https://raw.githubusercontent.com/chase-manning/pokemon-tcg-pocket-cards/refs/heads/main/images/cards/${cleanExp}-${paddedNum}.png`;
    } else {
      imageUrl = card.illustrationUrl || card.image || `https://assets.pokemon-zone.com/game-assets/CardPreviews/c${id}.webp`;
    }
    
    let cardType = 'Colorless';
    let stage = null;
    let evolvesFrom = null;
    let hp = null;
    let attacks = null;
    let abilities = null;
    let rules = null;

    if (card.pokemon) {
      if (card.pokemon.pokemonTypes && card.pokemon.pokemonTypes.length > 0) {
        cardType = card.pokemon.pokemonTypes[0];
      }
      stage = card.pokemon.evolutionStage || 'Basic';
      evolvesFrom = card.pokemon.previousEvolution?.cardId || null;
      hp = card.pokemon.hp || null;
      if (card.pokemon.pokemonAttacks && card.pokemon.pokemonAttacks.length > 0) {
        attacks = JSON.stringify(card.pokemon.pokemonAttacks.map(atk => ({
          name: atk.name,
          damage: atk.damage,
          cost: atk.attackCost
        })));
      }
      if (card.pokemon.pokemonAbilities && card.pokemon.pokemonAbilities.length > 0) {
        abilities = JSON.stringify(card.pokemon.pokemonAbilities.map(ab => ({
          name: ab.name,
          description: ab.description
        })));
      }
    } else if (card.trainer) {
      cardType = card.trainer.trainerTypeLabel || card.trainer.trainerType || 'Trainer';
      rules = card.rulesDescription || null;
    }

    const lra = lastReceivedAt[id] || null;

    if (id) {
        batch.push({
          id,
          name,
          slug: card.slug || '',
          expansionId: card.expansionId || '',
          expansionName: card.expansionName || '',
          pokedexNumber: card.pokedexNumber || card.collectionNumber || 0,
          quantity: qty,
          imageUrl,
          cardType,
          stage,
          evolvesFrom,
          hp,
          attacks,
          abilities,
          rules,
          lastReceivedAt: lra
        });
        
        if (batch.length === 100) {
          const { error } = await supabase.from('cards').upsert(batch);
          if (error) console.error('Error inserting batch:', error);
          count += batch.length;
          batch = [];
          console.log(`Seeded ${count} cards...`);
        }
    }
  }

  if (batch.length > 0) {
    const { error } = await supabase.from('cards').upsert(batch);
    if (error) console.error('Error inserting batch:', error);
    count += batch.length;
  }

  console.log(`Successfully seeded ${count} cards into Supabase database!`);
}

seed().catch(console.error);
