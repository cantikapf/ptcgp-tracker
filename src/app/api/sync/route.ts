import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

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

    const { data: allCards, error: fetchError } = await supabase.from('cards').select('*');
    if (fetchError) throw fetchError;

    let updatedCount = 0;
    for(const card of allCards) {
      card.quantity = quantities[card.id] || 0;
    }

    for (let i = 0; i < allCards.length; i += 500) {
      const chunk = allCards.slice(i, i + 500);
      const { error: upsertError } = await supabase.from('cards').upsert(chunk);
      if (upsertError) throw upsertError;
      updatedCount += chunk.length;
    }

    return NextResponse.json({ success: true, updated: updatedCount });

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
