'use client';

import React from 'react';
import { FaSync, FaRobot, FaTrophy } from 'react-icons/fa';
import { useDeckTracker } from '@/context/DeckTrackerContext';

export default function Navbar() {
  const {
    setShowAiModal,
    handleSyncMeta,
    isSyncingMeta,
    handleSync,
    isSyncing,
    lastSyncData,
  } = useDeckTracker();

  return (
    <header className="navbar-header">
      <div>
        <h1 className="navbar-title">
          <span className="navbar-brand-accent">Poké</span>Tracker
        </h1>
        <p className="navbar-subtitle">Manage your Pokémon TCG Pocket collection</p>
      </div>
      <div className="navbar-actions">
        <button className="btn-secondary" onClick={() => setShowAiModal(true)}>
          <FaRobot /> Ask AI for Deck
        </button>
        <button className="btn-secondary" onClick={() => setShowSavedDecksModal(true)}>
          💾 Saved Decks
        </button>
        <button className="btn-secondary" onClick={handleSyncMeta} disabled={isSyncingMeta}>
          <FaTrophy className={isSyncingMeta ? 'spin' : ''} /> {isSyncingMeta ? 'Syncing Meta...' : 'Sync Meta Decks'}
        </button>
        <button className="btn-primary" onClick={handleSync} disabled={isSyncing}>
          <FaSync className={isSyncing ? 'spin' : ''} /> {isSyncing ? 'Syncing...' : 'Sync Data'}
        </button>
        {lastSyncData && (
          <span className="navbar-sync-text">
            Last Update: {lastSyncData}
          </span>
        )}
      </div>
    </header>
  );
}
