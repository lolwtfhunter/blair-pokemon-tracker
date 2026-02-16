#!/usr/bin/env node
// Generate Pokemon TCG set data JSON files from pokemontcg.io API
// Usage: node scripts/generate-set-data.js [--force] [--set setKey]
//   --force: Overwrite existing files
//   --set: Only generate a specific set

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'pokemon', 'official-sets');

// Rate limit: pokemontcg.io allows 20,000 requests/day without API key
const DELAY_MS = 1000;

// Master list of all sets: setKey -> { apiSetId, blockCode, blockName, displayName, hasFirstEdition, singleVariantOnly }
const SET_DEFINITIONS = {
    // Base Set era
    'base-set':            { apiSetId: 'base1', blockCode: 'base', blockName: 'Base Set', hasFirstEdition: true },
    'jungle':              { apiSetId: 'base2', blockCode: 'base', blockName: 'Base Set', hasFirstEdition: true },
    'fossil':              { apiSetId: 'base3', blockCode: 'base', blockName: 'Base Set', hasFirstEdition: true },
    'base-set-2':          { apiSetId: 'base4', blockCode: 'base', blockName: 'Base Set' },
    'team-rocket':         { apiSetId: 'base5', blockCode: 'base', blockName: 'Base Set', hasFirstEdition: true },
    'legendary-collection':{ apiSetId: 'base6', blockCode: 'lc', blockName: 'Legendary Collection', singleVariantOnly: true },
    // Gym era
    'gym-heroes':          { apiSetId: 'gym1', blockCode: 'gym', blockName: 'Gym', hasFirstEdition: true },
    'gym-challenge':       { apiSetId: 'gym2', blockCode: 'gym', blockName: 'Gym', hasFirstEdition: true },
    // Neo era
    'neo-genesis':         { apiSetId: 'neo1', blockCode: 'neo', blockName: 'Neo', hasFirstEdition: true },
    'neo-discovery':       { apiSetId: 'neo2', blockCode: 'neo', blockName: 'Neo', hasFirstEdition: true },
    'neo-revelation':      { apiSetId: 'neo3', blockCode: 'neo', blockName: 'Neo', hasFirstEdition: true },
    'neo-destiny':         { apiSetId: 'neo4', blockCode: 'neo', blockName: 'Neo', hasFirstEdition: true },
    'southern-islands':    { apiSetId: 'si1', blockCode: 'neo', blockName: 'Neo', singleVariantOnly: true },
    // e-Card era
    'expedition':          { apiSetId: 'ecard1', blockCode: 'ecard', blockName: 'e-Card' },
    'aquapolis':           { apiSetId: 'ecard2', blockCode: 'ecard', blockName: 'e-Card' },
    'skyridge':            { apiSetId: 'ecard3', blockCode: 'ecard', blockName: 'e-Card' },
    // EX era
    'ruby-sapphire':       { apiSetId: 'ex1', blockCode: 'ex', blockName: 'EX' },
    'sandstorm':           { apiSetId: 'ex2', blockCode: 'ex', blockName: 'EX' },
    'dragon':              { apiSetId: 'ex3', blockCode: 'ex', blockName: 'EX' },
    'team-magma-vs-team-aqua': { apiSetId: 'ex4', blockCode: 'ex', blockName: 'EX' },
    'hidden-legends':      { apiSetId: 'ex5', blockCode: 'ex', blockName: 'EX' },
    'firered-leafgreen':   { apiSetId: 'ex6', blockCode: 'ex', blockName: 'EX' },
    'team-rocket-returns': { apiSetId: 'ex7', blockCode: 'ex', blockName: 'EX' },
    'deoxys':              { apiSetId: 'ex8', blockCode: 'ex', blockName: 'EX' },
    'emerald':             { apiSetId: 'ex9', blockCode: 'ex', blockName: 'EX' },
    'unseen-forces':       { apiSetId: 'ex10', blockCode: 'ex', blockName: 'EX' },
    'delta-species':       { apiSetId: 'ex11', blockCode: 'ex', blockName: 'EX' },
    'legend-maker':        { apiSetId: 'ex12', blockCode: 'ex', blockName: 'EX' },
    'holon-phantoms':      { apiSetId: 'ex13', blockCode: 'ex', blockName: 'EX' },
    'crystal-guardians':   { apiSetId: 'ex14', blockCode: 'ex', blockName: 'EX' },
    'dragon-frontiers':    { apiSetId: 'ex15', blockCode: 'ex', blockName: 'EX' },
    'power-keepers':       { apiSetId: 'ex16', blockCode: 'ex', blockName: 'EX' },
    'nintendo-promos':     { apiSetId: 'np', blockCode: 'ex', blockName: 'EX', singleVariantOnly: true },
    // Diamond & Pearl era
    'diamond-pearl':       { apiSetId: 'dp1', blockCode: 'dp', blockName: 'Diamond & Pearl' },
    'mysterious-treasures': { apiSetId: 'dp2', blockCode: 'dp', blockName: 'Diamond & Pearl' },
    'secret-wonders':      { apiSetId: 'dp3', blockCode: 'dp', blockName: 'Diamond & Pearl' },
    'great-encounters':    { apiSetId: 'dp4', blockCode: 'dp', blockName: 'Diamond & Pearl' },
    'majestic-dawn':       { apiSetId: 'dp5', blockCode: 'dp', blockName: 'Diamond & Pearl' },
    'legends-awakened':    { apiSetId: 'dp6', blockCode: 'dp', blockName: 'Diamond & Pearl' },
    'stormfront':          { apiSetId: 'dp7', blockCode: 'dp', blockName: 'Diamond & Pearl' },
    'dp-promos':           { apiSetId: 'dpp', blockCode: 'dp', blockName: 'Diamond & Pearl', singleVariantOnly: true },
    // Platinum era
    'platinum':            { apiSetId: 'pl1', blockCode: 'pl', blockName: 'Platinum' },
    'rising-rivals':       { apiSetId: 'pl2', blockCode: 'pl', blockName: 'Platinum' },
    'supreme-victors':     { apiSetId: 'pl3', blockCode: 'pl', blockName: 'Platinum' },
    'arceus':              { apiSetId: 'pl4', blockCode: 'pl', blockName: 'Platinum' },
    'rumble':              { apiSetId: 'ru1', blockCode: 'pl', blockName: 'Platinum', singleVariantOnly: true },
    // HeartGold SoulSilver era
    'heartgold-soulsilver':{ apiSetId: 'hgss1', blockCode: 'hgss', blockName: 'HeartGold SoulSilver' },
    'unleashed':           { apiSetId: 'hgss2', blockCode: 'hgss', blockName: 'HeartGold SoulSilver' },
    'undaunted':           { apiSetId: 'hgss3', blockCode: 'hgss', blockName: 'HeartGold SoulSilver' },
    'triumphant':          { apiSetId: 'hgss4', blockCode: 'hgss', blockName: 'HeartGold SoulSilver' },
    'hgss-promos':         { apiSetId: 'hsp', blockCode: 'hgss', blockName: 'HeartGold SoulSilver', singleVariantOnly: true },
    'call-of-legends':     { apiSetId: 'col1', blockCode: 'hgss', blockName: 'HeartGold SoulSilver' },
    // Black & White era
    'black-white':         { apiSetId: 'bw1', blockCode: 'bw', blockName: 'Black & White' },
    'emerging-powers':     { apiSetId: 'bw2', blockCode: 'bw', blockName: 'Black & White' },
    'noble-victories':     { apiSetId: 'bw3', blockCode: 'bw', blockName: 'Black & White' },
    'next-destinies':      { apiSetId: 'bw4', blockCode: 'bw', blockName: 'Black & White' },
    'dark-explorers':      { apiSetId: 'bw5', blockCode: 'bw', blockName: 'Black & White' },
    'dragons-exalted':     { apiSetId: 'bw6', blockCode: 'bw', blockName: 'Black & White' },
    'dragon-vault':        { apiSetId: 'dv1', blockCode: 'bw', blockName: 'Black & White', singleVariantOnly: true },
    'boundaries-crossed':  { apiSetId: 'bw7', blockCode: 'bw', blockName: 'Black & White' },
    'plasma-storm':        { apiSetId: 'bw8', blockCode: 'bw', blockName: 'Black & White' },
    'plasma-freeze':       { apiSetId: 'bw9', blockCode: 'bw', blockName: 'Black & White' },
    'plasma-blast':        { apiSetId: 'bw10', blockCode: 'bw', blockName: 'Black & White' },
    'legendary-treasures': { apiSetId: 'bw11', blockCode: 'bw', blockName: 'Black & White' },
    'bw-promos':           { apiSetId: 'bwp', blockCode: 'bw', blockName: 'Black & White', singleVariantOnly: true },
    // XY era
    'kalos-starter-set':   { apiSetId: 'xy0', blockCode: 'xy', blockName: 'XY', singleVariantOnly: true },
    'xy':                  { apiSetId: 'xy1', blockCode: 'xy', blockName: 'XY' },
    'flashfire':           { apiSetId: 'xy2', blockCode: 'xy', blockName: 'XY' },
    'furious-fists':       { apiSetId: 'xy3', blockCode: 'xy', blockName: 'XY' },
    'phantom-forces':      { apiSetId: 'xy4', blockCode: 'xy', blockName: 'XY' },
    'primal-clash':        { apiSetId: 'xy5', blockCode: 'xy', blockName: 'XY' },
    'roaring-skies':       { apiSetId: 'xy6', blockCode: 'xy', blockName: 'XY' },
    'ancient-origins':     { apiSetId: 'xy7', blockCode: 'xy', blockName: 'XY' },
    'breakthrough':        { apiSetId: 'xy8', blockCode: 'xy', blockName: 'XY' },
    'breakpoint':          { apiSetId: 'xy9', blockCode: 'xy', blockName: 'XY' },
    'fates-collide':       { apiSetId: 'xy10', blockCode: 'xy', blockName: 'XY' },
    'steam-siege':         { apiSetId: 'xy11', blockCode: 'xy', blockName: 'XY' },
    'evolutions':          { apiSetId: 'xy12', blockCode: 'xy', blockName: 'XY' },
    'generations':         { apiSetId: 'g1', blockCode: 'xy', blockName: 'XY' },
    'xy-promos':           { apiSetId: 'xyp', blockCode: 'xy', blockName: 'XY', singleVariantOnly: true },
    // Sun & Moon era
    'sun-moon':            { apiSetId: 'sm1', blockCode: 'sm', blockName: 'Sun & Moon' },
    'guardians-rising':    { apiSetId: 'sm2', blockCode: 'sm', blockName: 'Sun & Moon' },
    'burning-shadows':     { apiSetId: 'sm3', blockCode: 'sm', blockName: 'Sun & Moon' },
    'shining-legends':     { apiSetId: 'sm35', blockCode: 'sm', blockName: 'Sun & Moon' },
    'crimson-invasion':    { apiSetId: 'sm4', blockCode: 'sm', blockName: 'Sun & Moon' },
    'ultra-prism':         { apiSetId: 'sm5', blockCode: 'sm', blockName: 'Sun & Moon' },
    'forbidden-light':     { apiSetId: 'sm6', blockCode: 'sm', blockName: 'Sun & Moon' },
    'celestial-storm':     { apiSetId: 'sm7', blockCode: 'sm', blockName: 'Sun & Moon' },
    'dragon-majesty':      { apiSetId: 'sm75', blockCode: 'sm', blockName: 'Sun & Moon' },
    'lost-thunder':        { apiSetId: 'sm8', blockCode: 'sm', blockName: 'Sun & Moon' },
    'team-up':             { apiSetId: 'sm9', blockCode: 'sm', blockName: 'Sun & Moon' },
    'unbroken-bonds':      { apiSetId: 'sm10', blockCode: 'sm', blockName: 'Sun & Moon' },
    'unified-minds':       { apiSetId: 'sm11', blockCode: 'sm', blockName: 'Sun & Moon' },
    'hidden-fates':        { apiSetId: 'sm115', blockCode: 'sm', blockName: 'Sun & Moon' },
    'cosmic-eclipse':      { apiSetId: 'sm12', blockCode: 'sm', blockName: 'Sun & Moon' },
    'detective-pikachu':   { apiSetId: 'det1', blockCode: 'sm', blockName: 'Sun & Moon', singleVariantOnly: true },
    'sm-promos':           { apiSetId: 'smp', blockCode: 'sm', blockName: 'Sun & Moon', singleVariantOnly: true },
    // Sword & Shield era
    'sword-shield':        { apiSetId: 'swsh1', blockCode: 'swsh', blockName: 'Sword & Shield' },
    'rebel-clash':         { apiSetId: 'swsh2', blockCode: 'swsh', blockName: 'Sword & Shield' },
    'darkness-ablaze':     { apiSetId: 'swsh3', blockCode: 'swsh', blockName: 'Sword & Shield' },
    'champions-path':      { apiSetId: 'swsh35', blockCode: 'swsh', blockName: 'Sword & Shield' },
    'vivid-voltage':       { apiSetId: 'swsh4', blockCode: 'swsh', blockName: 'Sword & Shield' },
    'shining-fates':       { apiSetId: 'swsh45', blockCode: 'swsh', blockName: 'Sword & Shield' },
    'battle-styles':       { apiSetId: 'swsh5', blockCode: 'swsh', blockName: 'Sword & Shield' },
    'chilling-reign':      { apiSetId: 'swsh6', blockCode: 'swsh', blockName: 'Sword & Shield' },
    'evolving-skies':      { apiSetId: 'swsh7', blockCode: 'swsh', blockName: 'Sword & Shield' },
    'fusion-strike':       { apiSetId: 'swsh8', blockCode: 'swsh', blockName: 'Sword & Shield' },
    'brilliant-stars':     { apiSetId: 'swsh9', blockCode: 'swsh', blockName: 'Sword & Shield' },
    'astral-radiance':     { apiSetId: 'swsh10', blockCode: 'swsh', blockName: 'Sword & Shield' },
    'lost-origin':         { apiSetId: 'swsh11', blockCode: 'swsh', blockName: 'Sword & Shield' },
    'silver-tempest':      { apiSetId: 'swsh12', blockCode: 'swsh', blockName: 'Sword & Shield' },
    'crown-zenith':        { apiSetId: 'swsh12pt5', blockCode: 'swsh', blockName: 'Sword & Shield' },
    'pokemon-go':          { apiSetId: 'pgo', blockCode: 'swsh', blockName: 'Sword & Shield' },
    'celebrations':        { apiSetId: 'cel25', blockCode: 'swsh', blockName: 'Sword & Shield', singleVariantOnly: true },
    'swsh-promos':         { apiSetId: 'swshp', blockCode: 'swsh', blockName: 'Sword & Shield', singleVariantOnly: true },
    // Scarlet & Violet era
    'scarlet-violet':      { apiSetId: 'sv1', blockCode: 'sv', blockName: 'Scarlet & Violet' },
    'paldea-evolved':      { apiSetId: 'sv2', blockCode: 'sv', blockName: 'Scarlet & Violet' },
    'obsidian-flames':     { apiSetId: 'sv3', blockCode: 'sv', blockName: 'Scarlet & Violet' },
    '151':                 { apiSetId: 'sv3pt5', blockCode: 'sv', blockName: 'Scarlet & Violet' },
    'paradox-rift':        { apiSetId: 'sv4', blockCode: 'sv', blockName: 'Scarlet & Violet' },
    'paldean-fates':       { apiSetId: 'sv4pt5', blockCode: 'sv', blockName: 'Scarlet & Violet' },
    'temporal-forces':     { apiSetId: 'sv5', blockCode: 'sv', blockName: 'Scarlet & Violet' },
    'twilight-masquerade': { apiSetId: 'sv6', blockCode: 'sv', blockName: 'Scarlet & Violet' },
    'stellar-crown':       { apiSetId: 'sv7', blockCode: 'sv', blockName: 'Scarlet & Violet' },
    'surging-sparks':      { apiSetId: 'sv8', blockCode: 'sv', blockName: 'Scarlet & Violet' },
    'prismatic-evolutions':{ apiSetId: 'sv8pt5', blockCode: 'sv', blockName: 'Scarlet & Violet' },
    'journey-together':    { apiSetId: 'sv9', blockCode: 'sv', blockName: 'Scarlet & Violet' },
    'destined-rivals':     { apiSetId: 'sv10', blockCode: 'sv', blockName: 'Scarlet & Violet' },
    'sv-promos':           { apiSetId: 'svp', blockCode: 'sv', blockName: 'Scarlet & Violet', singleVariantOnly: true },
    // Mega Evolution era
    'mega-evolution':      { apiSetId: 'me1', blockCode: 'me', blockName: 'Mega Evolution' },
    'phantasmal-flames':   { apiSetId: 'me2', blockCode: 'me', blockName: 'Mega Evolution' },
    'ascended-heroes':     { apiSetId: 'me2pt5', blockCode: 'me', blockName: 'Mega Evolution' },
    'me-promos':           { apiSetId: 'mep', blockCode: 'me', blockName: 'Mega Evolution', singleVariantOnly: true },
};

