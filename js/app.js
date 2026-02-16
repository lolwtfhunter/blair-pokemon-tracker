// Application initialization

// Initialize app
window.addEventListener('load', async function() {
    try {
        console.log('App loading...');

        // Load card data
        const loaded = await loadCardData();
        if (!loaded) {
            console.log('Failed to load data!');
            return;
        }

        // Load custom sets data
        await loadCustomSetsData();

        // Load Lorcana data
        await loadLorcanaData();

        console.log('Initializing progress...');
        // Initialize progress
        initializeProgress();

        // Load cached card prices from localStorage
        if (typeof loadPriceCache === 'function') {
            loadPriceCache();
            console.log('✓ Price cache loaded');
        }

        console.log('Rendering UI...');

        console.log('Calling renderSetButtons...');
        try {
            renderSetButtons();
            console.log('✓ Set buttons rendered');
        } catch (e) {
            console.log('ERROR in renderSetButtons: ' + e.message);
        }

        console.log('Calling updateSetButtonProgress...');
        try {
            updateSetButtonProgress();
            console.log('✓ Progress rendered');
        } catch (e) {
            console.log('ERROR in updateSetButtonProgress: ' + e.message);
        }

        // Cards are now rendered on-demand when user selects a set
        console.log('Card grids ready - cards will render when sets are selected');

        // Initialize custom set grids and buttons
        console.log('Initializing custom sets...');
        try {
            initCustomSetGrids();
            renderCustomSetButtons();
            // Custom set cards will render on-demand when user selects a set
            console.log('✓ Custom set grids and buttons ready');
        } catch (e) {
            console.log('ERROR in custom sets: ' + e.message);
        }

        // Initialize Lorcana set buttons
        console.log('Initializing Lorcana sets...');
        try {
            renderLorcanaSetButtons();
            // Lorcana set cards will render on-demand when user selects a set
            console.log('✓ Lorcana set buttons ready');
        } catch (e) {
            console.log('ERROR in Lorcana sets: ' + e.message);
        }

        console.log('Checking sync code...');
        // Check for sync code
        const savedCode = localStorage.getItem(SYNC_CODE_KEY);
        if (savedCode === SYNC_CODE) {
            console.log('Saved code found, initializing Firebase');
            initializeFirebase();
        } else {
            console.log('No saved code, showing modal');
            showSyncModal();
        }
    } catch (error) {
        console.log('FATAL ERROR: ' + error.message);
        console.error('Fatal error:', error);
    }
});
