# Adding New Sets to Blair TCG Tracker

This document provides step-by-step instructions for adding new card sets to the web app.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Adding an Official Pokemon TCG Set](#adding-an-official-pokemon-tcg-set)
3. [Adding a Custom Pokemon Set](#adding-a-custom-pokemon-set)
4. [Adding a New Card Game (e.g., Disney Lorcana)](#adding-a-new-card-game)
5. [Testing Checklist](#testing-checklist)
6. [Common Issues & Troubleshooting](#common-issues--troubleshooting)

---

## Prerequisites

Before adding a new set, ensure you have:

- [ ] Set information (name, release date, total cards, main set size)
- [ ] **ACCURATE, REAL card list** from official sources (never generate fictional data)
- [ ] Complete card list with card numbers, names, rarities, and types
- [ ] Set code for image CDN mapping (if official set)
- [ ] Access to the repository with appropriate branch permissions
- [ ] Understanding of the variant rules (see `CARD_GAME_LOGIC.md`)

### ⚠️ CRITICAL: Use Real Data Only

**NEVER generate or invent fictional card lists.** Always research and use real, accurate data from official Pokemon TCG sources. Images from the Pokemon TCG API must match the card names in the JSON file.

See the [Reliable Data Sources](#reliable-data-sources) section below for recommended resources.

---

## Reliable Data Sources

**ALWAYS use these official and verified sources for card data. NEVER invent or generate fictional card information.**

### Primary Sources (Most Reliable)

These sources provide official, accurate card data and should be your first stop:

#### 1. **Official Pokemon Company Resources** ⭐ BEST
- **Pokemon TCG Official Site**: https://www.pokemon.com/us/pokemon-tcg/
  - Card galleries: https://tcg.pokemon.com/en-us/galleries/
  - Official checklists (PDF): https://www.pokemon.com/us/pokemon-tcg/product-gallery/
  - **Use for**: Official card names, set information, release dates
  - **Reliability**: 100% - This is the source of truth

- **Pokemon TCG API**: https://pokemontcg.io/
  - API endpoint: `https://api.pokemontcg.io/v2/cards?q=set.id:{setCode}`
  - Example: `https://api.pokemontcg.io/v2/cards?q=set.id:me1`
  - **Use for**: Programmatic access to card data, images, rarities
  - **Reliability**: 99% - Official API with comprehensive data

#### 2. **PokeBeach** ⭐ HIGHLY RELIABLE
- **URL**: https://www.pokebeach.com/
- Search for: `"{Set Name}" set guide card list`
- **Use for**: Complete set guides, cut cards, card lists, early set information
- **Reliability**: 95% - Long-standing, highly accurate Pokemon TCG news site
- **Best for**: New set announcements, comprehensive set guides

#### 3. **Serebii.net** ⭐ HIGHLY RELIABLE
- **URL**: https://www.serebii.net/card/
- **Use for**: Card databases, set lists, Japanese set information
- **Reliability**: 95% - Comprehensive Pokemon resource

### Secondary Sources (Very Reliable)

Use these for verification and additional details:

#### 4. **JustInBasil** ⭐ EXCELLENT FOR VISUALS
- **URL**: https://www.justinbasil.com/
- Visual set lists: `https://www.justinbasil.com/visual/{set-code}`
- **Use for**: Visual card checklists, card images, deck building
- **Reliability**: 90% - Community-trusted resource
- **Best for**: Quick visual reference of complete sets

#### 5. **Bulbapedia** (Bulbagarden)
- **URL**: https://bulbapedia.bulbagarden.net/
- Search: `{Set Name} (TCG)`
- **Use for**: Detailed set information, card variations, historical data
- **Reliability**: 90% - Wiki format, well-maintained

#### 6. **TCGPlayer**
- **URL**: https://www.tcgplayer.com/search/pokemon/product
- **Use for**: Card pricing, availability, verifying card existence
- **Reliability**: 85% - Marketplace data, may have listing variations

### Tertiary Sources (Good for Verification)

Use these to cross-reference and verify:

#### 7. **Beckett**
- **URL**: https://www.beckett.com/news/
- Search for: `"{Set Name}" checklist`
- **Use for**: Set checklists, card values
- **Reliability**: 85%

#### 8. **PokéCottage, Pikawiz, Pokellector**
- **URLs**:
  - https://pokecottage.com/
  - https://www.pikawiz.com/
  - https://www.pokellector.com/
- **Use for**: Visual set lists, card organization
- **Reliability**: 80-85%

### How to Research a New Set

Follow this process IN ORDER:

1. **Start with Official Pokemon.com**
   - Search for the set's official card gallery
   - Download the official checklist PDF if available
   - Note the official set code, release date, and total cards

2. **Check PokeBeach for Set Guide**
   - Search: `"{Set Name}" tcg set guide site:pokebeach.com`
   - PokeBeach usually has comprehensive guides with full card lists
   - Verify card numbers, names, and rarities

3. **Use Pokemon TCG API (if available)**
   - Try: `https://api.pokemontcg.io/v2/cards?q=set.id:{setCode}&pageSize=250`
   - This gives you programmatic access to all card data
   - Can be used to generate the JSON file automatically

4. **Cross-reference with JustInBasil**
   - Check the visual set list to verify card count and order
   - Use for visual confirmation of card names

5. **Verify rarities with multiple sources**
   - Cross-check rarity designations across 2-3 sources
   - Official Pokemon.com and PokeBeach are most reliable for rarities

6. **Document your sources**
   - Note which sources you used in commit messages
   - If there are discrepancies, go with Official Pokemon.com

### Red Flags (Signs of Unreliable Data)

🚫 **NEVER use data that shows these signs:**
- Inconsistent card numbering (gaps, duplicates)
- Card names that don't match official Pokemon naming conventions
- Rarity designations not found in other sources
- Sets with no official Pokemon Company acknowledgment
- Fan-made or custom cards mixed with official sets
- Unofficial translations or romanizations

### Example Research Workflow

**Adding "Journey Together" (sv9) set:**

```bash
# Step 1: Check official Pokemon.com
Open: https://tcg.pokemon.com/en-us/galleries/journey-together/

# Step 2: Check PokeBeach
Search: "Journey Together set guide site:pokebeach.com"
Read: Full set guide with all 190 cards

# Step 3: Use Pokemon TCG API
curl "https://api.pokemontcg.io/v2/cards?q=set.id:sv9&pageSize=200"

# Step 4: Cross-reference with JustInBasil
Open: https://www.justinbasil.com/visual/sv9

# Step 5: Build JSON file
# Use card data from steps 1-4, prioritizing official sources

# Step 6: Validate
python3 -m json.tool journey-together.json
# Verify total cards matches official count (190)
```

### For Custom Sets

Custom sets (like "It's Pikachu!") that track cards across multiple sets:

1. **Use Pokemon TCG API for individual cards**:
   ```
   https://api.pokemontcg.io/v2/cards?q=name:pikachu
   ```

2. **Cross-reference with Bulbapedia**:
   - Search for: "List of Pokémon Trading Card Game cards featuring {Pokemon Name}"

3. **Verify Japanese exclusives**:
   - Use Serebii.net for Japanese card information
   - Check Bulbapedia's Japanese set lists

4. **Document setOrigin accurately**:
   - Use official set names from Pokemon.com
   - Include region (EN/JP) and year

---

## Adding an Official Pokemon TCG Set

Follow these steps in order to add a new official Pokemon TCG set:

### Step 1: Research and Obtain Real Card Data

**⚠️ CRITICAL: Research FIRST, Create JSON SECOND**

1. **Research the set using official sources** (see [Reliable Data Sources](#reliable-data-sources)):
   - Visit Pokemon.com for official set information
   - Check PokeBeach for complete set guide
   - Use Pokemon TCG API if available
   - Cross-reference with JustInBasil visual list
   - Document your sources

2. **Verify you have ACCURATE data for:**
   - ✅ Exact card names (as they appear on the cards)
   - ✅ Correct rarities (from official sources)
   - ✅ Card types (pokemon, trainer, energy)
   - ✅ Total card count and main set size
   - ✅ Official set code for image CDN
   - ✅ Release date

3. **Create a data collection file** (temporary working file):
   ```bash
   # Create a temporary file to organize your research
   nano ~/set-research-notes.txt
   ```

### Step 2: Create the Set Data File

1. **Navigate to the data directory:**
   ```bash
   cd data/pokemon/official-sets/
   ```

2. **Create a new JSON file** named `{set-key}.json` (use lowercase with hyphens):
   ```bash
   touch my-new-set.json
   ```

3. **Populate the JSON file with REAL, RESEARCHED data:**
   ```json
   {
     "version": "3.0.0",
     "lastUpdated": "YYYY-MM-DD",
     "setKey": "my-new-set",
     "name": "My New Set",
     "displayName": "My New Set",
     "totalCards": 200,
     "mainSet": 150,
     "setCode": "sv11",
     "hasPokeBallVariant": false,
     "hasMasterBallVariant": false,
     "singleVariantOnly": false,
     "releaseDate": "YYYY-MM-DD",
     "block": "Scarlet & Violet",
     "blockCode": "sv",
     "cards": {
       "1": {
         "name": "Bulbasaur",
         "rarity": "common",
         "type": "pokemon"
       },
       "2": {
         "name": "Ivysaur",
         "rarity": "uncommon",
         "type": "pokemon"
       }
       // ... continue for all cards
     }
   }
   ```

   **Important: Block Information**
   - The `block` and `blockCode` fields determine how the set appears in the hierarchical UI
   - Sets are automatically grouped by `blockCode` in the block selection interface
   - Current block codes:
     - `sv` - Scarlet & Violet (red/purple gradient)
     - `me` - Mega Evolution (orange/gold gradient)
     - `swsh` - Sword & Shield (blue gradient)
   - If adding a new block, the UI will automatically create a block button for it
   - Block buttons show aggregate progress across all sets with the same blockCode

4. **Validate the JSON:**
   ```bash
   python3 -m json.tool my-new-set.json > /dev/null && echo "✓ Valid JSON"
   ```

5. **Verify card data accuracy:**
   - ✅ Card count matches official total
   - ✅ Card names match official Pokemon.com names
   - ✅ No gaps in card numbering (1, 2, 3, ... total)
   - ✅ Rarities match official sources
   - ✅ Main set size is correct (before secret rares)

### Step 3: Update index.html

1. **Add the set to the OFFICIAL_SETS array** (around line 1699):
   ```javascript
   const OFFICIAL_SETS = [
       'celebrations',
       'mega-evolution',
       'phantasmal-flames',
       'ascended-heroes',
       'surging-sparks',
       'prismatic-evolutions',
       'journey-together',
       'destined-rivals',
       'my-new-set'  // Add your new set here
   ];
   ```

2. **Add the set's HTML grid section** (around line 1326, in chronological order):
   ```html
   <div id="my-new-set" class="set-section">
       <div class="card-controls">
           <div class="filter-buttons">
               <button class="filter-btn active" onclick="filterCards('my-new-set', 'all')">All</button>
               <button class="filter-btn" onclick="filterCards('my-new-set', 'incomplete')">Incomplete</button>
               <button class="filter-btn" onclick="filterCards('my-new-set', 'complete')">Complete</button>
           </div>
           <div class="search-container">
               <input type="text" class="search-input" placeholder="Search cards..." oninput="searchCards('my-new-set', this.value)" data-set="my-new-set">
               <button class="search-clear" onclick="clearSearch('my-new-set')">×</button>
           </div>
       </div>
       <div class="card-grid" id="my-new-set-grid"></div>
   </div>
   ```

3. **Add image URL mappings** (around line 1478):

   For **Pokemon TCG API** (TCG_API_SET_IDS):
   ```javascript
   const TCG_API_SET_IDS = {
       // ... existing sets ...
       'my-new-set': 'sv11'  // Add your set's API ID
   };
   ```

   For **TCGdex CDN** (TCGDEX_SET_IDS):
   ```javascript
   const TCGDEX_SET_IDS = {
       // ... existing sets ...
       'my-new-set': { series: 'sv', set: 'sv11' }  // Add your set's TCGdex mapping
   };
   ```

### Step 3: Update Documentation

1. **Update README.md** - Add the new set to the table:
   ```markdown
   | My New Set | 200 | Scarlet & Violet | Mar 2026 |
   ```

2. **Update PROJECT_MASTER.md** - Add set details to the card sets section

3. **Update the project structure** if needed (e.g., add to Images/cards/ directory list)

### Step 4: Create Local Image Directory (Optional)

If you plan to use local images:
```bash
mkdir -p Images/cards/my-new-set/
```

### Step 5: Validate and Test

See [Testing Checklist](#testing-checklist) below.

---

## Adding a Custom Pokemon Set

Custom sets are cross-era collections (like "It's Pikachu!" tracking all Pikachu cards).

### Step 1: Create the Custom Set Data File

1. **Navigate to the custom sets directory:**
   ```bash
   cd data/pokemon/custom-sets/
   ```

2. **Create a new JSON file** named `{set-key}.json`:
   ```bash
   touch my-custom-set.json
   ```

3. **Populate the JSON file:**
   ```json
   {
     "version": "1.1.0",
     "lastUpdated": "YYYY-MM-DD",
     "setKey": "my-custom-set",
     "name": "My Custom Set",
     "displayName": "My Custom Set",
     "description": "Description of what this custom set tracks",
     "totalCards": 100,
     "singleVariantOnly": true,
     "pokemon": ["Pikachu", "Raichu"],
     "cards": {
       "1": {
         "name": "Pikachu (Base Set)",
         "rarity": "common",
         "type": "pokemon",
         "setOrigin": "Base Set (1999)",
         "originalNumber": "58",
         "releaseDate": "1999/01/09",
         "apiId": "base1-58",
         "region": "EN"
       }
       // ... continue for all cards
     }
   }
   ```

### Step 2: Update index.html

1. **Add to CUSTOM_SETS array** (around line 1812):
   ```javascript
   const CUSTOM_SETS = [
       'its-pikachu',
       'psyduck',
       'togepi',
       'my-custom-set'  // Add here
   ];
   ```

2. Custom sets use **dynamic grid creation**, so no HTML changes needed.

### Step 3: Update Documentation

Add your custom set to README.md and PROJECT_MASTER.md.

---

## Adding a New Card Game

To add a completely new card game (e.g., Magic: The Gathering, Yu-Gi-Oh!):

**✅ Disney Lorcana has been successfully implemented!** See below for how it was done.

### Step 1: Create Directory Structure

```bash
mkdir -p data/lorcana/sets/
# or
mkdir -p data/magic/sets/
```

### Step 2: Create Set Files

Follow the same JSON structure as Pokemon official sets, adapting fields as needed.

### Step 3: Update index.html

1. **Create a new constants array:**
   ```javascript
   const LORCANA_SETS = [
       'first-chapter',
       'rise-of-the-floodborn'
   ];
   ```

2. **Create loading function** (similar to `loadCardData`):
   ```javascript
   async function loadLorcanaData() {
       // Similar structure to loadCardData()
   }
   ```

3. **Create rendering functions** for buttons and cards

4. **Add tab switching logic** (the HTML already has a Lorcana tab placeholder)

### Step 4: Add Image URL Mappings

Create new mapping objects for the new game's CDN sources.

### Step 5: Design Block and Set UI Elements

**IMPORTANT:** Maintain visual consistency with existing TCG implementations while creating unique, theme-appropriate designs.

#### Block Button Gradients

If using hierarchical navigation (blocks → sets → cards), create distinctive gradient backgrounds:

1. **Research Official Colors:**
   - Look up the official branding/colors for the new TCG
   - Identify 2-3 primary colors from official materials
   - Example: Disney Lorcana might use magical purples, golds, and teals

2. **Create 3-Color Gradient:**
   ```css
   .block-btn.block-{code} {
       background: linear-gradient(135deg, {color1} 0%, {color2} 50%, {color3} 100%);
       border-color: {accent-color};
   }
   ```
   - Use 135deg angle for consistency
   - Choose vibrant, saturated colors
   - Ensure white text is readable (use text-shadow if needed)

3. **Gradient Examples from Pokemon TCG:**
   ```css
   /* Scarlet & Violet - Vibrant purple/red */
   .block-btn.block-sv {
       background: linear-gradient(135deg, #dc143c 0%, #8b008b 50%, #4b0082 100%);
       border-color: #ff1493;
   }

   /* Mega Evolution - Energetic orange/gold */
   .block-btn.block-me {
       background: linear-gradient(135deg, #ff8c00 0%, #ff4500 50%, #ffd700 100%);
       border-color: #ffa500;
   }

   /* Sword & Shield - Regal blue */
   .block-btn.block-swsh {
       background: linear-gradient(135deg, #1e90ff 0%, #4169e1 50%, #00bfff 100%);
       border-color: #00d4ff;
   }
   ```

4. **Design Requirements:**
   - Gradient must be always visible (not just on hover)
   - Border: 3px solid with complementary color
   - Border radius: 16px
   - Box shadow: `0 4px 12px rgba(0, 0, 0, 0.4)`
   - Text shadow: `0 2px 4px rgba(0, 0, 0, 0.3)`

#### Helper Text

Add contextual guidance at each navigation level:

1. **Block Selection Helper (if hierarchical):**
   ```html
   <div class="helper-text">Choose a [game] block to view sets</div>
   ```

2. **Set Selection Helper:**
   ```html
   <div class="helper-text">Choose a set to view cards</div>
   ```
   Or use a header:
   ```html
   <div class="set-selection-header">
       <div class="set-selection-title">Select a Set</div>
   </div>
   ```

3. **Helper Text Styling:**
   ```css
   .helper-text {
       text-align: center;
       font-size: 0.85rem;
       color: rgba(255, 255, 255, 0.5);
       margin-bottom: 16px;
       font-style: italic;
   }
   ```

#### Chronological Ordering

Always order blocks and sets with **newest first**:

```javascript
// Example for Disney Lorcana
const lorcanaBlockOrder = ['illumineer-quest', 'ursula-return', 'first-chapter']; // Newest → Oldest

// Within each block, sort sets by release date (newest first)
```

**Benefits:**
- Quick access to latest releases
- Intuitive for active collectors
- Reduces scrolling to find recent sets

#### Interaction States

Ensure consistent interaction patterns:

```css
/* Hover: Slight lift */
.block-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
}

/* Active: Scale up with dramatic shadow */
.block-btn.active {
    transform: scale(1.05);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
}
```

#### Design Checklist

Before committing UI changes for a new TCG:

- [ ] Block buttons have unique, always-visible gradients
- [ ] Gradient colors reflect the TCG's official branding
- [ ] 3px borders with complementary accent colors
- [ ] Helper text added at appropriate navigation levels
- [ ] Blocks/sets ordered chronologically (newest first)
- [ ] Hover and active states properly styled
- [ ] Text is readable on gradient backgrounds
- [ ] Mobile-responsive (test on small screens)
- [ ] Animations smooth (slideDown for set reveal)

**See Also:** `PROJECT_MASTER.md` → "Design & UX Principles" section for comprehensive guidelines.

---

## Testing Checklist

Before committing your changes, verify:

### Data Validation
- [ ] JSON file is valid (run `python3 -m json.tool {file}.json`)
- [ ] All card numbers are sequential (1, 2, 3, ...)
- [ ] Card counts match (totalCards = last card number)
- [ ] Main set size is correct
- [ ] All required fields are present
- [ ] Rarities are correctly assigned
- [ ] Types are valid (pokemon, trainer, energy)

### Code Changes
- [ ] Set key added to appropriate array (OFFICIAL_SETS or CUSTOM_SETS)
- [ ] HTML grid section added (official sets only)
- [ ] Image URL mappings added (TCG_API_SET_IDS and TCGDEX_SET_IDS)
- [ ] No syntax errors in JavaScript
- [ ] No duplicate set keys

### Functionality Testing
- [ ] Block button appears with correct block name and color
- [ ] Block button shows aggregate progress for all sets in the block
- [ ] Clicking block button displays set buttons for that block
- [ ] Set appears in the correct block's set grid
- [ ] Set button shows correct name, logo, and metadata
- [ ] Set logo loads from Pokemon TCG API (or gracefully hides if unavailable)
- [ ] Clicking set button displays cards
- [ ] Cards render with correct information
- [ ] Images load (or placeholders show)
- [ ] Filter buttons work (All/Incomplete/Complete)
- [ ] Search functionality works
- [ ] Variant checkboxes appear correctly
- [ ] Checking variants saves progress
- [ ] Progress bars update (both set and block levels)
- [ ] Card modal opens when clicking cards
- [ ] TCGPlayer links work

### Documentation
- [ ] README.md updated with new set info
- [ ] PROJECT_MASTER.md updated
- [ ] Card counts in docs match actual counts

---

## Common Issues & Troubleshooting

### Issue: Cards not displaying

**Symptoms:** Set button appears, but no cards show when clicked

**Solutions:**
1. Check if HTML grid section exists (official sets) - search for `id="{set-key}-grid"`
2. Verify set key in OFFICIAL_SETS or CUSTOM_SETS array matches exactly
3. Check browser console for JavaScript errors
4. Ensure JSON file is in correct directory and named correctly

### Issue: Images not loading

**Symptoms:** Cards display but show placeholders instead of images

**Solutions:**
1. Verify set is added to TCG_API_SET_IDS and TCGDEX_SET_IDS
2. Check that setCode in JSON matches CDN expectations
3. Test image URLs manually in browser:
   - Pokemon TCG API: `https://images.pokemontcg.io/{setCode}/{cardNumber}.png`
   - TCGdex: `https://assets.tcgdex.net/en/{series}/{set}/{cardNumber}/high.png`
4. Consider adding local images to `Images/cards/{set-key}/`

### Issue: Variants not showing correctly

**Symptoms:** Wrong number or type of variant checkboxes

**Solutions:**
1. Check `singleVariantOnly` field in JSON
2. Verify rarity values match expected variants (see `CARD_GAME_LOGIC.md`)
3. For special variants (Poke Ball, Master Ball), ensure `hasPokeBallVariant` and `hasMasterBallVariant` are set
4. Review variant logic in `getVariants()` function

### Issue: Set not in correct order

**Symptoms:** Set appears in wrong position in the list

**Solutions:**
1. Reorder sets in OFFICIAL_SETS or CUSTOM_SETS array
2. Sets are displayed in the order they appear in the array
3. Consider chronological order by release date

### Issue: Progress not saving

**Symptoms:** Checking variants doesn't save or sync

**Solutions:**
1. Check browser console for Firebase errors
2. Verify localStorage is enabled in browser
3. Ensure set key is properly added to `initializeProgress()` (should happen automatically)
4. Check that variant toggling function is working (`toggleVariant()`)

### Issue: Search or filter not working

**Symptoms:** Search/filter buttons don't respond or work incorrectly

**Solutions:**
1. Verify HTML grid section has correct `onclick` handlers
2. Check that set key matches exactly in all references
3. Ensure no JavaScript syntax errors
4. Test with browser dev tools console

---

## Quick Reference: File Locations

| Task | File/Directory | Line/Section |
|------|----------------|--------------|
| Add official set data | `data/pokemon/official-sets/{set-key}.json` | - |
| Add custom set data | `data/pokemon/custom-sets/{set-key}.json` | - |
| Update set list | `index.html` | ~1699 (OFFICIAL_SETS) or ~1812 (CUSTOM_SETS) |
| Add HTML grid | `index.html` | ~1326 (set sections) |
| Add image mappings | `index.html` | ~1478 (TCG_API_SET_IDS, TCGDEX_SET_IDS) |
| Update main docs | `README.md` | Set table section |
| Update detailed docs | `PROJECT_MASTER.md` | Card sets section |

---

## Understanding the Hierarchical UI

As of February 2026, the Pokemon TCG tab uses a two-level hierarchical navigation system to improve scalability:

### Level 1: Block Selection

- **What it is:** Large, visually distinct buttons for each TCG block/era
- **Current blocks:**
  - Scarlet & Violet (blockCode: `sv`) - 4 sets
  - Mega Evolution (blockCode: `me`) - 3 sets
  - Sword & Shield (blockCode: `swsh`) - 1 set
- **What they show:**
  - Block name (from `block` field in JSON)
  - Number of sets in the block
  - Aggregate progress across all sets (total variants collected/total variants)
  - Visual progress bar
  - Distinctive color gradient based on blockCode

### Level 2: Set Selection

- **What it is:** Grid of set buttons that appears only when a block is selected
- **How it appears:** Click a block → "Select a Set" header and set buttons slide into view
- **What they show:**
  - Official set logo (from `https://images.pokemontcg.io/{setCode}/logo.png`)
  - Set name (from `displayName` field in JSON)
  - Release date (from `releaseDate` field in JSON)
  - Individual set progress (variants collected/total)
  - Visual progress bar

**Important UI Behavior:**
- No auto-selection occurs - user must click to navigate each level
- Clicking an active block again deselects it and hides all child elements
- Set buttons are hidden until a block is selected
- Cards are hidden until a set is selected

### How New Sets Integrate

When you add a new **official set**:

1. **Automatic block grouping:** The set is automatically grouped with other sets sharing the same `blockCode`
2. **Block button updates:** If the block already exists, it updates to show the new set count and aggregate progress
3. **New block creation:** If you use a new `blockCode`, a new block button is automatically created (though you may want to add CSS styling for the new block's color gradient)
4. **Set logo display:** The set button will attempt to load the set logo from `https://images.pokemontcg.io/{setCode}/logo.png`. If unavailable, the logo image gracefully hides and only the set name displays.

When you add a **custom set**:

1. **No hierarchy:** Custom sets display as a flat list in the Custom Sets tab
2. **No block codes needed:** Custom sets don't use `block` or `blockCode` fields
3. **Direct access:** Set buttons appear immediately without needing to select a parent block
4. **Same functionality:** Cards, progress, and all other features work identically to official sets

### Adding a New Block

If you're adding a set from a completely new TCG block (e.g., Sun & Moon):

1. **Set the block fields in JSON:**
   ```json
   "block": "Sun & Moon",
   "blockCode": "sm"
   ```

2. **Add CSS styling for the block color** in `index.html` (around line 234):
   ```css
   .block-btn.block-sm::before {
       background: linear-gradient(135deg, #your-color1, #your-color2);
   }
   ```

3. The block button will automatically appear in the UI

---

## Real-World Example: Disney Lorcana Implementation

### Successfully Implemented (February 2026)

Disney Lorcana was added to the Blair TCG Tracker following the pattern described in this document. Here's what was done:

#### **Directory Structure Created**
```
data/lorcana/
└── sets/
    ├── first-chapter.json        (204 cards)
    └── whispers-in-the-well.json (204 cards)
```

#### **JSON Structure**
Each Lorcana set follows the Pokemon pattern but adapted for Lorcana-specific needs:
- Added `dreambornId` field for image CDN mapping (format: `001-001`)
- Used `singleVariantOnly: false` but implemented single checkbox tracking in code
- Card types: `character`, `action`, `item`, `location` (instead of pokemon/trainer/energy)
- Rarities: `common`, `uncommon`, `rare`, `super-rare`, `legendary`, `enchanted`, etc.

#### **Code Added to index.html**
1. **Global state:** `lorcanaCardSets`, `currentLorcanaSet`
2. **Constants:** `LORCANA_SETS` array listing set keys
3. **Functions implemented:**
   - `loadLorcanaData()` - Loads Lorcana JSON files
   - `getLorcanaCardImageUrl()` - Multi-tier CDN fallback (Dreamborn → Lorcania → Local)
   - `renderLorcanaSetButtons()` - Displays set selection buttons
   - `renderLorcanaCards()` - Renders card grid
   - `switchLorcanaSet()` - Set navigation
   - `toggleLorcanaVariant()` - Progress tracking
   - `getLorcanaSetProgress()` - Progress calculation
   - Filter/search functions: `filterLorcanaCards()`, `searchLorcanaCards()`, `clearLorcanaSearch()`

#### **Image CDN Configuration**
Three-tier fallback system:
1. **Dreamborn CDN:** `https://cdn.dreamborn.ink/images/en/cards/{dreambornId}`
2. **Lorcania CDN:** `https://lorcania.com/cards/{setNum}/{cardNum}.webp`
3. **Local fallback:** `./Images/lorcana/{setKey}/{number}.jpg`

#### **Data Sources Used**
- Card data: [great-illuminary/lorcana-data](https://github.com/great-illuminary/lorcana-data) (YAML converted to JSON)
- Card images: Dreamborn.ink and Lorcania CDNs

#### **Key Differences from Pokemon**
- Simplified to single "Collected" checkbox (vs multi-variant tracking)
- Different rarity types and card types
- Uses `dreambornId` for image mapping instead of set codes
- No block/hierarchical navigation (flat set list)

This implementation demonstrates how to add a new TCG while reusing the existing architecture and patterns.

---

## Version History

- **v2.0** (2026-02-15): Added "Real-World Example: Disney Lorcana Implementation" section documenting successful addition of Lorcana as a second TCG to the tracker. Updated "Adding a New Card Game" section header to reflect that Lorcana is now implemented.
- **v1.3** (2026-02-15): Updated hierarchical UI documentation to reflect improved user control model: removed auto-selection behavior, added block deselection capability, clarified that set buttons only appear when block is selected. Added notes about custom sets using flat list (no hierarchy).
- **v1.2** (2026-02-15): Added "Understanding the Hierarchical UI" section documenting the new two-level block/set navigation system. Updated testing checklist to include block-level UI verification. Added block information notes to JSON structure documentation.
- **v1.1** (2026-02-15): Added comprehensive "Reliable Data Sources" section with official Pokemon resources, research workflow, and data verification procedures. Emphasized using real data only after Mega Evolution set required correction from fictional to accurate card list.
- **v1.0** (2026-02-15): Initial documentation created alongside Mega Evolution set addition and modular refactoring

## Lessons Learned

### Disney Lorcana Addition (Feb 2026)
**Success**: Successfully added Disney Lorcana as a second TCG to the tracker, demonstrating the modular architecture's scalability.

**Key Implementation Details**:
- Sourced authentic card data from great-illuminary/lorcana-data repository
- Added dreambornId field to all 408 Lorcana cards for CDN image mapping
- Implemented multi-tier image CDN fallback (Dreamborn → Lorcania → Local)
- Created Lorcana-specific functions while reusing core UI patterns
- Used simplified single-checkbox tracking instead of multi-variant system

**Key Takeaway**: The modular data structure (`data/{tcg}/sets/`) makes adding new TCGs straightforward. Core patterns (set selection, card rendering, progress tracking, image fallback) can be adapted for different TCGs while maintaining consistency.

### Mega Evolution Set (Feb 2026)
**Issue**: Initial implementation used a generated/fictional card list that didn't match the actual Pokemon TCG Mega Evolution set. Card names in JSON didn't match images from Pokemon TCG API, causing confusion.

**Resolution**: Researched actual set data from official Pokemon sources (Pokemon.com, PokeBeach, Beckett) and replaced entire card list with accurate data for all 188 cards.

**Key Takeaway**: ALWAYS use real, researched data from official sources. NEVER generate or invent card information. Images from Pokemon TCG API must exactly match card names in JSON files.
