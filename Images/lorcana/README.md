# Lorcana Card Images

This directory contains local card images for Disney Lorcana TCG sets.

## 📁 Directory Structure

```
Images/lorcana/
├── first-chapter/          # The First Chapter (Set 1) cards
├── whispers-in-the-well/   # Whispers in the Well (Set 10) cards
└── logos/                  # Set logos for buttons
```

## 🖼️ Adding Card Images

### Image Naming Convention

Card images should be named with **3-digit zero-padded numbers**:
- `001.jpg` - Card #1
- `002.jpg` - Card #2
- ...
- `230.jpg` - Card #230 (enchanted cards)

### Supported Formats
- `.jpg` (recommended)
- `.png`
- `.webp`

### How to Get Card Images

**Option 1: Download from Dreamborn.ink** (Recommended)
1. Visit https://dreamborn.ink/cards
2. Filter by set (e.g., "Whispers in the Well")
3. Open each card
4. Right-click the card image → "Save image as..."
5. Save to the appropriate folder with the correct number (e.g., `001.jpg`)

**Option 2: Download from Lorcania**
1. Visit https://lorcania.com/cards
2. Browse cards by set
3. Save images with proper numbering

**Option 3: Use the Mushu Report Wiki**
1. Visit https://wiki.mushureport.com/wiki/Gallery:Whispers_in_the_Well_Card_Gallery
2. Download card images from the gallery
3. Rename to match the numbering format

### Quick Reference - Whispers in the Well

**Set Info:**
- Set Code: `whi`
- Set Number: 10
- Total Cards: 240 (204 main + 36 special)
- Card Numbers:
  - Main Set: 1-204
  - Special Rarity: 205-242

**First 10 Cards:**
1. Baloo - Friend and Guardian
2. Dr. Facilier - Ambitious Schemer
3. Goofy - Everyday Hero
4. Jafar - Mastermind Magician
5. Maximus - Relentless Pursuer
6. Moana - Voyager of Oceania
7. Robin Hood - Prince of Thieves
8. Scar - Treacherous Tyrant
9. Simba - Heir to Pride Rock
10. Ursula - Power Hungry

## 🎨 Adding Set Logos

Place set logos in the `logos/` folder:
- `first-chapter.png` - The First Chapter logo
- `whispers-in-the-well.png` - Whispers in the Well logo
- `lorcana.png` - Generic Lorcana logo (for custom sets)

**Recommended logo size:** 200-400px wide, transparent background (PNG)

## 🔧 Testing Your Images

After adding images:
1. Refresh your browser (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
2. Navigate to the Lorcana section
3. Select the set
4. Images should now display instead of placeholders

## ⚠️ Important Notes

- **Do not commit** card images to git (they are large files and may have copyright concerns)
- Images are in `.gitignore` and won't be tracked
- Keep images locally for personal use
- If images still don't load, check browser console (F12) for errors

## 📝 Bulk Download Script

If you want to automate downloading (requires manual setup):

```bash
#!/bin/bash
# Example: Download from a CDN if you find a working URL pattern
# for i in {1..204}; do
#   num=$(printf "%03d" $i)
#   wget "https://example.com/cards/010-$num.jpg" -O "whispers-in-the-well/$num.jpg"
# done
```

---

**Need Help?** Check the main README or open an issue on GitHub.
