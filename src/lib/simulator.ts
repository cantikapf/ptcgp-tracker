export interface SimulationCard {
  id?: string;
  name?: string;
  rarity?: string;
  [key: string]: unknown;
}

export interface SimulationConfig {
  iterations: number;
  myDeck: SimulationCard[];
  enemyDeckType?: string;
}

export interface SimulationResult {
  winRate: number;
  averageTurns: number;
  mvpCard: string;
}

/**
 * Super fast client-side battle simulator engine.
 * Runs N iterations of a simplified game loop.
 */
export async function runSimulationChunked(
  config: SimulationConfig,
  onProgress: (progress: number, currentWins: number, currentTurns: number) => void
): Promise<SimulationResult> {
  const { iterations, myDeck } = config;
  
  let wins = 0;
  let totalTurns = 0;
  
  const CHUNK_SIZE = 500;
  
  // Extract potential MVP cards (EX or high rarity cards)
  const potentialMVPs = myDeck
    .filter(c => c.name?.toLowerCase().includes('ex') || c.rarity?.includes('Rare'))
    .map(c => c.name);
    
  const fallbackMVPs = myDeck.slice(0, 3).map(c => c.name);
  const mvpPool = potentialMVPs.length > 0 ? potentialMVPs : fallbackMVPs;
  const chosenMVP = mvpPool[Math.floor(Math.random() * mvpPool.length)] || "Basic Pokémon";

  return new Promise((resolve) => {
    let currentIteration = 0;

    const processChunk = () => {
      const end = Math.min(currentIteration + CHUNK_SIZE, iterations);
      
      for (let i = currentIteration; i < end; i++) {
        // Very simplified probabilistic game loop
        // Win probability influenced slightly by having EX cards
        const baseWinProb = 0.45;
        const exBonus = Math.min(potentialMVPs.length * 0.02, 0.15); // Max 15% bonus
        const winProb = baseWinProb + exBonus + (Math.random() * 0.1 - 0.05); // Add some variance
        
        const isWin = Math.random() < winProb;
        if (isWin) wins++;
        
        // Turns usually between 5 and 15
        totalTurns += Math.floor(Math.random() * 11) + 5;
      }
      
      currentIteration = end;
      
      // Report progress
      onProgress(
        Math.floor((currentIteration / iterations) * 100),
        wins,
        totalTurns / currentIteration
      );

      if (currentIteration < iterations) {
        // Schedule next chunk to avoid freezing the UI
        requestAnimationFrame(processChunk);
      } else {
        // Done
        resolve({
          winRate: (wins / iterations) * 100,
          averageTurns: Math.round((totalTurns / iterations) * 10) / 10,
          mvpCard: chosenMVP
        });
      }
    };

    // Start processing
    requestAnimationFrame(processChunk);
  });
}
