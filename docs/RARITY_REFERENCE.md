# Pokemon TCG Rarity System Reference

## Supported Rarities in Tracker

### ✅ Currently Implemented

| Rarity | Variants | Used For |
|--------|----------|----------|
| **common** | Regular + Reverse Holo | Basic Pokemon, common cards |
| **uncommon** | Regular + Reverse Holo | Mid-tier evolutions, some trainers |
| **rare** | Holo + Reverse Holo | Final evolutions, strong Pokemon |
| **ex** | Single | Pokemon ex cards |
| **secret** | Single | Cards numbered beyond set (e.g., 160/159) |
| **trainer** | Regular + Reverse Holo | Trainer cards |
| **energy** | Regular + Reverse Holo | Special energy cards |
| **rare-holo** | Single | Inherently holo rare cards (WotC/e-card era) |
| **rare-holo-gx** | Single | GX holo cards (Sun & Moon era) |

### 🔮 Future-Proof Rarities (Ready to Use)

These rarities are already coded into the tracker and will automatically work with single checkbox when used:

| Rarity Code | Full Name | Example |
|-------------|-----------|---------|
| **illustration-rare** | Illustration Rare (IR) | Special alternate art |
| **special-illustration-rare** | Special Illustration Rare (SIR) | Ultra premium alt art |
| **ultra-rare** | Ultra Rare (UR) | Full art Pokemon/trainers |
| **hyper-rare** | Hyper Rare (HR) | Rainbow/gold cards |
| **double-rare** | Double Rare (★★) | Textured ultra rares |
| **ace-spec** | ACE SPEC | Powerful one-per-deck trainers |
| **radiant** | Radiant Rare | Shiny legendary (one per deck) |
| **amazing-rare** | Amazing Rare | Rainbow-colored rares |
| **shiny-rare** | Shiny Rare | Shiny Pokemon variants |
| **trainer-ultra-rare** | Trainer Ultra Rare | Full art trainers |
| **gold-secret** | Gold Secret Rare | Gold-bordered secrets |
| **promo** | Promo | Promotional cards |

---

## Special Set Variants

### Prismatic Evolutions
- **Common/Uncommon Pokemon**: Regular + Reverse + Poké Ball + Master Ball (4 variants)
- **Rare Pokemon**: Holo + Reverse + Poké Ball + Master Ball (4 variants)
- **Trainers**: Regular + Reverse + Poké Ball (3 variants)
- **Ultra Rares**: Single checkbox

### Standard Sets
- **Common/Uncommon**: Regular + Reverse Holo
- **Rare**: Holo + Reverse Holo
- **All Ultra Rares**: Single checkbox

---

## How to Add New Rarities

### In card-data.json:
```json
{
  "number": 123,
  "name": "Charizard",
  "rarity": "illustration-rare",
  "type": "pokemon"
}
```

### Supported Rarity Values:
- `common`, `uncommon`, `rare`
- `rare-holo`, `rare-holo-gx`
- `ex`, `secret`
- `illustration-rare`, `special-illustration-rare`
- `ultra-rare`, `hyper-rare`, `double-rare`
- `ace-spec`, `radiant`, `amazing-rare`
- `shiny-rare`, `trainer-ultra-rare`
- `gold-secret`, `promo`

The tracker will automatically:
1. Apply correct variant rules
2. Display proper rarity badge
3. Track checkboxes appropriately

---

## Variant Calculation Examples

```
Caterpie (common) → Regular + Reverse Holo = 2 variants
Butterfree (rare) → Holo + Reverse Holo = 2 variants
Pikachu ex (ex) → Single = 1 variant
Secret Rare (secret) → Single = 1 variant

Prismatic Evolutions:
- Eevee (common) → Regular + Reverse + PokéBall + MasterBall = 4 variants
- Vaporeon (rare) → Holo + Reverse + PokéBall + MasterBall = 4 variants
- Professor's Research (trainer) → Regular + Reverse + PokéBall = 3 variants
- Leafeon ex (ex) → Single = 1 variant
```

---

## Total Variant Counts

| Set | Commons | Uncommons | Rares | Total Variants |
|-----|---------|-----------|-------|----------------|
| Journey Together | 10 | 67 | 48 | 333 |
| Prismatic Evolutions | 23 | 40 | 45 | 501 |
| Phantasmal Flames | 57 | 10 | 17 | 214 |
| Destined Rivals | 159 | 23 | 0 | 426 |
| Ascended Heroes | 179 | 38 | 0 | 512 |

**TOTAL: 1,986 variants across 1,076 cards**

---

## Journey Together Secret Rare Breakdown

The Journey Together set has proper secret rare classifications:

| Range | Rarity Type | Count | Examples |
|-------|-------------|-------|----------|
| #160-170 | Illustration Rare | 11 | Maractus, Articuno, Wailord |
| #171-178 | Special Illustration Rare | 8 | Volcanion ex, Lillie's Clefairy ex |
| #179-181 | Trainer Ultra Rare | 3 | Brock's Scouting, Iris's Fighting Spirit |
| #182-185 | Ultra Rare | 4 | Volcanion ex FA, Iono's Bellibolt ex FA |
| #186-190 | Hyper Rare | 5 | Rainbow trainers, Gold Spiky Energy |

**Each type has unique gradient styling in the UI!**

---

## Custom Set Variant Rules

Custom set cards use computed variants based on multiple factors (via `getCustomCardVariants`):

### Single Variant (one "Collected" checkbox)
| Condition | Reason |
|-----------|--------|
| Explicit `card.variants` array | WotC holo/non-holo pairs (uses those variant keys) |
| `region === 'JP'` | Japanese exclusives don't track reverse holos |
| `SINGLE_VARIANT_RARITIES` | Promos, ultra rares, illustration rares, etc. |
| `rare-holo` / `rare-holo-gx` | Inherently holo (non-holo is separate entry) |
| `energy` | Basic energies |
| `releaseDate < '2002/06'` | Pre-reverse-holo era (before Expedition Base Set) |
| Set origin contains: McDonald's, Southern Islands, POP Series, Best Of, Celebrations, Black Star | Special sets without reverse holos |

### Multi-Variant
| Rarity | Variants | Example |
|--------|----------|---------|
| `rare` (2002+, main set) | Holo + Reverse Holo | Butterfree from EX Ruby & Sapphire |
| `common` / `uncommon` (2002+, main set) | Regular + Reverse Holo | Misty's Psyduck from Destined Rivals |

### Key Differences from Regular Sets
- Custom sets span all eras (1996-2026), so release date gating is essential
- Cards from special products (McDonald's, promo boxes) are always single variant
- JP-exclusive cards are always single variant
- WotC holo/non-holo pairs use explicit `variants` arrays in the data

---

## Notes for Future Sets

1. Always check official Pokemon TCG sources for accurate rarities
2. Illustration Rares (IR) and Special Illustration Rares (SIR) became common in Scarlet & Violet era
3. Some sets may have unique variant rules (like Prismatic Evolutions)
4. ACE SPEC cards are powerful trainers limited to one per deck
5. Radiant Pokemon are shiny legendaries, also limited to one per deck

