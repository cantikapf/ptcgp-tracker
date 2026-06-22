'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaList } from 'react-icons/fa';
import { useDeckTracker } from '@/context/DeckTrackerContext';

export default function MetaDecksShowcase() {
  const {
    topDecks,
    generatedDeck,
    metaLastSync,
    showMetaDecks,
    setShowMetaDecks,
    setSelectedMetaDeck,
  } = useDeckTracker();

  if (topDecks.length === 0 || generatedDeck) return null;

  return (
    <section className="meta-decks-section">
      <div className="meta-decks-header">
        <h2 className="meta-decks-title">
          <span className="meta-decks-title-emoji">🏆</span> Top Meta Decks
        </h2>
        <div className="meta-decks-actions">
          {metaLastSync && <span className="meta-decks-timestamp">Last update: {metaLastSync}</span>}
          <button 
            onClick={() => setShowMetaDecks(!showMetaDecks)}
            className="meta-decks-toggle-btn"
          >
            {showMetaDecks ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {showMetaDecks && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="meta-decks-grid">
              {topDecks.map((deck, idx) => (
                <div key={idx} className={`glass-panel meta-deck-card ${deck.tier === 'Tier S' ? 'tier-s' : 'tier-a'}`}>
                  <div className={`meta-deck-badge ${deck.tier === 'Tier S' ? 'badge-s' : 'badge-a'}`}>
                    {deck.tier}
                  </div>
                  <h3 className="meta-deck-name">{deck.name}</h3>
                  <div className="meta-deck-winrate-container">
                    <span className="meta-deck-winrate-label">Win Rate:</span>
                    <strong className={`meta-deck-winrate-value ${deck.winRate > 60 ? 'high-winrate' : 'normal-winrate'}`}>{deck.winRate}%</strong>
                  </div>
                  <p className="meta-deck-strategy">{deck.strategy}</p>
                  <button 
                    className="btn-secondary meta-deck-view-btn" 
                    onClick={() => setSelectedMetaDeck(deck)}
                  >
                    <FaList /> View Decklist
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
