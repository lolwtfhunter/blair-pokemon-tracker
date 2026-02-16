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

// Generate inline SVG data URI as fallback logo for Lorcana set buttons.
// Uses a double-hexagon (Lorcana's signature shape) with set-specific colors
// and Roman numeral identifiers. Local logo files take priority if they exist.
function getLorcanaSetLogoFallback(setKey) {
    const setStyles = {
        'first-chapter':         { color: '#c9a84c', label: 'I' },
        'rise-of-the-floodborn': { color: '#3a7bd5', label: 'II' },
        'into-the-inklands':     { color: '#2ecc71', label: 'III' },
        'ursulas-return':        { color: '#9b59b6', label: 'IV' },
        'shimmering-skies':      { color: '#00b4d8', label: 'V' },
        'azurite-sea':           { color: '#0077b6', label: 'VI' },
        'archazias-island':      { color: '#e67e22', label: 'VII' },
        'the-flood':             { color: '#c0392b', label: 'VIII' },
        'neverland':             { color: '#27ae60', label: 'IX' },
        'whispers-in-the-well':  { color: '#7b5ea7', label: 'X' }
    };
    const style = setStyles[setKey] || { color: '#c9a84c', label: '?' };
    const c = style.color;
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
        '<polygon points="50,3 95,28 95,72 50,97 5,72 5,28" fill="none" stroke="' + c + '" stroke-width="3"/>' +
        '<polygon points="50,15 82,34 82,66 50,85 18,66 18,34" fill="none" stroke="' + c + '" stroke-width="1.5" opacity="0.4"/>' +
        '<text x="50" y="58" text-anchor="middle" fill="' + c + '" font-family="Georgia,serif" font-size="28" font-weight="bold">' + style.label + '</text>' +
        '</svg>';
    return 'data:image/svg+xml;base64,' + btoa(svg);
}

// Get image URL for Lorcana cards with multiple CDN fallbacks
function getLorcanaCardImageUrl(card, setKey) {
    const setData = lorcanaCardSets[setKey];
    if (!setData) return null;

    const setCode = setData.setCode;
    const cardNumber = card.number;
    const dreambornId = card.dreambornId || '';

    // Build array of image URLs to try (in order of preference)
    const imageUrls = [];

    if (dreambornId) {
        const parts = dreambornId.split('-');
        const setNum = parts.length >= 2 ? parseInt(parts[0]) : null;
        const cardNum = parts.length >= 2 ? parseInt(parts[1]) : null;

        // Tier 1: Dreamborn CDN with various extensions
        imageUrls.push(`https://cdn.dreamborn.ink/images/en/cards/${dreambornId}.webp`);
        imageUrls.push(`https://cdn.dreamborn.ink/images/en/cards/${dreambornId}.png`);
        imageUrls.push(`https://cdn.dreamborn.ink/images/en/cards/${dreambornId}.jpg`);
        imageUrls.push(`https://cdn.dreamborn.ink/images/en/cards/${dreambornId}`);

        // Tier 2: Lorcania CDN
        if (setNum && cardNum) {
            imageUrls.push(`https://lorcania.com/cards/${setNum}/${cardNum}.webp`);
            imageUrls.push(`https://lorcania.com/cards/${setNum}/${cardNum}.jpg`);
            imageUrls.push(`https://lorcania.com/cards/${setNum}/${cardNum}.png`);
        }
    }

    // Tier 3: Direct card number fallback
    const paddedNumber = String(cardNumber).padStart(3, '0');
    imageUrls.push(`./Images/lorcana/${setKey}/${paddedNumber}.jpg`);
    imageUrls.push(`./Images/lorcana/${setKey}/${paddedNumber}.png`);
    imageUrls.push(`./Images/lorcana/${setKey}/${paddedNumber}.webp`);

    // Return the first URL (browser will try fallbacks via onerror)
    return imageUrls.length > 0 ? imageUrls[0] : null;
}

// Handle Lorcana image loading with multi-tier CDN fallback
function tryNextLorcanaImage(img, card, setKey, attemptIndex = 0) {
    const setData = lorcanaCardSets[setKey];
    if (!setData) return;

    const dreambornId = card.dreambornId || '';
    const paddedNumber = String(card.number).padStart(3, '0');

    // Build fallback URLs (matching getLorcanaCardImageUrl)
    const fallbackUrls = [];

    if (dreambornId) {
        const parts = dreambornId.split('-');
        const setNum = parts.length >= 2 ? parseInt(parts[0]) : null;
        const cardNum = parts.length >= 2 ? parseInt(parts[1]) : null;

        // Dreamborn CDN with various extensions
        fallbackUrls.push(`https://cdn.dreamborn.ink/images/en/cards/${dreambornId}.webp`);
        fallbackUrls.push(`https://cdn.dreamborn.ink/images/en/cards/${dreambornId}.png`);
        fallbackUrls.push(`https://cdn.dreamborn.ink/images/en/cards/${dreambornId}.jpg`);
        fallbackUrls.push(`https://cdn.dreamborn.ink/images/en/cards/${dreambornId}`);

        // Lorcania CDN
        if (setNum && cardNum) {
            fallbackUrls.push(`https://lorcania.com/cards/${setNum}/${cardNum}.webp`);
            fallbackUrls.push(`https://lorcania.com/cards/${setNum}/${cardNum}.jpg`);
            fallbackUrls.push(`https://lorcania.com/cards/${setNum}/${cardNum}.png`);
        }
    }

    // Local fallbacks
    fallbackUrls.push(`./Images/lorcana/${setKey}/${paddedNumber}.jpg`);
    fallbackUrls.push(`./Images/lorcana/${setKey}/${paddedNumber}.png`);
    fallbackUrls.push(`./Images/lorcana/${setKey}/${paddedNumber}.webp`);

    // Try next URL
    if (attemptIndex < fallbackUrls.length) {
        img.src = fallbackUrls[attemptIndex];
        img.onerror = function() {
            tryNextLorcanaImage(img, card, setKey, attemptIndex + 1);
        };
    } else {
        // All URLs failed, show placeholder
        showPlaceholder(img);
    }
}

