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
// Resolves actual CDN URLs for set logos via MediaWiki APIs at runtime.
// Both Fandom and MushuReport are MediaWiki wikis — the imageinfo API returns
// the real serving URL which may bypass hotlink protection that blocks static paths.
// The Lorcast API (/v0/sets) does NOT provide set logo images — only card images.

// Cache: { setKey: directCdnUrl }
const _lorcanaLogoUrlCache = {};
let _lorcanaLogosFetched = false;

// Resolve actual CDN URLs via MediaWiki imageinfo API.
// Tries MushuReport first (self-hosted, no Fandom anti-hotlink), then Fandom.
// Uses origin=* for CORS support. Results cached in _lorcanaLogoUrlCache.
async function fetchLorcanaSetLogos() {
    if (_lorcanaLogosFetched) return;
    _lorcanaLogosFetched = true;
    _logoDebug('fetchLorcanaSetLogos: discovering logo URLs (v10-article-images)');

    var wikiNames = LORCANA_SET_WIKI_NAMES;
    var setKeys = Object.keys(wikiNames);
    var fandomApi = 'https://lorcana.fandom.com/api.php';

    // Helper: given imageinfo pages, match to sets and cache URLs
    function resolvePages(pages) {
        var resolved = 0;
        Object.keys(pages).forEach(function(pageId) {
            var page = pages[pageId];
            if (!page.imageinfo || !page.imageinfo[0] || !page.imageinfo[0].url) return;
            var title = (page.title || '').replace(/^File:/i, '').replace(/_/g, ' ').toLowerCase();
            // Only match files that look like logos (not card images, icons, etc.)
            if (title.indexOf('logo') === -1) return;
            setKeys.forEach(function(setKey) {
                var setName = wikiNames[setKey].replace(/_/g, ' ').toLowerCase();
                if (title.indexOf(setName) !== -1 && !_lorcanaLogoUrlCache[setKey]) {
                    _lorcanaLogoUrlCache[setKey] = page.imageinfo[0].url;
                    _logoDebug('  resolved: ' + setKey + ' → ' + page.imageinfo[0].url.substring(0, 80) + '...');
                    resolved++;
                }
            });
        });
        return resolved;
    }

    function countResolved() {
        return setKeys.filter(function(k) { return !!_lorcanaLogoUrlCache[k]; }).length;
    }

    // Strategy 1: Query images on set article pages (discovers ALL images each article uses)
    _logoDebug('fetchLorcanaSetLogos: querying images on set article pages...');
    try {
        var articleTitles = setKeys.map(function(k) { return wikiNames[k]; }).join('|');
        var artUrl = fandomApi + '?action=query&titles=' + encodeURIComponent(articleTitles) +
            '&prop=images&imlimit=500&format=json&origin=*';
        var artResp = await fetch(artUrl, { referrerPolicy: 'no-referrer' });
        if (artResp.ok) {
            var artData = await artResp.json();
            var artPages = artData && artData.query && artData.query.pages;
            if (artPages) {
                // Collect all image titles from all set pages, filtering for logo-related ones
                var logoFiles = [];
                Object.keys(artPages).forEach(function(pid) {
                    var page = artPages[pid];
                    var images = page.images || [];
                    images.forEach(function(img) {
                        var t = (img.title || '').toLowerCase();
                        _logoDebug('  article image: ' + img.title);
                        if (t.indexOf('logo') !== -1 || t.indexOf('set') !== -1) {
                            logoFiles.push(img.title);
                        }
                    });
                });
                _logoDebug('fetchLorcanaSetLogos: found ' + logoFiles.length + ' logo-related images on article pages');

                // Fetch imageinfo (CDN URLs) for discovered logo files
                if (logoFiles.length > 0) {
                    var infoUrl = fandomApi + '?action=query&titles=' +
                        encodeURIComponent(logoFiles.join('|')) +
                        '&prop=imageinfo&iiprop=url&format=json&origin=*';
                    var infoResp = await fetch(infoUrl, { referrerPolicy: 'no-referrer' });
                    if (infoResp.ok) {
                        var infoData = await infoResp.json();
                        var infoPages = infoData && infoData.query && infoData.query.pages;
                        if (infoPages) {
                            var n = resolvePages(infoPages);
                            _logoDebug('fetchLorcanaSetLogos: article strategy resolved ' + n + ' logos');
                        }
                    }
                }
            }
        }
    } catch (e) {
        _logoDebug('fetchLorcanaSetLogos: article strategy failed: ' + e.message);
    }
    if (countResolved() >= setKeys.length) return;

    // Strategy 2: Batch lookup with guessed filenames
    var suffixes = ['_Logo.png', '_logo.png', '_Set_Logo.png', '_set_logo.png'];
    for (var si = 0; si < suffixes.length; si++) {
        var suffix = suffixes[si];
        var titles = setKeys.map(function(k) { return 'File:' + wikiNames[k] + suffix; }).join('|');
        try {
            var resp = await fetch(fandomApi + '?action=query&titles=' + encodeURIComponent(titles) +
                '&prop=imageinfo&iiprop=url&format=json&origin=*', { referrerPolicy: 'no-referrer' });
            if (resp.ok) {
                var data = await resp.json();
                var pages = data && data.query && data.query.pages;
                if (pages) {
                    var n = resolvePages(pages);
                    _logoDebug('fetchLorcanaSetLogos: batch ' + suffix + ' resolved ' + n);
                    if (countResolved() >= setKeys.length) return;
                }
            }
        } catch (e) {
            _logoDebug('fetchLorcanaSetLogos: batch ' + suffix + ' failed: ' + e.message);
        }
    }

    // Strategy 3: Search File namespace for "logo"
    _logoDebug('fetchLorcanaSetLogos: searching for logo files...');
    try {
        var searchUrl = fandomApi + '?action=query&list=search&srsearch=logo&srnamespace=6&srlimit=50&format=json&origin=*';
        var searchResp = await fetch(searchUrl, { referrerPolicy: 'no-referrer' });
        if (searchResp.ok) {
            var searchData = await searchResp.json();
            var results = searchData && searchData.query && searchData.query.search;
            if (results && results.length > 0) {
                _logoDebug('fetchLorcanaSetLogos: search found ' + results.length + ' files');
                var fileTitles = results.map(function(r) {
                    _logoDebug('  found: ' + r.title);
                    return r.title;
                });
                var infoUrl2 = fandomApi + '?action=query&titles=' + encodeURIComponent(fileTitles.join('|')) +
                    '&prop=imageinfo&iiprop=url&format=json&origin=*';
                var infoResp2 = await fetch(infoUrl2, { referrerPolicy: 'no-referrer' });
                if (infoResp2.ok) {
                    var infoData2 = await infoResp2.json();
                    var infoPages2 = infoData2 && infoData2.query && infoData2.query.pages;
                    if (infoPages2) {
                        var n2 = resolvePages(infoPages2);
                        _logoDebug('fetchLorcanaSetLogos: search resolved ' + n2 + ' new logos');
                    }
                }
            } else {
                _logoDebug('fetchLorcanaSetLogos: search returned 0 files');
            }
        }
    } catch (e) {
        _logoDebug('fetchLorcanaSetLogos: search failed: ' + e.message);
    }

    var total = countResolved();
    _logoDebug('fetchLorcanaSetLogos: final — ' + total + '/' + setKeys.length + ' logos resolved');
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
// Activate by adding ?logodebug to the URL OR by tapping the debug toggle in the UI.
const _logoDebugFromUrl = (typeof location !== 'undefined') && location.search.indexOf('logodebug') !== -1;
var _logoDebugForced = false;
const _logoDebugLog = [];

function _isLogoDebugActive() {
    return _logoDebugFromUrl || _logoDebugForced;
}

function _logoDebug(msg) {
    var ts = new Date().toISOString().substr(11, 12);
    var line = '[' + ts + '] ' + msg;
    _logoDebugLog.push(line);
    if (_isLogoDebugActive()) {
        console.log('[logo] ' + msg);
        _updateDebugPanelContent();
    }
}

function _updateDebugPanelContent() {
    var panel = document.getElementById('logo-debug-panel');
    if (panel) {
        var pre = panel.querySelector('pre');
        if (pre) {
            pre.textContent = _logoDebugLog.join('\n');
            pre.scrollTop = pre.scrollHeight;
        }
    }
}

// iOS-compatible copy function (navigator.clipboard may not work on iOS Safari)
function _copyDebugLog() {
    var text = _logoDebugLog.join('\n');
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            alert('Debug log copied! (' + _logoDebugLog.length + ' lines)');
        }).catch(function() {
            _fallbackCopyText(text);
        });
    } else {
        _fallbackCopyText(text);
    }
}

