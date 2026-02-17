// Card detail modal functions

// Modal navigation state
let modalSetKey = null;
let modalCardNumber = null;

// Card Detail Modal Functions
window.openCardModal = function(setKey, cardNumber) {
    let setData, card, variants, setName, isLorcana = false;

    // Get card data based on set type
    if (lorcanaCardSets[setKey]) {
        isLorcana = true;
        setData = lorcanaCardSets[setKey];
        card = setData ? setData.cards.find(c => c.number === cardNumber) : null;
        variants = ['single'];
        setName = setData ? setData.name : '';
    } else if (setKey.startsWith('custom-')) {
        const customKey = setKey.replace('custom-', '');
        setData = customCardSets[customKey];
        card = setData ? setData.cards.find(c => c.number === cardNumber) : null;
        variants = card ? getCustomCardVariants(card) : ['single'];
        setName = card && card.setOrigin ? card.setOrigin : (setData ? setData.name : '');
    } else {
        setData = cardSets[setKey];
        card = setData ? setData.cards.find(c => c.number === cardNumber) : null;
        variants = card ? getVariants(card, setKey) : [];
        setName = setData ? setData.name : '';
    }

    if (!card) return;

    modalSetKey = setKey;
    modalCardNumber = cardNumber;

    // Get modal elements
    const modal = document.getElementById('cardModal');
    const imageContainer = document.querySelector('.card-modal-image');
    let modalImage = document.getElementById('modalCardImage');

    // Restore <img> if showPlaceholder replaced it with a placeholder div
    if (!modalImage && imageContainer) {
        imageContainer.innerHTML = '<img id="modalCardImage">';
        modalImage = document.getElementById('modalCardImage');
    }

    const modalName = document.getElementById('modalCardName');
    const modalNumber = document.getElementById('modalCardNumber');
    const modalSet = document.getElementById('modalCardSet');
    const modalRarity = document.getElementById('modalCardRarity');
    const modalTCGPlayerLink = document.getElementById('modalTCGPlayerLink');
    const modalVariantsTitle = document.getElementById('modalVariantsTitle');
    const modalVariantList = document.getElementById('modalVariantList');

    // Clear all stale image attributes from previous modal opens
    modalImage.onerror = null;
    modalImage.removeAttribute('data-scrydex-src');
    modalImage.removeAttribute('data-tcgdex-src');
    modalImage.removeAttribute('data-local-src');
    modalImage.removeAttribute('data-lorcana-fallbacks');
    modalImage.removeAttribute('data-lorcana-fallback-idx');
    modalImage.removeAttribute('data-lorcana-card-number');
    modalImage.removeAttribute('data-lorcana-dreamborn-id');
    modalImage.removeAttribute('data-lorcana-set-key');

    // Set card image with proper fallback chain
    let primarySrc;
    if (isLorcana) {
        // Lorcana: pre-bake full fallback chain into data attributes
        const urls = buildLorcanaImageUrls(card.dreambornId || '', setKey, card.number);
        primarySrc = urls[0] || '';
        modalImage.setAttribute('data-lorcana-card-number', card.number);
        modalImage.setAttribute('data-lorcana-dreamborn-id', card.dreambornId || '');
        modalImage.setAttribute('data-lorcana-set-key', setKey);
        modalImage.setAttribute('data-lorcana-fallbacks', JSON.stringify(urls));
        modalImage.setAttribute('data-lorcana-fallback-idx', '0');
        modalImage.onerror = function() {
            tryNextLorcanaImageFromData(this);
        };
    } else if (setKey.startsWith('custom-')) {
        // For custom sets, use pokemontcg.io primary with Scrydex/TCGdex fallback
        primarySrc = getCustomCardImageUrl(card);
        const scrydexUrl = getCustomCardScrydexUrl(card);
        const tcgdexUrl = getCustomCardTcgdexUrl(card);
        if (scrydexUrl) modalImage.setAttribute('data-scrydex-src', scrydexUrl);
        if (tcgdexUrl) modalImage.setAttribute('data-tcgdex-src', tcgdexUrl);
        modalImage.onerror = function() { handleImgError(this); };
    } else {
        // For regular sets, use the standard image URL logic with full fallback chain
        const apiImgUrl = getCardImageUrl(setKey, card.number, card.imageId);
        const scrydexImgUrl = getScrydexImageUrl(setKey, card.number);
        const tcgdexImgUrl = getTcgdexImageUrl(setKey, card.number, card.imageId);
        const localImgUrl = `Images/cards/${setKey}/${String(card.number).padStart(3, '0')}.png`;
        primarySrc = apiImgUrl || scrydexImgUrl || tcgdexImgUrl || localImgUrl;
        if (scrydexImgUrl) modalImage.setAttribute('data-scrydex-src', scrydexImgUrl);
        if (tcgdexImgUrl) modalImage.setAttribute('data-tcgdex-src', tcgdexImgUrl);
        modalImage.setAttribute('data-local-src', localImgUrl);
        modalImage.onerror = function() { handleImgError(this); };
    }
    modalImage.src = primarySrc || '';
    modalImage.alt = card.name;
    modalImage.setAttribute('data-card-name', card.name);
    modalImage.setAttribute('data-card-number', card.number);
    modalImage.setAttribute('data-card-rarity', card.rarity);

    // Set card details
    modalName.textContent = card.name;

    // Display card number
    let displayNumber;
    if (setKey.startsWith('custom-')) {
        displayNumber = card.originalNumber ? card.originalNumber : String(card.number).padStart(3, '0');
        modalNumber.textContent = `#${displayNumber}${card.region === 'JP' ? ' (JP)' : ''}`;
    } else if (isLorcana) {
        displayNumber = String(card.number).padStart(3, '0');
        const totalCards = setData.totalCards || '';
        modalNumber.textContent = `#${displayNumber}${totalCards ? ` / ${totalCards}` : ''}`;
    } else {
        const isSecret = card.number > setData.mainSet;
        displayNumber = String(card.number).padStart(3, '0');
        modalNumber.textContent = `#${displayNumber}${isSecret ? ` / ${setData.mainSet}` : ''}`;
    }

    modalSet.textContent = `Set: ${setName}`;

    // Set rarity badge
    if (isLorcana) {
        const rarityClass = `rarity-${card.rarity}`;
        modalRarity.className = 'card-modal-rarity ' + rarityClass;
        modalRarity.textContent = getLorcanaRarityDisplay(card.rarity);
    } else {
        const rarityClass = card.type === 'trainer' ? 'rarity-trainer' : `rarity-${card.rarity}`;
        modalRarity.className = 'card-modal-rarity ' + rarityClass;
        modalRarity.textContent = card.type === 'trainer' ? 'TRAINER' : getRarityDisplay(card.rarity);
    }

    // Set market price
    const modalPriceEl = document.getElementById('modalCardPrice');
    if (modalPriceEl && typeof getCardPrice === 'function') {
        let price;
        if (setKey.startsWith('custom-') && typeof getCustomCardPrice === 'function') {
            price = getCustomCardPrice(card);
        } else {
            price = getCardPrice(setKey, cardNumber);
        }
        if (price) {
            modalPriceEl.querySelector('.modal-price-value').textContent = '$' + price.toFixed(2);
            modalPriceEl.style.display = '';
        } else {
            modalPriceEl.style.display = 'none';
        }
    }

    // Set TCGPlayer link
    if (isLorcana) {
        const tcgplayerUrl = getLorcanaTCGPlayerUrl(card.name, setName, card.number);
        modalTCGPlayerLink.href = tcgplayerUrl;
        modalTCGPlayerLink.textContent = 'View on TCGPlayer';
        modalTCGPlayerLink.style.display = 'inline-block';
    } else if (setKey.startsWith('custom-')) {
        // For custom sets, use the card's setOrigin
        const customCardNumber = card.originalNumber || null;
        const tcgplayerUrl = getTCGPlayerUrl(card.name, card.setOrigin || 'Pokemon', '', customCardNumber);
        modalTCGPlayerLink.href = tcgplayerUrl;
        modalTCGPlayerLink.textContent = 'View on TCGPlayer';
        modalTCGPlayerLink.style.display = 'inline-block';
    } else if (setData && setData.setCode) {
        // For regular sets, use the setCode with formatted card number
        const isSecret = card.number > setData.mainSet;
        const formattedCardNumber = isSecret ? `${card.number}/${setData.mainSet}` : `${card.number}/${setData.totalCards}`;
        const tcgplayerUrl = getTCGPlayerUrl(card.name, setName, setData.setCode, formattedCardNumber);
        modalTCGPlayerLink.href = tcgplayerUrl;
        modalTCGPlayerLink.textContent = 'View on TCGPlayer';
        modalTCGPlayerLink.style.display = 'inline-block';
    } else {
        // Hide link if no set information is available
        modalTCGPlayerLink.style.display = 'none';
    }

    // Set variants
    const isSingleVariant = variants.length === 1 && variants[0] === 'single';
    modalVariantsTitle.textContent = isSingleVariant ? 'Collection Status:' : 'Variants:';

    // Build variant list
    const cardProgress = collectionProgress[setKey] ? collectionProgress[setKey][cardNumber] || {} : {};
    modalVariantList.innerHTML = '';

    // Determine the correct toggle function name
    const toggleFn = isLorcana ? 'toggleLorcanaVariantFromModal' : 'toggleVariantFromModal';

    if (isSingleVariant) {
        const isChecked = cardProgress['single'] || false;
        const variantItem = document.createElement('div');
        variantItem.className = 'card-modal-variant-item' + (isChecked ? ' collected' : '');
        variantItem.innerHTML = `
            <input type="checkbox" class="card-modal-variant-checkbox" ${isChecked ? 'checked' : ''}
                   onchange="${toggleFn}('${setKey}', ${cardNumber}, 'single')">
            <label>✓ Collected</label>
        `;
        modalVariantList.appendChild(variantItem);
    } else {
        // Handle multiple variants
        if (setKey.startsWith('custom-') && card.variants && card.variants.length > 0) {
            // Custom set with multiple variants
            card.variants.forEach(v => {
                const isChecked = cardProgress[v.rarity] || false;
                const displayNum = v.originalNumber ? ` #${v.originalNumber}` : '';
                const variantItem = document.createElement('div');
                variantItem.className = 'card-modal-variant-item' + (isChecked ? ' collected' : '');
                variantItem.innerHTML = `
                    <input type="checkbox" class="card-modal-variant-checkbox" ${isChecked ? 'checked' : ''}
                           onchange="toggleVariantFromModal('${setKey}', ${cardNumber}, '${v.rarity}')">
                    <label>${getRarityDisplay(v.rarity)}${displayNum}</label>
                `;
                modalVariantList.appendChild(variantItem);
            });
        } else {
            // Regular set variants
            variants.forEach(variant => {
                const isChecked = cardProgress[variant] || false;
                const info = variantLabels[variant];
                const variantItem = document.createElement('div');
                variantItem.className = 'card-modal-variant-item' + (isChecked ? ' collected' : '');
                variantItem.innerHTML = `
                    <input type="checkbox" class="card-modal-variant-checkbox" ${isChecked ? 'checked' : ''}
                           onchange="toggleVariantFromModal('${setKey}', ${cardNumber}, '${variant}')">
                    <label>${info.icon} ${info.label}</label>
                `;
                modalVariantList.appendChild(variantItem);
            });
        }
    }

    // Show modal
    modal.classList.add('visible');
};

