'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaTimes, FaPlay } from 'react-icons/fa';
import { useDeckTracker, GeneratedCard, CardData } from '@/context/DeckTrackerContext';
import HoloCard from '@/components/HoloCard';
import BaseModal from './BaseModal';

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
                Describe the deck you want to build (e.g., &quot;Fast deck using Pikachu&quot; or &quot;Poison deck with Arbok&quot;).
              </p>
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
                <p className="modal-deck-strategy">{generatedDeck.strategy}</p>
              </div>

              <div className="navbar-actions">
                <button 
                  className="btn-primary modal-sim-btn" 
                  onClick={simulateDeck}
                  disabled={isSimulating}
                >
                  {isSimulating ? 'Memuat Simulasi...' : <><FaPlay /> ⚔️ Simulasikan Pertarungan</>}
                </button>
              </div>

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

              <h4 className="modal-card-list-title">Card List:</h4>
              <div className="deck-builder-card-grid">
                {generatedDeck.cards.map((c: GeneratedCard, idx: number) => {
                  const fullCard = cards.find(oc => oc.id === c.id);
                  const imgUrl = fullCard?.imageUrl || `https://assets.pokemon-zone.com/game-assets/UI/Textures/System/ItemIcons/CardThumb/ICON_${c.id}.webp`;
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
                       <div className="deck-builder-card-name">{fullCard?.name || 'Unknown'}</div>
                    </div>
                  );
                })}
              </div>

              <button className="btn-secondary deck-builder-reset-btn" onClick={() => setGeneratedDeck(null)}>
                Create Another Deck
              </button>
            </div>
          )}
        </BaseModal>
      )}
    </AnimatePresence>
  );
}
