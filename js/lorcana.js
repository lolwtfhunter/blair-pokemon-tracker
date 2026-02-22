// Collection progress initialization and Lorcana UI functions

// Initialize collection progress
function initializeProgress() {
    const saved = localStorage.getItem('pokemonVariantProgress');
    if (saved) {
        collectionProgress = JSON.parse(saved);
    } else {
        collectionProgress = {};
        Object.keys(cardSets).forEach(setKey => {
            collectionProgress[setKey] = {};
        });
    }
    // Also ensure custom set keys exist in progress
    Object.keys(customCardSets).forEach(setKey => {
        const csKey = 'custom-' + setKey;
        if (!collectionProgress[csKey]) {
            collectionProgress[csKey] = {};
        }
    });
    // Also ensure Lorcana set keys exist in progress
    Object.keys(lorcanaCardSets).forEach(setKey => {
        if (!collectionProgress[setKey]) {
            collectionProgress[setKey] = {};
        }
    });
}

// ==================== LORCANA FUNCTIONS ====================

// ==================== LORCANA LOGO DISCOVERY ====================
// Discovers set images from Fandom wiki article pages via MediaWiki API,
// then loads them as blobs to bypass CDN hotlink protection.
// Falls back to polished SVG logos if discovery or loading fails.

// Maps set keys to Fandom article titles for image discovery
const LORCANA_SET_ARTICLE_NAMES = {
    'first-chapter':         'The_First_Chapter',
    'rise-of-the-floodborn': 'Rise_of_the_Floodborn',
    'into-the-inklands':     'Into_the_Inklands',
    'ursulas-return':        "Ursula's_Return",
    'shimmering-skies':      'Shimmering_Skies',
    'azurite-sea':           'Azurite_Sea',
    'archazias-island':      "Archazia's_Island",
    'reign-of-jafar':        'Reign_of_Jafar',
    'fabled':                'Fabled',
    'whispers-in-the-well':  'Whispers_in_the_Well',
    'winterspell':           'Winterspell'
};

// Cache of discovered CDN URLs: { setKey: url }
const _lorcanaLogoUrlCache = {};
let _lorcanaLogosFetched = false;

