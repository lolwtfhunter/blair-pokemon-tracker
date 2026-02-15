# Blair TCG Set Tracker

A mobile-friendly web app for tracking trading card collections across multiple TCGs. Supports **Pokemon TCG** and **Disney Lorcana** sets with full variant tracking, cloud sync, card artwork, and advanced filtering. Includes curated custom Pokemon sets for tracking every card featuring a specific Pokemon across all eras, with Japanese-exclusive card support.

**Live app:** Hosted via GitHub Pages — just open `index.html` in any browser.

## Features

### Tab Navigation

The app has three top-level tabs:

- **Pokemon** — Full set tracking with variant checkboxes, progress bars, and card images
- **Custom Sets** — Curated cross-set collections with EN/JP subtabs:
  - "It's Pikachu!" — All 371 Pichu/Pikachu/Raichu cards ever printed (including JP exclusives)
  - "Psyduck" — All 42 Psyduck cards ever printed (including JP exclusives)
  - "Togepi" — All 24 Togepi cards ever printed (including JP exclusives)
- **Disney Lorcana** — Disney Lorcana TCG tracking with card images, progress tracking, and filtering

### Pokemon TCG

- **8 supported sets** spanning Sword & Shield, Scarlet & Violet, and Mega Evolution blocks:

  | Set | Cards | Block | Release |
  |-----|-------|-------|---------|
  | Celebrations | 50 | Sword & Shield | Oct 2021 |
  | Surging Sparks | 252 | Scarlet & Violet | Nov 2024 |
  | Prismatic Evolutions | 180 | Scarlet & Violet | Jan 2025 |
  | Journey Together | 190 | Scarlet & Violet | Mar 2025 |
  | Destined Rivals | 244 | Scarlet & Violet | May 2025 |
  | Mega Evolution | 188 | Mega Evolution | Sep 2025 |
  | Phantasmal Flames | 130 | Mega Evolution | Nov 2025 |
  | Ascended Heroes | 295 | Mega Evolution | Jan 2026 |

- **Hierarchical block-based navigation** — Official sets are organized in a scalable two-level interface:
  - **Level 1:** Block selection buttons (Scarlet & Violet, Mega Evolution, Sword & Shield) with aggregate progress for all sets in each block
  - **Level 2:** Set selection grid appears when block is selected, showing individual sets with official set logos, progress bars, and release dates
  - Blocks can be deselected by clicking again to return to clean slate view
  - No auto-selection - user must explicitly choose block and set
  - Custom sets display as a flat list (no hierarchy needed)
