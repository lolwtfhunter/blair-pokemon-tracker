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

// Maps set keys to their wiki-style display names for logo URL construction
const LORCANA_SET_WIKI_NAMES = {
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

// ==================== LORCANA LOGO CDN PRE-FETCH ====================
// Resolves direct CDN URLs for set logos via wiki APIs.
// MediaWiki Special:FilePath returns 302 redirects, which can fail in <img>
// tags on some browsers/wiki configurations. The imageinfo API returns the
// actual static CDN URL directly, bypassing redirect issues.

// Cache: { setKey: directCdnUrl }
const _lorcanaLogoUrlCache = {};
let _lorcanaLogosFetched = false;

// Fetch direct CDN URLs for Lorcana set logos from wiki APIs.
// Tries Fandom wiki first (CORS-enabled), then Mushu Report, then Disney wiki.
async function fetchLorcanaSetLogos() {
    if (_lorcanaLogosFetched) return;
    _lorcanaLogosFetched = true;
    _logoDebug('fetchLorcanaSetLogos: starting API calls');

    const wikiNames = LORCANA_SET_WIKI_NAMES;
    const setEntries = Object.entries(wikiNames);

    // --- Fandom wiki API (supports CORS via origin=*) ---
    try {
        const titles = [];
        const setKeysByTitle = {};

        setEntries.forEach(([setKey, wikiName]) => {
            // Try both capitalization patterns for the logo filename
            const t1 = 'File:' + wikiName + '_Logo.png';
            const t2 = 'File:' + wikiName + '_logo.png';
            titles.push(t1, t2);
            setKeysByTitle[t1] = setKey;
            setKeysByTitle[t2] = setKey;
        });

        const apiUrl = 'https://lorcana.fandom.com/api.php?action=query'
            + '&titles=' + encodeURIComponent(titles.join('|'))
            + '&prop=imageinfo&iiprop=url&format=json&origin=*';

        const resp = await fetch(apiUrl, { referrerPolicy: 'no-referrer' });
        if (resp.ok) {
            const data = await resp.json();
            const pages = data?.query?.pages || {};

            // Build normalization map (MediaWiki may normalize underscores/case)
            const normalizedMap = {};
            if (data?.query?.normalized) {
                data.query.normalized.forEach(n => { normalizedMap[n.to] = n.from; });
            }

            for (const pageId in pages) {
                const page = pages[pageId];
                if (page.imageinfo?.[0]?.url) {
                    const normalizedTitle = page.title;
                    const originalTitle = normalizedMap[normalizedTitle] || normalizedTitle;
                    const setKey = setKeysByTitle[originalTitle] || setKeysByTitle[normalizedTitle];
                    if (setKey && !_lorcanaLogoUrlCache[setKey]) {
                        _lorcanaLogoUrlCache[setKey] = page.imageinfo[0].url;
                    }
                }
            }
        }
    } catch (e) {
        _logoDebug('Fandom API error: ' + e.message);
    }
    _logoDebug('After Fandom API: ' + Object.keys(_lorcanaLogoUrlCache).length + ' cached');

    // --- Mushu Report wiki API (for any sets not resolved above) ---
    const missing = setEntries.filter(([k]) => !_lorcanaLogoUrlCache[k]);
    if (missing.length === 0) return;

    try {
        const titles = [];
        const setKeysByTitle = {};

        missing.forEach(([setKey, wikiName]) => {
            // Try both capitalization patterns (like the Fandom API call)
            const t1 = 'File:' + wikiName + '_Logo.png';
            const t2 = 'File:' + wikiName + '_logo.png';
            titles.push(t1, t2);
            setKeysByTitle[t1] = setKey;
            setKeysByTitle[t2] = setKey;
        });

        // Standard MediaWiki API path when wiki is at /wiki/
        const apiUrl = 'https://wiki.mushureport.com/w/api.php?action=query'
            + '&titles=' + encodeURIComponent(titles.join('|'))
            + '&prop=imageinfo&iiprop=url&format=json&origin=*';

        const resp = await fetch(apiUrl, { referrerPolicy: 'no-referrer' });
        if (resp.ok) {
            const data = await resp.json();
            const pages = data?.query?.pages || {};

            const normalizedMap = {};
            if (data?.query?.normalized) {
                data.query.normalized.forEach(n => { normalizedMap[n.to] = n.from; });
            }

            for (const pageId in pages) {
                const page = pages[pageId];
                if (page.imageinfo?.[0]?.url) {
                    const normalizedTitle = page.title;
                    const originalTitle = normalizedMap[normalizedTitle] || normalizedTitle;
                    const setKey = setKeysByTitle[originalTitle] || setKeysByTitle[normalizedTitle];
                    if (setKey && !_lorcanaLogoUrlCache[setKey]) {
                        _lorcanaLogoUrlCache[setKey] = page.imageinfo[0].url;
                    }
                }
            }
        }
    } catch (e) {
        _logoDebug('Mushu Report API error: ' + e.message);
    }
    _logoDebug('After Mushu Report API: ' + Object.keys(_lorcanaLogoUrlCache).length + ' cached');

    // --- Disney Fandom wiki API (has Lorcana images in their Category:Disney_Lorcana_images) ---
    const missing2 = setEntries.filter(([k]) => !_lorcanaLogoUrlCache[k]);
    if (missing2.length === 0) return;

    try {
        const titles = [];
        const setKeysByTitle = {};

        missing2.forEach(([setKey, wikiName]) => {
            const t1 = 'File:' + wikiName + '_Logo.png';
            const t2 = 'File:' + wikiName + '_logo.png';
            titles.push(t1, t2);
            setKeysByTitle[t1] = setKey;
            setKeysByTitle[t2] = setKey;
        });

        const apiUrl = 'https://disney.fandom.com/api.php?action=query'
            + '&titles=' + encodeURIComponent(titles.join('|'))
            + '&prop=imageinfo&iiprop=url&format=json&origin=*';

        const resp = await fetch(apiUrl, { referrerPolicy: 'no-referrer' });
        if (resp.ok) {
            const data = await resp.json();
            const pages = data?.query?.pages || {};

            const normalizedMap = {};
            if (data?.query?.normalized) {
                data.query.normalized.forEach(n => { normalizedMap[n.to] = n.from; });
            }

            for (const pageId in pages) {
                const page = pages[pageId];
                if (page.imageinfo?.[0]?.url) {
                    const normalizedTitle = page.title;
                    const originalTitle = normalizedMap[normalizedTitle] || normalizedTitle;
                    const setKey = setKeysByTitle[originalTitle] || setKeysByTitle[normalizedTitle];
                    if (setKey && !_lorcanaLogoUrlCache[setKey]) {
                        _lorcanaLogoUrlCache[setKey] = page.imageinfo[0].url;
                    }
                }
            }
        }
    } catch (e) {
        _logoDebug('Disney wiki API error: ' + e.message);
    }
    _logoDebug('After Disney wiki API: ' + Object.keys(_lorcanaLogoUrlCache).length + ' cached');
    // Log which sets got CDN URLs
    var cachedSets = Object.keys(_lorcanaLogoUrlCache);
    if (cachedSets.length > 0) {
        cachedSets.forEach(function(k) {
            var u = _lorcanaLogoUrlCache[k];
            _logoDebug('  cached: ' + k + ' -> ' + (u.length > 60 ? u.substring(0, 57) + '...' : u));
        });
    }
}

// Pre-computed Fandom CDN URLs (MD5-hashed paths).
// These bypass both the API call and Special:FilePath redirects.
// Constructed from: MD5(filename) → /images/{hash[0]}/{hash[0:2]}/{filename}/revision/latest
// Two patterns per set: _Logo.png (uppercase) and _logo.png (lowercase).
const LORCANA_FANDOM_CDN_LOGOS = {
    'first-chapter':         ['d/db/The_First_Chapter_Logo.png', 'f/fd/The_First_Chapter_logo.png'],
    'rise-of-the-floodborn': ['5/5b/Rise_of_the_Floodborn_Logo.png', '3/39/Rise_of_the_Floodborn_logo.png'],
    'into-the-inklands':     ['6/6d/Into_the_Inklands_Logo.png', '5/59/Into_the_Inklands_logo.png'],
    'ursulas-return':        ["3/3b/Ursula%27s_Return_Logo.png", "7/7a/Ursula%27s_Return_logo.png"],
    'shimmering-skies':      ['b/bf/Shimmering_Skies_Logo.png', 'a/ad/Shimmering_Skies_logo.png'],
    'azurite-sea':           ['6/6c/Azurite_Sea_Logo.png', '9/98/Azurite_Sea_logo.png'],
    'archazias-island':      ["3/38/Archazia%27s_Island_Logo.png", "3/38/Archazia%27s_Island_logo.png"],
    'reign-of-jafar':        ['e/e0/Reign_of_Jafar_Logo.png', '1/1c/Reign_of_Jafar_logo.png'],
    'fabled':                ['c/c4/Fabled_Logo.png', '7/76/Fabled_logo.png'],
    'whispers-in-the-well':  ['4/4d/Whispers_in_the_Well_Logo.png', '1/1c/Whispers_in_the_Well_logo.png'],
    'winterspell':           ['8/84/Winterspell_Logo.png', 'f/f7/Winterspell_logo.png']
};

// ==================== LOGO DEBUG PANEL ====================
// Activate by adding ?logodebug to the URL (e.g. mysite.com/?logodebug)
const _logoDebugEnabled = (typeof location !== 'undefined') && location.search.indexOf('logodebug') !== -1;
const _logoDebugLog = [];

function _logoDebug(msg) {
    const ts = new Date().toISOString().substr(11, 12);
    const line = '[' + ts + '] ' + msg;
    _logoDebugLog.push(line);
    if (_logoDebugEnabled) {
        console.log('[logo] ' + msg);
        var panel = document.getElementById('logo-debug-panel');
        if (panel) {
            var pre = panel.querySelector('pre');
            if (pre) {
                pre.textContent = _logoDebugLog.join('\n');
                pre.scrollTop = pre.scrollHeight;
            }
        }
    }
}

function _initLogoDebugPanel() {
    if (!_logoDebugEnabled) return;
    var panel = document.createElement('div');
    panel.id = 'logo-debug-panel';
    panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
        '<b>Logo Debug</b>' +
        '<button onclick="navigator.clipboard.writeText(document.querySelector(\'#logo-debug-panel pre\').textContent).then(function(){alert(\'Copied!\')})" ' +
        'style="font-size:12px;padding:2px 8px;cursor:pointer">Copy</button></div>' +
        '<pre style="margin:0;white-space:pre-wrap;word-break:break-all;max-height:300px;overflow:auto;font-size:11px;line-height:1.3"></pre>';
    panel.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#111;color:#0f0;' +
        'padding:8px;font-family:monospace;font-size:12px;max-height:350px;border-top:2px solid #0f0;';
    document.body.appendChild(panel);
    _logoDebug('Debug panel initialized');
}

// ==================== LOGO URL BUILDING ====================

// Build ordered list of candidate logo URLs for a set.
function getLorcanaRemoteLogoUrls(setKey) {
    var urls = [];
    var wikiName = LORCANA_SET_WIKI_NAMES[setKey];

    // 1. Local file
    urls.push('./Images/lorcana/logos/' + setKey + '.png');

    // 2. Wiki API-resolved CDN URL (populated by fetchLorcanaSetLogos)
    if (_lorcanaLogoUrlCache[setKey]) {
        urls.push(_lorcanaLogoUrlCache[setKey]);
    }

    // 3. Pre-computed Fandom CDN URLs
    var cdnPaths = LORCANA_FANDOM_CDN_LOGOS[setKey];
    if (cdnPaths) {
        cdnPaths.forEach(function(p) {
            urls.push('https://static.wikia.nocookie.net/lorcana/images/' + p + '/revision/latest');
        });
    }

    // 4. Mushu Report Special:FilePath
    if (wikiName) {
        urls.push('https://wiki.mushureport.com/wiki/Special:FilePath/' + wikiName + '_logo.png');
    }

    // 5. Lorcana Fandom Special:FilePath
    if (wikiName) {
        urls.push('https://lorcana.fandom.com/wiki/Special:FilePath/' + wikiName + '_Logo.png');
    }

    return urls;
}

// ==================== LOGO UPGRADE (SEQUENTIAL) ====================

// Try to upgrade one SVG logo to a real image by testing URLs sequentially.
// Sequential avoids flooding mobile browsers with dozens of parallel requests.
function tryUpgradeLorcanaLogo(img) {
    var setKey = img.getAttribute('data-logo-set');
    if (!setKey) return;

    var urls = getLorcanaRemoteLogoUrls(setKey);
    _logoDebug(setKey + ': trying ' + urls.length + ' URLs');
    var idx = 0;

    function tryNext() {
        if (idx >= urls.length) {
            _logoDebug(setKey + ': ALL FAILED — keeping SVG');
            return;
        }
        var url = urls[idx++];
        var shortUrl = url.length > 70 ? url.substring(0, 67) + '...' : url;
        _logoDebug(setKey + ': [' + idx + '/' + urls.length + '] trying ' + shortUrl);
        var testImg = new Image();
        testImg.referrerPolicy = 'no-referrer';
        testImg.onload = function() {
            if (testImg.naturalWidth > 10 && testImg.naturalHeight > 10) {
                _logoDebug(setKey + ': SUCCESS (' + testImg.naturalWidth + 'x' + testImg.naturalHeight + ') ' + shortUrl);
                img.src = url;
                img.referrerPolicy = 'no-referrer';
            } else {
                _logoDebug(setKey + ': too small (' + testImg.naturalWidth + 'x' + testImg.naturalHeight + ') ' + shortUrl);
                tryNext();
            }
        };
        testImg.onerror = function() {
            _logoDebug(setKey + ': FAILED ' + shortUrl);
            tryNext();
        };
        testImg.src = url;
    }

    tryNext();
}

// Re-trigger logo upgrade for all visible SVG logos (called after API fetch completes).
function upgradeLorcanaLogos() {
    var cached = Object.keys(_lorcanaLogoUrlCache).length;
    _logoDebug('API fetch done — ' + cached + ' CDN URLs cached. Re-checking logos...');
    document.querySelectorAll('.set-btn-logo[data-logo-set]').forEach(function(img) {
        // Only re-try if still showing the SVG fallback
        if (img.src && img.src.indexOf('data:image/svg') === 0) {
            tryUpgradeLorcanaLogo(img);
        }
    });
}

// Set-specific theme colors used for SVG logos and button gradients
const LORCANA_SET_STYLES = {
    'first-chapter':         { color: '#c9a84c', label: 'I' },
    'rise-of-the-floodborn': { color: '#3a7bd5', label: 'II' },
    'into-the-inklands':     { color: '#2ecc71', label: 'III' },
    'ursulas-return':        { color: '#9b59b6', label: 'IV' },
    'shimmering-skies':      { color: '#00b4d8', label: 'V' },
    'azurite-sea':           { color: '#0077b6', label: 'VI' },
    'archazias-island':      { color: '#e67e22', label: 'VII' },
    'reign-of-jafar':        { color: '#d4a017', label: 'VIII' },
    'fabled':                { color: '#c0392b', label: 'F' },
    'whispers-in-the-well':  { color: '#7b5ea7', label: 'IX' },
    'winterspell':           { color: '#27ae60', label: 'X' }
};

// Generate inline SVG data URI as last-resort fallback logo.
// Uses a double-hexagon (Lorcana's signature shape) with set-specific colors.
function getLorcanaSetLogoSvg(setKey) {
    const setStyles = LORCANA_SET_STYLES;
    const style = setStyles[setKey] || { color: '#c9a84c', label: '?' };
    const c = style.color;
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
        '<polygon points="50,3 95,28 95,72 50,97 5,72 5,28" fill="none" stroke="' + c + '" stroke-width="3"/>' +
        '<polygon points="50,15 82,34 82,66 50,85 18,66 18,34" fill="none" stroke="' + c + '" stroke-width="1.5" opacity="0.4"/>' +
        '<text x="50" y="58" text-anchor="middle" fill="' + c + '" font-family="Georgia,serif" font-size="28" font-weight="bold">' + style.label + '</text>' +
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
    const fallbacks = JSON.parse(img.getAttribute('data-lorcana-fallbacks') || '[]');
    const idx = parseInt(img.getAttribute('data-lorcana-fallback-idx') || '0') + 1;

    if (idx < fallbacks.length) {
        img.setAttribute('data-lorcana-fallback-idx', idx);
        img.src = fallbacks[idx];
    } else {
        img.onerror = null;
        showPlaceholder(img);
    }
}

// Render Lorcana set buttons
function renderLorcanaSetButtons() {
    _initLogoDebugPanel();
    _logoDebug('renderLorcanaSetButtons called');
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

        // Try to upgrade SVG to real logo in background
        const logoImg = btn.querySelector('.set-btn-logo');
        if (logoImg) tryUpgradeLorcanaLogo(logoImg);
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
