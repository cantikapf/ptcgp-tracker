-- Run this in your Supabase Dashboard SQL Editor

CREATE TABLE IF NOT EXISTS public.cards (
  id TEXT PRIMARY KEY,
  name TEXT,
  slug TEXT,
  "expansionId" TEXT,
  "expansionName" TEXT,
  "pokedexNumber" INTEGER,
  quantity INTEGER DEFAULT 0,
  "imageUrl" TEXT,
  "cardType" TEXT,
  stage TEXT,
  "evolvesFrom" TEXT,
  hp INTEGER,
  attacks TEXT,
  abilities TEXT,
  rules TEXT,
  "lastReceivedAt" TEXT
);

CREATE TABLE IF NOT EXISTS public.saved_decks (
  id TEXT PRIMARY KEY,
  name TEXT,
  cards TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
