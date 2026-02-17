// Store Finder — find local TCG retailers via Google Places or Overpass/OSM fallback
const SF_CONFIG = {
    GOOGLE_API_KEY: '',  // Set to enable Google Places (restrict to your domain in Cloud Console)
    OVERPASS_ENDPOINT: 'https://overpass-api.de/api/interpreter',
    TILE_URL: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    TILE_ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    DEFAULT_CENTER: [39.5, -98.35],  // Continental US center
    DEFAULT_ZOOM: 4,
    SEARCH_ZOOM: 12,
    OVERPASS_SHOP_TAGS: ['games', 'hobby', 'comic', 'toys'],
};

let sfMap, sfMarkers = [], sfCurrentLat, sfCurrentLng, sfInitialized = false;
let sfLeafletLoaded = false, sfGoogleLoaded = false;
let sfCurrentRadiusKm = 25;

// --- Activation & lazy loading ---

function sfActivate() {
    if (sfInitialized) {
        // Re-entering tab — fix Leaflet sizing for hidden container
        if (sfMap) setTimeout(() => sfMap.invalidateSize(), 100);
        return;
    }
    sfInitialized = true;
    if (typeof L !== 'undefined') {
        sfLeafletLoaded = true;
        sfInitMap();
    } else {
        sfLoadLeaflet(() => sfInitMap());
    }
    if (SF_CONFIG.GOOGLE_API_KEY) sfLoadGoogleMaps();
}

function sfLoadLeaflet(cb) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.onload = () => { sfLeafletLoaded = true; cb(); };
    script.onerror = () => sfShowStatus('Failed to load map library. Please check your connection.', 'error');
    document.head.appendChild(script);
}

function sfLoadGoogleMaps() {
    if (sfGoogleLoaded || !SF_CONFIG.GOOGLE_API_KEY) return;
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(SF_CONFIG.GOOGLE_API_KEY) + '&libraries=places';
    script.onload = () => { sfGoogleLoaded = true; };
    document.head.appendChild(script);
}

// --- Map init ---

function sfInitMap() {
    if (!sfLeafletLoaded) return;
    sfMap = L.map('sfMap').setView(SF_CONFIG.DEFAULT_CENTER, SF_CONFIG.DEFAULT_ZOOM);
    L.tileLayer(SF_CONFIG.TILE_URL, {
        attribution: SF_CONFIG.TILE_ATTRIBUTION,
        maxZoom: 19,
    }).addTo(sfMap);
}

// --- Status messages ---

function sfShowStatus(msg, type) {
    const el = document.getElementById('sfStatusMsg');
    el.textContent = msg;
    el.className = 'sf-status-msg' + (type === 'error' ? ' sf-status-error' : ' sf-status-info');
    el.style.display = 'block';
}

function sfHideStatus() {
    document.getElementById('sfStatusMsg').style.display = 'none';
}

// --- Loading overlay ---

function sfShowLoading() {
    document.getElementById('sfLoadingOverlay').style.display = 'flex';
}

function sfHideLoading() {
    document.getElementById('sfLoadingOverlay').style.display = 'none';
}

// --- Geolocation ---

function sfUseGeolocation() {
    if (!navigator.geolocation) {
        sfShowStatus('Geolocation is not supported by your browser. Try entering an address instead.', 'error');
        return;
    }
    sfShowLoading();
    sfHideStatus();
    navigator.geolocation.getCurrentPosition(
        pos => sfSearchNear(pos.coords.latitude, pos.coords.longitude),
        err => {
            sfHideLoading();
            if (err.code === err.PERMISSION_DENIED) {
                sfShowStatus('Location access denied. Please enter an address or zip code instead.', 'error');
            } else {
                sfShowStatus('Could not determine your location. Try entering an address.', 'error');
            }
        },
        { timeout: 10000, maximumAge: 300000 }
    );
}

// --- Address search ---

function sfSearchAddress() {
    const input = document.getElementById('sfAddressInput').value.trim();
    if (!input) return;
    sfShowLoading();
    sfHideStatus();

    if (sfGoogleLoaded && window.google && google.maps && google.maps.Geocoder) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: input }, (results, status) => {
            if (status === 'OK' && results.length > 0) {
                const loc = results[0].geometry.location;
                sfSearchNear(loc.lat(), loc.lng());
            } else {
                // Fallback to Nominatim
                sfGeocodeNominatim(input);
            }
        });
    } else {
        sfGeocodeNominatim(input);
    }
}

