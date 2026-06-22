'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useDeckTracker } from '@/context/DeckTrackerContext';
import HoloCard from '@/components/HoloCard';
import BaseModal from './BaseModal';

export default function CardDetailModal() {
  const { selectedCard, setSelectedCard } = useDeckTracker();

  return (
    <AnimatePresence>
      {selectedCard && (
        <BaseModal
          onClose={() => setSelectedCard(null)}
          maxWidth="400px"
          initialScale={0.8}
          initialY={50}
          className="card-detail-modal-content"
        >
          <div className="card-detail-image-container">
            <HoloCard id={selectedCard.id} name={selectedCard.name} imageUrl={selectedCard.imageUrl || ''} />
          </div>
          <h2 className="card-detail-title">{selectedCard.name}</h2>
          <p className="card-detail-info">
            Owned: <strong>{selectedCard.quantity}</strong> copies
          </p>
          <button 
            className="btn-secondary card-detail-close-btn" 
            onClick={() => setSelectedCard(null)}
          >
            Close
          </button>
        </BaseModal>
      )}
    </AnimatePresence>
  );
}