- **Variant tracking** — Check off each variant (Regular, Holo, Reverse Holo, Poke Ball, Master Ball) independently per card. EX, Ultra Rare, and other special rarities use a single "Collected" checkbox. Custom set cards also get computed variants based on rarity, era, and set type (e.g., modern uncommons get Regular + Reverse Holo).
- **Inline progress bars** — Each block and set button shows a progress bar and collected/total count directly inside it, so you can see completion at a glance without a separate section.
- **Filter & search** — Filter cards by completion status (All/Incomplete/Complete) and search by card name or number. Filters and search work together for quick card location.
- **Card detail modal** — Tap any card to open a full-detail view with a large image, complete card information, and the ability to toggle variants directly in the modal.
- **Lazy loading** — Cards render on-demand when you select a set, improving initial page load performance.
- **Soft-lock for completed cards** — When all variants of a card are collected, the card visually fades out (reduced opacity, desaturated image) and shows a lock icon with "Complete" label. Unchecking a variant on a completed card requires confirmation via a toast prompt, preventing accidental taps while scrolling.
- **Card images** — Artwork loads automatically from the [Pokemon TCG API](https://pokemontcg.io/) CDN, with fallback to [TCGdex](https://tcgdex.net/) CDN, then local images, then a styled placeholder.
- **Cloud sync** — Real-time sync across devices via Firebase Realtime Database, protected by a family sync code.
- **Offline support** — Collection progress is saved to localStorage and works without an internet connection.
- **Automated backups** — A GitHub Actions workflow backs up Firebase data to `backups/` on a schedule.

### Disney Lorcana

- **2 supported sets** with full card lists:

  | Set | Cards | Release |
  |-----|-------|---------|
  | The First Chapter | 204 | Aug 2023 |
  | Whispers in the Well | 204 | Nov 2025 |

- **Simple collection tracking** — Single "Collected" checkbox per card (Lorcana uses foil/non-foil variants rather than multiple variant types like Pokemon)
- **Card images** — Artwork loads from [Dreamborn.ink](https://dreamborn.ink/) CDN, with fallback to [Lorcania](https://lorcania.com/) CDN, then local images, then placeholder
- **Filter & search** — Same powerful filtering and search as Pokemon TCG
- **Progress tracking** — Real-time progress bars and completion statistics
- **Cloud sync** — Shares the same Firebase sync as Pokemon, so all your TCG collections sync together

## Project Structure

```
blair-pokemon-tracker/
├── index.html              Main app (single-page, self-contained)
├── data/                   Modular card data (organized by TCG and set)
│   ├── pokemon/
│   │   ├── official-sets/  Official Pokemon TCG sets (JSON per set)
│   │   │   ├── celebrations.json
│   │   │   ├── mega-evolution.json
│   │   │   ├── phantasmal-flames.json
│   │   │   ├── ascended-heroes.json
│   │   │   ├── surging-sparks.json
│   │   │   ├── prismatic-evolutions.json
│   │   │   ├── journey-together.json
│   │   │   └── destined-rivals.json
│   │   └── custom-sets/    Custom curated Pokemon sets
│   │       ├── its-pikachu.json
│   │       ├── psyduck.json
│   │       └── togepi.json
│   └── lorcana/            Disney Lorcana sets
│       └── sets/
│           ├── first-chapter.json
│           └── whispers-in-the-well.json
├── restore.html            Backup restore utility
├── test.html               Test page
├── test-card-data.html     Card data validation page
├── Images/
│   ├── header/             Header banner images (Pikachu, Psyduck, etc.)
│   └── cards/              Local card images organized by set (optional)
│       ├── celebrations/
│       ├── mega-evolution/
│       ├── surging-sparks/
│       ├── prismatic-evolutions/
│       ├── journey-together/
│       ├── destined-rivals/
│       ├── phantasmal-flames/
│       ├── ascended-heroes/
│       └── lorcana/         Lorcana card images (optional)
│           ├── first-chapter/
│           └── whispers-in-the-well/
├── backups/                Automated Firebase backup snapshots
├── .github/workflows/      CI/CD (Firebase backup workflow)
├── PROJECT_MASTER.md       Detailed project documentation
└── RARITY_REFERENCE.md     Rarity types and variant rules reference
```

## How It Works

1. **Open the app** in a browser and enter the family sync code
2. **Choose a tab** — Pokemon TCG (hierarchical), Custom Sets (flat list), or Disney Lorcana
3. **For Pokemon TCG:**
   - **Select a block** — Click Scarlet & Violet, Mega Evolution, or Sword & Shield (shows aggregate progress)
   - Set buttons appear with "Select a Set" header
   - **Select a set** from the grid (shows set logo and progress bar)
   - Cards display for the selected set
   - Click block again to deselect and return to block-only view
4. **For Custom Sets:**
   - Set buttons display directly (no hierarchy)
   - Click a set to view cards
5. **For Disney Lorcana:**
   - Set buttons display directly with release dates
   - Click a set to view cards with artwork from Dreamborn CDN
   - Single "Collected" checkbox per card
6. **Filter or search** to quickly find specific cards
7. **Tap a card** to view full details in a modal with a large image
8. **Check off variants/collected status** as you collect cards — progress saves automatically
9. Completed cards fade out with a lock icon; unchecking requires confirmation
10. Data syncs in real-time to Firebase so all family devices stay up to date

## Card Images

### Pokemon TCG

Card artwork loads through a 4-tier fallback system:

1. **Pokemon TCG API** — `https://images.pokemontcg.io/{set-id}/{number}.png`
2. **TCGdex CDN** — `https://assets.tcgdex.net/en/{series}/{set}/{number}/high.png`
3. **Local images** — `Images/cards/{set-key}/{number}.png` (if you add your own)
4. **Placeholder** — A generated Pokeball SVG with the card number and name

### Disney Lorcana

Card artwork loads through a 3-tier fallback system:

1. **Dreamborn CDN** — `https://cdn.dreamborn.ink/images/en/cards/{dreamborn-id}` (primary source)
2. **Lorcania CDN** — `https://lorcania.com/cards/{set-num}/{card-num}.webp` (secondary)
3. **Local images** — `Images/lorcana/{set-key}/{number}.jpg` (tertiary)
4. **Placeholder** — A generated card back SVG with the card number and name

See [`Images/README.md`](Images/README.md) for details on adding local card images.

## Card Data

Card data is organized in a modular structure by TCG:

### Pokemon (`data/pokemon/`)
- **Official sets** (`data/pokemon/official-sets/`): Each set is a separate JSON file containing card metadata (number, name, rarity, type), set info (total cards, main set size, release date, block), and variant configuration
- **Custom sets** (`data/pokemon/custom-sets/`): Cross-era collections with additional fields like `setOrigin`, `releaseDate`, `apiId`, `originalNumber`, and `region`

Variant eligibility is determined automatically from rarity. Custom set cards compute variants based on rarity, release date (pre/post-2002 reverse holo era), region (JP = single variant), and set type (promos, McDonald's, etc. = single variant). WotC-era holo/non-holo pairs use explicit variant arrays.

### Disney Lorcana (`data/lorcana/`)
- **Sets** (`data/lorcana/sets/`): Each set is a JSON file with card metadata (number, name, rarity, type, dreambornId), set info (total cards, release date), and single-variant tracking
- Lorcana uses simplified collection tracking (single "Collected" checkbox per card) since foil variants are handled differently than Pokemon

**Benefits of modular structure:**
- Faster load times (only loads data for selected sets)
- Easy to add new TCGs (Magic, Yu-Gi-Oh!, etc.)
- Better organization and maintainability
- Supports future scaling

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JavaScript (no build tools, no frameworks)
- **Database:** Firebase Realtime Database for cloud sync
- **Storage:** localStorage for offline/local persistence
- **Images:**
  - Pokemon: Pokemon TCG API CDN (pokemontcg.io), TCGdex CDN (tcgdex.net)
  - Lorcana: Dreamborn CDN (dreamborn.ink), Lorcania CDN (lorcania.com)
- **Hosting:** GitHub Pages
- **CI/CD:** GitHub Actions (automated Firebase backups)

## Developer Documentation

For contributors and maintainers:

- **[ADDING_NEW_SETS.md](ADDING_NEW_SETS.md)** - Step-by-step guide for adding new sets to the tracker
- **[CARD_GAME_LOGIC.md](CARD_GAME_LOGIC.md)** - Comprehensive reference for card game rules, rarities, variants, and logic
- **[PROJECT_MASTER.md](PROJECT_MASTER.md)** - Detailed project documentation and architecture
- **[RARITY_REFERENCE.md](RARITY_REFERENCE.md)** - Quick reference for rarity types and variant rules

## Legal & Attribution

### Pokemon TCG
All Pokemon card names, images, and related content are © Nintendo, Creatures Inc., GAME FREAK inc. This is a fan-made collection tracker and is not affiliated with, endorsed by, or sponsored by Nintendo, The Pokemon Company, or any related entities.

Card images are sourced from:
- [Pokemon TCG API](https://pokemontcg.io/) (pokemontcg.io)
- [TCGdex](https://tcgdex.net/) (tcgdex.net)

### Disney Lorcana
All Disney Lorcana card names, images, and related content are © Disney and Ravensburger. This is a fan-made collection tracker and is not affiliated with, endorsed by, or sponsored by Disney, Ravensburger, or any related entities.

Card data sourced from:
- [great-illuminary/lorcana-data](https://github.com/great-illuminary/lorcana-data) (GitHub repository)

Card images are sourced from:
- [Dreamborn.ink](https://dreamborn.ink/) (dreamborn.ink CDN)
- [Lorcania](https://lorcania.com/) (lorcania.com CDN)

### Third-Party Services
- Firebase Realtime Database © Google LLC
- GitHub Pages hosting © GitHub, Inc.

This project is created for personal collection tracking purposes only and makes no claim to ownership of any trademarked or copyrighted content.
