// Card detail modal functions

// Card Detail Modal Functions
window.openCardModal = function(setKey, cardNumber) {
    let setData, card, variants, setName;

    // Get card data based on set type
    if (setKey.startsWith('custom-')) {
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

    // Get modal elements
    const modal = document.getElementById('cardModal');
    const modalImage = document.getElementById('modalCardImage');
    const modalName = document.getElementById('modalCardName');
    const modalNumber = document.getElementById('modalCardNumber');
    const modalSet = document.getElementById('modalCardSet');
    const modalRarity = document.getElementById('modalCardRarity');
    const modalTCGPlayerLink = document.getElementById('modalTCGPlayerLink');
    const modalVariantsTitle = document.getElementById('modalVariantsTitle');
    const modalVariantList = document.getElementById('modalVariantList');

    // Set card image
    let primarySrc;
    if (setKey.startsWith('custom-')) {
        // For custom sets, use the custom card image URL function
        primarySrc = getCustomCardImageUrl(card);
    } else {
        // For regular sets, use the standard image URL logic
        const apiImgUrl = getCardImageUrl(setKey, card.number, card.imageId);
        const tcgdexImgUrl = getTcgdexImageUrl(setKey, card.number, card.imageId);
        const localImgUrl = `Images/cards/${setKey}/${String(card.number).padStart(3, '0')}.png`;
        primarySrc = apiImgUrl || tcgdexImgUrl || localImgUrl;
    }
    modalImage.src = primarySrc || '';
    modalImage.alt = card.name;

    // Set card details
    modalName.textContent = card.name;

    // Display card number (use originalNumber for custom sets)
    let displayNumber;
    if (setKey.startsWith('custom-')) {
        displayNumber = card.originalNumber ? card.originalNumber : String(card.number).padStart(3, '0');
        modalNumber.textContent = `#${displayNumber}${card.region === 'JP' ? ' (JP)' : ''}`;
    } else {
        const isSecret = card.number > setData.mainSet;
        displayNumber = String(card.number).padStart(3, '0');
        modalNumber.textContent = `#${displayNumber}${isSecret ? ` / ${setData.mainSet}` : ''}`;
    }

    modalSet.textContent = `Set: ${setName}`;

    // Set rarity badge
    const rarityClass = card.type === 'trainer' ? 'rarity-trainer' : `rarity-${card.rarity}`;
    modalRarity.className = 'card-modal-rarity ' + rarityClass;
    modalRarity.textContent = card.type === 'trainer' ? 'TRAINER' : getRarityDisplay(card.rarity);

    // Set TCGPlayer link
    if (setKey.startsWith('custom-')) {
        // For custom sets, use the card's setOrigin
        const customCardNumber = card.originalNumber || null;
        const tcgplayerUrl = getTCGPlayerUrl(card.name, card.setOrigin || 'Pokemon', '', customCardNumber);
        modalTCGPlayerLink.href = tcgplayerUrl;
        modalTCGPlayerLink.style.display = 'inline-block';
    } else if (setData && setData.setCode) {
        // For regular sets, use the setCode with formatted card number
        const isSecret = card.number > setData.mainSet;
        const formattedCardNumber = isSecret ? `${card.number}/${setData.mainSet}` : `${card.number}/${setData.totalCards}`;
        const tcgplayerUrl = getTCGPlayerUrl(card.name, setName, setData.setCode, formattedCardNumber);
        modalTCGPlayerLink.href = tcgplayerUrl;
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

    if (isSingleVariant) {
        const isChecked = cardProgress['single'] || false;
        const variantItem = document.createElement('div');
        variantItem.className = 'card-modal-variant-item' + (isChecked ? ' collected' : '');
        variantItem.innerHTML = `
            <input type="checkbox" class="card-modal-variant-checkbox" ${isChecked ? 'checked' : ''}
                   onchange="toggleVariantFromModal('${setKey}', ${cardNumber}, 'single')">
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
};

// Toggle variant from modal
window.toggleVariantFromModal = function(setKey, cardNumber, variant) {
    // Use the existing toggleVariant function
    toggleVariant(setKey, cardNumber, variant);

    // Update the modal display after a brief delay to allow re-render
    setTimeout(() => {
        openCardModal(setKey, cardNumber);
    }, 50);
};

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('cardModal');
    if (e.target === modal) {
        closeCardModal();
    }
});

// Close modal with ESC key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeCardModal();
    }
});
