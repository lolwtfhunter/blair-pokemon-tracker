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
- [ ] Complete card list with card numbers, names, rarities, and types
- [ ] Set code for image CDN mapping (if official set)
- [ ] Access to the repository with appropriate branch permissions
- [ ] Understanding of the variant rules (see `CARD_GAME_LOGIC.md`)

---

## Adding an Official Pokemon TCG Set

Follow these steps in order to add a new official Pokemon TCG set:

### Step 1: Create the Set Data File

1. **Navigate to the data directory:**
   ```bash
   cd data/pokemon/official-sets/
   ```

2. **Create a new JSON file** named `{set-key}.json` (use lowercase with hyphens):
   ```bash
   touch my-new-set.json
   ```

3. **Populate the JSON file** with the following structure:
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

### Step 2: Update index.html

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

- **v1.0** (2026-02-15): Initial documentation created alongside Mega Evolution set addition and modular refactoring
