// Market price fetching, caching, and UI integration
// Uses TCGCSV (CDN-backed TCGPlayer data) for both Pokemon and Lorcana

const PRICE_CACHE_KEY = 'blair_price_cache';
const PRICE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// In-memory cache: { setKey: { cardNumber: priceNumber } }
let priceCache = {};

// Per-set fetch timestamps: { setKey: fetchedAt }
let priceCacheTimestamps = {};

// Promise deduplication for in-flight fetches: { setKey: Promise }
const _priceFetchPromises = {};

// Flag to skip TCGCSV fetches if CORS fails
let _tcgcsvCorsFailed = false;

// ==================== CACHE MANAGEMENT ====================

function loadPriceCache() {
    try {
        const stored = localStorage.getItem(PRICE_CACHE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            priceCache = parsed.prices || {};
            priceCacheTimestamps = parsed.timestamps || {};
        }
    } catch (e) {
        console.warn('Failed to load price cache:', e);
    }
}

function savePriceCache() {
    try {
        localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify({
            prices: priceCache,
            timestamps: priceCacheTimestamps
        }));
    } catch (e) {
        console.warn('Failed to save price cache:', e);
    }
}

function isCacheStale(setKey) {
    const ts = priceCacheTimestamps[setKey];
    if (!ts) return true;
    return (Date.now() - ts) > PRICE_TTL_MS;
}

// ==================== PRICE ACCESS ====================

function getCardPrice(setKey, cardNumber) {
    const setCache = priceCache[setKey];
    if (!setCache) return null;
    const price = setCache[cardNumber];
    return (price != null && price > 0) ? price : null;
}

function getCollectionValue(setKey) {
    let total = 0;
    const progress = collectionProgress[setKey];
    if (!progress) return 0;

    const isLorcana = !!lorcanaCardSets[setKey];
    const setData = isLorcana ? lorcanaCardSets[setKey] : cardSets[setKey];
    if (!setData || !setData.cards) return 0;

    setData.cards.forEach(card => {
        const cardProgress = progress[card.number];
        if (!cardProgress) return;

        let hasCollected = false;
        if (isLorcana) {
            hasCollected = !!cardProgress['single'];
        } else {
            const variants = getVariants(card, setKey);
            hasCollected = variants.some(v => cardProgress[v]);
        }

        if (hasCollected) {
            const price = getCardPrice(setKey, card.number);
            if (price) total += price;
        }
    });

    return total;
}

// ==================== FETCH ORCHESTRATION ====================

async function ensurePricesLoaded(setKey) {
    if (setKey.startsWith('custom-')) return;
    if (priceCache[setKey] && !isCacheStale(setKey)) return;
    if (_priceFetchPromises[setKey]) return _priceFetchPromises[setKey];

    _priceFetchPromises[setKey] = (async () => {
        try {
            const isLorcana = !!lorcanaCardSets[setKey];
            if (isLorcana) {
                await fetchTcgcsvPrices(setKey, 71, TCGCSV_LORCANA_GROUP_IDS);
            } else {
                await fetchTcgcsvPrices(setKey, 3, TCGCSV_POKEMON_GROUP_IDS);
            }
        } catch (e) {
            console.warn(`Price fetch failed for ${setKey}:`, e);
        } finally {
            delete _priceFetchPromises[setKey];
        }
    })();

    return _priceFetchPromises[setKey];
}

// ==================== TCGCSV PRICING (Pokemon & Lorcana) ====================

// Subtype priority for price selection: Normal > Holofoil > Reverse Holofoil > any
const SUBTYPE_PRIORITY = { 'Normal': 3, 'Holofoil': 2, 'Reverse Holofoil': 1 };

