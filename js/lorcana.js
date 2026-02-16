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

// Build ordered list of logo URLs to try for a Lorcana set.
// Tries: local file -> Mushu Report wiki -> Lorcana Fandom wiki -> inline SVG
function getLorcanaSetLogoUrls(setKey) {
    const urls = [];

    // 1. Local file (user can manually add logos)
    urls.push(`./Images/lorcana/logos/${setKey}.png`);

    // 2. Mushu Report wiki (public Lorcana wiki with set logos)
    const wikiName = LORCANA_SET_WIKI_NAMES[setKey];
    if (wikiName) {
        urls.push(`https://wiki.mushureport.com/wiki/Special:FilePath/${wikiName}_logo.png`);
    }

    // 3. Lorcana Fandom wiki
    if (wikiName) {
        urls.push(`https://lorcana.fandom.com/wiki/Special:FilePath/${wikiName}_Logo.png`);
    }

    // 4. Inline SVG fallback (always works, no network needed)
    urls.push(getLorcanaSetLogoSvg(setKey));

    return urls;
}

// Handle Lorcana set logo loading with cascading fallback
function tryNextLorcanaLogo(img) {
    const setKey = img.getAttribute('data-logo-set');
    const idx = parseInt(img.getAttribute('data-logo-idx') || '0') + 1;
    const urls = getLorcanaSetLogoUrls(setKey);

    if (idx < urls.length) {
        img.setAttribute('data-logo-idx', idx);
        img.src = urls[idx];
    } else {
        // All sources exhausted - show emoji fallback
        img.onerror = null;
        img.style.display = 'none';
        if (img.nextElementSibling) img.nextElementSibling.style.display = '';
    }
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

// Fetch image URLs from Lorcast API for a Lorcana set (cached after first call).
async function fetchLorcastImageUrls(setKey) {
    if (_lorcastImageCache[setKey]) return _lorcastImageCache[setKey];

    const lorcastCode = typeof LORCAST_SET_CODES !== 'undefined' && LORCAST_SET_CODES[setKey];
    if (!lorcastCode) {
        _lorcastImageCache[setKey] = {};
        return {};
    }

    try {
        lorcanaDebugLog(`Lorcast: fetching images for "${setKey}" (code ${lorcastCode})...`);
        const resp = await fetch(`https://api.lorcast.com/v0/sets/${lorcastCode}/cards`);
        if (!resp.ok) {
            lorcanaDebugLog(`Lorcast API returned ${resp.status}`);
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
        lorcanaDebugLog(`Lorcast: cached ${Object.keys(imageMap).length} image URLs for "${setKey}"`);

        return imageMap;
    } catch (e) {
        lorcanaDebugLog(`Lorcast fetch error: ${e.message}`);
        _lorcastImageCache[setKey] = {};
        return {};
    }
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

// Handle Lorcana image loading with cascading fallback
function tryNextLorcanaImage(img, card, setKey, attemptIndex = 0) {
    const urls = buildLorcanaImageUrls(card.dreambornId || '', setKey, card.number);

    if (attemptIndex < urls.length) {
        const url = urls[attemptIndex];
        lorcanaDebugLog(`Card #${card.number} trying [${attemptIndex}]: ${url.substring(0, 80)}`);
        img.src = url;
        img.onerror = function() {
            lorcanaDebugLog(`Card #${card.number} FAILED [${attemptIndex}]: ${url.substring(0, 80)}`);
            tryNextLorcanaImage(img, card, setKey, attemptIndex + 1);
        };
    } else {
        lorcanaDebugLog(`Card #${card.number} ALL FAILED - showing placeholder`);
        showPlaceholder(img);
    }
}

// ==================== IMAGE DEBUG PANEL ====================
// On-screen debug log for mobile (iOS Safari has no easy console)

let _lorcanaDebugLines = [];
let _lorcanaDebugPanel = null;
let _lorcanaDebugEnabled = false;

function lorcanaDebugLog(msg) {
    if (!_lorcanaDebugEnabled) return;
    const ts = new Date().toLocaleTimeString('en-US', {hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit'});
    const line = `[${ts}] ${msg}`;
    _lorcanaDebugLines.push(line);
    if (_lorcanaDebugLines.length > 200) _lorcanaDebugLines.shift();
    console.log('[LorcanaDebug]', msg);
    if (_lorcanaDebugPanel) {
        _lorcanaDebugPanel.querySelector('.debug-content').textContent = _lorcanaDebugLines.slice(-50).join('\n');
        _lorcanaDebugPanel.querySelector('.debug-content').scrollTop = 999999;
    }
}

// Run a quick CDN diagnostic and show results on screen.
// Activated by the bug icon button in the Lorcana tab header,
// or from console: debugLorcanaImages()
function debugLorcanaImages() {
    _lorcanaDebugEnabled = true;

    // Create or show debug panel
    if (!_lorcanaDebugPanel) {
        _lorcanaDebugPanel = document.createElement('div');
        _lorcanaDebugPanel.id = 'lorcana-debug-panel';
        _lorcanaDebugPanel.innerHTML = `
            <div style="position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#1a1a2e;border-top:2px solid #0f3460;max-height:40vh;overflow:hidden;display:flex;flex-direction:column;font-family:monospace;font-size:11px;">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#0f3460;color:#e0e0e0;">
                    <span style="font-weight:bold;">Lorcana Image Debug</span>
                    <div>
                        <button onclick="runLorcanaCdnTest()" style="background:#16213e;color:#e94560;border:1px solid #e94560;padding:2px 8px;border-radius:4px;margin-right:4px;font-size:11px;">Test CDN</button>
                        <button onclick="document.getElementById('lorcana-debug-panel').style.display='none'" style="background:#16213e;color:#aaa;border:1px solid #aaa;padding:2px 8px;border-radius:4px;font-size:11px;">Close</button>
                    </div>
                </div>
                <pre class="debug-content" style="padding:8px 10px;margin:0;overflow-y:auto;color:#a0ffa0;white-space:pre-wrap;word-break:break-all;flex:1;">Debug panel active. Tap "Test CDN" or load a Lorcana set.\n</pre>
            </div>`;
        document.body.appendChild(_lorcanaDebugPanel);
    } else {
        _lorcanaDebugPanel.style.display = '';
    }

    lorcanaDebugLog('Debug panel activated');
    lorcanaDebugLog(`User agent: ${navigator.userAgent.substring(0, 100)}`);
    lorcanaDebugLog(`Current Lorcana set: ${currentLorcanaSet || 'none'}`);

    // Show loaded set info
    Object.keys(lorcanaCardSets).forEach(key => {
        const s = lorcanaCardSets[key];
        const firstCard = s.cards && s.cards[0];
        lorcanaDebugLog(`Set "${key}": ${s.cards ? s.cards.length : 0} cards, first dreambornId: ${firstCard ? firstCard.dreambornId : 'N/A'}`);
    });
}

// Test CDN sources with diagnostic image loads
function runLorcanaCdnTest() {
    lorcanaDebugLog('--- CDN TEST START ---');

    // Test Dreamborn URLs
    const testUrls = [
        { label: 'Dreamborn Set 1 Card 1', url: 'https://cdn.dreamborn.ink/images/en/cards/001-001' },
        { label: 'Dreamborn Set 10 Card 1', url: 'https://cdn.dreamborn.ink/images/en/cards/010-001' },
    ];

    testUrls.forEach(test => {
        const img = new Image();
        const startTime = Date.now();
        img.onload = function() {
            lorcanaDebugLog(`✅ ${test.label}: LOADED (${Date.now() - startTime}ms, ${img.naturalWidth}x${img.naturalHeight})`);
        };
        img.onerror = function() {
            lorcanaDebugLog(`❌ ${test.label}: FAILED (${Date.now() - startTime}ms)`);
        };
        img.src = test.url + '?_t=' + Date.now();
    });

    // Test Lorcast API
    lorcanaDebugLog('Testing Lorcast API...');
    fetch('https://api.lorcast.com/v0/cards/10/1')
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        })
        .then(card => {
            const imgUrl = card.image_uris?.digital?.normal || 'none';
            lorcanaDebugLog(`✅ Lorcast API: card="${card.name}", img=${imgUrl.substring(0, 70)}...`);
            // Test if the Lorcast image URL actually loads
            if (imgUrl !== 'none') {
                const img = new Image();
                const t = Date.now();
                img.onload = () => lorcanaDebugLog(`✅ Lorcast CDN image: LOADED (${Date.now() - t}ms, ${img.naturalWidth}x${img.naturalHeight})`);
                img.onerror = () => lorcanaDebugLog(`❌ Lorcast CDN image: FAILED (${Date.now() - t}ms)`);
                img.src = imgUrl;
            }
        })
        .catch(e => {
            lorcanaDebugLog(`❌ Lorcast API: ${e.message}`);
        });

    // Show Lorcast cache status
    const cacheKeys = Object.keys(_lorcastImageCache);
    lorcanaDebugLog(`Lorcast cache: ${cacheKeys.length} sets cached`);
    cacheKeys.forEach(k => {
        lorcanaDebugLog(`  "${k}": ${Object.keys(_lorcastImageCache[k]).length} image URLs`);
    });
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

        // Lorcana logos - cascading fallback: local -> wiki CDNs -> inline SVG
        const logoUrls = getLorcanaSetLogoUrls(setKey);

        btn.innerHTML = `
            <div class="set-btn-logo-wrapper">
                <img src="${logoUrls[0]}" alt="${setData.displayName}" class="set-btn-logo"
                     data-logo-set="${setKey}" data-logo-idx="0"
                     onerror="tryNextLorcanaLogo(this)">
                <div class="set-btn-logo-fallback" style="display:none">&#127183;</div>
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

    // Update sections
    document.querySelectorAll('#lorcana-content .set-section').forEach(section => {
        section.classList.toggle('active', section.id === setKey);
    });

    if (!lorcanaCardSets[setKey]) return;
    renderLorcanaCards(setKey);
    updateLorcanaSetButtonProgress();
}

// Render Lorcana cards for a set
async function renderLorcanaCards(setKey) {
    const setData = lorcanaCardSets[setKey];
    const grid = document.getElementById(`${setKey}-grid`);
    if (!grid) return;

    // Fetch Lorcast image URLs in background (non-blocking).
    // Cards render immediately with Dreamborn CDN; Lorcast URLs
    // become available as fallbacks if Dreamborn images fail.
    fetchLorcastImageUrls(setKey);

    grid.innerHTML = '';

    setData.cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.setAttribute('data-card-number', card.number);
        cardEl.setAttribute('data-card-name', card.name.toLowerCase());

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

        // Get image URL with CDN fallbacks
        const imgUrl = getLorcanaCardImageUrl(card, setKey);
        const displayNumber = String(card.number).padStart(3, '0');
        const escapedName = card.name.replace(/"/g, '&quot;').replace(/'/g, '&#39;');

        // TCGPlayer link
        const tcgplayerUrl = getLorcanaTCGPlayerUrl(card.name, setData.name, card.number);

        cardEl.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${imgUrl || ''}"
                     alt="${escapedName}"
                     loading="lazy"
                     data-card-name="${escapedName}"
                     data-card-number="${displayNumber}"
                     data-card-rarity="${card.rarity}"
                     data-lorcana-card-number="${card.number}"
                     data-lorcana-dreamborn-id="${card.dreambornId || ''}"
                     data-lorcana-set-key="${setKey}"
                     onerror="tryNextLorcanaImage(this, {number: ${card.number}, dreambornId: '${card.dreambornId || ''}'}, '${setKey}', 1)">
            </div>
            <div class="card-header">
                <div class="card-info">
                    <div class="card-number">#${displayNumber}</div>
                    <div class="card-name">${card.name}</div>
                    <span class="rarity-badge ${rarityClass}">${getLorcanaRarityDisplay(card.rarity)}</span>
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

// Filter Lorcana cards
function filterLorcanaCards(setKey, filter) {
    const section = document.getElementById(setKey);
    if (!section) return;

    section.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === filter);
    });

    const cards = section.querySelectorAll('.card');
    cards.forEach(card => {
        if (filter === 'all') {
            card.style.display = '';
        } else if (filter === 'incomplete') {
            card.style.display = card.classList.contains('completed') ? 'none' : '';
        } else if (filter === 'complete') {
            card.style.display = card.classList.contains('completed') ? '' : 'none';
        }
    });
}

// Search Lorcana cards
function searchLorcanaCards(setKey, query) {
    const section = document.getElementById(setKey);
    if (!section) return;

    const searchQuery = query.toLowerCase().trim();
    const cards = section.querySelectorAll('.card');

    cards.forEach(card => {
        const cardName = card.getAttribute('data-card-name');
        const cardNumber = card.getAttribute('data-card-number');

        if (!searchQuery) {
            card.style.display = '';
        } else {
            const matches = cardName.includes(searchQuery) || cardNumber.includes(searchQuery);
            card.style.display = matches ? '' : 'none';
        }
    });
}

// Clear Lorcana search
function clearLorcanaSearch(setKey) {
    const section = document.getElementById(setKey);
    if (!section) return;

    const searchInput = section.querySelector('.search-input');
    if (searchInput) {
        searchInput.value = '';
        searchLorcanaCards(setKey, '');
    }
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
            </div>
            <div class="card-grid" id="${setKey}-grid"></div>
        `;

        container.appendChild(section);
    });
}
