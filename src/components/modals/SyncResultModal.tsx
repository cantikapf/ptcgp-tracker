'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NewCard {
  id: string;
  name: string;
  quantity: number;
  imageUrl: string | null;
  expansionName: string;
}

interface SyncResultModalProps {
  isOpen: boolean;
  newCards: NewCard[];
  onClose: () => void;
}

export default function SyncResultModal({ isOpen, newCards, onClose }: SyncResultModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, rgba(20,20,35,0.98) 0%, rgba(30,20,50,0.98) 100%)',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: '20px',
              padding: '2rem',
              width: '100%',
              maxWidth: '540px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.15)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🎉</span>
                  <h2 style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    Sync Complete!
                  </h2>
                </div>
                {newCards.length > 0 ? (
                  <p style={{ color: '#9ba1a6', fontSize: '0.9rem' }}>
                    You obtained{' '}
                    <span style={{ color: '#a5b4fc', fontWeight: 600 }}>
                      {newCards.length} new card{newCards.length !== 1 ? 's' : ''}
                    </span>{' '}
                    since last sync
                  </p>
                ) : (
                  <p style={{ color: '#9ba1a6', fontSize: '0.9rem' }}>
                    No new cards found — your collection is up to date!
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  color: '#9ba1a6',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'white'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9ba1a6'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
              >
                ✕
              </button>
            </div>

            {/* Card list */}
            {newCards.length > 0 && (
              <div style={{
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                paddingRight: '4px',
              }}>
                {newCards.map((card, idx) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '12px',
                      padding: '0.6rem 0.85rem',
                    }}
                  >
                    {/* Card image thumbnail */}
                    <div style={{
                      width: '38px',
                      height: '53px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      background: 'rgba(99,102,241,0.15)',
                      border: '1px solid rgba(99,102,241,0.2)',
                    }}>
                      {card.imageUrl ? (
                        <img
                          src={card.imageUrl}
                          alt={card.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem',
                        }}>
                          🃏
                        </div>
                      )}
                    </div>

                    {/* Card info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        color: '#f0f0f5',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {card.name}
                      </div>
                      {card.expansionName && (
                        <div style={{ fontSize: '0.78rem', color: '#9ba1a6', marginTop: '2px' }}>
                          {card.expansionName}
                        </div>
                      )}
                    </div>

                    {/* Quantity badge */}
                    <div style={{
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      borderRadius: '20px',
                      padding: '2px 10px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'white',
                      flexShrink: 0,
                    }}>
                      ×{card.quantity}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: '1.5rem' }}>
              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
              >
                Awesome! 🚀
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
