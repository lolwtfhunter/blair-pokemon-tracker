// Market price fetching, caching, and UI integration

const PRICE_CACHE_KEY = 'blair_price_cache';
const PRICE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// In-memory cache: { setKey: { cardNumber: priceNumber } }
let priceCache = {};

// Per-set fetch timestamps: { setKey: fetchedAt }
let priceCacheTimestamps = {};

// Promise deduplication for in-flight fetches: { setKey: Promise }
const _priceFetchPromises = {};

// Flag to skip Lorcana price fetches if CORS fails
let _lorcanaCorsFailed = false;

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

    // Determine card source (Pokemon vs Lorcana)
    const isLorcana = !!lorcanaCardSets[setKey];
    const setData = isLorcana ? lorcanaCardSets[setKey] : cardSets[setKey];
    if (!setData || !setData.cards) return 0;

    setData.cards.forEach(card => {
        const cardProgress = progress[card.number];
        if (!cardProgress) return;

        // Check if at least one variant is collected
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
    // Skip custom sets
    if (setKey.startsWith('custom-')) return;

    // Return cached data if fresh
    if (priceCache[setKey] && !isCacheStale(setKey)) return;

    // Deduplicate concurrent requests
    if (_priceFetchPromises[setKey]) return _priceFetchPromises[setKey];

    const isLorcana = !!lorcanaCardSets[setKey];

    _priceFetchPromises[setKey] = (async () => {
        try {
            if (isLorcana) {
                await fetchLorcanaSetPrices(setKey);
            } else {
                await fetchPokemonSetPrices(setKey);
            }
        } catch (e) {
            console.warn(`Price fetch failed for ${setKey}:`, e);
            // Keep stale cache if available
        } finally {
            delete _priceFetchPromises[setKey];
        }
    })();

    return _priceFetchPromises[setKey];
}

// ==================== POKEMON PRICING (pokemontcg.io) ====================

async function fetchPokemonSetPrices(setKey) {
    const apiSetId = TCG_API_SET_IDS[setKey];
    if (!apiSetId) return;

    const url = `https://api.pokemontcg.io/v2/cards?q=set.id:${apiSetId}&select=number,tcgplayer&pageSize=250`;

    // pokemontcg.io is unreliable (~38% uptime), retry up to 3 times with backoff
    let resp;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            resp = await fetch(url);
            if (resp.ok) break;
        } catch (e) {
            resp = null;
        }
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
    if (!resp || !resp.ok) throw new Error(`Pokemon price API unavailable after 3 attempts`);

    const data = await resp.json();
    const cards = data.data || [];

    const prices = {};
    cards.forEach(card => {
        const num = parseInt(card.number);
        if (!num) return;

        const tcgPrices = card.tcgplayer?.prices;
        if (!tcgPrices) return;

        // Priority: holofoil.market > normal.market > reverseHolofoil.market > first available .market
        const price = tcgPrices.holofoil?.market
            || tcgPrices.normal?.market
            || tcgPrices.reverseHolofoil?.market
            || findFirstMarketPrice(tcgPrices);

        if (price != null && price > 0) {
            prices[num] = price;
        }
    });

    priceCache[setKey] = prices;
    priceCacheTimestamps[setKey] = Date.now();
    savePriceCache();
}

function findFirstMarketPrice(tcgPrices) {
    for (const variant of Object.values(tcgPrices)) {
        if (variant && variant.market != null) return variant.market;
    }
    return null;
}

// ==================== LORCANA PRICING (TCGCSV) ====================

async function fetchLorcanaSetPrices(setKey) {
    if (_lorcanaCorsFailed) return;

    const groupId = typeof TCGCSV_LORCANA_GROUP_IDS !== 'undefined' && TCGCSV_LORCANA_GROUP_IDS[setKey];
    if (!groupId) return;

    const baseUrl = `https://tcgcsv.com/tcgplayer/71/${groupId}`;

    let productsData, pricesData;
    try {
        // Try direct fetch first
        const [productsResp, pricesResp] = await Promise.all([
            fetch(`${baseUrl}/products`),
            fetch(`${baseUrl}/prices`)
        ]);

        if (!productsResp.ok || !pricesResp.ok) throw new Error('Direct fetch failed');

        productsData = await productsResp.json();
        pricesData = await pricesResp.json();
    } catch (e) {
        // Try CORS proxy fallback
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
            console.warn('Lorcana pricing unavailable (CORS blocked):', e2.message);
            _lorcanaCorsFailed = true;
            return;
        }
    }

    // Map productId -> card number from products data
    const productToCard = {};
    const products = productsData.results || productsData || [];
    (Array.isArray(products) ? products : []).forEach(product => {
        const extData = product.extendedData || [];
        const numberEntry = extData.find(d => d.displayName === 'Number');
        if (numberEntry && numberEntry.value) {
            // Parse "158/204" -> 158
            const match = numberEntry.value.match(/^(\d+)/);
            if (match) {
                productToCard[product.productId] = parseInt(match[1]);
            }
        }
    });

    // Map card number -> price from prices data
    const prices = {};
    const priceEntries = pricesData.results || pricesData || [];
    (Array.isArray(priceEntries) ? priceEntries : []).forEach(entry => {
        // Prefer "Normal" subtype pricing
        if (entry.subTypeName && entry.subTypeName !== 'Normal') return;

        const cardNum = productToCard[entry.productId];
        if (!cardNum) return;

        const price = entry.marketPrice;
        if (price != null && price > 0) {
            prices[cardNum] = price;
        }
    });

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
    // Update Pokemon set buttons
    document.querySelectorAll('.set-btn[data-set-key]').forEach(btn => {
        const setKey = btn.getAttribute('data-set-key');
        updateSetButtonValue(btn, setKey);
    });

    // Update Lorcana set buttons
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
            // Insert after progress bar
            const progressBar = btn.querySelector('.set-btn-progress');
            if (progressBar) {
                progressBar.after(valueEl);
            } else {
                btn.appendChild(valueEl);
            }
        }
        valueEl.textContent = 'Value: $' + value.toFixed(2);
    } else if (valueEl) {
        valueEl.remove();
    }
}
