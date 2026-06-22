'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HoloCard from '@/components/HoloCard';
import { useDeckTracker } from '@/context/DeckTrackerContext';

export default function CollectionGrid() {
  const {
    ownedCardsList,
    sortBy,
    setSortBy,
    loading,
    expandedSets,
    toggleSet,
    setSelectedCard,
  } = useDeckTracker();

  return (
    <>
      <div className="collection-header">
        <h2 className="collection-title">
          Your Collection ({ownedCardsList.length} Cards)
        </h2>
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="collection-sort-select"
        >
          <option value="collection_asc">Collection #</option>
          <option value="pokedexNumber_asc">Pokédex #</option>
          <option value="name_asc">Name</option>
          <option value="release_date_desc">Release Date</option>
          <option value="last_updated_desc">Last Updated</option>
          <option value="hp_desc">HP</option>
          <option value="quantity_desc">Card Count</option>
        </select>
      </div>

      {loading ? (
        <div className="collection-loading">Loading...</div>
      ) : (
        <div>
          {(() => {
            // Group cards by expansionName
            const grouped = ownedCardsList.reduce((acc, card) => {
              const set = card.expansionName || 'Promo / Others';
              if (!acc[set]) acc[set] = [];
              acc[set].push(card);
              return acc;
            }, {} as Record<string, typeof ownedCardsList>);

            return Object.entries(grouped).map(([setName, setCards]) => {
              const isExpanded = expandedSets[setName] !== false; // default true
              return (
                <div key={setName} className="collection-set-container">
                  <h3 
                    className="collection-set-header"
                    onClick={() => toggleSet(setName)}
                  >
                    <span>{setName} ({setCards.length} Cards)</span>
                    <span>{isExpanded ? '▼' : '▶'}</span>
                  </h3>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="card-grid">
                          {setCards.map((card) => (
                            <motion.div 
                              key={card.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                              style={{ position: 'relative', cursor: 'pointer', aspectRatio: '63/88' }}
                              onClick={() => setSelectedCard(card)}
                            >
                              <div className="pokemon-card-wrapper">
                                <HoloCard id={card.id} name={card.name} imageUrl={card.imageUrl || ''} />
                                <div className="card-badge">x{card.quantity}</div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            });
          })()}
        </div>
      )}
    </>
  );
}
