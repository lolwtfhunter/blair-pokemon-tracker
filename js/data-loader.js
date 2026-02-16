// Data loading functions for official, custom, and Lorcana card sets

// Load a single set from JSON
async function loadSingleSet(setKey) {
    const response = await fetch(`./data/pokemon/official-sets/${setKey}.json`);
    if (!response.ok) {
        console.warn(`Set ${setKey} not found, skipping`);
        return false;
    }
    const setInfo = await response.json();
    const cards = [];

    // Convert cards object to array
    if (setInfo.cards && typeof setInfo.cards === 'object') {
        for (const [cardNum, cardData] of Object.entries(setInfo.cards)) {
            const cardObj = {
                number: parseInt(cardNum),
                name: cardData.name,
                rarity: cardData.rarity,
                type: cardData.type || 'pokemon'
            };
            if (cardData.imageId) cardObj.imageId = cardData.imageId;
            cards.push(cardObj);
        }
    }

    cardSets[setKey] = {
        name: setInfo.name,
        displayName: setInfo.displayName,
        totalCards: setInfo.totalCards,
        mainSet: setInfo.mainSet,
        setCode: setInfo.setCode,
        releaseDate: setInfo.releaseDate || '',
        block: setInfo.block || '',
        blockCode: setInfo.blockCode || '',
        hasPokeBallVariant: setInfo.hasPokeBallVariant,
        hasMasterBallVariant: setInfo.hasMasterBallVariant,
        hasFirstEdition: setInfo.hasFirstEdition || false,
        singleVariantOnly: setInfo.singleVariantOnly || false,
        cards: cards
    };

    console.log(`✓ ${setKey}: ${cards.length} cards`);
    return true;
}

// Load card data from modular JSON files (batched parallel loading)
async function loadCardData() {
    console.log('Loading official Pokemon TCG sets...');
    try {
        let loadedCount = 0;
        const BATCH_SIZE = 10;

        for (let i = 0; i < OFFICIAL_SETS.length; i += BATCH_SIZE) {
            const batch = OFFICIAL_SETS.slice(i, i + BATCH_SIZE);
            const results = await Promise.allSettled(batch.map(setKey => loadSingleSet(setKey)));
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value) loadedCount++;
            });
        }

        console.log(`✓ Loaded ${loadedCount} official sets`);
        return loadedCount > 0;
    } catch (error) {
        console.log('ERROR: ' + error.message);
        console.error('Error loading card data:', error);
        alert('Failed to load card data. Please refresh the page.');
        return false;
    }
}

// Load custom sets data from modular JSON files
async function loadCustomSetsData() {
    console.log('Loading custom Pokemon sets...');
    try {
        let loadedCount = 0;

        // Load each custom set individually
        for (const setKey of CUSTOM_SETS) {
            try {
                const response = await fetch(`./data/pokemon/custom-sets/${setKey}.json`);
                if (!response.ok) {
                    console.warn(`Custom set ${setKey} not found, skipping`);
                    continue;
                }
                const setInfo = await response.json();
                const cards = [];

                if (setInfo.cards && typeof setInfo.cards === 'object') {
                    for (const [cardNum, cardData] of Object.entries(setInfo.cards)) {
                        const cardObj = {
                            number: parseInt(cardNum),
                            name: cardData.name,
                            rarity: cardData.rarity,
                            type: cardData.type || 'pokemon',
                            setOrigin: cardData.setOrigin || '',
                            apiId: cardData.apiId || '',
                            releaseDate: cardData.releaseDate || '',
                            originalNumber: cardData.originalNumber || '',
                            region: cardData.region || ''
                        };
                        // Parse variants array if present (merged cards with multiple rarities)
                        if (cardData.variants && Array.isArray(cardData.variants)) {
                            cardObj.variants = cardData.variants;
                        }
                        cards.push(cardObj);
                    }
                }

                customCardSets[setKey] = {
                    name: setInfo.name,
                    displayName: setInfo.displayName,
                    description: setInfo.description || '',
                    totalCards: setInfo.totalCards,
                    singleVariantOnly: setInfo.singleVariantOnly !== false,
                    cards: cards
                };

                console.log(`✓ Custom set ${setKey}: ${cards.length} cards`);
                loadedCount++;
            } catch (setError) {
                console.error(`Error loading custom set ${setKey}:`, setError);
            }
        }

        console.log(`✓ Loaded ${loadedCount} custom sets`);
        return true; // Non-fatal, app continues even if no custom sets loaded
    } catch (error) {
        console.log('Custom sets load error: ' + error.message);
        return true; // Non-fatal, app continues without custom sets
    }
}

// Get image URL for a custom set card using its apiId
function getCustomCardImageUrl(card) {
    if (card.apiId) {
        // apiId format is "setId-number", e.g. "base1-58"
        const parts = card.apiId.split('-');
        const setId = parts.slice(0, -1).join('-');
        const num = parts[parts.length - 1];
        // Use Scrydex for sets where pokemontcg.io serves placeholder images
        if (typeof SCRYDEX_PRIMARY_SETS !== 'undefined' && SCRYDEX_PRIMARY_SETS.has(setId)) {
            return `https://images.scrydex.com/pokemon/${setId}-${num}/large`;
        }
        return `https://images.pokemontcg.io/${setId}/${num}.png`;
    }
    return null;
}

// Load Lorcana card data from JSON files
async function loadLorcanaData() {
    console.log('Loading Disney Lorcana sets...');
    try {
        let loadedCount = 0;

        // Load each Lorcana set individually
        for (const setKey of LORCANA_SETS) {
            try {
                const response = await fetch(`./data/lorcana/sets/${setKey}.json`);
                if (!response.ok) {
                    console.warn(`Lorcana set ${setKey} not found, skipping`);
                    continue;
                }
                const setInfo = await response.json();
                const cards = [];

                // Convert cards object to array
                if (setInfo.cards && typeof setInfo.cards === 'object') {
                    for (const [cardNum, cardData] of Object.entries(setInfo.cards)) {
                        const cardObj = {
                            number: parseInt(cardNum),
                            name: cardData.name,
                            rarity: cardData.rarity,
                            type: cardData.type || 'character',
                            dreambornId: cardData.dreambornId || ''
                        };
                        if (cardData.imageId) cardObj.imageId = cardData.imageId;
                        cards.push(cardObj);
                    }
                }

                lorcanaCardSets[setKey] = {
                    name: setInfo.name,
                    displayName: setInfo.displayName,
                    totalCards: setInfo.totalCards,
                    mainSet: setInfo.mainSet,
                    setCode: setInfo.setCode,
                    releaseDate: setInfo.releaseDate || '',
                    block: setInfo.block || '',
                    blockCode: setInfo.blockCode || '',
                    singleVariantOnly: setInfo.singleVariantOnly || false,
                    cards: cards
                };

                console.log(`✓ Lorcana ${setKey}: ${cards.length} cards`);
                loadedCount++;
            } catch (setError) {
                console.error(`Error loading Lorcana set ${setKey}:`, setError);
            }
        }

        console.log(`✓ Loaded ${loadedCount} Lorcana sets`);
        return true; // Non-fatal, app continues even if no Lorcana sets loaded
    } catch (error) {
        console.log('Lorcana sets load error: ' + error.message);
        return true; // Non-fatal, app continues without Lorcana sets
    }
}
