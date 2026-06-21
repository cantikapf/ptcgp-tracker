'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaSync, FaExclamationTriangle, FaTimes, FaRobot, FaTrophy, FaList } from 'react-icons/fa';
import HoloCard from '@/components/HoloCard';

interface CardData {
  id: string;
  name: string;
  slug: string;
  expansionId: string;
  expansionName: string;
  pokedexNumber: number;
  quantity: number;
  imageUrl?: string;
  hp?: number;
  lastReceivedAt?: string;
}

interface Matchup {
  opponent: string;
  win_probability: number;
}

interface SimResult {
  winRate: number;
  analysis: string;
  matchups: Matchup[];
}

interface GeneratedCard {
  id: string;
  name: string;
  count: number;
  quantity?: number;
}

interface GeneratedDeck {
  id?: string;
  name: string;
  strategy: string;
  cards: GeneratedCard[];
}

interface TopDeck {
  name: string;
  tier: string;
  winRate: number;
  strategy: string;
  cards: string[];
}

export default function Home() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncData, setLastSyncData] = useState<string | null>(null);

  // AI Modal States
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDeck, setGeneratedDeck] = useState<GeneratedDeck | null>(null);
  
  // Sim State
  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Meta Tier List State
  const [topDecks, setTopDecks] = useState<TopDeck[]>([]);
  const [metaLastSync, setMetaLastSync] = useState<string | null>(null);
  const [isSyncingMeta, setIsSyncingMeta] = useState(false);
  const [selectedMetaDeck, setSelectedMetaDeck] = useState<TopDeck | null>(null);
  const [showMetaDecks, setShowMetaDecks] = useState(true);

  // UI States
  const [expandedSets, setExpandedSets] = useState<Record<string, boolean>>({});
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [sortBy, setSortBy] = useState('collection_asc');

  const fetchCollection = async () => {
    try {
      const res = await fetch('/api/cards');
      const data = await res.json();
      setCards(data.cards || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch collection', err);
    }
  };

  const fetchTopDecks = async () => {
    try {
      const res = await fetch('/meta-tier-list.json');
      if (res.ok) {
        const data = await res.json();
        setTopDecks(data.topDecks || data);
        if (data.lastSync) {
          setMetaLastSync(new Date(data.lastSync).toLocaleString('id-ID'));
        }
      }
    } catch (err) {
      console.error('Failed to fetch top decks', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCollection();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTopDecks();
    // Restore last sync timestamp from localStorage
    const saved = localStorage.getItem('lastSyncData');
    if (saved) setLastSyncData(saved);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync');
      }
      
      await fetchCollection();
      const now = new Date().toLocaleString('id-ID');
      setLastSyncData(now);
      localStorage.setItem('lastSyncData', now);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncMeta = async () => {
    setIsSyncingMeta(true);
    setSyncError(null);
    try {
      const res = await fetch('/api/sync-meta', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync meta decks');
      await fetchTopDecks();
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSyncingMeta(false);
    }
  };

  const generateDeck = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    setGeneratedDeck(null);
    setSimResult(null);
    
    try {
      const res = await fetch('/api/generate-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedDeck(data.deck || data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const simulateDeck = async () => {
    if (!generatedDeck) return;
    setIsSimulating(true);
    setSimResult(null);
    
    try {
      const res = await fetch('/api/simulate-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckName: generatedDeck.name,
          deckCards: generatedDeck.cards.map((c: GeneratedCard) => {
            const foundCard = cards.find((card) => card.id === c.id);
            return {
              id: c.id,
              name: foundCard ? foundCard.name : 'Unknown Card',
              count: c.quantity || c.count || 1
            };
          })
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setSimResult(data);
      } else {
        alert("Simulasi gagal: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menghubungi API Simulasi");
    } finally {
      setIsSimulating(false);
    }
  };

  const ownedCardsList = cards.filter(c => c.quantity > 0).sort((a, b) => {
    switch (sortBy) {
      case 'collection_asc': return a.id.localeCompare(b.id);
      case 'pokedexNumber_asc': return a.pokedexNumber - b.pokedexNumber;
      case 'name_asc': return a.name.localeCompare(b.name);
      case 'release_date_desc': return b.expansionId.localeCompare(a.expansionId);
      case 'last_updated_desc': 
        const dateA = a.lastReceivedAt ? new Date(a.lastReceivedAt).getTime() : 0;
        const dateB = b.lastReceivedAt ? new Date(b.lastReceivedAt).getTime() : 0;
        return dateB - dateA;
      case 'hp_desc': return (b.hp || 0) - (a.hp || 0);
      case 'quantity_desc': return b.quantity - a.quantity;
      default: return 0;
    }
  });

  return (
    <main className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', position: 'relative' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--accent-primary)' }}>Poké</span>Tracker
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your Pokémon TCG Pocket collection</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => setShowAiModal(true)}>
            <FaRobot /> Minta AI Buatkan Deck
          </button>
          <button className="btn-secondary" onClick={handleSyncMeta} disabled={isSyncingMeta}>
            <FaTrophy className={isSyncingMeta ? 'spin' : ''} /> {isSyncingMeta ? 'Syncing Meta...' : 'Sync Meta Deck'}
          </button>
          <button className="btn-primary" onClick={handleSync} disabled={isSyncing}>
            <FaSync className={isSyncing ? 'spin' : ''} /> {isSyncing ? 'Syncing...' : 'Sync Data'}
          </button>
          {lastSyncData && <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: '0.5rem', whiteSpace: 'nowrap' }}>Last Update: {lastSyncData}</span>}
        </div>
      </header>

      {syncError && (
        <div style={{ background: 'rgba(244, 67, 54, 0.1)', border: '1px solid #f44336', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaExclamationTriangle color="#f44336" />
          <span>{syncError}</span>
        </div>
      )}

      {/* Top Meta Decks Showcase */}
      {topDecks.length > 0 && !generatedDeck && (
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <span style={{ color: '#ffd700' }}>🏆</span> Top Meta Decks
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {metaLastSync && <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Last update: {metaLastSync}</span>}
              <button 
                onClick={() => setShowMetaDecks(!showMetaDecks)}
                style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '8px' }}
              >
                {showMetaDecks ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
          </div>
          
          <AnimatePresence>
            {showMetaDecks && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {topDecks.map((deck, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: '1.5rem', borderTop: deck.tier === 'Tier S' ? '4px solid #ffd700' : '4px solid #c0c0c0', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: deck.tier === 'Tier S' ? '#ffd700' : '#c0c0c0', color: '#000', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {deck.tier}
                </div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: '#fff', paddingRight: '3rem' }}>{deck.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Win Rate:</span>
                  <strong style={{ color: deck.winRate > 60 ? '#4caf50' : '#ffd700' }}>{deck.winRate}%</strong>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>{deck.strategy}</p>
                <button 
                  className="btn-secondary" 
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  onClick={() => setSelectedMetaDeck(deck)}
                >
                  <FaList /> Lihat Decklist
                </button>
              </div>
            ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '2rem', margin: 0 }}>
          Koleksi Anda ({ownedCardsList.length} Kartu)
        </h2>
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          style={{ background: '#fff', color: '#333', border: '1px solid #ccc', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', minWidth: '180px' }}
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
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading...</div>
      ) : (
        <div>
          {(() => {
            // Group cards by expansionName
            const grouped = ownedCardsList.reduce((acc, card) => {
              const set = card.expansionName || 'Promo / Lainnya';
              if (!acc[set]) acc[set] = [];
              acc[set].push(card);
              return acc;
            }, {} as Record<string, CardData[]>);

            return Object.entries(grouped).map(([setName, setCards]) => {
              const isExpanded = expandedSets[setName] !== false; // default true
              return (
                <div key={setName} style={{ marginBottom: '2rem' }}>
                  <h3 
                    style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--accent-secondary)', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', background: 'rgba(0,0,0,0.3)', padding: '0.8rem 1rem', borderRadius: '8px' }}
                    onClick={() => setExpandedSets(prev => ({ ...prev, [setName]: !isExpanded }))}
                  >
                    <span>{setName} ({setCards.length} Kartu)</span>
                    <span>{isExpanded ? '▼' : '▶'}</span>
                  </h3>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
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
                              <HoloCard id={card.id} name={card.name} imageUrl={card.imageUrl || ''} />
                              <div className="card-badge">x{card.quantity}</div>
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

      {/* AI DECK MODAL */}
      <AnimatePresence>
        {showAiModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
              background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
            }}
            onClick={() => setShowAiModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: 'rgba(20, 20, 30, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
                padding: '2rem', borderRadius: '16px', maxWidth: '800px', width: '100%',
                maxHeight: '90vh', overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <FaRobot color="var(--accent-primary)" /> AI Deck Builder
                </h2>
                <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.5rem' }} onClick={() => setShowAiModal(false)}>
                  <FaTimes />
                </button>
              </div>

              {!generatedDeck ? (
                <>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Deskripsikan deck yang ingin Anda buat (contoh: &quot;Deck cepat menggunakan Pikachu&quot; atau &quot;Deck racun dengan Arbok&quot;).
                  </p>
                  <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Saya ingin membuat deck..."
                    style={{ width: '100%', height: '100px', padding: '1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid var(--glass-border)', marginBottom: '1rem', fontFamily: 'inherit' }}
                  />
                  <button 
                    className="btn-primary" 
                    onClick={generateDeck} 
                    disabled={isGenerating || !aiPrompt}
                    style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                  >
                    {isGenerating ? 'Menganalisis koleksi...' : 'Buat Deck Sekarang!'}
                  </button>
                </>
              ) : (
                <div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--accent-secondary)', marginBottom: '0.5rem' }}>{generatedDeck.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{generatedDeck.strategy}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button 
                      className="btn-primary" 
                      style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', background: '#e91e63' }}
                      onClick={simulateDeck}
                      disabled={isSimulating}
                    >
                      {isSimulating ? 'Memuat Simulasi...' : <><FaPlay /> ⚔️ Simulasikan Pertarungan</>}
                    </button>
                  </div>

                  {simResult && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ background: 'rgba(233, 30, 99, 0.1)', border: '1px solid rgba(233, 30, 99, 0.3)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                      <h4 style={{ color: '#e91e63', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Laporan Simulasi AI</span>
                        <span>Win Rate: {simResult.winRate}%</span>
                      </h4>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>{simResult.analysis}</p>
                      
                      {simResult.matchups && simResult.matchups.length > 0 && (
                        <div>
                          <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>Vs Top Meta:</strong>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
                            {simResult.matchups.map((m: Matchup, idx: number) => (
                              <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.5)', padding: '0.75rem', borderRadius: '4px' }}>
                                <span>{m.opponent}</span>
                                <strong style={{ color: m.win_probability > 50 ? '#4caf50' : '#f44336' }}>{m.win_probability}%</strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}

                  <h4 style={{ marginBottom: '1rem' }}>Daftar Kartu:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                    {generatedDeck.cards.map((c: GeneratedCard, idx: number) => {
                      const fullCard = cards.find(oc => oc.id === c.id);
                      const imgUrl = fullCard?.imageUrl || `https://assets.pokemon-zone.com/game-assets/UI/Textures/System/ItemIcons/CardThumb/ICON_${c.id}.webp`;
                      return (
                        <div key={idx} style={{ textAlign: 'center', aspectRatio: '63/88', display: 'flex', flexDirection: 'column' }}>
                           <div style={{ flex: 1, position: 'relative' }}>
                             <HoloCard id={c.id} name={fullCard?.name || 'Unknown'} imageUrl={imgUrl} />
                           </div>
                           <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{fullCard?.name || 'Unknown'}</div>
                           <div style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 'bold' }}>x{c.quantity || c.count || 1}</div>
                        </div>
                      );
                    })}
                  </div>

                  <button className="btn-secondary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => setGeneratedDeck(null)}>
                    Buat Deck Lain
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SELECTED CARD MODAL */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
              background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
            }}
            onClick={() => setSelectedCard(null)}
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ width: '100%', aspectRatio: '63/88', marginBottom: '2rem' }}>
                <HoloCard id={selectedCard.id} name={selectedCard.name} imageUrl={selectedCard.imageUrl || ''} />
              </div>
              <h2 style={{ color: '#fff', marginBottom: '0.5rem', textAlign: 'center' }}>{selectedCard.name}</h2>
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                Koleksi: <strong>{selectedCard.quantity}</strong> lembar
              </p>
              <button 
                className="btn-secondary" 
                style={{ marginTop: '2rem', padding: '0.8rem 2rem', borderRadius: '30px' }}
                onClick={() => setSelectedCard(null)}
              >
                Tutup
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* META DECK TRACKER MODAL */}
      <AnimatePresence>
        {selectedMetaDeck && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
              background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
            }}
            onClick={() => setSelectedMetaDeck(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: 'rgba(20, 20, 30, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
                padding: '2rem', borderRadius: '16px', maxWidth: '800px', width: '100%',
                maxHeight: '90vh', overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#ffd700' }}>
                  <FaTrophy /> {selectedMetaDeck.name}
                </h2>
                <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.5rem' }} onClick={() => setSelectedMetaDeck(null)}>
                  <FaTimes />
                </button>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                  <span style={{ background: '#ffd700', color: '#000', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{selectedMetaDeck.tier}</span>
                  <span style={{ color: selectedMetaDeck.winRate > 60 ? '#4caf50' : '#ffd700', fontWeight: 'bold' }}>Win Rate: {selectedMetaDeck.winRate}%</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{selectedMetaDeck.strategy}</p>
              </div>

              <h4 style={{ marginBottom: '1rem' }}>Tracker Kartu (Kebutuhan vs Koleksi Anda):</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {(() => {
                  // Calculate required cards
                  const reqCards = selectedMetaDeck.cards.reduce((acc: Record<string, number>, name: string) => {
                    acc[name] = (acc[name] || 0) + 1;
                    return acc;
                  }, {});
                  
                  return Object.entries(reqCards).map(([cardName, reqQty]: [string, number], idx: number) => {
                    // Find all variants of this card the user owns and sum their quantities
                    const userVariants = cards.filter(c => c.name === cardName);
                    const userQty = userVariants.reduce((sum, c) => sum + c.quantity, 0);
                    const missingQty = Math.max(0, reqQty - userQty);
                    const isMissing = missingQty > 0;
                    
                    // Grab an image from DB (first variant found, or fallback to fallback image if totally missing)
                    // If missing entirely from DB (e.g. haven't pulled it once, but we need an image), we might have to fallback
                    // But `cards` array is the entire database, even cards with quantity 0 are in it!
                    const displayCard = userVariants[0] || { id: 'unknown', imageUrl: `https://assets.pokemon-zone.com/game-assets/UI/Textures/System/ItemIcons/CardThumb/ICON_unknown.webp` };

                    return (
                      <div key={idx} style={{ textAlign: 'center', aspectRatio: '63/88', display: 'flex', flexDirection: 'column', opacity: isMissing ? 0.7 : 1 }}>
                         <div style={{ flex: 1, position: 'relative' }}>
                           <HoloCard id={displayCard.id} name={cardName} imageUrl={displayCard.imageUrl || ''} />
                           {isMissing && (
                             <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#f44336', color: '#fff', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', border: '2px solid #222', zIndex: 10 }}>
                               -{missingQty}
                             </div>
                           )}
                           {!isMissing && (
                             <div style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#4caf50', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', border: '2px solid #222', zIndex: 10 }}>
                               ✓
                             </div>
                           )}
                         </div>
                         <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', lineHeight: '1.2', height: '2em', overflow: 'hidden' }}>{cardName}</div>
                         <div style={{ color: isMissing ? '#f44336' : 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '0.2rem' }}>
                           Butuh: {reqQty}
                         </div>
                      </div>
                    );
                  });
                })()}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
