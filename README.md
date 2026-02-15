# Blair TCG Set Tracker

A mobile-friendly web app for tracking trading card collections. Currently supports Pokemon TCG sets with full variant tracking, cloud sync, card artwork, and advanced filtering. Custom sets and Disney Lorcana tabs are planned for future releases.

**Live app:** Hosted via GitHub Pages — just open `index.html` in any browser.

## Features

### Tab Navigation

The app has three top-level tabs:

- **Pokemon** — Full set tracking with variant checkboxes, progress bars, and card images
- **Custom Sets** — Curated cross-set collections:
  - "It's Pikachu!" — All 362 Pichu/Pikachu/Raichu cards ever printed (including JP exclusives)
  - "Psyduck" — All 38 Psyduck cards ever printed
  - "Togepi" — All 17 Togepi cards ever printed
- **Disney Lorcana** — Placeholder for Disney Lorcana card tracking (coming soon)

### Pokemon TCG

- **7 supported sets** spanning Sword & Shield, Scarlet & Violet, and Mega Evolution blocks:

  | Set | Cards | Block | Release |
  |-----|-------|-------|---------|
  | Celebrations | 50 | Sword & Shield | Oct 2021 |
  | Surging Sparks | 252 | Scarlet & Violet | Nov 2024 |
  | Prismatic Evolutions | 180 | Scarlet & Violet | Jan 2025 |
  | Journey Together | 190 | Scarlet & Violet | Mar 2025 |
  | Destined Rivals | 244 | Scarlet & Violet | May 2025 |
  | Phantasmal Flames | 130 | Mega Evolution | Nov 2025 |
  | Ascended Heroes | 295 | Mega Evolution | Jan 2026 |

- **Variant tracking** — Check off each variant (Regular, Holo, Reverse Holo, Poke Ball, Master Ball) independently per card. EX, Ultra Rare, and other special rarities use a single "Collected" checkbox.
- **Inline progress bars** — Each set button shows a progress bar and collected/total count directly inside it, so you can see completion at a glance without a separate section.
- **Filter & search** — Filter cards by completion status (All/Incomplete/Complete) and search by card name or number. Filters and search work together for quick card location.
- **Card detail modal** — Tap any card to open a full-detail view with a large image, complete card information, and the ability to toggle variants directly in the modal.
- **Lazy loading** — Cards render on-demand when you select a set, improving initial page load performance.
- **Soft-lock for completed cards** — When all variants of a card are collected, the card visually fades out (reduced opacity, desaturated image) and shows a lock icon with "Complete" label. Unchecking a variant on a completed card requires confirmation via a toast prompt, preventing accidental taps while scrolling.
- **Card images** — Artwork loads automatically from the [Pokemon TCG API](https://pokemontcg.io/) CDN, with fallback to [TCGdex](https://tcgdex.net/) CDN, then local images, then a styled placeholder.
- **Cloud sync** — Real-time sync across devices via Firebase Realtime Database, protected by a family sync code.
- **Offline support** — Collection progress is saved to localStorage and works without an internet connection.
- **Automated backups** — A GitHub Actions workflow backs up Firebase data to `backups/` on a schedule.

## Project Structure

```
blair-pokemon-tracker/
├── index.html              Main app (single-page, self-contained)
├── card-data.json          Card database (names, rarities, types for all sets)
├── custom-sets-data.json   Custom set definitions (cross-set collections)
├── restore.html            Backup restore utility
├── test.html               Test page
├── test-card-data.html     Card data validation page
├── Images/
│   ├── header/             Header banner images (Pikachu, Psyduck, etc.)
│   └── cards/              Local card images organized by set (optional)
│       ├── celebrations/
│       ├── surging-sparks/
│       ├── prismatic-evolutions/
│       ├── journey-together/
│       ├── destined-rivals/
│       ├── phantasmal-flames/
│       └── ascended-heroes/
├── backups/                Automated Firebase backup snapshots
├── .github/workflows/      CI/CD (Firebase backup workflow)
├── PROJECT_MASTER.md       Detailed project documentation
└── RARITY_REFERENCE.md     Rarity types and variant rules reference
```

## How It Works

1. **Open the app** in a browser and enter the family sync code
2. **Choose a tab** — Pokemon, Custom Sets, or Disney Lorcana
3. **Select a set** from the buttons (each shows its progress bar inline)
4. **Filter or search** to quickly find specific cards
5. **Tap a card** to view full details in a modal with a large image
6. **Check off variants** as you collect cards — progress saves automatically
7. Completed cards fade out with a lock icon; unchecking requires confirmation
8. Data syncs in real-time to Firebase so all family devices stay up to date

## Card Images

Card artwork loads through a 4-tier fallback system:

1. **Pokemon TCG API** — `https://images.pokemontcg.io/{set-id}/{number}.png`
2. **TCGdex CDN** — `https://assets.tcgdex.net/en/{series}/{set}/{number}/high.png`
3. **Local images** — `Images/cards/{set-key}/{number}.png` (if you add your own)
4. **Placeholder** — A generated Pokeball SVG with the card number and name

See [`Images/README.md`](Images/README.md) for details on adding local card images.

## Card Data

All card data lives in `card-data.json`. Each set contains:
- Card number, name, rarity, and type (pokemon/trainer/energy)
- Set metadata (total cards, main set size, release date, block info)
- Variant eligibility is determined automatically from rarity

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JavaScript (no build tools, no frameworks)
- **Database:** Firebase Realtime Database for cloud sync
- **Storage:** localStorage for offline/local persistence
- **Images:** Pokemon TCG API CDN (pokemontcg.io), TCGdex CDN (tcgdex.net)
- **Hosting:** GitHub Pages
- **CI/CD:** GitHub Actions (automated Firebase backups)