// Fallback copy using textarea + execCommand (works on iOS Safari)
function _fallbackCopyText(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0.01;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    // iOS Safari requires setSelectionRange
    ta.setSelectionRange(0, ta.value.length);
    try {
        document.execCommand('copy');
        alert('Debug log copied! (' + _logoDebugLog.length + ' lines)');
    } catch (e) {
        // Last resort: show the text for manual copy
        prompt('Copy this debug log:', text);
    }
    document.body.removeChild(ta);
}

function _initLogoDebugPanel() {
    if (!_isLogoDebugActive()) return;
    if (document.getElementById('logo-debug-panel')) return; // already exists
    var panel = document.createElement('div');
    panel.id = 'logo-debug-panel';
    panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;gap:8px;">' +
        '<b style="flex-shrink:0;">Logo Debug</b>' +
        '<div style="display:flex;gap:6px;">' +
        '<button onclick="_copyDebugLog()" ' +
        'style="font-size:13px;padding:6px 14px;cursor:pointer;background:#0f0;color:#111;border:none;border-radius:4px;font-weight:bold;min-height:36px;">Copy Log</button>' +
        '<button onclick="_closeDebugPanel()" ' +
        'style="font-size:13px;padding:6px 10px;cursor:pointer;background:#333;color:#0f0;border:1px solid #0f0;border-radius:4px;min-height:36px;">Close</button>' +
        '</div></div>' +
        '<pre style="margin:0;white-space:pre-wrap;word-break:break-all;max-height:250px;overflow:auto;font-size:11px;line-height:1.3;-webkit-overflow-scrolling:touch;"></pre>';
    panel.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#111;color:#0f0;' +
        'padding:10px;font-family:monospace;font-size:12px;max-height:350px;border-top:2px solid #0f0;';
    document.body.appendChild(panel);
    // Replay existing log entries into the panel
    _updateDebugPanelContent();
    _logoDebug('Debug panel initialized');
}

