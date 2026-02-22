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

        // Custom sets are initialized dynamically when Firebase customSets listener fires
        console.log('Custom sets will initialize from Firebase.');

        // Initialize Lorcana set grids and buttons
        console.log('Initializing Lorcana sets...');
        try {
            initLorcanaSetGrids();
            // Render buttons with SVG fallbacks, then upgrade to Fandom CDN logos
            renderLorcanaSetButtons();
            console.log('✓ Lorcana set buttons rendered');
            // Pre-warm Lorcast CDN cache for card images (non-blocking)
            Object.keys(lorcanaCardSets).forEach(setKey => {
                fetchLorcastImageUrls(setKey);
            });
            console.log('✓ Lorcana set grids and buttons ready');
        } catch (e) {
            console.log('ERROR in Lorcana sets: ' + e.message);
        }

        console.log('Initializing auth...');
        // Clean up legacy sync code from localStorage
        localStorage.removeItem(LEGACY_SYNC_CODE_KEY);
        // Initialize authentication (will show auth modal or load user)
        initAuth();
    } catch (error) {
        console.log('FATAL ERROR: ' + error.message);
        console.error('Fatal error:', error);
    }
});
