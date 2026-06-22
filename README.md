<p align="center">
  <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" width="60" />
</p>

<h1 align="center">Poké Tracker</h1>

<p align="center">
  <b>Smart Collection Tracker & AI Deck Builder for Pokémon TCG Pocket</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Gemini_AI-Powered-4285f4?style=for-the-badge&logo=google" alt="Gemini AI" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/status-production--ready-brightgreen?style=flat-square" alt="Status" />
</p>

---

## 📖 Overview

**Poké Tracker** is a full-stack web application that automatically syncs your Pokémon TCG Pocket card collection from [Pokemon-Zone](https://www.pokemon-zone.com/) and provides AI-powered deck building and battle simulation features. Built with a premium glassmorphism UI, holographic 3D card effects, and a triple-redundancy AI system.

---

## 🌐 Live Demo

👉 **[Try the Live Demo Here](https://ptcgp-tracker-tau.vercel.app/)**

> [!NOTE]  
> The live demo serves as a visual showcase of the UI and collection tracking features using sample data. **The AI Deck Builder and Battle Simulator features are disabled in the public demo** as they require configuring your own personal AI API keys (Gemini/Groq/OpenRouter). To use the AI features, please clone the repository and run it locally with your own API keys.

---

## ✨ Features

### 🔄 1-Click Auto Sync
Seamlessly syncs your card collection from your public Pokemon-Zone profile using a headless Puppeteer instance with stealth plugins to bypass Cloudflare protection. Supports multi-layered data extraction (API interception → in-page fetch → HTML fallback).

### 🖼️ Local Offline Image Repository
Ships with over **1,250+ high-quality card images** stored locally. This totally bypasses strict Cloudflare 403 blocks and avoids missing assets from external APIs (like TCGDex lacking newer expansions such as Mega Shine A2a). All images load instantly via Vercel's Edge CDN.

### 🎴 Holographic Collection Viewer
Beautifully renders your entire collection with:
- **3D Holographic Card Effects** — tilt-responsive shine, glare, and cosmos effects based on card rarity
- **Glassmorphism UI** — modern frosted-glass design with smooth animations
- **Smart Grouping** — cards organized by expansion set with collapsible sections
- **Collection Progress** — per-set completion tracking with visual progress bars

### 🧠 AI Deck Builder
Tell the AI what kind of deck you want (e.g., *"A fire deck with Charizard ex"*). The AI reads your Supabase database and generates a strictly legal **20-card deck** using **only cards you own**.
**Advanced AI Guardrails:** Built-in logic prevents the AI from hallucinating unplayable combos (e.g. using Koga without Muk/Weezing) and strictly enforces valid evolution chains.

**Professional AI Analysis Output:**
Every generated deck comes with a comprehensive, competitive-tier analysis broken down into three sections:
1. **Decklist & Ratios**: A detailed breakdown of the 20-card composition (Pokémon, Items, Supporters) and the exact counts.
2. **Synergy Analysis**: Explanations of the core combos and how specific cards interact within the deck engine.
3. **Game Plan & Matchups**: Turn-by-turn setup guides for the early game, primary win conditions, and how to mitigate weaknesses against natural counter decks in the meta.

### 🛡️ Triple AI Fallback System
Ensures 100% uptime for deck generation:
| Priority | Provider | Model |
|----------|----------|-------|
| 1st | Google Gemini | `gemini-2.5-flash` |
| 2nd | Groq | `llama-3.3-70b-versatile` |
| 3rd | OpenRouter | `gpt-4o-mini` |

### ⚔️ AI Battle Simulator
Test your newly generated deck instantly against the current top-tier meta without opening the game! The AI acts as an impartial judge and simulates a high-level competitive match against popular meta decks (like Pikachu ex aggro or Mewtwo ex control).
- **Matchup Probabilities**: Calculates your deck's estimated win rate percentage against specific opponents based on typing advantages and setup speed.
- **Strengths & Weaknesses**: Identifies critical points of failure in your strategy.
- **Turn Simulation**: Gives a high-level overview of how a match might theoretically play out if both players draw optimally.

### 🏆 Live Meta Tier List
Scrapes and displays the latest competitive meta decks from [pokemon-tcg-pocket.com](https://pokemon-tcg-pocket.com/). Shows tier rankings, win rates, strategies, and lets you check which meta deck cards you already own.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| **Frontend** | React 19, Framer Motion, React Icons |
| **Styling** | Vanilla CSS with Glassmorphism & Holographic effects |
| **Database** | Supabase (PostgreSQL) |
| **Scraping** | Puppeteer Extra + Stealth Plugin, Cheerio |
| **AI** | Google Gemini (`@google/genai`), Groq & OpenRouter (`openai` SDK) |
| **Language** | TypeScript 5 |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** 9+
- A [Pokemon-Zone](https://www.pokemon-zone.com/) public profile with your Player ID

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/ptcgp-tracker.git
cd ptcgp-tracker
npm install
```

### 2. Environment Variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Your Pokemon-Zone Player ID (from your profile URL)
PLAYER_ID=your_player_id_here

# Supabase Database Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI API Keys (at least one required for deck builder)
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

> [!TIP]
> You only need **one** AI key to get started. [Gemini API](https://aistudio.google.com/apikey) offers a generous free tier. Having multiple keys enables the fallback system for maximum reliability.

### 3. Database Setup

This project uses Supabase for the database. You'll need to create a Supabase project, run the provided SQL scripts in the `supabase_schema.sql` file via the Supabase SQL Editor to set up your tables, and then run the seeder:

```bash
node scripts/seed_db.mjs
```

### 4. Run

**For Windows Users (Recommended):**
Simply double-click the `start-local.bat` file in the project folder. This will automatically install any missing dependencies and start the local development server for you.

**Alternative (Command Line):**
```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** and click **"Sync Data"** to fetch your collection!

---

## 📁 Project Structure

```
ptcgp-tracker/
├── src/
│   ├── app/
│   │   ├── api/                 # API routes handling Supabase interactions
│   │   │   ├── cards/           # GET — read card collection
│   │   │   ├── decks/           # GET — read saved/history decks
│   │   │   ├── generate-deck/   # POST — AI deck generation
│   │   │   ├── simulate-deck/   # POST — AI battle simulation
│   │   │   ├── sync/            # POST — scrape collection
│   │   │   └── sync-meta/       # POST — scrape meta tier list
│   │   ├── page.tsx             # Main application wrapper
│   │   ├── layout.tsx           # Root layout
│   │   └── globals.css          # Global styles & responsive rules
│   ├── components/              # Modular UI components
│   │   ├── modals/              # UI Modals (AI Deck, Card Detail, etc)
│   │   ├── HoloCard.tsx         # 3D holographic card component
│   │   ├── CollectionGrid.tsx   # Collection display grid
│   │   └── ...                  # Navbar, MetaDecksShowcase, etc
│   └── context/
│       └── DeckTrackerContext.tsx # Centralized global state management
├── scripts/
│   ├── seed_db.mjs              # Initialize Supabase with card catalog
│   └── scrapeLimitless.mjs      # Scrape meta deck data
├── supabase_schema.sql          # Supabase database table structures
└── ...
```

---

## 🔑 API Keys Guide

| Provider | Free Tier | Get Your Key |
|----------|-----------|-------------|
| **Google Gemini** | ✅ Generous | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| **Groq** | ✅ Generous | [console.groq.com/keys](https://console.groq.com/keys) |
| **OpenRouter** | 💲 Pay-per-use | [openrouter.ai/keys](https://openrouter.ai/keys) |

---

## 🧪 Testing

Run the end-to-end test suite with mock APIs (no real API keys needed):

```bash
node scratch/e2e-test.mjs
```

This will:
1. Start a dev server with `MOCK_API=true`
2. Launch Puppeteer to navigate the app
3. Test Sync, Meta Sync, AI Deck Generation, and Battle Simulation
4. Report pass/fail for each feature

---

## 📝 Roadmap

- [ ] Deck sharing via public links
- [ ] Card trading suggestions with friends
- [ ] Pack opening probability calculator
- [x] Mobile-responsive UI
- [ ] Full PWA capabilities (offline, installable)
- [ ] Multi-language support

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📚 Acknowledgements & References

This project draws inspiration and ideas from the amazing Pokémon TCG Pocket open-source community. Special thanks to the following repositories:
- **[bcollazo/deckgym-core](https://github.com/bcollazo/deckgym-core)** & **[AngelFireLA/PokemonTCGP-BattleSimulator](https://github.com/AngelFireLA/PokemonTCGP-BattleSimulator)** — For inspiring the architecture of our high-speed client-side battle simulation engine.
- **[daniel-ilett/shaders-holo-card](https://github.com/daniel-ilett/shaders-holo-card)** — For providing excellent references on creating realistic 3D holographic shaders.
- **[flibustier/pokemon-tcg-pocket-database](https://github.com/flibustier/pokemon-tcg-pocket-database)** — For community efforts in maintaining structured JSON datasets.

---

## 📄 License

This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/).

---

<p align="center">
  <sub>
    Pokémon and Pokémon TCG Pocket are registered trademarks of Nintendo, Creatures Inc., and GAME FREAK Inc.<br/>
    This project is unofficial and not affiliated with or endorsed by Nintendo or The Pokémon Company.
  </sub>
</p>