function _closeDebugPanel() {
    _logoDebugForced = false;
    var panel = document.getElementById('logo-debug-panel');
    if (panel) panel.remove();
    // Update toggle button text
    var toggle = document.getElementById('logo-debug-toggle');
    if (toggle) toggle.textContent = 'Debug Logos';
}

// Toggle debug panel on/off from the UI button
function toggleLogoDebug() {
    _logoDebugForced = !_logoDebugForced;
    var toggle = document.getElementById('logo-debug-toggle');
    if (_logoDebugForced) {
        _initLogoDebugPanel();
        if (toggle) toggle.textContent = 'Hide Debug';
    } else {
        _closeDebugPanel();
    }
}

// Create the visible debug toggle button in the Lorcana tab
function _addDebugToggleButton() {
    var container = document.getElementById('lorcanaSetButtons');
    if (!container) return;
    // Don't add twice
    if (document.getElementById('logo-debug-toggle')) return;
    var btn = document.createElement('button');
    btn.id = 'logo-debug-toggle';
    btn.textContent = _isLogoDebugActive() ? 'Hide Debug' : 'Debug Logos';
    btn.onclick = toggleLogoDebug;
    btn.style.cssText = 'display:block;margin:8px auto 0;padding:4px 12px;font-size:11px;' +
        'background:transparent;color:#666;border:1px solid #444;border-radius:12px;cursor:pointer;' +
        'font-family:monospace;';
    container.parentNode.insertBefore(btn, container.nextSibling);
}