window.closeCardModal = function() {
    const modal = document.getElementById('cardModal');
    modal.classList.remove('visible');
    modalSetKey = null;
    modalCardNumber = null;
};

// Toggle variant from modal (Pokemon/Custom)
window.toggleVariantFromModal = function(setKey, cardNumber, variant) {
    toggleVariant(setKey, cardNumber, variant);
    setTimeout(() => { openCardModal(setKey, cardNumber); }, 50);
};

// Toggle variant from modal (Lorcana)
window.toggleLorcanaVariantFromModal = function(setKey, cardNumber, variant) {
    toggleLorcanaVariant(setKey, cardNumber, variant);
    setTimeout(() => { openCardModal(setKey, cardNumber); }, 50);
};

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('cardModal');
    if (e.target === modal) {
        closeCardModal();
    }
});

// Navigate to adjacent card in the current set
window.navigateModal = function navigateModal(direction) {
    if (!modalSetKey || modalCardNumber == null) return;

    let cards;
    if (lorcanaCardSets[modalSetKey]) {
        cards = lorcanaCardSets[modalSetKey].cards;
    } else if (modalSetKey.startsWith('custom-')) {
        const customKey = modalSetKey.replace('custom-', '');
        cards = customCardSets[customKey] ? customCardSets[customKey].cards : null;
    } else {
        cards = cardSets[modalSetKey] ? cardSets[modalSetKey].cards : null;
    }
    if (!cards) return;

    const currentIndex = cards.findIndex(c => c.number === modalCardNumber);
    if (currentIndex === -1) return;

    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= cards.length) return;

    openCardModal(modalSetKey, cards[newIndex].number);
};

// Touch swipe navigation on modal content
let touchStartX = 0;
const modalContent = document.querySelector('.card-modal-content');
if (modalContent) {
    modalContent.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    modalContent.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) < 50) return;
        navigateModal(dx < 0 ? 1 : -1);
    });
}

// Close modal with ESC key, navigate with arrow keys
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeCardModal();
    }
    const modal = document.getElementById('cardModal');
    if (modal && modal.classList.contains('visible')) {
        if (e.key === 'ArrowLeft') navigateModal(-1);
        if (e.key === 'ArrowRight') navigateModal(1);
    }
});
