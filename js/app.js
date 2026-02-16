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

        // Load cached market prices
        loadPriceCache();

        // Migrate legacy 'single' variants to edition variants for WotC-era cards
        migrateEditionVariants();

        console.log('Rendering UI...');

        // Dynamically create block containers and set grids from loaded data
        console.log('Initializing Pokemon block containers and set grids...');
        try {
            initPokemonBlockContainers();
            initPokemonSetGrids();
            console.log('✓ Pokemon DOM initialized');
        } catch (e) {
            console.log('ERROR in Pokemon DOM init: ' + e.message);
        }

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

        // Initialize Lorcana set grids and buttons
        console.log('Initializing Lorcana sets...');
        try {
            initLorcanaSetGrids();
            renderLorcanaSetButtons();
            // Pre-warm Lorcast CDN cache for all sets (non-blocking)
            Object.keys(lorcanaCardSets).forEach(setKey => {
                fetchLorcastImageUrls(setKey);
            });
            // Lorcana set cards will render on-demand when user selects a set
            console.log('✓ Lorcana set grids and buttons ready');
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
