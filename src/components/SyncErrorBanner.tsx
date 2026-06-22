'use client';

import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { useDeckTracker } from '@/context/DeckTrackerContext';

export default function SyncErrorBanner() {
  const { syncError } = useDeckTracker();

  if (!syncError) return null;

  return (
    <div style={{ background: 'rgba(244, 67, 54, 0.1)', border: '1px solid #f44336', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <FaExclamationTriangle color="#f44336" />
      <span>{syncError}</span>
    </div>
  );
}
