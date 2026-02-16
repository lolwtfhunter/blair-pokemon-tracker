// Card market price fetching, caching, and display
// Sources: pokemontcg.io (Pokemon TCG) and Lorcast (Lorcana)

const PRICE_CACHE_KEY = 'cardPriceCache_v1';
const PRICE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// In-memory price cache: { setKey: { timestamp, prices: { cardNum: priceData } } }
let _priceCache = {};

// Load cached prices from localStorage
function loadPriceCache() {
    try {
        const saved = localStorage.getItem(PRICE_CACHE_KEY);
        if (saved) {
            _priceCache = JSON.parse(saved);
            const now = Date.now();
            for (const key of Object.keys(_priceCache)) {
                if (now - _priceCache[key].timestamp > PRICE_CACHE_TTL) {
                    delete _priceCache[key];
                }
            }
        }
    } catch (e) {
        console.warn('Price cache load error:', e);
        _priceCache = {};
    }
}

// Save price cache to localStorage
function savePriceCache() {
    try {
        localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(_priceCache));
    } catch (e) {
        console.warn('Price cache save error:', e);
    }
}

// ==================== POKEMON TCG PRICES ====================

// Fetch prices for a Pokemon TCG set from pokemontcg.io API
async function fetchPokemonSetPrices(setKey) {
    if (_priceCache[setKey] && Date.now() - _priceCache[setKey].timestamp < PRICE_CACHE_TTL) {
        return _priceCache[setKey].prices;
    }

    const apiSetId = TCG_API_SET_IDS[setKey];
    if (!apiSetId) return {};

    try {
        console.log(`Fetching prices for ${setKey} (${apiSetId})...`);
        let allCards = [];
        let page = 1;
        let totalCount = Infinity;

        while (allCards.length < totalCount) {
            const url = `https://api.pokemontcg.io/v2/cards?q=set.id:${apiSetId}&select=number,tcgplayer&pageSize=250&page=${page}`;
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`API returned ${resp.status}`);

            const data = await resp.json();
            totalCount = data.totalCount || 0;
            allCards = allCards.concat(data.data || []);
            page++;

            if (!data.data || data.data.length === 0) break;
        }

        const prices = {};
        for (const card of allCards) {
            if (card.tcgplayer && card.tcgplayer.prices) {
                prices[card.number] = card.tcgplayer.prices;
            }
        }

        _priceCache[setKey] = { timestamp: Date.now(), prices };
        savePriceCache();
        console.log(`✓ Prices cached for ${setKey}: ${Object.keys(prices).length} cards`);
        return prices;
    } catch (e) {
        console.warn(`Price fetch failed for ${setKey}:`, e.message);
        return {};
    }
}

// ==================== LORCANA PRICES ====================

// Store Lorcana prices extracted from Lorcast API response.
// Called from fetchLorcastImageUrls() which already fetches all card data.
function cacheLorcanaPrices(setKey, lorcastCards) {
    const prices = {};
    lorcastCards.forEach(card => {
        const num = parseInt(card.collector_number);
        if (num && card.prices) {
            prices[String(num)] = card.prices;
        }
    });

    if (Object.keys(prices).length > 0) {
        _priceCache[setKey] = { timestamp: Date.now(), prices };
        savePriceCache();
        console.log(`✓ Lorcana prices cached for ${setKey}: ${Object.keys(prices).length} cards`);
    }
}

// ==================== PRICE DISPLAY HELPERS ====================

// Get the best single market price for display on a card
function getCardDisplayPrice(setKey, cardNumber) {
    const setCache = _priceCache[setKey];
    if (!setCache) return null;

    const cardPrices = setCache.prices[String(cardNumber)];
    if (!cardPrices) return null;

    // Lorcast format: { usd: X, usd_foil: Y }
    if (cardPrices.usd !== undefined || cardPrices.usd_foil !== undefined) {
        if (cardPrices.usd != null) return cardPrices.usd;
        if (cardPrices.usd_foil != null) return cardPrices.usd_foil;
        return null;
    }

    // pokemontcg.io format: { normal: { market: X }, holofoil: { market: Y }, ... }
    let lowestMarket = null;
    for (const variant of Object.values(cardPrices)) {
        if (variant && variant.market != null) {
            if (lowestMarket === null || variant.market < lowestMarket) {
                lowestMarket = variant.market;
            }
        }
    }
    return lowestMarket;
}

