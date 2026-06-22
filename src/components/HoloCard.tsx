'use client';

import React, { useRef, useState, useEffect } from 'react';
import './holo.css'; // Adjust the import path depending on where HoloCard.tsx is placed

interface HoloCardProps {
  id: string;
  name: string;
  imageUrl: string;
  quantity?: number;
  rarity?: string; // e.g. "Three Diamond", "One Star", etc.
  style?: React.CSSProperties;
  className?: string;
}

export default function HoloCard({ id, name, imageUrl, quantity = 1, style, className }: HoloCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const getProxiedUrl = (url: string | null | undefined) => {
    return url;
  };

  const [imgSrc, setImgSrc] = useState<string | null | undefined>(imageUrl);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImgSrc(imageUrl);
    setFallbackIndex(0);
    setHasError(false);
  }, [imageUrl]);

  const handleError = () => {
    if (!imgSrc || imgSrc === '/images/card-back.png') {
      // Avoid infinite loop if local card back fails, use transparent pixel fallback
      setImgSrc('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
      setHasError(true);
      return;
    }

    if (imgSrc === 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7') {
      // Already at final fallback
      setHasError(true);
      return;
    }

    // First fallback is always card back
    setImgSrc('/images/card-back.png');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;

    const centerX = percentX - 50;
    const centerY = percentY - 50;

    // Adjust divisor for rotation intensity
    const rotateX = -(centerY / 3.5);
    const rotateY = centerX / 3.5;

    cardRef.current.style.setProperty('--pointer-x', `${percentX}%`);
    cardRef.current.style.setProperty('--pointer-y', `${percentY}%`);
    cardRef.current.style.setProperty('--rotate-x', `${rotateX}deg`);
    cardRef.current.style.setProperty('--rotate-y', `${rotateY}deg`);
    cardRef.current.style.setProperty('--card-opacity', '1');
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--rotate-x', '0deg');
    cardRef.current.style.setProperty('--rotate-y', '0deg');
    cardRef.current.style.setProperty('--card-opacity', '0');
  };

  // Determine if this card should have holo effects
  const safeName = name || '';
  const isCosmos = safeName.toLowerCase().endsWith(' ex');
  const isHolo = true; // Apply a subtle shine to all cards, or change to true for testing

  return (
    <div 
      ref={cardRef}
      className={`holo-card-container ${className || ''}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className={`holo-card ${quantity === 0 ? 'grayscale' : ''} ${isHolo ? 'holo-enabled' : ''} ${isCosmos ? 'holo-cosmos' : ''}`}
      >
        <img 
          src={imgSrc || '/images/card-back.png'} 
          alt={hasError ? '' : name} 
          referrerPolicy="no-referrer"
          onError={handleError}
          style={{
            display: hasError ? 'none' : 'block',
          }}
        />
        {isHolo && <div className="shine"></div>}
        <div className="glare"></div>
      </div>
    </div>
  );
}
