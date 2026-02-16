// Pokemon TCG block navigation, set management, card rendering, and filtering

// Representative set IDs for block logos (from pokemontcg.io)
const BLOCK_LOGO_SET_IDS = {
    'sv': 'sv1',
    'me': 'me1',
    'swsh': 'swsh1'
};

// Block theme colors for set button gradients
const BLOCK_THEME_COLORS = {
    'sv': '#dc143c',
    'me': '#ff8c00',
    'swsh': '#1e90ff'
};

// Track current block selection
let currentBlock = null;

// Group sets by block
function getSetsByBlock() {
    const blocks = {};
    Object.keys(cardSets).forEach(setKey => {
        const setData = cardSets[setKey];
        const blockCode = setData.blockCode || 'other';
        if (!blocks[blockCode]) {
            blocks[blockCode] = {
                name: setData.block || 'Other',
                code: blockCode,
                sets: []
            };
        }
        blocks[blockCode].sets.push(setKey);
    });
    return blocks;
}

// Get aggregate progress for a block
function getBlockProgress(blockCode) {
    const blocks = getSetsByBlock();
    const block = blocks[blockCode];
    if (!block) return { collected: 0, total: 0, percentage: '0.0' };

    let totalVariants = 0;
    let collectedVariants = 0;

    block.sets.forEach(setKey => {
        const progress = getSetProgress(setKey);
        totalVariants += progress.total;
        collectedVariants += progress.collected;
    });

    const percentage = totalVariants > 0 ? (collectedVariants / totalVariants * 100).toFixed(1) : '0.0';
    return { collected: collectedVariants, total: totalVariants, percentage };
}

// Render block selection buttons
function renderBlockButtons() {
    const container = document.getElementById('blockButtons');
    container.innerHTML = '';

    const blocks = getSetsByBlock();
    // Sort blocks by most recent release date (newest block first)
    const blockOrder = Object.keys(blocks).sort((a, b) => {
        const aMaxDate = Math.max(...blocks[a].sets.map(setKey => {
            const rd = cardSets[setKey].releaseDate;
            return rd ? new Date(rd + 'T00:00:00').getTime() : 0;
        }));
        const bMaxDate = Math.max(...blocks[b].sets.map(setKey => {
            const rd = cardSets[setKey].releaseDate;
            return rd ? new Date(rd + 'T00:00:00').getTime() : 0;
        }));
        return bMaxDate - aMaxDate;
    });

    blockOrder.forEach(blockCode => {
        if (!blocks[blockCode]) return;

        const block = blocks[blockCode];
        const progress = getBlockProgress(blockCode);

        const btn = document.createElement('button');
        btn.className = `block-btn block-${blockCode}` + (blockCode === currentBlock ? ' active' : '');
        btn.setAttribute('data-block-code', blockCode);

        // Block logo from pokemontcg.io using a representative set
        const logoSetId = BLOCK_LOGO_SET_IDS[blockCode] || '';
        const logoUrl = logoSetId ? `https://images.pokemontcg.io/${logoSetId}/logo.png` : '';

        btn.innerHTML = `
            <div class="block-btn-content">
                ${logoUrl ? `<div class="block-btn-logo-wrapper">
                    <img src="${logoUrl}" alt="${block.name}" class="block-btn-logo"
                         onerror="this.parentElement.style.display='none'">
                </div>` : ''}
                <div class="block-btn-name">${block.name}</div>
                <div class="block-btn-stats">${block.sets.length} set${block.sets.length !== 1 ? 's' : ''} · ${progress.collected}/${progress.total} variants</div>
                <div class="block-btn-progress">
                    <div class="block-btn-progress-fill" style="width: ${progress.percentage}%"></div>
                </div>
            </div>
        `;

        btn.onclick = () => switchBlock(blockCode);
        container.appendChild(btn);
    });
}

// Switch to a block (or deselect if clicking active block)
function switchBlock(blockCode) {
    // If clicking the currently active block, deselect it
    if (currentBlock === blockCode) {
        currentBlock = null;

        // Deactivate all block buttons
        document.querySelectorAll('.block-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Hide all set button containers and headers
        document.querySelectorAll('#pokemon-tcg-content .set-buttons').forEach(container => {
            container.classList.remove('active');
        });
        document.querySelectorAll('.set-selection-header').forEach(header => {
            header.classList.remove('active');
        });

        // Hide all set sections
        document.querySelectorAll('.set-section').forEach(section => {
            section.classList.remove('active');
        });

        currentSet = null;
        return;
    }

    // Select the new block
    currentBlock = blockCode;

    // Update block button states
    document.querySelectorAll('.block-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-block-code') === blockCode);
    });

    // Show/hide set button containers and headers for this block only
    document.querySelectorAll('#pokemon-tcg-content .set-buttons').forEach(container => {
        container.classList.toggle('active', container.getAttribute('data-block') === blockCode);
    });
    document.querySelectorAll('.set-selection-header').forEach(header => {
        header.classList.toggle('active', header.getAttribute('data-block') === blockCode);
    });

    // Hide all set sections (user must click a set to see cards)
    document.querySelectorAll('.set-section').forEach(section => {
        section.classList.remove('active');
    });
    currentSet = null;

    // Deactivate all Pokemon set buttons (scoped to avoid affecting other tabs)
    document.querySelectorAll('.set-btn[data-set-key]').forEach(btn => {
        btn.classList.remove('active');
    });

    // Render set buttons for this block if not already rendered
    renderSetButtonsForBlock(blockCode);
}

