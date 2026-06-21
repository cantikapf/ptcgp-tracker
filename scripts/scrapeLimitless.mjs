import fs from 'fs';
import path from 'path';

// Calculate win rate: wins / total matches
function calcWinRate(stats) {
  const total = stats.wins + stats.losses + stats.ties;
  if (total === 0) return 0;
  return Number(((stats.wins / total) * 100).toFixed(1));
}

// Convert limitless decklist into an array of string card names
function extractCards(decklist) {
  const cards = [];
  const addCards = (group) => {
    if (!group) return;
    for (const card of group) {
      for (let i = 0; i < card.count; i++) {
        cards.push(card.name);
      }
    }
  };
  addCards(decklist.pokemon);
  addCards(decklist.trainer);
  // Energy doesn't have a count in Limitless response, it just gives types like "Fire"
  // Let's just fill the rest of the 20 slots with energy (or skip energy since our matcher handles it)
  // Our generator only cares about the cards array. Let's push whatever we have.
  return cards;
}

async function scrapeLimitlessAPI() {
  console.log('Fetching recent POCKET tournaments from Limitless API...');
  const tRes = await fetch('https://play.limitlesstcg.com/api/tournaments?game=POCKET&limit=10');
  
  if (!tRes.ok) {
    throw new Error('Failed to fetch tournaments');
  }
  
  const tournaments = await tRes.json();
  
  const deckStats = {};
  
  console.log(`Analyzing ${tournaments.length} tournaments...`);
  
  for (const t of tournaments) {
    const sRes = await fetch(`https://play.limitlesstcg.com/api/tournaments/${t.id}/standings`);
    if (!sRes.ok) continue;
    
    const standings = await sRes.json();
    
    for (const player of standings) {
      if (!player.deck || !player.decklist || !player.record) continue;
      
      const deckId = player.deck.name;
      const points = (player.record.wins * 3) + (player.record.ties * 1);
      
      if (!deckStats[deckId]) {
        deckStats[deckId] = {
          name: deckId,
          totalPoints: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          bestPoints: -1,
          bestList: null
        };
      }
      
      deckStats[deckId].totalPoints += points;
      deckStats[deckId].wins += player.record.wins;
      deckStats[deckId].losses += player.record.losses;
      deckStats[deckId].ties += player.record.ties;
      
      if (points > deckStats[deckId].bestPoints) {
        deckStats[deckId].bestPoints = points;
        deckStats[deckId].bestList = extractCards(player.decklist);
      }
    }
  }
  
  // Sort decks by total points across recent tournaments
  const sortedDecks = Object.values(deckStats)
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .filter(d => d.totalPoints > 20); // Arbitrary threshold to ignore rogue decks
    
  // Assign tiers dynamically based on percentile
  const topDecks = sortedDecks.map((deck, index) => {
    let tier = 'Tier 3';
    if (index === 0 || index === 1) tier = 'Tier S';
    else if (index <= 4) tier = 'Tier 1';
    else if (index <= 8) tier = 'Tier 2';
    
    return {
      name: deck.name,
      tier: tier,
      winRate: calcWinRate({ wins: deck.wins, losses: deck.losses, ties: deck.ties }),
      strategy: `Sebuah deck ${deck.name} yang difokuskan pada kartu andalan mereka. Peringkat: #${index + 1} di Limitless.`,
      cards: deck.bestList
    };
  });
  
  const finalJson = { 
    lastSync: new Date().toISOString(),
    topDecks 
  };
  
  const outputPath = path.resolve('public', 'meta-tier-list.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalJson, null, 2), 'utf-8');
  console.log(`\nBerhasil! Tersimpan ${topDecks.length} deck meta ke ${outputPath}`);
  console.log('Top 3 Decks:');
  for (let i = 0; i < Math.min(3, topDecks.length); i++) {
    console.log(`${i+1}. ${topDecks[i].name} (WinRate: ${topDecks[i].winRate}%)`);
  }
}

scrapeLimitlessAPI().catch(console.error);
