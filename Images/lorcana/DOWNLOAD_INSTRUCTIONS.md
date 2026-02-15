# How to Download Lorcana Card Images

Since public CDNs are blocking automated downloads, you'll need to manually download images. Here's the easiest way:

## 🚀 Quick Start (5 minutes for testing)

### Step 1: Open Dreamborn.ink
```
https://dreamborn.ink/cards
```

### Step 2: Filter to Whispers in the Well
1. Click "Sets" filter
2. Select "Whispers in the Well"

### Step 3: Download Your First Card
1. Click on card #1 (Baloo - Friend and Guardian)
2. Right-click the card image
3. Select "Save image as..."
4. Navigate to: `blair-pokemon-tracker/Images/lorcana/whispers-in-the-well/`
5. Save as: `001.jpg`

### Step 4: Test It!
1. Refresh your browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Go to Lorcana → Whispers in the Well
3. Card #1 should now show the image instead of a placeholder!

## 📦 Bulk Download (For All 240 Cards)

### Option 1: Manual Download (Most Reliable)
1. Visit https://dreamborn.ink/cards
2. Filter to "Whispers in the Well"
3. For each card 1-240:
   - Click card
   - Right-click image → Save as...
   - Name it: `001.jpg`, `002.jpg`, etc.
   - Save to `whispers-in-the-well/` folder

**Time estimate:** 30-45 minutes for all 240 cards

### Option 2: Browser Console Script (Advanced)
Some users have success using browser developer tools:

1. Open https://dreamborn.ink/cards with Whispers in the Well filtered
2. Open browser console (F12)
3. Try to identify the image URL pattern
4. Use a download manager extension

**Note:** This may not work due to site protections.

### Option 3: Use a Download Manager
Browser extensions like "DownThemAll!" can help:
1. Filter to show all Whispers cards
2. Use extension to detect all images
3. Download with sequential renaming

## 🎯 Priority Cards to Download First

To quickly test if it works, download these main cards first:
- `001.jpg` - Baloo - Friend and Guardian
- `010.jpg` - Test card 10
- `100.jpg` - Test mid-range
- `204.jpg` - Last main set card
- `230.jpg` - Test enchanted card

## 🖼️ Image Quality Recommendations

- **Format:** JPG is fine (smaller file size)
- **Size:** 600-800px wide is optimal
- **Quality:** Medium-high quality (70-80% JPEG)
- **File size:** Aim for 50-150KB per image

## ✅ Verify Your Setup

After downloading images, check:

```bash
# Should show your images:
ls Images/lorcana/whispers-in-the-well/

# Should have files like:
# 001.jpg  002.jpg  003.jpg ... 240.jpg
```

## 🔍 Where to Find Card Images

### Working Sources:
1. **Dreamborn.ink** - https://dreamborn.ink/cards ✅ Best
2. **Lorcania** - https://lorcania.com/cards ✅ Good
3. **Mushu Report** - https://wiki.mushureport.com ✅ OK
4. **TCGPlayer** - https://www.tcgplayer.com/search/lorcana/ ⚠️ May have watermarks

### NOT Working:
- Direct CDN URLs (blocked)
- Most APIs (require authentication)
- Automated scraping (403 errors)

## 💡 Pro Tips

1. **Use Bulk Download Extensions:** Browser extensions can speed this up
2. **Check File Names:** Make sure they're exactly `001.jpg` not `001 (1).jpg`
3. **Consistent Format:** Use all JPG or all PNG, don't mix
4. **Test First:** Download 5-10 cards first to test before doing all 240
5. **Clear Browser Cache:** After adding images, hard refresh (Ctrl+Shift+R)

## 🆘 Troubleshooting

**Images still showing placeholders?**
- Check file names are exactly `001.jpg`, `002.jpg`, etc.
- Hard refresh browser (Ctrl+Shift+R)
- Check browser console (F12) for errors
- Verify files are in correct directory

**Can't save images from Dreamborn?**
- Try a different browser
- Disable browser extensions temporarily
- Try Lorcania instead

## 📧 Need Help?

If you're stuck, open an issue on GitHub with:
- Which browser you're using
- What error you're seeing
- Which step is failing
