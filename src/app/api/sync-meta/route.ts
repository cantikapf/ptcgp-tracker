import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = util.promisify(exec);

export async function POST() {
  try {
    const isMock = process.env.MOCK_API === 'true';
    const metaPath = path.resolve(process.cwd(), 'public', 'meta-tier-list.json');

    if (isMock) {
      if (!fs.existsSync(metaPath)) {
        const mockMeta = {
          lastSync: new Date().toISOString(),
          topDecks: [
            {
              name: "Charizard ex Moltres ex",
              tier: "Tier S",
              winRate: 51.9,
              strategy: "Sebuah deck Charizard ex Moltres ex yang difokuskan pada kartu andalan mereka. Peringkat: #1 di Limitless.",
              cards: ["Charmander", "Charizard ex", "Moltres ex"]
            },
            {
              name: "Zoroark ex Mega Absol ex",
              tier: "Tier S",
              winRate: 49.3,
              strategy: "Sebuah deck Zoroark ex Mega Absol ex yang difokuskan pada kartu andalan mereka. Peringkat: #2 di Limitless.",
              cards: ["Zorua", "Zoroark ex", "Mega Absol ex"]
            },
            {
              name: "Pikachu ex",
              tier: "Tier S",
              winRate: 50.5,
              strategy: "Sebuah deck Pikachu ex yang difokuskan pada kartu andalan mereka. Peringkat: #3 di Limitless.",
              cards: ["Pikachu ex", "Zapdos ex", "Voltorb", "Electrode"]
            }
          ]
        };
        fs.writeFileSync(metaPath, JSON.stringify(mockMeta, null, 2), 'utf8');
      }
      return NextResponse.json({ success: true, message: 'Meta Deck List updated successfully (Mock).' });
    }

    const scriptPath = path.resolve(process.cwd(), 'scripts', 'scrapeLimitless.mjs');
    console.log('Running scrapeLimitless.mjs...');
    
    // Execute the Node script
    const { stdout, stderr } = await execPromise(`node "${scriptPath}"`);
    
    console.log('Scrape Meta stdout:', stdout);
    if (stderr) {
      console.warn('Scrape Meta stderr:', stderr);
    }

    return NextResponse.json({ success: true, message: 'Meta Deck List updated successfully.' });
  } catch (error) {
    console.error('Error running scrapeLimitless.mjs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to sync meta decks';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
