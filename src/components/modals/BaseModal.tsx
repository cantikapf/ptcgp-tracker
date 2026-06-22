'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface BaseModalProps {
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  initialScale?: number;
  initialY?: number;
  contentStyle?: React.CSSProperties;
  className?: string;
}

export default function BaseModal({
  onClose,
  children,
  maxWidth = '800px',
  initialScale = 0.9,
  initialY = 20,
  contentStyle = {},
  className = ''
}: BaseModalProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-backdrop"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: initialScale, y: initialY }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: initialScale, y: initialY }}
        className={`modal-content ${className}`}
        style={{
          maxWidth,
          ...contentStyle
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
