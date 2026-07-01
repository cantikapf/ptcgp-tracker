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

  let setsData = {};
  try {
      if (fs.existsSync('data/raw/sets.json')) {
          const rawSets = JSON.parse(fs.readFileSync('data/raw/sets.json', 'utf-8'));
          Object.values(rawSets).forEach(group => {
              if (Array.isArray(group)) {
                  group.forEach(set => {
                     setsData[set.code] = set.name?.en || set.code;
                  });
              }
          });
      }
  } catch (e) {
      console.warn("Could not load sets.json, expansion names will fallback to codes.");
  }

  const allCards = Array.isArray(cardDataRaw) ? cardDataRaw : (cardDataRaw.cards || cardDataRaw.data?.cards || []);
  let userCards = [];
  if (Array.isArray(mineRaw)) {
    userCards = mineRaw;
  } else if (Array.isArray(mineRaw.data?.cards)) {
    userCards = mineRaw.data.cards;
  } else if (Array.isArray(mineRaw.cards)) {
    userCards = mineRaw.cards;
  } else if (Array.isArray(mineRaw.data)) {
    userCards = mineRaw.data;
  }

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
        if (!id && card.image) {
            const match = card.image.match(/c((PK|TR)_[0-9]+_[0-9]+_[0-9]+)/);
            if (match) id = match[1];
        }
    } else {
        id = entry[0];
        card = entry[1];
    }
    
    // Generate slug from name, set, and number if not present
    let slug = card.slug;
    if (!slug) {
        const safeName = (card.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const safeSet = (card.set || '').toLowerCase();
        slug = `${safeName}-${safeSet}-${card.number}`;
    }

    const name = card.name || (slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : id);
    const qty = quantities[id] || 0;
    
    let imageUrl = `/images/cards/${card.image}`;
    if (!card.image) {
        const fileExt = card.illustrationUrl && card.illustrationUrl.endsWith('.png') ? '.png' : '.webp';
        imageUrl = `/images/cards/${slug}${fileExt}`;
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
      rules = card.description || card.trainer.description || null;
    } else if (card.type) {
      // Fallback for new flibustier dist/cards.extra.json format
      if (card.type === 'pokemon') {
          cardType = card.element ? card.element.charAt(0).toUpperCase() + card.element.slice(1) : 'Colorless';
          stage = card.stage === 'basic' ? 'Basic' : `Stage ${card.stage}`;
          hp = card.health || null;
          evolvesFrom = card.evolvesFrom || null;
      } else {
          cardType = 'Trainer';
      }
    }

    const lra = lastReceivedAt[id] || null;

    if (id) {
        batch.push({
          id,
          name,
          slug,
          expansionId: card.expansionId || card.set || '',
          expansionName: card.expansionName || setsData[card.set] || card.set || '',
          pokedexNumber: card.pokedexNumber || card.collectionNumber || card.number || 0,
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