// Render set buttons for a specific block
function renderSetButtonsForBlock(blockCode) {
    const container = document.getElementById(`setButtons-${blockCode}`);
    if (!container) return;

    // Check if already rendered
    if (container.children.length > 0) return;

    const blocks = getSetsByBlock();
    const block = blocks[blockCode];
    if (!block) return;

    block.sets.forEach(setKey => {
        const setData = cardSets[setKey];
        const btn = document.createElement('button');
        btn.className = 'set-btn' + (setKey === currentSet ? ' active' : '');
        btn.setAttribute('data-set-key', setKey);

        // Set theme gradient via CSS custom properties (block color)
        const themeColor = BLOCK_THEME_COLORS[blockCode] || '#ffffff';
        btn.style.setProperty('--set-accent', themeColor + '25');
        btn.style.setProperty('--set-border', themeColor + '55');

        // Format release date
        let dateStr = '';
        if (setData.releaseDate) {
            const d = new Date(setData.releaseDate + 'T00:00:00');
            dateStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }

        // Calculate progress
        const progress = getSetProgress(setKey);

        // Get set logo URL from pokemontcg.io API
        const apiSetId = TCG_API_SET_IDS[setKey] || setData.setCode;
        const logoUrl = `https://images.pokemontcg.io/${apiSetId}/logo.png`;

        btn.innerHTML = `
            <div class="set-btn-logo-wrapper">
                <img src="${logoUrl}" alt="${setData.displayName}" class="set-btn-logo"
                     onerror="this.style.display='none';this.nextElementSibling.style.display=''">
                <div class="set-btn-logo-fallback" style="display:none">⚡</div>
            </div>
            <div class="set-btn-name">${setData.displayName}</div>
            ${dateStr ? `<div class="set-release-date">${dateStr}</div>` : ''}
            <div class="set-btn-stats">${progress.collected}/${progress.total} (${progress.percentage}%)</div>
            <div class="set-btn-progress">
                <div class="set-btn-progress-fill" style="width: ${progress.percentage}%"></div>
            </div>
        `;

        btn.onclick = () => switchSet(setKey);
        container.appendChild(btn);
    });
}

// Legacy function - now redirects to block/set system
function renderSetButtons() {
    renderBlockButtons();
    // No auto-selection - user must click to select a block
}

// Calculate progress for a single set
function getSetProgress(setKey) {
    const setData = cardSets[setKey];
    let totalVariants = 0;
    let collectedVariants = 0;

    if (setData && setData.cards) {
        setData.cards.forEach(card => {
            const variants = getVariants(card, setKey);
            totalVariants += variants.length;

            const cardProgress = (collectionProgress[setKey] || {})[card.number] || {};
            variants.forEach(variant => {
                if (cardProgress[variant]) collectedVariants++;
            });
        });
    }

    const percentage = totalVariants > 0 ? (collectedVariants / totalVariants * 100).toFixed(1) : '0.0';
    return { collected: collectedVariants, total: totalVariants, percentage };
}

// Update progress bars in set buttons without full re-render
function updateSetButtonProgress() {
    // Update set buttons
    document.querySelectorAll('.set-btn[data-set-key]').forEach(btn => {
        const setKey = btn.getAttribute('data-set-key');
        const progress = getSetProgress(setKey);
        const fill = btn.querySelector('.set-btn-progress-fill');
        const stats = btn.querySelector('.set-btn-stats');
        if (fill) fill.style.width = progress.percentage + '%';
        if (stats) stats.textContent = `${progress.collected}/${progress.total} (${progress.percentage}%)`;
    });

    // Update block buttons
    document.querySelectorAll('.block-btn[data-block-code]').forEach(btn => {
        const blockCode = btn.getAttribute('data-block-code');
        const progress = getBlockProgress(blockCode);
        const fill = btn.querySelector('.block-btn-progress-fill');
        const stats = btn.querySelector('.block-btn-stats');
        const blocks = getSetsByBlock();
        const block = blocks[blockCode];
        if (fill) fill.style.width = progress.percentage + '%';
        if (stats && block) stats.textContent = `${block.sets.length} set${block.sets.length !== 1 ? 's' : ''} · ${progress.collected}/${progress.total} variants`;
    });
}

