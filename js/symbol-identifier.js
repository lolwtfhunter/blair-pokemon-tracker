// Pokemon Symbol Identifier — identify set symbols from Pokemon TCG cards

let siSets = null;
let siInitialized = false;

// Sets where pokemontcg.io returns incorrect symbol images (e.g. card art instead of set symbol).
// For these, try Scrydex first, then pokemontcg.io as fallback, then styled text.
const SI_DUAL_CDN_SETS = {
    'me2pt5': {
        scrydex: 'https://images.scrydex.com/pokemon/me2pt5-symbol/symbol',
        ptcg: 'https://images.pokemontcg.io/me2pt5/symbol.png'
    }
};

// Sets not available on any image CDN — display PTCGO code as text fallback.
const SI_TEXT_FALLBACK_SETS = {
    'mep': 'MEP'
};

// --- Activation (called when Symbol Dex tab is clicked) ---

function siActivate() {
    if (siInitialized) return;
    siInitialized = true;
    siFetchSets();
}

// --- Fetch set data from pokemontcg.io API, with local fallback ---

function siFetchSets() {
    const container = document.getElementById('siContent');
    container.innerHTML = '<div class="si-loading"><div class="sf-spinner"></div><span>Loading set symbols...</span></div>';

    fetch('https://api.pokemontcg.io/v2/sets?pageSize=250&orderBy=releaseDate')
        .then(r => {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        })
        .then(data => {
            siSets = (data.data || []).map(s => {
                s.images = s.images || {};
                if (SI_DUAL_CDN_SETS[s.id]) {
                    s._dualCdn = SI_DUAL_CDN_SETS[s.id];
                    s.images.symbol = s._dualCdn.scrydex;
                } else if (SI_TEXT_FALLBACK_SETS[s.id]) {
                    s.images.symbol = '';
                    s._symbolCode = SI_TEXT_FALLBACK_SETS[s.id];
                }
                return s;
            });
            siRender(siSets);
        })
        .catch(() => {
            // Fallback: build set list from the local TCG_API_SET_IDS mapping
            siSets = siBuildLocalSets();
            siRender(siSets);
        });
}

// --- Build set data from local config (fallback when API is unreachable) ---

function siBuildLocalSets() {
    // Era groupings derived from the comments in config.js
    const ERA_MAP = {
        'base': 'Base Set', 'gym': 'Gym', 'neo': 'Neo', 'ecard': 'e-Card',
        'ex': 'EX', 'dp': 'Diamond & Pearl', 'pl': 'Platinum',
        'hgss': 'HeartGold SoulSilver', 'bw': 'Black & White', 'xy': 'XY',
        'sm': 'Sun & Moon', 'swsh': 'Sword & Shield', 'sv': 'Scarlet & Violet',
        'me': 'Mega Evolution'
    };

    // Map set key prefixes to era keys
    function getEra(apiId) {
        if (apiId.startsWith('base') || apiId === 'si1') return 'base';
        if (apiId.startsWith('gym')) return 'gym';
        if (apiId.startsWith('neo')) return 'neo';
        if (apiId.startsWith('ecard')) return 'ecard';
        if (apiId.startsWith('ex') || apiId === 'np') return 'ex';
        if (apiId.startsWith('dp')) return 'dp';
        if (apiId.startsWith('pl') || apiId === 'ru1') return 'pl';
        if (apiId.startsWith('hgss') || apiId === 'hsp' || apiId === 'col1') return 'hgss';
        if (apiId.startsWith('bw') || apiId === 'dv1') return 'bw';
        if (apiId.startsWith('xy') || apiId === 'g1') return 'xy';
        if (apiId.startsWith('sm') || apiId === 'det1' || apiId === 'smp') return 'sm';
        if (apiId.startsWith('swsh') || apiId === 'pgo' || apiId === 'cel25') return 'swsh';
        if (apiId.startsWith('sv')) return 'sv';
        if (apiId.startsWith('me')) return 'me';
        return 'other';
    }

    const sets = [];
    for (const [setKey, apiId] of Object.entries(TCG_API_SET_IDS)) {
        const eraKey = getEra(apiId);
        const displayName = setKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const dualCdn = SI_DUAL_CDN_SETS[apiId];
        const textFallback = SI_TEXT_FALLBACK_SETS[apiId];
        sets.push({
            id: apiId,
            name: displayName,
            series: ERA_MAP[eraKey] || 'Other',
            releaseDate: '',
            images: {
                symbol: dualCdn ? dualCdn.scrydex : (textFallback ? '' : 'https://images.pokemontcg.io/' + apiId + '/symbol.png')
            },
            _dualCdn: dualCdn || null,
            _symbolCode: textFallback || ''
        });
    }
    return sets;
}

// --- Render symbol grid ---

function siRender(sets) {
    const container = document.getElementById('siContent');

    if (sets.length === 0) {
        container.innerHTML = '<div class="si-empty">No matching sets found.</div>';
        return;
    }

    // Group by series, preserving insertion order (release date order from API)
    const groups = new Map();
    sets.forEach(s => {
        if (!groups.has(s.series)) groups.set(s.series, []);
        groups.get(s.series).push(s);
    });

    let html = '';
    for (const [series, seriesSets] of groups) {
        html += '<div class="si-series-group">';
        html += '<div class="si-series-header">' + siEscape(series) + '</div>';
        html += '<div class="si-symbol-grid">';
        seriesSets.forEach(s => {
            const year = s.releaseDate ? s.releaseDate.substring(0, 4) : '';
            const symbolCode = s._symbolCode || '';
            let symbolContent;
            if (symbolCode) {
                // Text-only fallback for sets with no CDN image
                symbolContent = '<div class="si-symbol-code">' + siEscape(symbolCode) + '</div>';
            } else if (s._dualCdn) {
                // Dual-CDN fallback: Scrydex -> pokemontcg.io -> text
                const fallbackUrl = siEscape(s._dualCdn.ptcg);
                symbolContent = '<img class="si-symbol-img" src="' + siEscape(s.images.symbol) + '" alt="' + siEscape(s.name) + '" loading="lazy"'
                    + ' onerror="this.onerror=function(){this.style.display=\'none\';this.nextElementSibling.style.display=\'\'};this.src=\'' + fallbackUrl + '\'">'
                    + '<div class="si-symbol-code" style="display:none">' + siEscape(s.id.toUpperCase()) + '</div>';
            } else {
                // Standard: pokemontcg.io -> text
                symbolContent = '<img class="si-symbol-img" src="' + siEscape(s.images.symbol) + '" alt="' + siEscape(s.name) + '" loading="lazy"'
                    + ' onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'\'">'
                    + '<div class="si-symbol-code" style="display:none">' + siEscape(s.id.toUpperCase()) + '</div>';
            }
            html += '<div class="si-symbol-item" title="' + siEscape(s.name) + (year ? ' (' + year + ')' : '') + '">'
                + '<div class="si-symbol-img-wrap">'
                + symbolContent
                + '</div>'
                + '<div class="si-symbol-name">' + siEscape(s.name) + '</div>'
                + (year ? '<div class="si-symbol-year">' + year + '</div>' : '')
                + '</div>';
        });
        html += '</div></div>';
    }

    container.innerHTML = html;
}

// --- Search / filter ---

function siFilter() {
    const query = document.getElementById('siSearchInput').value.toLowerCase().trim();
    if (!siSets) return;

    if (!query) {
        siRender(siSets);
        return;
    }

    const filtered = siSets.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.series.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query)
    );
    siRender(filtered);
}

// --- Utility ---

function siEscape(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
