'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { FaArchive, FaTimes, FaTrash } from 'react-icons/fa';
import { useDeckTracker, GeneratedDeck, GeneratedCard } from '@/context/DeckTrackerContext';
import BaseModal from './BaseModal';

interface SavedDeckRecord {
  id: string;
  name: string;
  strategy: string;
  cards: GeneratedCard[];
  is_saved: number;
}

export default function SavedDecksModal() {
  const { showSavedDecksModal, setShowSavedDecksModal, setGeneratedDeck, setShowAiModal } = useDeckTracker();
  const [savedDecks, setSavedDecks] = useState<SavedDeckRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/decks');
      const data = await res.json();
      if (res.ok) {
        // Only show decks explicitly saved by the user
        setSavedDecks(data.decks.filter((d: SavedDeckRecord) => d.is_saved === 1));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showSavedDecksModal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDecks();
    }
  }, [showSavedDecksModal]);

  const deleteDeck = async (id: string) => {
    if (!confirm('Hapus deck ini dari koleksi?')) return;
    try {
      await fetch('/api/decks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchDecks();
    } catch (e) {
      console.error(e);
    }
  };

  const loadDeck = (deck: SavedDeckRecord) => {
    const genDeck: GeneratedDeck = {
      id: deck.id,
      name: deck.name,
      strategy: deck.strategy || 'Strategi deck tersimpan.',
      cards: deck.cards
    };
    setGeneratedDeck(genDeck);
    setShowSavedDecksModal(false);
    setShowAiModal(true); // Open AI modal to show the deck details and simulation
  };

  return (
    <AnimatePresence>
      {showSavedDecksModal && (
        <BaseModal onClose={() => setShowSavedDecksModal(false)} maxWidth="700px">
          <div className="modal-header">
            <h2 className="modal-title">
              <FaArchive color="var(--accent-primary)" /> Koleksi Deck Saya
            </h2>
            <button className="modal-close-btn" onClick={() => setShowSavedDecksModal(false)}>
              <FaTimes />
            </button>
          </div>

          <div style={{ marginTop: '1rem' }}>
            {loading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Memuat koleksi...</p>
            ) : savedDecks.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Belum ada deck yang disimpan. Buat dari AI Deck Builder dan klik Simpan!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {savedDecks.map((deck) => (
                  <div key={deck.id} style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '12px', 
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>{deck.name}</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{deck.cards?.length || 0} Kartu Unik</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-primary" onClick={() => loadDeck(deck)}>Lihat & Mainkan</button>
                      <button className="btn-secondary" style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }} onClick={() => deleteDeck(deck.id)}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </BaseModal>
      )}
    </AnimatePresence>
  );
}
