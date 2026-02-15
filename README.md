# Blair Pokemon TCG Tracker

A mobile-friendly web app for tracking Pokemon Trading Card Game collections across multiple sets, including all card variants (Regular, Holo, Reverse Holo, Poke Ball, Master Ball).

**Live app:** Hosted via GitHub Pages — just open `index.html` in any browser.

## Features

- **5 supported sets** spanning Scarlet & Violet and Mega Evolution blocks:
  | Set | Cards | Block | Release |
  |-----|-------|-------|---------|
  | Prismatic Evolutions | 180 | Scarlet & Violet | Jan 2025 |
  | Journey Together | 190 | Scarlet & Violet | Mar 2025 |
  | Destined Rivals | 244 | Scarlet & Violet | May 2025 |
  | Phantasmal Flames | 130 | Mega Evolution | Nov 2025 |
  | Ascended Heroes | 295 | Mega Evolution | Jan 2026 |

- **Variant tracking** — Check off each variant (Regular, Holo, Reverse Holo, Poke Ball, Master Ball) independently per card. EX, Ultra Rare, and other special rarities use a single "Collected" checkbox.
- **Card images** — Artwork loads automatically from the [Pokemon TCG API](https://pokemontcg.io/) CDN. Falls back to local images in `Images/cards/`, then to a styled placeholder if neither is available.
- **Cloud sync** — Real-time sync across devices via Firebase Realtime Database, protected by a family sync code.
- **Offline support** — Collection progress is saved to localStorage and works without an internet connection.
- **Progress tracking** — Visual progress bars showing collected vs. total variants for each set.
- **Automated backups** — A GitHub Actions workflow backs up Firebase data to `backups/` on a schedule.

## Project Structure

```
blair-pokemon-tracker/
├── index.html              Main app (single-page, self-contained)
├── card-data.json          Card database (names, rarities, types for all sets)
├── restore.html            Backup restore utility
├── test.html               Test page
├── test-card-data.html     Card data validation page
├── Images/
│   ├── header/             Header banner images (Pikachu, Psyduck, etc.)
│   └── cards/              Local card images organized by set (optional)
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
2. **Select a set** from the buttons at the top
3. **Check off variants** as you collect cards — progress saves automatically
4. Data syncs in real-time to Firebase so all family devices stay up to date

## Card Images

Card artwork loads through a 3-tier fallback system:

1. **Pokemon TCG API** — `https://images.pokemontcg.io/{set-id}/{number}.png` (no API key required)
2. **Local images** — `Images/cards/{set-key}/{number}.png` (if you add your own)
3. **Placeholder** — A generated Pokeball SVG with the card number and name

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
- **Images:** Pokemon TCG API CDN (pokemontcg.io)
- **Hosting:** GitHub Pages
- **CI/CD:** GitHub Actions (automated Firebase backups)
