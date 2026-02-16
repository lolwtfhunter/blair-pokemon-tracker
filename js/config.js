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
    // Base Set era
    'base-set': 'base1',
    'jungle': 'base2',
    'fossil': 'base3',
    'base-set-2': 'base4',
    'team-rocket': 'base5',
    'legendary-collection': 'base6',
    // Gym era
    'gym-heroes': 'gym1',
    'gym-challenge': 'gym2',
    // Neo era
    'neo-genesis': 'neo1',
    'neo-discovery': 'neo2',
    'neo-revelation': 'neo3',
    'neo-destiny': 'neo4',
    'southern-islands': 'si1',
    // e-Card era
    'expedition': 'ecard1',
    'aquapolis': 'ecard2',
    'skyridge': 'ecard3',
    // EX era
    'ruby-sapphire': 'ex1',
    'sandstorm': 'ex2',
    'dragon': 'ex3',
    'team-magma-vs-team-aqua': 'ex4',
    'hidden-legends': 'ex5',
    'firered-leafgreen': 'ex6',
    'team-rocket-returns': 'ex7',
    'deoxys': 'ex8',
    'emerald': 'ex9',
    'unseen-forces': 'ex10',
    'delta-species': 'ex11',
    'legend-maker': 'ex12',
    'holon-phantoms': 'ex13',
    'crystal-guardians': 'ex14',
    'dragon-frontiers': 'ex15',
    'power-keepers': 'ex16',
    'nintendo-promos': 'np',
    // Diamond & Pearl era
    'diamond-pearl': 'dp1',
    'mysterious-treasures': 'dp2',
    'secret-wonders': 'dp3',
    'great-encounters': 'dp4',
    'majestic-dawn': 'dp5',
    'legends-awakened': 'dp6',
    'stormfront': 'dp7',
    'dp-promos': 'dpp',
    // Platinum era
    'platinum': 'pl1',
    'rising-rivals': 'pl2',
    'supreme-victors': 'pl3',
    'arceus': 'pl4',
    'rumble': 'ru1',
    // HeartGold SoulSilver era
    'heartgold-soulsilver': 'hgss1',
    'unleashed': 'hgss2',
    'undaunted': 'hgss3',
    'triumphant': 'hgss4',
    'hgss-promos': 'hsp',
    'call-of-legends': 'col1',
    // Black & White era
    'black-white': 'bw1',
    'emerging-powers': 'bw2',
    'noble-victories': 'bw3',
    'next-destinies': 'bw4',
    'dark-explorers': 'bw5',
    'dragons-exalted': 'bw6',
    'boundaries-crossed': 'bw7',
    'plasma-storm': 'bw8',
    'plasma-freeze': 'bw9',
    'plasma-blast': 'bw10',
    'legendary-treasures': 'bw11',
    'dragon-vault': 'dv1',
    'bw-promos': 'bwp',
    // XY era
    'kalos-starter-set': 'xy0',
    'xy': 'xy1',
    'flashfire': 'xy2',
    'furious-fists': 'xy3',
    'phantom-forces': 'xy4',
    'primal-clash': 'xy5',
    'roaring-skies': 'xy6',
    'ancient-origins': 'xy7',
    'breakthrough': 'xy8',
    'breakpoint': 'xy9',
    'fates-collide': 'xy10',
    'steam-siege': 'xy11',
    'evolutions': 'xy12',
    'xy-promos': 'xyp',
    'generations': 'g1',
    // Sun & Moon era
    'sun-moon': 'sm1',
    'guardians-rising': 'sm2',
    'burning-shadows': 'sm3',
    'shining-legends': 'sm35',
    'crimson-invasion': 'sm4',
    'ultra-prism': 'sm5',
    'forbidden-light': 'sm6',
    'celestial-storm': 'sm7',
    'dragon-majesty': 'sm75',
    'lost-thunder': 'sm8',
    'team-up': 'sm9',
    'unbroken-bonds': 'sm10',
    'unified-minds': 'sm11',
    'hidden-fates': 'sm115',
    'cosmic-eclipse': 'sm12',
    'sm-promos': 'smp',
    'detective-pikachu': 'det1',
    // Sword & Shield era
    'sword-shield': 'swsh1',
    'rebel-clash': 'swsh2',
    'darkness-ablaze': 'swsh3',
    'champions-path': 'swsh35',
    'vivid-voltage': 'swsh4',
    'shining-fates': 'swsh45',
    'battle-styles': 'swsh5',
    'chilling-reign': 'swsh6',
    'evolving-skies': 'swsh7',
    'fusion-strike': 'swsh8',
    'brilliant-stars': 'swsh9',
    'astral-radiance': 'swsh10',
    'lost-origin': 'swsh11',
    'silver-tempest': 'swsh12',
    'crown-zenith': 'swsh12pt5',
    'swsh-promos': 'swshp',
    'pokemon-go': 'pgo',
    'celebrations': 'cel25',
    // Scarlet & Violet era
    'scarlet-violet': 'sv1',
    'paldea-evolved': 'sv2',
    'obsidian-flames': 'sv3',
    '151': 'sv3pt5',
    'paradox-rift': 'sv4',
    'paldean-fates': 'sv4pt5',
    'temporal-forces': 'sv5',
    'twilight-masquerade': 'sv6',
    'stellar-crown': 'sv7',
    'surging-sparks': 'sv8',
    'prismatic-evolutions': 'sv8pt5',
    'journey-together': 'sv9',
    'destined-rivals': 'sv10',
    'sv-promos': 'svp',
    // Mega Evolution era
    'mega-evolution': 'me1',
    'phantasmal-flames': 'me2',
    'ascended-heroes': 'me2pt5'
};

