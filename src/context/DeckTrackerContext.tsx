'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Interfaces matching page.tsx and plan.md
export interface CardData {
  id: string;
  name: string;
  slug: string;
  expansionId: string;
  expansionName: string;
  pokedexNumber: number;
  quantity: number;
  imageUrl?: string;
  hp?: number | null;
  lastReceivedAt?: string;

  // plan.md fields
  pokedex_number?: number | null;
  type?: string | null;
  rarity?: string | null;
  expansion_name?: string | null;
  collection_number?: string | null;
  image_url?: string | null;
  release_date?: string | null;
}

export interface Matchup {
  opponent: string;
  win_probability: number;
}

export interface SimResult {
  winRate: number;
  analysis: string;
  matchups: Matchup[];

  // plan.md fields
  simulations?: number;
  matchupsRecord?: Record<string, string>;
}

export interface GeneratedCard {
  id: string;
  name: string;
  count: number;
  quantity?: number;
}

export interface GeneratedDeck {
  id?: string;
  name: string;
  strategy: string;
  cards: GeneratedCard[];

  // plan.md fields
  cardsRecord?: Record<string, number>;
}

export interface TopDeck {
  name: string;
  tier: string;
  winRate: number; // page.tsx winRate is number
  strategy: string;
  cards: string[]; // page.tsx cards is string[]

  // plan.md fields
  win_rate?: string;
  cardsRecord?: Record<string, number>;
}

export interface DeckTrackerContextType {
  // Collection States
  cards: CardData[];
  ownedCardsList: CardData[];
  loading: boolean;
  isSyncing: boolean;
  syncError: string | null;
  lastSyncData: string | null;
  sortBy: string;
  setSortBy: (sort: string) => void;
  handleSync: () => Promise<void>;

  // Meta States
  topDecks: TopDeck[];
  metaLastSync: string | null;
  isSyncingMeta: boolean;
  handleSyncMeta: () => Promise<void>;

  // AI & Simulation States
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
  isGenerating: boolean;
  generatedDeck: GeneratedDeck | null;
  setGeneratedDeck: (deck: GeneratedDeck | null) => void;
  generateDeck: () => Promise<void>;
  simResult: SimResult | null;
  isSimulating: boolean;
  simulateDeck: (localWinRate?: number) => Promise<void>;

  // Modal Visibility States
  showAiModal: boolean;
  setShowAiModal: (show: boolean) => void;
  showSavedDecksModal: boolean;
  setShowSavedDecksModal: (show: boolean) => void;
  selectedCard: CardData | null;
  setSelectedCard: (card: CardData | null) => void;
  selectedMetaDeck: TopDeck | null;
  setSelectedMetaDeck: (deck: TopDeck | null) => void;
  expandedSets: Record<string, boolean>;
  toggleSet: (setName: string) => void;
  showMetaDecks: boolean;
  setShowMetaDecks: (show: boolean) => void;
}

export const DeckTrackerContext = createContext<DeckTrackerContextType | undefined>(undefined);

export function DeckTrackerProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncData, setLastSyncData] = useState<string | null>(null);

  // AI Modal States
  const [showAiModal, setShowAiModal] = useState(false);
  const [showSavedDecksModal, setShowSavedDecksModal] = useState(false);
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
    fetchTopDecks();
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

  const simulateDeck = async (localWinRate?: number) => {
    if (!generatedDeck) return;
    setIsSimulating(true);
    setSimResult(null);

    try {
      const res = await fetch('/api/simulate-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckName: generatedDeck.name,
          localWinRate: localWinRate,
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
        alert("Simulation failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menghubungi API Simulasi");
    } finally {
      setIsSimulating(false);
    }
  };

  const toggleSet = (setName: string) => {
    setExpandedSets((prev) => {
      const isExpanded = prev[setName] !== false; // default true
      return {
        ...prev,
        [setName]: !isExpanded,
      };
    });
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
    <DeckTrackerContext.Provider
      value={{
        cards,
        ownedCardsList,
        loading,
        isSyncing,
        syncError,
        lastSyncData,
        sortBy,
        setSortBy,
        handleSync,
        topDecks,
        metaLastSync,
        isSyncingMeta,
        handleSyncMeta,
        aiPrompt,
        setAiPrompt,
        isGenerating,
        generatedDeck,
        setGeneratedDeck,
        generateDeck,
        simResult,
        isSimulating,
        simulateDeck,
        showAiModal,
        setShowAiModal,
        showSavedDecksModal,
        setShowSavedDecksModal,
        selectedCard,
        setSelectedCard,
        selectedMetaDeck,
        setSelectedMetaDeck,
        expandedSets,
        toggleSet,
        showMetaDecks,
        setShowMetaDecks,
      }}
    >
      {children}
    </DeckTrackerContext.Provider>
  );
}

export function useDeckTracker() {
  const context = useContext(DeckTrackerContext);
  if (context === undefined) {
    throw new Error('useDeckTracker must be used within a DeckTrackerProvider');
  }
  return context;
}