function sfGeocodeNominatim(query) {
    const url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(query) + '&format=json&limit=1';
    fetch(url, { headers: { 'Accept': 'application/json' } })
        .then(r => r.json())
        .then(data => {
            if (data.length > 0) {
                sfSearchNear(parseFloat(data[0].lat), parseFloat(data[0].lon));
            } else {
                sfHideLoading();
                sfShowStatus('Could not find that location. Try a different address or zip code.', 'error');
            }
        })
        .catch(() => {
            sfHideLoading();
            sfShowStatus('Geocoding failed. Please try again.', 'error');
        });
}

// --- Radius change ---

function sfRadiusChanged() {
    sfCurrentRadiusKm = parseInt(document.getElementById('sfRadiusSelect').value, 10);
    if (sfCurrentLat != null && sfCurrentLng != null) {
        sfSearchNear(sfCurrentLat, sfCurrentLng);
    }
}

// --- Main search orchestrator ---

function sfSearchNear(lat, lng) {
    sfCurrentLat = lat;
    sfCurrentLng = lng;
    sfShowLoading();
    sfHideStatus();

    // Center map
    if (sfMap) {
        sfMap.setView([lat, lng], SF_CONFIG.SEARCH_ZOOM);
    }

    // Clear existing markers
    sfMarkers.forEach(m => sfMap && sfMap.removeLayer(m));
    sfMarkers = [];

    const radiusMeters = sfCurrentRadiusKm * 1000;

    if (SF_CONFIG.GOOGLE_API_KEY && sfGoogleLoaded && window.google && google.maps && google.maps.places) {
        sfSearchGooglePlaces(lat, lng, radiusMeters,
            stores => {
                if (stores.length > 0) {
                    sfDisplayResults(stores, lat, lng);
                } else {
                    // Google returned nothing — try Overpass
                    sfSearchOverpass(lat, lng, sfCurrentRadiusKm,
                        stores2 => sfDisplayResults(stores2, lat, lng, true),
                        () => sfDisplayResults([], lat, lng)
                    );
                }
            },
            () => {
                // Google failed — fallback to Overpass
                sfSearchOverpass(lat, lng, sfCurrentRadiusKm,
                    stores2 => sfDisplayResults(stores2, lat, lng, true),
                    () => sfDisplayResults([], lat, lng)
                );
            }
        );
    } else {
        // No Google API key — go straight to Overpass
        sfSearchOverpass(lat, lng, sfCurrentRadiusKm,
            stores => sfDisplayResults(stores, lat, lng, true),
            () => sfDisplayResults([], lat, lng)
        );
    }
}

// --- Google Places ---

function sfSearchGooglePlaces(lat, lng, radiusMeters, onSuccess, onError) {
    try {
        const service = new google.maps.places.PlacesService(document.createElement('div'));
        const request = {
            location: new google.maps.LatLng(lat, lng),
            radius: radiusMeters,
            keyword: 'trading card game pokemon',
            type: 'store',
        };
        service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                const stores = results.map(p => ({
                    id: p.place_id,
                    name: p.name,
                    address: p.vicinity || '',
                    lat: p.geometry.location.lat(),
                    lng: p.geometry.location.lng(),
                    distance: sfHaversineKm(lat, lng, p.geometry.location.lat(), p.geometry.location.lng()),
                    hours: p.opening_hours ? (p.opening_hours.isOpen() ? 'Open now' : 'Closed') : '',
                    source: 'google',
                }));
                onSuccess(stores);
            } else {
                onError();
            }
        });
    } catch (e) {
        onError();
    }
}

// --- Overpass / OpenStreetMap ---

