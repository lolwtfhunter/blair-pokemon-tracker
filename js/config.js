// Global state, constants, and rarity configuration

// Global state
let cardSets = {};
let customCardSets = {};
let lorcanaCardSets = {};
let collectionProgress = {};
let currentSet = null; // No set selected by default
let currentCustomSet = null;
let currentLorcanaSet = null; // No Lorcana set selected by default
let customSetLangFilter = {}; // Per-set language filter: 'EN' or 'JP'
let activeRarityFilters = {}; // Maps setKey → Set of active rarity strings
let firebase_db = null;
let firebase_ref = null;

const SYNC_CODE = 'Blair2024';
const SYNC_CODE_KEY = 'blair_sync_code';

// Pokemon TCG API set ID mapping (for card images from pokemontcg.io CDN)
const TCG_API_SET_IDS = {
    'prismatic-evolutions': 'sv8pt5',
    'journey-together': 'sv9',
    'destined-rivals': 'sv10',
    'mega-evolution': 'me1',
    'phantasmal-flames': 'me2',
    'ascended-heroes': 'me2pt5',
    'celebrations': 'cel25',
    'surging-sparks': 'sv8'
};

// TCGdex API set mapping: { series, setId } (for assets.tcgdex.net CDN)
const TCGDEX_SET_IDS = {
    'prismatic-evolutions': { series: 'sv', set: 'sv08.5' },
    'journey-together':     { series: 'sv', set: 'sv09' },
    'destined-rivals':      { series: 'sv', set: 'sv10' },
    'mega-evolution':       { series: 'me', set: 'me01' },
    'phantasmal-flames':    { series: 'me', set: 'me02' },
    'ascended-heroes':      { series: 'me', set: 'me02.5' },
    'celebrations':         { series: 'swsh', set: 'cel25' },
    'surging-sparks':       { series: 'sv', set: 'sv08' }
};

// Variant configurations
const variantLabels = {
    'single': { label: 'Collected', icon: '✓' },
    'regular': { label: 'Regular', icon: '⚪' },
    'holo': { label: 'Holo', icon: '💎' },
    'reverse-holo': { label: 'Reverse Holo', icon: '✨' },
    'pokeball': { label: 'Poké Ball', icon: '⚾' },
    'masterball': { label: 'Master Ball', icon: '🔮' },
    '1st-edition': { label: '1st Edition', icon: '🥇' },
    'unlimited': { label: 'Unlimited', icon: '♾️' }
};

// All possible rarities in Pokemon TCG (future-proof)
const SINGLE_VARIANT_RARITIES = [
    'ex', 'secret', 'illustration-rare', 'special-illustration-rare',
    'ultra-rare', 'hyper-rare', 'double-rare', 'ace-spec',
    'radiant', 'amazing-rare', 'shiny-rare', 'trainer-ultra-rare',
    'gold-secret', 'promo'
];

// Rarity display names (Pokemon TCG)
const RARITY_DISPLAY_NAMES = {
    'common': 'COMMON',
    'uncommon': 'UNCOMMON',
    'rare': 'RARE',
    'ex': 'EX',
    'secret': 'SECRET',
    'illustration-rare': 'ILLUS RARE',
    'special-illustration-rare': 'SPECIAL IR',
    'ultra-rare': 'ULTRA RARE',
    'hyper-rare': 'HYPER RARE',
    'double-rare': 'DOUBLE RARE',
    'trainer-ultra-rare': 'TRAINER UR',
    'gold-secret': 'GOLD',
    'ace-spec': 'ACE SPEC',
    'radiant': 'RADIANT',
    'amazing-rare': 'AMAZING',
    'shiny-rare': 'SHINY',
    'promo': 'PROMO',
    'rare-holo': 'RARE HOLO',
    'rare-holo-gx': 'HOLO GX',
    'trainer': 'TRAINER',
    'energy': 'ENERGY',
    '1st-edition': '1ST EDITION',
    'unlimited': 'UNLIMITED'
};

// Lorcana rarity display names
const LORCANA_RARITY_DISPLAY_NAMES = {
    'common':     'COMMON',
    'uncommon':   'UNCOMMON',
    'rare':       'RARE',
    'super-rare': 'SUPER RARE',
    'legendary':  'LEGENDARY',
    'enchanted':  'ENCHANTED',
    'epic':       'EPIC',
    'iconic':     'ICONIC',
    'special':    'SPECIAL'
};

// Get display name for rarity
function getRarityDisplay(rarity) {
    return RARITY_DISPLAY_NAMES[rarity] || rarity.toUpperCase();
}

// Get display name for Lorcana rarity
function getLorcanaRarityDisplay(rarity) {
    return LORCANA_RARITY_DISPLAY_NAMES[rarity] || rarity.toUpperCase().replace(/-/g, ' ');
}

// Determine variants for a card
function getVariants(card, setKey) {
    const setData = cardSets[setKey];
    const rarity = card.rarity.toLowerCase();

    // Sets where all cards are single variant (e.g., Celebrations)
    if (setData && setData.singleVariantOnly) {
        return ['single'];
    }

    // Single checkbox rarities (EX, Ultra Rares, Illustration Rares, etc.)
    if (SINGLE_VARIANT_RARITIES.includes(rarity)) {
        return ['single'];
    }

    // Rare cards get Holo + Reverse Holo (no regular)
    if (rarity === 'rare') {
        // Special case: Prismatic Evolutions rares get extra variants
        if (setKey === 'prismatic-evolutions' && card.type !== 'trainer') {
            return ['holo', 'reverse-holo', 'pokeball', 'masterball'];
        }
        return ['holo', 'reverse-holo'];
    }

    // Prismatic Evolutions special variants for commons/uncommons
    if (setKey === 'prismatic-evolutions') {
        if (card.type === 'trainer') {
            return ['regular', 'reverse-holo', 'pokeball'];
        }
        // Regular pokemon get all 4 variants
        return ['regular', 'reverse-holo', 'pokeball', 'masterball'];
    }

    // All other cards (common, uncommon, trainer, energy): Regular + Reverse Holo
    return ['regular', 'reverse-holo'];
}

// Official Pokemon TCG sets to load (in order)
const OFFICIAL_SETS = [
    'celebrations',
    'mega-evolution',
    'phantasmal-flames',
    'ascended-heroes',
    'surging-sparks',
    'prismatic-evolutions',
    'journey-together',
    'destined-rivals'
];

// Custom sets to load
const CUSTOM_SETS = [
    'its-pikachu',
    'psyduck',
    'togepi'
];

// Lorcast API set codes (for card image fallback via api.lorcast.com)
const LORCAST_SET_CODES = {
    'first-chapter': '1',
    'rise-of-the-floodborn': '2',
    'into-the-inklands': '3',
    'ursulas-return': '4',
    'shimmering-skies': '5',
    'azurite-sea': '6',
    'archazias-island': '7',
    'reign-of-jafar': '8',
    'fabled': '9',
    'whispers-in-the-well': '10',
    'winterspell': '11'
};

// Lorcana sets to load
const LORCANA_SETS = [
    'first-chapter',
    'rise-of-the-floodborn',
    'into-the-inklands',
    'ursulas-return',
    'shimmering-skies',
    'azurite-sea',
    'archazias-island',
    'reign-of-jafar',
    'fabled',
    'whispers-in-the-well',
    'winterspell'
];