// Switch top-level tabs
function switchTopTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.top-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`.top-tab[onclick="switchTopTab('${tabId}')"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.top-tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabId + '-content').classList.add('active');
}

// Switch active set
function switchSet(setKey) {
    // If clicking the currently active set, deselect it (toggle off)
    if (currentSet === setKey) {
        currentSet = null;

        // Deactivate all set buttons
        document.querySelectorAll('.set-btn[data-set-key]').forEach(btn => {
            btn.classList.remove('active');
        });

        // Hide all set sections
        document.querySelectorAll('#pokemon-tcg-content .set-section').forEach(section => {
            section.classList.remove('active');
        });

        return;
    }

    // Select the new set
    currentSet = setKey;

    // Update Pokemon set buttons only (scoped to avoid affecting other tabs)
    document.querySelectorAll('.set-btn[data-set-key]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-set-key') === setKey);
    });

    // Update sections within Pokemon TCG content only
    document.querySelectorAll('#pokemon-tcg-content .set-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(setKey).classList.add('active');

    // Render cards if not already rendered
    const grid = document.getElementById(setKey + '-grid');
    if (grid && grid.children.length === 0) {
        renderCards(setKey);
    }
}


// Render cards for a set
function renderCards(setKey) {
    console.log(`renderCards: ${setKey}`);

    const grid = document.getElementById(setKey + '-grid');
    const setData = cardSets[setKey];

    console.log(`Grid found: ${!!grid}, Data found: ${!!setData}`);

    if (!grid) {
        console.log(`ERROR: No grid for ${setKey}-grid`);
        return;
    }

    if (!setData) {
        console.log(`ERROR: No data for ${setKey}`);
        return;
    }

    grid.innerHTML = '';

    if (!collectionProgress[setKey]) {
        collectionProgress[setKey] = {};
    }

    console.log(`Rendering ${setData.cards.length} cards`);

    setData.cards.forEach((card, index) => {
        const variants = getVariants(card, setKey);
        const cardProgress = collectionProgress[setKey][card.number] || {};
        const allCollected = variants.every(v => cardProgress[v]);
        const isSingleVariant = variants.length === 1 && variants[0] === 'single';
        const isSecret = card.number > setData.mainSet;

        const cardEl = document.createElement('div');
        cardEl.className = 'card-item' + (allCollected ? ' all-collected' : '');
        cardEl.setAttribute('data-completed', allCollected ? 'true' : 'false');
        cardEl.style.cursor = 'pointer';
        cardEl.onclick = function(e) {
            // Don't open modal if clicking on checkboxes or their containers
            if (e.target.tagName === 'INPUT' ||
                e.target.tagName === 'LABEL' ||
                e.target.closest('.variant-checkbox') ||
                e.target.closest('.single-variant')) {
                return;
            }
            openCardModal(setKey, card.number);
        };

        const rarityClass = card.type === 'trainer' ? 'rarity-trainer' : `rarity-${card.rarity}`;

        // Format card number for search (e.g., "184/182") - needed for variant TCGPlayer links
        const formattedCardNumber = isSecret ? `${card.number}/${setData.mainSet}` : `${card.number}/${setData.totalCards}`;

        let variantHTML = '';
        if (isSingleVariant) {
            const isChecked = cardProgress['single'] || false;
            variantHTML = `
                <div class="single-variant ${isChecked ? 'checked' : ''}" onclick="toggleVariant('${setKey}', ${card.number}, 'single')">
                    <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="event.stopPropagation(); toggleVariant('${setKey}', ${card.number}, 'single')">
                    <label>✓ Collected</label>
                </div>
            `;
        } else {
            variantHTML = variants.map(variant => {
                const isChecked = cardProgress[variant] || false;
                const info = variantLabels[variant];
                const variantTCGUrl = getTCGPlayerUrl(card.name, setData.name, setData.setCode, formattedCardNumber, variant);
                return `
                    <div class="variant-checkbox ${isChecked ? 'checked' : ''}" onclick="toggleVariant('${setKey}', ${card.number}, '${variant}')">
                        <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="event.stopPropagation(); toggleVariant('${setKey}', ${card.number}, '${variant}')">
                        <label>${info.icon} ${info.label}</label>
                        <a href="${variantTCGUrl}" target="_blank" class="variant-tcgplayer-link" title="Search ${info.label} on TCGPlayer" onclick="event.stopPropagation();">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                                <path d="M19 19H5V5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                            </svg>
                        </a>
                    </div>
                `;
            }).join('');
            variantHTML = '<div class="variant-checkboxes">' + variantHTML + '</div>';
        }

        const apiImgUrl = getCardImageUrl(setKey, card.number, card.imageId);
        const tcgdexImgUrl = getTcgdexImageUrl(setKey, card.number, card.imageId);
        const localImgUrl = `Images/cards/${setKey}/${String(card.number).padStart(3, '0')}.png`;
        const primarySrc = apiImgUrl || tcgdexImgUrl || localImgUrl;
        const tcgplayerUrl = getTCGPlayerUrl(card.name, setData.name, setData.setCode, formattedCardNumber);

        cardEl.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${primarySrc}"
                     alt="${card.name.replace(/"/g, '&quot;')}"
                     loading="lazy"
                     ${tcgdexImgUrl ? `data-tcgdex-src="${tcgdexImgUrl}"` : ''}
                     data-local-src="${localImgUrl}"
                     data-card-name="${card.name.replace(/"/g, '&quot;')}"
                     data-card-number="${card.number}"
                     data-card-rarity="${card.rarity}"
                     onerror="handleImgError(this)">
            </div>
            <div class="card-header">
                <div class="card-info">
                    <div class="card-number">#${String(card.number).padStart(3, '0')}${isSecret ? ` / ${setData.mainSet}` : ''}</div>
                    <div class="card-name">${card.name}</div>
                    <span class="rarity-badge ${rarityClass}">${card.type === 'trainer' ? 'TRAINER' : getRarityDisplay(card.rarity)}</span>
                </div>
                <a href="${tcgplayerUrl}" target="_blank" class="tcgplayer-link" title="View on TCGPlayer" onclick="event.stopPropagation();">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M19 19H5V5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                    </svg>
                </a>
            </div>
            <div class="variants-section">
                <div class="variants-title">${isSingleVariant ? 'STATUS:' : 'VARIANTS:'}</div>
                ${variantHTML}
                ${allCollected ? `<div class="completed-lock"><svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg>Complete</div>` : ''}
            </div>
        `;

        grid.appendChild(cardEl);
    });

    console.log(`✓ Done: ${grid.children.length} cards in grid`);

    // Reapply active filters and search after rendering
    applyFiltersAndSearch(setKey);
}

