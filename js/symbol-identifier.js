// Pokemon Symbol Identifier — identify set symbols from Pokemon TCG cards

let siSets = null;
let siInitialized = false;

// --- Sub-view switching within Store Hunter tab ---

function sfSubViewActivate() {
    // Activate whichever sub-view is currently selected
    const active = document.querySelector('.sf-sub-tab.active');
    const view = active ? active.getAttribute('data-view') : 'store-finder';
    if (view === 'store-finder') {
        sfActivate();
    } else if (view === 'symbol-id') {
        siActivate();
    }
}

function switchStoreView(view) {
    document.querySelectorAll('.sf-sub-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.sf-sub-tab[data-view="${view}"]`).classList.add('active');
    document.querySelectorAll('.sf-sub-view').forEach(v => v.classList.remove('active'));
    document.getElementById(view + '-view').classList.add('active');

    if (view === 'store-finder') {
        sfActivate();
    } else if (view === 'symbol-id') {
        siActivate();
    }
}

// --- Activation ---

function siActivate() {
    if (siInitialized) return;
    siInitialized = true;
    siFetchSets();
}

// --- Fetch set data from pokemontcg.io API ---

function siFetchSets() {
    const container = document.getElementById('siContent');
    container.innerHTML = '<div class="si-loading"><div class="sf-spinner"></div><span>Loading set symbols...</span></div>';

    fetch('https://api.pokemontcg.io/v2/sets?pageSize=250&orderBy=releaseDate')
        .then(r => {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        })
        .then(data => {
            siSets = data.data || [];
            siRender(siSets);
        })
        .catch(() => {
            container.innerHTML = '<div class="si-error">Failed to load set data. Please try again later.</div>';
        });
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
            html += '<div class="si-symbol-item" title="' + siEscape(s.name) + ' (' + year + ')">'
                + '<div class="si-symbol-img-wrap">'
                + '<img class="si-symbol-img" src="' + siEscape(s.images.symbol) + '" alt="' + siEscape(s.name) + '" loading="lazy">'
                + '</div>'
                + '<div class="si-symbol-name">' + siEscape(s.name) + '</div>'
                + '<div class="si-symbol-year">' + year + '</div>'
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
