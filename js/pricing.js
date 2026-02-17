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

    const isCustom = setKey.startsWith('custom-');
    const isLorcana = !!lorcanaCardSets[setKey];

    if (isCustom) {
        const customKey = setKey.replace('custom-', '');
        const setData = customCardSets[customKey];
        if (!setData || !setData.cards) return 0;

        setData.cards.forEach(card => {
            const cardProgress = progress[card.number];
            if (!cardProgress) return;

            const variants = getCustomCardVariants(card);
            const hasCollected = variants.some(v => cardProgress[v]);
            if (hasCollected) {
                const price = getCustomCardPrice(card);
                if (price) total += price;
            }
        });
        return total;
    }

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

// ==================== CUSTOM SET PRICE ACCESS ====================

function getCustomCardPrice(card) {
    if (!card.apiId) return null;
    const sourceSetId = card.apiId.replace(/-[^-]+$/, '');
    const cacheKey = '_src:' + sourceSetId;
    const cardId = card.apiId.split('-').pop();
    const price = getCardPrice(cacheKey, cardId);
    if (price) return price;

    // Suffix-stripping fallback: try without _A/_B suffixes and trailing lowercase letters
    const stripped = cardId.replace(/_[A-Za-z]+$/, '').replace(/[a-z]+$/, '');
    if (stripped && stripped !== cardId) {
        const p = getCardPrice(cacheKey, stripped);
        if (p) return p;
        const intVal = parseInt(stripped);
        if (!isNaN(intVal) && String(intVal) !== stripped) {
            return getCardPrice(cacheKey, intVal);
        }
    }
    return null;
}

// ==================== FETCH ORCHESTRATION ====================

async function ensurePricesLoaded(setKey) {
    if (setKey.startsWith('custom-')) {
        return ensureCustomSetPricesLoaded(setKey);
    }
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

async function ensureCustomSetPricesLoaded(customSetKey) {
    const customKey = customSetKey.replace('custom-', '');
    const setData = customCardSets[customKey];
    if (!setData || !setData.cards) return;

    // Collect unique source set IDs that need fetching
    const sourceSetIds = new Set();
    setData.cards.forEach(card => {
        if (!card.apiId) return;
        const sourceSetId = card.apiId.replace(/-[^-]+$/, '');
        if (TCGCSV_SOURCE_SET_GROUP_IDS[sourceSetId]) {
            sourceSetIds.add(sourceSetId);
        }
    });

    // Filter to only those needing fetch
    const toFetch = [...sourceSetIds].filter(id => {
        const cacheKey = '_src:' + id;
        return !priceCache[cacheKey] || isCacheStale(cacheKey);
    });

    if (toFetch.length === 0) return;

    // Fetch in batches of 5
    const BATCH_SIZE = 5;
    for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
        const batch = toFetch.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(sourceSetId => {
            const cacheKey = '_src:' + sourceSetId;
            if (_priceFetchPromises[cacheKey]) return _priceFetchPromises[cacheKey];

            const groupIdOrIds = TCGCSV_SOURCE_SET_GROUP_IDS[sourceSetId];
            const groupIds = Array.isArray(groupIdOrIds) ? groupIdOrIds : [groupIdOrIds];
            _priceFetchPromises[cacheKey] = (async () => {
                try {
                    for (const gid of groupIds) {
                        await fetchTcgcsvPricesRaw(cacheKey, 3, gid);
                    }
                } catch (e) {
                    console.warn(`Price fetch failed for source set ${sourceSetId}:`, e);
                } finally {
                    delete _priceFetchPromises[cacheKey];
                }
            })();
            return _priceFetchPromises[cacheKey];
        }));
    }
}

// ==================== TCGCSV PRICING (Pokemon & Lorcana) ====================

// Subtype priority for price selection: Normal > Holofoil > Reverse Holofoil > any
const SUBTYPE_PRIORITY = { 'Normal': 3, 'Holofoil': 2, 'Reverse Holofoil': 1 };

async function fetchTcgcsvPrices(setKey, categoryId, groupIdMap) {
    const groupId = groupIdMap && groupIdMap[setKey];
    if (!groupId) return;
    await fetchTcgcsvPricesRaw(setKey, categoryId, groupId);
}

async function fetchTcgcsvPricesRaw(cacheKey, categoryId, groupId) {
    if (_tcgcsvCorsFailed) return;

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

    // Map productId -> card number keys from products
    // Each product maps to an array of keys: the raw value (e.g., "SM65", "TG05")
    // plus the parsed integer if it starts with digits (e.g., "58/102" → 58)
    const productToCardKeys = {};
    const products = productsData.results || productsData || [];
    (Array.isArray(products) ? products : []).forEach(product => {
        const extData = product.extendedData || [];
        const numberEntry = extData.find(d => d.displayName === 'Number' || d.displayName === 'Card Number');
        if (numberEntry && numberEntry.value) {
            const raw = numberEntry.value.trim();
            const keys = [raw];
            // Also store under the leading integer for official set lookups (e.g., "58/102" → 58)
            const intMatch = raw.match(/^(\d+)/);
            if (intMatch) {
                keys.push(parseInt(intMatch[1]));
            }
            // Store prefix before slash for non-numeric prefixed numbers (e.g., "H25/H32" → "H25", "TG05/TG30" → "TG05")
            const slashIdx = raw.indexOf('/');
            if (slashIdx > 0) {
                const prefix = raw.substring(0, slashIdx);
                if (!/^\d/.test(prefix) && !keys.includes(prefix)) {
                    keys.push(prefix);
                }
            }
            productToCardKeys[product.productId] = keys;
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
        const keys = productToCardKeys[pid];
        if (keys) {
            keys.forEach(key => { prices[key] = data.price; });
        }
    }

    priceCache[cacheKey] = Object.assign(priceCache[cacheKey] || {}, prices);
    priceCacheTimestamps[cacheKey] = Date.now();
    savePriceCache();
}

// ==================== UI HELPERS ====================

function fillPricesInGrid(setKey) {
    if (setKey.startsWith('custom-')) {
        const customKey = setKey.replace('custom-', '');
        const setData = customCardSets[customKey];
        if (!setData || !setData.cards) return;

        // Build apiId lookup from card data
        const cardsByNumber = {};
        setData.cards.forEach(card => { cardsByNumber[card.number] = card; });

        const tags = document.querySelectorAll(`[data-price-card^="${setKey}-"]`);
        tags.forEach(tag => {
            const apiId = tag.getAttribute('data-api-id');
            if (!apiId) return;
            // Find the card by apiId to use getCustomCardPrice
            const card = { apiId };
            const price = getCustomCardPrice(card);
            if (price) {
                tag.textContent = '$' + price.toFixed(2);
                tag.classList.add('loaded');
            }
        });
        return;
    }

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

    document.querySelectorAll('.set-btn[data-custom-set-key]').forEach(btn => {
        const customKey = btn.getAttribute('data-custom-set-key');
        updateSetButtonValue(btn, 'custom-' + customKey);
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
