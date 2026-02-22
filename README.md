# Blair TCG Tracker

A mobile-friendly web app for tracking trading card collections across multiple TCGs with cloud sync, card artwork, variant tracking, and market pricing.

**Live:** [GitHub Pages](https://lolwtfhunter.github.io/blair-tcg-tracker/)

## What's Tracked

| TCG | Sets | Cards | Features |
|-----|------|-------|----------|
| **Pokemon TCG** | 132 official sets across 15 eras | 18,700+ | Variant tracking, hierarchical block navigation |
| **Custom Pokemon** | 3 curated cross-era sets | 437 | EN/JP subtabs, cards spanning all eras |
| **Disney Lorcana** | 11 sets | 2,499 | Single-checkbox tracking, enchanted cards |

### Pokemon TCG Eras (15 Blocks)

Base Set, Gym, Neo, Legendary Collection, e-Card, EX, Diamond & Pearl, Platinum, HeartGold SoulSilver, Black & White, XY, Sun & Moon, Sword & Shield, Scarlet & Violet, Mega Evolution

### Custom Pokemon Sets

- **It's Pikachu!** — 371 Pichu/Pikachu/Raichu cards (including JP exclusives)
- **Psyduck** — 42 Psyduck cards
- **Togepi** — 24 Togepi cards

### Disney Lorcana Sets

The First Chapter, Rise of the Floodborn, Into the Inklands, Ursula's Return, Shimmering Skies, Azurite Sea, Archazia's Island, Reign of Jafar, Fabled, Whispers in the Well, Winterspell

## Features

- **Variant tracking** — Per-card checkboxes for Regular, Holo, Reverse Holo, Poke Ball, Master Ball (computed from rarity/era)
- **Hierarchical navigation** — Block > Set > Cards for Pokemon TCG; flat lists for Custom Sets and Lorcana
- **Card images** — Multi-CDN fallback chains with automatic error recovery
- **Market pricing** — Real-time TCGPlayer prices via TCGCSV with 6hr cache
- **Cloud sync** — Firebase Realtime Database with password protection
- **Offline support** — localStorage persistence works without internet
- **Filter & search** — Completion status, rarity toggles, and text search (all combinable)
- **Card detail modal** — Large image view with variant toggling
- **Soft-lock** — Completed cards fade out; unchecking requires confirmation
- **Lazy loading** — Cards render on-demand per set for fast initial load
- **Automated backups** — GitHub Actions backs up Firebase data on a schedule

## Card Image CDNs

### Pokemon TCG — 5-tier fallback

| Tier | Source | URL Pattern |
|------|--------|------------|
| 1 | pokemontcg.io | `images.pokemontcg.io/{setId}/{number}.png` |
| 2 | Scrydex | `images.scrydex.com/pokemon/{setId}-{number}/large` |
| 3 | TCGdex | `assets.tcgdex.net/en/{series}/{set}/{number}/high.png` |
| 4 | Local | `Images/cards/{setKey}/{number}.png` |
| 5 | Placeholder | Generated SVG with card name and number |

**Note:** Some sets (e.g., `me2pt5`, `mep`) return fake 200 responses from pokemontcg.io with a placeholder image. These are listed in `SCRYDEX_PRIMARY_SETS` in `js/image-utils.js` and use Scrydex as the primary source instead.

### Disney Lorcana — 4-tier fallback

| Tier | Source | URL Pattern |
|------|--------|------------|
| 1 | Dreamborn | `cdn.dreamborn.ink/images/en/cards/{dreambornId}` |
| 2 | Lorcast API | Fetched and cached from `api.lorcast.com` |
| 3 | Local | `Images/lorcana/{setKey}/{number}.jpg` |
| 4 | Placeholder | Generated SVG card back |

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JavaScript (no frameworks, no build tools)
- **Database:** Firebase Realtime Database
- **Storage:** localStorage for offline persistence
- **Images:** pokemontcg.io, Scrydex, TCGdex, Dreamborn, Lorcast
- **Pricing:** TCGCSV (CDN-backed TCGPlayer data)
- **Hosting:** GitHub Pages
- **Testing:** Playwright (Chromium desktop + mobile locally; WebKit iphone/iPad locally)
- **CI/CD:** GitHub Actions (chromium-only for speed; full browser matrix runs locally)

## Project Structure

```
blair-tcg-tracker/
├── index.html                 Main app (single-page)
├── js/                        JavaScript modules
│   ├── config.js              Set IDs, CDN mappings, pricing group IDs
│   ├── image-utils.js         Image URL builders, CDN fallback, SCRYDEX_PRIMARY_SETS
│   ├── pokemon-tcg.js         Block/set navigation, card rendering
│   ├── custom-sets.js         Custom set UI and variant logic
│   ├── lorcana.js             Lorcana set rendering and image handling
│   ├── data-loader.js         JSON data loading for all TCGs
│   ├── pricing.js             TCGCSV price fetching and caching
│   └── ...
├── data/
│   ├── pokemon/
│   │   ├── official-sets/     132 official set JSON files
│   │   └── custom-sets/       3 curated cross-era sets
│   └── lorcana/
│       └── sets/              11 Lorcana set JSON files
├── tests/                     Playwright test suite (58 tests × 4 browser projects)
├── docs/                      Reference documentation
│   ├── ADDING_NEW_SETS.md     Guide for adding new sets or TCGs
│   ├── CARD_GAME_LOGIC.md     Rarity, variant, and image URL reference
│   ├── PROJECT_MASTER.md      Detailed architecture and history
│   ├── RARITY_REFERENCE.md    Rarity types and variant rules
│   └── LORCANA_VARIANTS.md    Lorcana variant reference
├── Images/                    Local card images and logos
│   ├── header/logo.svg        Site logo (SVG 1.1 — see Images/README.md)
├── backups/                   Automated Firebase backup snapshots
├── .github/workflows/         CI/CD (backups, test runner)
├── playwright.config.js       Test configuration
└── package.json               Dev dependencies (Playwright only)
```

## Development

### Running Tests

```bash
npm install                     # first time — installs Playwright
npx playwright install          # first time — downloads browsers
npm test                        # run all tests headless (232 locally, 116 on CI)
npm run test:headed             # run with visible browser
npm run test:ui                 # interactive Playwright UI
```

Tests auto-start a local server. All tests block external network requests and serve static files directly from disk (bypassing HTTP) for fast, isolated execution.

### Test Coverage (58 tests × 4 browser projects = 232 locally)

| File | Tests | Covers |
|------|-------|--------|
| `auth.spec.js` | 5 | Auth modal, login/logout UI |
| `navigation.spec.js` | 14 | Tab switching, block/set selection, mobile hide/show |
| `card-rendering.spec.js` | 2 | Card rendering, metadata, variants |
| `filters.spec.js` | 3 | Completion filters, rarity toggles, search |
| `modal.spec.js` | 11 | Card detail modal, navigation, variant toggle |
| `collection.spec.js` | 3 | Variant toggle, progress, soft-lock |
| `persistence.spec.js` | 1 | localStorage across reload |
| `pricing.spec.js` | 7 | Price tags, caching, modal prices |
| `lorcana-filters.spec.js` | 2 | Lorcana card toggle, filters |
| `custom-set-editor.spec.js` | 10 | Custom set CRUD, editor modal |

Shared test utilities live in `tests/helpers.js` (route handling, page setup, navigation).

### Browser Matrix

| Project | Engine | Viewport | Runs on CI | Runs locally |
|---------|--------|----------|------------|--------------|
| chromium-desktop | Chromium | 1280×720 | Yes | Yes |
| chromium-mobile | Chromium | 412×839 (Pixel 7) | Yes | Yes |
| iphone-12 | WebKit | 390×844 | No (too slow) | Yes |
| ipad | WebKit | 810×1080 | No (too slow) | Yes |

CI runs 116 tests (chromium desktop + mobile) in ~6 minutes. Locally, all 232 tests (including WebKit) run in ~1 minute.

### Adding New Sets

See [docs/ADDING_NEW_SETS.md](docs/ADDING_NEW_SETS.md) for the complete guide. Key data sources:

- **pokemontcg.io API** — Primary for most English sets
- **TCGdex API** — Best fallback when pokemontcg.io doesn't have the set yet
- **PokeBeach / Serebii** — Set guides and card lists
- **Pokemon.com** — Official source of truth

### Key Configuration Files

| File | What to edit |
|------|-------------|
| `js/config.js` | `OFFICIAL_SETS`, `TCG_API_SET_IDS`, `TCGDEX_SET_IDS`, `TCGCSV_*_GROUP_IDS` |
| `js/image-utils.js` | `SCRYDEX_PRIMARY_SETS` (for sets broken on pokemontcg.io) |
| `js/pokemon-tcg.js` | `BLOCK_LOGO_SET_IDS`, `BLOCK_THEME_COLORS` |

## Documentation

- **[ADDING_NEW_SETS.md](docs/ADDING_NEW_SETS.md)** — Step-by-step for adding sets, data sources, troubleshooting
- **[CARD_GAME_LOGIC.md](docs/CARD_GAME_LOGIC.md)** — Card schemas, rarity rules, variant logic, image URL mapping
- **[PROJECT_MASTER.md](docs/PROJECT_MASTER.md)** — Full architecture, pricing system, version history
- **[RARITY_REFERENCE.md](docs/RARITY_REFERENCE.md)** — Quick rarity and variant rules reference
- **[LORCANA_VARIANTS.md](docs/LORCANA_VARIANTS.md)** — Lorcana-specific rarity and variant guide

## Legal

All Pokemon content is (c) Nintendo, Creatures Inc., GAME FREAK inc. All Disney Lorcana content is (c) Disney and Ravensburger. This is a fan-made collection tracker, not affiliated with any rights holders.

Card images sourced from [pokemontcg.io](https://pokemontcg.io/), [Scrydex](https://images.scrydex.com/), [TCGdex](https://tcgdex.net/), [Dreamborn.ink](https://dreamborn.ink/), and [Lorcast](https://api.lorcast.com/). Card data from [great-illuminary/lorcana-data](https://github.com/great-illuminary/lorcana-data). Set logos from [Mushu Report Wiki](https://wiki.mushureport.com/) and [Lorcana Wiki](https://lorcana.fandom.com/).
