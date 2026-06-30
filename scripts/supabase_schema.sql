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

-- SECURITY POLICIES (RLS)
-- 1. Aktifkan Row-Level Security
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_decks ENABLE ROW LEVEL SECURITY;

-- 2. Buat kebijakan (Policy) agar publik hanya bisa membaca (SELECT) data kartu
CREATE POLICY "Allow public read access on cards" ON public.cards FOR SELECT USING (true);
CREATE POLICY "Allow public read access on saved_decks" ON public.saved_decks FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on saved_decks" ON public.saved_decks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on saved_decks" ON public.saved_decks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on saved_decks" ON public.saved_decks FOR DELETE USING (true);
