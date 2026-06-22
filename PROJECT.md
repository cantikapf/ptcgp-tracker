# Project: Pokemon TCG Pocket Tracker CDN Fallback

## Architecture
- **Framework**: Next.js (TypeScript, React 19)
- **Database**: SQLite (`ptcgp_tracker.sqlite`) storing card collection details (including card `id`, `name`, and `imageUrl`).
- **Proxy Server**: `/api/proxy-image` (`src/app/api/proxy-image/route.ts`) proxies requests to `assets.pokemon-zone.com`.
- **UI Components**:
  - `HoloCard` (`src/components/HoloCard.tsx`) handles image rendering, mouse-over holographic effects, and error boundary fallbacks (`onError`).
  - `CardDetailModal` and `MetaDeckDetailModal` render cards using `HoloCard`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Exploration & Analysis | Investigate the image proxy failure (403), check database card list, research alternative CDNs/APIs (like Chase Manning's or Pokemon Zone URLs), and check local visual placeholder availability. | None | IN_PROGRESS |
| 2 | Implementation | Implement robust URL resolving, proxy improvements, custom headers (e.g. bypassing 403 if possible), and clean card-back placeholder fallbacks. | M1 | PLANNED |
| 3 | Verification & E2E Testing | Build test scenarios verifying Pikachu ex, Potion, Poké Ball, and X Speed display correct images or placeholders without 403/404 console errors. Run builds and lint. | M2 | PLANNED |

## Code Layout
- `src/app/api/proxy-image/route.ts` - Server-side image proxy
- `src/components/HoloCard.tsx` - Card rendering component with fallback error handling
- `data/raw/card-data.json` - Raw database source containing card image properties
- `public/` - Directory for local static assets (potential home for local visual placeholders)

## Interface Contracts
- `/api/proxy-image?url=...`
  - Input: URL query param (URL to fetch)
  - Output: Proxied image binary with appropriate Content-Type or failure status
- `HoloCardProps`:
  - `id`: string
  - `name`: string
  - `imageUrl`: string
  - `quantity`: number
  - `rarity`: string
