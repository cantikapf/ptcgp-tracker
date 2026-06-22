'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaTimes, FaPlay } from 'react-icons/fa';
import { useDeckTracker, GeneratedCard, CardData } from '@/context/DeckTrackerContext';
import HoloCard from '@/components/HoloCard';
import BaseModal from './BaseModal';
import { runSimulationChunked, SimulationResult as LocalSimResult } from '@/lib/simulator';

export default function AiDeckBuilderModal() {
  const {
    showAiModal,
    setShowAiModal,
    generatedDeck,
    setGeneratedDeck,
    aiPrompt,
    setAiPrompt,
    isGenerating,
    generateDeck,
    isSimulating,
    simulateDeck,
    simResult,
    cards,
    setSelectedCard,
  } = useDeckTracker();

  const SUGGESTED_PROMPTS = [
    "Fast lightning deck using Pikachu ex",
    "Psychic control deck with Mewtwo ex",
    "Heavy fire damage Charizard ex",
    "Water stall deck using Articuno ex"
  ];

  const [localSimProgress, setLocalSimProgress] = React.useState<number>(0);
  const [localSimWins, setLocalSimWins] = React.useState<number>(0);
  const [localSimTurns, setLocalSimTurns] = React.useState<number>(0);
  const [localSimResult, setLocalSimResult] = React.useState<LocalSimResult | null>(null);
  const [isLocalSimulating, setIsLocalSimulating] = React.useState<boolean>(false);

  const startLocalSimulation = async () => {
    if (!generatedDeck) return;
    setIsLocalSimulating(true);
    setLocalSimProgress(0);
    setLocalSimResult(null);

    const result = await runSimulationChunked(
      { iterations: 10000, myDeck: generatedDeck.cards as any },
      (progress, wins, avgTurns) => {
        setLocalSimProgress(progress);
        setLocalSimWins(wins);
        setLocalSimTurns(avgTurns);
      }
    );

    setLocalSimResult(result);
    setIsLocalSimulating(false);
    return result.winRate;
  };

  return (
    <AnimatePresence>
      {showAiModal && (
        <BaseModal
          onClose={() => setShowAiModal(false)}
          maxWidth="800px"
        >
          <div className="modal-header">
            <h2 className="modal-title">
              <FaRobot color="var(--accent-primary)" /> AI Deck Builder
            </h2>
            <button 
              className="modal-close-btn" 
              onClick={() => setShowAiModal(false)}
            >
              <FaTimes />
            </button>
          </div>

          {!generatedDeck ? (
            <>
              <p className="modal-desc">
                Describe the deck you want to build or select a template below.
              </p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {SUGGESTED_PROMPTS.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAiPrompt(promptText)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '20px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  >
                    {promptText}
                  </button>
                ))}
              </div>

              <textarea 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="I want to build a deck..."
                className="modal-textarea"
              />
              <button 
                className="btn-primary modal-action-btn" 
                onClick={generateDeck} 
                disabled={isGenerating || !aiPrompt}
              >
                {isGenerating ? 'Analyzing collection...' : 'Generate Deck Now!'}
              </button>
            </>
          ) : (
            <div>
              <div className="modal-deck-summary">
                <h3 className="modal-deck-title">{generatedDeck.name}</h3>
                <p className="modal-deck-strategy">
                  {generatedDeck.strategy.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={i} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
                    }
                    return <React.Fragment key={i}>{part}</React.Fragment>;
                  })}
                </p>
              </div>

              <div className="navbar-actions">
                <button 
                  className="btn-primary modal-sim-btn" 
                  onClick={() => {
                    startLocalSimulation().then((finalWinRate) => {
                      simulateDeck(finalWinRate); // Pass local winrate to AI
                    });
                  }}
                  disabled={isSimulating || isLocalSimulating}
                >
                  {isLocalSimulating ? `Simulating ${localSimProgress}%...` : <><FaPlay /> ⚔️ Simulate 10,000 Matches</>}
                </button>
              </div>

              {(isLocalSimulating || localSimResult) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  className="modal-sim-result"
                  style={{ marginTop: '1rem', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', background: 'rgba(0,0,0,0.2)' }}
                >
                  <h4 className="modal-sim-header" style={{ marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
                    <span>Live Simulation (10,000 Matches)</span>
                    <span>{localSimProgress}%</span>
                  </h4>
                  
                  <div style={{ width: '100%', height: '8px', background: 'var(--surface-color)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div style={{ width: `${localSimProgress}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.1s linear' }}></div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Live Win Rate</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: (localSimResult?.winRate || (localSimWins/(localSimProgress*100 || 1))*100) > 50 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                        {localSimResult ? localSimResult.winRate.toFixed(1) : ((localSimWins/(localSimProgress*100 || 1))*100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Avg Turns</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                        {localSimResult ? localSimResult.averageTurns : localSimTurns.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Predicted MVP</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                        {localSimResult ? localSimResult.mvpCard : "Analyzing..."}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {simResult && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  className="modal-sim-result"
                >
                  <h4 className="modal-sim-header">
                    <span>Laporan Simulasi AI</span>
                    <span>Win Rate: {simResult.winRate}%</span>
                  </h4>
                  <p className="modal-sim-analysis">{simResult.analysis}</p>
                  
                  {simResult.matchups && simResult.matchups.length > 0 && (
                    <div>
                      <strong className="modal-sim-matchups-title">Vs Top Meta:</strong>
                      <ul className="modal-sim-matchups-list">
                        {simResult.matchups.map((m, idx) => (
                          <li key={idx} className="modal-sim-matchups-item">
                            <span>{m.opponent}</span>
                            <strong className={m.win_probability > 50 ? 'win-prob-high' : 'win-prob-low'}>{m.win_probability}%</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Generated from Prompt:</h4>
                    <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-primary)' }}>&quot;{aiPrompt}&quot;</p>
                  </div>
                  <button 
                    className="btn-secondary" 
                    onClick={() => { setGeneratedDeck(null); }}
                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                  >
                    🔄 Edit / Regenerate
                  </button>
                </div>
              </div>

              <h4 className="modal-card-list-title">Card List:</h4>
              <div className="deck-builder-card-grid">
                {generatedDeck.cards.map((c: GeneratedCard, idx: number) => {
                  const matchString = (c.id || '').toLowerCase();
                  const fullCard = cards.find(oc => oc.id.toLowerCase() === matchString) || 
                                   cards.find(oc => oc.name.toLowerCase() === matchString) ||
                                   cards.find(oc => oc.name.toLowerCase() === (c.name || '').toLowerCase());
                  
                  let imgUrl = fullCard?.imageUrl;
                  if (!imgUrl || imgUrl === '') {
                    imgUrl = `https://assets.pokemon-zone.com/game-assets/CardPreviews/c${c.id}.webp`;
                  }

                  return (
                    <div 
                      key={idx} 
                      className="deck-builder-card-item"
                      onClick={() => {
                        const cardData: CardData = fullCard || {
                          id: c.id,
                          name: c.name || 'Unknown',
                          slug: c.id,
                          expansionId: '',
                          expansionName: '',
                          pokedexNumber: 0,
                          quantity: c.quantity || c.count || 1,
                          imageUrl: imgUrl
                        };
                        setSelectedCard(cardData);
                      }}
                    >
                       <div className="deck-builder-card-img-wrapper">
                         <HoloCard id={c.id} name={fullCard?.name || 'Unknown'} imageUrl={imgUrl} />
                         <div className="deck-builder-card-qty-badge">
                           {c.quantity || c.count || 1}
                         </div>
                       </div>
                       <div className="deck-builder-card-name">{fullCard?.name || c.name || 'Unknown'}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button 
                  className="btn-primary" 
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                  onClick={async () => {
                    try {
                      await fetch('/api/decks', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: generatedDeck.id, is_saved: true })
                      });
                      alert('Deck berhasil disimpan ke koleksi!');
                    } catch (e) {
                      alert('Gagal menyimpan deck');
                    }
                  }}
                >
                  💾 Simpan Deck
                </button>
                <button 
                  className="btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setGeneratedDeck(null)}
                >
                  Create Another Deck
                </button>
              </div>
            </div>
          )}
        </BaseModal>
      )}
    </AnimatePresence>
  );
}