// Render Lorcana set buttons
function renderLorcanaSetButtons() {
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

        // Format release date
        let dateStr = '';
        if (setData.releaseDate) {
            const d = new Date(setData.releaseDate + 'T00:00:00');
            dateStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }

        // Calculate progress
        const progress = getLorcanaSetProgress(setKey);

        // Lorcana logos - try local file first, fall back to inline SVG logo
        const localLogoUrl = `./Images/lorcana/logos/${setKey}.png`;
        const fallbackLogoUrl = getLorcanaSetLogoFallback(setKey);

        btn.innerHTML = `
            <div class="set-btn-logo-wrapper">
                <img src="${localLogoUrl}" alt="${setData.displayName}" class="set-btn-logo"
                     data-fallback-src="${fallbackLogoUrl}"
                     onerror="this.onerror=null;this.src=this.getAttribute('data-fallback-src')">
                <div class="set-btn-logo-fallback" style="display:none">&#127183;</div>
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

    // Update sections
    document.querySelectorAll('#lorcana-content .set-section').forEach(section => {
        section.classList.toggle('active', section.id === setKey);
    });

    if (!lorcanaCardSets[setKey]) return;
    renderLorcanaCards(setKey);
    updateLorcanaSetButtonProgress();
}

// Render Lorcana cards for a set
function renderLorcanaCards(setKey) {
    const setData = lorcanaCardSets[setKey];
    const grid = document.getElementById(`${setKey}-grid`);
    if (!grid) return;

    grid.innerHTML = '';

    setData.cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.setAttribute('data-card-number', card.number);
        cardEl.setAttribute('data-card-name', card.name.toLowerCase());

        const cardProgress = collectionProgress[setKey]?.[card.number] || {};
        const allCollected = cardProgress['single'] || false;

        cardEl.classList.toggle('completed', allCollected);

        const rarityClass = (card.rarity || 'common').replace(/_/g, '-');

        // Lorcana uses single variant for now
        const isChecked = cardProgress['single'] || false;
        const variantHTML = `
            <div class="single-variant ${isChecked ? 'checked' : ''}" onclick="toggleLorcanaVariant('${setKey}', ${card.number}, 'single')">
                <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="event.stopPropagation(); toggleLorcanaVariant('${setKey}', ${card.number}, 'single')">
                <label>&#10003; Collected</label>
            </div>
        `;

        // Get image URL with CDN fallbacks
        const imgUrl = getLorcanaCardImageUrl(card, setKey);
        const displayNumber = String(card.number).padStart(3, '0');

        cardEl.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${imgUrl || ''}"
                     alt="${card.name.replace(/"/g, '&quot;')}"
                     loading="lazy"
                     data-card-name="${card.name.replace(/"/g, '&quot;')}"
                     data-card-number="${displayNumber}"
                     data-card-rarity="${card.rarity}"
                     data-lorcana-card-number="${card.number}"
                     data-lorcana-dreamborn-id="${card.dreambornId || ''}"
                     data-lorcana-set-key="${setKey}"
                     onerror="tryNextLorcanaImage(this, {number: ${card.number}, dreambornId: '${card.dreambornId || ''}'}, '${setKey}', 1)">
            </div>
            <div class="card-header">
                <div class="card-info">
                    <div class="card-number">#${displayNumber}</div>
                    <div class="card-name">${card.name}</div>
                    <span class="rarity-badge ${rarityClass}">${card.rarity}</span>
                </div>
            </div>
            <div class="variants-section">
                <div class="variants-title">STATUS:</div>
                ${variantHTML}
                ${allCollected ? `<div class="completed-lock"><svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg>Complete</div>` : ''}
            </div>
        `;

        grid.appendChild(cardEl);
    });
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

// Filter Lorcana cards
function filterLorcanaCards(setKey, filter) {
    const section = document.getElementById(setKey);
    if (!section) return;

    section.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === filter);
    });

    const cards = section.querySelectorAll('.card');
    cards.forEach(card => {
        if (filter === 'all') {
            card.style.display = '';
        } else if (filter === 'incomplete') {
            card.style.display = card.classList.contains('completed') ? 'none' : '';
        } else if (filter === 'complete') {
            card.style.display = card.classList.contains('completed') ? '' : 'none';
        }
    });
}

// Search Lorcana cards
function searchLorcanaCards(setKey, query) {
    const section = document.getElementById(setKey);
    if (!section) return;

    const searchQuery = query.toLowerCase().trim();
    const cards = section.querySelectorAll('.card');

    cards.forEach(card => {
        const cardName = card.getAttribute('data-card-name');
        const cardNumber = card.getAttribute('data-card-number');

        if (!searchQuery) {
            card.style.display = '';
        } else {
            const matches = cardName.includes(searchQuery) || cardNumber.includes(searchQuery);
            card.style.display = matches ? '' : 'none';
        }
    });
}

// Clear Lorcana search
function clearLorcanaSearch(setKey) {
    const section = document.getElementById(setKey);
    if (!section) return;

    const searchInput = section.querySelector('.search-input');
    if (searchInput) {
        searchInput.value = '';
        searchLorcanaCards(setKey, '');
    }
}

// Initialize Lorcana progress
function initializeLorcanaProgress() {
    Object.keys(lorcanaCardSets).forEach(setKey => {
        if (!collectionProgress[setKey]) {
            collectionProgress[setKey] = {};
        }
    });
}
