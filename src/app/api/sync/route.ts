import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

interface DbCard {
  id: string;
  quantity: number;
  [key: string]: unknown;
}

export async function POST(request: Request) {
  let browser;
  try {
    const isMock = process.env.MOCK_API === 'true';
    let userCards: Array<{ cardId?: string; amount?: number }> = [];

    if (isMock) {
      const mineJsonPath = path.resolve(process.cwd(), 'data', 'raw', 'mine.json');
      if (fs.existsSync(mineJsonPath)) {
        userCards = JSON.parse(fs.readFileSync(mineJsonPath, 'utf8'));
      } else {
        return NextResponse.json({ error: 'data/raw/mine.json not found in mock mode' }, { status: 400 });
      }
    } else {
      let playerId;
      try {
        // Safe JSON parse in case frontend sends empty body
        const text = await request.text();
        if (text) {
          const body = JSON.parse(text);
          playerId = body?.playerId;
        }
      } catch (e) {
        console.warn("Empty or invalid JSON body", e);
      }
      
      playerId = playerId || process.env.PLAYER_ID;
      
      // Fallback: manually read .env.local so it works even if server wasn't restarted
      if (!playerId) {
        try {
          const envLocal = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
          const match = envLocal.match(/PLAYER_ID=(.+)/);
          if (match) {
            playerId = match[1].trim();
          }
        } catch (e) {
          console.warn("Could not read .env.local manually", e);
        }
      }

      if (!playerId) {
        return NextResponse.json({ error: 'Player ID is required. Please set PLAYER_ID in .env.local' }, { status: 400 });
      }

      // Launch Puppeteer with stealth
      browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      
      // Intercept the internal API call that the sets page makes
      let apiData: string | null = null;
      page.on('response', async (response) => {
        const reqUrl = response.url();
        if (reqUrl.includes('/api/players/') && response.status() === 200) {
          try {
            apiData = await response.text();
          } catch (e) {
            console.warn('Failed to read API response body:', e);
          }
        }
      });

      // Navigate to the sets page (public HTML page, not blocked)
      const setsUrl = `https://www.pokemon-zone.com/players/${playerId}/sets/`;
      console.log('Navigating to:', setsUrl);
      await page.goto(setsUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // If we didn't intercept an API call, try fetching it from within the page context
      if (!apiData) {
        console.log('No API intercept, trying in-page fetch...');
        try {
          apiData = await page.evaluate(async (pid: string) => {
            const res = await fetch(`/api/players/${pid}/`);
            return await res.text();
          }, playerId);
        } catch (e) {
          console.warn('In-page fetch also failed:', e);
        }
      }

      if (!apiData) {
        // Last resort: try to scrape card data from the HTML page itself
        console.log('Trying HTML scrape fallback...');
        const pageContent = await page.evaluate(() => document.body.innerText);
        console.log('Page content preview:', pageContent.substring(0, 500));
        return NextResponse.json({ 
          error: 'Failed to fetch data from Pokemon Zone. The site might be under maintenance or blocking access. Try again later.' 
        }, { status: 500 });
      }

      let parsed;
      try {
        parsed = JSON.parse(apiData);
      } catch {
        console.error('Failed to parse API data. Raw:', apiData?.substring(0, 500));
        return NextResponse.json({ error: 'Invalid data format from Pokemon Zone. Try again later.' }, { status: 500 });
      }

      userCards = parsed?.data?.cards;

      if (!Array.isArray(userCards)) {
        // Try alternative data structures
        if (Array.isArray(parsed?.cards)) {
          userCards = parsed.cards;
        } else if (Array.isArray(parsed?.data)) {
          userCards = parsed.data;
        } else if (Array.isArray(parsed)) {
          userCards = parsed;
        } else {
          console.error('Unexpected data structure:', JSON.stringify(parsed).substring(0, 500));
          return NextResponse.json({ error: 'Unrecognized data format from Pokemon Zone' }, { status: 400 });
        }
      }

      // Save to mine.json for offline backup & seed_db.mjs
      const mineJsonPath = path.resolve(process.cwd(), 'data', 'raw', 'mine.json');
      try {
        fs.writeFileSync(mineJsonPath, JSON.stringify(userCards, null, 2));
      } catch (e) {
        console.warn("Failed to save mine.json", e);
      }
    }

    const quantities: Record<string, number> = {};
    for (const item of userCards) {
      if (item.cardId) {
        quantities[item.cardId] = (quantities[item.cardId] || 0) + (item.amount || 1);
      }
    }

    let allCards: DbCard[] = [];
    let hasMoreCards = true;
    let pageNum = 0;
    const cardsPageSize = 1000;

    while (hasMoreCards) {
      const { data, error: fetchError } = await supabase
        .from('cards')
        .select('*')
        .range(pageNum * cardsPageSize, (pageNum + 1) * cardsPageSize - 1);
      
      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        allCards = [...allCards, ...data];
        if (data.length < cardsPageSize) {
          hasMoreCards = false;
        } else {
          pageNum++;
        }
      } else {
        hasMoreCards = false;
      }
    }

    let updatedCount = 0;

    // Snapshot old quantities BEFORE mutating, so we can detect newly obtained cards
    const prevQuantityMap: Record<string, number> = {};
    for (const card of allCards) {
      prevQuantityMap[card.id] = (card.quantity as number) || 0;
    }

    for(const card of allCards) {
      card.quantity = quantities[card.id] || 0;
    }

    const existingCardIds = new Set(allCards.map(c => c.id));
    const missingCardIds = Object.keys(quantities).filter(id => !existingCardIds.has(id));

    if (missingCardIds.length > 0) {
      console.log(`Found ${missingCardIds.length} missing cards in database. Fetching metadata...`);
      let missingCardsData: any[] = [];
      
      // If browser is available, fetch dynamically from the API using page evaluate
      if (browser) {
        try {
          const pageList = await browser.pages();
          const p = pageList.length > 0 ? pageList[0] : await browser.newPage();
          
          missingCardsData = await p.evaluate(async (cardIds: string[]) => {
             const res = await fetch('/api/game/card-data/');
             if (!res.ok) return [];
             const d = await res.json();
             const allC = d.cards || d?.data?.cards || (Array.isArray(d) ? d : Object.values(d));
             const cardArray = Array.isArray(allC) ? allC : Object.values(allC);
             
             return cardIds.map(id => {
               const found = cardArray.find((c: any) => (c.id || c.cardId) === id);
               return found ? found : null;
             }).filter(Boolean);
          }, missingCardIds);
        } catch (e) {
          console.warn('Failed to fetch missing cards from Pokemon Zone API:', e);
        }
      } else {
        // Fallback for mock mode or if browser failed: try to read local file
        try {
          const localDataPath = path.resolve(process.cwd(), 'data', 'raw', 'card-data.json');
          if (fs.existsSync(localDataPath)) {
             const d = JSON.parse(fs.readFileSync(localDataPath, 'utf8'));
             const allC = d.cards || d.data?.cards || (Array.isArray(d) ? d : Object.values(d));
             const cardArray = Array.isArray(allC) ? allC : Object.values(allC);
             missingCardsData = missingCardIds.map(id => {
               const found = cardArray.find((c: any) => (c.id || c.cardId) === id);
               return found ? found : null;
             }).filter(Boolean);
          }
        } catch (e) {
          console.warn('Failed to read local card-data.json fallback:', e);
        }
      }

      // Convert missingCardsData to DbCard format and append to allCards
      for (const card of missingCardsData) {
        const id = card.id || card.cardId;
        const name = card.name || (card.slug ? card.slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : id);
        let imageUrl = card.illustrationUrl || card.image || null;
        
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
            attacks = JSON.stringify(card.pokemon.pokemonAttacks.map((atk: any) => ({
              name: atk.name,
              damage: atk.damage,
              cost: atk.attackCost
            })));
          }
          if (card.pokemon.pokemonAbilities && card.pokemon.pokemonAbilities.length > 0) {
            abilities = JSON.stringify(card.pokemon.pokemonAbilities.map((ab: any) => ({
              name: ab.name,
              description: ab.description
            })));
          }
        } else if (card.trainer) {
          cardType = card.trainer.trainerTypeLabel || card.trainer.trainerType || 'Trainer';
          rules = card.description || card.trainer.description || null;
        }

        const newDbCard: DbCard = {
          id,
          name,
          slug: card.slug || '',
          expansionId: card.expansionId || '',
          expansionName: card.expansionName || '',
          pokedexNumber: card.pokedexNumber || card.collectionNumber || 0,
          quantity: quantities[id] || 0,
          imageUrl,
          cardType,
          stage,
          evolvesFrom,
          hp,
          attacks,
          abilities,
          rules,
          lastReceivedAt: null
        };
        
        // New cards (not previously in DB) always count as newly obtained if quantity > 0
        if ((quantities[id] || 0) > 0) {
          prevQuantityMap[id] = 0;
        }

        allCards.push(newDbCard);
      }
      
      // For any IDs that we couldn't fetch metadata for, create a very basic fallback
      const newlyAddedIds = new Set(missingCardsData.map(c => c.id || c.cardId));
      for (const missingId of missingCardIds) {
        if (!newlyAddedIds.has(missingId)) {
          console.warn(`Could not fetch metadata for new card ${missingId}. Creating minimal entry.`);
          const fallbackCard = {
            id: missingId,
            name: `Unknown Card (${missingId})`,
            quantity: quantities[missingId] || 0,
            imageUrl: null,
            cardType: 'Unknown'
          } as any;
          if ((quantities[missingId] || 0) > 0) {
            prevQuantityMap[missingId] = 0;
          }
          allCards.push(fallbackCard);
        }
      }
    }

    // Detect newly obtained cards: cards whose quantity went from 0 → >0
    const newlyObtainedCards: Array<{
      id: string;
      name: string;
      quantity: number;
      imageUrl: string | null;
      expansionName: string;
    }> = [];

    for (const card of allCards) {
      const prevQty = prevQuantityMap[card.id] ?? 0;
      const newQty = (card.quantity as number) || 0;
      if (prevQty === 0 && newQty > 0) {
        newlyObtainedCards.push({
          id: card.id,
          name: String(card.name || card.id),
          quantity: newQty,
          imageUrl: (card.imageUrl as string | null) ?? null,
          expansionName: String(card.expansionName || ''),
        });
      }
    }

    for (let i = 0; i < allCards.length; i += 500) {
      const chunk = allCards.slice(i, i + 500);
      const { error: upsertError } = await supabase.from('cards').upsert(chunk);
      if (upsertError) throw upsertError;
      updatedCount += chunk.length;
    }

    return NextResponse.json({ success: true, updated: updatedCount, newCards: newlyObtainedCards });

  } catch (error) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
