// Variant toggling and unlock confirmation

// Migrate legacy 'single' variant to 'unlimited' for WotC-era edition cards
function migrateEditionVariants() {
    if (localStorage.getItem('edition-migration-v1')) return;

    const editionCards = {
        'custom-its-pikachu': ['12','13','15','30','33','34','35','36','37','38','39','42'],
        'custom-psyduck': ['2','3','4','5','6','7'],
        'custom-togepi': ['4','6']
    };

    let changed = false;
    for (const [setKey, cardNumbers] of Object.entries(editionCards)) {
        if (!collectionProgress[setKey]) continue;
        for (const num of cardNumbers) {
            const cardData = collectionProgress[setKey][num];
            if (cardData && cardData['single'] !== undefined) {
                cardData['unlimited'] = cardData['single'];
                delete cardData['single'];
                changed = true;
            }
        }
    }

    if (changed) {
        localStorage.setItem('pokemonVariantProgress', JSON.stringify(collectionProgress));
        if (firebase_ref) {
            firebase_ref.set(collectionProgress);
        }
    }

    localStorage.setItem('edition-migration-v1', 'done');
}

// Save progress to localStorage
function saveProgress() {
    localStorage.setItem('pokemonVariantProgress', JSON.stringify(collectionProgress));
    if (firebase_ref) {
        firebase_ref.set(collectionProgress);
    }
}

// Toggle variant (with soft-lock protection for completed cards)
window.toggleVariant = function(setKey, cardNumber, variant) {
    if (!collectionProgress[setKey]) {
        collectionProgress[setKey] = {};
    }
    if (!collectionProgress[setKey][cardNumber]) {
        collectionProgress[setKey][cardNumber] = {};
    }

    const isCurrentlyChecked = collectionProgress[setKey][cardNumber][variant] || false;

    // If unchecking a variant on a fully-completed card, show confirmation
    if (isCurrentlyChecked) {
        let setData, card, variants;
        if (setKey.startsWith('custom-')) {
            const customKey = setKey.replace('custom-', '');
            setData = customCardSets[customKey];
            card = setData ? setData.cards.find(c => c.number === cardNumber) : null;
            variants = card ? getCustomCardVariants(card) : ['single'];
        } else {
            setData = cardSets[setKey];
            card = setData ? setData.cards.find(c => c.number === cardNumber) : null;
            variants = card ? getVariants(card, setKey) : [];
        }
        if (card) {
            const cardProgress = collectionProgress[setKey][cardNumber] || {};
            const allCollected = variants.every(v => cardProgress[v]);

            if (allCollected) {
                showUnlockConfirmation(setKey, cardNumber, variant, card.name);
                return;
            }
        }
    }

    applyVariantToggle(setKey, cardNumber, variant);
};

// Actually apply the toggle (called directly or after confirmation)
function applyVariantToggle(setKey, cardNumber, variant) {
    if (!collectionProgress[setKey]) {
        collectionProgress[setKey] = {};
    }
    if (!collectionProgress[setKey][cardNumber]) {
        collectionProgress[setKey][cardNumber] = {};
    }

    collectionProgress[setKey][cardNumber][variant] = !collectionProgress[setKey][cardNumber][variant];

    // Save to localStorage
    localStorage.setItem('pokemonVariantProgress', JSON.stringify(collectionProgress));

    // Save to Firebase
    if (firebase_ref) {
        firebase_ref.set(collectionProgress);
    }

    // Re-render
    if (setKey.startsWith('custom-')) {
        const customKey = setKey.replace('custom-', '');
        renderCustomCards(customKey);
        updateCustomSetButtonProgress();
    } else {
        renderCards(setKey);
        updateSetButtonProgress();
    }
}

// Show unlock confirmation toast
let activeToast = null;
function showUnlockConfirmation(setKey, cardNumber, variant, cardName) {
    // Remove any existing toast
    if (activeToast) {
        activeToast.remove();
        activeToast = null;
    }

    const toast = document.createElement('div');
    toast.className = 'unlock-toast';
    const variantInfo = variantLabels[variant];
    const variantName = variantInfo ? variantInfo.label : (RARITY_DISPLAY_NAMES[variant] || variant);
    toast.innerHTML = `
        <div class="unlock-toast-text">
            Uncheck <strong>${variantName}</strong> on <strong>${cardName}</strong>? This card is complete.
        </div>
        <div class="unlock-toast-buttons">
            <button class="unlock-toast-btn cancel" id="toastCancel">Keep</button>
            <button class="unlock-toast-btn confirm" id="toastConfirm">Uncheck</button>
        </div>
    `;
    document.body.appendChild(toast);
    activeToast = toast;

    // Animate in
    requestAnimationFrame(() => toast.classList.add('visible'));

    // Wire up buttons
    document.getElementById('toastConfirm').onclick = () => {
        toast.classList.remove('visible');
        setTimeout(() => { toast.remove(); activeToast = null; }, 300);
        applyVariantToggle(setKey, cardNumber, variant);
    };
    const reRender = () => {
        if (setKey.startsWith('custom-')) {
            renderCustomCards(setKey.replace('custom-', ''));
        } else {
            renderCards(setKey);
        }
    };

    document.getElementById('toastCancel').onclick = () => {
        toast.classList.remove('visible');
        setTimeout(() => { toast.remove(); activeToast = null; }, 300);
        // Re-render to restore the checkbox the browser already toggled visually
        reRender();
    };

    // Auto-dismiss after 5 seconds (treat as "Keep")
    setTimeout(() => {
        if (activeToast === toast) {
            toast.classList.remove('visible');
            setTimeout(() => { toast.remove(); activeToast = null; }, 300);
            // Re-render to restore the checkbox the browser already toggled visually
            reRender();
        }
    }, 5000);
}
