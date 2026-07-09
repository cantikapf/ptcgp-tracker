'use client';

import React from 'react';
import { DeckTrackerProvider } from '@/context/DeckTrackerContext';
import Navbar from '@/components/Navbar';
import SyncErrorBanner from '@/components/SyncErrorBanner';
import MetaDecksShowcase from '@/components/MetaDecksShowcase';
import CollectionGrid from '@/components/CollectionGrid';
import AiDeckBuilderModal from '@/components/modals/AiDeckBuilderModal';
import SavedDecksModal from '@/components/modals/SavedDecksModal';
import CardDetailModal from '@/components/modals/CardDetailModal';
import MetaDeckDetailModal from '@/components/modals/MetaDeckDetailModal';
import SyncResultModal from '@/components/modals/SyncResultModal';
import { useDeckTracker } from '@/context/DeckTrackerContext';

export default function Home() {
  return (
    <DeckTrackerProvider>
      <HomeContent />
    </DeckTrackerProvider>
  );
}

function HomeContent() {
  const { syncNewCards, showSyncResult, setShowSyncResult } = useDeckTracker();
  return (
    <main className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', position: 'relative' }}>
      <Navbar />
      <SyncErrorBanner />
      <MetaDecksShowcase />
      <CollectionGrid />
      
      {/* Modals */}
      <AiDeckBuilderModal />
      <CardDetailModal />
      <MetaDeckDetailModal />
      <SavedDecksModal />
      <SyncResultModal
        isOpen={showSyncResult}
        newCards={syncNewCards || []}
        onClose={() => setShowSyncResult(false)}
      />
    </main>
  );
}
