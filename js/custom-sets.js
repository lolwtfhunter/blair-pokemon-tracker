// Custom set UI rendering, filtering, and progress tracking

// Render custom set buttons
function renderCustomSetButtons() {
    const container = document.getElementById('customSetButtons');
    if (!container) return;
    container.innerHTML = '';

    const setKeys = Object.keys(customCardSets);
    if (setKeys.length === 0) return;

    setKeys.forEach(setKey => {
        const setData = customCardSets[setKey];
        const btn = document.createElement('button');
        btn.className = 'set-btn' + (setKey === currentCustomSet ? ' active' : '');
        btn.setAttribute('data-custom-set-key', setKey);

        // Character-specific theme colors and logos for known sets
        const characterColorMap = {
            'its-pikachu': '#ffd700',
            'psyduck': '#4fc3f7',
            'togepi': '#ef9a9a'
        };
        const themeColor = characterColorMap[setKey] || '#ff9500';
        btn.style.setProperty('--set-accent', themeColor + '25');
        btn.style.setProperty('--set-border', themeColor + '55');

        const characterLogoMap = {
            'its-pikachu': './Images/header/pikachu.png',
            'psyduck': './Images/header/psyduck.png',
            'togepi': './Images/header/togepi.png'
        };
        const characterIconMap = {
            'its-pikachu': '⚡',
            'psyduck': '🦆',
            'togepi': '🥚'
        };

        // For unknown sets, use a generic TCG logo based on card type
        let logoUrl = characterLogoMap[setKey] || './Images/header/pokeball.png';
        let logoIcon = characterIconMap[setKey] || '⚡';
        if (!characterLogoMap[setKey] && setData.cards && setData.cards.length > 0) {
            const origin = (setData.cards[0].setOrigin || '').toLowerCase();
            if (origin.includes('lorcana') || origin.includes('disney')) {
                logoUrl = './Images/lorcana/logos/lorcana.png';
                logoIcon = '🃏';
            }
        }

        // Find earliest card date from cards if available
        let earliestDate = null;
        if (setData.cards && setData.cards.length > 0) {
            setData.cards.forEach(card => {
                if (card.releaseDate) {
                    const cardDate = new Date(card.releaseDate);
                    if (!earliestDate || cardDate < earliestDate) {
                        earliestDate = cardDate;
                    }
                }
            });
        }

        // Format date
        let dateStr = '';
        if (earliestDate) {
            dateStr = earliestDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else {
            // Fallback to showing card count
            dateStr = `${setData.totalCards} cards`;
        }

        const progress = getCustomSetProgress(setKey);

        btn.innerHTML = `
            <div class="set-btn-logo-wrapper">
                <img src="${logoUrl}" alt="${setData.displayName}" class="set-btn-logo"
                     onerror="this.style.display='none';this.nextElementSibling.style.display=''">
                <div class="set-btn-logo-fallback" style="display:none">${logoIcon}</div>
            </div>
            <div class="set-btn-name">${setData.displayName}</div>
            <div class="set-release-date">${dateStr}</div>
            <div class="set-btn-stats">${progress.collected}/${progress.total} (${progress.percentage}%)</div>
            <div class="set-btn-progress">
                <div class="set-btn-progress-fill" style="width: ${progress.percentage}%"></div>
            </div>
        `;

        btn.onclick = () => switchCustomSet(setKey);
        container.appendChild(btn);
    });
}

// Switch custom set
function switchCustomSet(setKey) {
    // If clicking the currently active set, deselect it (toggle off)
    if (currentCustomSet === setKey) {
        currentCustomSet = null;

        // Deactivate all custom set buttons
        document.querySelectorAll('#customSetButtons .set-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Hide all custom set sections
        document.querySelectorAll('#custom-sets-grids .set-section').forEach(section => {
            section.classList.remove('active');
        });

        return;
    }

    // Select the new set
    currentCustomSet = setKey;

    document.querySelectorAll('#customSetButtons .set-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-custom-set-key') === setKey);
    });

    document.querySelectorAll('#custom-sets-grids .set-section').forEach(section => {
        section.classList.remove('active');
    });
    const target = document.getElementById('custom-' + setKey);
    if (target) target.classList.add('active');

    // Render cards if not already rendered
    const grid = document.getElementById('custom-' + setKey + '-grid');
    if (grid && grid.children.length === 0) {
        renderCustomCards(setKey);
    }

    // Render rarity filter buttons
    const setData = customCardSets[setKey];
    if (setData && setData.cards) {
        renderRarityFilters('custom-' + setKey, setData.cards, RARITY_DISPLAY_NAMES);
    }
}

