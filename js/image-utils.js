// Card image URL builders, CDN fallback handling, and placeholders

// TCGdex series mapping for custom card fallback images
// Maps pokemontcg.io set IDs to their TCGdex series grouping
const PTCG_TO_TCGDEX_SERIES = {
    // WotC Base Set era
    'base1': 'base', 'base2': 'base', 'base3': 'base',
    'base4': 'base', 'base5': 'base', 'base6': 'base', 'basep': 'base',
    // Gym series
    'gym1': 'gym', 'gym2': 'gym',
    // Neo series
    'neo1': 'neo', 'neo2': 'neo', 'neo3': 'neo', 'neo4': 'neo', 'si1': 'neo',
    // e-Card series
    'ecard1': 'ecard', 'ecard2': 'ecard', 'ecard3': 'ecard',
    // EX series
    'ex1': 'ex', 'ex2': 'ex', 'ex3': 'ex', 'ex4': 'ex',
    'ex5': 'ex', 'ex6': 'ex', 'ex7': 'ex', 'ex8': 'ex',
    'ex9': 'ex', 'ex10': 'ex', 'ex11': 'ex', 'ex12': 'ex',
    'ex13': 'ex', 'ex14': 'ex', 'ex15': 'ex', 'ex16': 'ex',
    'np': 'ex',
    // POP series
    'pop1': 'pop', 'pop2': 'pop', 'pop3': 'pop', 'pop4': 'pop',
    'pop5': 'pop', 'pop6': 'pop', 'pop7': 'pop', 'pop8': 'pop', 'pop9': 'pop',
    // Diamond & Pearl series
    'dp1': 'dp', 'dp2': 'dp', 'dp3': 'dp', 'dp4': 'dp',
    'dp5': 'dp', 'dp6': 'dp', 'dp7': 'dp', 'dpp': 'dp',
    // Platinum series
    'pl1': 'pl', 'pl2': 'pl', 'pl3': 'pl', 'pl4': 'pl',
    // HeartGold SoulSilver series
    'hgss1': 'hgss', 'hgss2': 'hgss', 'hgss3': 'hgss', 'hgss4': 'hgss', 'hsp': 'hgss',
    // Black & White series
    'bw1': 'bw', 'bw2': 'bw', 'bw3': 'bw', 'bw4': 'bw',
    'bw5': 'bw', 'bw6': 'bw', 'bw7': 'bw', 'bw8': 'bw',
    'bw9': 'bw', 'bw10': 'bw', 'bw11': 'bw', 'bwp': 'bw',
    // XY series
    'xy0': 'xy', 'xy1': 'xy', 'xy2': 'xy', 'xy3': 'xy',
    'xy4': 'xy', 'xy5': 'xy', 'xy6': 'xy', 'xy7': 'xy',
    'xy8': 'xy', 'xy9': 'xy', 'xy10': 'xy', 'xy11': 'xy', 'xy12': 'xy', 'xyp': 'xy',
    // Sun & Moon series
    'sm1': 'sm', 'sm2': 'sm', 'sm3': 'sm', 'sm35': 'sm', 'sm4': 'sm',
    'sm5': 'sm', 'sm6': 'sm', 'sm7': 'sm', 'sm75': 'sm', 'sm8': 'sm',
    'sm9': 'sm', 'sm10': 'sm', 'sm11': 'sm', 'sm115': 'sm', 'sm12': 'sm',
    'smp': 'sm', 'det1': 'sm', 'g1': 'sm',
    // Sword & Shield series
    'swsh1': 'swsh', 'swsh2': 'swsh', 'swsh3': 'swsh', 'swsh4': 'swsh',
    'swsh5': 'swsh', 'swsh6': 'swsh', 'swsh7': 'swsh', 'swsh8': 'swsh',
    'swsh9': 'swsh', 'swsh10': 'swsh', 'swsh11': 'swsh', 'swsh11tg': 'swsh',
    'swsh12': 'swsh', 'swsh12pt5': 'swsh', 'swsh12pt5gg': 'swsh',
    'swshp': 'swsh', 'cel25': 'swsh', 'cel25c': 'swsh', 'pgo': 'swsh', 'fut20': 'swsh',
    // Scarlet & Violet series
    'sv1': 'sv', 'sv2': 'sv', 'sv3': 'sv', 'sv3pt5': 'sv',
    'sv4': 'sv', 'sv4pt5': 'sv', 'sv5': 'sv', 'sv6': 'sv',
    'sv7': 'sv', 'sv8': 'sv', 'sv8pt5': 'sv', 'svp': 'sv',
    // Mega Evolution series
    'me1': 'me', 'me2': 'me', 'me2pt5': 'me', 'mep': 'me',
    // McDonald's promos
    'mcd14': 'mcd', 'mcd15': 'mcd', 'mcd16': 'mcd', 'mcd17': 'mcd',
    'mcd18': 'mcd', 'mcd19': 'mcd', 'mcd21': 'mcd', 'mcd22': 'mcd',
};

// Set IDs that differ between pokemontcg.io and TCGdex
const PTCG_TO_TCGDEX_SET_ID = {
    'base6': 'lc',  // Legendary Collection
};

// Get TCGdex fallback image URL for a custom card using its apiId
function getCustomCardTcgdexUrl(card) {
    if (!card.apiId) return null;

    const parts = card.apiId.split('-');
    const ptcgSetId = parts.slice(0, -1).join('-');
    const cardNum = parts[parts.length - 1];

    const series = PTCG_TO_TCGDEX_SERIES[ptcgSetId];
    if (!series) return null;

    const tcgdexSetId = PTCG_TO_TCGDEX_SET_ID[ptcgSetId] || ptcgSetId;

    return `https://assets.tcgdex.net/en/${series}/${tcgdexSetId}/${cardNum}/high.png`;
}

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

// Get TCGPlayer URL for a Lorcana card
function getLorcanaTCGPlayerUrl(cardName, setName, cardNumber) {
    let searchQuery = cardName.trim();
    if (cardNumber) {
        searchQuery += ` ${cardNumber}`;
    }
    searchQuery += ` ${setName.trim()}`;
    const encodedQuery = encodeURIComponent(searchQuery);
    return `https://www.tcgplayer.com/search/disney-lorcana/product?q=${encodedQuery}&page=1`;
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
