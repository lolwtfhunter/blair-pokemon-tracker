// Firebase initialization and real-time sync

// Update sync status
function updateSyncStatus(text, status) {
    document.getElementById('syncStatus').textContent = text;
    const indicator = document.getElementById('syncIndicator');
    indicator.className = 'sync-indicator ' + status;
}

// Show sync code modal
function showSyncModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-title">🔐 Enter Sync Code</div>
            <div class="modal-text">Enter your family sync code to enable cloud synchronization across devices.</div>
            <input type="text" class="modal-input" id="syncCodeInput" placeholder="Enter sync code..." autocomplete="off">
            <div class="error-text" id="syncError"></div>
            <div class="modal-buttons">
                <button class="modal-btn primary" onclick="verifySyncCode()">Sync</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('syncCodeInput').focus();
    document.getElementById('syncCodeInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') verifySyncCode();
    });
}

// Verify sync code
window.verifySyncCode = function() {
    console.log('verifySyncCode called');
    const input = document.getElementById('syncCodeInput');
    const code = input.value.trim();

    console.log(`Code entered: "${code}"`);
    console.log(`Expected: "${SYNC_CODE}"`);

    if (code === SYNC_CODE) {
        console.log('✓ Code valid!');
        localStorage.setItem(SYNC_CODE_KEY, code);
        document.querySelector('.modal').remove();

        // Render cards immediately BEFORE Firebase
        console.log('Rendering cards now...');
        Object.keys(cardSets).forEach(setKey => {
            console.log(`Calling renderCards(${setKey})`);
            renderCards(setKey);
        });
        updateSetButtonProgress();

        console.log('Starting Firebase...');
        // Then initialize Firebase
        initializeFirebase();
    } else {
        console.log('✗ Invalid code');
        document.getElementById('syncError').textContent = 'Invalid sync code. Please try again.';
        input.value = '';
    }
};

// Initialize Firebase
function initializeFirebase() {
    try {
        const config = {
            apiKey: "AIzaSyDUZwwGKYfRzvj13bKTkYecIH19ge8oWZw",
            authDomain: "blair-pokemon-tracker.firebaseapp.com",
            databaseURL: "https://blair-pokemon-tracker-default-rtdb.firebaseio.com",
            projectId: "blair-pokemon-tracker",
            storageBucket: "blair-pokemon-tracker.firebasestorage.app",
            messagingSenderId: "169585887164",
            appId: "1:169585887164:web:16d3ff0705153848df8db9"
        };

        if (!firebase.apps.length) {
            firebase.initializeApp(config);
        }

        firebase_db = firebase.database();
        firebase_ref = firebase_db.ref('collections/' + SYNC_CODE);

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

                updateSyncStatus('Synced ✓', 'synced');
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

                updateSyncStatus('Synced ✓', 'synced');
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