async function fetchTcgcsvPrices(setKey, categoryId, groupIdMap) {
    if (_tcgcsvCorsFailed) return;

    const groupId = groupIdMap && groupIdMap[setKey];
    if (!groupId) return;

    const baseUrl = `https://tcgcsv.com/tcgplayer/${categoryId}/${groupId}`;

    let productsData, pricesData;
    try {
        const [productsResp, pricesResp] = await Promise.all([
            fetch(`${baseUrl}/products`),
            fetch(`${baseUrl}/prices`)
        ]);
        if (!productsResp.ok || !pricesResp.ok) throw new Error('Direct fetch failed');
        productsData = await productsResp.json();
        pricesData = await pricesResp.json();
    } catch (e) {
        // CORS proxy fallback
        try {
            const proxy = 'https://corsproxy.io/?';
            const [productsResp, pricesResp] = await Promise.all([
                fetch(proxy + encodeURIComponent(`${baseUrl}/products`)),
                fetch(proxy + encodeURIComponent(`${baseUrl}/prices`))
            ]);
            if (!productsResp.ok || !pricesResp.ok) throw new Error('Proxy fetch failed');
            productsData = await productsResp.json();
            pricesData = await pricesResp.json();
        } catch (e2) {
            console.warn(`TCGCSV pricing unavailable for category ${categoryId}:`, e2.message);
            _tcgcsvCorsFailed = true;
            return;
        }
    }

    // Map productId -> card number from products
    const productToCard = {};
    const products = productsData.results || productsData || [];
    (Array.isArray(products) ? products : []).forEach(product => {
        const extData = product.extendedData || [];
        const numberEntry = extData.find(d => d.displayName === 'Number');
        if (numberEntry && numberEntry.value) {
            const match = numberEntry.value.match(/^(\d+)/);
            if (match) {
                productToCard[product.productId] = parseInt(match[1]);
            }
        }
    });

    // Build best price per card number using subtype priority
    // For each productId, keep the highest-priority subtype with a valid market price.
    // Then for each card number, take the best price across all its productIds.
    const bestByProduct = {};
    const priceEntries = pricesData.results || pricesData || [];
    (Array.isArray(priceEntries) ? priceEntries : []).forEach(entry => {
        const price = entry.marketPrice;
        if (price == null || price <= 0) return;

        const pid = entry.productId;
        const priority = SUBTYPE_PRIORITY[entry.subTypeName] || 0;
        const existing = bestByProduct[pid];

        if (!existing || priority > existing.priority) {
            bestByProduct[pid] = { price, priority };
        }
    });

    const prices = {};
    for (const [pid, data] of Object.entries(bestByProduct)) {
        const cardNum = productToCard[pid];
        if (cardNum) {
            prices[cardNum] = data.price;
        }
    }

    priceCache[setKey] = prices;
    priceCacheTimestamps[setKey] = Date.now();
    savePriceCache();
}

// ==================== UI HELPERS ====================

function fillPricesInGrid(setKey) {
    const tags = document.querySelectorAll(`[data-price-card^="${setKey}-"]`);
    tags.forEach(tag => {
        const parts = tag.getAttribute('data-price-card').split('-');
        const cardNumber = parseInt(parts[parts.length - 1]);
        const price = getCardPrice(setKey, cardNumber);
        if (price) {
            tag.textContent = '$' + price.toFixed(2);
            tag.classList.add('loaded');
        }
    });
}

function updateSetValues() {
    document.querySelectorAll('.set-btn[data-set-key]').forEach(btn => {
        const setKey = btn.getAttribute('data-set-key');
        updateSetButtonValue(btn, setKey);
    });

    document.querySelectorAll('.set-btn[data-lorcana-set-key]').forEach(btn => {
        const setKey = btn.getAttribute('data-lorcana-set-key');
        updateSetButtonValue(btn, setKey);
    });
}

function updateSetButtonValue(btn, setKey) {
    const value = getCollectionValue(setKey);
    let valueEl = btn.querySelector('.set-btn-value');

    if (value > 0) {
        if (!valueEl) {
            valueEl = document.createElement('div');
            valueEl.className = 'set-btn-value';
            const progressBar = btn.querySelector('.set-btn-progress');
            if (progressBar) {
                progressBar.after(valueEl);
            } else {
                btn.appendChild(valueEl);
            }
        }
        valueEl.textContent = 'Est. Value: $' + value.toFixed(2);
    } else if (valueEl) {
        valueEl.remove();
    }
}
