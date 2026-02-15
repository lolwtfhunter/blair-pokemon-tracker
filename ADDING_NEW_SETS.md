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

To add a completely new card game (e.g., Disney Lorcana, Magic: The Gathering):

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
- [ ] Set appears in the set buttons list
- [ ] Set button shows correct name and metadata
- [ ] Clicking set button displays cards
- [ ] Cards render with correct information
- [ ] Images load (or placeholders show)
- [ ] Filter buttons work (All/Incomplete/Complete)
- [ ] Search functionality works
- [ ] Variant checkboxes appear correctly
- [ ] Checking variants saves progress
- [ ] Progress bar updates
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

## Version History

- **v1.1** (2026-02-15): Added comprehensive "Reliable Data Sources" section with official Pokemon resources, research workflow, and data verification procedures. Emphasized using real data only after Mega Evolution set required correction from fictional to accurate card list.
- **v1.0** (2026-02-15): Initial documentation created alongside Mega Evolution set addition and modular refactoring

## Lessons Learned

### Mega Evolution Set (Feb 2026)
**Issue**: Initial implementation used a generated/fictional card list that didn't match the actual Pokemon TCG Mega Evolution set. Card names in JSON didn't match images from Pokemon TCG API, causing confusion.

**Resolution**: Researched actual set data from official Pokemon sources (Pokemon.com, PokeBeach, Beckett) and replaced entire card list with accurate data for all 188 cards.

**Key Takeaway**: ALWAYS use real, researched data from official sources. NEVER generate or invent card information. Images from Pokemon TCG API must exactly match card names in JSON files.
