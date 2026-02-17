// Flag to skip redundant Firebase re-render after local writes
let _skipNextFirebaseRender = false;

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

// Migrate legacy custom set definitions (JSON files) into Firebase customSets/ node.
// NO LONGER AUTO-CALLED — the Family Collection migration is complete.
// Kept for reference; was previously triggered from the customSets listener in firebase-sync.js.
// Removed because it incorrectly migrated legacy sets into ALL collections that had
// progress data for custom-its-pikachu/psyduck/togepi (which was every user under the
// old global custom sets system), not just the Family Collection.
async function migrateCustomSetDefinitions(collectionId) {
    // Don't migrate if custom sets already exist in Firebase for this collection
    if (Object.keys(customCardSets).length > 0) {
        return;
    }

    const migrationKey = 'custom-sets-def-migrated-v2-' + collectionId;
    if (localStorage.getItem(migrationKey)) return;

    // Read progress data directly from Firebase (the global collectionProgress
    // may not be populated yet since the data listener fires independently)
    const db = firebase.database();
    let progressData;
    try {
        const progressSnap = await db.ref('collections/' + collectionId + '/data').once('value');
        progressData = progressSnap.val() || {};
    } catch (err) {
        console.warn('Could not read progress data for migration check:', err);
        return;
    }

    // Only migrate if the collection has progress data for one of the legacy custom sets
    const hasLegacyData = progressData['custom-its-pikachu'] ||
                          progressData['custom-psyduck'] ||
                          progressData['custom-togepi'];
    if (!hasLegacyData) {
        localStorage.setItem(migrationKey, 'done');
        return;
    }

    console.log('Migrating legacy custom set definitions to Firebase...');

    const legacySets = ['its-pikachu', 'psyduck', 'togepi'];
    const themeColors = {
        'its-pikachu': '#ffd700',
        'psyduck': '#4fc3f7',
        'togepi': '#ef9a9a'
    };
    const logoUrls = {
        'its-pikachu': './Images/header/pikachu.png',
        'psyduck': './Images/header/psyduck.png',
        'togepi': './Images/header/togepi.png'
    };

    try {
        const customSetsRef = db.ref('collections/' + collectionId + '/customSets');

        for (const setKey of legacySets) {
            try {
                const response = await fetch(`./data/pokemon/custom-sets/${setKey}.json`);
                if (!response.ok) continue;
                const setInfo = await response.json();

                // Build Firebase-friendly structure with cards as sub-object
                const fbSet = {
                    name: setInfo.name,
                    displayName: setInfo.displayName || setInfo.name,
                    description: setInfo.description || '',
                    totalCards: setInfo.totalCards,
                    singleVariantOnly: setInfo.singleVariantOnly !== false,
                    themeColor: themeColors[setKey] || '#ff9500',
                    logoUrl: logoUrls[setKey] || '',
                    createdAt: firebase.database.ServerValue.TIMESTAMP,
                    updatedAt: firebase.database.ServerValue.TIMESTAMP,
                    createdBy: 'migration',
                    cards: setInfo.cards
                };

                await customSetsRef.child(setKey).set(fbSet);
                console.log(`✓ Migrated custom set definition: ${setKey}`);
            } catch (err) {
                console.error(`Error migrating custom set ${setKey}:`, err);
            }
        }

        localStorage.setItem(migrationKey, 'done');
        console.log('✓ Legacy custom set migration complete');
    } catch (err) {
        console.error('Custom set migration failed:', err);
    }
}

// Save progress to localStorage
function saveProgress() {
    localStorage.setItem('pokemonVariantProgress', JSON.stringify(collectionProgress));
    if (firebase_ref) {
        _skipNextFirebaseRender = true;
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
        _skipNextFirebaseRender = true;
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

    // Update collection values
    if (typeof updateSetValues === 'function') {
        updateSetValues();
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
