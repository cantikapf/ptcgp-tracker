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
    setExpandedSets,
    setSelectedCard,
    displayMode,
    setDisplayMode
  } = useDeckTracker();

  // Group cards for the grouped view
  const grouped = React.useMemo(() => {
    return ownedCardsList.reduce((acc, card) => {
      const set = card.expansionName || 'Promo / Others';
      if (!acc[set]) acc[set] = [];
      acc[set].push(card);
      return acc;
    }, {} as Record<string, typeof ownedCardsList>);
  }, [ownedCardsList]);

  const handleExpandAll = () => {
    const newExpandedState: Record<string, boolean> = {};
    Object.keys(grouped).forEach(setName => {
      newExpandedState[setName] = true;
    });
    setExpandedSets(newExpandedState);
  };

  const handleCollapseAll = () => {
    const newExpandedState: Record<string, boolean> = {};
    Object.keys(grouped).forEach(setName => {
      newExpandedState[setName] = false;
    });
    setExpandedSets(newExpandedState);
  };

  return (
    <>
      <div className="collection-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <h2 className="collection-title">
          Your Collection ({ownedCardsList.length} Cards)
        </h2>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
            <button 
              onClick={() => setDisplayMode('flat')}
              style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: displayMode === 'flat' ? '#6366f1' : 'transparent', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Flat View
            </button>
            <button 
              onClick={() => setDisplayMode('grouped')}
              style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: displayMode === 'grouped' ? '#6366f1' : 'transparent', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Grouped
            </button>
          </div>

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
      </div>

      {displayMode === 'grouped' && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'flex-end' }}>
          <button 
            onClick={handleExpandAll}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Expand All
          </button>
          <button 
            onClick={handleCollapseAll}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Collapse All
          </button>
        </div>
      )}

      {loading ? (
        <div className="collection-loading">Loading...</div>
      ) : (
        <div>
          {displayMode === 'flat' ? (
            <div className="card-grid">
              {ownedCardsList.map((card) => (
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
          ) : (
            Object.entries(grouped).map(([setName, setCards]) => {
              // Note: If expandedSets[setName] is undefined, we default to true
              const isExpanded = expandedSets[setName] !== false; 
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
            })
          )}
        </div>
      )}
    </>
  );
}