// Calculate progress for a custom set (respects language filter if set has mixed regions)
function getCustomSetProgress(setKey) {
    const setData = customCardSets[setKey];
    const csKey = 'custom-' + setKey;
    let totalVariants = 0;
    let collectedVariants = 0;

    if (setData && setData.cards) {
        const hasMixed = customSetHasRegions(setKey);
        const lang = getLangFilter(setKey);

        setData.cards.forEach(card => {
            // If mixed, only count cards for the active language filter
            if (hasMixed) {
                const isJP = card.region === 'JP';
                if (lang === 'JP' && !isJP) return;
                if (lang === 'EN' && isJP) return;
            }
            const variants = getCustomCardVariants(card);
            totalVariants += variants.length;
            const cardProgress = (collectionProgress[csKey] || {})[card.number] || {};
            variants.forEach(v => {
                if (cardProgress[v]) collectedVariants++;
            });
        });
    }

    const percentage = totalVariants > 0 ? (collectedVariants / totalVariants * 100).toFixed(1) : '0.0';
    return { collected: collectedVariants, total: totalVariants, percentage };
}

// Update custom set button progress
function updateCustomSetButtonProgress() {
    document.querySelectorAll('#customSetButtons .set-btn[data-custom-set-key]').forEach(btn => {
        const setKey = btn.getAttribute('data-custom-set-key');
        const progress = getCustomSetProgress(setKey);
        const fill = btn.querySelector('.set-btn-progress-fill');
        const stats = btn.querySelector('.set-btn-stats');
        if (fill) fill.style.width = progress.percentage + '%';
        if (stats) stats.textContent = `${progress.collected}/${progress.total} (${progress.percentage}%)`;
    });
}

// Get variant keys for a custom card
function getCustomCardVariants(card) {
    // Explicit variant arrays (WotC holo/non-holo pairs) take priority
    if (card.variants && card.variants.length > 0) {
        return card.variants.map(v => v.rarity);
    }

    const rarity = card.rarity.toLowerCase();

    // Japanese exclusive cards → single
    if (card.region === 'JP') {
        return ['single'];
    }

    // Single-variant rarities (promos, ultra rares, illustration rares, etc.)
    if (SINGLE_VARIANT_RARITIES.includes(rarity)) {
        return ['single'];
    }

    // Inherently holo rarities → single (non-holo versions are separate entries)
    if (rarity === 'rare-holo' || rarity === 'rare-holo-gx') {
        return ['single'];
    }

    // Energy cards → single
    if (rarity === 'energy') {
        return ['single'];
    }

    // Pre-reverse-holo era (before Expedition Base Set, June 2002)
    if (card.releaseDate && card.releaseDate < '2002/06') {
        return ['single'];
    }

    // Special sets/products that don't have reverse holos
    const setOrigin = (card.setOrigin || '').toLowerCase();
    if (setOrigin.includes('mcdonald') ||
        setOrigin.includes('southern islands') ||
        setOrigin.includes('pop series') ||
        setOrigin.includes('best of') ||
        setOrigin.includes('celebrations') ||
        setOrigin.includes('black star')) {
        return ['single'];
    }

    // Rare → holo + reverse-holo
    if (rarity === 'rare') {
        return ['holo', 'reverse-holo'];
    }

    // Common/Uncommon/Trainer → regular + reverse-holo
    return ['regular', 'reverse-holo'];
}

// Get image URL for a specific variant of a custom card
function getCustomVariantImageUrl(card, variantKey) {
    if (card.variants) {
        const variant = card.variants.find(v => v.rarity === variantKey);
        if (variant && variant.apiId) {
            const parts = variant.apiId.split('-');
            const setId = parts.slice(0, -1).join('-');
            const num = parts[parts.length - 1];
            return `https://images.pokemontcg.io/${setId}/${num}.png`;
        }
    }
    return getCustomCardImageUrl(card);
}

