// Firebase initialization and real-time sync

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDUZwwGKYfRzvj13bKTkYecIH19ge8oWZw",
    authDomain: "blair-pokemon-tracker.firebaseapp.com",
    databaseURL: "https://blair-pokemon-tracker-default-rtdb.firebaseio.com",
    projectId: "blair-pokemon-tracker",
    storageBucket: "blair-pokemon-tracker.firebasestorage.app",
    messagingSenderId: "169585887164",
    appId: "1:169585887164:web:16d3ff0705153848df8db9"
};

// Initialize Firebase app (safe to call multiple times)
function ensureFirebaseApp() {
    if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
    }
}

// Update sync status
function updateSyncStatus(text, status) {
    document.getElementById('syncStatus').textContent = text;
    const indicator = document.getElementById('syncIndicator');
    indicator.className = 'sync-indicator ' + status;
}

// Detach current Firebase listener and reset ref
function detachFirebaseListener() {
    if (firebase_ref) {
        firebase_ref.off();
        firebase_ref = null;
    }
}

// Initialize Firebase and set up real-time sync on a collection
function initializeFirebase(collectionId) {
    try {
        ensureFirebaseApp();
        firebase_db = firebase.database();

        // Detach any existing listener before attaching new one
        detachFirebaseListener();

        firebase_ref = firebase_db.ref('collections/' + collectionId + '/data');

        // Update collection name in header
        firebase_db.ref('collections/' + collectionId + '/meta/name').once('value').then((snap) => {
            const name = snap.val();
            if (name && typeof updateCollectionNameHeader === 'function') {
                updateCollectionNameHeader(name);
            }
        });

        updateSyncStatus('Connecting...', 'syncing');

        firebase_ref.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                collectionProgress = data;
                localStorage.setItem('pokemonVariantProgress', JSON.stringify(data));

                // Re-render all sets with synced data
                Object.keys(cardSets).forEach(setKey => {
                    renderCards(setKey);
                });
                updateSetButtonProgress();
                Object.keys(customCardSets).forEach(setKey => {
                    renderCustomCards(setKey);
                });
                updateCustomSetButtonProgress();

                updateSyncStatus('Synced', 'synced');
            } else {
                // No data yet, upload current progress and render cards
                firebase_ref.set(collectionProgress);

                // Ensure cards are rendered even if no Firebase data
                Object.keys(cardSets).forEach(setKey => {
                    renderCards(setKey);
                });
                updateSetButtonProgress();
                Object.keys(customCardSets).forEach(setKey => {
                    renderCustomCards(setKey);
                });
                updateCustomSetButtonProgress();

                updateSyncStatus('Synced', 'synced');
            }
        });

    } catch (error) {
        console.error('Firebase error:', error);
        updateSyncStatus('Offline', 'error');

        // CRITICAL: Render cards even if Firebase fails
        Object.keys(cardSets).forEach(setKey => {
            renderCards(setKey);
        });
        updateSetButtonProgress();
        Object.keys(customCardSets).forEach(setKey => {
            renderCustomCards(setKey);
        });
        updateCustomSetButtonProgress();
    }
}
