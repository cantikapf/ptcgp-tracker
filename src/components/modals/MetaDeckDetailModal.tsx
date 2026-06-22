'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { FaTrophy, FaTimes } from 'react-icons/fa';
import { useDeckTracker } from '@/context/DeckTrackerContext';
import HoloCard from '@/components/HoloCard';
import BaseModal from './BaseModal';

export default function MetaDeckDetailModal() {
  const { cards, selectedMetaDeck, setSelectedMetaDeck } = useDeckTracker();

  return (
    <AnimatePresence>
      {selectedMetaDeck && (
        <BaseModal
          onClose={() => setSelectedMetaDeck(null)}
          maxWidth="800px"
        >
          <div className="modal-header">
            <h2 className="modal-title meta-deck-detail-title">
              <FaTrophy /> {selectedMetaDeck.name}
            </h2>
            <button 
              className="modal-close-btn" 
              onClick={() => setSelectedMetaDeck(null)}
            >
              <FaTimes />
            </button>
          </div>

          <div className="meta-deck-detail-summary">
            <div className="meta-deck-detail-stats">
              <span className="meta-deck-detail-tier-badge">
                {selectedMetaDeck.tier}
              </span>
              <span className={`meta-deck-detail-winrate ${selectedMetaDeck.winRate > 60 ? 'high-winrate' : 'normal-winrate'}`}>
                Win Rate: {selectedMetaDeck.winRate}%
              </span>
            </div>
            <p className="meta-deck-detail-strategy">{selectedMetaDeck.strategy}</p>
          </div>

          <h4 className="meta-deck-detail-list-title">Card Tracker (Required vs Owned):</h4>
          <div className="meta-deck-detail-grid">
            {(() => {
              // Calculate required cards
              const reqCards = selectedMetaDeck.cards.reduce((acc: Record<string, number>, name: string) => {
                acc[name] = (acc[name] || 0) + 1;
                return acc;
              }, {});
              
              return Object.entries(reqCards).map(([cardName, reqQty], idx) => {
                // Find all variants of this card the user owns and sum their quantities
                const userVariants = cards.filter(c => c.name === cardName);
                const userQty = userVariants.reduce((sum, c) => sum + c.quantity, 0);
                const missingQty = Math.max(0, reqQty - userQty);
                const isMissing = missingQty > 0;
                
                // Grab an image from DB (first variant found, or fallback to unknown image if totally missing)
                const displayCard = userVariants[0] || { 
                  id: 'unknown', 
                  imageUrl: `https://assets.pokemon-zone.com/game-assets/UI/Textures/System/ItemIcons/CardThumb/ICON_unknown.webp` 
                };

                return (
                  <div 
                    key={idx} 
                    className={`meta-deck-detail-item ${isMissing ? 'missing' : 'owned'}`}
                  >
                    <div className="meta-deck-detail-img-wrapper">
                      <HoloCard id={displayCard.id} name={cardName} imageUrl={displayCard.imageUrl || ''} />
                      {isMissing && (
                        <div className="meta-deck-detail-qty-badge missing">
                          -{missingQty}
                        </div>
                      )}
                      {!isMissing && (
                        <div className="meta-deck-detail-qty-badge owned">
                          ✓
                        </div>
                      )}
                    </div>
                    <div className="meta-deck-detail-name">
                      {cardName}
                    </div>
                    <div className={`meta-deck-detail-qty-label ${isMissing ? 'missing' : 'owned'}`}>
                      Butuh: {reqQty}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </BaseModal>
      )}
    </AnimatePresence>
  );
}