function sfSearchOverpass(lat, lng, radiusKm, onSuccess, onError) {
    const r = radiusKm * 1000;
    const tagFilters = SF_CONFIG.OVERPASS_SHOP_TAGS.map(t => `node["shop"="${t}"](around:${r},${lat},${lng});`).join('');
    const query = `[out:json][timeout:15];(${tagFilters});out body;`;

    fetch(SF_CONFIG.OVERPASS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
    })
    .then(resp => {
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.json();
    })
    .then(data => {
        const seen = new Set();
        const stores = [];
        (data.elements || []).forEach(el => {
            const name = (el.tags && el.tags.name) || '';
            if (!name) return;
            // Deduplicate by name + rounded coords
            const dedupeKey = name.toLowerCase() + '|' + el.lat.toFixed(3) + '|' + el.lon.toFixed(3);
            if (seen.has(dedupeKey)) return;
            seen.add(dedupeKey);

            const addr = [el.tags['addr:street'], el.tags['addr:city'], el.tags['addr:state']].filter(Boolean).join(', ');
            stores.push({
                id: 'osm-' + el.id,
                name: name,
                address: addr || '',
                lat: el.lat,
                lng: el.lon,
                distance: sfHaversineKm(lat, lng, el.lat, el.lon),
                hours: (el.tags && el.tags.opening_hours) || '',
                source: 'osm',
            });
        });
        onSuccess(stores);
    })
    .catch(() => {
        onError();
    });
}

// --- Display results ---

function sfDisplayResults(stores, lat, lng, isOsm) {
    sfHideLoading();

    // Add user location marker
    if (sfMap && typeof L !== 'undefined') {
        const userMarker = L.circleMarker([lat, lng], {
            radius: 8, color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.8, weight: 2,
        }).addTo(sfMap).bindPopup('Your location');
        sfMarkers.push(userMarker);
    }

    // Sort by distance
    stores.sort((a, b) => a.distance - b.distance);

    // Filter to radius
    stores = stores.filter(s => s.distance <= sfCurrentRadiusKm);

    const header = document.getElementById('sfListHeader');
    if (stores.length === 0) {
        header.textContent = 'No TCG retailers found within ' + sfCurrentRadiusKm + ' km. Try a larger radius or different location.';
        document.getElementById('sfStoreList').innerHTML = '';
        return;
    }

    const sourceLabel = isOsm ? ' (via OpenStreetMap)' : '';
    header.textContent = stores.length + ' store' + (stores.length !== 1 ? 's' : '') + ' found within ' + sfCurrentRadiusKm + ' km' + sourceLabel;

    // Place markers
    stores.forEach((store, idx) => sfAddStoreMarker(store, idx));

    // Fit map bounds
    if (sfMap && sfMarkers.length > 1 && typeof L !== 'undefined') {
        const group = L.featureGroup(sfMarkers);
        sfMap.fitBounds(group.getBounds().pad(0.1));
    }

    sfRenderStoreList(stores);
}

function sfAddStoreMarker(store, idx) {
    if (!sfMap || typeof L === 'undefined') return;
    const marker = L.marker([store.lat, store.lng]).addTo(sfMap);
    const popupHtml = '<div class="sf-popup">' +
        '<div class="sf-popup-name">' + sfEscape(store.name) + '</div>' +
        (store.address ? '<div class="sf-popup-addr">' + sfEscape(store.address) + '</div>' : '') +
        '<div class="sf-popup-dist">' + store.distance.toFixed(1) + ' km away</div>' +
        (store.hours ? '<div class="sf-popup-hours">' + sfEscape(store.hours) + '</div>' : '') +
        '</div>';
    marker.bindPopup(popupHtml);
    sfMarkers.push(marker);
}

function sfRenderStoreList(stores) {
    const list = document.getElementById('sfStoreList');
    list.innerHTML = stores.map((store, idx) =>
        '<div class="sf-store-item" onclick="sfFocusMarker(' + (idx + 1) + ')">' +
            '<div class="sf-store-row">' +
                '<div class="sf-store-name">' + sfEscape(store.name) + '</div>' +
                '<div class="sf-store-dist">' + store.distance.toFixed(1) + ' km</div>' +
            '</div>' +
            (store.address ? '<div class="sf-store-addr">' + sfEscape(store.address) + '</div>' : '') +
            (store.hours ? '<div class="sf-store-hours">' + sfEscape(store.hours) + '</div>' : '') +
        '</div>'
    ).join('');
}

function sfFocusMarker(idx) {
    if (sfMarkers[idx]) {
        const marker = sfMarkers[idx];
        sfMap.setView(marker.getLatLng(), 15);
        marker.openPopup();
    }
}

// --- Utilities ---

function sfHaversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function sfEscape(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