// TCGdex API set mapping: { series, setId } (for assets.tcgdex.net CDN)
const TCGDEX_SET_IDS = {
    // Base Set era
    'base-set':            { series: 'base', set: 'base1' },
    'jungle':              { series: 'base', set: 'base2' },
    'fossil':              { series: 'base', set: 'base3' },
    'base-set-2':          { series: 'base', set: 'base4' },
    'team-rocket':         { series: 'base', set: 'base5' },
    'legendary-collection':{ series: 'base', set: 'lc' },
    // Gym era
    'gym-heroes':          { series: 'gym', set: 'gym1' },
    'gym-challenge':       { series: 'gym', set: 'gym2' },
    // Neo era
    'neo-genesis':         { series: 'neo', set: 'neo1' },
    'neo-discovery':       { series: 'neo', set: 'neo2' },
    'neo-revelation':      { series: 'neo', set: 'neo3' },
    'neo-destiny':         { series: 'neo', set: 'neo4' },
    'southern-islands':    { series: 'neo', set: 'si1' },
    // e-Card era
    'expedition':          { series: 'ecard', set: 'ecard1' },
    'aquapolis':           { series: 'ecard', set: 'ecard2' },
    'skyridge':            { series: 'ecard', set: 'ecard3' },
    // EX era
    'ruby-sapphire':       { series: 'ex', set: 'ex1' },
    'sandstorm':           { series: 'ex', set: 'ex2' },
    'dragon':              { series: 'ex', set: 'ex3' },
    'team-magma-vs-team-aqua': { series: 'ex', set: 'ex4' },
    'hidden-legends':      { series: 'ex', set: 'ex5' },
    'firered-leafgreen':   { series: 'ex', set: 'ex6' },
    'team-rocket-returns': { series: 'ex', set: 'ex7' },
    'deoxys':              { series: 'ex', set: 'ex8' },
    'emerald':             { series: 'ex', set: 'ex9' },
    'unseen-forces':       { series: 'ex', set: 'ex10' },
    'delta-species':       { series: 'ex', set: 'ex11' },
    'legend-maker':        { series: 'ex', set: 'ex12' },
    'holon-phantoms':      { series: 'ex', set: 'ex13' },
    'crystal-guardians':   { series: 'ex', set: 'ex14' },
    'dragon-frontiers':    { series: 'ex', set: 'ex15' },
    'power-keepers':       { series: 'ex', set: 'ex16' },
    'nintendo-promos':     { series: 'ex', set: 'np' },
    // Diamond & Pearl era
    'diamond-pearl':       { series: 'dp', set: 'dp1' },
    'mysterious-treasures': { series: 'dp', set: 'dp2' },
    'secret-wonders':      { series: 'dp', set: 'dp3' },
    'great-encounters':    { series: 'dp', set: 'dp4' },
    'majestic-dawn':       { series: 'dp', set: 'dp5' },
    'legends-awakened':    { series: 'dp', set: 'dp6' },
    'stormfront':          { series: 'dp', set: 'dp7' },
    'dp-promos':           { series: 'dp', set: 'dpp' },
    // Platinum era
    'platinum':            { series: 'pl', set: 'pl1' },
    'rising-rivals':       { series: 'pl', set: 'pl2' },
    'supreme-victors':     { series: 'pl', set: 'pl3' },
    'arceus':              { series: 'pl', set: 'pl4' },
    'rumble':              { series: 'pl', set: 'ru1' },
    // HeartGold SoulSilver era
    'heartgold-soulsilver':{ series: 'hgss', set: 'hgss1' },
    'unleashed':           { series: 'hgss', set: 'hgss2' },
    'undaunted':           { series: 'hgss', set: 'hgss3' },
    'triumphant':          { series: 'hgss', set: 'hgss4' },
    'hgss-promos':         { series: 'hgss', set: 'hsp' },
    'call-of-legends':     { series: 'hgss', set: 'col1' },
    // Black & White era
    'black-white':         { series: 'bw', set: 'bw1' },
    'emerging-powers':     { series: 'bw', set: 'bw2' },
    'noble-victories':     { series: 'bw', set: 'bw3' },
    'next-destinies':      { series: 'bw', set: 'bw4' },
    'dark-explorers':      { series: 'bw', set: 'bw5' },
    'dragons-exalted':     { series: 'bw', set: 'bw6' },
    'boundaries-crossed':  { series: 'bw', set: 'bw7' },
    'plasma-storm':        { series: 'bw', set: 'bw8' },
    'plasma-freeze':       { series: 'bw', set: 'bw9' },
    'plasma-blast':        { series: 'bw', set: 'bw10' },
    'legendary-treasures': { series: 'bw', set: 'bw11' },
    'dragon-vault':        { series: 'bw', set: 'dv1' },
    'bw-promos':           { series: 'bw', set: 'bwp' },
    // XY era
    'kalos-starter-set':   { series: 'xy', set: 'xy0' },
    'xy':                  { series: 'xy', set: 'xy1' },
    'flashfire':           { series: 'xy', set: 'xy2' },
    'furious-fists':       { series: 'xy', set: 'xy3' },
    'phantom-forces':      { series: 'xy', set: 'xy4' },
    'primal-clash':        { series: 'xy', set: 'xy5' },
    'roaring-skies':       { series: 'xy', set: 'xy6' },
    'ancient-origins':     { series: 'xy', set: 'xy7' },
    'breakthrough':        { series: 'xy', set: 'xy8' },
    'breakpoint':          { series: 'xy', set: 'xy9' },
    'fates-collide':       { series: 'xy', set: 'xy10' },
    'steam-siege':         { series: 'xy', set: 'xy11' },
    'evolutions':          { series: 'xy', set: 'xy12' },
    'xy-promos':           { series: 'xy', set: 'xyp' },
    'generations':         { series: 'xy', set: 'g1' },
    // Sun & Moon era
    'sun-moon':            { series: 'sm', set: 'sm1' },
    'guardians-rising':    { series: 'sm', set: 'sm2' },
    'burning-shadows':     { series: 'sm', set: 'sm3' },
    'shining-legends':     { series: 'sm', set: 'sm35' },
    'crimson-invasion':    { series: 'sm', set: 'sm4' },
    'ultra-prism':         { series: 'sm', set: 'sm5' },
    'forbidden-light':     { series: 'sm', set: 'sm6' },
    'celestial-storm':     { series: 'sm', set: 'sm7' },
    'dragon-majesty':      { series: 'sm', set: 'sm75' },
    'lost-thunder':        { series: 'sm', set: 'sm8' },
    'team-up':             { series: 'sm', set: 'sm9' },
    'unbroken-bonds':      { series: 'sm', set: 'sm10' },
    'unified-minds':       { series: 'sm', set: 'sm11' },
    'hidden-fates':        { series: 'sm', set: 'sm115' },
    'cosmic-eclipse':      { series: 'sm', set: 'sm12' },
    'sm-promos':           { series: 'sm', set: 'smp' },
    'detective-pikachu':   { series: 'sm', set: 'det1' },
    // Sword & Shield era
    'sword-shield':        { series: 'swsh', set: 'swsh1' },
    'rebel-clash':         { series: 'swsh', set: 'swsh2' },
    'darkness-ablaze':     { series: 'swsh', set: 'swsh3' },
    'champions-path':      { series: 'swsh', set: 'swsh35' },
    'vivid-voltage':       { series: 'swsh', set: 'swsh4' },
    'shining-fates':       { series: 'swsh', set: 'swsh45' },
    'battle-styles':       { series: 'swsh', set: 'swsh5' },
    'chilling-reign':      { series: 'swsh', set: 'swsh6' },
    'evolving-skies':      { series: 'swsh', set: 'swsh7' },
    'fusion-strike':       { series: 'swsh', set: 'swsh8' },
    'brilliant-stars':     { series: 'swsh', set: 'swsh9' },
    'astral-radiance':     { series: 'swsh', set: 'swsh10' },
    'lost-origin':         { series: 'swsh', set: 'swsh11' },
    'silver-tempest':      { series: 'swsh', set: 'swsh12' },
    'crown-zenith':        { series: 'swsh', set: 'swsh12pt5' },
    'swsh-promos':         { series: 'swsh', set: 'swshp' },
    'pokemon-go':          { series: 'swsh', set: 'pgo' },
    'celebrations':        { series: 'swsh', set: 'cel25' },
    // Scarlet & Violet era
    'scarlet-violet':      { series: 'sv', set: 'sv1' },
    'paldea-evolved':      { series: 'sv', set: 'sv2' },
    'obsidian-flames':     { series: 'sv', set: 'sv3' },
    '151':                 { series: 'sv', set: 'sv3pt5' },
    'paradox-rift':        { series: 'sv', set: 'sv4' },
    'paldean-fates':       { series: 'sv', set: 'sv4pt5' },
    'temporal-forces':     { series: 'sv', set: 'sv5' },
    'twilight-masquerade': { series: 'sv', set: 'sv6' },
    'stellar-crown':       { series: 'sv', set: 'sv7' },
    'surging-sparks':      { series: 'sv', set: 'sv08' },
    'prismatic-evolutions':{ series: 'sv', set: 'sv08.5' },
    'journey-together':    { series: 'sv', set: 'sv09' },
    'destined-rivals':     { series: 'sv', set: 'sv10' },
    'sv-promos':           { series: 'sv', set: 'svp' },
    // Mega Evolution era
    'mega-evolution':      { series: 'me', set: 'me01' },
    'phantasmal-flames':   { series: 'me', set: 'me02' },
    'ascended-heroes':     { series: 'me', set: 'me02.5' }
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
    'gold-secret', 'promo', 'rare-holo-gx'
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

    // WotC-era sets with 1st Edition / Unlimited variants
    if (setData && setData.hasFirstEdition) {
        // Single checkbox rarities still apply
        if (SINGLE_VARIANT_RARITIES.includes(rarity)) {
            return ['single'];
        }
        return ['1st-edition', 'unlimited'];
    }

    // Single checkbox rarities (EX, Ultra Rares, Illustration Rares, etc.)
    if (SINGLE_VARIANT_RARITIES.includes(rarity)) {
        return ['single'];
    }

    // Rare/Rare Holo cards get Holo + Reverse Holo (no regular)
    if (rarity === 'rare' || rarity === 'rare-holo') {
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

// Official Pokemon TCG sets to load (in order by era, newest first)
const OFFICIAL_SETS = [
    // Mega Evolution era
    'mega-evolution', 'phantasmal-flames', 'ascended-heroes',
    // Scarlet & Violet era
    'scarlet-violet', 'paldea-evolved', 'obsidian-flames', '151',
    'paradox-rift', 'paldean-fates', 'temporal-forces', 'twilight-masquerade',
    'stellar-crown', 'surging-sparks', 'prismatic-evolutions',
    'journey-together', 'destined-rivals', 'sv-promos',
    // Sword & Shield era
    'sword-shield', 'rebel-clash', 'darkness-ablaze', 'champions-path',
    'vivid-voltage', 'shining-fates', 'battle-styles', 'chilling-reign',
    'evolving-skies', 'fusion-strike', 'brilliant-stars', 'astral-radiance',
    'lost-origin', 'silver-tempest', 'crown-zenith',
    'pokemon-go', 'celebrations', 'swsh-promos',
    // Sun & Moon era
    'sun-moon', 'guardians-rising', 'burning-shadows', 'shining-legends',
    'crimson-invasion', 'ultra-prism', 'forbidden-light', 'celestial-storm',
    'dragon-majesty', 'lost-thunder', 'team-up', 'unbroken-bonds',
    'unified-minds', 'hidden-fates', 'cosmic-eclipse',
    'detective-pikachu', 'sm-promos',
    // XY era
    'kalos-starter-set', 'xy', 'flashfire', 'furious-fists',
    'phantom-forces', 'primal-clash', 'roaring-skies', 'ancient-origins',
    'breakthrough', 'breakpoint', 'fates-collide', 'steam-siege',
    'evolutions', 'generations', 'xy-promos',
    // Black & White era
    'black-white', 'emerging-powers', 'noble-victories', 'next-destinies',
    'dark-explorers', 'dragons-exalted', 'dragon-vault', 'boundaries-crossed',
    'plasma-storm', 'plasma-freeze', 'plasma-blast', 'legendary-treasures', 'bw-promos',
    // HeartGold SoulSilver era
    'heartgold-soulsilver', 'unleashed', 'undaunted', 'triumphant',
    'call-of-legends', 'hgss-promos',
    // Platinum era
    'platinum', 'rising-rivals', 'supreme-victors', 'arceus', 'rumble',
    // Diamond & Pearl era
    'diamond-pearl', 'mysterious-treasures', 'secret-wonders', 'great-encounters',
    'majestic-dawn', 'legends-awakened', 'stormfront', 'dp-promos',
    // EX era
    'ruby-sapphire', 'sandstorm', 'dragon', 'team-magma-vs-team-aqua',
    'hidden-legends', 'firered-leafgreen', 'team-rocket-returns', 'deoxys',
    'emerald', 'unseen-forces', 'delta-species', 'legend-maker',
    'holon-phantoms', 'crystal-guardians', 'dragon-frontiers', 'power-keepers',
    'nintendo-promos',
    // e-Card era
    'expedition', 'aquapolis', 'skyridge',
    // Neo era
    'neo-genesis', 'neo-discovery', 'neo-revelation', 'neo-destiny',
    'southern-islands',
    // Gym era
    'gym-heroes', 'gym-challenge',
    // Base Set era
    'base-set', 'jungle', 'fossil', 'base-set-2', 'team-rocket',
    'legendary-collection'
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

// TCGCSV Pokemon group IDs (TCGPlayer category 3)
const TCGCSV_POKEMON_GROUP_IDS = {
    // Base Set era
    'base-set': 604,
    'jungle': 635,
    'fossil': 630,
    'base-set-2': 605,
    'team-rocket': 1373,
    'legendary-collection': 1374,
    // Gym era
    'gym-heroes': 1441,
    'gym-challenge': 1440,
    // Neo era
    'neo-genesis': 1396,
    'neo-discovery': 1434,
    'neo-revelation': 1389,
    'neo-destiny': 1444,
    'southern-islands': 648,
    // e-Card era
    'expedition': 1375,
    'aquapolis': 1397,
    'skyridge': 1372,
    // EX era
    'ruby-sapphire': 1393,
    'sandstorm': 1392,
    'dragon': 1376,
    'team-magma-vs-team-aqua': 1377,
    'hidden-legends': 1416,
    'firered-leafgreen': 1419,
    'team-rocket-returns': 1428,
    'deoxys': 1404,
    'emerald': 1410,
    'unseen-forces': 1398,
    'delta-species': 1429,
    'legend-maker': 1378,
    'holon-phantoms': 1379,
    'crystal-guardians': 1395,
    'dragon-frontiers': 1411,
    'power-keepers': 1383,
    'nintendo-promos': 1423,
    // Diamond & Pearl era
    'diamond-pearl': 1430,
    'mysterious-treasures': 1368,
    'secret-wonders': 1380,
    'great-encounters': 1405,
    'majestic-dawn': 1390,
    'legends-awakened': 1417,
    'stormfront': 1369,
    'dp-promos': 1421,
    // Platinum era
    'platinum': 1406,
    'rising-rivals': 1367,
    'supreme-victors': 1384,
    'arceus': 1391,
    'rumble': 1433,
    // HeartGold SoulSilver era
    'heartgold-soulsilver': 1402,
    'unleashed': 1399,
    'undaunted': 1403,
    'triumphant': 1381,
    'hgss-promos': 1453,
    'call-of-legends': 1415,
    // Black & White era
    'black-white': 1400,
    'emerging-powers': 1424,
    'noble-victories': 1385,
    'next-destinies': 1412,
    'dark-explorers': 1386,
    'dragons-exalted': 1394,
    'boundaries-crossed': 1408,
    'plasma-storm': 1413,
    'plasma-freeze': 1382,
    'plasma-blast': 1370,
    'legendary-treasures': 1409,
    'bw-promos': 1407,
    // XY era
    'kalos-starter-set': 1522,
    'xy': 1387,
    'flashfire': 1464,
    'furious-fists': 1481,
    'phantom-forces': 1494,
    'primal-clash': 1509,
    'roaring-skies': 1534,
    'ancient-origins': 1576,
    'breakthrough': 1661,
    'breakpoint': 1701,
    'fates-collide': 1780,
    'steam-siege': 1815,
    'evolutions': 1842,
    'xy-promos': 1451,
    'generations': 1728,
    // Sun & Moon era
    'sun-moon': 1863,
    'guardians-rising': 1919,
    'burning-shadows': 1957,
    'shining-legends': 2054,
    'crimson-invasion': 2071,
    'ultra-prism': 2178,
    'forbidden-light': 2209,
    'celestial-storm': 2278,
    'dragon-majesty': 2295,
    'lost-thunder': 2328,
    'team-up': 2377,
    'unbroken-bonds': 2420,
    'unified-minds': 2464,
    'hidden-fates': 2480,
    'cosmic-eclipse': 2534,
    'sm-promos': 1861,
    'detective-pikachu': 2409,
    // Sword & Shield era
    'sword-shield': 2585,
    'rebel-clash': 2626,
    'darkness-ablaze': 2675,
    'champions-path': 2685,
    'vivid-voltage': 2701,
    'shining-fates': 2754,
    'battle-styles': 2765,
    'chilling-reign': 2807,
    'evolving-skies': 2848,
    'fusion-strike': 2906,
    'brilliant-stars': 2948,
    'astral-radiance': 3040,
    'lost-origin': 3118,
    'silver-tempest': 3170,
    'crown-zenith': 17688,
    'swsh-promos': 2545,
    'pokemon-go': 3064,
    'celebrations': 2867,
    // Scarlet & Violet era
    'scarlet-violet': 22873,
    'paldea-evolved': 23120,
    'obsidian-flames': 23228,
    '151': 23237,
    'paradox-rift': 23286,
    'paldean-fates': 23353,
    'temporal-forces': 23381,
    'surging-sparks': 23651,
    'prismatic-evolutions': 23821,
    'journey-together': 24073,
    'destined-rivals': 24269,
    'sv-promos': 22872,
    // Mega Evolution era
    'mega-evolution': 24380,
    'phantasmal-flames': 24448,
    'ascended-heroes': 24541
};

// TCGCSV Lorcana group IDs (TCGPlayer category 71)
const TCGCSV_LORCANA_GROUP_IDS = {
    'first-chapter': 22937,
    'rise-of-the-floodborn': 23303,
    'into-the-inklands': 23367,
    'ursulas-return': 23474,
    'shimmering-skies': 23536,
    'azurite-sea': 23746,
    'archazias-island': 24011,
    'reign-of-jafar': 24258,
    'fabled': 24348,
    'whispers-in-the-well': 24414,
    'winterspell': 24500
};

// TCGCSV source set group IDs for custom set cards (pokemontcg.io set ID → TCGCSV group ID)
// Used to fetch prices for individual cards in custom sets by their source set
const TCGCSV_SOURCE_SET_GROUP_IDS = {
    // WotC Era
    'base1': 604,   'base2': 635,   'base3': 630,   'base4': 605,
    'base5': 1373,  'base6': 1374,  'basep': 1418,
    'gym1': 1441,   'gym2': 1440,
    'neo1': 1396,   'neo2': 1434,   'neo3': 1389,   'neo4': 1444,
    'si1': 648,
    // e-Card Era
    'ecard1': 1375, 'ecard2': 1397, 'ecard3': 1372,
    // EX Era
    'ex1': 1393,  'ex2': 1392,  'ex3': 1376,  'ex4': 1377,
    'ex5': 1416,  'ex6': 1419,  'ex7': 1428,  'ex8': 1404,
    'ex9': 1410,  'ex10': 1398, 'ex11': 1429, 'ex12': 1378,
    'ex13': 1379, 'ex14': 1395, 'ex15': 1411, 'ex16': 1383,
    'np': 1423,
    // Diamond & Pearl Era
    'dp1': 1430, 'dp2': 1368, 'dp3': 1380, 'dp4': 1405,
    'dp5': 1390, 'dp6': 1417, 'dp7': 1369, 'dpp': 1421,
    // Platinum Era
    'pl1': 1406, 'pl2': 1367, 'pl3': 1384, 'pl4': 1391,
    'ru1': 1433,
    // HGSS Era
    'hgss1': 1402, 'hgss2': 1399, 'hgss3': 1403, 'hgss4': 1381,
    'hsp': 1453,   'col1': 1415,
    // Black & White Era
    'bw1': 1400,  'bw2': 1424,  'bw3': 1385,  'bw4': 1412,
    'bw5': 1386,  'bw6': 1394,  'bw7': 1408,  'bw8': 1413,
    'bw9': 1382,  'bw10': 1370, 'bw11': 1409, 'bwp': 1407,
    // XY Era
    'xy0': 1522,  'xy1': 1387,  'xy2': 1464,  'xy3': 1481,
    'xy4': 1494,  'xy5': 1509,  'xy6': 1534,  'xy7': 1576,
    'xy8': 1661,  'xy9': 1701,  'xy10': 1780, 'xy11': 1815,
    'xy12': 1842, 'xyp': 1451,  'g1': 1728,
    // Sun & Moon Era
    'sm1': 1863,  'sm2': 1919,  'sm3': 1957,  'sm35': 2054,
    'sm4': 2071,  'sm5': 2178,  'sm6': 2209,  'sm7': 2278,
    'sm75': 2295, 'sm8': 2328,  'sm9': 2377,  'sm10': 2420,
    'sm11': 2464, 'sm115': 2480, 'sm12': 2534, 'smp': 1861,
    'det1': 2409,
    // Sword & Shield Era
    'swsh1': 2585,  'swsh2': 2626,  'swsh3': 2675,  'swsh35': 2685,
    'swsh4': 2701,  'swsh45': 2754, 'swsh5': 2765,  'swsh6': 2807,
    'swsh7': 2848,  'swsh8': 2906,  'swsh9': 2948,  'swsh10': 3040,
    'swsh11': 3118, 'swsh11tg': 3172, 'swsh12': 3170,
    'swsh12pt5': 17688, 'swsh12pt5gg': 17689, 'swshp': 2545,
    'pgo': 3064,
    // Scarlet & Violet Era
    'sv1': 22873,   'sv2': 23120,   'sv3': 23228,   'sv3pt5': 23237,
    'sv4': 23286,   'sv4pt5': 23353, 'sv5': 23381,
    'sv8': 23651,   'sv8pt5': 23821, 'sv10': 24269,
    'svp': 22872,   'cel25': 2867,  'cel25c': 2931,
    // Mega Evolution Era
    'me2pt5': 24541, 'mep': 24451,
    // POP Series
    'pop2': 1447, 'pop3': 1442, 'pop4': 1452,
    'pop5': 1439, 'pop6': 1432, 'pop9': 1446,
    // McDonald's Promos
    'mcd14': 1692, 'mcd15': 1694, 'mcd16': 3087, 'mcd17': 2148,
    'mcd18': 2364, 'mcd19': 2555, 'mcd21': 2782, 'mcd22': 3150
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