// ==================== LOGO URL BUILDING ====================

// Build ordered list of candidate logo URLs for a set.
// Priority: API-discovered URLs (from fetchLorcanaSetLogos) > proxied guesses > local > direct.
function getLorcanaRemoteLogoUrls(setKey) {
    var urls = [];
    var wikiName = LORCANA_SET_WIKI_NAMES[setKey];

    // 1. Wiki API-resolved URL (discovered by article/search/batch — most reliable)
    var cached = _lorcanaLogoUrlCache[setKey];
    if (cached) {
        urls.push(cached);
        // 1b. Also try proxied version in case CDN blocks direct browser access
        urls.push('https://wsrv.nl/?url=' + encodeURIComponent(cached).replace(/'/g, '%27') + '&w=600');
    }

    // 2. Local file (if user has downloaded logos)
    urls.push('./Images/lorcana/logos/' + setKey + '.png');

    return urls;
}

// ==================== LOGO UPGRADE (SEQUENTIAL) ====================

// Try to upgrade one SVG logo to a real image by testing URLs sequentially.
// Uses fetch() → blob URL approach to bypass CDN hotlink/referrer issues.
// Falls back to direct img.src if fetch fails (e.g. CORS).
function tryUpgradeLorcanaLogo(img) {
    var setKey = img.getAttribute('data-logo-set');
    if (!setKey) return;

    var urls = getLorcanaRemoteLogoUrls(setKey);
    var svgSrc = img.src; // Save SVG fallback for revert
    _logoDebug(setKey + ': trying ' + urls.length + ' URLs (v10-article-images)');
    var idx = 0;

    function tryNext() {
        if (idx >= urls.length) {
            _logoDebug(setKey + ': ALL FAILED — reverting to SVG');
            img.onload = null;
            img.onerror = null;
            img.src = svgSrc;
            return;
        }
        var url = urls[idx++];
        var shortUrl = url.length > 70 ? url.substring(0, 67) + '...' : url;
        _logoDebug(setKey + ': [' + idx + '/' + urls.length + '] trying ' + shortUrl);

        // Try fetch → blob URL first (completely bypasses CDN display issues)
        fetch(url, { referrerPolicy: 'no-referrer' })
            .then(function(resp) {
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                return resp.blob();
            })
            .then(function(blob) {
                if (blob.size < 100) throw new Error('blob too small (' + blob.size + 'B)');
                var blobUrl = URL.createObjectURL(blob);
                img.onload = function() {
                    if (img.naturalWidth > 10 && img.naturalHeight > 10) {
                        _logoDebug(setKey + ': SUCCESS blob (' + img.naturalWidth + 'x' + img.naturalHeight + ', ' + Math.round(blob.size/1024) + 'KB)');
                        img.onload = null;
                        img.onerror = null;
                    } else {
                        URL.revokeObjectURL(blobUrl);
                        _logoDebug(setKey + ': blob image too small visually, trying next');
                        tryNext();
                    }
                };
                img.onerror = function() {
                    URL.revokeObjectURL(blobUrl);
                    _logoDebug(setKey + ': blob render FAILED, trying next');
                    tryNext();
                };
                img.src = blobUrl;
            })
            .catch(function(err) {
                // Fandom domains: always skip — they serve transparent placeholders
                // to external img.src, so neither fetch nor img.src works.
                if (url.indexOf('wikia.nocookie.net') !== -1 || url.indexOf('fandom.com') !== -1) {
                    _logoDebug(setKey + ': Fandom fail (' + err.message + '), skipping');
                    tryNext();
                    return;
                }
                // Non-Fandom URLs: try direct img.src as fallback.
                // img.src follows 302 redirects and has no CORS restrictions,
                // so it works for Special:FilePath even when fetch() is blocked.
                _logoDebug(setKey + ': fetch fail (' + err.message + '), trying direct img.src');
                img.onload = function() {
                    if (img.naturalWidth > 10 && img.naturalHeight > 10) {
                        _logoDebug(setKey + ': SUCCESS direct (' + img.naturalWidth + 'x' + img.naturalHeight + ') ' + shortUrl);
                        img.onload = null;
                        img.onerror = null;
                    } else {
                        _logoDebug(setKey + ': direct too small, trying next');
                        tryNext();
                    }
                };
                img.onerror = function() {
                    _logoDebug(setKey + ': direct FAILED ' + shortUrl);
                    tryNext();
                };
                img.src = url;
            });
    }

    tryNext();
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

// Generate inline SVG data URI as last-resort fallback logo.
// Creates a styled banner with set name, roman numeral, and decorative borders.
function getLorcanaSetLogoSvg(setKey) {
    const setStyles = LORCANA_SET_STYLES;
    const style = setStyles[setKey] || { color: '#c9a84c', label: '?' };
    const c = style.color;
    const nameLines = (LORCANA_SET_SHORT_NAMES[setKey] || setKey).split('\n');
    var nameText = '';
    if (nameLines.length === 1) {
        nameText = '<text x="150" y="50" text-anchor="middle" fill="' + c + '" font-family="Georgia,serif" font-size="22" font-weight="bold">' + nameLines[0] + '</text>';
    } else {
        nameText = '<text x="150" y="40" text-anchor="middle" fill="' + c + '" font-family="Georgia,serif" font-size="18" font-weight="bold">' + nameLines[0] + '</text>' +
            '<text x="150" y="62" text-anchor="middle" fill="' + c + '" font-family="Georgia,serif" font-size="18" font-weight="bold">' + nameLines[1] + '</text>';
    }
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80">' +
        // Background glow
        '<rect x="20" y="5" width="260" height="70" rx="8" fill="' + c + '" opacity="0.08"/>' +
        // Decorative border
        '<rect x="20" y="5" width="260" height="70" rx="8" fill="none" stroke="' + c + '" stroke-width="1.5" opacity="0.5"/>' +
        // Corner diamonds
        '<polygon points="30,40 37,33 44,40 37,47" fill="' + c + '" opacity="0.4"/>' +
        '<polygon points="256,40 263,33 270,40 263,47" fill="' + c + '" opacity="0.4"/>' +
        // Horizontal accent lines
        '<line x1="50" y1="40" x2="80" y2="40" stroke="' + c + '" stroke-width="1" opacity="0.3"/>' +
        '<line x1="220" y1="40" x2="250" y2="40" stroke="' + c + '" stroke-width="1" opacity="0.3"/>' +
        // Set name
        nameText +
        // Roman numeral badge
        '<text x="150" y="77" text-anchor="middle" fill="' + c + '" font-family="Georgia,serif" font-size="9" opacity="0.5">' + style.label + '</text>' +
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
        _logoDebug('card ' + setKey + '#' + cardNum + ': fallback [' + idx + '/' + fallbacks.length + '] ' +
            (url.length > 50 ? url.substring(0, 47) + '...' : url));
        img.src = url;
    } else {
        _logoDebug('card ' + setKey + '#' + cardNum + ': ALL ' + fallbacks.length + ' URLs failed — showing placeholder');
        img.onerror = null;
        showPlaceholder(img);
    }
}

// Render Lorcana set buttons
function renderLorcanaSetButtons() {
    // Auto-activate debug panel if ?logodebug is in URL
    if (_logoDebugFromUrl) _initLogoDebugPanel();
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
    });

    // Add visible debug toggle button below set buttons
    _addDebugToggleButton();

    // Upgrade logos: resolve wiki API URLs first, then try all sources.
    // Buttons render instantly with SVGs; logos upgrade in background.
    // Race the API discovery against an 8s timeout so logos still try if API is slow.
    // Discovery does multiple API calls (article images + batch + search) so needs time.
    var apiWithTimeout = Promise.race([
        fetchLorcanaSetLogos().catch(function() {}),
        new Promise(function(resolve) { setTimeout(resolve, 8000); })
    ]);
    apiWithTimeout.then(function() {
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