// Rarity mapping: pokemontcg.io rarity string -> our app rarity slug
const RARITY_MAP = {
    'Common': 'common',
    'Uncommon': 'uncommon',
    'Rare': 'rare',
    'Rare Holo': 'rare-holo',
    'Rare Holo EX': 'ex',
    'Rare Holo GX': 'rare-holo-gx',
    'Rare Holo V': 'ultra-rare',
    'Rare Holo VMAX': 'ultra-rare',
    'Rare Holo VSTAR': 'ultra-rare',
    'Rare Ultra': 'ultra-rare',
    'Rare Secret': 'secret',
    'Rare Rainbow': 'hyper-rare',
    'Rare Shining': 'shiny-rare',
    'Rare Shiny': 'shiny-rare',
    'Rare Shiny GX': 'shiny-rare',
    'Rare ACE': 'ace-spec',
    'Rare BREAK': 'rare',
    'Rare Prime': 'rare',
    'Rare Prism Star': 'rare',
    'Amazing Rare': 'amazing-rare',
    'LEGEND': 'rare',
    'Radiant Rare': 'radiant',
    'Promo': 'promo',
    // SV-era rarities
    'Double Rare': 'double-rare',
    'Illustration Rare': 'illustration-rare',
    'Special Illustration Rare': 'special-illustration-rare',
    'Ultra Rare': 'ultra-rare',
    'Hyper Rare': 'hyper-rare',
    'Trainer Gallery Rare Holo': 'illustration-rare',
    'ACE SPEC Rare': 'ace-spec',
    'Shiny Rare': 'shiny-rare',
    'Shiny Ultra Rare': 'shiny-rare',
    // Classic era
    'Rare Holo EX (Classic)': 'rare-holo',
    // Default fallback handled in code
};