// Render cards for a custom set
function renderCustomCards(setKey) {
    const csKey = 'custom-' + setKey;
    const grid = document.getElementById(csKey + '-grid');
    const setData = customCardSets[setKey];

    if (!grid || !setData) return;

    grid.innerHTML = '';

    if (!collectionProgress[csKey]) {
        collectionProgress[csKey] = {};
    }

    // Filter cards by language if the set has mixed regions
    const hasMixed = customSetHasRegions(setKey);
    const lang = getLangFilter(setKey);
    const filteredCards = hasMixed
        ? setData.cards.filter(card => lang === 'JP' ? card.region === 'JP' : card.region !== 'JP')
        : setData.cards;

    filteredCards.forEach(card => {
        const cardProgress = collectionProgress[csKey][card.number] || {};
        const variants = getCustomCardVariants(card);
        const hasMultiVariants = variants.length > 1;
        const allCollected = variants.every(v => cardProgress[v]);
        const isSingleVariant = !hasMultiVariants;

        const cardEl = document.createElement('div');
        cardEl.className = 'card-item' + (allCollected ? ' all-collected' : '');
        cardEl.setAttribute('data-completed', allCollected ? 'true' : 'false');
        cardEl.setAttribute('data-rarity', card.rarity.toLowerCase());
        cardEl.style.cursor = 'pointer';
        cardEl.onclick = function(e) {
            // Don't open modal if clicking on checkboxes or their containers
            if (e.target.tagName === 'INPUT' ||
                e.target.tagName === 'LABEL' ||
                e.target.closest('.variant-checkbox') ||
                e.target.closest('.single-variant')) {
                return;
            }
            openCardModal(csKey, card.number);
        };

        const rarityClass = `rarity-${card.rarity}`;

        // Build variant HTML
        let variantHTML = '';
        if (hasMultiVariants) {
            if (card.variants && card.variants.length > 1) {
                // Explicit variant data (WotC holo/non-holo pairs)
                const customCardNumber = card.originalNumber || null;
                variantHTML = card.variants.map(v => {
                    const isChecked = cardProgress[v.rarity] || false;
                    const displayNum = v.originalNumber ? ` #${v.originalNumber}` : '';
                    const variantTCGUrl = getTCGPlayerUrl(card.name, card.setOrigin || 'Pokemon', '', v.originalNumber || customCardNumber);
                    return `
                        <div class="variant-checkbox ${isChecked ? 'checked' : ''}" onclick="toggleVariant('${csKey}', ${card.number}, '${v.rarity}')">
                            <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="event.stopPropagation(); toggleVariant('${csKey}', ${card.number}, '${v.rarity}')">
                            <label>${getRarityDisplay(v.rarity)}${displayNum}</label>
                            <a href="${variantTCGUrl}" target="_blank" class="variant-tcgplayer-link" title="Search on TCGPlayer" onclick="event.stopPropagation();">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                                    <path d="M19 19H5V5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                                </svg>
                            </a>
                        </div>
                    `;
                }).join('');
            } else {
                // Computed variants (regular + reverse-holo, holo + reverse-holo, etc.)
                const customCardNumber = card.originalNumber || null;
                variantHTML = variants.map(variant => {
                    const isChecked = cardProgress[variant] || false;
                    const info = variantLabels[variant];
                    const variantTCGUrl = getTCGPlayerUrl(card.name, card.setOrigin || 'Pokemon', '', customCardNumber, variant);
                    return `
                        <div class="variant-checkbox ${isChecked ? 'checked' : ''}" onclick="toggleVariant('${csKey}', ${card.number}, '${variant}')">
                            <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="event.stopPropagation(); toggleVariant('${csKey}', ${card.number}, '${variant}')">
                            <label>${info.icon} ${info.label}</label>
                            <a href="${variantTCGUrl}" target="_blank" class="variant-tcgplayer-link" title="Search ${info.label} on TCGPlayer" onclick="event.stopPropagation();">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                                    <path d="M19 19H5V5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                                </svg>
                            </a>
                        </div>
                    `;
                }).join('');
            }
            variantHTML = '<div class="variant-checkboxes">' + variantHTML + '</div>';
        } else {
            const isChecked = cardProgress['single'] || false;
            variantHTML = `
                <div class="single-variant ${isChecked ? 'checked' : ''}" onclick="toggleVariant('${csKey}', ${card.number}, 'single')">
                    <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="event.stopPropagation(); toggleVariant('${csKey}', ${card.number}, 'single')">
                    <label>✓ Collected</label>
                </div>
            `;
        }

        const imgUrl = getCustomCardImageUrl(card);
        const tcgdexUrl = getCustomCardTcgdexUrl(card);

        // Display originalNumber from the set instead of the sequential custom set number
        const displayNumber = card.originalNumber ? card.originalNumber : String(card.number).padStart(3, '0');

        // Generate TCGPlayer URL for custom cards using the setOrigin
        const customCardNumber = card.originalNumber || null;
        const tcgplayerUrl = getTCGPlayerUrl(card.name, card.setOrigin || 'Pokemon', '', customCardNumber);

        cardEl.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${imgUrl || ''}"
                     alt="${card.name.replace(/"/g, '&quot;')}"
                     loading="lazy"
                     ${tcgdexUrl ? `data-tcgdex-src="${tcgdexUrl}"` : ''}
                     data-card-name="${card.name.replace(/"/g, '&quot;')}"
                     data-card-number="${displayNumber}"
                     data-card-rarity="${card.rarity}"
                     onerror="handleImgError(this)">
            </div>
            <div class="card-header">
                <div class="card-info">
                    <div class="card-number">#${displayNumber}${card.region === 'JP' ? ' <span class="region-badge">JP</span>' : ''}</div>
                    <div class="card-name">${card.name}</div>
                    <span class="rarity-badge ${rarityClass}">${getRarityDisplay(card.rarity)}</span>
                </div>
                <a href="${tcgplayerUrl}" target="_blank" class="tcgplayer-link" title="View on TCGPlayer" onclick="event.stopPropagation();">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M19 19H5V5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                    </svg>
                </a>
            </div>
            <div class="card-origin">${card.setOrigin}</div>
            <div class="variants-section">
                <div class="variants-title">${isSingleVariant ? 'STATUS:' : 'VARIANTS:'}</div>
                ${variantHTML}
                ${allCollected ? `<div class="completed-lock"><svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg>Complete</div>` : ''}
            </div>
        `;

        grid.appendChild(cardEl);
    });

    // Reapply active filters and search after rendering
    applyFiltersAndSearch(csKey);
}

// Check if a custom set has mixed EN/JP cards
function customSetHasRegions(setKey) {
    const setData = customCardSets[setKey];
    if (!setData) return false;
    let hasEN = false, hasJP = false;
    for (const card of setData.cards) {
        if (card.region === 'JP') hasJP = true;
        else hasEN = true;
        if (hasEN && hasJP) return true;
    }
    return false;
}

// Get card counts per language for a custom set
function customSetRegionCounts(setKey) {
    const setData = customCardSets[setKey];
    if (!setData) return { en: 0, jp: 0 };
    let en = 0, jp = 0;
    setData.cards.forEach(card => {
        if (card.region === 'JP') jp++;
        else en++;
    });
    return { en, jp };
}

// Get current language filter for a custom set
function getLangFilter(setKey) {
    return customSetLangFilter[setKey] || 'EN';
}

// Switch language filter for a custom set
function switchLangFilter(setKey, lang) {
    customSetLangFilter[setKey] = lang;
    renderCustomCards(setKey);
    updateLangToggleUI(setKey);
    updateCustomSetButtonProgress();
}

// Update language toggle button active states
function updateLangToggleUI(setKey) {
    const container = document.getElementById('custom-' + setKey + '-lang-toggle');
    if (!container) return;
    const lang = getLangFilter(setKey);
    container.querySelectorAll('.lang-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
}

// Create DOM elements for custom set grids
function initCustomSetGrids() {
    const container = document.getElementById('custom-sets-grids');
    if (!container) return;
    container.innerHTML = '';

    Object.keys(customCardSets).forEach((setKey, idx) => {
        const section = document.createElement('div');
        section.id = 'custom-' + setKey;
        section.className = 'set-section' + (setKey === currentCustomSet ? ' active' : '');

        let langToggleHTML = '';
        if (customSetHasRegions(setKey)) {
            const counts = customSetRegionCounts(setKey);
            const lang = getLangFilter(setKey);
            langToggleHTML = `
                <div class="lang-toggle" id="custom-${setKey}-lang-toggle">
                    <button class="lang-toggle-btn ${lang === 'EN' ? 'active' : ''}" data-lang="EN" onclick="switchLangFilter('${setKey}', 'EN')">English <span class="lang-count">${counts.en}</span></button>
                    <button class="lang-toggle-btn ${lang === 'JP' ? 'active' : ''}" data-lang="JP" onclick="switchLangFilter('${setKey}', 'JP')">Japanese <span class="lang-count">${counts.jp}</span></button>
                </div>
            `;
        }

        const controlsHTML = `
            <div class="card-controls">
                <div class="filter-buttons">
                    <button class="filter-btn active" onclick="filterCards('custom-${setKey}', 'all')">All</button>
                    <button class="filter-btn" onclick="filterCards('custom-${setKey}', 'incomplete')">Incomplete</button>
                    <button class="filter-btn" onclick="filterCards('custom-${setKey}', 'complete')">Complete</button>
                </div>
                <div class="search-container">
                    <input type="text" class="search-input" placeholder="Search cards..." oninput="searchCards('custom-${setKey}', this.value)" data-set="custom-${setKey}">
                    <button class="search-clear" onclick="clearSearch('custom-${setKey}')">×</button>
                </div>
                <div class="rarity-filters" id="custom-${setKey}-rarity-filters"></div>
            </div>
        `;

        section.innerHTML = langToggleHTML + controlsHTML + `<div class="card-grid" id="custom-${setKey}-grid"></div>`;
        container.appendChild(section);
    });
}
