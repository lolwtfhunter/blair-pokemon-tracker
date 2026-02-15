# Card Game Logic & Rules Reference

This document defines the structure, rules, and logic for how card games (primarily Pokemon TCG) are implemented in the Blair TCG Tracker.

---

## Table of Contents

1. [Set Structure](#set-structure)
2. [Rarity Types](#rarity-types)
3. [Card Types](#card-types)
4. [Variant Logic](#variant-logic)
5. [Image URL Mapping](#image-url-mapping)
6. [Search & Filtering](#search--filtering)
7. [TCGPlayer URL Generation](#tcgplayer-url-generation)
8. [Block Codes](#block-codes)
9. [Examples](#examples)

---

## Set Structure

All sets follow a standardized JSON structure with required and optional fields.

### Official Pokemon TCG Set Schema

```json
{
  "version": "3.0.0",              // Required: Data format version
  "lastUpdated": "YYYY-MM-DD",     // Required: Last update date
  "setKey": "string",              // Required: Unique lowercase-hyphenated identifier
  "name": "string",                // Required: Official set name
  "displayName": "string",         // Required: Display name (can match name)
  "totalCards": number,            // Required: Total cards including secrets
  "mainSet": number,               // Required: Main set size (before secret rares)
  "setCode": "string",             // Required: Official set code (e.g., "sv11", "me1")
  "hasPokeBallVariant": boolean,   // Required: Whether set has Poke Ball variants
  "hasMasterBallVariant": boolean, // Required: Whether set has Master Ball variants
  "singleVariantOnly": boolean,    // Optional: All cards single variant (default: false)
  "releaseDate": "YYYY-MM-DD",     // Optional: Official release date
  "block": "string",               // Optional: Block name (e.g., "Scarlet & Violet")
  "blockCode": "string",           // Optional: Block code (e.g., "sv", "me")
  "cards": {                       // Required: Card data object
    "1": {
      "name": "string",            // Required: Card name
      "rarity": "string",          // Required: Rarity code (see Rarity Types)
      "type": "string",            // Required: Card type (pokemon/trainer/energy)
      "imageId": "string"          // Optional: Override image ID for special cases
    }
    // ... more cards
  }
}
```

### Custom Pokemon Set Schema

```json
{
  "version": "1.1.0",              // Required: Data format version
  "lastUpdated": "YYYY-MM-DD",     // Required: Last update date
  "setKey": "string",              // Required: Unique identifier
  "name": "string",                // Required: Set name
  "displayName": "string",         // Required: Display name
  "description": "string",         // Required: Set description
  "totalCards": number,            // Required: Total number of cards
  "singleVariantOnly": boolean,    // Optional: Force single variant (default: true)
  "pokemon": ["string"],           // Optional: List of Pokemon featured
  "cards": {                       // Required: Card data object
    "1": {
      "name": "string",            // Required: Card name
      "rarity": "string",          // Required: Rarity code
      "type": "string",            // Required: Card type
      "setOrigin": "string",       // Required: Original set name and year
      "originalNumber": "string",  // Optional: Original card number in set
      "releaseDate": "YYYY/MM/DD", // Required: Original release date
      "apiId": "string",           // Optional: Pokemon TCG API ID (e.g., "base1-58")
      "region": "string",          // Required: Region (EN/JP)
      "variants": [                // Optional: Explicit variant definitions
        {
          "rarity": "holo",
          "name": "Holo variant"
        },
        {
          "rarity": "non-holo",
          "name": "Non-holo variant"
        }
      ]
    }
    // ... more cards
  }
}
```

---

## Rarity Types

All valid rarity codes and their meanings:

### Standard Rarities

| Rarity Code | Display Name | Description |
|-------------|--------------|-------------|
| `common` | COMMON | Common cards |
| `uncommon` | UNCOMMON | Uncommon cards |
| `rare` | RARE | Standard rare cards (holo/non-holo) |
| `rare-holo` | RARE HOLO | Rare holofoil cards |
| `rare-holo-gx` | HOLO GX | GX holofoil cards |
| `rare-holo-ex` | HOLO EX | EX holofoil cards |

### Ultra Rarities (Single Variant)

These rarities always use a single "Collected" checkbox:

| Rarity Code | Display Name | Description |
|-------------|--------------|-------------|
| `ex` | EX | Modern ex cards |
| `ultra-rare` | ULTRA RARE | Ultra rare cards |
| `illustration-rare` | ILLUSTRATION RARE | Illustration rare (alt art) |
| `special-illustration-rare` | SPECIAL ILLUSTRATION RARE | Special illustration rare |
| `hyper-rare` | HYPER RARE | Hyper rare (rainbow/gold) |
| `double-rare` | DOUBLE RARE | Double rare cards |
| `shiny-rare` | SHINY RARE | Shiny rare cards |
| `shiny-ultra-rare` | SHINY ULTRA RARE | Shiny ultra rare cards |
| `trainer-gallery` | TRAINER GALLERY | Trainer Gallery subset |

### Special Rarities

| Rarity Code | Display Name | Description |
|-------------|--------------|-------------|
| `promo` | PROMO | Promotional cards |
| `secret` | SECRET | Secret rare cards |
| `amazing-rare` | AMAZING RARE | Amazing Rare cards |
| `radiant-rare` | RADIANT RARE | Radiant Rare cards |

---

## Card Types

Three primary card types:

| Type Code | Description | Example |
|-----------|-------------|---------|
| `pokemon` | Pokemon cards | Pikachu, Charizard ex |
| `trainer` | Trainer cards | Professor's Research, Ultra Ball |
| `energy` | Energy cards | Fire Energy, Double Colorless Energy |

**Usage:**
- Determines card styling and icon display
- Affects variant calculations (trainers in Prismatic Evolutions get 3 variants)
- Used in filtering and searching

---

## Variant Logic

Variants are the different printings/versions of a card that can be collected.

### Variant Types

| Variant Code | Icon | Label | Description |
|--------------|------|-------|-------------|
| `single` | ✓ | Collected | Single checkbox for cards with no variants |
| `regular` | 📄 | Regular | Standard non-holo version |
| `holo` | ⭐ | Holo | Holofoil version |
| `reverse-holo` | 🔄 | Reverse Holo | Reverse holofoil version |
| `pokeball` | ⚾ | Poké Ball | Poke Ball variant (Prismatic Evolutions) |
| `masterball` | 🏀 | Master Ball | Master Ball variant (Prismatic Evolutions) |

### Official Set Variant Rules

The `getVariants(card, setKey)` function determines variants based on these rules (in order):

#### 1. Single Variant Sets
```javascript
if (setData.singleVariantOnly) return ['single'];
```
**Examples:** Celebrations

#### 2. Single Variant Rarities
```javascript
const SINGLE_VARIANT_RARITIES = [
    'ex', 'ultra-rare', 'illustration-rare', 'special-illustration-rare',
    'hyper-rare', 'double-rare', 'shiny-rare', 'shiny-ultra-rare',
    'amazing-rare', 'radiant-rare', 'trainer-gallery', 'rare-holo-gx',
    'rare-holo-ex', 'secret'
];

if (SINGLE_VARIANT_RARITIES.includes(rarity)) return ['single'];
```

#### 3. Rare Cards
```javascript
if (rarity === 'rare') {
    // Prismatic Evolutions special case
    if (setKey === 'prismatic-evolutions' && card.type !== 'trainer') {
        return ['holo', 'reverse-holo', 'pokeball', 'masterball'];
    }
    return ['holo', 'reverse-holo'];
}
```

#### 4. Prismatic Evolutions Special Variants
```javascript
if (setKey === 'prismatic-evolutions') {
    if (card.type === 'trainer') {
        return ['regular', 'reverse-holo', 'pokeball'];  // 3 variants
    }
    return ['regular', 'reverse-holo', 'pokeball', 'masterball'];  // 4 variants
}
```

#### 5. Default (Common/Uncommon/Other)
```javascript
return ['regular', 'reverse-holo'];  // 2 variants
```

### Custom Set Variant Rules

The `getCustomCardVariants(card)` function uses more complex logic:

#### 1. Explicit Variants (WotC Era)
```javascript
if (card.variants && Array.isArray(card.variants)) {
    return card.variants.map(v => v.rarity);
}
```
**Used for:** WotC-era cards with explicit holo/non-holo pairs

#### 2. Japanese Cards
```javascript
if (card.region === 'JP') return ['single'];
```
**Reason:** Japanese cards typically don't have reverse holos

#### 3. Single Variant Rarities
```javascript
if (SINGLE_VARIANT_RARITIES.includes(rarity)) return ['single'];
```

#### 4. Special Rarities
```javascript
if (['rare-holo', 'rare-holo-gx', 'rare-holo-ex', 'energy'].includes(rarity)) {
    return ['single'];
}
```

#### 5. Pre-Reverse Holo Era
```javascript
if (card.releaseDate && card.releaseDate < '2002/06') {
    return ['single'];
}
```
**Note:** Reverse holos were introduced in Legendary Collection (June 2002)

#### 6. Special Set Types (Single Variant)
```javascript
const singleVariantSets = [
    'McDonald', 'McDonalds', 'Promo', 'Vending', 'Web',
    'Jumbo', 'Oversized', 'Winner', 'Trophy', 'Staff',
    'World Championship'
];

if (singleVariantSets.some(s => card.setOrigin.includes(s))) {
    return ['single'];
}
```

#### 7. Rare Cards
```javascript
if (rarity === 'rare') return ['holo', 'reverse-holo'];
```

#### 8. Default
```javascript
return ['regular', 'reverse-holo'];
```

---

## Image URL Mapping

Card images use a 4-tier fallback system:

### 1. Pokemon TCG API (Primary)
```
https://images.pokemontcg.io/{setCode}/{cardNumber}.png
```

**Mapping:** Uses `TCG_API_SET_IDS` object in `index.html`

```javascript
const TCG_API_SET_IDS = {
    'prismatic-evolutions': 'sv8pt5',
    'journey-together': 'sv9',
    'destined-rivals': 'sv10',
    'mega-evolution': 'me1',
    'phantasmal-flames': 'me2',
    'ascended-heroes': 'me2pt5',
    'celebrations': 'cel25',
    'surging-sparks': 'sv8'
};
```

**Special Cases:**
- Celebrations Classic Collection: `cel25c/{imageId}.png` (uses imageId field)

### 2. TCGdex CDN (Secondary)
```
https://assets.tcgdex.net/en/{series}/{set}/{cardNumber}/high.png
```

**Mapping:** Uses `TCGDEX_SET_IDS` object

```javascript
const TCGDEX_SET_IDS = {
    'prismatic-evolutions': { series: 'sv', set: 'sv08.5' },
    'journey-together':     { series: 'sv', set: 'sv09' },
    'destined-rivals':      { series: 'sv', set: 'sv10' },
    'mega-evolution':       { series: 'me', set: 'me01' },
    'phantasmal-flames':    { series: 'me', set: 'me02' },
    'ascended-heroes':      { series: 'me', set: 'me02.5' },
    'celebrations':         { series: 'swsh', set: 'cel25' },
    'surging-sparks':       { series: 'sv', set: 'sv08' }
};
```

### 3. Local Images (Tertiary)
```
Images/cards/{set-key}/{cardNumber}.png
```

**Format:**
- Card numbers are zero-padded to 3 digits (e.g., `001.png`, `025.png`, `188.png`)
- Set key matches the JSON file name

### 4. Placeholder (Fallback)
- Generated SVG Pokeball with card number and name
- Used when all other sources fail

### Custom Set Image URLs

For custom sets, the `getCustomCardImageUrl(card)` function uses the `apiId` field:

```javascript
// apiId format: "setId-number"
// Example: "base1-58" → https://images.pokemontcg.io/base1/58.png

if (card.apiId) {
    const parts = card.apiId.split('-');
    const setId = parts.slice(0, -1).join('-');
    const num = parts[parts.length - 1];
    return `https://images.pokemontcg.io/${setId}/${num}.png`;
}
```

---

## Search & Filtering

### Filter Types

Three filter states for each set:

1. **All** - Show all cards
2. **Incomplete** - Show only cards with unchecked variants
3. **Complete** - Show only cards with all variants checked

**Implementation:**
```javascript
function filterCards(setKey, filter) {
    const cards = document.querySelectorAll(`#${setKey}-grid .card-item`);
    cards.forEach(card => {
        const isComplete = card.getAttribute('data-completed') === 'true';
        if (filter === 'all') {
            card.style.display = '';
        } else if (filter === 'incomplete') {
            card.style.display = isComplete ? 'none' : '';
        } else if (filter === 'complete') {
            card.style.display = isComplete ? '' : 'none';
        }
    });
}
```

### Search Functionality

Search matches against:
- **Card name** (case-insensitive)
- **Card number** (exact or partial)

**Example:**
- Search "pikachu" → matches "Pikachu", "Pikachu ex", "Flying Pikachu V"
- Search "25" → matches card #25, #125, #252, etc.

**Implementation:**
```javascript
function searchCards(setKey, query) {
    const normalizedQuery = query.toLowerCase().trim();
    const cards = document.querySelectorAll(`#${setKey}-grid .card-item`);

    cards.forEach(card => {
        const cardName = card.querySelector('.card-name').textContent.toLowerCase();
        const cardNumber = card.querySelector('.card-number').textContent;

        const matches = cardName.includes(normalizedQuery) ||
                       cardNumber.includes(normalizedQuery);

        card.style.display = matches ? '' : 'none';
    });
}
```

**Note:** Search and filter work together - both conditions must be met for a card to display.

---

## TCGPlayer URL Generation

Links to TCGPlayer search results are generated for each card and variant.

### Base URL Format
```
https://www.tcgplayer.com/search/pokemon/product?q={searchQuery}
```

### Search Query Construction

```javascript
function getTCGPlayerUrl(cardName, setName, setCode, cardNumber, variantType) {
    let searchQuery = cardName.trim();

    // Add card number (e.g., "123/456")
    if (cardNumber) {
        searchQuery += ` ${cardNumber}`;
    }

    // Add set name
    searchQuery += ` ${setName.trim()}`;

    // Add variant type (if specified and not single)
    if (variantType && variantType !== 'single') {
        const variantLabel = variantLabels[variantType].label;
        searchQuery += ` ${variantLabel}`;
    }

    return `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(searchQuery)}`;
}
```

### Variant Labels for TCGPlayer

```javascript
const variantLabels = {
    'single': { icon: '✓', label: 'Collected' },
    'regular': { icon: '📄', label: 'Regular' },
    'holo': { icon: '⭐', label: 'Holo' },
    'reverse-holo': { icon: '🔄', label: 'Reverse Holo' },
    'pokeball': { icon: '⚾', label: 'Poké Ball' },
    'masterball': { icon: '🏀', label: 'Master Ball' }
};
```

### Example URLs

**Basic card:**
```
https://www.tcgplayer.com/search/pokemon/product?q=Pikachu%2025%2FBase%20Set
```

**With variant:**
```
https://www.tcgplayer.com/search/pokemon/product?q=Charizard%206%2FBase%20Set%20Holo
```

---

## Block Codes

Block codes are used for hierarchical navigation and styling:

| Block Code | Block Name | Sets | Color Gradient |
|------------|------------|------|----------------|
| `sv` | Scarlet & Violet | Surging Sparks, Prismatic Evolutions, Journey Together, Destined Rivals | Crimson/Magenta/Indigo |
| `me` | Mega Evolution | Mega Evolution, Phantasmal Flames, Ascended Heroes | Dark Orange/Orange Red/Gold |
| `swsh` | Sword & Shield | Celebrations | Dodger Blue/Royal Blue/Deep Sky Blue |

**Note:** Blocks are listed in chronological order (newest first) as they appear in the UI.

**Usage:**
- **Hierarchical Navigation:** Sets are grouped by blockCode in the two-level UI
  - Level 1: Block selection buttons (shows aggregate progress for all sets in block)
  - Level 2: Set selection grid (shows individual sets within selected block)
- **CSS Styling:** `block-{blockCode}` classes apply distinctive color gradients
- **Organizing Sets:** Groups sets by TCG era/generation/block
- **Visual Distinction:** Each block has a unique color scheme in the UI
- **Chronological Order:** Blocks ordered newest-first for quick access to recent releases

**Hierarchical UI Behavior:**
- Block buttons automatically aggregate progress from all sets with matching blockCode
- Clicking a block reveals set buttons for that block only
- Set logos load from `https://images.pokemontcg.io/{setCode}/logo.png`
- New blocks are automatically created when a set with a new blockCode is added
- Helper text appears above block selection: "Choose a block to view its sets"
- Set selection header appears when block is selected: "Select a Set"

### Block Visual Design Specifications

Each block has a carefully designed gradient that reflects its TCG era and theme:

#### Scarlet & Violet (sv)
```css
.block-btn.block-sv {
    background: linear-gradient(135deg, #dc143c 0%, #8b008b 50%, #4b0082 100%);
    border-color: #ff1493;
}
```
- **Theme:** Vibrant purple/violet and scarlet reflecting the newest generation
- **Colors:** Crimson → Dark Magenta → Indigo
- **Border:** Hot Pink (#ff1493)
- **Era:** 2023-present (newest)

#### Mega Evolution (me)
```css
.block-btn.block-me {
    background: linear-gradient(135deg, #ff8c00 0%, #ff4500 50%, #ffd700 100%);
    border-color: #ffa500;
}
```
- **Theme:** Energetic evolution power with golden shimmer
- **Colors:** Dark Orange → Orange Red → Gold
- **Border:** Orange (#ffa500)
- **Era:** Custom sets (middle)

#### Sword & Shield (swsh)
```css
.block-btn.block-swsh {
    background: linear-gradient(135deg, #1e90ff 0%, #4169e1 50%, #00bfff 100%);
    border-color: #00d4ff;
}
```
- **Theme:** Regal blue tones representing sword and shield
- **Colors:** Dodger Blue → Royal Blue → Deep Sky Blue
- **Border:** Bright Cyan (#00d4ff)
- **Era:** 2020-2022 (oldest)

### Design Principles for New Blocks

When adding a new block code:

1. **Research Official Branding:**
   - Identify official colors from TCG marketing materials
   - Consider the block's theme, era, and visual identity
   - Look at official set logos and packaging

2. **Create 3-Color Gradient:**
   - Use `linear-gradient(135deg, color1 0%, color2 50%, color3 100%)`
   - Choose vibrant, saturated colors for visual impact
   - Ensure high contrast with white text (use text-shadow if needed)
   - Test readability on mobile devices

3. **Select Complementary Border:**
   - Choose a bright accent color that complements the gradient
   - Border should be 3px solid
   - Use high saturation for visual prominence

4. **Maintain Consistency:**
   - Follow existing pattern of always-visible gradients
   - Apply same hover/active state transitions
   - Ensure mobile responsiveness

5. **Update Block Order:**
   - Insert new blocks at the beginning of `blockOrder` array
   - Maintain reverse chronological order (newest → oldest)
   - Update this table to reflect the order

**See Also:** `PROJECT_MASTER.md` → "Design & UX Principles" for comprehensive design guidelines.

---

## Examples

### Example 1: Standard Scarlet & Violet Set

```json
{
  "version": "3.0.0",
  "lastUpdated": "2026-02-15",
  "setKey": "journey-together",
  "name": "Journey Together",
  "displayName": "Journey Together",
  "totalCards": 190,
  "mainSet": 159,
  "setCode": "sv9",
  "hasPokeBallVariant": false,
  "hasMasterBallVariant": false,
  "releaseDate": "2025-03-21",
  "block": "Scarlet & Violet",
  "blockCode": "sv",
  "cards": {
    "1": { "name": "Oddish", "rarity": "common", "type": "pokemon" },
    "30": { "name": "Pikachu ex", "rarity": "ex", "type": "pokemon" },
    "142": { "name": "Professor's Research", "rarity": "uncommon", "type": "trainer" },
    "160": { "name": "Charizard ex", "rarity": "ultra-rare", "type": "pokemon" }
  }
}
```

**Variants:**
- Card 1 (common): Regular, Reverse Holo
- Card 30 (ex): Single checkbox
- Card 142 (trainer): Regular, Reverse Holo
- Card 160 (ultra-rare secret): Single checkbox

### Example 2: Special Variant Set (Prismatic Evolutions)

```json
{
  "setKey": "prismatic-evolutions",
  "hasPokeBallVariant": true,
  "hasMasterBallVariant": true,
  "cards": {
    "1": { "name": "Bulbasaur", "rarity": "common", "type": "pokemon" },
    "50": { "name": "Rare Candy", "rarity": "uncommon", "type": "trainer" },
    "75": { "name": "Dragonite", "rarity": "rare", "type": "pokemon" }
  }
}
```

**Variants:**
- Card 1 (common Pokemon): Regular, Reverse Holo, Poké Ball, Master Ball (4 total)
- Card 50 (trainer): Regular, Reverse Holo, Poké Ball (3 total)
- Card 75 (rare Pokemon): Holo, Reverse Holo, Poké Ball, Master Ball (4 total)

### Example 3: Custom Set Card

```json
{
  "setKey": "its-pikachu",
  "cards": {
    "1": {
      "name": "Pikachu (CoroCoro Promo)",
      "rarity": "promo",
      "type": "pokemon",
      "setOrigin": "CoroCoro Comic Promo (JP, 1996)",
      "originalNumber": "",
      "releaseDate": "1996/10/15",
      "apiId": "",
      "region": "JP"
    },
    "58": {
      "name": "Pikachu (Base Set)",
      "rarity": "common",
      "type": "pokemon",
      "setOrigin": "Base Set (1999)",
      "originalNumber": "58",
      "releaseDate": "1999/01/09",
      "apiId": "base1-58",
      "region": "EN"
    }
  }
}
```

**Variants:**
- Card 1: Single (JP region + promo)
- Card 58: Single (pre-2002 era)

### Example 4: WotC Era with Explicit Variants

```json
{
  "name": "Charizard (Base Set)",
  "rarity": "rare",
  "type": "pokemon",
  "setOrigin": "Base Set (1999)",
  "releaseDate": "1999/01/09",
  "apiId": "base1-4",
  "region": "EN",
  "variants": [
    { "rarity": "holo", "name": "Holo" },
    { "rarity": "non-holo", "name": "Non-holo" }
  ]
}
```

**Variants:** Holo, Non-holo (explicit definition overrides default logic)

---

## Version History

- **v1.0** (2026-02-15): Initial documentation created to support modular architecture and future scalability