// Normalize a string for fuzzy matching: strip apostrophes/quotes, underscores→spaces, lowercase.
function _normForMatch(s) {
    return s.replace(/_/g, ' ').replace(/['''\u2018\u2019\u0027]/g, '').toLowerCase().trim();
}

// Query Fandom article pages for logo images, then resolve CDN URLs.
// Only uses images with "logo" in the filename to avoid product photos.
// Handles apostrophe variations (Ursula's Return, Archazia's Island).
async function fetchLorcanaSetLogos() {
    if (_lorcanaLogosFetched) return;
    _lorcanaLogosFetched = true;

    var setKeys = Object.keys(LORCANA_SET_ARTICLE_NAMES);
    var fandomApi = 'https://lorcana.fandom.com/api.php';

    try {
        // Step 1: Query images on all set article pages (one API call)
        var articleTitles = setKeys.map(function(k) { return LORCANA_SET_ARTICLE_NAMES[k]; }).join('|');
        var artResp = await fetch(fandomApi + '?action=query&titles=' + encodeURIComponent(articleTitles) +
            '&prop=images&imlimit=500&format=json&origin=*', { referrerPolicy: 'no-referrer' });
        if (!artResp.ok) return;

        var artData = await artResp.json();
        var artPages = artData && artData.query && artData.query.pages;
        if (!artPages) return;

        // Step 2: For each set's article page, find the best logo image.
        // Build a reverse map: normalized article title → setKey
        var titleToSet = {};
        setKeys.forEach(function(k) {
            titleToSet[_normForMatch(LORCANA_SET_ARTICLE_NAMES[k])] = k;
        });

        var bestMatches = {}; // setKey → File:title
        Object.keys(artPages).forEach(function(pid) {
            var page = artPages[pid];
            if (!page.title || !page.images) return;
            var setKey = titleToSet[_normForMatch(page.title)];
            if (!setKey) return;

            var setNameNorm = _normForMatch(LORCANA_SET_ARTICLE_NAMES[setKey]);
            var logoMatch = null;
            var nameMatch = null;

            page.images.forEach(function(img) {
                var t = (img.title || '').replace(/^File:/i, '');
                var tNorm = _normForMatch(t);

                // Skip obvious non-logo files (products, merchandise, etc.)
                if (tNorm.indexOf('deck box') !== -1 || tNorm.indexOf('sleeves') !== -1 ||
                    tNorm.indexOf('playmat') !== -1 || tNorm.indexOf('portfolio') !== -1 ||
                    tNorm.indexOf('booster') !== -1 || tNorm.indexOf('trove') !== -1 ||
                    tNorm.indexOf('starter') !== -1 || tNorm.indexOf('blister') !== -1 ||
                    tNorm.indexOf('gift set') !== -1 || tNorm.indexOf('display') !== -1 ||
                    tNorm.indexOf('pack art') !== -1 || tNorm.indexOf('bundle') !== -1 ||
                    tNorm.indexOf('kit') !== -1 || tNorm.indexOf('exclusive') !== -1 ||
                    tNorm.indexOf('card back') !== -1 || tNorm.indexOf('site-logo') !== -1) return;

                // Priority 1: file has "logo" AND set name
                if (tNorm.indexOf('logo') !== -1 && tNorm.indexOf(setNameNorm) !== -1) {
                    if (!logoMatch || t.toLowerCase().indexOf('.png') !== -1) {
                        logoMatch = img.title;
                    }
                }
                // Priority 2: filename matches set name (fallback)
                if (!nameMatch && tNorm.indexOf(setNameNorm) !== -1) {
                    nameMatch = img.title;
                }
            });

            bestMatches[setKey] = logoMatch || nameMatch;
        });

        // Step 3: Fetch CDN URLs for discovered logo files (one API call)
        var fileTitles = [];
        setKeys.forEach(function(k) {
            if (bestMatches[k]) fileTitles.push(bestMatches[k]);
        });
        if (fileTitles.length === 0) return;

        var infoResp = await fetch(fandomApi + '?action=query&titles=' +
            encodeURIComponent(fileTitles.join('|')) +
            '&prop=imageinfo&iiprop=url&format=json&origin=*', { referrerPolicy: 'no-referrer' });
        if (!infoResp.ok) return;

        var infoData = await infoResp.json();
        var infoPages = infoData && infoData.query && infoData.query.pages;
        if (!infoPages) return;

        // Step 4: Map resolved URLs back to set keys
        Object.keys(infoPages).forEach(function(pid) {
            var page = infoPages[pid];
            if (!page.imageinfo || !page.imageinfo[0] || !page.imageinfo[0].url) return;
            var title = (page.title || '').replace(/^File:/i, '');
            setKeys.forEach(function(k) {
                if (bestMatches[k] && bestMatches[k].replace(/^File:/i, '') === title) {
                    _lorcanaLogoUrlCache[k] = page.imageinfo[0].url;
                }
            });
        });
    } catch (e) { /* discovery failed — SVGs will be used */ }
}

// Upgrade one SVG logo to a real image via fetch→blob.
// Blob approach bypasses CDN hotlink/referrer restrictions.
function tryUpgradeLorcanaLogo(img) {
    var setKey = img.getAttribute('data-logo-set');
    if (!setKey) return;

    var url = _lorcanaLogoUrlCache[setKey];
    if (!url) return; // No discovered URL — keep SVG

    var svgSrc = img.src;
    fetch(url, { referrerPolicy: 'no-referrer' })
        .then(function(resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return resp.blob();
        })
        .then(function(blob) {
            if (blob.size < 200) throw new Error('too small');
            var blobUrl = URL.createObjectURL(blob);
            img.onload = function() {
                if (img.naturalWidth > 10 && img.naturalHeight > 10) {
                    img.onload = null;
                    img.onerror = null;
                    img.classList.add('logo-loaded');
                } else {
                    URL.revokeObjectURL(blobUrl);
                    img.src = svgSrc;
                }
            };
            img.onerror = function() {
                URL.revokeObjectURL(blobUrl);
                img.src = svgSrc;
                img.classList.remove('logo-loaded');
            };
            img.src = blobUrl;
        })
        .catch(function() { /* keep SVG */ });
}

// ==================== LORCANA SET STYLES & SVG LOGOS ====================

// Set-specific theme colors used for SVG logos and button gradients
// Each set has a primary color, a secondary/accent, and a roman numeral label
const LORCANA_SET_STYLES = {
    'first-chapter':         { color: '#c9a84c', color2: '#8b6914', label: 'I' },
    'rise-of-the-floodborn': { color: '#3a7bd5', color2: '#1a4f9e', label: 'II' },
    'into-the-inklands':     { color: '#2ecc71', color2: '#1a8a4a', label: 'III' },
    'ursulas-return':        { color: '#9b59b6', color2: '#6c3483', label: 'IV' },
    'shimmering-skies':      { color: '#00b4d8', color2: '#006d8a', label: 'V' },
    'azurite-sea':           { color: '#0077b6', color2: '#004a73', label: 'VI' },
    'archazias-island':      { color: '#e67e22', color2: '#a55a0a', label: 'VII' },
    'reign-of-jafar':        { color: '#d4a017', color2: '#8b6914', label: 'VIII' },
    'fabled':                { color: '#c0392b', color2: '#7b241c', label: 'F' },
    'whispers-in-the-well':  { color: '#7b5ea7', color2: '#4a3366', label: 'IX' },
    'winterspell':           { color: '#27ae60', color2: '#1a7a42', label: 'X' }
};

// Display names for SVG fallback logos (shorter versions for clean rendering)
const LORCANA_SET_SHORT_NAMES = {
    'first-chapter':         'The First\nChapter',
    'rise-of-the-floodborn': 'Rise of the\nFloodborn',
    'into-the-inklands':     'Into the\nInklands',
    'ursulas-return':        "Ursula's\nReturn",
    'shimmering-skies':      'Shimmering\nSkies',
    'azurite-sea':           'Azurite\nSea',
    'archazias-island':      "Archazia's\nIsland",
    'reign-of-jafar':        'Reign of\nJafar',
    'fabled':                'Fabled',
    'whispers-in-the-well':  'Whispers in\nthe Well',
    'winterspell':           'Winterspell'
};

// Generate inline SVG data URI for set logo.
// Creates a transparent-background title card with ornamental styling.
// Blends seamlessly with any background color.
function getLorcanaSetLogoSvg(setKey) {
    const style = LORCANA_SET_STYLES[setKey] || { color: '#c9a84c', color2: '#8b6914', label: '?' };
    const c1 = style.color;
    const c2 = style.color2 || c1;
    const lbl = style.label;
    const nameLines = (LORCANA_SET_SHORT_NAMES[setKey] || setKey).split('\n');
    var id = setKey.replace(/[^a-z]/g, '');

    // Build set name text elements (centered in viewBox)
    var nameText = '';
    if (nameLines.length === 1) {
        nameText = '<text x="150" y="52" text-anchor="middle" fill="' + c1 + '" font-family="Georgia,Times,serif" font-size="22" font-weight="bold" letter-spacing="2">' + nameLines[0] + '</text>';
    } else {
        nameText = '<text x="150" y="40" text-anchor="middle" fill="' + c1 + '" font-family="Georgia,Times,serif" font-size="18" font-weight="bold" letter-spacing="2">' + nameLines[0] + '</text>' +
            '<text x="150" y="62" text-anchor="middle" fill="' + c1 + '" font-family="Georgia,Times,serif" font-size="18" font-weight="bold" letter-spacing="2">' + nameLines[1] + '</text>';
    }

    var centerY = nameLines.length === 1 ? 52 : 51;
    var ornY = nameLines.length === 1 ? 65 : 77;

    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100">' +
        '<defs>' +
        '<linearGradient id="tg' + id + '" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0%" stop-color="' + c1 + '" stop-opacity="0"/>' +
        '<stop offset="30%" stop-color="' + c1 + '" stop-opacity="0.6"/>' +
        '<stop offset="50%" stop-color="' + c1 + '" stop-opacity="0.8"/>' +
        '<stop offset="70%" stop-color="' + c1 + '" stop-opacity="0.6"/>' +
        '<stop offset="100%" stop-color="' + c1 + '" stop-opacity="0"/>' +
        '</linearGradient>' +
        '</defs>' +
        // Top ornamental line (fades at edges)
        '<line x1="30" y1="18" x2="270" y2="18" stroke="url(#tg' + id + ')" stroke-width="1"/>' +
        // Roman numeral at top
        '<text x="150" y="14" text-anchor="middle" fill="' + c1 + '" font-family="Georgia,Times,serif" font-size="9" letter-spacing="3" opacity="0.7">' + lbl + '</text>' +
        // Left ornamental diamond
        '<polygon points="42,' + centerY + ' 48,' + (centerY - 5) + ' 54,' + centerY + ' 48,' + (centerY + 5) + '" fill="' + c1 + '" opacity="0.5"/>' +
        // Right ornamental diamond
        '<polygon points="246,' + centerY + ' 252,' + (centerY - 5) + ' 258,' + centerY + ' 252,' + (centerY + 5) + '" fill="' + c1 + '" opacity="0.5"/>' +
        // Set name text
        nameText +
        // Bottom ornamental line (fades at edges)
        '<line x1="60" y1="' + ornY + '" x2="240" y2="' + ornY + '" stroke="url(#tg' + id + ')" stroke-width="1"/>' +
        // Bottom center diamond accent
        '<polygon points="147,' + ornY + ' 150,' + (ornY - 3) + ' 153,' + ornY + ' 150,' + (ornY + 3) + '" fill="' + c1 + '" opacity="0.6"/>' +
        // Disney Lorcana subtitle
        '<text x="150" y="' + (ornY + 12) + '" text-anchor="middle" fill="' + c2 + '" font-family="Georgia,Times,serif" font-size="7" letter-spacing="4" opacity="0.5">DISNEY LORCANA</text>' +
        '</svg>';
    return 'data:image/svg+xml;base64,' + btoa(svg);
}

// ==================== LORCAST CDN INTEGRATION ====================
// Fetches card image URLs from the Lorcast API (api.lorcast.com).
// Dreamborn CDN may not have all sets; Lorcast provides AVIF images via
// cards.lorcast.io with UUIDs that must be looked up via the API.

// Cache: { setKey: { cardNumber: imageUrl } }
const _lorcastImageCache = {};

// In-flight promise deduplication: { setKey: Promise }
const _lorcastFetchPromises = {};

// Fetch image URLs from Lorcast API for a Lorcana set (cached after first call).
// Concurrent calls for the same set share one in-flight request.
async function fetchLorcastImageUrls(setKey) {
    if (_lorcastImageCache[setKey]) return _lorcastImageCache[setKey];

    // Return existing in-flight promise if one exists for this set
    if (_lorcastFetchPromises[setKey]) return _lorcastFetchPromises[setKey];

    const lorcastCode = typeof LORCAST_SET_CODES !== 'undefined' && LORCAST_SET_CODES[setKey];
    if (!lorcastCode) {
        _lorcastImageCache[setKey] = {};
        return {};
    }

    _lorcastFetchPromises[setKey] = (async () => {
        try {
            const resp = await fetch(`https://api.lorcast.com/v0/sets/${lorcastCode}/cards`);
            if (!resp.ok) {
                _lorcastImageCache[setKey] = {};
                return {};
            }

            const data = await resp.json();
            const cards = data.results || (Array.isArray(data) ? data : []);

            const imageMap = {};
            cards.forEach(card => {
                const num = parseInt(card.collector_number);
                const url = card.image_uris?.digital?.normal
                         || card.image_uris?.digital?.large
                         || card.image_uris?.digital?.small;
                if (num && url) imageMap[num] = url;
            });

            _lorcastImageCache[setKey] = imageMap;
            return imageMap;
        } catch (e) {
            _lorcastImageCache[setKey] = {};
            return {};
        } finally {
            delete _lorcastFetchPromises[setKey];
        }
    })();

    return _lorcastFetchPromises[setKey];
}

// ==================== CARD IMAGE URL BUILDER ====================

// Build ordered list of image URLs to try for a Lorcana card.
// Tiers: Dreamborn CDN -> Lorcast CDN (cached) -> local files
function buildLorcanaImageUrls(dreambornId, setKey, cardNumber) {
    const urls = [];
    const paddedNumber = String(cardNumber).padStart(3, '0');

    // Tier 1: Dreamborn CDN (extensionless - returns JFIF/JPEG)
    if (dreambornId) {
        urls.push(`https://cdn.dreamborn.ink/images/en/cards/${dreambornId}`);
    }

    // Tier 2: Lorcast CDN (AVIF, fetched from API and cached)
    const lorcastUrl = _lorcastImageCache[setKey]?.[cardNumber];
    if (lorcastUrl) {
        urls.push(lorcastUrl);
    }

    // Tier 3: Local files
    urls.push(`./Images/lorcana/${setKey}/${paddedNumber}.jpg`);
    urls.push(`./Images/lorcana/${setKey}/${paddedNumber}.png`);
    urls.push(`./Images/lorcana/${setKey}/${paddedNumber}.webp`);

    return urls;
}

// Get primary image URL for a Lorcana card
function getLorcanaCardImageUrl(card, setKey) {
    const urls = buildLorcanaImageUrls(card.dreambornId || '', setKey, card.number);
    return urls.length > 0 ? urls[0] : null;
}

// Handle Lorcana image loading from pre-baked data attributes.
// Reads fallback URLs from data-lorcana-fallbacks JSON attribute.
function tryNextLorcanaImageFromData(img) {
    var fallbacks = JSON.parse(img.getAttribute('data-lorcana-fallbacks') || '[]');
    var idx = parseInt(img.getAttribute('data-lorcana-fallback-idx') || '0') + 1;
    var cardNum = img.getAttribute('data-lorcana-card-number') || '?';
    var setKey = img.getAttribute('data-lorcana-set-key') || '?';

    if (idx < fallbacks.length) {
        img.setAttribute('data-lorcana-fallback-idx', idx);
        var url = fallbacks[idx];
        img.src = url;
    } else {
        img.onerror = null;
        showPlaceholder(img);
    }
}

// Render Lorcana set buttons
function renderLorcanaSetButtons() {
    const container = document.getElementById('lorcanaSetButtons');
    if (!container) return;
    container.innerHTML = '';

    // Sort sets by release date (newest first)
    const setKeys = Object.keys(lorcanaCardSets).sort((a, b) => {
        const aDate = lorcanaCardSets[a].releaseDate ? new Date(lorcanaCardSets[a].releaseDate + 'T00:00:00').getTime() : 0;
        const bDate = lorcanaCardSets[b].releaseDate ? new Date(lorcanaCardSets[b].releaseDate + 'T00:00:00').getTime() : 0;
        return bDate - aDate;
    });
    if (setKeys.length === 0) return;

    setKeys.forEach(setKey => {
        const setData = lorcanaCardSets[setKey];
        const btn = document.createElement('button');
        btn.className = 'set-btn' + (setKey === currentLorcanaSet ? ' active' : '');
        btn.setAttribute('data-lorcana-set-key', setKey);

        // Theme gradient via CSS custom properties (consistent with all tabs)
        const setStyle = LORCANA_SET_STYLES[setKey];
        if (setStyle) {
            btn.style.setProperty('--set-accent', setStyle.color + '25');
            btn.style.setProperty('--set-border', setStyle.color + '55');
        }

        // Format release date
        let dateStr = '';
        if (setData.releaseDate) {
            const d = new Date(setData.releaseDate + 'T00:00:00');
            dateStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }

        // Calculate progress
        const progress = getLorcanaSetProgress(setKey);

        // Lorcana logos — start with SVG, upgrade to real logo in background
        const svgFallback = getLorcanaSetLogoSvg(setKey);

        btn.innerHTML = `
            <div class="set-btn-logo-wrapper">
                <img src="${svgFallback}" alt="${setData.displayName}" class="set-btn-logo"
                     data-logo-set="${setKey}" referrerpolicy="no-referrer">
            </div>
            <div class="set-btn-name">${setData.displayName}</div>
            ${dateStr ? `<div class="set-release-date">${dateStr}</div>` : ''}
            <div class="set-btn-stats">${progress.collected}/${progress.total} (${progress.percentage}%)</div>
            <div class="set-btn-progress">
                <div class="set-btn-progress-fill" style="width: ${progress.percentage}%"></div>
            </div>
        `;

        btn.onclick = () => switchLorcanaSet(setKey);
        container.appendChild(btn);
    });

    // Discover set images from Fandom wiki, then upgrade SVGs to real images.
    // Buttons render instantly with SVGs; real images replace them in background.
    fetchLorcanaSetLogos().catch(function() {}).then(function() {
        container.querySelectorAll('.set-btn-logo[data-logo-set]').forEach(function(img) {
            tryUpgradeLorcanaLogo(img);
        });
    });
}

// Switch active Lorcana set
function switchLorcanaSet(setKey) {
    // If clicking the currently active set, deselect it (toggle off)
    if (currentLorcanaSet === setKey) {
        currentLorcanaSet = null;

        // Deactivate all Lorcana set buttons
        document.querySelectorAll('.set-btn[data-lorcana-set-key]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById('lorcanaSetButtons').classList.remove('has-selection');

        // Hide all Lorcana set sections
        document.querySelectorAll('#lorcana-content .set-section').forEach(section => {
            section.classList.remove('active');
        });

        return;
    }

    // Select the new set
    currentLorcanaSet = setKey;

    // Update all Lorcana set buttons
    document.querySelectorAll('.set-btn[data-lorcana-set-key]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lorcana-set-key') === setKey);
    });
    document.getElementById('lorcanaSetButtons').classList.add('has-selection');

    // Update sections
    document.querySelectorAll('#lorcana-content .set-section').forEach(section => {
        section.classList.toggle('active', section.id === setKey);
    });

    if (!lorcanaCardSets[setKey]) return;
    renderLorcanaCards(setKey);
    updateLorcanaSetButtonProgress();

    // Render rarity filter buttons
    const setData = lorcanaCardSets[setKey];
    if (setData && setData.cards) {
        renderRarityFilters(setKey, setData.cards, LORCANA_RARITY_DISPLAY_NAMES);
    }

    // Load and display market prices
    ensurePricesLoaded(setKey).then(() => {
        fillPricesInGrid(setKey);
        updateSetValues();
    });
}

// Render Lorcana cards for a set
async function renderLorcanaCards(setKey) {
    const setData = lorcanaCardSets[setKey];
    const grid = document.getElementById(`${setKey}-grid`);
    if (!grid) return;

    // Await Lorcast image URLs so they're in cache when building fallback chains.
    // Fast on subsequent renders (cached) or if pre-warm completed.
    await fetchLorcastImageUrls(setKey);

    grid.innerHTML = '';

    setData.cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.setAttribute('data-card-number', card.number);
        cardEl.setAttribute('data-card-name', card.name.toLowerCase());
        cardEl.setAttribute('data-rarity', (card.rarity || 'common').toLowerCase());

        const cardProgress = collectionProgress[setKey]?.[card.number] || {};
        const allCollected = cardProgress['single'] || false;

        cardEl.classList.toggle('completed', allCollected);

        const rarityClass = `rarity-${(card.rarity || 'common').replace(/_/g, '-')}`;

        // Click-to-expand modal (same pattern as Pokemon TCG cards)
        cardEl.style.cursor = 'pointer';
        cardEl.onclick = function(e) {
            if (e.target.tagName === 'INPUT' ||
                e.target.tagName === 'LABEL' ||
                e.target.closest('.single-variant') ||
                e.target.closest('.tcgplayer-link')) {
                return;
            }
            openCardModal(setKey, card.number);
        };

        // Lorcana uses single variant for now
        const isChecked = cardProgress['single'] || false;
        const variantHTML = `
            <div class="single-variant ${isChecked ? 'checked' : ''}" onclick="toggleLorcanaVariant('${setKey}', ${card.number}, 'single')">
                <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="event.stopPropagation(); toggleLorcanaVariant('${setKey}', ${card.number}, 'single')">
                <label>&#10003; Collected</label>
            </div>
        `;

        // Build full fallback URL list and pre-bake into data attributes
        const fallbackUrls = buildLorcanaImageUrls(card.dreambornId || '', setKey, card.number);
        const imgUrl = fallbackUrls[0] || '';
        const displayNumber = String(card.number).padStart(3, '0');
        const escapedName = card.name.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        const fallbacksJson = JSON.stringify(fallbackUrls).replace(/"/g, '&quot;');

        // TCGPlayer link
        const tcgplayerUrl = getLorcanaTCGPlayerUrl(card.name, setData.name, card.number);

        cardEl.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${imgUrl}"
                     alt="${escapedName}"
                     loading="lazy"
                     data-card-name="${escapedName}"
                     data-card-number="${displayNumber}"
                     data-card-rarity="${card.rarity}"
                     data-lorcana-card-number="${card.number}"
                     data-lorcana-dreamborn-id="${card.dreambornId || ''}"
                     data-lorcana-set-key="${setKey}"
                     data-lorcana-fallbacks="${fallbacksJson}"
                     data-lorcana-fallback-idx="0"
                     onerror="tryNextLorcanaImageFromData(this)">
            </div>
            <div class="card-header">
                <div class="card-info">
                    <div class="card-number">#${displayNumber}</div>
                    <div class="card-name">${card.name}</div>
                    <span class="rarity-badge ${rarityClass}">${getLorcanaRarityDisplay(card.rarity)}</span>
                    <span class="price-tag" data-price-card="${setKey}-${card.number}"></span>
                </div>
                <a href="${tcgplayerUrl}" target="_blank" class="tcgplayer-link" title="Search on TCGPlayer" onclick="event.stopPropagation();">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M19 19H5V5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                    </svg>
                </a>
            </div>
            <div class="variants-section">
                <div class="variants-title">STATUS:</div>
                ${variantHTML}
                ${allCollected ? `<div class="completed-lock"><svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg>Complete</div>` : ''}
            </div>
        `;

        grid.appendChild(cardEl);
    });

    applyLorcanaFiltersAndSearch(setKey);
}

// Toggle Lorcana variant
function toggleLorcanaVariant(setKey, cardNumber, variant) {
    if (!collectionProgress[setKey]) {
        collectionProgress[setKey] = {};
    }
    if (!collectionProgress[setKey][cardNumber]) {
        collectionProgress[setKey][cardNumber] = {};
    }

    const current = collectionProgress[setKey][cardNumber][variant] || false;
    collectionProgress[setKey][cardNumber][variant] = !current;

    saveProgress();
    renderLorcanaCards(setKey);
    updateLorcanaSetButtonProgress();
    updateSetValues();
}

// Get Lorcana set progress
function getLorcanaSetProgress(setKey) {
    const setData = lorcanaCardSets[setKey];
    if (!setData) return { collected: 0, total: 0, percentage: '0.0' };

    let totalVariants = 0;
    let collectedVariants = 0;

    setData.cards.forEach(card => {
        const cardProgress = collectionProgress[setKey]?.[card.number] || {};
        // Lorcana uses single variant
        totalVariants++;
        if (cardProgress['single']) collectedVariants++;
    });

    const percentage = totalVariants > 0 ? ((collectedVariants / totalVariants) * 100).toFixed(1) : '0.0';
    return { collected: collectedVariants, total: totalVariants, percentage };
}

// Update Lorcana set button progress
function updateLorcanaSetButtonProgress() {
    document.querySelectorAll('.set-btn[data-lorcana-set-key]').forEach(btn => {
        const setKey = btn.getAttribute('data-lorcana-set-key');
        const progress = getLorcanaSetProgress(setKey);
        const fill = btn.querySelector('.set-btn-progress-fill');
        const stats = btn.querySelector('.set-btn-stats');
        if (fill) fill.style.width = progress.percentage + '%';
        if (stats) stats.textContent = `${progress.collected}/${progress.total} (${progress.percentage}%)`;
    });
}

// Store active Lorcana filters and searches
let activeLorcanaFilters = {};
let activeLorcanaSearches = {};

// Filter Lorcana cards
function filterLorcanaCards(setKey, filter) {
    activeLorcanaFilters[setKey] = filter;

    const section = document.getElementById(setKey);
    if (!section) return;

    section.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === filter);
    });

    applyLorcanaFiltersAndSearch(setKey);
}

// Search Lorcana cards
function searchLorcanaCards(setKey, query) {
    activeLorcanaSearches[setKey] = query.toLowerCase().trim();
    applyLorcanaFiltersAndSearch(setKey);
}

// Clear Lorcana search
function clearLorcanaSearch(setKey) {
    const section = document.getElementById(setKey);
    if (!section) return;

    const searchInput = section.querySelector('.search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    activeLorcanaSearches[setKey] = '';
    applyLorcanaFiltersAndSearch(setKey);
}

// Apply all Lorcana filters (completion + rarity + search) combined
function applyLorcanaFiltersAndSearch(setKey) {
    const section = document.getElementById(setKey);
    if (!section) return;

    const filter = activeLorcanaFilters[setKey] || 'all';
    const searchQuery = activeLorcanaSearches[setKey] || '';
    const raritySet = activeRarityFilters[setKey];
    const hasRarityFilter = raritySet && raritySet.size > 0;

    const cards = section.querySelectorAll('.card');
    cards.forEach(card => {
        let show = true;

        // Completion filter
        if (filter === 'incomplete' && card.classList.contains('completed')) {
            show = false;
        } else if (filter === 'complete' && !card.classList.contains('completed')) {
            show = false;
        }

        // Rarity filter
        if (show && hasRarityFilter) {
            const cardRarity = card.getAttribute('data-rarity');
            if (!raritySet.has(cardRarity)) {
                show = false;
            }
        }

        // Search filter
        if (show && searchQuery) {
            const cardName = card.getAttribute('data-card-name') || '';
            const cardNumber = card.getAttribute('data-card-number') || '';
            if (!cardName.includes(searchQuery) && !cardNumber.includes(searchQuery)) {
                show = false;
            }
        }

        card.style.display = show ? '' : 'none';
    });
}

// Initialize Lorcana progress
function initializeLorcanaProgress() {
    Object.keys(lorcanaCardSets).forEach(setKey => {
        if (!collectionProgress[setKey]) {
            collectionProgress[setKey] = {};
        }
    });
}

// Create DOM elements for Lorcana set grids (dynamically from loaded data)
function initLorcanaSetGrids() {
    const container = document.getElementById('lorcana-content');
    if (!container) return;

    // Remove any existing set-section elements (avoid duplicates on re-init)
    container.querySelectorAll('.set-section').forEach(el => el.remove());

    Object.keys(lorcanaCardSets).forEach(setKey => {
        const section = document.createElement('div');
        section.id = setKey;
        section.className = 'set-section';

        section.innerHTML = `
            <div class="card-controls">
                <div class="filter-buttons">
                    <button class="filter-btn active" onclick="filterLorcanaCards('${setKey}', 'all')">All</button>
                    <button class="filter-btn" onclick="filterLorcanaCards('${setKey}', 'incomplete')">Incomplete</button>
                    <button class="filter-btn" onclick="filterLorcanaCards('${setKey}', 'complete')">Complete</button>
                </div>
                <div class="search-container">
                    <input type="text" class="search-input" placeholder="Search cards..." oninput="searchLorcanaCards('${setKey}', this.value)" data-set="${setKey}">
                    <button class="search-clear" onclick="clearLorcanaSearch('${setKey}')">×</button>
                </div>
                <div class="rarity-filters" id="${setKey}-rarity-filters"></div>
            </div>
            <div class="card-grid" id="${setKey}-grid"></div>
        `;

        container.appendChild(section);
    });
}
