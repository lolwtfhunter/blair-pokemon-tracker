// Card image URL builders, CDN fallback handling, and placeholders

// Get card image URL from Pokemon TCG API (pokemontcg.io)
function getCardImageUrl(setKey, cardNumber, imageId) {
    // Celebrations Classic Collection cards use cel25c with original set numbering
    if (setKey === 'celebrations' && imageId) {
        return `https://images.pokemontcg.io/cel25c/${imageId}.png`;
    }
    const apiSetId = TCG_API_SET_IDS[setKey];
    if (apiSetId) {
        return `https://images.pokemontcg.io/${apiSetId}/${cardNumber}.png`;
    }
    return null;
}

// Get card image URL from TCGdex API (assets.tcgdex.net)
function getTcgdexImageUrl(setKey, cardNumber, imageId) {
    // Celebrations Classic Collection uses cel25c with original numbering
    if (setKey === 'celebrations' && imageId) {
        return `https://assets.tcgdex.net/en/swsh/cel25c/${imageId}/high.png`;
    }
    const info = TCGDEX_SET_IDS[setKey];
    if (info) {
        return `https://assets.tcgdex.net/en/${info.series}/${info.set}/${cardNumber}/high.png`;
    }
    return null;
}

// Get TCGPlayer URL for a card with enhanced search parameters
function getTCGPlayerUrl(cardName, setName, setCode, cardNumber, variantType) {
    // Clean up the card name and set name for better search results
    const cleanCardName = cardName.trim();
    const cleanSetName = setName.trim();

    // Build search query with card name, number, and set name
    // Note: Variant types (Holo/Reverse Holo) are not included in search
    // because TCGPlayer has filters for these within the card details page
    let searchQuery = cleanCardName;

    // Add card number if provided (format: "123/456" or just "123")
    if (cardNumber) {
        searchQuery += ` ${cardNumber}`;
    }

    // Add set name
    searchQuery += ` ${cleanSetName}`;

    const encodedQuery = encodeURIComponent(searchQuery);

    // TCGPlayer search URL format with specific parameters
    return `https://www.tcgplayer.com/search/pokemon/product?q=${encodedQuery}&page=1`;
}

// Handle card image load errors with cascading fallback:
// 1. pokemontcg.io CDN -> 2. TCGdex CDN -> 3. Local image -> 4. Placeholder
function handleImgError(img) {
    const tcgdexSrc = img.getAttribute('data-tcgdex-src');
    const localSrc = img.getAttribute('data-local-src');

    if (tcgdexSrc && img.src.indexOf('images.pokemontcg.io') !== -1) {
        // pokemontcg.io failed, try TCGdex
        img.onerror = function() {
            // TCGdex also failed, try local
            if (localSrc) {
                img.onerror = function() {
                    // All sources failed, show placeholder
                    showPlaceholder(img);
                };
                img.src = localSrc;
            } else {
                showPlaceholder(img);
            }
        };
        img.src = tcgdexSrc;
    } else if (localSrc && img.src.indexOf('assets.tcgdex.net') !== -1) {
        // TCGdex failed, try local
        img.onerror = function() {
            showPlaceholder(img);
        };
        img.src = localSrc;
    } else {
        // Local or unknown source failed, show placeholder
        showPlaceholder(img);
    }
}

function showPlaceholder(img) {
    const name = img.getAttribute('data-card-name');
    const number = img.getAttribute('data-card-number');
    const rarity = img.getAttribute('data-card-rarity');
    img.parentElement.innerHTML = generatePlaceholder(name, number, rarity);
}

// Generate a styled placeholder when no card image is available
function generatePlaceholder(name, number, rarity) {
    const num = String(number).padStart(3, '0');
    const colors = {
        'common': '#888',
        'uncommon': '#4a9eff',
        'rare': '#9d4aff',
        'ex': '#ff6b6b',
        'illustration-rare': '#764ba2',
        'special-illustration-rare': '#f5576c',
        'ultra-rare': '#00f2fe',
        'hyper-rare': '#fee140',
        'double-rare': '#fed6e3',
        'secret': '#ffd700',
        'ace-spec': '#ffd700',
        'trainer': '#ff9500',
        'energy': '#48c774'
    };
    const color = colors[rarity] || '#888';
    const escapedName = name.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
    return `<div class="card-img-placeholder" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;width:100%;height:100%;background:rgba(255,255,255,0.03);border:1px dashed rgba(255,255,255,0.15);border-radius:6px;">
        <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="opacity:0.4">
            <circle cx="50" cy="50" r="45" fill="none" stroke="${color}" stroke-width="4"/>
            <path d="M5 50 H95" stroke="${color}" stroke-width="4"/>
            <circle cx="50" cy="50" r="12" fill="none" stroke="${color}" stroke-width="4"/>
        </svg>
        <span style="font-size:0.7rem;opacity:0.5;font-weight:600">#${num}</span>
        <span style="font-size:0.55rem;opacity:0.3;text-align:center;padding:0 4px;line-height:1.2">${escapedName}</span>
    </div>`;
}