// Store active filters and searches for each set
let activeFilters = {};
let activeSearches = {};

// Filter cards by completion status
window.filterCards = function(setKey, filterType) {
    // Update active filter
    activeFilters[setKey] = filterType;

    // Update button states
    const section = document.getElementById(setKey);
    if (section) {
        const buttons = section.querySelectorAll('.filter-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if ((filterType === 'all' && btn.textContent === 'All') ||
                (filterType === 'incomplete' && btn.textContent === 'Incomplete') ||
                (filterType === 'complete' && btn.textContent === 'Complete')) {
                btn.classList.add('active');
            }
        });
    }

    // Apply filter to cards
    applyFiltersAndSearch(setKey);
};

// Search cards by name or number
window.searchCards = function(setKey, query) {
    activeSearches[setKey] = query.toLowerCase().trim();

    // Show/hide clear button
    const section = document.getElementById(setKey);
    if (section) {
        const clearBtn = section.querySelector('.search-clear');
        if (clearBtn) {
            if (query.trim()) {
                clearBtn.classList.add('visible');
            } else {
                clearBtn.classList.remove('visible');
            }
        }
    }

    // Apply search to cards
    applyFiltersAndSearch(setKey);
};

// Clear search input
window.clearSearch = function(setKey) {
    const section = document.getElementById(setKey);
    if (section) {
        const searchInput = section.querySelector('.search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        const clearBtn = section.querySelector('.search-clear');
        if (clearBtn) {
            clearBtn.classList.remove('visible');
        }
    }
    activeSearches[setKey] = '';
    applyFiltersAndSearch(setKey);
};

// Apply both filters and search to cards
function applyFiltersAndSearch(setKey) {
    const grid = document.getElementById(setKey + '-grid');
    if (!grid) return;

    const filterType = activeFilters[setKey] || 'all';
    const searchQuery = activeSearches[setKey] || '';

    const cards = grid.querySelectorAll('.card-item');
    cards.forEach(card => {
        let show = true;

        // Apply filter
        const isCompleted = card.getAttribute('data-completed') === 'true';
        if (filterType === 'incomplete' && isCompleted) {
            show = false;
        } else if (filterType === 'complete' && !isCompleted) {
            show = false;
        }

        // Apply search
        if (show && searchQuery) {
            const cardName = card.querySelector('.card-name')?.textContent.toLowerCase() || '';
            const cardNumber = card.querySelector('.card-number')?.textContent.toLowerCase() || '';

            if (!cardName.includes(searchQuery) && !cardNumber.includes(searchQuery)) {
                show = false;
            }
        }

        // Show or hide card
        card.style.display = show ? '' : 'none';
    });
}
