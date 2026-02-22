# Images Directory

This folder stores all image assets for the Blair TCG Tracker.

## Structure

```
Images/
├── header/          ← Header assets
│   └── logo.svg     ← Main site logo (SVG, rendered via <img> tag)
│
├── lorcana/         ← Local Lorcana card images (fallback)
│   └── {set-key}/
│       ├── 001.jpg
│       └── ...
│
└── cards/           ← Local Pokemon card images (fallback)
    └── {set-key}/
        ├── 001.png
        ├── 002.png
        └── ...
```

## Header Logo (`header/logo.svg`)

The logo is rendered as an `<img>` tag in `index.html`, which means the SVG runs in a restricted context. When editing the logo, it **must** stay SVG 1.1 compatible:

| Do | Don't |
|----|-------|
| `xlink:href` on `<use>` | `href` (SVG 2 only) |
| Hex colors + `opacity` attribute | `rgba()` colors |
| `feFlood`+`feComposite`+`feOffset`+`feGaussianBlur`+`feMerge` | `feDropShadow` (SVG 2 only) |
| `&#x2022;` (XML numeric entity) | `&bull;` (HTML entity) |
| Static elements only | `<animate>` elements |
| Inline styles | CSS custom properties (`var(--x)`) |

The logo link uses `href="./"` (not `href="."` or `href="/"`). The trailing slash matters — without it, browsers resolve `"."` relative to the parent path segment, which breaks on GitHub Pages subpath deployments (e.g., navigates to `lolwtfhunter.github.io` instead of `lolwtfhunter.github.io/blair-tcg-tracker/`).

## Card Image Naming Convention

Card images must follow this naming pattern:

- **Format:** `{3-digit zero-padded number}.png` (Pokemon) or `.jpg` (Lorcana)
- **Examples:** `001.png`, `025.png`, `175.png`

The app automatically looks for card images at:
```
Images/cards/{set-key}/{card-number}.png     (Pokemon)
Images/lorcana/{set-key}/{card-number}.jpg   (Lorcana)
```

Local images are a fallback — the app tries multiple CDN sources first (see README.md for the full fallback chain).

## Adding Card Images

1. Get the card artwork as a `.png` or `.jpg` file
2. Name it with the 3-digit card number (e.g., `001.png`)
3. Place it in the correct set folder (e.g., `Images/cards/prismatic-evolutions/`)
4. The app will pick it up automatically — no code changes needed

## Recommended Image Size

- **Card images:** 400×560px (3:4 aspect ratio) works well
- **Smaller is fine** — 200×280px keeps file sizes small for mobile
- PNG with transparency or JPG both work