// Get detailed per-variant prices for modal display
function getCardDetailedPrices(setKey, cardNumber) {
    const setCache = _priceCache[setKey];
    if (!setCache) return null;

    const cardPrices = setCache.prices[String(cardNumber)];
    if (!cardPrices) return null;

    // Lorcast format
    if (cardPrices.usd !== undefined || cardPrices.usd_foil !== undefined) {
        const details = [];
        if (cardPrices.usd != null) {
            details.push({ variant: 'Normal', market: cardPrices.usd });
        }
        if (cardPrices.usd_foil != null) {
            details.push({ variant: 'Foil', market: cardPrices.usd_foil });
        }
        return details;
    }

    // pokemontcg.io format
    const variantNames = {
        'normal': 'Normal',
        'holofoil': 'Holo',
        'reverseHolofoil': 'Reverse Holo',
        '1stEditionHolofoil': '1st Ed Holo',
        '1stEditionNormal': '1st Ed Normal',
        'unlimitedHolofoil': 'Unlimited Holo'
    };

    const details = [];
    for (const [key, variant] of Object.entries(cardPrices)) {
        if (variant && variant.market != null) {
            details.push({
                variant: variantNames[key] || key,
                low: variant.low,
                mid: variant.mid,
                high: variant.high,
                market: variant.market
            });
        }
    }
    return details.length > 0 ? details : null;
}

// Format price for display
function formatPrice(price) {
    if (price == null) return '--';
    if (price < 0.01) return '<$0.01';
    if (price >= 1000) return '$' + price.toFixed(0);
    return '$' + price.toFixed(2);
}

// Get CSS class for price color coding
function getPriceClass(price) {
    if (price == null) return 'price-na';
    if (price < 1) return 'price-low';
    if (price < 10) return 'price-mid';
    if (price < 50) return 'price-high';
    return 'price-premium';
}

// Generate the HTML for a price element in a card box
function cardPriceHTML(setKey, cardNumber) {
    const price = getCardDisplayPrice(setKey, cardNumber);
    const cls = getPriceClass(price);
    return `<div class="card-price ${cls}" data-price-set="${setKey}" data-price-num="${cardNumber}">${formatPrice(price)}</div>`;
}

// Generate loading placeholder for price (used before prices are fetched)
function cardPriceLoadingHTML(setKey, cardNumber) {
    return `<div class="card-price price-loading" data-price-set="${setKey}" data-price-num="${cardNumber}">...</div>`;
}

// Update all price elements in the DOM for a given set
function updatePriceElements(setKey) {
    document.querySelectorAll(`[data-price-set="${setKey}"]`).forEach(el => {
        const num = el.getAttribute('data-price-num');
        const price = getCardDisplayPrice(setKey, num);
        el.textContent = formatPrice(price);
        el.className = 'card-price ' + getPriceClass(price);
    });
}

// Fetch and display prices for a Pokemon TCG set (non-blocking)
async function fetchAndDisplayPokemonPrices(setKey) {
    await fetchPokemonSetPrices(setKey);
    updatePriceElements(setKey);
}

// Build detailed price HTML for modal display
function buildModalPriceHTML(setKey, cardNumber) {
    const details = getCardDetailedPrices(setKey, cardNumber);
    if (!details || details.length === 0) {
        return '<div class="modal-price-section"><div class="modal-price-na">Price data unavailable</div></div>';
    }

    let html = '<div class="modal-price-section"><div class="modal-price-title">Market Prices</div>';
    details.forEach(d => {
        const cls = getPriceClass(d.market);
        html += `<div class="modal-price-row">
            <span class="modal-price-variant">${d.variant}</span>
            <span class="modal-price-value ${cls}">${formatPrice(d.market)}</span>`;
        if (d.low != null && d.high != null) {
            html += `<span class="modal-price-range">${formatPrice(d.low)} – ${formatPrice(d.high)}</span>`;
        }
        html += '</div>';
    });
    html += '</div>';
    return html;
}