// Supertype mapping
function getCardType(card) {
    const st = (card.supertype || '').toLowerCase();
    if (st === 'trainer' || st === 'supporter' || st === 'stadium' || st === 'item') return 'trainer';
    if (st === 'energy') return 'energy';
    return 'pokemon';
}

// Data sources:
// Primary: GitHub PokemonTCG/pokemon-tcg-data (raw JSON)
// Fallback: pokemontcg.io API v2
const GITHUB_BASE = 'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master';

// Fetch JSON from URL using native fetch (Node 18+)
async function fetchJSON(url, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': 'BlairTCGTracker/1.0' }
            });

            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get('retry-after') || '5') * 1000;
                console.log(`  Rate limited, waiting ${retryAfter / 1000}s...`);
                await sleep(retryAfter);
                continue;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} for ${url}`);
            }

            return await response.json();
        } catch (e) {
            if (attempt === retries) throw e;
            console.log(`  Retry ${attempt}/${retries} for ${url}: ${e.message}`);
            await sleep(2000 * attempt);
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateSet(setKey, def, force) {
    const outputPath = path.join(OUTPUT_DIR, `${setKey}.json`);

    if (!force && fs.existsSync(outputPath)) {
        console.log(`  SKIP ${setKey} (already exists)`);
        return true;
    }

    console.log(`  Fetching ${setKey} (${def.apiSetId})...`);

    // Try GitHub data first, then API
    let setMeta = null;
    let allCards = [];

    try {
        // GitHub raw data: sets in sets/en.json, cards in cards/en/{setId}.json
        if (!global._setsCache) {
            const setsUrl = `${GITHUB_BASE}/sets/en.json`;
            global._setsCache = await fetchJSON(setsUrl);
            console.log(`  Cached ${global._setsCache.length} sets from GitHub`);
        }
        setMeta = global._setsCache.find(s => s.id === def.apiSetId);

        if (setMeta) {
            const cardsUrl = `${GITHUB_BASE}/cards/en/${def.apiSetId}.json`;
            allCards = await fetchJSON(cardsUrl);
        }
    } catch (e) {
        console.log(`  GitHub fetch failed, trying API: ${e.message}`);
    }

    if (!setMeta) {
        // Fallback to pokemontcg.io API
        try {
            const setUrl = `https://api.pokemontcg.io/v2/sets/${def.apiSetId}`;
            const setResponse = await fetchJSON(setUrl);
            setMeta = setResponse.data;
            await sleep(DELAY_MS);

            let page = 1;
            while (true) {
                const cardsUrl = `https://api.pokemontcg.io/v2/cards?q=set.id:${def.apiSetId}&pageSize=250&page=${page}&orderBy=number`;
                const cardsResponse = await fetchJSON(cardsUrl);
                if (!cardsResponse.data || cardsResponse.data.length === 0) break;
                allCards = allCards.concat(cardsResponse.data);
                if (allCards.length >= cardsResponse.totalCount) break;
                page++;
                await sleep(DELAY_MS);
            }
        } catch (e2) {
            console.error(`  ERROR: Both GitHub and API failed for ${def.apiSetId}: ${e2.message}`);
            return false;
        }
    }

    if (!setMeta) {
        console.error(`  ERROR: No set data for ${def.apiSetId}`);
        return false;
    }

    console.log(`  Got ${allCards.length} cards for ${setKey}`);

    // Build cards object
    const cards = {};
    allCards.forEach(card => {
        // Parse card number - handle various formats (e.g., "1", "H1", "RC1")
        const numStr = card.number || '';
        const numParsed = parseInt(numStr);
        const cardNumber = isNaN(numParsed) ? numStr : numParsed;

        const apiRarity = card.rarity || 'Common';
        const rarity = RARITY_MAP[apiRarity] || apiRarity.toLowerCase().replace(/\s+/g, '-');

        const cardObj = {
            name: card.name,
            rarity: rarity,
            type: getCardType(card)
        };

        cards[cardNumber] = cardObj;
    });

    // Determine release date (API uses YYYY/MM/DD, we use YYYY-MM-DD)
    const releaseDate = (setMeta.releaseDate || '').replace(/\//g, '-');

    // Build output JSON
    const output = {
        version: '3.0.0',
        lastUpdated: new Date().toISOString().split('T')[0],
        setKey: setKey,
        name: setMeta.name,
        displayName: def.displayName || setMeta.name,
        totalCards: setMeta.total || allCards.length,
        mainSet: setMeta.printedTotal || setMeta.total || allCards.length,
        setCode: def.apiSetId,
        releaseDate: releaseDate,
        block: def.blockName,
        blockCode: def.blockCode,
        hasPokeBallVariant: false,
        hasMasterBallVariant: false
    };

    if (def.hasFirstEdition) output.hasFirstEdition = true;
    if (def.singleVariantOnly) output.singleVariantOnly = true;

    output.cards = cards;

    // Write JSON file
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
    console.log(`  WROTE ${setKey}.json (${Object.keys(cards).length} cards)`);

    return true;
}

async function main() {
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const setIndex = args.indexOf('--set');
    const specificSet = setIndex !== -1 ? args[setIndex + 1] : null;

    // Ensure output directory exists
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const setKeys = specificSet ? [specificSet] : Object.keys(SET_DEFINITIONS);

    console.log(`Generating ${setKeys.length} set(s)...`);
    console.log(`Force overwrite: ${force}`);
    console.log('');

    let success = 0;
    let skipped = 0;
    let failed = 0;

    for (const setKey of setKeys) {
        const def = SET_DEFINITIONS[setKey];
        if (!def) {
            console.error(`Unknown set key: ${setKey}`);
            failed++;
            continue;
        }

        try {
            const result = await generateSet(setKey, def, force);
            if (result) {
                success++;
            } else {
                failed++;
            }
        } catch (err) {
            console.error(`  ERROR generating ${setKey}: ${err.message}`);
            failed++;
        }

        // Rate limiting between sets
        if (!specificSet) await sleep(DELAY_MS);
    }

    console.log('');
    console.log(`Done! Generated: ${success}, Failed: ${failed}`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
