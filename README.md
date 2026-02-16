# Blair TCG Tracker

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
  - Custom sets display as a flat list (no hierarchy needed), also with no auto-selection
- **Variant tracking** — Check off each variant (Regular, Holo, Reverse Holo, Poke Ball, Master Ball) independently per card. EX, Ultra Rare, and other special rarities use a single "Collected" checkbox. Custom set cards also get computed variants based on rarity, era, and set type (e.g., modern uncommons get Regular + Reverse Holo).
- **Inline progress bars** — Each block and set button shows a progress bar and collected/total count directly inside it, so you can see completion at a glance without a separate section.
- **Filter & search** — Filter cards by completion status (All/Incomplete/Complete), toggle rarity filter buttons to show specific rarities, and search by card name or number. All three filters work together for quick card location.
- **Card detail modal** — Tap any card to open a full-detail view with a large image, complete card information, and the ability to toggle variants directly in the modal.
- **Lazy loading** — Cards render on-demand when you select a set, improving initial page load performance.
- **Soft-lock for completed cards** — When all variants of a card are collected, the card visually fades out (reduced opacity, desaturated image) and shows a lock icon with "Complete" label. Unchecking a variant on a completed card requires confirmation via a toast prompt, preventing accidental taps while scrolling.
- **Card images** — Artwork loads automatically from the [Pokemon TCG API](https://pokemontcg.io/) CDN, with fallback to [TCGdex](https://tcgdex.net/) CDN, then local images, then a styled placeholder.
- **Cloud sync** — Real-time sync across devices via Firebase Realtime Database, protected by a family sync code.
- **Offline support** — Collection progress is saved to localStorage and works without an internet connection.
- **Automated backups** — A GitHub Actions workflow backs up Firebase data to `backups/` on a schedule.

### Disney Lorcana

- **11 supported sets** spanning all released Lorcana chapters:

  | Set | Cards | Release |
  |-----|-------|---------|
  | The First Chapter | 216 | Aug 2023 |
  | Rise of the Floodborn | 216 | Nov 2023 |
  | Into the Inklands | 223 | Feb 2024 |
  | Ursula's Return | 225 | May 2024 |
  | Shimmering Skies | 223 | Aug 2024 |
  | Azurite Sea | 222 | Nov 2024 |
  | Archazia's Island | 224 | Mar 2025 |
  | Reign of Jafar | 224 | May 2025 |
  | Fabled | 242 | Aug 2025 |
  | Whispers in the Well | 242 | Nov 2025 |
  | Winterspell | 242 | Feb 2026 |

- **Simple collection tracking** — Single "Collected" checkbox per card (Lorcana uses foil/non-foil variants rather than multiple variant types like Pokemon)
- **Set logos** — Official set logos load automatically from public wiki sources ([Mushu Report](https://wiki.mushureport.com/), [Lorcana Wiki](https://lorcana.fandom.com/)), with cascading fallback to local files and inline SVG
- **Card images** — Artwork loads from [Dreamborn.ink](https://dreamborn.ink/) CDN, with fallback to [Lorcast API](https://api.lorcast.com/), then local images, then placeholder
- **Filter & search** — Same powerful filtering as Pokemon TCG, including rarity toggle buttons with Lorcana-specific rarity names
- **Progress tracking** — Real-time progress bars and completion statistics
- **Cloud sync** — Shares the same Firebase sync as Pokemon, so all your TCG collections sync together
- **Includes enchanted cards** — Secret rare cards with alternate art and special foiling (cards 205+ in each set)

For detailed information about Lorcana's rarity system and card variants, see [LORCANA_VARIANTS.md](LORCANA_VARIANTS.md).

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
│   └── lorcana/            Disney Lorcana sets (11 sets)
│       └── sets/
│           ├── first-chapter.json
│           ├── rise-of-the-floodborn.json
│           ├── into-the-inklands.json
│           ├── ursulas-return.json
│           ├── shimmering-skies.json
│           ├── azurite-sea.json
│           ├── archazias-island.json
│           ├── reign-of-jafar.json
│           ├── fabled.json
│           ├── whispers-in-the-well.json
│           └── winterspell.json
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
│           ├── rise-of-the-floodborn/
│           ├── into-the-inklands/
│           ├── ursulas-return/
│           ├── shimmering-skies/
│           ├── azurite-sea/
│           ├── archazias-island/
│           ├── reign-of-jafar/
│           ├── fabled/
│           ├── whispers-in-the-well/
│           ├── winterspell/
│           └── logos/          Set logos (optional, CDN fallback exists)
├── tests/                  Playwright test suite (18 tests × 4 browsers)
│   ├── navigation.spec.js
│   ├── card-rendering.spec.js
│   ├── filters.spec.js
│   ├── modal.spec.js
│   ├── collection.spec.js
│   └── persistence.spec.js
├── backups/                Automated Firebase backup snapshots
├── .github/workflows/      CI/CD (Firebase backup, Playwright test CI)
├── package.json            Dev dependencies (Playwright only)
├── playwright.config.js    Test configuration
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
6. **Filter, toggle rarities, or search** to quickly find specific cards
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

**Set logos** load through a 4-tier fallback system:

1. **Local file** — `Images/lorcana/logos/{set-key}.png` (if you add your own)
2. **Mushu Report wiki** — `wiki.mushureport.com/wiki/Special:FilePath/{SetName}_logo.png`
3. **Lorcana Fandom wiki** — `lorcana.fandom.com/wiki/Special:FilePath/{SetName}_Logo.png`
4. **Inline SVG** — A generated Lorcana-themed hexagon with set-specific color and Roman numeral

**Card artwork** loads through a 4-tier fallback system:

1. **Dreamborn CDN** — `https://cdn.dreamborn.ink/images/en/cards/{dreamborn-id}` (extensionless URL, serves JFIF/JPEG)
2. **Lorcast API** — Card image URLs fetched from `https://api.lorcast.com/` and cached (non-blocking background fetch)
3. **Local images** — `Images/lorcana/{set-key}/{number}.jpg` (if you add your own)
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
  - Lorcana: Dreamborn CDN (dreamborn.ink), Lorcast API (api.lorcast.com)
- **Hosting:** GitHub Pages
- **CI/CD:** GitHub Actions (automated Firebase backups, Playwright test CI)
- **Testing:** Playwright (Chromium + WebKit, desktop + mobile viewports)

## Development & Testing

### Branch Workflow

- **`dev`** — Development and staging branch. Push changes here first.
- **`main`** — Production branch. Deployed to GitHub Pages. Merge from `dev` after tests pass.

### Running Tests Locally

```bash
npm install                     # first time only — installs Playwright
npx playwright install          # first time only — downloads browser binaries
npm test                        # run all tests headless (Chromium + WebKit, desktop + mobile)
npm run test:headed             # run tests with visible browser windows
npm run test:ui                 # open interactive Playwright UI
npm run test:report             # open the HTML test report
```

Tests auto-start a local server (`python3 -m http.server 8080`), so no manual setup is needed.

### CI (GitHub Actions)

Pushing to `dev` automatically runs the full Playwright test suite via GitHub Actions. The workflow:
1. Installs Chromium + WebKit browsers
2. Runs all tests
3. Uploads the HTML report as a downloadable artifact

### Test Coverage

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `navigation.spec.js` | 4 | Tab switching, block/set selection, deselect behavior |
| `card-rendering.spec.js` | 2 | Cards render on set select, metadata, variants |
| `filters.spec.js` | 3 | All/Incomplete/Complete filters, rarity toggles, search |
| `modal.spec.js` | 5 | Open/close modal, card details, variant toggling |
| `collection.spec.js` | 3 | Variant toggle, progress bar update, soft-lock toast |
| `persistence.spec.js` | 1 | localStorage save/restore across reload |

### Test Infrastructure — Production Data Safety

> **Tests MUST NEVER read, write, or impact production user data.** Every test file uses a catch-all `page.route()` that blocks ALL non-localhost HTTP requests, preventing Firebase sync from reaching production. This route block must be applied before any page navigation. See `PROJECT_MASTER.md` for full details and rules for test authors.

### Maintaining Tests

When making changes to the app, keep the test suite up to date:

- **Adding a new set** to an existing TCG — no test changes needed (existing tests cover sets generically)
- **Adding a new TCG, tab, filter, or interactive feature** — add or update tests in `tests/`
- **Changing selectors or navigation flow** — update affected test selectors/assertions
- **Removing a feature** — remove or update the corresponding tests

All new/modified test files must include the catch-all network isolation pattern before any `page.goto()`. See existing specs for the template. After changes, run `npm test` to verify all tests pass, and update the test count tables in this file and `PROJECT_MASTER.md` if tests were added or removed.

### Promoting to Production

```bash
git checkout main && git merge dev && git push origin main
```

## Developer Documentation

For contributors and maintainers:

- **[ADDING_NEW_SETS.md](ADDING_NEW_SETS.md)** - Step-by-step guide for adding new sets to the tracker
- **[CARD_GAME_LOGIC.md](CARD_GAME_LOGIC.md)** - Comprehensive reference for card game rules, rarities, variants, and logic
- **[PROJECT_MASTER.md](PROJECT_MASTER.md)** - Detailed project documentation and architecture
- **[RARITY_REFERENCE.md](RARITY_REFERENCE.md)** - Quick reference for rarity types and variant rules
- **[LORCANA_VARIANTS.md](LORCANA_VARIANTS.md)** - Disney Lorcana variant and rarity reference guide

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

Card images sourced from:
- [Dreamborn.ink](https://dreamborn.ink/) (dreamborn.ink CDN)
- [Lorcast API](https://api.lorcast.com/) (lorcast.com API)
- [Lorcania](https://lorcania.com/) (lorcania.com CDN)

Set logos sourced from:
- [Mushu Report Wiki](https://wiki.mushureport.com/) (community Lorcana wiki)
- [Lorcana Wiki on Fandom](https://lorcana.fandom.com/) (Fandom wiki)

### Third-Party Services
- Firebase Realtime Database © Google LLC
- GitHub Pages hosting © GitHub, Inc.

This project is created for personal collection tracking purposes only and makes no claim to ownership of any trademarked or copyrighted content.
