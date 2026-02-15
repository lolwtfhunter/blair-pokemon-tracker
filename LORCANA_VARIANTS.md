# Disney Lorcana Variants & Rarity Reference

**Last Updated:** February 15, 2026

This document provides comprehensive information about Disney Lorcana card variants, rarities, and tracking methods specific to the Lorcana TCG.

---

## Table of Contents

1. [Card Variants](#card-variants)
2. [Rarity System](#rarity-system)
3. [Tracking in Blair TCG Tracker](#tracking-in-blair-tcg-tracker)
4. [Image Sources](#image-sources)
5. [Sources](#sources)

---

## Card Variants

Unlike Pokemon TCG which has multiple variant types per card (Regular, Reverse Holo, Holo, etc.), Disney Lorcana uses a simpler variant system:

### Standard (Non-Foil) Cards
- Every card numbered 1-204 in each set is available in **standard (non-foil)** version
- These are the regular, non-shiny versions that make up the base set
- No special finish or treatment

### Foil Cards
- Every card numbered 1-204 is also available in **foil** version
- Features a metallic finish that makes them appear shinier
- Functionally identical to non-foil counterparts
- Last card in each booster pack is always foil
- **Total variants per card:** 2 (standard + foil)

### Enchanted Cards (Secret Rares)
- **Special variant with unique characteristics:**
  - Numbered above 204 (e.g., 205-216 in The First Chapter, 205-222 in Whispers in the Well)
  - Alternate art versions of characters from the main set (1-204)
  - **Always foil** - no non-foil version exists
  - Borderless design
  - Special "Inkwash" foiling treatment - rainbow-like effect across the entire card
  - Unique rarity symbol (rainbow hexagon)
  - Different artwork than the standard version of the same character

### Epic & Iconic Cards (Set 10+)
Starting with Whispers in the Well (Set 10), additional ultra-rare variants were introduced:
- **Epic:** 18 cards per set (numbered 205-222)
- **Iconic:** 2 cards per set (numbered 223-224)
- Both types feature special treatments and artwork

---

## Rarity System

Disney Lorcana uses **six standard rarity levels** that can be identified by symbols at the bottom-center of each card:

| Rarity | Symbol | Color | Description | Pull Rate (Approximate) |
|--------|--------|-------|-------------|------------------------|
| **Common** | Circle | Gray | Most common cards | ~3 per pack |
| **Uncommon** | Book | White | Moderately common | ~2 per pack |
| **Rare** | Triangle | Bronze | Harder to find | ~1 per pack |
| **Super Rare** | Diamond | Silver | Very rare | ~1 per 3 packs |
| **Legendary** | Pentagon | Gold | Extremely rare | ~1 per 8 packs |
| **Enchanted** | Hexagon | Rainbow | Ultra rare secret cards | ~1 per 96 packs (~1 per 4 boxes) |

### Rarity Notes
- **Common, Uncommon, Rare, Super Rare, and Legendary** cards (1-204) all exist in both foil and non-foil versions
- **Enchanted** cards are foil-only with unique alternate artwork
- Rarity does not affect gameplay - only collectibility and value

---

## Tracking in Blair TCG Tracker

### Current Implementation (Simplified Tracking)

The Blair TCG Tracker currently uses **simplified single-checkbox tracking** for Lorcana:
- Each card has one "Collected" checkbox
- Does NOT separately track foil vs. non-foil variants
- Enchanted cards (205+) are tracked as separate cards

**Rationale:**
- Simplifies collection tracking for casual collectors
- Reduces complexity compared to Pokemon's multi-variant system
- Focuses on card completion rather than variant completion

### Potential Future Enhancement (Full Variant Tracking)

If full variant tracking is requested, the system could be enhanced to track:

**For Main Set Cards (1-204):**
- ☐ **Standard (Non-Foil)** - Base version
- ☐ **Foil** - Shiny version
- Total: 2 checkboxes per card

**For Enchanted Cards (205+):**
- ☐ **Enchanted (Foil Only)** - Single checkbox (no non-foil version exists)
- Total: 1 checkbox per enchanted card

This would match the Pokemon TCG tracking model but adapted for Lorcana's simpler variant structure.

---

## Image Sources

### Dreamborn CDN (Primary)
```
https://cdn.dreamborn.ink/images/en/cards/{dreambornId}
```

**Format:** `{setCode}-{cardNumber}` (e.g., `001-001`, `001-205`, `010-100`)
- Set 1 (The First Chapter): `001-XXX`
- Set 10 (Whispers in the Well): `010-XXX`
- Most reliable source for Lorcana card images

### Lorcania CDN (Secondary)
```
https://lorcania.com/cards/{setNum}/{cardNum}.webp
https://lorcania.com/cards/{setNum}/{cardNum}.jpg
```

**Example:**
- dreambornId `001-050` → `https://lorcania.com/cards/1/50.webp`
- Set number extracted from first 3 digits, card number from last digits

### Local Fallback (Tertiary)
```
./Images/lorcana/{setKey}/{cardNumber}.jpg
./Images/lorcana/{setKey}/{cardNumber}.png
```

---

## Set-Specific Information

### The First Chapter (Set 1)
- **Main Set:** Cards 1-204
- **Enchanted Cards:** Cards 205-216 (12 enchanted)
- **Total:** 216 cards
- **Release:** August 18, 2023
- **Set Code:** `tfc`
- **Enchanted Distribution:** 2 enchanted cards per ink color (6 ink colors × 2 = 12)

### Whispers in the Well (Set 10)
- **Main Set:** Cards 1-204
- **Epic Cards:** Cards 205-222 (18 epic)
- **Enchanted Cards:** Cards 223-240 (18 enchanted)
- **Iconic Cards:** Cards 241-242 (2 iconic)
- **Total:** 242 cards
- **Release:** November 14, 2025
- **Set Code:** `whi`

---

## Foil vs. Non-Foil Differences

### Visual Differences
- **Non-Foil:** Matte finish, no shine
- **Foil:** Metallic/holographic finish that reflects light
- **Enchanted:** Special Inkwash foiling - rainbow effect across entire borderless card

### Gameplay Differences
**None.** Foil and non-foil versions of the same card are functionally identical.

### Value Differences
- Foil cards typically command higher prices in the secondary market
- Enchanted cards are the most valuable due to rarity and unique artwork
- Value varies by character popularity and competitive playability

---

## Sources

This document was compiled from the following reliable sources:

- **[Lorcana Player - Card Rarities & Foils Explained](https://lorcanaplayer.com/lorcana-card-rarities-pull-rates-holo-foils/)** - Comprehensive guide to rarities and variants
- **[Game Rant - All Card Rarity Types Explained](https://gamerant.com/disney-lorcana-all-card-rarity-types-explained/)** - Rarity system overview
- **[TCG Rocks - Card Rarity Explained](https://tcgrocks.com/article/disney-lorcana-card-rarity-explained)** - Pull rates and rarity details
- **[Official Disney Lorcana - Enchanted Cards Revealed](https://www.disneylorcana.com/en-US/news/enchanted-reveal)** - Official information on Enchanted cards
- **[The Gamer - How To Tell The Rarity Of A Card](https://www.thegamer.com/disney-lorcana-rarity-guide-common-uncommon-rare-super-legendary-enchanted-promo/)** - Rarity symbols guide
- **[Lorcana Grimoire - Card Rarity Guide](https://lorcanagrimoire.com/pages/how-to-play/card-rarity-guide/)** - Official-style rarity reference
- **[Screen Rant - All Enchanted Cards From The First Chapter](https://dotesports.com/disney/news/all-disney-lorcana-secret-rare-enchanted-cards-from-the-first-chapter)** - Complete enchanted card list
- **[DigitalTQ - Lorcana TCG Rarity Guide](https://www.digitaltq.com/disney-lorcana-tcg-rarity-guide)** - Rarity and foiling guide
- **[Card Gamer - All Disney Lorcana Enchanted Cards](https://cardgamer.com/guides/all-disney-lorcana-enchanted-cards/)** - Enchanted cards across all sets
- **[great-illuminary/lorcana-data](https://github.com/great-illuminary/lorcana-data)** - Community-maintained Lorcana card data (GitHub)
- **[Lorcana Player - Whispers in the Well Card List](https://lorcanaplayer.com/whispers-in-the-well-card-list-lorcana-set-10/)** - Set 10 complete card list
- **[MushuReport Wiki - Whispers in the Well](https://wiki.mushureport.com/wiki/Whispers_in_the_Well)** - Community wiki resource

---

**Note:** Disney Lorcana and all related content are © Disney and Ravensburger. This reference document is for educational and collection tracking purposes only.
